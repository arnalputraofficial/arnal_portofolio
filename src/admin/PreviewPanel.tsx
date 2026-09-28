/**
 * Ratio preview for the admin panel.
 *
 * An admin picks a page, a target aspect ratio, and an orientation. The page
 * renders inside a frame locked to that ratio. Two checks follow, and both
 * report what was actually measured rather than a promise:
 *
 *  1. Distortion: the rendered box is measured. If its ratio drifts from the
 *     requested one by more than a hundredth, the frame is reported as
 *     stretching its content.
 *  2. Horizontal overflow: the frame is a same-origin iframe, so the probe can
 *     read the real document inside it. It walks that document for elements
 *     wider than the frame's viewport, which is the exact symptom the visitor
 *     would hit, and names the widest offenders instead of just summing them.
 *
 * Limits stated in the panel, not hidden: the probe needs the iframe to be
 * same-origin, so it reports "blocked" when the host headers deny framing, and
 * it cannot see cross-origin frames or canvas contents. A phone ratio shown in
 * a desktop browser also does not reproduce the real device's font rendering,
 * `dvh` behaviour, or touch target sizing.
 */
import * as React from "react";
import {
  Check,
  CircleAlert,
  Loader2,
  Monitor,
  RotateCcw,
  Smartphone,
  Tablet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PAGE_META } from "@/content/registry";
import {
  ASPECT_RATIOS,
  DEVICE_CLASS_LABEL,
  DEVICE_CLASS_ORDER,
  ORIENTATION_LABEL,
  checkDistortion,
  frameSize,
  frameValue,
  loadPreferredPage,
  loadPreferredRatio,
  readDevice,
  savePreferredPage,
  savePreferredRatio,
  type AspectRatioOption,
  type DeviceClass,
  type DeviceReading,
  type Orientation,
} from "@/lib/aspectRatios";
import { cn } from "@/lib/utils";

interface OverflowHit {
  /** tag name plus id/class, so the admin can find the element in the DOM */
  selector: string;
  /** scrollWidth of the element in CSS pixels inside the frame */
  scrollWidth: number;
}

interface ProbeResult {
  status: "ok" | "overflow" | "blocked";
  frameWidth: number;
  frameHeight: number;
  documentWidth: number;
  /** how far past the frame's viewport the document scrolls */
  surplus: number;
  hits: OverflowHit[];
  message: string;
}

const DEVICE_CLASS_ICON: Record<DeviceClass, typeof Smartphone> = {
  smartphone: Smartphone,
  tablet: Tablet,
};

const ORIENTATIONS: Orientation[] = ["portrait", "landscape"];

/** Which page the frame opens on, de-duplicated because two pages share "/". */
const PREVIEW_PAGES = PAGE_META.filter(
  (page, index, all) => all.findIndex((other) => other.route === page.route) === index,
);

const MAX_FRAME_HEIGHT = 760;

function describeElement(element: Element): string {
  // The element lives in the framed document, so compare against its own
  // document, not the admin document this module runs in.
  const owner = element.ownerDocument;
  if (owner && element === owner.documentElement) return "html";
  if (owner && element === owner.body) return "body";
  const id = element.id ? `#${element.id}` : "";
  const firstClass = typeof element.className === "string" ? element.className.trim().split(/\s+/)[0] : "";
  const cls = firstClass ? `.${firstClass}` : "";
  const label = element.tagName.toLowerCase() + id + cls;
  return label || element.tagName.toLowerCase();
}

