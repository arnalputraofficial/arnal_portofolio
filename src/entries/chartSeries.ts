/**
 * The charts the owner can set by hand.
 *
 * Every chart on the site is drawn from one of three places: the entry tables,
 * a number written into the bundle, or a running total over the rows. The first
 * two cannot be nudged at all, and the third only moves when a row moves. This
 * module is the single list of charts that accept a hand set series, the fields
 * each one stores, and the numbers each one falls back to.
 *
 * The computed rows live here rather than inside the chart components so the
 * panel can offer "Fill from the current numbers" without a second copy of the
 * arithmetic that would drift from the first. A chart reads `computedChartRows`
 * when the owner has set nothing, and the panel seeds from the same function.
 *
 * Nothing here reads React or the network. It is a plain function of the entry
 * lists, which is what makes it usable from both sides.
 */
import { monthsBetween } from "@/lib/utils";
import type {
  CareerEntry,
  CertificationEntry,
  ChartRow,
  ProjectEntry,
  SkillEntry,
} from "@/entries/types";

export interface ChartFieldSpec {
  key: string;
  label: string;
  /** Decimal places kept when the number is stored and shown. */
  decimals?: number;
  /** The full width of the preview bar for this field on its own. */
  hint?: string;
}

/**
 * How the preview bar is measured.
 *
 * `fields` are stacked in order from the baseline. `max` is the value a full
 * bar means, and it acts as a floor: a series whose rows are all larger than
 * it is scaled to its own largest row so the preview stays readable. When
 * `maxField` is set the row's own field decides the full width instead, which
 * is what the operational status card does with its per row scale.
 */
export interface ChartBarSpec {
  fields: string[];
  max: number;
  maxField?: string;
  /** Shown after the number in the preview, e.g. "%" or "months". */
  unit?: string;
}

export interface ChartSpec {
  id: string;
  title: string;
  /** The page and section the chart appears in, so it can be found. */
  where: string;
  note: string;
  /** Header over the label column, e.g. "Year". */
  nameLabel: string;
  namePlaceholder: string;
  fields: ChartFieldSpec[];
  bar: ChartBarSpec;
  /** A fresh row for the add button. */
  blank: ChartRow;
}

