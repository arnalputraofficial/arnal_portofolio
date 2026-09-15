import { cn } from "@/lib/utils";

/**
 * Endless scrolling text strip.
 * Used for a row of technologies, not to hide important content.
 */
export function Marquee({
  items,
  className,
  reverse = false,
  speed = 38,
}: {
  items: string[];
  className?: string;
  reverse?: boolean;
  speed?: number;
}) {
  const doubled = [...items, ...items];

  return (
    <div
      className={cn(
        "group relative flex overflow-hidden border-y border-border py-3.5",
        "[mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]",
        className,
      )}
    >
      <div
        className="flex shrink-0 items-center gap-8 pr-8 animate-marquee group-hover:[animation-play-state:paused]"
        style={{
          animationDuration: `${speed}s`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {doubled.map((item, i) => (
          <span key={`${item}-${i}`} className="flex shrink-0 items-center gap-8">
            <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-primary">
              {item}
            </span>
            <span aria-hidden className="size-1 rotate-45 bg-primary/50" />
          </span>
        ))}
      </div>
    </div>
  );
}
