/**
 * The charts panel.
 *
 * Most of the numbers the site draws are worked out from the entries, and a few
 * of them had no source at all: they were literals inside the component that
 * drew them. Neither kind can be nudged. This screen is where every chart's
 * rows are typed in by hand instead.
 *
 * There is one store behind all of them, so a chart added to CHART_SPECS shows
 * up here with no further work and no migration. A chart with nothing stored
 * keeps whatever the entries produce, which is why "Clear, back to computed" is
 * the way back rather than a reset button that would guess at defaults.
 *
 * The preview under each row is drawn from the same function the public chart
 * uses, so what is measured here is what appears there. It is a bar rather than
 * a redraw of the chart itself: the point is to see a number's weight in a
 * series, not to reproduce an axis, a legend, and a layout in a panel.
 */
import * as React from "react";
import { Check, CircleAlert, Loader2, Plus, RotateCcw, Save, Trash2, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useEntries } from "@/entries/EntriesProvider";
import { useEntryWriter } from "@/entries/useEntryWriter";
import {
  CHART_SPECS,
  chartBarPercent,
  chartValue,
  roundToField,
  type ChartBarSpec,
  type ChartSpec,
} from "@/entries/chartSeries";
import type { ChartRow } from "@/entries/types";
import { cn } from "@/lib/utils";

