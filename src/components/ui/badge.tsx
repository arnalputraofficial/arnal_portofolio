import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1.5 border font-mono text-[11px] uppercase tracking-[0.1em]",
    "transition-colors duration-200",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "border-border bg-muted/60 text-muted-foreground rounded-sm",
        accent: "border-primary/35 bg-primary/12 text-primary rounded-sm",
        moss: "border-moss-600/40 bg-moss-600/14 text-moss-300 rounded-sm",
        solid: "border-foreground bg-foreground text-background rounded-sm",
        outline: "border-foreground/25 bg-transparent text-foreground rounded-sm",
        danger: "border-destructive/45 bg-destructive/12 text-destructive rounded-sm",
        muted: "border-border/70 bg-transparent text-muted-foreground rounded-sm",
      },
      size: {
        default: "px-2.5 py-1",
        sm: "px-1.5 py-0.5 text-[10px]",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** small status dot in front of the label */
  dot?: boolean;
}

function Badge({ className, variant, size, dot = false, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span className="relative flex size-1.5 shrink-0">
          <span className="absolute inline-flex size-full animate-pulse-ring rounded-full bg-current" />
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
