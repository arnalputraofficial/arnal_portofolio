import * as React from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

/**
 * Soft light that follows the cursor across the page.
 * Disabled on touch devices and when the user asks for reduced motion.
 */
export function CursorAura() {
  const reduce = useReducedMotion();
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 120, damping: 22, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 120, damping: 22, mass: 0.6 });
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    if (reduce) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;
    setEnabled(true);

    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      style={{ left: sx, top: sy }}
      className="pointer-events-none fixed z-0 hidden size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full lg:block"
    >
      <div className="size-full rounded-full bg-[radial-gradient(circle,rgba(213,81,40,0.09),transparent_62%)]" />
    </motion.div>
  );
}
