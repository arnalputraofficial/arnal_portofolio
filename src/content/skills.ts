/**
 * Skills page copy.
 */
import type { ContentEntry } from "./types";

export const SKILLS_CONTENT: ContentEntry[] = [
  {
    key: "skills.eyebrow",
    page: "skills",
    label: "Page eyebrow",
    default: "Skills File",
  },
  {
    key: "skills.title",
    page: "skills",
    label: "Page main heading",
    default: "Technical Competence & Leadership Skills",
  },
  {
    key: "skills.lead",
    page: "skills",
    label: "Page lead paragraph",
    default:
      "Not every row on this page stands as tall as the others, and that is deliberate. The rating numbers here come from me. Data that comes from a third-party registry is kept separate at the bottom so the two never blend.",
    multiline: true,
  },
  {
    key: "skills.stat.tracked",
    page: "skills",
    label: "Stat label: skills tracked",
    default: "Skills tracked",
  },
  {
    key: "skills.stat.rating",
    page: "skills",
    label: "Stat label: average rating",
    default: "Average rating",
  },
  {
    key: "skills.stat.longest",
    page: "skills",
    label: "Stat label: longest track record",
    default: "Longest track record",
  },
  {
    key: "skills.stat.evidence",
    page: "skills",
    label: "Stat label: evidence links",
    default: "Evidence links",
  },
  {
    key: "skills.spread.eyebrow",
    page: "skills",
    label: "Spread section eyebrow",
    default: "Spread",
  },
  {
    key: "skills.spread.title",
    page: "skills",
    label: "Spread section heading",
    default: "Where my claims are strong, and where the evidence is still thin",
  },
  {
    key: "skills.selfrating.eyebrow",
    page: "skills",
    label: "Self rating section eyebrow",
    default: "Self rating",
  },
  {
    key: "skills.selfrating.title",
    page: "skills",
    label: "Self rating section heading ({count} = number of skills)",
    default: "{count} skills, filtered by the kind of work",
  },
  {
    key: "skills.selfrating.description",
    page: "skills",
    label: "Self rating section description",
    default:
      "Each card shows the level, years of experience, last year used, and evidence links. Pick a category to narrow the view.",
    multiline: true,
  },
  {
    key: "skills.registry.eyebrow",
    page: "skills",
    label: "Registry section eyebrow",
    default: "Third-party registry",
  },
  {
    key: "skills.registry.title",
    page: "skills",
    label: "Registry section heading",
    default: "Verified skills, shown as they are",
  },
  {
    key: "skills.registry.description",
    page: "skills",
    label: "Registry section description",
    default:
      "This section pulls data from a public skill registry, not from my own rating. If the registry cannot be reached, the panel will say so plainly.",
    multiline: true,
  },
];
