/**
 * The scans behind the credentials, with a full screen viewer.
 *
 * A certificate with no scan simply does not appear here. Nothing is drawn in
 * or filled out on the visitor's behalf: when the paper was never uploaded the
 * credential stays a line of text, which is the honest state of something that
 * cannot be checked from this page.
 *
 * A scan is usually a picture, but a certificate the issuer hands out as a PDF
 * is not, and it is embedded as a document instead. The two are told apart by
 * the recorded MIME type, never by the URL: an object uploaded from a phone or
 * a "certificate.php" download has no extension to read.
 *
 * The viewer is an overlay rather than a route, so opening a scan does not throw
 * away the page behind it. Escape closes it, the arrow keys step through every
 * scan on the page in the order the owner filed them, and focus moves into the
 * overlay so the keyboard does not stay behind on a thumbnail.
 */
import * as React from "react";
import { ChevronLeft, ChevronRight, Expand, FileText, X } from "lucide-react";
import { PageSection, SectionHeading } from "@/components/layout/SectionHeading";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/fx/Reveal";
import { useEntries, type CertificationScan } from "@/entries/EntriesProvider";
import { isPdfScan } from "@/entries/types";

interface Slide {
  url: string;
  caption: string;
  mimeType: string;
  certName: string;
  issuer: string;
  position: number;
  total: number;
}

interface ScanGroup {
  id: string;
  name: string;
  issuer: string;
  domain: string;
  scans: CertificationScan[];
  /** Where this group starts in the flat list the viewer steps through. */
  offset: number;
}

export function CertificateSlideshow() {
  const { certifications, scansFor } = useEntries();

  const { groups, slides } = React.useMemo(() => {
    const slides: Slide[] = [];
    const groups: ScanGroup[] = [];

    for (const cert of certifications) {
      const scans = scansFor(cert.id);
      if (scans.length === 0) continue;

      groups.push({
        id: cert.id,
        name: cert.name,
        issuer: cert.issuer,
        domain: cert.domain,
        scans,
        offset: slides.length,
      });

      scans.forEach((scan, index) => {
        slides.push({
          url: scan.url,
          caption: scan.caption,
          mimeType: scan.mimeType,
          certName: cert.name,
          issuer: cert.issuer,
          position: index + 1,
          total: scans.length,
        });
      });
    }

    return { groups, slides };
  }, [certifications, scansFor]);

  const [openAt, setOpenAt] = React.useState<number | null>(null);
  const viewerRef = React.useRef<HTMLDivElement>(null);

  const open = openAt !== null;
  // Read through the index so a scan deleted in another tab cannot crash this.
  const active = openAt === null ? null : (slides[openAt] ?? null);

  const step = React.useCallback(
    (delta: number) => {
      setOpenAt((current) => {
        if (current === null || slides.length === 0) return current;
        return (current + delta + slides.length) % slides.length;
      });
    },
    [slides.length],
  );

  React.useEffect(() => {
    if (!open) return;

    const previous = document.activeElement as HTMLElement | null;
    viewerRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenAt(null);
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    }

    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open, step]);

  // The page behind the viewer must not scroll while it is open.
  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (slides.length === 0) return null;

  return (
    <>
      <PageSection className="border-y border-border bg-card/25">
        <SectionHeading
          index="04"
          eyebrow="Scans"
          title={`${slides.length} scans across ${groups.length} ${groups.length === 1 ? "certificate" : "certificates"}`}
          description="The paper itself, filed in the order I keep it. Pictures open full screen, issued PDFs open as documents. Step through the rest with the arrow keys."
        />

        <div className="mt-10 space-y-6">
          {groups.map((group) => (
            <Reveal key={group.id}>
              <div className="panel p-5 sm:p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-semibold tracking-tight">
                      {group.name}
                    </h3>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      {group.issuer} · {group.domain}
                    </p>
                  </div>
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    {group.scans.length} {group.scans.length === 1 ? "scan" : "scans"}
                  </span>
                </div>

                <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {group.scans.map((scan, index) => (
                    <li key={scan.id}>
                      <button
                        type="button"
                        onClick={() => setOpenAt(group.offset + index)}
                        aria-label={`Open ${group.name} scan ${index + 1} of ${group.scans.length}`}
                        className="group relative block w-full overflow-hidden rounded-notch border border-border bg-muted"
                      >
                        {isPdfScan(scan.mimeType) ? (
                          <span className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-muted/60 text-muted-foreground">
                            <FileText className="size-6" aria-hidden />
                            <span className="font-mono text-[10px] uppercase tracking-[0.14em]">
                              PDF
                            </span>
                          </span>
                        ) : (
                          <img
                            src={scan.url}
                            alt=""
                            loading="lazy"
                            className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-out-expo group-hover:scale-[1.04]"
                          />
                        )}
                        <span
                          aria-hidden
                          className="absolute right-2 top-2 grid size-7 place-items-center rounded-[3px] bg-ink-950/70 text-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                        >
                          <Expand className="size-3.5" />
                        </span>
                        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/85 to-transparent px-2.5 pb-2 pt-6 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-foreground/90">
                          {scan.caption || `Scan ${index + 1}`}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </PageSection>

      {open && active ? (
        <div
          ref={viewerRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={`${active.certName}, scan ${active.position} of ${active.total}`}
          className="fixed inset-0 z-[70] flex flex-col bg-ink-950/95 backdrop-blur-sm focus:outline-none"
        >
          <div className="flex items-center justify-between gap-4 border-b border-border/60 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="truncate font-display text-[15px] font-medium tracking-tight text-foreground">
                {active.certName}
              </p>
              <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {active.issuer} · scan {active.position} of {active.total}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpenAt(null)}
              aria-label="Close the viewer"
              className="shrink-0 text-foreground"
            >
              <X aria-hidden />
            </Button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center p-4 sm:p-8">
            {isPdfScan(active.mimeType) ? (
              // The document is embedded rather than converted, so the visitor
              // reads the same file the issuer signed. object-src stays off;
              // an iframe is the one element that renders it under this policy.
              <iframe
                src={active.url}
                title={`${active.certName}, scan ${active.position}`}
                className="h-full w-full max-w-5xl rounded-notch border border-border/60 bg-background shadow-lift"
              />
            ) : (
              <img
                src={active.url}
                alt={`${active.certName}, scan ${active.position}`}
                className="max-h-full max-w-full rounded-notch border border-border/60 object-contain shadow-lift"
              />
            )}

            {slides.length > 1 ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => step(-1)}
                  aria-label="Previous scan"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-ink-950/60 text-foreground sm:left-4"
                >
                  <ChevronLeft aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => step(1)}
                  aria-label="Next scan"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-ink-950/60 text-foreground sm:right-4"
                >
                  <ChevronRight aria-hidden />
                </Button>
              </>
            ) : null}
          </div>

          <div className="border-t border-border/60 px-4 py-3 sm:px-6">
            <p className="text-center font-mono text-[11px] leading-relaxed text-muted-foreground">
              {active.caption ||
                `${active.certName}, scan ${active.position} of ${active.total}${
                  isPdfScan(active.mimeType) ? " (PDF)" : ""
                }. Escape closes this view.`}
            </p>
            {isPdfScan(active.mimeType) ? (
              // Some mobile browsers show only the first page of an embedded
              // PDF, so the file is also reachable on its own.
              <p className="mt-1 text-center font-mono text-[11px]">
                <a
                  href={active.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
                >
                  Open the PDF in a new tab
                </a>
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
