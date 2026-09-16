/**
 * Career page copy.
 */
import type { ContentEntry } from "./types";

export const CAREER_CONTENT: ContentEntry[] = [
  {
    key: "career.eyebrow",
    page: "career",
    label: "Page eyebrow",
    default: "Career File",
  },
  {
    key: "career.title",
    page: "career",
    label: "Page main heading",
    default: "The path from fixing tickets to owning the budget",
  },
  {
    key: "career.lead",
    page: "career",
    label: "Page lead paragraph",
    default:
      "I did not move around chasing job titles. Each move added one more kind of responsibility: devices, then networks, then people, then budget and technical direction.",
    multiline: true,
  },
  {
    key: "career.stat.tenure",
    page: "career",
    label: "Stat label: total tenure",
    default: "Total tenure",
  },
  {
    key: "career.stat.leadership",
    page: "career",
    label: "Stat label: leadership roles",
    default: "Leadership roles",
  },
  {
    key: "career.stat.peakTeam",
    page: "career",
    label: "Stat label: largest team",
    default: "Largest team",
  },
  {
    key: "career.chart.tenure.title",
    page: "career",
    label: "Tenure chart title",
    default: "Active roles per year",
  },
  {
    key: "career.chart.tenure.note",
    page: "career",
    label: "Tenure chart note",
    default:
      "Stacked bars separate technical years from leadership years. Watch 2020, the point where I moved into a supervisor role.",
    multiline: true,
  },
  {
    key: "career.chart.scope.title",
    page: "career",
    label: "Scope chart title",
    default: "Time in role against team size",
  },
  {
    key: "career.chart.scope.note",
    page: "career",
    label: "Scope chart note",
    default: "A rust bar means that role led people. A moss bar means it was purely technical.",
    multiline: true,
  },
  {
    key: "career.table.title",
    page: "career",
    label: "Career table heading",
    default: "Compare it yourself, do not take my summary at face value",
  },
  {
    key: "career.shape.eyebrow",
    page: "career",
    label: "Shape section eyebrow",
    default: "Shape",
  },
  {
    key: "career.shape.title",
    page: "career",
    label: "Shape section heading",
    default: "A trajectory, not a list of dates",
  },
  {
    key: "career.shape.description",
    page: "career",
    label: "Shape section description",
    default:
      "Two different angles: one shows when leadership responsibility started to appear, the other compares time in role against the size of the team held.",
    multiline: true,
  },
  {
    key: "career.timeline.eyebrow",
    page: "career",
    label: "Timeline section eyebrow",
    default: "Timeline",
  },
  {
    key: "career.timeline.title",
    page: "career",
    label: "Timeline section heading",
    default: "What actually changed at each stage",
  },
  {
    key: "career.timeline.description",
    page: "career",
    label: "Timeline section description",
    default: "Role summaries, numbers I can stand behind, and the tools I genuinely used.",
    multiline: true,
  },
  {
    key: "career.table.eyebrow",
    page: "career",
    label: "Table section eyebrow",
    default: "Table",
  },
  {
    key: "career.table.description",
    page: "career",
    label: "Table section description",
    default:
      "Filter by job level or sector, then sort by time in role. Everything runs in your browser.",
    multiline: true,
  },
];
