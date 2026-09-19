/**
 * The entries panel.
 *
 * Job history, projects, certificates, and skills used to be constants in the
 * bundle. They are rows in Postgres now, and this is the only screen that
 * writes them.
 *
 * Every call goes through useEntryWriter, which lands on a SECURITY DEFINER
 * function rather than on a table, so the allowlist is checked inside the
 * database. After a write the provider refetches, so the row on screen is the
 * row the database actually holds rather than the one this form hoped for.
 *
 * Two empty states are kept apart on purpose. A list with no rows is either
 * "never written to", in which case the public site is still showing the
 * bundled sample set, or "written and then emptied", in which case the public
 * section is genuinely bare. The banner above each list says which one it is,
 * because those two look identical in the database.
 *
 * The dropdown options are read from the database functions that own those
 * lists, so extending a value list is one migration and no deploy. The copies
 * in this file are only a fallback for the moment before that call returns.
 */
import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Eye,
  EyeOff,
  FileText,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { pastedLines, pastedNumber } from "@/lib/paste";
import { useEntries } from "@/entries/EntriesProvider";
import {
  useEntryWriter,
  type CareerInput,
  type CertificationInput,
  type EntryWriterValue,
  type ProjectInput,
  type SkillInput,
} from "@/entries/useEntryWriter";
import type {
  CareerEntry,
  CertificationEntry,
  EntryTable,
  ProjectCurvePoint,
  ProjectEntry,
  SkillEntry,
  StoredEntry,
} from "@/entries/types";

const FIELD =
  "flex w-full rounded-notch border border-input bg-background/60 px-3.5 py-2 " +
  "font-mono text-[13px] text-foreground placeholder:text-muted-foreground/70 " +
  "transition-colors duration-200 hover:border-foreground/25 " +
  "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35";

/** Status values are a check constraint, so they are not fetched. */
const STATUS_OPTIONS = ["live", "active", "completed", "on-hold"] as const;
const CERT_STATUS_OPTIONS = ["active", "expired", "renewing"] as const;

/** The bucket, its size cap, and its MIME allowlist all live in the database. */
const MEDIA_BUCKET = "portfolio-media";
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/** Rendered next to the upload button, and used in the refusal message. */
const ACCEPTED_LABEL = "JPEG, PNG, WebP, or PDF";
const MAX_UPLOAD_LABEL = "10 MB";

/**
 * A project photo is shown inside a gallery, so a document has no place there.
 * The bucket accepts PDFs for certificates; this screen narrows that down.
 */
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PHOTO_LABEL = "JPEG, PNG, or WebP";

/**
 * The natural size of an image, so a scan can be stored with its real shape.
 * A PDF has no such measurement, and the 0,0 it would give is not a shape, so
 * documents skip this and are stored with a null size.
 */
function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    const settle = (width: number, height: number) => {
      URL.revokeObjectURL(url);
      resolve({ width, height });
    };

    image.onload = () => settle(image.naturalWidth, image.naturalHeight);
    image.onerror = () => settle(0, 0);
    image.src = url;
  });
}

/**
 * The extension alone, stripped down to something safe to put in a path.
 * Null when the name carries none, which is common for a certificate the
 * issuer hands out as "certificate" or "download": the caller then picks an
 * extension from the MIME type instead of inventing one here.
 */
function safeExtension(name: string): string | null {
  const dot = name.lastIndexOf(".");
  const raw = dot > -1 ? name.slice(dot + 1) : "";
  return raw.toLowerCase().replace(/[^a-z0-9]/g, "") || null;
}

