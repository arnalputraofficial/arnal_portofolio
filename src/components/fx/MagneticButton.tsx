import * as React from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Button that is pulled toward the cursor (magnetic effect).
 * Capped at 8px so it feels alive without hurting click precision.
 */
export function MagneticButton({
  children,
  className,
  strength = 8,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { strength?: number }) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.5 });

  const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(relX * strength * 2);
    y.set(relY * strength * 2);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      style={{ x: sx, y: sy }}
      onPointerMove={onMove}
      onPointerLeave={reset}
      onBlur={reset}
      className={cn(
        "group relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden",
        "rounded-notch border border-primary bg-primary px-6",
        "font-mono text-[13px] font-medium uppercase tracking-[0.08em] text-primary-foreground",
        "transition-colors duration-300",
        className,
      )}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {/* layer that rises from below on hover */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 translate-y-full bg-foreground",
          "transition-transform duration-400 ease-out-expo group-hover:translate-y-0",
        )}
      />
      <span className="relative z-10 transition-colors duration-300 group-hover:text-background">
        {children}
      </span>
    </motion.button>
  );
}
