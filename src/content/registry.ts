/**
 * The content registry: every editable string on the site, with its default.
 *
 * Adding a string to the admin panel means adding an entry here and reading it
 * through useSiteText() at the call site. Nothing needs to change in the
 * database, because a key only gets a row once an admin publishes a change.
 */
import { GLOBAL_CONTENT } from "./global";
import { HOME_CONTENT } from "./home";
import { CAREER_CONTENT } from "./career";
import { PROJECTS_CONTENT } from "./projects";
import { CREDENTIALS_CONTENT } from "./credentials";
import { SKILLS_CONTENT } from "./skills";
import { ABOUT_CONTENT } from "./about";
import { CONTACT_CONTENT } from "./contact";
import { STEADBYTE_CONTENT } from "./steadbyte";
import { NOTFOUND_CONTENT } from "./notfound";
import type { ContentEntry, ContentPageId, ContentPageMeta } from "./types";

export const CONTENT_REGISTRY: ContentEntry[] = [
  ...GLOBAL_CONTENT,
  ...HOME_CONTENT,
  ...CAREER_CONTENT,
  ...PROJECTS_CONTENT,
  ...CREDENTIALS_CONTENT,
  ...SKILLS_CONTENT,
  ...ABOUT_CONTENT,
  ...CONTACT_CONTENT,
  ...STEADBYTE_CONTENT,
  ...NOTFOUND_CONTENT,
];

/** Flat lookup used when no override has been published for a key. */
export const CONTENT_DEFAULTS: Record<string, string> = Object.fromEntries(
  CONTENT_REGISTRY.map((entry) => [entry.key, entry.default]),
);

export const PAGE_META: ContentPageMeta[] = [
  {
    id: "global",
    title: "Global & Profile",
    description: "Profile photo, full name, navigation, header, footer, and shared metadata.",
    route: "/",
  },
  {
    id: "home",
    title: "Home",
    description: "Hero headings, status cards, section titles, and call to action blocks.",
    route: "/",
  },
  {
    id: "career",
    title: "Career",
    description: "Headings, summary lead, and statistics labels on the career path page.",
    route: "/career",
  },
  {
    id: "projects",
    title: "Projects",
    description: "Headings, impact labels, and register notes for production projects.",
    route: "/projects",
  },
  {
    id: "credentials",
    title: "Credentials",
    description: "Titles, investment stats, and certificate register descriptions.",
    route: "/credentials",
  },
  {
    id: "skills",
    title: "Skills",
    description: "Competency breakdown titles, lead texts, and radar radar labels.",
    route: "/skills",
  },
  {
    id: "about",
    title: "About",
    description: "Operating philosophy, working principles, mistakes and FAQ copy.",
    route: "/about",
  },
  {
    id: "contact",
    title: "Contact",
    description: "Direct channel lead, form headings, and outreach details.",
    route: "/contact",
  },
  {
    id: "steadbyte",
    title: "About Steadbyte",
    description: "What this site is, the problems it solves, the build decisions, and honest limits.",
    route: "/about-steadbyte",
  },
  {
    id: "notfound",
    title: "Not Found",
    description: "404 error page title, descriptive text, and return button.",
    route: "/404",
  },
];

export function entriesForPage(page: ContentPageId): ContentEntry[] {
  return CONTENT_REGISTRY.filter((entry) => entry.page === page);
}

export function findEntry(key: string): ContentEntry | undefined {
  return CONTENT_REGISTRY.find((entry) => entry.key === key);
}

/**
 * Every token usable in one editable string.
 *
 * A token is a word in braces that the renderer swaps for a live value, so the
 * list has to describe what the page supplies rather than what the current text
 * happens to contain. Two sources are combined:
 *
 *   * The default text, which is the working example of the string.
 *   * The hint, which names the tokens the string accepts.
 *
 * Today every token named in a hint also appears in its default, so the union
 * adds nothing. It is kept because the hint is the written contract for the
 * field: if a hint ever names a token the default leaves out, the suggestion
 * should still be offered. Offering a token is safe either way, because
 * applyTokens() leaves an unknown name untouched, so a wrong suggestion shows
 * as literal text instead of breaking the page.
 */
export function tokensForEntry(entry: ContentEntry): string[] {
  const found = new Set<string>();
  const sources = [entry.default, entry.hint ?? ""];

  for (const source of sources) {
    // Same shape as applyTokens() in ContentProvider, so a name is only offered
    // when the renderer would actually substitute it.
    for (const [, name] of source.matchAll(/\{(\w+)\}/g)) found.add(name);
  }

  return [...found].sort();
}

// A duplicated key would silently shadow another string, so shout about it
// during development rather than letting it reach production.
if (import.meta.env.DEV) {
  const seen = new Set<string>();
  for (const entry of CONTENT_REGISTRY) {
    if (seen.has(entry.key)) {
      console.warn(`[content] duplicate content key: ${entry.key}`);
    }
    seen.add(entry.key);
  }
}