/** Picks an extension from the type, for a file name that has none. */
function fallbackExtension(mimeType: string): string {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

interface ValueLists {
  kinds: string[];
  domains: string[];
  categories: string[];
  levels: string[];
}

const FALLBACK_LISTS: ValueLists = {
  kinds: [
    "Infrastructure",
    "Internal Systems",
    "Integration",
    "Security",
    "Data & Monitoring",
    "ERP Rollout",
  ],
  domains: [
    "Networking",
    "Security",
    "Cloud & Infra",
    "Service Management",
    "Data",
    "Project Management",
  ],
  categories: ["Leadership", "Infrastructure", "Engineering", "Security", "Data", "Operations"],
  levels: ["IC", "Lead", "SPV", "Manager"],
};

const TABS: Array<{ table: EntryTable; label: string }> = [
  { table: "career", label: "Job history" },
  { table: "projects", label: "Projects" },
  { table: "certifications", label: "Certificates" },
  { table: "skills", label: "Skills" },
];

interface ValueListsValue {
  lists: ValueLists;
  /** Re-reads the lists, for when the panel itself adds a value. */
  reload: () => Promise<void>;
}

/** The four value lists, read once for the whole panel. */
function useValueLists(): ValueListsValue {
  const [lists, setLists] = React.useState<ValueLists>(FALLBACK_LISTS);

  const load = React.useCallback(async () => {
    const client = supabase;
    if (!client) return;

    const [kinds, domains, categories, levels] = await Promise.all([
      client.rpc("portfolio_project_kinds"),
      client.rpc("portfolio_certification_domains"),
      client.rpc("portfolio_skill_categories"),
      client.rpc("portfolio_role_levels"),
    ]);

    setLists({
      kinds: kinds.data ?? FALLBACK_LISTS.kinds,
      domains: domains.data ?? FALLBACK_LISTS.domains,
      categories: categories.data ?? FALLBACK_LISTS.categories,
      levels: levels.data ?? FALLBACK_LISTS.levels,
    });
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return { lists, reload: load };
}

export default function EntriesPanel() {
  const { all, isSample } = useEntries();
  const writer = useEntryWriter();
  const { lists, reload: reloadLists } = useValueLists();

  const [table, setTable] = React.useState<EntryTable>("career");

  return (
    <div className="space-y-8">
      <div className="panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge variant={writer.busy ? "accent" : "moss"} dot={writer.busy}>
              {writer.busy ? "writing" : "ready"}
            </Badge>
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              {all.career.length + all.projects.length + all.certifications.length + all.skills.length}{" "}
              stored rows
            </span>
          </div>

          {writer.feedback ? (
            <button
              type="button"
              onClick={writer.clearFeedback}
              className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground underline decoration-border decoration-2 underline-offset-4 hover:text-foreground"
            >
              clear
            </button>
          ) : null}
        </div>

        <Separator dashed className="my-5" />

        <p className="max-w-3xl text-[13px] leading-relaxed text-muted-foreground text-pretty">
          Each list is written one row at a time and goes live the moment it is saved. There is no
          draft stage here: hiding a row takes it off the site without deleting it, and the order
          you set is the order the public pages read.
        </p>

        {writer.feedback ? (
          <p
            role="status"
            aria-live="polite"
            className={cn(
              "mt-4 flex items-start gap-2.5 text-[13px] leading-relaxed text-pretty",
              writer.feedback.tone === "error" ? "text-destructive" : "text-moss-300",
            )}
          >
            {writer.feedback.tone === "error" ? (
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            ) : (
              <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
            )}
            {writer.feedback.text}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1 border-b border-border pb-px">
        {TABS.map((entry) => {
          const active = entry.table === table;
          const hidden = all[entry.table].filter((row) => !row.visible).length;

          return (
            <button
              key={entry.table}
              type="button"
              onClick={() => setTable(entry.table)}
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
              {entry.label}
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                {all[entry.table].length}
              </span>
              {hidden > 0 ? (
                <span className="rounded-sm bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                  {hidden} hidden
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {table === "career" ? (
        <EntryList
          table="career"
          rows={all.career}
          writer={writer}
          isSample={isSample("career")}
          sampleCount={all.career.length}
          addLabel="Add a job entry"
          describe={(row) => ({
            title: row.title,
            meta: `${row.company} · ${row.start} to ${row.end ?? "now"} · ${row.level} · ${row.headcount} people`,
          })}
          renderForm={({ entry, onClose }) => (
            <CareerForm writer={writer} lists={lists} entry={entry} onClose={onClose} />
          )}
        />
      ) : null}

      {table === "projects" ? (
        <EntryList
          table="projects"
          rows={all.projects}
          writer={writer}
          isSample={isSample("projects")}
          sampleCount={all.projects.length}
          addLabel="Add a project"
          extraAction={<ProjectPaste writer={writer} lists={lists} />}
          describe={(row) => ({
            title: row.name,
            meta: `${row.kind} · ${row.year} · ${row.status} · impact ${row.impact}/100`,
          })}
          renderForm={({ entry, onClose }) => (
            <ProjectForm writer={writer} lists={lists} entry={entry} onClose={onClose} />
          )}
        />
      ) : null}

      {table === "certifications" ? (
        <EntryList
          table="certifications"
          rows={all.certifications}
          writer={writer}
          isSample={isSample("certifications")}
          sampleCount={all.certifications.length}
          addLabel="Add a certificate"
          describe={(row) => ({
            title: row.name,
            meta: `${row.issuer} · ${row.domain} · ${row.status} · issued ${row.issued}`,
          })}
          renderForm={({ entry, onClose }) => (
            <CertificationForm writer={writer} lists={lists} entry={entry} onClose={onClose} />
          )}
        />
      ) : null}

      {table === "skills" ? (
        <EntryList
          table="skills"
          rows={all.skills}
          writer={writer}
          isSample={isSample("skills")}
          sampleCount={all.skills.length}
          addLabel="Add a skill"
          describe={(row) => ({
            title: row.name,
            meta: `${row.category} · level ${row.level}/10 · since ${row.since}`,
          })}
          renderForm={({ entry, onClose }) => (
            <SkillForm
              writer={writer}
              lists={lists}
              entry={entry}
              onClose={onClose}
              onCategoryAdded={reloadLists}
            />
          )}
        />
      ) : null}
    </div>
  );
}

interface EntryListProps<T extends StoredEntry> {
  table: EntryTable;
  rows: T[];
  writer: EntryWriterValue;
  /** True while this list has never been written to. */
  isSample: boolean;
  sampleCount: number;
  addLabel: string;
  /** Sits beside the add button. Used by the project list for the paste dialog. */
  extraAction?: React.ReactNode;
  describe: (row: T) => { title: string; meta: string };
  renderForm: (args: { entry: T | null; onClose: () => void }) => React.ReactNode;
}

/**
 * One list: the rows in their published order, plus the form behind the edit
 * and add buttons. Reordering is a swap of two neighbours followed by a write
 * of the whole order, so a failed write leaves the stored order untouched.
 */
function EntryList<T extends StoredEntry>({
  table,
  rows,
  writer,
  isSample,
  sampleCount,
  addLabel,
  extraAction,
  describe,
  renderForm,
}: EntryListProps<T>) {
  const [editing, setEditing] = React.useState<{ entry: T | null } | null>(null);

  async function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;

    const next = [...rows];
    const held = next[index];
    next[index] = next[target];
    next[target] = held;

    await writer.reorderEntries(
      table,
      next.map((row) => row.id),
    );
  }

  async function remove(row: T) {
    const label = describe(row).title;
    const confirmed = window.confirm(
      `Delete "${label}"? This cannot be undone, and a deleted row does not come back.`,
    );
    if (!confirmed) return;
    await writer.removeEntry(table, row.id);
  }

  return (
    <div className="space-y-5">
      <div
        className={cn(
          "p-5 pl-7",
          isSample ? "panel-flagged" : "panel",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow flex items-center gap-2">
            {isSample ? (
              <CircleAlert className="size-3.5 text-primary" aria-hidden />
            ) : (
              <Check className="size-3.5 text-moss-300" aria-hidden />
            )}
            {isSample ? "still on the sample set" : "live on the site"}
          </p>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {rows.length} stored · {rows.filter((row) => !row.visible).length} hidden
          </span>
        </div>

        <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-muted-foreground text-pretty">
          {isSample
            ? "Nothing has been saved to this list yet, so the public page is still showing the sample rows that ship with the bundle. The first entry you save here replaces that whole set for this list alone."
            : "The public page shows exactly these rows, in this order, minus the hidden ones. Deleting every row leaves the section empty on purpose; the sample set does not come back."}
          {isSample && sampleCount === 0
            ? " The sample rows are not shown here because they live in the bundle, not in the database."
            : null}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
          {rows.length === 0 ? "no rows yet" : "published order"}
        </p>
        <Button size="sm" onClick={() => setEditing({ entry: null })} disabled={writer.busy}>
          {addLabel}
          <Plus aria-hidden />
        </Button>
        {extraAction}
      </div>

      {rows.length === 0 ? (
        <div className="panel p-6">
          <p className="text-[13px] leading-relaxed text-muted-foreground text-pretty">
            This list is empty. Adding a row here is what takes the page off the sample set.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row, index) => (
            <li
              key={row.id}
              className={cn("panel p-4", !row.visible && "opacity-70")}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-display text-[15px] font-medium tracking-tight">
                      {describe(row).title}
                    </span>
                    {row.visible ? null : (
                      <Badge variant="muted" size="sm">
                        hidden
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-muted-foreground">
                    {describe(row).meta}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void move(index, -1)}
                    disabled={writer.busy || index === 0}
                    aria-label={`Move ${describe(row).title} up`}
                  >
                    <ArrowUp aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void move(index, 1)}
                    disabled={writer.busy || index === rows.length - 1}
                    aria-label={`Move ${describe(row).title} down`}
                  >
                    <ArrowDown aria-hidden />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void writer.setVisible(table, row.id, !row.visible)}
                    disabled={writer.busy}
                  >
                    {row.visible ? "Hide" : "Show"}
                    {row.visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing({ entry: row })}
                    disabled={writer.busy}
                  >
                    Edit
                    <Pencil aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void remove(row)}
                    disabled={writer.busy}
                    aria-label={`Delete ${describe(row).title}`}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogTitle>{editing?.entry ? "Edit the row" : addLabel}</DialogTitle>
          <DialogDescription>
            {editing?.entry
              ? "Saving replaces the stored row. The site reads it on the next load."
              : "A new row goes live as soon as it is saved, unless you switch it off first."}
          </DialogDescription>

          <div className="mt-6">
            {editing ? renderForm({ entry: editing.entry, onClose: () => setEditing(null) }) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface EntryFormProps<T> {
  writer: EntryWriterValue;
  lists: ValueLists;
  entry: T | null;
  onClose: () => void;
}

function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

/**
 * The fields that are not worth a scroll every time.
 *
 * A project row has eleven numbers and three free text boxes, and most visits
 * here only touch the name, the year, and the score. The rest sit behind one
 * click so the dialog opens on the short version. They are translated into a
 * full width cell of their own grid, which keeps the same two column rhythm
 * as the fields above without repeating every col-span.
 */
function FoldedFields({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="sm:col-span-2">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-notch border border-border bg-background/40 px-3.5 py-2.5 text-left transition-colors hover:bg-muted"
      >
        {open ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        )}
        <span className="font-mono text-[12px] uppercase tracking-[0.1em]">More fields</span>
        <span className="font-mono text-[10px] text-muted-foreground">
          role, location, months, team, stack, featured
        </span>
      </button>

      {open ? <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div> : null}
    </div>
  );
}

function FormActions({
  busy,
  onCancel,
  label,
}: {
  busy: boolean;
  onCancel: () => void;
  label: string;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
      <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={busy}>
        Cancel
      </Button>
      <Button type="submit" size="sm" disabled={busy}>
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
        {label}
      </Button>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  wide,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  wide?: boolean;
}) {
  return (
    <label className={cn("block", wide && "sm:col-span-2")}>
      <FieldLabel>{label}</FieldLabel>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5"
      />
      {hint ? <FieldHint>{hint}</FieldHint> : null}
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  hint,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  rows?: number;
}) {
  return (
    <label className="block sm:col-span-2">
      <FieldLabel>{label}</FieldLabel>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(FIELD, "mt-1.5 resize-y")}
      />
      {hint ? <FieldHint>{hint}</FieldHint> : null}
    </label>
  );
}

/** A yyyy-mm field. An empty value is a real state, not a missing one. */
function MonthField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <Input
        value={value}
        placeholder="2024-06"
        inputMode="numeric"
        onChange={(event) => onChange(event.target.value.trim())}
        className="mt-1.5"
      />
      {hint ? <FieldHint>{hint}</FieldHint> : null}
    </label>
  );
}

/**
 * Start and end month as one control, with a present toggle.
 *
 * The data model keeps "still running" as a null end, which is what the public
 * pages test for, so the toggle is the only way to set that state. Typing a
 * month into the end box clears it again.
 */
function MonthRangeField({
  start,
  end,
  onStartChange,
  onEndChange,
  hint,
}: {
  start: string;
  end: string | null;
  onStartChange: (value: string) => void;
  onEndChange: (value: string | null) => void;
  hint?: string;
}) {
  const ongoing = end === null;

  return (
    <div className="block sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FieldLabel>Period</FieldLabel>
        <Button
          type="button"
          variant={ongoing ? "outline" : "ghost"}
          size="sm"
          onClick={() => onEndChange(ongoing ? "" : null)}
          aria-pressed={ongoing}
          className="h-7 gap-1.5 px-2.5 font-mono text-[11px] uppercase tracking-[0.08em]"
        >
          {ongoing ? (
            <Check aria-hidden className="size-3.5" />
          ) : (
            <CalendarClock aria-hidden className="size-3.5" />
          )}
          Still here
        </Button>
      </div>

      <div className="mt-1.5 grid gap-3 sm:grid-cols-2">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground/80">
            Start
          </span>
          <Input
            value={start}
            placeholder="2024-06"
            inputMode="numeric"
            onChange={(event) => onStartChange(event.target.value.trim())}
            className="mt-1"
          />
        </div>
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground/80">
            End
          </span>
          {ongoing ? (
            <div className="mt-1 flex h-10 items-center rounded-notch border border-dashed border-primary/40 bg-primary/5 px-3 font-mono text-[13px] text-primary">
              Present
            </div>
          ) : (
            <Input
              value={end ?? ""}
              placeholder="2025-03"
              inputMode="numeric"
              onChange={(event) => {
                const next = event.target.value.trim();
                onEndChange(next === "" ? null : next);
              }}
              className="mt-1"
            />
          )}
        </div>
      </div>

      <FieldHint>
        {ongoing
          ? "Shown as Present on the site. Press Still here again to type an end month."
          : hint ?? "Both months use yyyy-mm. Press Still here if the role is ongoing."}
      </FieldHint>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        value={String(value)}
        onChange={(event) => onChange(event.target.value === "" ? 0 : Number(event.target.value))}
        className="mt-1.5"
      />
      {hint ? <FieldHint>{hint}</FieldHint> : null}
    </label>
  );
}

/** Levels are picked on a bar, not typed. Ten bars, ten being the strongest. */
const LEVEL_SCALE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function ScaleField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
}) {
  const bars = LEVEL_SCALE.length;

  return (
    <div className="block">
      <FieldLabel>{label}</FieldLabel>
      <div
        role="group"
        aria-label={label}
        className="mt-1.5 flex w-full items-end gap-1.5 rounded-notch border border-input bg-background/60 px-3 py-2.5"
      >
        {LEVEL_SCALE.map((step) => (
          <button
            key={step}
            type="button"
            aria-pressed={value === step}
            onClick={() => onChange(step)}
            style={{ height: `${0.9 + step * 0.34}rem` }}
            className={cn(
              "flex-1 rounded-sm border transition-colors duration-200 focus-visible:outline-none " +
                "focus-visible:ring-2 focus-visible:ring-primary/35",
              step <= value
                ? "border-primary/60 bg-primary"
                : "border-input bg-foreground/5 hover:bg-foreground/15",
            )}
          >
            <span className="sr-only">{`Level ${step} of ${bars}`}</span>
          </button>
        ))}
        <span className="ml-1 w-10 shrink-0 text-right font-mono text-[13px] text-foreground">
          {value}/{bars}
        </span>
      </div>
      {hint ? <FieldHint>{hint}</FieldHint> : null}
    </div>
  );
}

/** The category list, with a way to add to it without leaving the form. */
function CategoryField({
  label,
  value,
  onChange,
  options,
  onAdd,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  onAdd: (name: string) => Promise<boolean>;
  hint?: string;
}) {
  const [adding, setAdding] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function commit() {
    const name = draft.trim();
    if (name.length === 0) return;

    setBusy(true);
    setError(null);
    const ok = await onAdd(name);
    setBusy(false);

    if (ok) {
      onChange(name);
      setDraft("");
      setAdding(false);
      return;
    }

    setError(`"${name}" was not added. It may already be on the list.`);
  }

  return (
    <div className="block">
      <div className="flex items-center justify-between gap-2">
        <FieldLabel>{label}</FieldLabel>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-pressed={adding}
          onClick={() => {
            setAdding((current) => !current);
            setError(null);
          }}
        >
          {adding ? "Close" : "Add a category"}
          {adding ? <X aria-hidden /> : <Plus aria-hidden />}
        </Button>
      </div>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1.5">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {adding ? (
        <div className="mt-2 rounded-notch border border-dashed border-input p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void commit();
                }
              }}
              placeholder="New category"
              aria-label="New category"
              maxLength={80}
              className="min-w-[12rem] flex-1"
            />
            <Button type="button" size="sm" disabled={busy || draft.trim().length === 0} onClick={() => void commit()}>
              {busy ? "Adding" : "Add"}
            </Button>
          </div>
          <FieldHint>
            Added categories join the list for every skill, and show up on the public page as their
            own group.
          </FieldHint>
          {error ? <PanelMessage>{error}</PanelMessage> : null}
        </div>
      ) : null}

      {hint ? <FieldHint>{hint}</FieldHint> : null}
    </div>
  );
}

/** One item per line. The raw text is kept so a blank line does not vanish mid typing. */
function ListField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  hint?: string;
}) {
  const [text, setText] = React.useState(() => value.join("\n"));

  return (
    <label className="block sm:col-span-2">
      <FieldLabel>{label}</FieldLabel>
      <textarea
        rows={4}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          onChange(
            event.target.value
              .split("\n")
              .map((line) => line.trim())
              .filter((line) => line.length > 0),
          );
        }}
        className={cn(FIELD, "mt-1.5 resize-y")}
      />
      {hint ? <FieldHint>{hint}</FieldHint> : null}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  hint?: string;
}) {
  // A stored value that is no longer in the list still has to be selectable,
  // otherwise opening the form would silently rewrite it on save.
  const all = options.includes(value) ? options : [value, ...options];

  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1.5">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {all.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint ? <FieldHint>{hint}</FieldHint> : null}
    </label>
  );
}

