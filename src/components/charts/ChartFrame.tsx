import * as React from "react";
import { cn } from "@/lib/utils";

export const CHART_COLORS = {
  rust: "#e2704a",
  rustDeep: "#b83d1c",
  moss: "#6a9364",
  mossDeep: "#3b5e39",
  bone: "#f0ebe3",
  dim: "#6f5e4d",
  grid: "hsl(var(--border))",
  axis: "hsl(var(--muted-foreground))",
} as const;

/** Chart wrapper box with a title, note, and action slot. */
export function ChartFrame({
  title,
  note,
  action,
  children,
  className,
  legend,
}: {
  title: string;
  note?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  legend?: { label: string; color: string }[];
}) {
  return (
    <div className={cn("panel-flagged p-5 sm:p-6", className)}>
      <div className="flex flex-col gap-3 pl-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-display text-base font-semibold tracking-tight">{title}</h3>
          {note && (
            <p className="mt-1 max-w-xl font-mono text-[11px] leading-relaxed text-muted-foreground">
              {note}
            </p>
          )}
        </div>
        {action}
      </div>

      {legend && legend.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 pl-2">
          {legend.map((l) => (
            <span
              key={l.label}
              className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground"
            >
              <span
                className="size-2.5 rounded-[2px]"
                style={{ backgroundColor: l.color }}
                aria-hidden
              />
              {l.label}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 pl-2">{children}</div>
    </div>
  );
}

/** Shared styling for custom Recharts tooltips. */
export function TooltipShell({
  title,
  rows,
}: {
  title: React.ReactNode;
  rows: { label: string; value: React.ReactNode; color?: string }[];
}) {
  return (
    <div className="min-w-[190px] rounded-notch border border-border bg-popover/97 px-3.5 py-3 shadow-lift backdrop-blur">
      <p className="font-display text-[13px] font-semibold leading-tight text-popover-foreground">
        {title}
      </p>
      <div className="mt-2 space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-4">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              {r.color && (
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: r.color }}
                  aria-hidden
                />
              )}
              {r.label}
            </span>
            <span className="font-mono text-[12px] font-medium text-popover-foreground">
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AxisTick({
  x,
  y,
  payload,
  fill,
}: {
  x?: number;
  y?: number;
  payload?: { value: string | number };
  fill?: string;
}) {
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fill={fill ?? CHART_COLORS.axis}
      className="font-mono"
      fontSize={10.5}
    >
      {payload?.value}
    </text>
  );
}
