import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "light" | "dark";

/** Theme switch with a sliding knob, not two icons swapping places. */
export function ThemeToggle({ className }: { className?: string }) {
  const [mode, setMode] = React.useState<Mode>("dark");

  React.useEffect(() => {
    const stored = localStorage.getItem("arnal:theme") as Mode | null;
    const initial: Mode = stored ?? (document.documentElement.classList.contains("dark") ? "dark" : "light");
    setMode(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggle = () => {
    const next: Mode = mode === "dark" ? "light" : "dark";
    setMode(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("arnal:theme", next);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={mode === "dark"}
      aria-label="Switch between light and dark theme"
      onClick={toggle}
      className={cn(
        "relative inline-flex h-8 w-[62px] shrink-0 items-center rounded-full border border-border",
        "bg-muted/70 px-1 transition-colors duration-300 hover:border-primary/50",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute left-1 grid size-6 place-items-center rounded-full bg-foreground text-background",
          "transition-transform duration-400 ease-out-expo",
          mode === "dark" ? "translate-x-0" : "translate-x-[30px]",
        )}
      >
        {mode === "dark" ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
      </span>
      <span className="ml-auto pr-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
        {mode === "dark" ? "Dark" : "Light"}
      </span>
    </button>
  );
}