/** The visible switch. Shown as a button so its state is impossible to miss. */
function VisibilityField({
  visible,
  onChange,
}: {
  visible: boolean;
  onChange: (visible: boolean) => void;
}) {
  return (
    <div className="sm:col-span-2">
      <FieldLabel>Visibility</FieldLabel>
      <Button
        type="button"
        variant={visible ? "outline" : "solid"}
        size="sm"
        onClick={() => onChange(!visible)}
        aria-pressed={visible}
        className="mt-1.5"
      >
        {visible ? "Shown on the site" : "Hidden from the site"}
        {visible ? <Eye aria-hidden /> : <EyeOff aria-hidden />}
      </Button>
      <FieldHint>
        Hiding keeps the row and its history. It only stops the public page from reading it.
      </FieldHint>
    </div>
  );
}

/** A one line note under a field, for a failure the form caught itself. */
function PanelMessage({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mt-1.5 font-mono text-[11px] leading-relaxed text-destructive">
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
      {children}
    </span>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-muted-foreground">{children}</p>
  );
}

function CareerForm({ writer, lists, entry, onClose }: EntryFormProps<CareerEntry>) {
  const [form, setForm] = React.useState<CareerInput>(() => ({
    id: entry?.id,
    sortOrder: entry?.sortOrder,
    title: entry?.title ?? "",
    company: entry?.company ?? "",
    sector: entry?.sector ?? "",
    location: entry?.location ?? "",
    start: entry?.start ?? "",
    end: entry?.end ?? null,
    level: entry?.level ?? "IC",
    headcount: entry?.headcount ?? 0,
    summary: entry?.summary ?? "",
    highlights: entry?.highlights ?? [],
    stack: entry?.stack ?? [],
    visible: entry?.visible ?? true,
  }));

  function set<K extends keyof CareerInput>(key: K, value: CareerInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const id = await writer.saveCareer(form);
    if (id) onClose();
  }

  return (
    <form onSubmit={submit}>
      <FormGrid>
        <TextField label="Job title" value={form.title} onChange={(v) => set("title", v)} />
        <TextField label="Company" value={form.company} onChange={(v) => set("company", v)} />
        <TextField
          label="Sector"
          value={form.sector}
          onChange={(v) => set("sector", v)}
          placeholder="Multi-site Retail"
        />
        <TextField
          label="Location"
          value={form.location}
          onChange={(v) => set("location", v)}
          placeholder="Jakarta"
        />
        <MonthRangeField
          start={form.start}
          end={form.end}
          onStartChange={(v) => set("start", v)}
          onEndChange={(v) => set("end", v)}
          hint="Start month is required. Both use yyyy-mm."
        />
        <SelectField
          label="Level"
          value={form.level}
          onChange={(v) => set("level", v as CareerInput["level"])}
          options={lists.levels}
        />
        <NumberField
          label="People led"
          value={form.headcount}
          onChange={(v) => set("headcount", v)}
          min={0}
          max={500}
          hint="Direct reports, not the whole department."
        />
        <TextAreaField
          label="Summary"
          value={form.summary}
          onChange={(v) => set("summary", v)}
        />
        <ListField
          label="Highlights"
          value={form.highlights}
          onChange={(v) => set("highlights", v)}
          hint="One per line. Write what changed, not what you were responsible for."
        />
        <ListField label="Working stack" value={form.stack} onChange={(v) => set("stack", v)} />
        <VisibilityField visible={form.visible} onChange={(v) => set("visible", v)} />
      </FormGrid>

      <FormActions busy={writer.busy} onCancel={onClose} label={entry ? "Save changes" : "Save entry"} />
    </form>
  );
}

