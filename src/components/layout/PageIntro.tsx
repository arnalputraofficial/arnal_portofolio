import * as React from "react";
import { SplitHeading } from "@/components/fx/Reveal";
import { Reveal } from "@/components/fx/Reveal";
import { cn } from "@/lib/utils";

/**
 * Page header. Hairline rule and oversized title laid out like a dossier page,
 * not a marketing banner.
 */
export function PageIntro({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="relative overflow-hidden border-b border-border">
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-lines opacity-40" />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-28 size-[420px] rounded-full bg-primary/10 blur-3xl"
      />

      <div className="container relative py-14 sm:py-20">
        <div className="flex items-center gap-4">
          <span className="hairline flex-1" />
          <span className="eyebrow">{eyebrow}</span>
        </div>

        <h1
          className={cn(
            "mt-8 max-w-4xl font-display text-4xl font-semibold leading-[1.03] tracking-tight",
            "text-balance sm:text-5xl lg:text-6xl",
          )}
        >
          <SplitHeading text={title} />
        </h1>

        {lead && (
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-muted-foreground text-pretty">
              {lead}
            </p>
          </Reveal>
        )}

        {children && <div className="mt-10">{children}</div>}
      </div>
    </header>
  );
}

/** Compact number strip for quick context under the page title. */
export function StatStrip({
  items,
  className,
}: {
  items: { label: string; value: React.ReactNode; hint?: string }[];
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid divide-y divide-border border-y border-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4",
        "sm:[&>*+*]:border-l sm:[&>*+*]:border-border",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1 px-0 py-5 sm:px-6 sm:first:pl-0">
          <dt className="eyebrow">{item.label}</dt>
          <dd className="font-display text-3xl font-semibold tracking-tight tabular-nums">
            {item.value}
          </dd>
          {item.hint && (
            <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">{item.hint}</p>
          )}
        </div>
      ))}
    </dl>
  );
}
