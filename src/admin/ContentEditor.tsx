/**
 * The content editor.
 *
 * One page at a time, grouped by the part of the key it belongs to. Typing is
 * held locally and written to drafts on demand, so a half finished sentence is
 * never sent to the database on its own.
 *
 * The field baseline is the saved draft, falling back to the published value,
 * falling back to the text compiled into the bundle. Preview does not change
 * what this screen shows; it changes what the public pages show.
 */
import * as React from "react";
import {
  ArrowUpRight,
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useContent } from "@/content/ContentProvider";
import { CONTENT_DEFAULTS, entriesForPage, PAGE_META, tokensForEntry } from "@/content/registry";
import type { ContentEntry, ContentPageId } from "@/content/types";
import { useAdminAuth } from "@/admin/AdminAuthProvider";
import { AvatarCropper, CROP_SOURCE_ACCEPT } from "@/admin/AvatarCropper";
import { plural, useAdminEditor } from "@/admin/useAdminData";
import { supabase } from "@/lib/supabase";
import { publicImageUrl } from "@/entries/types";

const FIELD =
  "flex w-full rounded-notch border border-input bg-background/60 px-3 py-1.5 " +
  "font-mono text-[13px] text-foreground placeholder:text-muted-foreground/70 " +
  "transition-colors duration-200 hover:border-foreground/25 " +
  "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35";

/** Single line fields share the same compact height as the textarea lines. */
const FIELD_INPUT = "mt-2 h-9 px-3 text-[13px]";

type ValueMap = Record<string, string>;

/** Mirrors the bucket, which enforces the same allowlist and size cap itself. */
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
/**
 * The source only has to be decoded in the browser, so it may be far larger
 * than what is uploaded. This cap is here to stop a huge file from freezing the
 * tab, not to match the bucket.
 */
const MAX_PHOTO_SOURCE_BYTES = 25 * 1024 * 1024;