export default function ChartsPanel() {
  const { storedCharts } = useEntries();
  const writer = useEntryWriter();
  const [open, setOpen] = React.useState<string | null>(CHART_SPECS[0]?.id ?? null);

  function setStored(id: string, rows: ChartRow[]) {
    // The writer reports its own success and failure through the status block,
    // so the rejection is caught here and nothing floats.
    void writer.saveChartSeries(id, rows).catch(() => undefined);
  }

  return (
    <div className="space-y-8">
      <div className="panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge variant={writer.busy ? "accent" : "moss"} dot={writer.busy}>
              {writer.busy ? "writing" : "ready"}
            </Badge>
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              {Object.keys(storedCharts).length} of {CHART_SPECS.length} charts set by hand
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
          Every chart on the site is listed below. Open one to type its rows, and watch the bars
          under each row as you go. A chart with nothing set is still counted from the entries, so
          leaving it alone is a choice and not an oversight. Saving goes live at once.
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

      <div className="space-y-3">
        {CHART_SPECS.map((spec) => (
          <ChartCard
            key={spec.id}
            spec={spec}
            open={open === spec.id}
            onToggle={() => setOpen((current) => (current === spec.id ? null : spec.id))}
            stored={storedCharts[spec.id]}
            onSave={setStored}
            busy={writer.busy}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * One chart's fold.
 *
 * The editor is keyed on the chart id so switching charts starts it from that
 * chart's own numbers rather than carrying the last one's rows across. It also
 * carries a row count so a save that comes back different remounts the editor
 * from what was actually stored.
 */
function ChartCard({
  spec,
  open,
  onToggle,
  stored,
  onSave,
  busy,
}: {
  spec: ChartSpec;
  open: boolean;
  onToggle: () => void;
  stored: ChartRow[] | undefined;
  onSave: (id: string, rows: ChartRow[]) => void;
  busy: boolean;
}) {
  const { chartRows } = useEntries();
  const rows = chartRows(spec.id);

  return (
    <div className="panel">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="min-w-0">
          <p className="font-display text-[15px] font-semibold tracking-tight">{spec.title}</p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">{spec.where}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Badge variant={stored ? "accent" : "moss"}>
            {stored ? "set by hand" : "from the entries"}
          </Badge>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {rows.length} {rows.length === 1 ? "row" : "rows"}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            {open ? "close" : "open"}
          </span>
        </div>
      </button>

      {open ? (
        <div className="px-5 pb-5">
          <Separator dashed className="mb-5" />
          <ChartEditor
            key={`${spec.id}:${stored ? stored.length : "computed"}`}
            spec={spec}
            stored={stored}
            onSave={onSave}
            busy={busy}
          />
        </div>
      ) : null}
    </div>
  );
}

function ChartEditor({
  spec,
  stored,
  onSave,
  busy,
}: {
  spec: ChartSpec;
  stored: ChartRow[] | undefined;
  onSave: (id: string, rows: ChartRow[]) => void;
  busy: boolean;
}) {
  const { chartRows } = useEntries();
  const [rows, setRows] = React.useState<ChartRow[]>(() => chartRows(spec.id).map(cloneRow));

  const current = chartRows(spec.id);
  const setByHand = Boolean(stored);
  const dirty = !sameRows(rows, current);

  function setField(index: number, key: string, value: number) {
    setRows((held) =>
      held.map((row, position) =>
        position === index ? { ...row, values: { ...row.values, [key]: value } } : row,
      ),
    );
  }

  function rename(index: number, name: string) {
    setRows((held) =>
      held.map((row, position) => (position === index ? { ...row, name } : row)),
    );
  }

  function addRow() {
    setRows((held) => [...held, cloneRow(spec.blank)]);
  }

  function removeRow(index: number) {
    setRows((held) => held.filter((_, position) => position !== index));
  }

  function fillFromComputed() {
    setRows(chartRows(spec.id).map(cloneRow));
  }

  return (
    <div className="space-y-5">
      <p className="max-w-3xl text-[13px] leading-relaxed text-muted-foreground text-pretty">
        {spec.note}
      </p>

      <div className="flex flex-wrap items-center gap-2.5">
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus aria-hidden />
          Add a row
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={fillFromComputed} disabled={busy}>
          <Wand2 aria-hidden />
          {setByHand ? "Fill from the current numbers" : "Start from the current numbers"}
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="font-mono text-[12px] leading-relaxed text-muted-foreground">
          {setByHand
            ? "This chart is set to nothing on purpose, so the section draws an empty series. Save it again with rows in it, or clear it to go back to the entries."
            : "There is nothing to show yet. Add a row, or start from the numbers the entries produce."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[560px] space-y-2">
            <div className="flex items-end gap-3">
              <span className="w-40 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                {spec.nameLabel}
              </span>
              {spec.fields.map((field) => (
                <span
                  key={field.key}
                  className="w-24 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground"
                >
                  {field.label}
                </span>
              ))}
              <span className="flex-1" />
            </div>

            {rows.map((row, index) => (
              <ChartRowFields
                key={index}
                spec={spec}
                row={row}
                rows={rows}
                onRename={(name) => rename(index, name)}
                onField={(key, value) => setField(index, key, value)}
                onRemove={() => removeRow(index)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2.5 border-t border-border pt-5">
        <Button type="button" size="sm" onClick={() => onSave(spec.id, rows)} disabled={busy || !dirty}>
          {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
          Save the chart
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setRows([]);
            onSave(spec.id, []);
          }}
          disabled={busy || (!setByHand && rows.length === 0)}
        >
          <RotateCcw aria-hidden />
          Clear, back to computed
        </Button>
        {dirty ? (
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-primary">
            unsaved
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ChartRowFields({
  spec,
  row,
  rows,
  onRename,
  onField,
  onRemove,
}: {
  spec: ChartSpec;
  row: ChartRow;
  rows: ChartRow[];
  onRename: (name: string) => void;
  onField: (key: string, value: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-2 border-b border-border/60 pb-2 last:border-b-0">
      <div className="flex items-center gap-3">
        <label className="w-40">
          <span className="sr-only">{spec.nameLabel}</span>
          <Input
            value={row.name}
            placeholder={spec.namePlaceholder}
            onChange={(event) => onRename(event.target.value)}
            className="h-8 font-mono text-[12px]"
          />
        </label>

        {spec.fields.map((field) => (
          <label key={field.key} className="w-24" title={field.hint}>
            <span className="sr-only">{field.label}</span>
            <Input
              type="number"
              step={field.decimals ? 10 ** -field.decimals : 1}
              value={String(row.values[field.key] ?? 0)}
              onChange={(event) => {
                const parsed = Number(event.target.value);
                onField(field.key, Number.isFinite(parsed) ? roundToField(parsed, field) : 0);
              }}
              className="h-8 font-mono text-[12px] tabular-nums"
            />
          </label>
        ))}

        <div className="flex-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={`Remove the row ${row.name || "with no name"}`}
        >
          <Trash2 aria-hidden />
        </Button>
      </div>

      <BarPreview bar={spec.bar} row={row} rows={rows} />
    </div>
  );
}

/**
 * The row as a bar, drawn from the same measurement the chart uses.
 *
 * The value beside the bar is the number that decides its width, so a row whose
 * bar is full but whose printed number is small is a sign the scale is wrong.
 */
function BarPreview({ bar, row, rows }: { bar: ChartBarSpec; row: ChartRow; rows: ChartRow[] }) {
  const percent = chartBarPercent(bar, row, rows);
  const number = bar.fields.reduce((sum, key) => sum + chartValue(row, key), 0);
  const shown = Number.isInteger(number) ? String(number) : String(Math.round(number * 100) / 100);

  return (
    <div className="flex items-center gap-3 pl-0.5">
      <div
        className="h-2 w-40 overflow-hidden rounded-sm bg-muted"
        role="img"
        aria-label={`${row.name || "row"} at ${Math.round(percent)} percent of the bar`}
      >
        <div
          className="h-full rounded-sm bg-primary transition-all duration-200 ease-out-expo"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
        {shown}
        {bar.unit ? ` ${bar.unit}` : ""}
      </span>
      <span className="font-mono text-[10px] tabular-nums text-muted-foreground/70">
        {Math.round(percent)}%
      </span>
    </div>
  );
}

function cloneRow(row: ChartRow): ChartRow {
  return { name: row.name, values: { ...row.values } };
}

/**
 * Whether two series say the same thing.
 *
 * Compared by order as well as by number, because the order is the order the
 * chart draws in, and a chart rebuilt with the same rows in a different order
 * is a different chart.
 */
function sameRows(a: ChartRow[], b: ChartRow[]): boolean {
  if (a.length !== b.length) return false;

  return a.every((row, index) => {
    const other = b[index];
    if (!other || row.name !== other.name) return false;

    const keys = new Set([...Object.keys(row.values), ...Object.keys(other.values)]);
    return [...keys].every(
      (key) => chartValue(row, key) === chartValue(other, key),
    );
  });
}
