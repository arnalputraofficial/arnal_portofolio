/**
 * The crop step for the profile photo.
 *
 * The home page renders the avatar in a square frame with `object-cover`, so a
 * portrait photo loses its top and bottom without anyone being asked. This
 * dialog moves that decision in front of the person uploading: the frame here
 * is the frame the site will show, and only what sits inside it is uploaded.
 *
 * No cropping library is used. The visible image is one `<img>` positioned with
 * a CSS transform, and the export redraws the same geometry onto a square
 * canvas, so what the preview shows is what the file contains.
 */
import * as React from "react";
import { ImagePlus, Loader2, Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

/** Side of the exported square, in pixels. */
export const CROP_OUTPUT_SIZE = 1024;

/** The frame on screen. Square, so it matches the hero on the home page. */
const FRAME_PX = 288;

/** A one finger drag only becomes a pan after this many pixels. */
const DRAG_SLOP_PX = 4;

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
/** One press of the zoom buttons, as a multiplier. */
const ZOOM_PRESS = 1.12;
/** How hard a wheel notch pushes, as a multiplier exponent. */
const ZOOM_WHEEL = 0.0015;

/**
 * Every format the media bucket accepts, plus the ones a phone or a design tool
 * produces that we can safely re-encode. Anything else never reaches the file
 * picker.
 */
export const CROP_SOURCE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif,image/bmp";

/** The bucket allows 5 MB and this is what it will receive, so cap it here too. */
const MAX_OUTPUT_BYTES = 5 * 1024 * 1024;

interface Size {
  width: number;
  height: number;
}

interface Geometry {
  /** Distance from the frame's left edge to the image's left edge, at scale 1. */
  x: number;
  /** Distance from the frame's top edge to the image's top edge, at scale 1. */
  y: number;
  zoom: number;
}

/**
 * The size the photo takes up when it is fitted inside the frame, before zoom.
 *
 * Everything else is measured against this, so zoom 1 always means "the whole
 * photo is visible" rather than "the photo at its pixel size". Without this a
 * 4000px wide camera file would open at roughly fourteen times the frame and
 * the crop would start somewhere inside a nostril.
 */
function containSize(size: Size, frame: number): Size {
  if (size.width <= 0 || size.height <= 0) return { width: 0, height: 0 };
  const scale = Math.min(frame / size.width, frame / size.height);
  return { width: size.width * scale, height: size.height * scale };
}

/**
 * The smallest zoom that still covers the frame.
 *
 * The fitted photo is letterboxed when it is landscape and pillarboxed when it
 * is portrait, so covering the frame needs a boost of `frame / fittedSide` on
 * the side that is currently short.
 */
function coverZoom(size: Size, frame: number): number {
  const fitted = containSize(size, frame);
  if (fitted.width <= 0 || fitted.height <= 0) return 1;
  return Math.max(frame / fitted.width, frame / fitted.height);
}

/** Where the photo sits at a given zoom, kept inside the frame. */
function clamped(size: Size, geometry: Geometry, frame: number): Geometry {
  const fitted = containSize(size, frame);
  const zoom = Math.min(Math.max(geometry.zoom, coverZoom(size, frame)), MAX_ZOOM);
  const width = fitted.width * zoom;
  const height = fitted.height * zoom;
  return {
    zoom,
    x: Math.min(0, Math.max(frame - width, geometry.x)),
    y: Math.min(0, Math.max(frame - height, geometry.y)),
  };
}

/** The view the crop opens with: cover the frame, centred. */
function centered(size: Size, frame: number): Geometry {
  const zoom = coverZoom(size, frame);
  const fitted = containSize(size, frame);
  return clamped(
    size,
    { zoom, x: (frame - fitted.width * zoom) / 2, y: (frame - fitted.height * zoom) / 2 },
    frame,
  );
}

/** Downscales the chosen square in quarter steps until it fits the bucket. */
async function encodeWithin(
  source: HTMLImageElement,
  geometry: Geometry,
  size: Size,
): Promise<Blob | null> {
  let side = CROP_OUTPUT_SIZE;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = side;
    canvas.height = side;

    const context = canvas.getContext("2d");
    if (!context) return null;

    // The same geometry the preview shows, scaled from the frame to the export.
    // `geometry.zoom` is measured against the contain-fitted photo, so the
    // fitted size is what it multiplies.
    const fitted = containSize(size, FRAME_PX);
    const ratio = side / FRAME_PX;
    context.imageSmoothingQuality = "high";
    context.drawImage(
      source,
      geometry.x * ratio,
      geometry.y * ratio,
      fitted.width * geometry.zoom * ratio,
      fitted.height * geometry.zoom * ratio,
    );

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", 0.9);
    });

    if (!blob) return null;
    if (blob.size <= MAX_OUTPUT_BYTES) return blob;

    side = Math.round(side * 0.75);
  }

  return null;
}

