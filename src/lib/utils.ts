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

/**
 * Splits an editable heading into the visual lines it should render as.
 *
 * Headings are stored as one field with one line per line, so an editor never
 * has to juggle "heading, line 2" again. A line wrapped in asterisks is marked
 * as styled, which lets the caller colour that line on its own. The asterisks
 * are stripped, so they are syntax, not content.
 */
export function parseStyledLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const styled = line.length > 2 && line.startsWith("*") && line.endsWith("*");
      return { text: styled ? line.slice(1, -1).trim() : line, styled };
    });
}

/**
 * Turns an editable address into a Gmail compose link.
 *
 * A bare `mailto:` hands the click to whatever mail program the visitor's
 * machine happens to have registered, which on a machine with Outlook installed
 * means Outlook opens whether the visitor uses it or not. Composing in Gmail
 * instead makes the destination the same for every visitor, and it leaves the
 * chosen mailbox in charge of the sender line.
 *
 * The field holds an address, not a URL, so the scheme is added here. A value
 * that already starts with "mailto:" is accepted as typed, and a value without
 * an "@" yields an empty string so the caller can fall back to plain text
 * instead of rendering a link that goes nowhere.
 */
export function mailtoHref(address: string, subject?: string) {
  const cleaned = address.trim().replace(/^mailto:/i, "").replace(/\s+/g, "");
  if (!cleaned.includes("@")) return "";
  const compose = new URL("https://mail.google.com/mail/");
  compose.searchParams.set("view", "cm");
  compose.searchParams.set("fs", "1");
  compose.searchParams.set("to", cleaned);
  if (subject) compose.searchParams.set("su", subject);
  return compose.toString();
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
