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
        "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-border",
        "bg-muted/70 p-1 transition-colors duration-300 hover:border-primary/50",
        className,
      )}
    >
      {/* knob sits behind the icons, so the active one is knocked out of the pill */}
      <span
        aria-hidden
        className={cn(
          "absolute left-1 size-6 rounded-full bg-foreground",
          "transition-transform duration-300 ease-out-expo",
          mode === "dark" ? "translate-x-[24px]" : "translate-x-0",
        )}
      />
      {/* one 24px cell per icon so each stays centred under the knob */}
      <span aria-hidden className="relative z-10 grid w-12 grid-cols-2">
        <span className="grid place-items-center">
          <Sun
            className={cn(
              "size-3.5 transition-colors duration-300",
              mode === "light" ? "text-background" : "text-muted-foreground",
            )}
          />
        </span>
        <span className="grid place-items-center">
          <Moon
            className={cn(
              "size-3.5 transition-colors duration-300",
              mode === "dark" ? "text-background" : "text-muted-foreground",
            )}
          />
        </span>
      </span>
    </button>
  );
}