/**
 * The photos attached to one project, with the words that go under them.
 *
 * Same two step write as a certificate scan: the object lands in the bucket
 * first, then the row that points at it. A refused row takes its object with
 * it. The caption is a separate, smaller write, so fixing a typo under a
 * picture never touches the file itself.
 *
 * Only pictures are accepted here. A project gallery has no viewer for a
 * document, so offering one would only produce a tile that cannot be read.
 */
function ProjectPhotos({ writer, projectId }: { writer: EntryWriterValue; projectId: string }) {
  const { photosFor } = useEntries();
  const photos = photosFor(projectId);

  const [uploading, setUploading] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function upload(files: File[]) {
    const client = supabase;
    if (!client || files.length === 0) return;

    setUploading(true);
    setNotice(null);

    const refused: string[] = [];

    for (const file of files) {
      if (!PHOTO_TYPES.includes(file.type)) {
        refused.push(`${file.name} is not a ${PHOTO_LABEL}.`);
        continue;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        refused.push(`${file.name} is larger than ${MAX_UPLOAD_LABEL}.`);
        continue;
      }

      const extension = safeExtension(file.name) ?? fallbackExtension(file.type);
      const path = `projects/${projectId}/${crypto.randomUUID()}.${extension}`;
      const { error } = await client.storage
        .from(MEDIA_BUCKET)
        .upload(path, file, { contentType: file.type, cacheControl: "31536000" });

      if (error) {
        refused.push(`${file.name} did not upload: ${error.message}`);
        continue;
      }

      const size = await readImageSize(file);
      const attached = await writer.addProjectPhoto({
        projectId,
        storagePath: path,
        caption: "",
        mimeType: file.type,
        width: size.width > 0 ? size.width : null,
        height: size.height > 0 ? size.height : null,
        byteSize: file.size,
      });

      if (!attached) {
        await client.storage.from(MEDIA_BUCKET).remove([path]);
        refused.push(`${file.name} was stored but not recorded, so it was deleted again.`);
      }
    }

    setUploading(false);
    if (refused.length > 0) setNotice(refused.join(" "));
  }

  async function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= photos.length) return;

    const next = [...photos];
    const held = next[index];
    next[index] = next[target];
    next[target] = held;

    await writer.reorderProjectPhotos(
      projectId,
      next.map((photo) => photo.id),
    );
  }

  async function remove(index: number) {
    const photo = photos[index];
    const confirmed = window.confirm(
      `Remove photo ${index + 1} of ${photos.length}? The file is deleted from storage as well.`,
    );
    if (!confirmed) return;
    await writer.removeProjectPhoto(photo.id, photo.storagePath);
  }

  const busy = uploading || writer.busy;

  return (
    <div className="sm:col-span-2">
      <FieldLabel>Photos</FieldLabel>

      <div className="mt-1.5 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={PHOTO_TYPES.join(",")}
          multiple
          className="sr-only"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            void upload(files);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {uploading ? <Loader2 className="animate-spin" aria-hidden /> : <ImagePlus aria-hidden />}
          {uploading ? "Uploading" : "Add photos"}
        </Button>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {photos.length === 0 ? "no photos yet" : `${photos.length} attached`}
        </span>
      </div>

      <FieldHint>
        Pick several at once and they upload one after another. {PHOTO_LABEL}, up to{" "}
        {MAX_UPLOAD_LABEL} each. The detail dialog shows them in this order, and the words you
        type under each one appear with the picture.
      </FieldHint>

      {notice ? (
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-destructive">{notice}</p>
      ) : null}

      {photos.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {photos.map((photo, index) => (
            <li
              key={photo.id}
              className="flex items-start gap-3 rounded-notch border border-border bg-background/40 p-2"
            >
              <img
                src={photo.url}
                alt=""
                loading="lazy"
                className="size-14 shrink-0 rounded-[3px] border border-border object-cover"
              />
              <div className="min-w-0 flex-1">
                <PhotoCaption
                  key={`${photo.id}:${photo.caption}`}
                  caption={photo.caption}
                  disabled={busy}
                  onSave={(next) => writer.setProjectPhotoCaption(photo.id, next)}
                />
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")} · {photo.storagePath.split("/").pop()}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void move(index, -1)}
                  disabled={busy || index === 0}
                  aria-label={`Move photo ${index + 1} up`}
                >
                  <ArrowUp aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void move(index, 1)}
                  disabled={busy || index === photos.length - 1}
                  aria-label={`Move photo ${index + 1} down`}
                >
                  <ArrowDown aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void remove(index)}
                  disabled={busy}
                  aria-label={`Remove photo ${index + 1}`}
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * The words under one photo, saved on blur or Enter.
 *
 * It keeps its own draft so typing does not fire a write per keystroke, and it
 * is remounted with the stored caption as its key, so a save that lands
 * somewhere else cannot leave this box showing a value the row does not hold.
 */
function PhotoCaption({
  caption,
  disabled,
  onSave,
}: {
  caption: string;
  disabled: boolean;
  onSave: (caption: string) => Promise<boolean>;
}) {
  const [draft, setDraft] = React.useState(caption);
  const [saving, setSaving] = React.useState(false);

  async function commit() {
    const next = draft.trim();
    if (next === caption || saving) return;
    setSaving(true);
    await onSave(next);
    setSaving(false);
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={draft}
        disabled={disabled || saving}
        placeholder="Words for this photo"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void commit();
          }
        }}
        className="h-8 font-mono text-[12px]"
      />
      {saving ? <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" aria-hidden /> : null}
    </div>
  );
}

/**
 * The line on the budget chart, set by hand one year at a time.
 *
 * The chart can work this out from the projects, and that is what it does when
 * this list is empty. What it cannot do is show a shape the owner wants but the
 * rows do not produce, which is the whole point of typing the points in here.
 * "Fill from projects" is offered as a starting point rather than a default, so
 * the numbers on screen are never presented as something they are not.
 */
function ProjectCurveEditor({ writer }: { writer: EntryWriterValue }) {
  const { curve, projects } = useEntries();
  const [rows, setRows] = React.useState<ProjectCurvePoint[]>(() => [...curve]);

  const dirty =
    rows.length !== curve.length ||
    rows.some((row, index) => {
      const stored = curve[index];
      return (
        !stored || row.year !== stored.year || row.budgetM !== stored.budgetM || row.impact !== stored.impact
      );
    });

  function setRow(index: number, key: keyof ProjectCurvePoint, value: number) {
    setRows((current) =>
      current.map((row, position) => (position === index ? { ...row, [key]: value } : row)),
    );
  }

  function addRow() {
    setRows((current) => {
      const last = current[current.length - 1];
      const year = last ? last.year + 1 : new Date().getFullYear();
      return [...current, { year, budgetM: 0, impact: 0 }];
    });
  }

  function fillFromProjects() {
    const map = new Map<number, { budget: number; impact: number[] }>();
    projects.forEach((project) => {
      const held = map.get(project.year) ?? { budget: 0, impact: [] };
      held.budget += project.budgetM;
      held.impact.push(project.impact);
      map.set(project.year, held);
    });

    setRows(
      [...map.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([year, held]) => ({
          year,
          budgetM: Math.round(held.budget * 10) / 10,
          impact: Math.round(held.impact.reduce((a, b) => a + b, 0) / held.impact.length),
        })),
    );
  }

  /**
   * The rows are put in year order before they go out, and the local copy is
   * replaced with the same order. The chart sorts them anyway, but without
   * this the form would keep claiming it holds unsaved changes.
   */
  async function save() {
    const sorted = [...rows].sort((a, b) => a.year - b.year);
    const saved = await writer.saveProjectCurve(sorted);
    if (saved) setRows(sorted);
  }

  async function clear() {
    const cleared = await writer.saveProjectCurve([]);
    if (cleared) setRows([]);
  }

  const busy = writer.busy;

  return (
    <div className="sm:col-span-2">
      <FieldLabel>Chart line</FieldLabel>
      <FieldHint>
        One point per year: the bar is the total budget in millions of rupiah, the line is the
        impact score out of 100. Leave this empty and the chart works both out from the projects
        above instead.
      </FieldHint>

      {rows.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {rows.map((row, index) => (
            <li key={index} className="flex flex-wrap items-end gap-2">
              <label className="w-24">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                  Year
                </span>
                <Input
                  type="number"
                  value={row.year}
                  disabled={busy}
                  onChange={(event) => setRow(index, "year", Number(event.target.value))}
                  className="mt-1 h-8 font-mono text-[12px] tabular-nums"
                />
              </label>
              <label className="w-32">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                  Budget (M)
                </span>
                <Input
                  type="number"
                  step={0.1}
                  value={row.budgetM}
                  disabled={busy}
                  onChange={(event) => setRow(index, "budgetM", Number(event.target.value))}
                  className="mt-1 h-8 font-mono text-[12px] tabular-nums"
                />
              </label>
              <label className="w-28">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                  Impact
                </span>
                <Input
                  type="number"
                  value={row.impact}
                  disabled={busy}
                  onChange={(event) => setRow(index, "impact", Number(event.target.value))}
                  className="mt-1 h-8 font-mono text-[12px] tabular-nums"
                />
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRows((current) => current.filter((_, position) => position !== index))}
                disabled={busy}
                aria-label={`Remove the ${row.year} point`}
              >
                <Trash2 aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 font-mono text-[11px] text-muted-foreground">
          No hand set line. The chart is using the projects above.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={busy}>
          Add a year
          <Plus aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={fillFromProjects}
          disabled={busy || projects.length === 0}
        >
          Fill from projects
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => void save()}
          disabled={busy || !dirty}
        >
          {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
          Save the line
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void clear()}
          disabled={busy || curve.length === 0}
        >
          Clear, back to computed
        </Button>
      </div>
    </div>
  );
}

/**
 * Many projects at once, pasted as lines of text.
 *
 * Typing twelve rows into twelve dialogs is the slow part of keeping this page
 * current, and the numbers usually arrive as a table from somewhere else. The
 * columns are positional and the separator is a tab, a comma, or a pipe, so a
 * copy out of a spreadsheet works without being reformatted first. Every line
 * is shown as it was understood before anything is written, because a silent
 * misread row is worse than a refusal.
 */
interface PastedProject {
  name: string;
  kind: ProjectInput["kind"];
  status: ProjectInput["status"];
  role: string;
  location: string;
  year: number;
  months: number;
  teamSize: number;
  budgetM: number;
  impact: number;
  summary: string;
  stack: string[];
}

const PASTE_COLUMNS = [
  "name",
  "kind",
  "status",
  "role",
  "year",
  "months",
  "teamSize",
  "budgetM",
  "impact",
  "location",
  "summary",
  "stack",
] as const;

const PASTE_TEMPLATE =
  "Operations Data Warehouse\tInternal Systems\tactive\tData Lead\t2024\t14\t6\t2400\t78\tJakarta\tWarehouse and BI layer for daily operations\tBigQuery, dbt, Looker";

function parsePastedProjects(
  raw: string,
  lists: ValueLists,
): { rows: PastedProject[]; problems: string[] } {
  const rows: PastedProject[] = [];
  const problems: string[] = [];

  pastedLines(raw).forEach(({ lineNumber, cells }) => {
    const held: Record<string, string> = {};
    PASTE_COLUMNS.forEach((column, position) => {
      held[column] = cells[position] ?? "";
    });

    if (held.name.length === 0) {
      problems.push(`Line ${lineNumber}: no name, so it was skipped.`);
      return;
    }

    const year = pastedNumber(held.year);
    if (year === null || year < 1980 || year > 2100) {
      problems.push(
        `Line ${lineNumber}: ${
          held.year.length === 0 ? "no year was given" : `"${held.year}" is not a year`
        } between 1980 and 2100, so it was skipped.`,
      );
      return;
    }

    const numbers: Record<string, number> = {};
    for (const column of ["months", "teamSize", "budgetM", "impact"] as const) {
      const cell = held[column];
      // A blank count is a real answer: no months recorded, nobody else on it.
      const parsed = cell.length === 0 ? 0 : pastedNumber(cell);
      if (parsed === null || parsed < 0) {
        problems.push(`Line ${lineNumber}: "${cell}" is not a number for ${column}.`);
        return;
      }
      numbers[column] = parsed;
    }

    // The list comes from the database, so a kind that is not in the union
    // is still a valid row. The form casts the same way when one is picked.
    const kind = (lists.kinds.find(
      (option) => option.toLowerCase() === held.kind.toLowerCase(),
    ) ??
      (held.kind.length > 0 ? held.kind : "Internal Systems")) as ProjectInput["kind"];
    const status = STATUS_OPTIONS.find(
      (option) => option.toLowerCase() === held.status.toLowerCase(),
    );

    if (held.status.length > 0 && !status) {
      problems.push(
        `Line ${lineNumber}: "${held.status}" is not a status, so it was saved as active.`,
      );
    }

    rows.push({
      name: held.name,
      kind,
      status: status ?? "active",
      role: held.role,
      location: held.location,
      year,
      months: numbers.months,
      teamSize: numbers.teamSize,
      budgetM: numbers.budgetM,
      impact: Math.min(100, numbers.impact),
      summary: held.summary,
      stack: held.stack
        .split(/[;,]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    });
  });

  return { rows, problems };
}

function ProjectPaste({ writer, lists }: { writer: EntryWriterValue; lists: ValueLists }) {
  const [open, setOpen] = React.useState(false);
  const [raw, setRaw] = React.useState("");
  const [running, setRunning] = React.useState(false);
  const [report, setReport] = React.useState<string | null>(null);

  const parsed = React.useMemo(() => parsePastedProjects(raw, lists), [raw, lists]);

  async function importAll() {
    if (parsed.rows.length === 0) return;
    setRunning(true);
    setReport(null);

    let saved = 0;
    const refused: string[] = [];

    for (const row of parsed.rows) {
      const id = await writer.saveProject({
        ...row,
        featured: false,
        visible: true,
      });
      if (id) saved += 1;
      else refused.push(row.name);
    }

    setRunning(false);
    setReport(
      refused.length === 0
        ? `${saved} projects saved.`
        : `${saved} saved. Refused: ${refused.join(", ")}.`,
    );
    if (refused.length === 0) {
      setRaw("");
      setOpen(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setReport(null);
      }}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={writer.busy}
      >
        Paste many
        <ChevronRight aria-hidden />
      </Button>
      <DialogContent>
        <DialogTitle>Paste projects</DialogTitle>
        <DialogDescription>
          One project per line, columns separated by a tab, a comma, or a pipe. Copying straight
          out of a spreadsheet works.
        </DialogDescription>

        <p className="mt-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
          {PASTE_COLUMNS.join(" · ")}
        </p>
        <FieldHint>
          Only the name and the year are required. Blank numbers count as zero, a blank status
          becomes active, and the stack is split on commas or semicolons.
        </FieldHint>

        <textarea
          rows={8}
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          placeholder={PASTE_TEMPLATE}
          className={cn(FIELD, "mt-3 resize-y")}
        />

        {parsed.problems.length > 0 ? (
          <ul className="mt-3 space-y-1">
            {parsed.problems.map((problem) => (
              <li key={problem} className="font-mono text-[11px] leading-relaxed text-destructive">
                {problem}
              </li>
            ))}
          </ul>
        ) : null}

        {parsed.rows.length > 0 ? (
          <div className="mt-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              {parsed.rows.length} ready to save
            </p>
            <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
              {parsed.rows.map((row, index) => (
                <li
                  key={`${row.name}:${index}`}
                  className="flex items-baseline justify-between gap-3 rounded-notch border border-border bg-background/40 px-3 py-2"
                >
                  <span className="min-w-0 flex-1 truncate text-[12px]">{row.name}</span>
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {row.year} · {row.kind} · impact {row.impact}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {report ? (
          <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted-foreground">{report}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => void importAll()}
            disabled={running || parsed.rows.length === 0}
          >
            {running ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
            {running ? "Saving" : `Save ${parsed.rows.length} projects`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProjectForm({ writer, lists, entry, onClose }: EntryFormProps<ProjectEntry>) {
  const [form, setForm] = React.useState<ProjectInput>(() => ({
    id: entry?.id,
    sortOrder: entry?.sortOrder,
    name: entry?.name ?? "",
    kind: entry?.kind ?? "Internal Systems",
    status: entry?.status ?? "active",
    role: entry?.role ?? "",
    year: entry?.year ?? new Date().getFullYear(),
    months: entry?.months ?? 0,
    teamSize: entry?.teamSize ?? 0,
    budgetM: entry?.budgetM ?? 0,
    impact: entry?.impact ?? 0,
    stack: entry?.stack ?? [],
    summary: entry?.summary ?? "",
    location: entry?.location ?? "",
    featured: entry?.featured ?? false,
    visible: entry?.visible ?? true,
  }));

  function set<K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const id = await writer.saveProject(form);
    if (id) onClose();
  }

  return (
    <form onSubmit={submit}>
      <FormGrid>
        <TextField
          label="Project name"
          value={form.name}
          onChange={(v) => set("name", v)}
          wide
        />
        <SelectField
          label="Kind"
          value={form.kind}
          onChange={(v) => set("kind", v as ProjectInput["kind"])}
          options={lists.kinds}
        />
        <SelectField
          label="Status"
          value={form.status}
          onChange={(v) => set("status", v as ProjectInput["status"])}
          options={STATUS_OPTIONS}
        />
        <NumberField
          label="Year"
          value={form.year}
          onChange={(v) => set("year", v)}
          min={1980}
          max={2100}
        />
        <NumberField
          label="Budget"
          value={form.budgetM}
          onChange={(v) => set("budgetM", v)}
          min={0}
          step={0.1}
          hint="In millions of rupiah. Use 0 when there was no budget to own."
        />
        <NumberField
          label="Impact score"
          value={form.impact}
          onChange={(v) => set("impact", v)}
          min={0}
          max={100}
          hint="Your own rubric, out of 100. It is presented as a claim, not an audit."
        />
        <TextAreaField label="Summary" value={form.summary} onChange={(v) => set("summary", v)} />
        <VisibilityField visible={form.visible} onChange={(v) => set("visible", v)} />

        <FoldedFields>
          <TextField label="Your role" value={form.role} onChange={(v) => set("role", v)} />
          <TextField
            label="Location"
            value={form.location}
            onChange={(v) => set("location", v)}
            placeholder="Jakarta & 34 stores"
          />
          <NumberField
            label="Months"
            value={form.months}
            onChange={(v) => set("months", v)}
            min={0}
            max={600}
          />
          <NumberField
            label="Team size"
            value={form.teamSize}
            onChange={(v) => set("teamSize", v)}
            min={0}
            max={500}
          />
          <ListField label="Working stack" value={form.stack} onChange={(v) => set("stack", v)} />

          <div>
            <FieldLabel>Featured</FieldLabel>
            <Button
              type="button"
              variant={form.featured ? "outline" : "solid"}
              size="sm"
              onClick={() => set("featured", !form.featured)}
              aria-pressed={form.featured}
              className="mt-1.5"
            >
              {form.featured ? "Featured on the home page" : "Not featured"}
            </Button>
            <FieldHint>Featured projects are the ones the home page leads with.</FieldHint>
          </div>
        </FoldedFields>

        {entry ? (
          <ProjectPhotos writer={writer} projectId={entry.id} />
        ) : (
          <div className="sm:col-span-2">
            <FieldLabel>Photos</FieldLabel>
            <FieldHint>
              Save the project first. A photo hangs off a stored row, so this form has nothing to
              attach one to yet. Reopen the row to upload.
            </FieldHint>
          </div>
        )}

        <ProjectCurveEditor writer={writer} />
      </FormGrid>

      <FormActions busy={writer.busy} onCancel={onClose} label={entry ? "Save changes" : "Save project"} />
    </form>
  );
}

/**
 * The scans attached to one certificate.
 *
 * A scan is two writes: the object goes to the storage bucket first, then the
 * row that points at it. If the row is refused the object is deleted again, so
 * a rejected upload does not leave an orphan behind. Removing a scan is the
 * reverse, and the row is the part that matters: a file that outlives its row
 * shows nowhere.
 */
function CertificateScans({
  writer,
  certificationId,
}: {
  writer: EntryWriterValue;
  certificationId: string;
}) {
  const { scansFor } = useEntries();
  const scans = scansFor(certificationId);

  const [uploading, setUploading] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function upload(files: File[]) {
    const client = supabase;
    if (!client || files.length === 0) return;

    setUploading(true);
    setNotice(null);

    const refused: string[] = [];

    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        refused.push(`${file.name} is not a ${ACCEPTED_LABEL}.`);
        continue;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        refused.push(`${file.name} is larger than ${MAX_UPLOAD_LABEL}.`);
        continue;
      }

      const isPdf = file.type === "application/pdf";
      const extension = safeExtension(file.name) ?? fallbackExtension(file.type);
      const path = `certificates/${certificationId}/${crypto.randomUUID()}.${extension}`;
      const { error } = await client.storage
        .from(MEDIA_BUCKET)
        .upload(path, file, { contentType: file.type, cacheControl: "31536000" });

      if (error) {
        refused.push(`${file.name} did not upload: ${error.message}`);
        continue;
      }

      // A document has no pixel dimensions to record.
      const size = isPdf ? null : await readImageSize(file);
      const attached = await writer.addImage({
        certificationId,
        storagePath: path,
        caption: "",
        mimeType: file.type,
        width: size && size.width > 0 ? size.width : null,
        height: size && size.height > 0 ? size.height : null,
        byteSize: file.size,
      });

      if (!attached) {
        // No row points at the object, so nothing will ever show it.
        await client.storage.from(MEDIA_BUCKET).remove([path]);
        refused.push(`${file.name} was stored but not recorded, so it was deleted again.`);
      }
    }

    setUploading(false);
    if (refused.length > 0) setNotice(refused.join(" "));
  }

  async function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= scans.length) return;

    const next = [...scans];
    const held = next[index];
    next[index] = next[target];
    next[target] = held;

    await writer.reorderImages(
      certificationId,
      next.map((scan) => scan.id),
    );
  }

  async function remove(index: number) {
    const scan = scans[index];
    const confirmed = window.confirm(
      `Remove scan ${index + 1} of ${scans.length}? The file is deleted from storage as well.`,
    );
    if (!confirmed) return;
    await writer.removeImage(scan.id, scan.storagePath);
  }

  const busy = uploading || writer.busy;

  return (
    <div className="sm:col-span-2">
      <FieldLabel>Scans</FieldLabel>

      <div className="mt-1.5 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          multiple
          className="sr-only"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            void upload(files);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {uploading ? <Loader2 className="animate-spin" aria-hidden /> : <ImagePlus aria-hidden />}
          {uploading ? "Uploading" : "Add scans"}
        </Button>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {scans.length === 0 ? "no scans yet" : `${scans.length} attached`}
        </span>
      </div>

      <FieldHint>
        {ACCEPTED_LABEL}, up to {MAX_UPLOAD_LABEL} each. The credentials page shows them in a
        slideshow, in this order; a PDF opens as a document inside the viewer.
      </FieldHint>

      {notice ? (
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-destructive">{notice}</p>
      ) : null}

      {scans.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {scans.map((scan, index) => (
            <li
              key={scan.id}
              className="flex items-center gap-3 rounded-notch border border-border bg-background/40 p-2"
            >
              {scan.mimeType === "application/pdf" ? (
                // A PDF cannot be previewed as an <img>, so the row shows the
                // type rather than a broken thumbnail.
                <span
                  aria-hidden
                  className="grid size-14 shrink-0 place-items-center rounded-[3px] border border-border bg-muted/40 text-muted-foreground"
                >
                  <FileText className="size-5" />
                </span>
              ) : (
                <img
                  src={scan.url}
                  alt=""
                  loading="lazy"
                  className="size-14 shrink-0 rounded-[3px] border border-border object-cover"
                />
              )}
              <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground">
                {String(index + 1).padStart(2, "0")} · {scan.storagePath.split("/").pop()}
                {scan.mimeType === "application/pdf" ? " · pdf" : ""}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void move(index, -1)}
                disabled={busy || index === 0}
                aria-label={`Move scan ${index + 1} up`}
              >
                <ArrowUp aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void move(index, 1)}
                disabled={busy || index === scans.length - 1}
                aria-label={`Move scan ${index + 1} down`}
              >
                <ArrowDown aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void remove(index)}
                disabled={busy}
                aria-label={`Remove scan ${index + 1}`}
              >
                <Trash2 aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function CertificationForm({
  writer,
  lists,
  entry,
  onClose,
}: EntryFormProps<CertificationEntry>) {
  const [form, setForm] = React.useState<CertificationInput>(() => ({
    id: entry?.id,
    sortOrder: entry?.sortOrder,
    name: entry?.name ?? "",
    issuer: entry?.issuer ?? "",
    domain: entry?.domain ?? "Cloud & Infra",
    issued: entry?.issued ?? "",
    expires: entry?.expires ?? null,
    credentialId: entry?.credentialId ?? "",
    credentialUrl: entry?.credentialUrl ?? "",
    status: entry?.status ?? "active",
    cost: entry?.cost ?? 0,
    visible: entry?.visible ?? true,
  }));

  function set<K extends keyof CertificationInput>(key: K, value: CertificationInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const id = await writer.saveCertification(form);
    if (id) onClose();
  }

  return (
    <form onSubmit={submit}>
      <FormGrid>
        <TextField
          label="Certificate name"
          value={form.name}
          onChange={(v) => set("name", v)}
          wide
        />
        <TextField label="Issuer" value={form.issuer} onChange={(v) => set("issuer", v)} />
        <SelectField
          label="Domain"
          value={form.domain}
          onChange={(v) => set("domain", v as CertificationInput["domain"])}
          options={lists.domains}
        />
        <MonthField label="Issued" value={form.issued} onChange={(v) => set("issued", v)} />
        <MonthField
          label="Expires"
          value={form.expires ?? ""}
          onChange={(v) => set("expires", v === "" ? null : v)}
          hint="Leave empty only when it genuinely never expires."
        />
        <SelectField
          label="Status"
          value={form.status}
          onChange={(v) => set("status", v as CertificationInput["status"])}
          options={CERT_STATUS_OPTIONS}
        />
        <NumberField
          label="Cost"
          value={form.cost}
          onChange={(v) => set("cost", v)}
          min={0}
          step={0.1}
          hint="In millions of rupiah. 0 is a fair answer for a free certificate."
        />
        <TextField
          label="Credential ID"
          value={form.credentialId}
          onChange={(v) => set("credentialId", v)}
        />
        <TextField
          label="Credential link"
          value={form.credentialUrl}
          onChange={(v) => set("credentialUrl", v)}
          placeholder="https://"
          hint="Must start with https:// or the database will refuse it."
        />
        <VisibilityField visible={form.visible} onChange={(v) => set("visible", v)} />

        {entry ? (
          <CertificateScans writer={writer} certificationId={entry.id} />
        ) : (
          <div className="sm:col-span-2">
            <FieldLabel>Scans</FieldLabel>
            <FieldHint>
              Save the certificate first. A scan hangs off a stored row, so this form has
              nothing to attach one to yet. Reopen the row to upload.
            </FieldHint>
          </div>
        )}
      </FormGrid>

      <FormActions
        busy={writer.busy}
        onCancel={onClose}
        label={entry ? "Save changes" : "Save certificate"}
      />
    </form>
  );
}

interface SkillFormProps extends EntryFormProps<SkillEntry> {
  /** Re-reads the shared value lists after a category is added here. */
  onCategoryAdded: () => Promise<void>;
}

function SkillForm({ writer, lists, entry, onClose, onCategoryAdded }: SkillFormProps) {
  const [form, setForm] = React.useState<SkillInput>(() => ({
    id: entry?.id,
    sortOrder: entry?.sortOrder,
    name: entry?.name ?? "",
    category: entry?.category ?? lists.categories[0] ?? "Engineering",
    level: entry?.level ?? 3,
    years: entry?.years ?? 0,
    since: entry?.since ?? new Date().getFullYear(),
    evidence: entry?.evidence ?? [],
    visible: entry?.visible ?? true,
  }));

  function set<K extends keyof SkillInput>(key: K, value: SkillInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function addCategory(name: string) {
    const id = await writer.addSkillCategory(name);
    if (!id) return false;
    await onCategoryAdded();
    return true;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const id = await writer.saveSkill(form);
    if (id) onClose();
  }

  return (
    <form onSubmit={submit}>
      <FormGrid>
        <TextField label="Skill" value={form.name} onChange={(v) => set("name", v)} />
        <CategoryField
          label="Category"
          value={form.category}
          onChange={(v) => set("category", v)}
          options={
            lists.categories.includes(form.category)
              ? lists.categories
              : [...lists.categories, form.category]
          }
          onAdd={addCategory}
          hint="Add your own if none of these fit. It becomes its own group on the skills page."
        />
        <ScaleField
          label="Level"
          value={form.level}
          onChange={(v) => set("level", v)}
          hint="Your own mastery rating from 1 to 10, where 10 is the strongest. It is labelled as a self rating on the page."
        />
        <NumberField
          label="Years"
          value={form.years}
          onChange={(v) => set("years", v)}
          min={0}
          max={60}
          hint="How long the skill has been in use, in years."
        />
        <NumberField
          label="Since"
          value={form.since}
          onChange={(v) => set("since", v)}
          min={1980}
          max={2100}
          hint="The year you picked this skill up. The page counts how long you have held it from here."
        />
        <ListField
          label="Evidence"
          value={form.evidence}
          onChange={(v) => set("evidence", v)}
          hint="One entry id per line, taken from a project, a certificate, or a role. Leave empty rather than inventing one."
        />
        <VisibilityField visible={form.visible} onChange={(v) => set("visible", v)} />
      </FormGrid>

      <FormActions busy={writer.busy} onCancel={onClose} label={entry ? "Save changes" : "Save skill"} />
    </form>
  );
}
