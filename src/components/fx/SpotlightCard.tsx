import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Card with a spotlight that tracks the cursor.
 * The effect is a CSS variable plus pointer events, no extra animation
 * library, so it stays cheap when used dozens of times inside one table.
 */
export function SpotlightCard({
  className,
  children,
  spotlightColor = "rgba(213, 81, 40, 0.16)",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { spotlightColor?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      className={cn(
        "group/spot relative overflow-hidden border border-border bg-card",
        "transition-colors duration-300 hover:border-primary/40",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300",
          "group-hover/spot:opacity-100",
        )}
        style={{
          background: `radial-gradient(340px circle at var(--mx, 50%) var(--my, 50%), ${spotlightColor}, transparent 70%)`,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