interface AvatarCropperProps {
  /** The chosen file, or null when the dialog is closed. */
  file: File | null;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}

/**
 * Dialog that frames the photo before it is uploaded. The parent owns the file
 * so closing the dialog always means "nothing happened".
 */
export function AvatarCropper({ file, onCancel, onConfirm }: AvatarCropperProps) {
  const frameRef = React.useRef<HTMLDivElement>(null);
  const gesture = React.useRef<{ x: number; y: number; baseX: number; baseY: number } | null>(null);

  const [source, setSource] = React.useState<HTMLImageElement | null>(null);
  const [size, setSize] = React.useState<Size>({ width: 0, height: 0 });
  const [geometry, setGeometry] = React.useState<Geometry>({ x: 0, y: 0, zoom: 1 });
  const [problem, setProblem] = React.useState("");
  const [exporting, setExporting] = React.useState(false);

  // A new file resets the framing, so reopening never inherits the last crop.
  React.useEffect(() => {
    if (!file) {
      setSource(null);
      setSize({ width: 0, height: 0 });
      setProblem("");
      return;
    }

    let cancelled = false;
    const url = URL.createObjectURL(file);
    const image = new Image();

    setProblem("");
    setSource(null);

    image.onload = () => {
      if (cancelled) return;
      const next = { width: image.naturalWidth, height: image.naturalHeight };
      setSource(image);
      setSize(next);
      setGeometry(centered(next, FRAME_PX));
    };
    image.onerror = () => {
      if (!cancelled) setProblem("That file could not be read as an image.");
    };
    image.src = url;

    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const reset = React.useCallback(() => {
    if (size.width > 0) setGeometry(centered(size, FRAME_PX));
  }, [size]);

  /** Wheel zoom needs a non passive listener, so it is bound by hand. */
  React.useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !file) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setGeometry((current) => {
        const floor = coverZoom(size, FRAME_PX);
        const zoom = Math.min(Math.max(current.zoom * Math.exp(-event.deltaY * ZOOM_WHEEL), floor), MAX_ZOOM);
        const ratio = zoom / current.zoom;
        const rect = frame.getBoundingClientRect();
        const pointerX = event.clientX - rect.left;
        const pointerY = event.clientY - rect.top;
        // Keeping the point under the cursor fixed is what makes zoom feel like
        // zoom rather than a resize from the corner.
        return clamped(
          size,
          {
            zoom,
            x: pointerX - (pointerX - current.x) * ratio,
            y: pointerY - (pointerY - current.y) * ratio,
          },
          FRAME_PX,
        );
      });
    };

    frame.addEventListener("wheel", onWheel, { passive: false });
    return () => frame.removeEventListener("wheel", onWheel);
  }, [file, size]);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!source) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { x: event.clientX, y: event.clientY, baseX: geometry.x, baseY: geometry.y };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const held = gesture.current;
    if (!held) return;

    // A finger has to travel before this counts as a pan, otherwise a tap drags
    // the photo a pixel or two and the framing looks wrong for no reason.
    if (event.pointerType !== "mouse") {
      const travelled = Math.hypot(event.clientX - held.x, event.clientY - held.y);
      if (travelled < DRAG_SLOP_PX) return;
    }

    const dx = event.clientX - held.x;
    const dy = event.clientY - held.y;
    setGeometry((current) => clamped(size, { ...current, x: held.baseX + dx, y: held.baseY + dy }, FRAME_PX));
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    gesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function nudgeZoom(direction: 1 | -1) {
    setGeometry((current) => {
      const floor = coverZoom(size, FRAME_PX);
      const zoom = Math.min(Math.max(current.zoom * (direction > 0 ? ZOOM_PRESS : 1 / ZOOM_PRESS), floor), MAX_ZOOM);
      const centre = FRAME_PX / 2;
      const ratio = zoom / current.zoom;
      return clamped(
        size,
        { zoom, x: centre - (centre - current.x) * ratio, y: centre - (centre - current.y) * ratio },
        FRAME_PX,
      );
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 16 : 4;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };

    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      nudgeZoom(1);
      return;
    }
    if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      nudgeZoom(-1);
      return;
    }

    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    setGeometry((current) => clamped(size, { ...current, x: current.x + move[0], y: current.y + move[1] }, FRAME_PX));
  }

  async function handleConfirm() {
    if (!source || !file || size.width <= 0) return;

    setExporting(true);
    setProblem("");

    try {
      const blob = await encodeWithin(source, geometry, size);
      if (!blob) {
        setProblem("The cropped photo could not be written, so nothing was uploaded.");
        return;
      }

      const base = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "-");
      onConfirm(new File([blob], `${base || "avatar"}-square.webp`, { type: "image/webp" }));
    } catch {
      setProblem("The cropped photo could not be written, so nothing was uploaded.");
    } finally {
      setExporting(false);
    }
  }

  /** The zoom that exactly fills the frame, which reads as 100% on the slider. */
  const cover = coverZoom(size, FRAME_PX);
  const zoomPercent = Math.round((geometry.zoom / cover) * 100);
  /** The fitted size the preview draws at; zoom multiplies this, never the raw pixels. */
  const fitted = containSize(size, FRAME_PX);

  return (
    <Dialog open={Boolean(file)} onOpenChange={(open) => (!open ? onCancel() : undefined)}>
      <DialogContent className="max-w-xl">
        <DialogTitle>Frame the profile photo</DialogTitle>
        <DialogDescription>
          The home page shows this photo in a square frame. Everything inside the box below is what
          gets uploaded; the rest is left out. Drag to move, scroll or use the slider to zoom.
        </DialogDescription>

        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
          <div
            ref={frameRef}
            role="application"
            aria-label="Photo crop area. Drag to move the photo, arrow keys to nudge, plus and minus to zoom."
            tabIndex={0}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={handleKeyDown}
            style={{ width: FRAME_PX, height: FRAME_PX, touchAction: "none" }}
            className="relative shrink-0 cursor-grab overflow-hidden rounded-notch border border-border bg-ink-950 outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/35 active:cursor-grabbing"
          >
            {source && fitted.width > 0 ? (
              <img
                src={source.src}
                alt=""
                draggable={false}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: fitted.width,
                  height: fitted.height,
                  transform: `translate(${geometry.x}px, ${geometry.y}px) scale(${geometry.zoom})`,
                  transformOrigin: "0 0",
                  maxWidth: "none",
                }}
              />
            ) : (
              <div className="grid size-full place-items-center">
                {problem ? (
                  <span className="px-6 text-center font-mono text-[11px] text-destructive">
                    {problem}
                  </span>
                ) : (
                  <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
                )}
              </div>
            )}

            {/* Rule of thirds, so a face can be placed without guessing. */}
            <div className="pointer-events-none absolute inset-0">
              <span className="absolute inset-y-0 left-1/3 w-px bg-ink-50/20" />
              <span className="absolute inset-y-0 left-2/3 w-px bg-ink-50/20" />
              <span className="absolute inset-x-0 top-1/3 h-px bg-ink-50/20" />
              <span className="absolute inset-x-0 top-2/3 h-px bg-ink-50/20" />
            </div>
            <span className="pointer-events-none absolute inset-0 rounded-notch ring-1 ring-inset ring-ink-50/25" />
          </div>

          <div className="flex-1 space-y-4">
            <div className="panel p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                Original
              </p>
              <p className="mt-1 font-mono text-[12px] tabular-nums text-foreground">
                {size.width > 0 ? `${size.width} x ${size.height} px` : "reading"}
              </p>
              <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                Saved as {CROP_OUTPUT_SIZE} x {CROP_OUTPUT_SIZE} WebP.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="avatar-zoom"
                  className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground"
                >
                  Zoom
                </label>
                <span className="font-mono text-[11px] tabular-nums text-foreground">
                  {zoomPercent}%
                </span>
              </div>
              <input
                id="avatar-zoom"
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM / cover}
                step={0.01}
                value={geometry.zoom / cover}
                onChange={(event) => {
                  const zoom = Number(event.target.value) * cover;
                  const centre = FRAME_PX / 2;
                  const ratio = zoom / geometry.zoom;
                  setGeometry((current) =>
                    clamped(
                      size,
                      {
                        zoom,
                        x: centre - (centre - current.x) * ratio,
                        y: centre - (centre - current.y) * ratio,
                      },
                      FRAME_PX,
                    ),
                  );
                }}
                className="mt-2 w-full accent-primary"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => nudgeZoom(-1)}>
                <Minus aria-hidden />
                <span className="sr-only">Zoom out</span>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => nudgeZoom(1)}>
                <Plus aria-hidden />
                <span className="sr-only">Zoom in</span>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={reset}>
                Reset
                <RotateCcw aria-hidden />
              </Button>
            </div>

            <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
              Arrow keys nudge by 4 pixels, or 16 with Shift held.
            </p>
          </div>
        </div>

        {problem ? (
          <p role="alert" className="mt-4 font-mono text-[11px] leading-relaxed text-destructive">
            {problem}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={exporting}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => void handleConfirm()}
            disabled={!source || exporting || size.width <= 0}
          >
            {exporting ? "Cropping" : "Use this crop"}
            {exporting ? <Loader2 className="animate-spin" aria-hidden /> : <ImagePlus aria-hidden />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AvatarCropper;
