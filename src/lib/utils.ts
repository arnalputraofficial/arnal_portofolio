import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** English number formatting, compact for large values. */
export function nf(value: number, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/** Compact date range: "Mar 2021 to Now" */
export function monthRange(start: string, end: string | null) {
  const f = (iso: string) =>
    new Date(iso + "-01").toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  return `${f(start)} to ${end ? f(end) : "Now"}`;
}

/** Month difference between two ISO dates (yyyy-mm). */
export function monthsBetween(start: string, end: string | null) {
  const [sy, sm] = start.split("-").map(Number);
  const now = end ? end.split("-").map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];
  return Math.max(0, (now[0] - sy) * 12 + (now[1] - sm));
}

/** "3y 4mo" */
export function humanDuration(months: number) {
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts: string[] = [];
  if (y) parts.push(`${y}y`);
  if (m && y < 12) parts.push(`${m}mo`);
  return parts.length ? parts.join(" ") : `${months}mo`;
}