export default function PreviewPanel() {
  const [reading, setReading] = React.useState<DeviceReading | null>(null);
  const [ratio, setRatio] = React.useState<AspectRatioOption | null>(null);
  const [orientation, setOrientation] = React.useState<Orientation>("portrait");
  const [pageRoute, setPageRoute] = React.useState<string>("/");
  const [frameWidth, setFrameWidth] = React.useState(0);
  const [probe, setProbe] = React.useState<ProbeResult | null>(null);
  const [probeError, setProbeError] = React.useState<string | null>(null);

  const frameRef = React.useRef<HTMLDivElement | null>(null);
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);

  // Read the device once, then keep the stored choices. localStorage is the
  // "consistent for the rest of the session and later visits" requirement.
  React.useEffect(() => {
    const device = readDevice();
    setReading(device);
    const preferred = loadPreferredRatio(device);
    setRatio(preferred.option);
    setOrientation(preferred.orientation);
    const storedPage = loadPreferredPage();
    const pageExists = storedPage ? PREVIEW_PAGES.some((page) => page.route === storedPage) : false;
    setPageRoute(pageExists && storedPage ? storedPage : PREVIEW_PAGES[0].route);
  }, []);

  const aspect = ratio ? frameValue(ratio, orientation) : null;
  const frame = aspect ? frameSize(aspect, frameWidth || 1, MAX_FRAME_HEIGHT) : { width: 0, height: 0 };
  const distortion =
    ratio && aspect ? checkDistortion({ option: ratio, orientation, width: frame.width, height: frame.height }) : null;

  // Measure the available width so the frame keeps its ratio exactly.
  React.useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    const measure = () => setFrameWidth(node.clientWidth);
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const runProbe = React.useCallback(
    (option: AspectRatioOption, held: Orientation, size: { width: number; height: number }) => {
      const iframe = iframeRef.current;
      setProbeError(null);
      if (!iframe || size.width <= 0 || size.height <= 0) return;

      let doc: Document | null = null;
      try {
        doc = iframe.contentDocument;
      } catch {
        doc = null;
      }
      const label = `${option.id} ${ORIENTATION_LABEL[held].toLowerCase()}`;
      if (!doc || !doc.documentElement) {
        setProbe({
          status: "blocked",
          frameWidth: size.width,
          frameHeight: size.height,
          documentWidth: 0,
          surplus: 0,
          hits: [],
          message: `The frame at ${label} is not readable. Either it is still loading, or this host blocks same-origin framing, so overflow cannot be measured here.`,
        });
        return;
      }

      try {
        const documentWidth = Math.max(doc.documentElement.scrollWidth, doc.body?.scrollWidth ?? 0);
        const surplus = documentWidth - size.width;
        const hits: OverflowHit[] = [];
        if (surplus > 1) {
          for (const element of Array.from(doc.querySelectorAll<HTMLElement>("body *"))) {
            const style = doc.defaultView?.getComputedStyle(element);
            if (!style) continue;
            if (style.position === "fixed" || style.display === "none" || style.visibility === "hidden") continue;
            const scrollWidth = element.scrollWidth;
            if (scrollWidth > size.width + 1) {
              hits.push({ selector: describeElement(element), scrollWidth });
            }
          }
          hits.sort((a, b) => b.scrollWidth - a.scrollWidth);
        }
        setProbe({
          status: surplus > 1 ? "overflow" : "ok",
          frameWidth: size.width,
          frameHeight: size.height,
          documentWidth,
          surplus: Math.max(0, surplus),
          hits: hits.slice(0, 5),
          message:
            surplus > 1
              ? `At ${size.width}px wide the document scrolls to ${documentWidth}px, so ${surplus}px of content sits off-screen at ${label}.`
              : `At ${size.width}px wide the document fits: widest content is ${documentWidth}px, leaving ${Math.abs(surplus)}px of slack at ${label}.`,
        });
      } catch (error) {
        setProbeError(error instanceof Error ? error.message : "The overflow probe failed.");
      }
    },
    [],
  );

  // Re-probe whenever the page, ratio, orientation, or frame size changes. A
  // short delay gives the iframe's own layout and effects a chance to settle.
  React.useEffect(() => {
    if (!ratio || frame.width <= 0) return;
    const timer = window.setTimeout(() => runProbe(ratio, orientation, frame), 450);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageRoute, ratio?.id, orientation, frame.width, frame.height, runProbe]);

  const onSelectRatio = (option: AspectRatioOption) => {
    // Each family's listed ratio comes with its own conventional orientation, so
    // switching families resets the orientation rather than keeping a stale one.
    const nextOrientation = option.defaultOrientation;
    setRatio(option);
    setOrientation(nextOrientation);
    savePreferredRatio(option.id, nextOrientation);
    setProbe(null);
  };

  const onSelectOrientation = (next: Orientation) => {
    if (!ratio) return;
    setOrientation(next);
    savePreferredRatio(ratio.id, next);
    setProbe(null);
  };

  const onSelectPage = (route: string) => {
    setPageRoute(route);
    savePreferredPage(route);
    setProbe(null);
  };

  const onResetToDevice = () => {
    const detected = reading?.nearestId ? ASPECT_RATIOS.find((option) => option.id === reading.nearestId) : undefined;
    if (!detected) return;
    const nextOrientation = reading?.nearestOrientation ?? detected.defaultOrientation;
    setRatio(detected);
    setOrientation(nextOrientation);
    savePreferredRatio(detected.id, nextOrientation);
    setProbe(null);
  };

  const ratioLabel = ratio ? `${ratio.id} ${ORIENTATION_LABEL[orientation].toLowerCase()}` : "none";
  const detectionLabel = reading
    ? reading.confident
      ? `matched ${reading.nearestId} ${ORIENTATION_LABEL[reading.nearestOrientation].toLowerCase()}`
      : "no supported ratio is close"
    : "unavailable";

  return (
    <div className="space-y-8">
      <div className="panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge variant={probe?.status === "overflow" ? "danger" : probe?.status === "ok" ? "moss" : "accent"} dot>
              {probe ? probe.status : "measuring"}
            </Badge>
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              {ratio ? `${ratioLabel} locked` : "no ratio selected"}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              saved: {ratioLabel}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={onResetToDevice} disabled={!reading?.nearestId}>
              <RotateCcw aria-hidden />
              Re-detect device
            </Button>
          </div>
        </div>

        <Separator dashed className="my-5" />

        <p className="max-w-3xl text-[13px] leading-relaxed text-muted-foreground text-pretty">
          The frame below is locked to the ratio you pick, so the page inside is laid out at a real phone or tablet
          viewport instead of a desktop one. The probe walks the framed document itself and reports any element wider
          than the frame, which is the same stretch a visitor would feel. Your choice is kept in this browser, so it
          survives reloads until you change it.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-notch border border-border bg-muted/30 p-3.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Detected device</p>
            <p className="mt-1.5 text-[13px] text-foreground">
              {reading ? DEVICE_CLASS_LABEL[reading.deviceClass] : "Reading…"}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {reading ? `${detectionLabel}; ${reading.classReason}` : ""}
            </p>
          </div>
          <div className="rounded-notch border border-border bg-muted/30 p-3.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Frame viewport</p>
            <p className="mt-1.5 font-mono text-[13px] text-foreground">
              {frame.width || "–"} × {frame.height || "–"}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {aspect ? `${ratioLabel} = ${aspect.toFixed(3)}:1 width to height` : ""}
            </p>
          </div>
          <div className="rounded-notch border border-border bg-muted/30 p-3.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Distortion check</p>
            <p className={cn("mt-1.5 text-[13px]", distortion?.status === "ok" ? "text-moss-300" : "text-destructive")}>
              {distortion ? (distortion.status === "ok" ? "No distortion" : "Stretched") : "–"}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {distortion ? `rendered ${distortion.measured.toFixed(3)}:1, delta ${distortion.delta.toFixed(4)}` : ""}
            </p>
          </div>
        </div>

        {probeError ? (
          <p
            role="status"
            aria-live="polite"
            className="mt-4 flex items-start gap-2.5 text-[13px] leading-relaxed text-destructive text-pretty"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {probeError}
          </p>
        ) : null}
        {probe ? (
          <p
            role="status"
            aria-live="polite"
            className={cn(
              "mt-4 flex items-start gap-2.5 text-[13px] leading-relaxed text-pretty",
              probe.status === "ok"
                ? "text-moss-300"
                : probe.status === "blocked"
                  ? "text-muted-foreground"
                  : "text-destructive",
            )}
          >
            {probe.status === "ok" ? (
              <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
            ) : (
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            )}
            {probe.message}
          </p>
        ) : (
          <p role="status" aria-live="polite" className="mt-4 flex items-center gap-2.5 text-[13px] text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Measuring {ratioLabel}…
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <div className="panel p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Preview frame — {ratioLabel}
            </p>
            <Badge variant="outline" size="sm">
              {PAGE_META.find((page) => page.route === pageRoute)?.title ?? "Page"}
            </Badge>
          </div>

          {/* The measuring column: the frame is sized from this element's width. */}
          <div ref={frameRef} className="mt-4 w-full">
            <div
              className="relative mx-auto overflow-hidden rounded-notch border border-border bg-background"
              style={{ width: frame.width || undefined, height: frame.height || undefined }}
            >
              <iframe
                key={pageRoute}
                ref={iframeRef}
                src={pageRoute}
                title={`Preview of ${pageRoute} at ${ratioLabel}`}
                className="absolute inset-0 block size-full border-0 bg-background"
                onLoad={() => {
                  if (ratio) runProbe(ratio, orientation, frame);
                }}
              />
            </div>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground text-pretty">
            Same-origin frame, so the probe can read the document inside it. In production this needs the host to
            allow same-origin framing; a blocked frame is reported above instead of silently showing as clean.
          </p>
        </div>

        <div className="space-y-6">
          <div className="panel p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Page</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PREVIEW_PAGES.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => onSelectPage(page.route)}
                  aria-pressed={page.route === pageRoute}
                  className={cn(
                    "rounded-sm border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors duration-200",
                    page.route === pageRoute
                      ? "border-primary/45 bg-primary/12 text-primary"
                      : "border-border bg-muted/40 text-muted-foreground hover:border-foreground/25 hover:text-foreground",
                  )}
                >
                  {page.title}
                </button>
              ))}
            </div>
          </div>

          <div className="panel p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Orientation</p>
            <div className="mt-3 flex gap-2">
              {ORIENTATIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onSelectOrientation(option)}
                  aria-pressed={option === orientation}
                  className={cn(
                    "flex-1 rounded-sm border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors duration-200",
                    option === orientation
                      ? "border-primary/45 bg-primary/12 text-primary"
                      : "border-border bg-muted/40 text-muted-foreground hover:border-foreground/25 hover:text-foreground",
                  )}
                >
                  {ORIENTATION_LABEL[option]}
                </button>
              ))}
            </div>
            <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground text-pretty">
              A phone page is checked in portrait; a tablet layout is usually checked in landscape. Both are kept, so
              you can confirm the same ratio either way the device is held.
            </p>
          </div>

          <div className="panel p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Aspect ratio</p>
            <div className="mt-4 space-y-5">
              {DEVICE_CLASS_ORDER.map((deviceClass) => {
                const Icon = DEVICE_CLASS_ICON[deviceClass];
                const isDetectedFamily = reading?.deviceClass === deviceClass;
                return (
                  <div key={deviceClass}>
                    <div className="flex items-center gap-2">
                      <Icon className="size-3.5 text-muted-foreground" aria-hidden />
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        {DEVICE_CLASS_LABEL[deviceClass]}
                      </span>
                      {isDetectedFamily ? (
                        <Badge variant="moss" size="sm">
                          recommended
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-2.5 grid gap-2">
                      {ASPECT_RATIOS.filter((option) => option.deviceClass === deviceClass).map((option) => {
                        const active = option.id === ratio?.id;
                        const detected =
                          option.id === reading?.nearestId && reading?.nearestOrientation === orientation;
                        const dimension = frameSize(
                          frameValue(option, orientation),
                          frameWidth || 360,
                          MAX_FRAME_HEIGHT,
                        );
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => onSelectRatio(option)}
                            aria-pressed={active}
                            className={cn(
                              "flex items-center justify-between gap-3 rounded-notch border px-3 py-2.5 text-left transition-colors duration-200",
                              active
                                ? "border-primary/50 bg-primary/10"
                                : "border-border bg-muted/25 hover:border-foreground/25",
                            )}
                          >
                            <span className="min-w-0">
                              <span className="flex items-center gap-2">
                                <span className={cn("font-mono text-[13px]", active ? "text-primary" : "text-foreground")}>
                                  {option.label}
                                </span>
                                {detected ? (
                                  <Badge variant="accent" size="sm">
                                    detected
                                  </Badge>
                                ) : null}
                              </span>
                              <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                                {option.note}
                              </span>
                            </span>
                            <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                              {dimension.width}×{dimension.height}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <Separator dashed className="my-5" />
            <p className="text-[11px] leading-relaxed text-muted-foreground text-pretty">
              Sizes on the right are the frame's viewport at the current column width and orientation, so you can read
              the exact viewport each ratio produces before switching.
            </p>
          </div>

          <div className="panel p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Device signals</p>
            <dl className="mt-3 space-y-2 text-[11px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Viewport</dt>
                <dd className="font-mono text-foreground">
                  {reading ? `${reading.viewportWidth}×${reading.viewportHeight}` : "–"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Screen</dt>
                <dd className="font-mono text-foreground">
                  {reading ? `${reading.screenWidth}×${reading.screenHeight}` : "–"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Measured ratio</dt>
                <dd className="font-mono text-foreground">{reading ? `${reading.ratio.toFixed(3)}:1` : "–"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Closest option</dt>
                <dd className="font-mono text-foreground">
                  {reading ? (reading.nearestId ?? "none") : "–"}
                  {reading && reading.confident ? "" : " (too far)"}
                </dd>
              </div>
            </dl>
            <Separator dashed className="my-4" />
            <p className="text-[11px] leading-relaxed text-muted-foreground text-pretty">
              Detection reads the browser's own numbers, so a desktop with a touch screen can be read as a tablet.
              Treat the recommendation as a starting point, and check the ratio on the real device before publishing a
              layout change.
            </p>
          </div>

          {probe && probe.hits.length > 0 ? (
            <div className="panel panel-flagged p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-destructive">
                Widest elements past the frame
              </p>
              <ul className="mt-3 space-y-2">
                {probe.hits.map((hit) => (
                  <li
                    key={`${hit.selector}-${hit.scrollWidth}`}
                    className="flex items-center justify-between gap-3 text-[11px]"
                  >
                    <code className="min-w-0 truncate font-mono text-foreground">{hit.selector}</code>
                    <span className="shrink-0 font-mono text-muted-foreground">{hit.scrollWidth}px</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <div className="panel p-6">
        <div className="flex items-center gap-2">
          <Monitor className="size-3.5 text-muted-foreground" aria-hidden />
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            What this tool cannot prove
          </p>
        </div>
        <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-muted-foreground text-pretty">
          <li>· The frame reproduces viewport width and ratio only. Font rasterisation, `dvh` behaviour, and touch target sizing still differ from real hardware.</li>
          <li>· The overflow probe needs a same-origin frame. A cross-origin page, or a host that bars framing, reports as blocked rather than clean.</li>
          <li>· Canvas and WebGL content is not measured, because its layout lives inside the canvas rather than the DOM.</li>
        </ul>
      </div>
    </div>
  );
}
