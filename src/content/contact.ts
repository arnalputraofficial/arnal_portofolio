/**
 * Contact page copy.
 */
import type { ContentEntry } from "./types";

export const CONTACT_CONTENT: ContentEntry[] = [
  {
    key: "contact.eyebrow",
    page: "contact",
    label: "Page eyebrow",
    default: "Contact File",
  },
  {
    key: "contact.title",
    page: "contact",
    label: "Page main heading",
    default: "Send a specific question, and I will answer specifically",
  },
  {
    key: "contact.lead",
    page: "contact",
    label: "Page lead paragraph",
    default:
      "I prefer questions that name the real situation, the number of people, and the budget constraint. Questions like that I can answer from experience, not from generic theory.",
    multiline: true,
  },
  {
    key: "contact.stat.response",
    page: "contact",
    label: "Stat label: response time",
    default: "Response time",
  },
  {
    key: "contact.stat.timezone",
    page: "contact",
    label: "Stat label: time zone",
    default: "Time zone",
  },
  {
    key: "contact.stat.channels",
    page: "contact",
    label: "Stat label: direct channels",
    default: "Direct channels",
  },
  {
    key: "contact.stat.status",
    page: "contact",
    label: "Stat label: status",
    default: "Status",
  },
  {
    key: "contact.form.eyebrow",
    page: "contact",
    label: "Form section eyebrow",
    default: "Form",
  },
  {
    key: "contact.form.title",
    page: "contact",
    label: "Form section heading",
    default: "Write your message and send it straight from this page",
  },
  {
    key: "contact.form.description",
    page: "contact",
    label: "Form section description",
    default:
      "The message is stored first and emailed second, so a delivery hiccup never loses your words. No account, no tracking pixel, and no third party reading along.",
    multiline: true,
  },
  {
    key: "contact.channels.title",
    page: "contact",
    label: "Direct channels panel heading",
    default: "direct channels",
  },
  {
    key: "contact.cta.eyebrow",
    page: "contact",
    label: "Closing CTA eyebrow",
    default: "before you write",
  },
  {
    key: "contact.cta.body",
    page: "contact",
    label: "Closing CTA paragraph",
    default:
      "If you have just opened this site, start with the project file. That is where the way I work shows up, not only the end result.",
    multiline: true,
  },
];