export default function ContentEditor() {
  const { overrides, drafts, previewing, setPreviewing } = useContent();
  const { identity } = useAdminAuth();
  const editor = useAdminEditor();

  const [pageId, setPageId] = React.useState<ContentPageId>(PAGE_META[0]?.id ?? "global");
  const [local, setLocal] = React.useState<ValueMap>({});

  /**
   * The photo waiting to be framed, held between the file picker and the crop
   * dialog so closing the dialog leaves nothing behind.
   */
  const [pendingPhoto, setPendingPhoto] = React.useState<File | null>(null);
  const [photoBusy, setPhotoBusy] = React.useState(false);
  const [photoProblem, setPhotoProblem] = React.useState("");

  /**
   * Live DOM nodes for the text fields, keyed by content key. Inserting a token
   * has to read the caret from the real element, which React state cannot see.
   */
  const fieldRefs = React.useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>(
    {},
  );

  const entries = React.useMemo(() => entriesForPage(pageId), [pageId]);
  const sections = React.useMemo(() => groupBySection(entries, pageId), [entries, pageId]);

  /**
   * What the database currently holds for a key. The draft wins over the
   * published value, because the draft is what the next publish would ship.
   */
  const disk = React.useMemo(() => {
    const next: ValueMap = {};
    for (const entry of entries) {
      next[entry.key] = drafts[entry.key] ?? overrides[entry.key] ?? CONTENT_DEFAULTS[entry.key] ?? "";
    }
    return next;
  }, [entries, drafts, overrides]);

  /** Keys carrying unsaved text. They survive switching between pages. */
  const dirtyKeys = React.useMemo(
    () => Object.keys(local).filter((key) => local[key] !== disk[key]),
    [local, disk],
  );

  /** Keys on this page that have a stored draft waiting to be published. */
  const draftKeys = React.useMemo(
    () => entries.filter((entry) => drafts[entry.key] !== undefined).map((entry) => entry.key),
    [entries, drafts],
  );

  /**
   * The unsaved keys that belong to the page on screen. "Publish page" is
   * scoped to one page, so it must not reach for edits made somewhere else.
   */
  const pageDirtyKeys = React.useMemo(() => {
    const onPage = new Set(entries.map((entry) => entry.key));
    return dirtyKeys.filter((key) => onPage.has(key));
  }, [dirtyKeys, entries]);

  /**
   * Everything on this page a publish would ship: the drafts already stored,
   * plus the edits that have not been written yet.
   */
  const publishableKeys = React.useMemo(
    () => [...new Set([...pageDirtyKeys, ...draftKeys])],
    [pageDirtyKeys, draftKeys],
  );

  function valueOf(key: string): string {
    return key in local ? local[key] : (disk[key] ?? "");
  }

  function setField(key: string, value: string) {
    setLocal((current) => ({ ...current, [key]: value }));
  }

  /**
   * Inserts a token where the caret sits, then puts the caret back after it.
   *
   * The caret position is read from the DOM at click time instead of being
   * tracked in React state. React never sees the caret move, so a state copy
   * would go stale the moment the admin uses the arrow keys, and the token
   * would land in the wrong place.
   */
  function insertToken(key: string, token: string, field: HTMLInputElement | HTMLTextAreaElement | null) {
    const current = valueOf(key);

    // Without a focused field there is no caret to trust, so append instead.
    if (!field || document.activeElement !== field) {
      const separator = current.length === 0 || current.endsWith(" ") ? "" : " ";
      setField(key, `${current}${separator}${token}`);
      return;
    }

    const start = field.selectionStart ?? current.length;
    const end = field.selectionEnd ?? start;
    const before = current.slice(0, start);
    const after = current.slice(end);

    // Mirrors what would be typed by hand: a space between words, but no space
    // in the middle of one.
    const needsLead = before.length > 0 && !/\s$/.test(before);
    const needsTrail = after.length > 0 && !/^\s/.test(after);

    const inserted = `${needsLead ? " " : ""}${token}${needsTrail ? " " : ""}`;
    const caret = start + inserted.length;

    setField(key, `${before}${inserted}${after}`);

    // The value is controlled by React, so the DOM still holds the old text at
    // this point. Restoring the caret on the next frame lets React commit the
    // new value first; setting it now would be undone by that commit.
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(caret, caret);
    });
  }

  function resetField(key: string) {
    setLocal((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  /**
   * Takes the framed square from the crop dialog and stores it.
   *
   * The file arriving here is already square and already WebP, so nothing about
   * its shape is decided again on the way out.
   */
  async function uploadCroppedPhoto(file: File) {
    if (!supabase) return;

    setPendingPhoto(null);
    setPhotoProblem("");

    if (!PHOTO_TYPES.includes(file.type)) {
      setPhotoProblem("The cropped photo came out in a format the bucket refuses. Try another source file.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoProblem(
        `The cropped photo is ${(file.size / 1024 / 1024).toFixed(1)} MB, over the 5 MB the bucket allows.`,
      );
      return;
    }

    setPhotoBusy(true);
    try {
      const path = `profile/avatar-${Date.now()}.webp`;
      const { error: uploadError } = await supabase.storage
        .from("portfolio-media")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      setField("global.profile.avatar", path);
    } catch (err) {
      setPhotoProblem(err instanceof Error ? err.message : "The cropped photo could not be uploaded.");
    } finally {
      setPhotoBusy(false);
    }
  }

  function dropLocal(keys: string[]) {
    setLocal((current) => {
      const next = { ...current };
      for (const key of keys) delete next[key];
      return next;
    });
  }

  /**
   * Writes the given keys to drafts and returns the ones the database took.
   *
   * A refused field is left in `local`, so it stays on screen marked "edited"
   * with its text intact. Clearing it anyway would show the old value as if the
   * edit had been saved.
   */
  async function writeDrafts(keys: string[]): Promise<string[]> {
    const payload = keys.map((key) => ({ key, value: valueOf(key) }));
    if (payload.length === 0) return [];

    const { saved } = await editor.saveDrafts(payload);
    if (saved.length > 0) dropLocal(saved);
    return saved;
  }

  async function handleSave() {
    await writeDrafts(dirtyKeys);
  }

  /**
   * Publishing is save-then-publish.
   *
   * "Publish page" used to read the drafts table only, so a field that had been
   * typed into but not saved was silently left out of the publish: the page
   * shipped with the old text and nothing said why. Saving the unsaved keys
   * first means one press ships what is on screen.
   */
  async function handlePublish(keys: string[]) {
    const saved = await writeDrafts(keys);
    if (saved.length === 0) return;

    // A refused field is still on screen, waiting to be fixed. Publishing the
    // rest now would replace its error with a success message, which reads as
    // "everything went through".
    if (saved.length < keys.length) return;

    await editor.publishDrafts(saved);
  }

  async function handleDiscardPage() {
    const ok = await editor.discardDrafts(draftKeys);
    if (!ok) return;
    setLocal((current) => {
      const next = { ...current };
      for (const key of draftKeys) delete next[key];
      return next;
    });
  }

  async function handleDiscardEveryPage() {
    const ok = await editor.discardDrafts(null);
    if (!ok) return;
    setLocal({});
  }

  return (
    <div className="space-y-8">
      <div className="panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge variant={editor.busy ? "accent" : "moss"} dot={editor.busy}>
              {editor.busy ? "writing" : "ready"}
            </Badge>
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              {plural(Object.keys(drafts).length, "draft", "drafts")} saved in total
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={previewing ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewing(!previewing)}
              aria-pressed={previewing}
            >
              {previewing ? "Preview on" : "Preview off"}
              {previewing ? <Eye aria-hidden /> : <EyeOff aria-hidden />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleDiscardPage()}
              disabled={editor.busy || draftKeys.length === 0}
            >
              Discard page
              <RotateCcw aria-hidden />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleDiscardEveryPage()}
              disabled={editor.busy || Object.keys(drafts).length === 0}
            >
              Discard all
              <Trash2 aria-hidden />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handlePublish(publishableKeys)}
              disabled={editor.busy || publishableKeys.length === 0}
            >
              Publish page
              <Upload aria-hidden />
            </Button>
            <Button
              size="sm"
              onClick={() => void handleSave()}
              disabled={editor.busy || dirtyKeys.length === 0}
            >
              Save drafts
              <Save aria-hidden />
            </Button>
          </div>
        </div>

        <Separator dashed className="my-5" />

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] text-muted-foreground">
          <span>
            unsaved: <span className="text-foreground">{dirtyKeys.length}</span>
          </span>
          <span>
            drafts on this page: <span className="text-foreground">{draftKeys.length}</span>
          </span>
          <span>
            preview:{" "}
            <span className={previewing ? "text-moss-300" : "text-foreground"}>
              {previewing ? "public pages read drafts" : "public pages read published values"}
            </span>
          </span>
        </div>

        {editor.feedback ? (
          <p
            role="status"
            aria-live="polite"
            className={cn(
              "mt-4 flex items-start gap-2.5 text-[13px] leading-relaxed text-pretty",
              editor.feedback.tone === "error" ? "text-destructive" : "text-moss-300",
            )}
          >
            {editor.feedback.tone === "error" ? (
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            ) : (
              <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
            )}
            {editor.feedback.text}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1 border-b border-border pb-px">
        {PAGE_META.map((page) => {
          const active = page.id === pageId;
          const pending = entriesForPage(page.id).filter(
            (entry) => drafts[entry.key] !== undefined,
          ).length;

          return (
            <button
              key={page.id}
              type="button"
              onClick={() => setPageId(page.id)}
              aria-current={active ? "true" : undefined}
              className={cn(
                "relative inline-flex items-center gap-2 border-b-2 px-3.5 py-2.5",
                "font-mono text-[12px] uppercase tracking-[0.1em]",
                "transition-all duration-200 ease-out-expo",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {page.title}
              {pending > 0 ? (
                <span className="rounded-sm bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                  {pending}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {pageMeta(pageId) ? (
        <p className="max-w-2xl text-[14px] leading-relaxed text-muted-foreground text-pretty">
          {pageMeta(pageId)?.description}{" "}
          <a
            href={pageMeta(pageId)?.route}
            className="inline-flex items-center gap-1 text-primary underline decoration-primary/40 decoration-2 underline-offset-4 hover:decoration-primary"
          >
            See the page
            <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
        </p>
      ) : null}

      {sections.map((section) => (
        <section key={section.id} className="space-y-3">
          <div className="flex items-center gap-4">
            <h3 className="eyebrow">{section.title}</h3>
            <span className="hairline flex-1" />
            <span className="font-mono text-[11px] text-muted-foreground">
              {section.entries.length}
            </span>
          </div>

          <div className="grid items-start gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {section.entries.map((entry) => {
              const stored = drafts[entry.key];
              const dirty = dirtyKeys.includes(entry.key);
              const pending =
                stored !== undefined &&
                stored !== (overrides[entry.key] ?? CONTENT_DEFAULTS[entry.key] ?? "");
              const writing = editor.pendingKey === entry.key;
              const fieldId = `field-${entry.key}`;

              // The photo field holds a storage path, so braces would be part of
              // a filename rather than a token. Pages also use the value as a URL
              // in places, where the renderer never substitutes tokens.
              const tokens =
                entry.key === "global.profile.avatar" ? [] : tokensForEntry(entry);

              // Paragraphs and the hero heading stay the width of the box.
              // Short fields share the row so the panel reads as a grid.
              const fullWidth =
                entry.multiline === true ||
                entry.key === "global.profile.avatar" ||
                entry.key === "home.hero.title" ||
                entry.key === "home.hero.lead";

              return (
                <div
                  key={entry.key}
                  className={cn(
                    "panel min-w-0 p-3",
                    fullWidth && "sm:col-span-2 2xl:col-span-3",
                    dirty && "border-primary/40",
                    !dirty && pending && "border-moss-600/40",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor={fieldId} className="font-mono text-[12px] text-foreground">
                      {entry.label}
                    </label>
                    <div className="flex items-center gap-3">
                      {writing ? (
                        <Loader2 className="size-3.5 animate-spin text-primary" aria-hidden />
                      ) : null}
                      {dirty ? (
                        <Badge variant="accent" size="sm">
                          edited
                        </Badge>
                      ) : pending ? (
                        <Badge variant="moss" size="sm">
                          draft only
                        </Badge>
                      ) : null}
                      {dirty ? (
                        <button
                          type="button"
                          onClick={() => resetField(entry.key)}
                          className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground underline decoration-border decoration-2 underline-offset-4 hover:text-foreground"
                        >
                          reset
                        </button>
                      ) : pending ? (
                        <button
                          type="button"
                          onClick={() => void handleDiscardPage()}
                          disabled={editor.busy}
                          className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground underline decoration-border decoration-2 underline-offset-4 hover:text-foreground disabled:opacity-50"
                        >
                          <Trash2 className="size-3" aria-hidden />
                          discard
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {entry.key === "global.profile.avatar" ? (
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center gap-4">
                        {valueOf(entry.key) ? (
                          <div className="relative size-16 shrink-0 overflow-hidden rounded-notch border border-border bg-card">
                            <img
                              src={
                                valueOf(entry.key).startsWith("http")
                                  ? valueOf(entry.key)
                                  : publicImageUrl(valueOf(entry.key)) ?? undefined
                              }
                              alt="Profile preview"
                              className="size-full object-cover grayscale contrast-125 sepia-[0.25]"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = "none";
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex size-16 shrink-0 items-center justify-center rounded-notch border border-dashed border-border bg-card/60 font-mono text-[10px] text-muted-foreground">
                            <ImageIcon className="size-5 opacity-40" />
                          </div>
                        )}
                        <div className="flex-1">
                          {/* The picker no longer uploads. It only hands the file to
                              the crop dialog, so the square that gets stored is the
                              square the home page will show. */}
                          <label
                            className={cn(
                              "inline-flex items-center gap-2 rounded-notch border border-primary/40 bg-primary/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-primary transition-colors hover:bg-primary/20",
                              photoBusy ? "cursor-wait opacity-60" : "cursor-pointer",
                            )}
                          >
                            {photoBusy ? (
                              <Loader2 className="size-3.5 animate-spin" aria-hidden />
                            ) : (
                              <Upload className="size-3.5" aria-hidden />
                            )}
                            <span>{photoBusy ? "Uploading" : "Upload new photo"}</span>
                            <input
                              type="file"
                              accept={CROP_SOURCE_ACCEPT}
                              className="sr-only"
                              disabled={photoBusy}
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                // Cleared straight away so picking the same file
                                // twice still fires a change event.
                                event.target.value = "";
                                if (!file) return;
                                setPhotoProblem("");
                                if (!file.type.startsWith("image/")) {
                                  setPhotoProblem(
                                    `${file.name} is not an image file. Pick a JPG, PNG, or WebP.`,
                                  );
                                  return;
                                }
                                if (file.size > MAX_PHOTO_SOURCE_BYTES) {
                                  setPhotoProblem(
                                    `${file.name} is ${(file.size / 1024 / 1024).toFixed(1)} MB, too large to open here. Pick one under 25 MB.`,
                                  );
                                  return;
                                }
                                setPendingPhoto(file);
                              }}
                            />
                          </label>
                          <p className="mt-1 font-mono text-[10px] leading-relaxed text-muted-foreground">
                            Opens a square crop first, so you choose what stays in frame. Saved as a
                            1024 x 1024 WebP in the portfolio-media bucket, JPG, PNG, WebP, AVIF up
                            to 5 MB.
                          </p>
                          {photoProblem ? (
                            <p
                              role="alert"
                              className="mt-2 flex items-start gap-2 border-l-2 border-destructive/70 pl-3 font-mono text-[11px] leading-relaxed text-destructive"
                            >
                              <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
                              <span>{photoProblem}</span>
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <Input
                        id={fieldId}
                        value={valueOf(entry.key)}
                        onChange={(event) => setField(entry.key, event.target.value)}
                        placeholder="Or type/paste storage path or full image URL"
                        className={FIELD_INPUT}
                      />
                      {/* The upload reaches the bucket immediately, but the public
                          site reads published values only, so a photo that looks
                          finished here is still invisible until it is published. */}
                      {dirty || stored !== undefined ? (
                        <p
                          role="status"
                          className="mt-2 flex items-start gap-2 border-l-2 border-primary/60 pl-3 font-mono text-[11px] leading-relaxed text-primary"
                        >
                          <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
                          <span>
                            {dirty
                              ? "The file is in the media bucket, but nothing is saved yet. Press Save drafts, then Publish page."
                              : "Saved as a draft only. The public site still shows the old photo until you press Publish page."}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  ) : entry.options ? (
                    <Select
                      value={valueOf(entry.key)}
                      onValueChange={(next) => setField(entry.key, next)}
                    >
                      <SelectTrigger id={fieldId} className={cn(FIELD_INPUT, "justify-between")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {/*
                          A value saved before this field became a list may sit
                          outside it. That value is kept selectable, so opening
                          the panel and saving never silently rewrites a
                          published string to the first option.
                        */}
                        {(entry.options.includes(valueOf(entry.key))
                          ? entry.options
                          : [valueOf(entry.key), ...entry.options]
                        )
                          .filter((option) => option.length > 0)
                          .map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  ) : entry.multiline ? (
                    <textarea
                      id={fieldId}
                      rows={4}
                      ref={(node) => {
                        fieldRefs.current[entry.key] = node;
                      }}
                      value={valueOf(entry.key)}
                      onChange={(event) => setField(entry.key, event.target.value)}
                      className={cn(FIELD, "mt-2 resize-y")}
                    />
                  ) : (
                    <Input
                      id={fieldId}
                      ref={(node) => {
                        fieldRefs.current[entry.key] = node;
                      }}
                      value={valueOf(entry.key)}
                      onChange={(event) => setField(entry.key, event.target.value)}
                      className={FIELD_INPUT}
                    />
                  )}

                  {entry.hint ? (
                    <p className="mt-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
                      {entry.hint}
                    </p>
                  ) : null}

                  {/* Tokens are only useful if the admin can spell them, and a
                      mistyped name silently renders as literal braces. Clicking
                      one inserts it at the caret. */}
                  {tokens.length > 0 ? (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70">
                        insert
                      </span>
                      {tokens.map((token) => (
                        <button
                          key={token}
                          type="button"
                          // Keeps the caret where the admin left it. Without this
                          // the button takes focus first, and the insert has no
                          // position to read.
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() =>
                            insertToken(entry.key, `{${token}}`, fieldRefs.current[entry.key] ?? null)
                          }
                          title={`Insert {${token}}`}
                          className="rounded-notch border border-border bg-card/60 px-2 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                        >
                          {`{${token}}`}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="panel-flagged p-6">
        <h3 className="font-display text-lg leading-snug">What this editor does not do</h3>
        <ul className="mt-4 space-y-3 text-[13px] leading-relaxed text-muted-foreground text-pretty">
          <li>
            Only strings listed in the content registry can be edited. Project rows, certifications,
            and skill levels are rows in the entry tables, and the numbers a chart draws are set on
            the Charts tab. A key that is not registered cannot be invented here.
          </li>
          <li>
            There is no staging site. Publishing writes to the same table the public site reads, so
            publishing is the test, which is why every publish lands in the revision list.
          </li>
          <li>
            Preview is local to this browser session. It changes what the public pages show to you,
            and nothing for anybody else.
          </li>
          <li>
            {identity?.email} is the only address that can write, because the database checks it
            against the allowlist on every call. This screen cannot add or remove an admin.
          </li>
          </ul>
        </div>

      {/* Mounted once for the whole panel. `file` being null is what keeps it shut,
          so cancelling really does throw the picked photo away. */}
      <AvatarCropper
        file={pendingPhoto}
        onCancel={() => setPendingPhoto(null)}
        onConfirm={(cropped) => void uploadCroppedPhoto(cropped)}
      />
    </div>
  );
}

function pageMeta(id: ContentPageId) {
  return PAGE_META.find((page) => page.id === id);
}

interface Section {
  id: string;
  title: string;
  entries: ContentEntry[];
}

/** Human names for the boxes, so the panel reads like the page, not the keys. */
const GROUP_TITLES: Record<string, string> = {
  profile: "Profile",
  nav: "Navigation",
  header: "Header",
  footer: "Footer",
  table: "Data table",
  hero: "Hero",
  stack: "Stack strip",
  health: "Health",
  summary: "Summary",
  trail: "Career trail",
  projects: "Projects",
  records: "Records",
  principles: "Principles",
  call: "Call to action",
  intro: "Page intro",
  stat: "Statistics",
  shape: "Shape",
  timeline: "Timeline",
  chart: "Chart labels",
  cta: "Call to action",
  quickread: "Quick read",
  featured: "Featured work",
  composition: "Composition",
  hold: "On hold",
  cards: "Cards",
  detail: "Project detail",
  validity: "Validity",
  related: "Related links",
  spread: "Spread",
  selfrating: "Self rating",
  registry: "Registry",
  clarify: "Clarify",
  map: "Map",
  honesty: "Honesty",
  working: "Working style",
  missteps: "Missteps",
  faq: "FAQ",
  form: "Form",
  sidebar: "Sidebar",
  channels: "Channels",
  problem: "Problem",
  role: "Role",
  honest: "Honest notes",
  closing: "Closing",
  aside: "Aside",
  mistyped: "Mistyped",
  shortcuts: "Shortcuts",
  available: "Available routes",
  routes: "Routes",
  beyond: "Beyond",
  report: "Report",
};

/**
 * The boxes in page order, so the panel follows the page from top to bottom.
 * A group missing here still renders, after the listed ones.
 */
const PAGE_GROUP_ORDER: Record<ContentPageId, string[]> = {
  global: ["profile", "nav", "header", "footer", "table"],
  home: ["hero", "health", "summary", "trail", "projects", "records", "principles", "call", "stack"],
  career: ["intro", "stat", "shape", "timeline", "table", "chart", "cta"],
  projects: [
    "intro",
    "stat",
    "quickread",
    "featured",
    "composition",
    "table",
    "hold",
    "cta",
    "chart",
    "detail",
  ],
  credentials: ["intro", "stat", "validity", "composition", "table", "cta", "related"],
  skills: [
    "intro",
    "stat",
    "spread",
    "selfrating",
    "registry",
    "chart",
    "cards",
    "clarify",
    "map",
    "summary",
    "honesty",
    "cta",
  ],
  about: ["intro", "stat", "profile", "working", "principles", "missteps", "faq", "cta"],
  contact: ["intro", "stat", "form", "sidebar", "channels", "cta"],
  steadbyte: ["intro", "stat", "summary", "problem", "role", "honest", "closing"],
  notfound: ["intro", "cta", "aside", "mistyped", "shortcuts", "available", "routes", "beyond", "report"],
};

/**
 * Maps a key to its box on the page. The registry naming already follows the
 * page boxes, so the middle key segment is the group, except for the flat
 * intro keys (eyebrow, title, lead) and a few page specific aliases.
 */
function rawGroup(pageId: ContentPageId, entry: ContentEntry): string {
  if (entry.group) return entry.group;

  const parts = entry.key.split(".");

  if (pageId === "global") {
    if (parts[0] === "nav") return "nav";
    if (parts[0] === "header") return "header";
    if (parts[0] === "footer") return "footer";
    return parts[1] ?? "profile";
  }

  const seg = parts[1] ?? entry.key;

  if (seg === "eyebrow" || seg === "title" || seg === "lead") return "intro";
  if (pageId === "skills" && (seg === "card" || seg === "entry" || seg === "entries" || seg === "toggle")) {
    return "cards";
  }
  if (pageId === "projects" && seg === "card") return "featured";
  if (pageId === "about" && seg === "mistakes") return "missteps";
  if (pageId === "about" && seg === "projects") return "cta";
  if (pageId === "notfound" && seg === "code") return "intro";
  if (pageId === "notfound" && seg === "route") return "routes";

  return seg;
}

/**
 * Groups entries box by box in page order. Order of first appearance is kept
 * for anything the order table does not list, so nothing ever goes missing.
 */
function groupBySection(entries: ContentEntry[], pageId: ContentPageId): Section[] {
  const firstSeen: string[] = [];
  const buckets = new Map<string, ContentEntry[]>();

  for (const entry of entries) {
    const id = rawGroup(pageId, entry);

    if (!buckets.has(id)) {
      buckets.set(id, []);
      firstSeen.push(id);
    }

    buckets.get(id)?.push(entry);
  }

  const listed = PAGE_GROUP_ORDER[pageId] ?? [];
  const order = [...listed.filter((id) => buckets.has(id)), ...firstSeen.filter((id) => !listed.includes(id))];

  return order.map((id) => ({
    id,
    title: GROUP_TITLES[id] ?? id,
    entries: buckets.get(id) ?? [],
  }));
}
