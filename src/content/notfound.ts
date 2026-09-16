/**
 * NotFound page copy.
 */
import type { ContentEntry } from "./types";

export const NOTFOUND_CONTENT: ContentEntry[] = [
  {
    key: "notfound.eyebrow",
    page: "notfound",
    label: "Error eyebrow",
    default: "page not found",
  },
  {
    key: "notfound.title",
    page: "notfound",
    label: "Error title",
    default: "The address you are after is not in this file",
  },
  {
    key: "notfound.lead",
    page: "notfound",
    label: "Error lead description",
    default:
      "There is no page at that address. Instead of an empty apology, I am showing you the seven routes you can actually open.",
    multiline: true,
  },
  {
    key: "notfound.cta",
    page: "notfound",
    label: "Return home button",
    default: "Back to home",
  },
  {
    key: "notfound.available.title",
    page: "notfound",
    label: "Available pages heading",
    default: "Every page that is available",
  },
  {
    key: "notfound.beyond.title",
    page: "notfound",
    label: "Beyond these routes heading",
    default: "beyond these",
  },
  {
    key: "notfound.beyond.body",
    page: "notfound",
    label: "Beyond these routes description",
    default:
      "There is no other page. This site is deliberately capped at seven routes so that nothing dangles without an end.",
    multiline: true,
  },
  {
    key: "notfound.report.body",
    page: "notfound",
    label: "Broken link report paragraph",
    default:
      "If you ended up here through a link from somewhere else, I want to know. Send me the origin address so I can fix it.",
    multiline: true,
  },
];
