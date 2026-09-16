/**
 * Projects page copy.
 */
import type { ContentEntry } from "./types";

export const PROJECTS_CONTENT: ContentEntry[] = [
  {
    key: "projects.eyebrow",
    page: "projects",
    label: "Page eyebrow",
    default: "Project File",
  },
  {
    key: "projects.title",
    page: "projects",
    label: "Page main heading",
    default: "Twelve traceable pieces of work, not just a list of tools",
  },
  {
    key: "projects.lead",
    page: "projects",
    label: "Page lead paragraph",
    default:
      "Every project below has a budget, a duration, a team size, and an impact score. I kept the small numbers in too, because they show the pattern: valuable work usually runs long.",
    multiline: true,
  },
  {
    key: "projects.stat.budget",
    page: "projects",
    label: "Stat label: budget managed",
    default: "Budget managed",
  },
  {
    key: "projects.stat.running",
    page: "projects",
    label: "Stat label: projects running",
    default: "Projects running",
  },
  {
    key: "projects.stat.sites",
    page: "projects",
    label: "Stat label: reaching many sites",
    default: "Reaching many sites",
  },
  {
    key: "projects.stat.impact",
    page: "projects",
    label: "Stat label: average impact",
    default: "Average impact",
  },
  {
    key: "projects.quickread.eyebrow",
    page: "projects",
    label: "Quick read eyebrow",
    default: "Quick read",
  },
  {
    key: "projects.quickread.title",
    page: "projects",
    label: "Quick read heading",
    default: "How projects spread across kind, time, and budget size",
  },
  {
    key: "projects.quickread.description",
    page: "projects",
    label: "Quick read description",
    default:
      "The bubble map shows when the work happened and how much impact it had. Bubble size is the impact score, colour is the kind of work.",
    multiline: true,
  },
  {
    key: "projects.featured.eyebrow",
    page: "projects",
    label: "Featured section eyebrow",
    default: "Featured",
  },
  {
    key: "projects.featured.title",
    page: "projects",
    label: "Featured section heading",
    default: "Four projects that explain how I work",
  },
  {
    key: "projects.featured.description",
    page: "projects",
    label: "Featured section description",
    default:
      "Chosen not because they had the biggest budgets, but because they represent the thinking I repeat across many other pieces of work.",
    multiline: true,
  },
  {
    key: "projects.composition.eyebrow",
    page: "projects",
    label: "Composition section eyebrow",
    default: "Composition",
  },
  {
    key: "projects.composition.title",
    page: "projects",
    label: "Composition section heading",
    default: "Where the budget and the attention actually went",
  },
  {
    key: "projects.table.eyebrow",
    page: "projects",
    label: "Table section eyebrow",
    default: "Full file",
  },
  {
    key: "projects.table.title",
    page: "projects",
    label: "Table section heading",
    default: "Every project in one filterable table",
  },
  {
    key: "projects.table.description",
    page: "projects",
    label: "Table section description",
    default:
      "Search, sort by column, or filter by kind, status, and year. Everything runs in your browser.",
    multiline: true,
  },
];
