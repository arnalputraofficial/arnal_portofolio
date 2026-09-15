import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Card with a "flag" option: a thick accent line on the left edge.
 * Used to mark important items without adding a background colour.
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { flag?: boolean; interactive?: boolean }
>(({ className, flag = false, interactive = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative border border-border bg-card text-card-foreground shadow-lift",
      flag ? "rounded-notch" : "rounded-lg",
      interactive &&
        "transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:border-primary/45 hover:shadow-rust-glow",
      className,
    )}
    {...props}
  >
    {flag && (
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[3px] rounded-l-[inherit] bg-primary/75"
      />
    )}
    {props.children}
  </div>
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("font-display text-lg font-semibold leading-tight tracking-tight", className)}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm leading-relaxed text-muted-foreground", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-6 pb-6", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center gap-3 px-6 pb-6", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