/** The lists every computed series is derived from. */
export interface ChartSources {
  career: CareerEntry[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  skills: SkillEntry[];
}

/** Levels are a 1 to 10 self rating, where 10 is the strongest. */
const SKILL_SCALE_MAX = 10;

/**
 * The three rows of the operational status card.
 *
 * These were the only numbers on the site with no home in the database or in
 * the content registry: they were literals inside the card itself. They are the
 * computed fallback here, and the card reads its rows from this list whether
 * the owner has set them or not.
 */
const HEALTH_ROWS: ChartRow[] = [
  { name: "availability", values: { value: 99.98, scale: 100 } },
  { name: "incidents", values: { value: 3, scale: 100 } },
  { name: "budget", values: { value: 98, scale: 100 } },
];

export const CHART_SPECS: ChartSpec[] = [
  {
    id: "health",
    title: "Operational status",
    where: "Home, the card beside the hero",
    note:
      "The three built in rows are availability, incidents, and budget, and each one takes its label from the content registry. Scale is the value the bar fills at, so 3 tickets out of 10 reads as a third of the way across. Any other row name is shown as typed.",
    nameLabel: "Row",
    namePlaceholder: "availability",
    fields: [
      { key: "value", label: "Value", decimals: 2 },
      { key: "scale", label: "Scale", hint: "The bar fills at this value." },
    ],
    bar: { fields: ["value"], max: 100, maxField: "scale" },
    blank: { name: "", values: { value: 0, scale: 100 } },
  },
  {
    id: "career-tenure",
    title: "Role composition per year",
    where: "Career, the stacked bar chart",
    note:
      "One row per year: how many roles were running that year, split between individual contributor work and leading a team. Filled from the job history above when nothing is set here.",
    nameLabel: "Year",
    namePlaceholder: "2024",
    fields: [
      { key: "ic", label: "IC" },
      { key: "lead", label: "Lead" },
    ],
    bar: { fields: ["ic", "lead"], max: 4, unit: "roles" },
    blank: { name: "", values: { ic: 0, lead: 0 } },
  },
  {
    id: "role-scope",
    title: "Role scope",
    where: "Career, the horizontal bar chart",
    note:
      "One row per role, measured in months. Filled from the start and end dates above when nothing is set here.",
    nameLabel: "Role",
    namePlaceholder: "IT Manager",
    fields: [{ key: "months", label: "Months" }],
    bar: { fields: ["months"], max: 36, unit: "months" },
    blank: { name: "", values: { months: 0 } },
  },
  {
    id: "credentials-validity",
    title: "Validity window",
    where: "Credentials, the timeline at the top",
    note:
      "One row per certificate, measured in months left before it lapses. A permanent certificate is drawn at 120. Filled from the expiry dates above when nothing is set here.",
    nameLabel: "Certificate",
    namePlaceholder: "CCNA",
    fields: [{ key: "months", label: "Months left" }],
    bar: { fields: ["months"], max: 120, unit: "months" },
    blank: { name: "", values: { months: 0 } },
  },
  {
    id: "credentials-domains",
    title: "Domain composition",
    where: "Credentials, the tiles under the timeline",
    note:
      "One row per certificate domain. Count drives the bar and the share, cost is the rupiah figure underneath. Filled from the certificates above when nothing is set here.",
    nameLabel: "Domain",
    namePlaceholder: "Networking",
    fields: [
      { key: "count", label: "Count" },
      { key: "cost", label: "Cost (M)", decimals: 1 },
    ],
    bar: { fields: ["count"], max: 4, unit: "certificates" },
    blank: { name: "", values: { count: 0, cost: 0 } },
  },
  {
    id: "projects-kinds",
    title: "Project mix",
    where: "Projects, the list beside the scatter",
    note:
      "One row per project kind. Count is the number of projects, budget is the total in millions of rupiah. Filled from the projects above when nothing is set here.",
    nameLabel: "Kind",
    namePlaceholder: "Rollout",
    fields: [
      { key: "count", label: "Count" },
      { key: "budget", label: "Budget (M)", decimals: 1 },
    ],
    bar: { fields: ["count"], max: 4, unit: "projects" },
    blank: { name: "", values: { count: 0, budget: 0 } },
  },
  {
    id: "stack-usage",
    title: "Stack usage",
    where: "Skills, the tall bar chart",
    note:
      "One row per tool, counted as the number of projects that name it. Filled from the project stacks when nothing is set here.",
    nameLabel: "Tool",
    namePlaceholder: "PostgreSQL",
    fields: [{ key: "count", label: "Projects" }],
    bar: { fields: ["count"], max: 6, unit: "projects" },
    blank: { name: "", values: { count: 0 } },
  },
  {
    id: "experience-spread",
    title: "Experience spread",
    where: "Skills, the category bar chart",
    note:
      "One row per skill category: the longest running skill in it, and how many skills it holds. Filled from the skills above when nothing is set here.",
    nameLabel: "Category",
    namePlaceholder: "Networking",
    fields: [
      { key: "years", label: "Years" },
      { key: "count", label: "Skills" },
    ],
    bar: { fields: ["years"], max: 10, unit: "years" },
    blank: { name: "", values: { years: 0, count: 0 } },
  },
  {
    id: "skill-balance",
    title: "Skill balance radar",
    where: "Skills, the radar",
    note:
      "One row per category, on the same 1 to 10 scale the skills are rated on. Evidence is the count of proof items behind the category. Filled from the skills above when nothing is set here.",
    nameLabel: "Category",
    namePlaceholder: "Networking",
    fields: [
      { key: "level", label: "Level", decimals: 1, hint: "1 to 10." },
      { key: "evidence", label: "Evidence" },
    ],
    bar: { fields: ["level"], max: SKILL_SCALE_MAX, unit: "of 10" },
    blank: { name: "", values: { level: 0, evidence: 0 } },
  },
  {
    id: "skill-top",
    title: "Top skills",
    where: "Skills, the horizontal bar chart",
    note:
      "One row per skill, on the 1 to 10 scale. Evidence is the number of proof items behind it. Filled from the skills above when nothing is set here.",
    nameLabel: "Skill",
    namePlaceholder: "Routing & Switching",
    fields: [
      { key: "level", label: "Level", decimals: 1, hint: "1 to 10." },
      { key: "evidence", label: "Evidence" },
    ],
    bar: { fields: ["level"], max: SKILL_SCALE_MAX, unit: "of 10" },
    blank: { name: "", values: { level: 0, evidence: 0 } },
  },
];

export function findChartSpec(id: string): ChartSpec | null {
  return CHART_SPECS.find((spec) => spec.id === id) ?? null;
}

/** One number off a row, or zero when the row does not carry it. */
export function chartValue(row: ChartRow, key: string): number {
  const held = row.values[key];
  return typeof held === "number" && Number.isFinite(held) ? held : 0;
}

/**
 * The value a full bar stands for, for one row.
 *
 * The ceiling is the spec's own maximum or the largest row, whichever is
 * bigger, so a series that outgrows its stated maximum still draws inside the
 * box instead of running off the end of it. A spec with `maxField` reads the
 * ceiling off the row itself, which is how the operational status card lets
 * each row carry its own scale.
 *
 * Exported because the panel draws the same bar beside the inputs, and two
 * copies of this rule would drift.
 */
export function chartBarCeiling(bar: ChartBarSpec, rows: ChartRow[], row?: ChartRow): number {
  if (bar.maxField) {
    const own = row ? chartValue(row, bar.maxField) : 0;
    return own > 0 ? own : bar.max;
  }

  const largest = rows.reduce(
    (most, held) => Math.max(most, bar.fields.reduce((sum, key) => sum + chartValue(held, key), 0)),
    0,
  );

  return Math.max(bar.max, largest, 1);
}

/** How full the preview bar is for one row, 0 to 100. */
export function chartBarPercent(bar: ChartBarSpec, row: ChartRow, rows: ChartRow[]): number {
  const total = bar.fields.reduce((sum, key) => sum + chartValue(row, key), 0);
  return clampPercent(total, chartBarCeiling(bar, rows, row));
}

function clampPercent(value: number, ceiling: number): number {
  if (ceiling <= 0) return 0;
  return Math.max(0, Math.min(100, (value / ceiling) * 100));
}

/** Rounds to the field's own precision, so the editor and the store agree. */
export function roundToField(value: number, field: ChartFieldSpec): number {
  const decimals = field.decimals ?? 0;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * The numbers a chart shows when the owner has set none.
 *
 * This is the same arithmetic the chart used before it could be overridden, so
 * a chart with nothing set looks exactly as it did.
 */
export function computedChartRows(id: string, sources: ChartSources): ChartRow[] {
  switch (id) {
    case "health":
      return HEALTH_ROWS.map((row) => ({ name: row.name, values: { ...row.values } }));

    case "career-tenure": {
      const years = new Map<number, { ic: number; lead: number }>();
      const thisYear = new Date().getFullYear();

      sources.career.forEach((role) => {
        const startYear = Number(role.start.slice(0, 4));
        const endYear = role.end ? Number(role.end.slice(0, 4)) : thisYear;
        if (!Number.isFinite(startYear)) return;

        for (let year = startYear; year <= endYear; year++) {
          const held = years.get(year) ?? { ic: 0, lead: 0 };
          if (role.level === "IC") held.ic += 1;
          else held.lead += 1;
          years.set(year, held);
        }
      });

      return [...years.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([year, held]) => ({ name: String(year), values: { ic: held.ic, lead: held.lead } }));
    }

    case "role-scope":
      return sources.career.map((role) => ({
        name: role.title,
        values: { months: monthsBetween(role.start, role.end) },
      }));

    case "credentials-validity":
      return sources.certifications
        .map((cert) => {
          const left = monthsTo(cert.expires);
          return {
            name: cert.name,
            // A certificate without an expiry is drawn as a full bar.
            values: { months: left === null ? 120 : Math.max(left, -12) },
          };
        })
        .sort((a, b) => b.values.months - a.values.months);

    case "credentials-domains":
      return unique(sources.certifications.map((cert) => cert.domain)).map((domain) => {
        const held = sources.certifications.filter((cert) => cert.domain === domain);
        return {
          name: domain,
          values: {
            count: held.length,
            cost: round1(held.reduce((sum, cert) => sum + cert.cost, 0)),
          },
        };
      });

    case "projects-kinds":
      return unique(sources.projects.map((project) => project.kind)).map((kind) => {
        const held = sources.projects.filter((project) => project.kind === kind);
        return {
          name: kind,
          values: {
            count: held.length,
            budget: round1(held.reduce((sum, project) => sum + project.budgetM, 0)),
          },
        };
      });

    case "stack-usage": {
      const counts = new Map<string, number>();
      sources.projects.forEach((project) => {
        project.stack.forEach((tool) => counts.set(tool, (counts.get(tool) ?? 0) + 1));
      });

      return [...counts.entries()]
        .filter(([, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([tool, count]) => ({ name: tool, values: { count } }));
    }

    case "experience-spread": {
      const byCategory = new Map<string, { years: number; count: number }>();
      sources.skills.forEach((skill) => {
        const held = byCategory.get(skill.category) ?? { years: 0, count: 0 };
        held.years = Math.max(held.years, skill.years);
        held.count += 1;
        byCategory.set(skill.category, held);
      });

      return [...byCategory.entries()]
        .sort((a, b) => b[1].years - a[1].years)
        .map(([category, held]) => ({
          name: category,
          values: { years: held.years, count: held.count },
        }));
    }

    case "skill-balance": {
      const byCategory = new Map<string, { total: number; count: number; evidence: number }>();
      sources.skills.forEach((skill) => {
        const held = byCategory.get(skill.category) ?? { total: 0, count: 0, evidence: 0 };
        held.total += skill.level;
        held.count += 1;
        held.evidence += skill.evidence.length;
        byCategory.set(skill.category, held);
      });

      return [...byCategory.entries()].map(([category, held]) => ({
        name: category,
        values: {
          level: round1(held.total / held.count),
          evidence: held.evidence,
        },
      }));
    }

    case "skill-top":
      return [...sources.skills]
        .sort((a, b) => b.level - a.level)
        .slice(0, 10)
        .map((skill) => ({
          name: skill.name,
          values: { level: skill.level, evidence: skill.evidence.length },
        }));

    default:
      return [];
  }
}

/** Months until expiry. Negative means it has already passed. */
export function monthsTo(iso: string | null): number | null {
  if (!iso) return null;
  const [year, month] = iso.split("-").map(Number);
  const now = new Date();
  return (year - now.getFullYear()) * 12 + (month - (now.getMonth() + 1));
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
