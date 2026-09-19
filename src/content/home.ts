/**
 * Home page copy.
 *
 * Some entries accept tokens in braces, for example {sites}. The page fills
 * them in from the data file so the number stays correct while the surrounding
 * sentence stays editable. Each entry lists its tokens in the hint.
 */
import { principles } from "@/data/portfolio";
import type { ContentEntry } from "./types";

const principleEntries: ContentEntry[] = principles.flatMap((principle, i) => [
  {
    key: `home.principles.${i + 1}.title`,
    page: "home" as const,
    label: `Principle ${i + 1}: title`,
    default: principle.title,
  },
  {
    key: `home.principles.${i + 1}.body`,
    page: "home" as const,
    label: `Principle ${i + 1}: body`,
    default: principle.body,
    multiline: true,
  },
]);

export const HOME_CONTENT: ContentEntry[] = [
  // ---------------------------------------------------------------- hero
  {
    key: "home.hero.badge",
    page: "home",
    label: "Hero badge",
    default: "open to lead roles",
  },
  {
    key: "home.hero.meta",
    page: "home",
    label: "Hero meta line",
    default: "{location} · {timezone}",
    hint: "Tokens: {location}, {timezone}.",
  },
  {
    key: "home.hero.title",
    page: "home",
    label: "Hero heading",
    default: "An IT Lead who picks\nthe boring systems\nbecause reliability rarely makes headlines.",
    multiline: true,
    hint:
      "One line here is one line on the page. Wrap a line in asterisks to render it in the accent colour, like *the boring systems*. Keep each line short so it does not wrap.",
  },
  {
    key: "home.hero.lead",
    page: "home",
    label: "Hero paragraph",
    default:
      "{name}. Ten years running infrastructure, security, and IT teams across distribution, financial services, and multi-site retail. I work with real budgets, real deadlines, and people who still need to get their work done.",
    multiline: true,
    hint: "Token: {name}.",
  },
  {
    key: "home.hero.cta.primary",
    page: "home",
    label: "Hero button: primary",
    default: "See the career trail",
    hint: "Links to the career page.",
  },
  {
    key: "home.hero.cta.secondary",
    page: "home",
    label: "Hero button: secondary",
    default: "Start a conversation",
    hint: "Opens your email address.",
  },
  {
    key: "home.hero.scene.caption",
    page: "home",
    label: "Interactive scene caption",
    default:
      "The cluster topology I look after: nodes, paths, and the fragile points. Drag to rotate.",
    multiline: true,
    hint: "Sits under the interactive scene on the right of the hero.",
  },
  {
    key: "home.hero.stat.team",
    page: "home",
    label: "Hero stat label: team",
    default: "Team led",
  },
  {
    key: "home.hero.stat.sites",
    page: "home",
    label: "Hero stat label: sites",
    default: "Operating sites",
  },
  {
    key: "home.hero.stat.experience",
    page: "home",
    label: "Hero stat label: experience",
    default: "Experience",
  },
  {
    key: "home.hero.stat.projects",
    page: "home",
    label: "Hero stat label: projects",
    default: "Logged projects",
  },
  {
    key: "home.hero.stat.team.value",
    page: "home",
    label: "Hero stat value: team",
    default: "{count} people",
    hint: "Token: {count}. The number comes from the job history, so only the wording around it is yours.",
  },
  {
    key: "home.hero.stat.experience.value",
    page: "home",
    label: "Hero stat value: experience",
    default: "{count} years",
    hint: "Token: {count}.",
  },

  // -------------------------------------------------------------- strip
  {
    key: "home.stack.marquee",
    page: "home",
    label: "Skill strip",
    default: "",
    multiline: true,
    hint: "One technology per line. Leave empty to build the strip automatically from the working stack in your job history.",
  },

  // --------------------------------------------------------- health card
  {
    key: "home.health.title",
    page: "home",
    label: "Status card: title",
    default: "Operational status",
  },
  {
    key: "home.health.meta",
    page: "home",
    label: "Status card: meta line",
    default: "{sites} stores & warehouses, 1 head office",
    hint: "Token: {sites}.",
  },
  {
    key: "home.health.badge",
    page: "home",
    label: "Status card: badge",
    default: "running",
  },
  {
    key: "home.health.row.availability",
    page: "home",
    label: "Status row: POS availability",
    default: "POS availability",
  },
  {
    key: "home.health.row.incidents",
    page: "home",
    label: "Status row: open incidents",
    default: "Open incidents",
  },
  {
    key: "home.health.row.incidents.unit",
    page: "home",
    label: "Status row: open incidents unit",
    default: "tickets",
    hint: "The word printed after the number, for example 3 tickets. Leave empty to show the bare number.",
  },
  {
    key: "home.health.row.budget",
    page: "home",
    label: "Status row: budget absorbed",
    default: "Budget absorbed",
  },
  {
    key: "home.health.note",
    page: "home",
    label: "Status card: honesty note",
    default: "The figures above are my own internal rubric, not a third-party audit.",
    multiline: true,
  },

  // ------------------------------------------------------------ summary
  {
    key: "home.summary.currentRole",
    page: "home",
    label: "Summary: current role label",
    default: "Current role",
  },
  {
    key: "home.summary.currentRole.none",
    page: "home",
    label: "Summary: current role, none recorded",
    default: "Open to work",
  },
  {
    key: "home.summary.certifications.value",
    page: "home",
    label: "Summary: certifications value",
    default: "{active}/{total}",
    hint: "Tokens: {active}, {total}. Both are counted from the credentials data.",
  },
  {
    key: "home.summary.leadership.value",
    page: "home",
    label: "Summary: leadership value",
    default: "{count} areas",
    hint: "Token: {count}.",
  },
  {
    key: "home.summary.budget.value",
    page: "home",
    label: "Summary: budget value",
    default: "Rp {amount}m",
    hint: "Token: {amount}, already formatted with thousand separators. The m stands for millions.",
  },
  {
    key: "home.summary.currentRole.hint",
    page: "home",
    label: "Summary: current role hint",
    default: "{company} · {tenure}",
    hint: "Tokens: {company}, {tenure}.",
  },
  {
    key: "home.summary.certifications",
    page: "home",
    label: "Summary: certifications label",
    default: "Active certifications",
  },
  {
    key: "home.summary.certifications.hint",
    page: "home",
    label: "Summary: certifications hint",
    default: "The rest are renewing or already expired",
  },
  {
    key: "home.summary.leadership",
    page: "home",
    label: "Summary: leadership label",
    default: "Leadership skills",
  },
  {
    key: "home.summary.leadership.hint",
    page: "home",
    label: "Summary: leadership hint",
    default: "Self-assessed, flagged honestly on the Skills page",
  },
  {
    key: "home.summary.budget",
    page: "home",
    label: "Summary: budget label",
    default: "Budget managed",
  },
  {
    key: "home.summary.budget.hint",
    page: "home",
    label: "Summary: budget hint",
    default: "Accumulated project budget I have owned",
  },

  // -------------------------------------------------------------- trail
  {
    key: "home.trail.index",
    page: "home",
    label: "Trail section: index marker",
    default: "01",
  },
  {
    key: "home.trail.eyebrow",
    page: "home",
    label: "Trail section: eyebrow",
    default: "Trail",
  },
  {
    key: "home.trail.title",
    page: "home",
    label: "Trail section: heading",
    default: "From daily tickets to the decision table",
  },
  {
    key: "home.trail.description",
    page: "home",
    label: "Trail section: description",
    default:
      "Every stage added a new kind of responsibility. The chart alongside separates time as an individual contributor from time leading a team, so the direction is visible at a glance.",
    multiline: true,
  },
  {
    key: "home.trail.action",
    page: "home",
    label: "Trail section: button",
    default: "Career detail",
  },
  {
    key: "home.trail.chart.title",
    page: "home",
    label: "Trail chart: title",
    default: "Role composition per year",
  },
  {
    key: "home.trail.chart.note",
    page: "home",
    label: "Trail chart: note",
    default:
      "Number of active positions each year, split between individual contributors and team leads.",
    multiline: true,
  },
  {
    key: "home.trail.chart.legend.ic",
    page: "home",
    label: "Trail chart: legend for contributors",
    default: "Individual contributor",
  },
  {
    key: "home.trail.chart.legend.lead",
    page: "home",
    label: "Trail chart: legend for leads",
    default: "Leading a team",
  },

  // ----------------------------------------------------------- projects
  {
    key: "home.projects.index",
    page: "home",
    label: "Projects section: index marker",
    default: "02",
  },
  {
    key: "home.projects.eyebrow",
    page: "home",
    label: "Projects section: eyebrow",
    default: "Projects",
  },
  {
    key: "home.projects.title",
    page: "home",
    label: "Projects section: heading",
    default: "Small budgets, hard constraints, measurable results",
  },
  {
    key: "home.projects.description",
    page: "home",
    label: "Projects section: description",
    default:
      "This map places every project by year and kind of work. Bubble size follows the impact score from my internal rubric, not a marketing claim.",
    multiline: true,
  },
  {
    key: "home.projects.action",
    page: "home",
    label: "Projects section: button",
    default: "All projects",
  },
  {
    key: "home.projects.chart.title",
    page: "home",
    label: "Projects chart: title",
    default: "Project map 2017 to now",
  },
  {
    key: "home.projects.chart.note",
    page: "home",
    label: "Projects chart: note",
    default: "Horizontal axis = start time. Vertical axis = kind of work. Bubble size = impact score.",
    multiline: true,
  },
  {
    key: "home.projects.chart.legend.low",
    page: "home",
    label: "Projects chart: legend for low impact",
    default: "Low impact",
  },
  {
    key: "home.projects.chart.legend.high",
    page: "home",
    label: "Projects chart: legend for high impact",
    default: "High impact",
  },
  {
    key: "home.projects.card.budget",
    page: "home",
    label: "Project card: budget label",
    default: "Budget",
  },
  {
    key: "home.projects.card.budget.value",
    page: "home",
    label: "Project card: budget value",
    default: "Rp {amount}m",
    hint: "Token: {amount}, already formatted with thousand separators. The m stands for millions.",
  },
  {
    key: "home.projects.card.team",
    page: "home",
    label: "Project card: team label",
    default: "Team",
  },
  {
    key: "home.projects.card.impact",
    page: "home",
    label: "Project card: impact label",
    default: "Impact",
  },

  // ------------------------------------------------------------ records
  {
    key: "home.records.index",
    page: "home",
    label: "Records section: index marker",
    default: "03",
  },
  {
    key: "home.records.eyebrow",
    page: "home",
    label: "Records section: eyebrow",
    default: "Records",
  },
  {
    key: "home.records.title",
    page: "home",
    label: "Records section: heading",
    default: "Every project, filterable on your own terms",
  },
  {
    key: "home.records.description",
    page: "home",
    label: "Records section: description",
    default:
      "Not a display card: search by technology, filter by kind or year, then sort by budget or by impact.",
    multiline: true,
  },

  // --------------------------------------------------------- principles
  {
    key: "home.principles.eyebrow",
    page: "home",
    label: "Principles section: eyebrow",
    default: "Principles",
  },
  {
    key: "home.principles.title",
    page: "home",
    label: "Principles section: heading",
    default: "How I make technical decisions",
  },
  ...principleEntries,

  // --------------------------------------------------------------- call
  {
    key: "home.call.eyebrow",
    page: "home",
    label: "Closing block: eyebrow",
    default: "availability",
  },
  {
    key: "home.call.statement",
    page: "home",
    label: "Closing block: statement",
    default:
      "I am not selling a list of technologies. I am offering the habit of keeping systems alive while letting a team grow.",
    multiline: true,
  },
  {
    key: "home.call.cta.primary",
    page: "home",
    label: "Closing block: primary button",
    default: "Start a discussion",
    hint: "Links to the contact page.",
  },
  {
    key: "home.call.cta.secondary",
    page: "home",
    label: "Closing block: secondary button",
    default: "Read the working approach",
    hint: "Links to the about page.",
  },

  // ------------------------------------------------------ section indexes
  {
    key: "home.section.trail.index",
    page: "home",
    label: "Section number: career trail",
    default: "01",
    hint: "The large faded numeral beside the section heading.",
  },
  {
    key: "home.section.projects.index",
    page: "home",
    label: "Section number: projects",
    default: "02",
  },
  {
    key: "home.section.records.index",
    page: "home",
    label: "Section number: records table",
    default: "03",
  },
  {
    key: "home.section.principles.index",
    page: "home",
    label: "Section number: principles",
    default: "04",
  },
];
