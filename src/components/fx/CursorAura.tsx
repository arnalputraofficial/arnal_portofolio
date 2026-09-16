import * as React from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Elements the reticle should lock onto. */
const INTERACTIVE_SELECTOR =
  "a[href], button, [role='button'], [role='switch'], [role='tab'], [role='menuitem'], input, textarea, select, summary, [data-cursor]";

/**
 * Mono tag shown beside the reticle once it locks onto something.
 * `data-cursor` wins, so a component can name its own state.
 */
function targetTag(el: Element): string {
  const explicit = el.getAttribute("data-cursor");
  if (explicit) return explicit;
  const role = el.getAttribute("role");
  if (role === "switch") return "TOGGLE";
  if (role === "tab") return "TAB";
  if (role === "menuitem") return "MENU";
  switch (el.tagName.toLowerCase()) {
    case "a":
      return "LINK";
    case "button":
      return "BUTTON";
    case "input":
      return el.getAttribute("type") === "submit" ? "SUBMIT" : "FIELD";
    case "textarea":
      return "FIELD";
    case "select":
      return "SELECT";
    case "summary":
      return "EXPAND";
    default:
      return "ACT";
  }
}

/**
 * Cursor system: a soft light that follows the pointer across the page, plus a
 * technical reticle that replaces the native pointer. The reticle trails a touch
 * behind the crosshair and locks onto interactive targets. Both are colour-driven
 * by theme tokens, so they adapt to light and dark without extra wiring.
 * Disabled on touch devices, on narrow screens, and when reduced motion is asked.
 */
export function CursorAura() {
  const reduce = useReducedMotion();
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 120, damping: 22, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 120, damping: 22, mass: 0.6 });
  // Bracket and crosshair springs differ so the two parts read as one instrument.
  const bx = useSpring(x, { stiffness: 420, damping: 32, mass: 0.3 });
  const by = useSpring(y, { stiffness: 420, damping: 32, mass: 0.3 });

  const [enabled, setEnabled] = React.useState(false);
  const [armed, setArmed] = React.useState(false);
  const [tag, setTag] = React.useState<string | null>(null);
  const [pressed, setPressed] = React.useState(false);
  // Refs guard against state churn: pointermove fires far too often to re-render.
  const armedRef = React.useRef(false);
  const tagRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (reduce) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setEnabled(true);

    const root = document.documentElement;
    root.classList.add("cursor-reticle");

    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      if (!armedRef.current) {
        armedRef.current = true;
        setArmed(true);
      }
      const hit =
        e.target instanceof Element ? e.target.closest(INTERACTIVE_SELECTOR) : null;
      const next = hit ? targetTag(hit) : null;
      if (next !== tagRef.current) {
        tagRef.current = next;
        setTag(next);
      }
    };
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);
    // The pointer is gone, so nothing should be left floating over the page.
    const onLeave = () => {
      armedRef.current = false;
      setArmed(false);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      root.classList.remove("cursor-reticle");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [reduce, x, y]);

  if (!enabled) return null;

  return (
    <>
      <motion.div
        aria-hidden
        style={{ left: sx, top: sy }}
        className="pointer-events-none fixed z-0 hidden size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full lg:block"
      >
        <div className="size-full rounded-full bg-[radial-gradient(circle,rgba(213,81,40,0.09),transparent_62%)]" />
      </motion.div>

      {/* Corner brackets, trailing the crosshair. Tighten on a lock and on press. */}
      <motion.div
        aria-hidden
        style={{ left: bx, top: by }}
        className={cn(
          "pointer-events-none fixed z-[90] hidden size-[44px] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200 lg:block",
          armed ? "opacity-100" : "opacity-0",
        )}
      >
        <div
          className={cn(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
            "transition-[width,height] duration-200 ease-out-expo",
            pressed ? "size-[14px]" : tag ? "size-[18px]" : "size-[26px]",
          )}
        >
          <span className="absolute left-0 top-0 size-1.5 border-l border-t border-primary" />
          <span className="absolute right-0 top-0 size-1.5 border-r border-t border-primary" />
          <span className="absolute bottom-0 left-0 size-1.5 border-b border-l border-primary" />
          <span className="absolute bottom-0 right-0 size-1.5 border-b border-r border-primary" />
        </div>

        <span
          className={cn(
            "absolute left-1/2 top-1/2 -translate-y-1/2 translate-x-[15px] whitespace-nowrap",
            "rounded-sm bg-primary px-1 py-px font-mono text-[9px] uppercase tracking-[0.14em] text-primary-foreground",
            "transition-opacity duration-150",
            tag ? "opacity-100" : "opacity-0",
          )}
        >
          {tag ?? "ACT"}
        </span>
      </motion.div>

      {/* Crosshair, sitting exactly on the pointer with no lag. */}
      <motion.div
        aria-hidden
        style={{ left: x, top: y }}
        className={cn(
          "pointer-events-none fixed z-[91] hidden size-0 transition-opacity duration-200 lg:block",
          armed ? "opacity-100" : "opacity-0",
        )}
      >
        <span
          className={cn(
            "absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary",
            "transition-[width,height] duration-150",
            pressed ? "size-[5px]" : "size-[3px]",
          )}
        />
        <span className="absolute left-0 top-0 h-2 w-px -translate-x-1/2 -translate-y-[13px] bg-primary/70" />
        <span className="absolute left-0 top-0 h-2 w-px -translate-x-1/2 translate-y-[5px] bg-primary/70" />
        <span className="absolute left-0 top-0 h-px w-2 -translate-x-[13px] -translate-y-1/2 bg-primary/70" />
        <span className="absolute left-0 top-0 h-px w-2 translate-x-[5px] -translate-y-1/2 bg-primary/70" />
      </motion.div>
    </>
  );
}
