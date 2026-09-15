import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Editorial section heading: large index number on the left,
 * title and description on the right. Deliberately not centered.
 */
export function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  className,
  action,
}: {
  index: string;
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-6 md:grid-cols-12 md:gap-8", className)}>
      <div className="md:col-span-2">
        <span
          className="font-mono text-[52px] font-bold leading-none text-foreground/10 sm:text-[68px]"
          aria-hidden
        >
          {index}
        </span>
        {eyebrow && <p className="eyebrow mt-1">{eyebrow}</p>}
      </div>

      <div className="md:col-span-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="max-w-2xl font-display text-3xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            {title}
          </h2>
          {action && <div className="shrink-0">{action}</div>}
        </div>
        {description && (
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground text-pretty">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

/** Page wrapper with consistent spacing and width. */
export function PageSection({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("container py-16 sm:py-20 lg:py-24", className)}>
      {children}
    </section>
  );
}
