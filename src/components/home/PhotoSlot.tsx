import * as React from "react";
import { AlertTriangle, Check, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MAX_PHOTO_BYTES,
  MAX_PHOTO_MB,
  PHOTO_ACCEPT_ATTRIBUTE,
  acceptedTypeLabel,
  formatBytes,
  readPhotoSize,
  validatePhotoFile,
  type PhotoProblem,
} from "@/lib/photoValidation";
import {
  deleteStoredPhoto,
  hasPhotoStorage,
  loadStoredPhoto,
  saveStoredPhoto,
  type StoredPhoto,
} from "@/lib/photoStore";

/** reading = decoding the picked file, saving = writing it to IndexedDB. */
type Stage = "idle" | "reading" | "preview" | "saving";

type Draft = {
  file: File;
  objectUrl: string;
  width: number;
  height: number;
};

const STORAGE_NOTE =
  "The file is written to IndexedDB in this browser. It survives a reload and a restart, but it does not follow you to another device, and clearing site data removes it.";

/**
 * Photo slot for the home page.
 *
 * Two phases on purpose: picking a file only builds a preview, and nothing is
 * written until the preview is approved. A rejected file leaves whatever is
 * already saved completely untouched.
 */
export function PhotoSlot({ className }: { className?: string }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [saved, setSaved] = React.useState<StoredPhoto | null>(null);
  const [savedUrl, setSavedUrl] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [stage, setStage] = React.useState<Stage>("idle");
  const [problem, setProblem] = React.useState<PhotoProblem | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [confirmingRemoval, setConfirmingRemoval] = React.useState(false);
  const [storageReady] = React.useState(() => hasPhotoStorage());

  // Object URLs are owned per state value and released with it, so no revoked
  // URL is ever left behind inside an <img> that is still on screen.
  React.useEffect(() => {
    if (!saved) {
      setSavedUrl(null);
      return;
    }
    const url = URL.createObjectURL(saved.blob);
    setSavedUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [saved]);

  const draftRef = React.useRef<Draft | null>(null);
  draftRef.current = draft;
  React.useEffect(
    () => () => {
      if (draftRef.current) URL.revokeObjectURL(draftRef.current.objectUrl);
    },
    [],
  );

  React.useEffect(() => {
    let cancelled = false;
    loadStoredPhoto()
      .then((photo) => {
        if (!cancelled) setSaved(photo);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setProblem({
          title: "The saved photo could not be read",
          detail: `${error instanceof Error ? error.message : "The browser gave no reason."} ${STORAGE_NOTE}`,
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dropDraft = React.useCallback(() => {
    setDraft((current) => {
      if (current) URL.revokeObjectURL(current.objectUrl);
      return null;
    });
    setStage("idle");
  }, []);

  const handleFile = React.useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setNotice(null);

      const rejection = validatePhotoFile(file);
      if (rejection) {
        setProblem(rejection);
        dropDraft();
        return;
      }

      setProblem(null);
      setStage("reading");

      const objectUrl = URL.createObjectURL(file);
      const measured = await readPhotoSize(objectUrl);

      if ("title" in measured) {
        URL.revokeObjectURL(objectUrl);
        setProblem(measured);
        setStage("idle");
        return;
      }

      dropDraft();
      setDraft({ file, objectUrl, width: measured.width, height: measured.height });
      setStage("preview");
    },
    [dropDraft],
  );

  const confirmSave = async () => {
    if (!draft) return;
    setStage("saving");
    try {
      const photo: StoredPhoto = {
        blob: draft.file,
        fileName: draft.file.name,
        mimeType: draft.file.type || "image/*",
        byteSize: draft.file.size,
        width: draft.width,
        height: draft.height,
        savedAt: new Date().toISOString(),
      };
      await saveStoredPhoto(photo);
      setSaved(photo);
      setNotice(`${photo.fileName} is saved and will be shown on every visit from this browser.`);
      setProblem(null);
      dropDraft();
    } catch (error) {
      setProblem({
        title: "The photo could not be saved",
        detail: `${error instanceof Error ? error.message : "The browser gave no reason."} ${STORAGE_NOTE}`,
      });
      setStage("preview");
    }
  };

  const removeSaved = async () => {
    setConfirmingRemoval(false);
    try {
      await deleteStoredPhoto();
      setSaved(null);
      setProblem(null);
      setNotice("The stored photo was removed from this browser.");
    } catch (error) {
      setProblem({
        title: "The stored photo could not be removed",
        detail: error instanceof Error ? error.message : "The browser gave no reason.",
      });
    }
  };

  const busy = stage === "reading" || stage === "saving";
  const shownUrl = draft?.objectUrl ?? savedUrl;
  const shownName = draft?.file.name ?? saved?.fileName;

  const status = !storageReady
    ? { variant: "danger" as const, label: "storage unavailable" }
    : draft
      ? { variant: "accent" as const, label: "preview, not saved" }
      : saved
        ? { variant: "moss" as const, label: "stored" }
        : { variant: "muted" as const, label: "empty" };

  const meta = draft
    ? `${formatBytes(draft.file.size)} · ${draft.width} by ${draft.height} px`
    : saved
      ? `${formatBytes(saved.byteSize)} · ${saved.width} by ${saved.height} px`
      : `${acceptedTypeLabel()}, up to ${MAX_PHOTO_MB} MB`;

  return (
    <div className={cn("panel-flagged p-5 sm:p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 pl-2">
        <div>
          <h3 className="font-display text-base font-semibold tracking-tight">Profile photo</h3>
          <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted-foreground">{meta}</p>
        </div>
        <Badge variant={status.variant} size="sm" dot={Boolean(draft)}>
          {status.label}
        </Badge>
      </div>

      <div className="mt-5 pl-2">
        <div
          onDragOver={(event) => {
            if (!storageReady) return;
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (storageReady) void handleFile(event.dataTransfer.files?.[0]);
          }}
          className={cn(
            "relative overflow-hidden rounded-blob border-2 bg-card/60 transition-colors duration-300",
            dragging
              ? "border-solid border-primary bg-primary/10"
              : draft
                ? "border-solid border-primary/50"
                : "border-dashed border-border",
          )}
        >
          <div className="relative aspect-[4/5]">
            {shownUrl ? (
              <img
                src={shownUrl}
                alt={draft ? `Preview of ${shownName}` : `Profile photo in use: ${shownName}`}
                className="size-full object-cover object-center"
              />
            ) : (
              <div className="grid size-full place-items-center px-6 text-center">
                <div>
                  <span className="mx-auto grid size-12 place-items-center rounded-notch border border-border bg-muted/50">
                    <ImagePlus className="size-5 text-muted-foreground" />
                  </span>
                  <p className="mt-4 font-display text-sm font-semibold">No photo in this slot</p>
                  <p className="mx-auto mt-1.5 max-w-[26ch] font-mono text-[11px] leading-relaxed text-muted-foreground">
                    A portrait crop sits best in this frame. Drop a file on it, or use the button below.
                  </p>
                </div>
              </div>
            )}

            {dragging && (
              <div className="absolute inset-0 grid place-items-center bg-background/85">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">
                  Release to preview
                </span>
              </div>
            )}

            {busy && (
              <div className="absolute inset-0 grid place-items-center bg-background/85">
                <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  {stage === "saving" ? "writing to storage" : "reading the file"}
                </span>
              </div>
            )}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={PHOTO_ACCEPT_ATTRIBUTE}
          className="sr-only"
          tabIndex={-1}
          aria-label="Choose a photo file from this device"
          onChange={(event) => {
            const file = event.target.files?.[0];
            // Reset, so picking the same file twice still fires a change event.
            event.target.value = "";
            void handleFile(file);
          }}
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {draft ? (
            <>
              <Button size="sm" onClick={() => void confirmSave()} disabled={busy}>
                <Check className="size-4" />
                Save this photo
              </Button>
              <Button size="sm" variant="outline" onClick={dropDraft} disabled={busy}>
                Discard preview
              </Button>
            </>
          ) : confirmingRemoval ? (
            <>
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                Remove the stored photo?
              </span>
              <Button size="sm" variant="solid" onClick={() => void removeSaved()}>
                Yes, remove
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmingRemoval(false)}>
                Keep it
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={!storageReady || busy}
              >
                <Upload className="size-4" />
                {saved ? "Replace photo" : "Choose a photo"}
              </Button>
              {saved && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmingRemoval(true)}
                  disabled={busy}
                >
                  <Trash2 className="size-4" />
                  Remove
                </Button>
              )}
            </>
          )}
        </div>

        {!storageReady && (
          <p
            role="alert"
            className="mt-3 flex items-start gap-2 border-l-2 border-destructive/60 pl-3 font-mono text-[11px] leading-relaxed text-destructive"
          >
            <AlertTriangle className="mt-px size-3.5 shrink-0" />
            <span>
              This browser reports no IndexedDB, so the slot cannot keep a file between visits. Upload
              is disabled rather than pretending the photo was stored.
            </span>
          </p>
        )}

        {notice && (
          <p
            role="status"
            className="mt-3 flex items-start gap-2 font-mono text-[11px] leading-relaxed text-moss-300"
          >
            <Check className="mt-px size-3.5 shrink-0" />
            <span>{notice}</span>
          </p>
        )}

        {problem && (
          <div role="alert" className="mt-3 border border-destructive/45 bg-destructive/10 p-3">
            <p className="flex items-start gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-destructive">
              <AlertTriangle className="mt-px size-3.5 shrink-0" />
              <span>{problem.title}</span>
            </p>
            {problem.detail && (
              <p className="mt-1.5 text-[12px] leading-relaxed text-destructive/85">{problem.detail}</p>
            )}
          </div>
        )}

        {saved ? (
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-border pt-4 font-mono text-[11px]">
            <div className="min-w-0">
              <dt className="text-muted-foreground">File</dt>
              <dd className="truncate" title={saved.fileName}>
                {saved.fileName}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Size</dt>
              <dd className="tabular-nums">
                {formatBytes(saved.byteSize)}{" "}
                <span className="text-muted-foreground">
                  ({Math.round((saved.byteSize / MAX_PHOTO_BYTES) * 100)}% of the limit)
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Type</dt>
              <dd>{saved.mimeType}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Stored at</dt>
              <dd className="tabular-nums">{new Date(saved.savedAt).toLocaleString("en-US")}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 border-t border-border pt-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
            {STORAGE_NOTE}
          </p>
        )}
      </div>
    </div>
  );
}
