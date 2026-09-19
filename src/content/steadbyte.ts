/**
 * About Steadbyte page copy.
 *
 * This page explains the site itself: what it is, what it is not, and which
 * decisions shaped it. Every string below is editable from the admin panel.
 */
import type { ContentEntry } from "./types";

export const STEADBYTE_CONTENT: ContentEntry[] = [
  // ------------------------------------------------------------- page intro
  {
    key: "steadbyte.eyebrow",
    page: "steadbyte",
    label: "Page eyebrow",
    default: "Project Note",
  },
  {
    key: "steadbyte.title",
    page: "steadbyte",
    label: "Page main heading",
    default: "Steadbyte is the site you are reading right now",
  },
  {
    key: "steadbyte.lead",
    page: "steadbyte",
    label: "Page lead paragraph",
    default:
      "Steadbyte is a portfolio site I designed, built, and now maintain myself. It holds my career record, projects, credentials, and skills, and it ships with an admin panel so I can change any sentence on it without touching code.",
    multiline: true,
  },
  {
    key: "steadbyte.intro.index",
    page: "steadbyte",
    label: "Intro index marker",
    default: "08",
    hint: "The small section number shown next to the eyebrow.",
  },
  {
    key: "steadbyte.stat.stack",
    page: "steadbyte",
    label: "Stat label: stack",
    default: "Built with",
  },
  {
    key: "steadbyte.stat.stack.value",
    page: "steadbyte",
    label: "Stat value: stack",
    default: "TS + React",
  },
  {
    key: "steadbyte.stat.stack.hint",
    page: "steadbyte",
    label: "Stat hint: stack",
    default: "TypeScript, React, and a relational database",
  },
  {
    key: "steadbyte.stat.pages",
    page: "steadbyte",
    label: "Stat label: routes",
    default: "Public routes",
  },
  {
    key: "steadbyte.stat.pages.hint",
    page: "steadbyte",
    label: "Stat hint: routes",
    default: "Every one of them real and reachable",
  },
  {
    key: "steadbyte.stat.editing",
    page: "steadbyte",
    label: "Stat label: editing model",
    default: "Editing model",
  },
  {
    key: "steadbyte.stat.editing.value",
    page: "steadbyte",
    label: "Stat value: editing model",
    default: "Draft then publish",
  },
  {
    key: "steadbyte.stat.editing.hint",
    page: "steadbyte",
    label: "Stat hint: editing model",
    default: "Nothing reaches visitors until I publish it",
  },
  {
    key: "steadbyte.stat.owner",
    page: "steadbyte",
    label: "Stat label: ownership",
    default: "Owner",
  },
  {
    key: "steadbyte.stat.owner.value",
    page: "steadbyte",
    label: "Stat value: ownership",
    default: "One person, end to end",
  },
  {
    key: "steadbyte.stat.owner.hint",
    page: "steadbyte",
    label: "Stat hint: ownership",
    default: "Design, data model, and deployment",
  },

  // -------------------------------------------- 01 - summary and current state
  {
    key: "steadbyte.section.summary.index",
    page: "steadbyte",
    label: "Summary section index marker",
    default: "01",
  },
  {
    key: "steadbyte.summary.eyebrow",
    page: "steadbyte",
    label: "Summary eyebrow",
    default: "What it is",
  },
  {
    key: "steadbyte.summary.title",
    page: "steadbyte",
    label: "Summary heading",
    default: "A working record, not a brochure",
  },
  {
    key: "steadbyte.summary.description",
    page: "steadbyte",
    label: "Summary description",
    default:
      "The site exists so that anyone evaluating my work can check the facts themselves instead of taking my word for it.",
    multiline: true,
  },
  {
    key: "steadbyte.summary.status.label",
    page: "steadbyte",
    label: "Summary status label",
    default: "Current state",
  },
  {
    key: "steadbyte.summary.status.value",
    page: "steadbyte",
    label: "Summary status value",
    default: "Live and maintained",
    hint: "Kept honest by editing this value whenever the state changes.",
  },
  {
    key: "steadbyte.summary.fact1.title",
    page: "steadbyte",
    label: "Summary fact 1 title",
    default: "Public side",
  },
  {
    key: "steadbyte.summary.fact1.body",
    page: "steadbyte",
    label: "Summary fact 1 body",
    default:
      "Seven content pages before this one, each anchored on records I can point to: roles with real date ranges, projects with owners and outcomes, and certificates with files attached.",
    multiline: true,
  },
  {
    key: "steadbyte.summary.fact2.title",
    page: "steadbyte",
    label: "Summary fact 2 title",
    default: "Admin side",
  },
  {
    key: "steadbyte.summary.fact2.body",
    page: "steadbyte",
    label: "Summary fact 2 body",
    default:
      "A password protected panel where structured records are edited in tables, and every visible sentence is edited as plain text with a draft and publish step in between.",
    multiline: true,
  },
  {
    key: "steadbyte.summary.fact3.title",
    page: "steadbyte",
    label: "Summary fact 3 title",
    default: "Preview mode",
  },
  {
    key: "steadbyte.summary.fact3.body",
    page: "steadbyte",
    label: "Summary fact 3 body",
    default:
      "While I hold unpublished drafts, I can switch the public site into preview mode and read the page exactly as it will look, with my own drafts swapped in and a banner reminding me they are not live.",
    multiline: true,
  },
  {
    key: "steadbyte.summary.detail.label",
    page: "steadbyte",
    label: "Summary detail list label",
    default: "At a glance",
  },
  {
    key: "steadbyte.summary.detail.1",
    page: "steadbyte",
    label: "Summary detail 1",
    default: "Every page number, heading, and paragraph is stored as an editable key.",
  },
  {
    key: "steadbyte.summary.detail.2",
    page: "steadbyte",
    label: "Summary detail 2",
    default: "Structured records such as roles and projects live in database tables, not in code.",
  },
  {
    key: "steadbyte.summary.detail.3",
    page: "steadbyte",
    label: "Summary detail 3",
    default: "If the database cannot be reached, the site still renders from the defaults shipped in the bundle.",
  },
  {
    key: "steadbyte.summary.detail.4",
    page: "steadbyte",
    label: "Summary detail 4",
    default: "Every change is recorded in a revision history, so a bad edit can be traced back.",
  },

  // ------------------------------------------------ 02 - the problem it solves
  {
    key: "steadbyte.section.problem.index",
    page: "steadbyte",
    label: "Problem section index marker",
    default: "02",
  },
  {
    key: "steadbyte.problem.eyebrow",
    page: "steadbyte",
    label: "Problem eyebrow",
    default: "Why it exists",
  },
  {
    key: "steadbyte.problem.title",
    page: "steadbyte",
    label: "Problem heading",
    default: "Two problems I was tired of solving by hand",
  },
  {
    key: "steadbyte.problem.description",
    page: "steadbyte",
    label: "Problem description",
    default:
      "I built this instead of paying for a template, because neither off the shelf option matched how I actually work.",
    multiline: true,
  },
  {
    key: "steadbyte.problem.item1.title",
    page: "steadbyte",
    label: "Problem 1 title",
    default: "A CV cannot carry evidence",
  },
  {
    key: "steadbyte.problem.item1.body",
    page: "steadbyte",
    label: "Problem 1 body",
    default:
      "A two page document flattens years of operational work into bullet points with no room for the numbers behind them. A site can hold the full record, link a certificate to its file, and show the shape of a project over time.",
    multiline: true,
  },
  {
    key: "steadbyte.problem.item2.title",
    page: "steadbyte",
    label: "Problem 2 title",
    default: "Portfolio sites rot when updates hurt",
  },
  {
    key: "steadbyte.problem.item2.body",
    page: "steadbyte",
    label: "Problem 2 body",
    default:
      "Most personal sites go stale because fixing one typo means opening an editor, finding the file, and redeploying. Here, a correction is a text field in a form, and it takes about as long as writing the correction.",
    multiline: true,
  },
  {
    key: "steadbyte.problem.item3.title",
    page: "steadbyte",
    label: "Problem 3 title",
    default: "Templates hide the engineering",
  },
  {
    key: "steadbyte.problem.item3.body",
    page: "steadbyte",
    label: "Problem 3 body",
    default:
      "A purchased theme would have looked fine and told a reviewer nothing about how I build systems. The data model, the draft and publish flow, and the failure behaviour are the interesting part, so they are mine.",
    multiline: true,
  },

  // ------------------------------------- 03 - my role and the technical choices
  {
    key: "steadbyte.section.role.index",
    page: "steadbyte",
    label: "Role section index marker",
    default: "03",
  },
  {
    key: "steadbyte.role.eyebrow",
    page: "steadbyte",
    label: "Role eyebrow",
    default: "How it was built",
  },
  {
    key: "steadbyte.role.title",
    page: "steadbyte",
    label: "Role heading",
    default: "What I decided, and why",
  },
  {
    key: "steadbyte.role.description",
    page: "steadbyte",
    label: "Role description",
    default:
      "One person wrote every line here, so there is no team to credit and no decisions to attribute elsewhere. These are the four choices that shaped the result.",
    multiline: true,
  },
  {
    key: "steadbyte.role.item1.title",
    page: "steadbyte",
    label: "Decision 1 title",
    default: "Typed end to end",
  },
  {
    key: "steadbyte.role.item1.body",
    page: "steadbyte",
    label: "Decision 1 body",
    default:
      "TypeScript in strict mode across the whole codebase, with no escape hatches. It slows down the first version of a feature and it has caught every shape mismatch between the database and the screens.",
    multiline: true,
  },
  {
    key: "steadbyte.role.item2.title",
    page: "steadbyte",
    label: "Decision 2 title",
    default: "Two layers of content, deliberately",
  },
  {
    key: "steadbyte.role.item2.body",
    page: "steadbyte",
    label: "Decision 2 body",
    default:
      "Long prose is stored as keyed text with a shipped default, while structured records such as roles, projects, certificates, and skills live in relational tables. Prose should never require a schema migration, and a role should never be a paragraph I have to keep consistent by eye.",
    multiline: true,
  },
  {
    key: "steadbyte.role.item3.title",
    page: "steadbyte",
    label: "Decision 3 title",
    default: "Defaults shipped in the bundle",
  },
  {
    key: "steadbyte.role.item3.body",
    page: "steadbyte",
    label: "Decision 3 body",
    default:
      "Every editable string has a default in the code. If the backend is slow or unreachable, the visitor still gets a complete page rather than a blank screen. Editing is an improvement on the defaults, never a dependency for reading.",
    multiline: true,
  },
  {
    key: "steadbyte.role.item4.title",
    page: "steadbyte",
    label: "Decision 4 title",
    default: "Security treated as a feature",
  },
  {
    key: "steadbyte.role.item4.body",
    page: "steadbyte",
    label: "Decision 4 body",
    default:
      "Writes go through server side functions that check the session, the admin panel signs itself out after a period of inactivity, and uploaded files are restricted by type and size. It is a personal site, but it still holds a login, so it is built like one.",
    multiline: true,
  },
  {
    key: "steadbyte.role.stack.label",
    page: "steadbyte",
    label: "Stack list label",
    default: "The stack behind this page",
  },
  {
    key: "steadbyte.role.stack.1",
    page: "steadbyte",
    label: "Stack item 1",
    default: "React with TypeScript for the interface",
  },
  {
    key: "steadbyte.role.stack.2",
    page: "steadbyte",
    label: "Stack item 2",
    default: "Tailwind CSS for the design system",
  },
  {
    key: "steadbyte.role.stack.3",
    page: "steadbyte",
    label: "Stack item 3",
    default: "A hosted relational database with row level security for records and content",
  },
  {
    key: "steadbyte.role.stack.4",
    page: "steadbyte",
    label: "Stack item 4",
    default: "Server side functions for authenticated writes and contact mail",
  },
  {
    key: "steadbyte.role.stack.5",
    page: "steadbyte",
    label: "Stack item 5",
    default: "Object storage for certificates, project photos, and the profile image",
  },
  {
    key: "steadbyte.role.stack.6",
    page: "steadbyte",
    label: "Stack item 6",
    default: "A static build deployed to a global edge network",
  },
  {
    key: "steadbyte.role.stack.badge1",
    page: "steadbyte",
    label: "Stack badge 1",
    default: "Own build",
  },
  {
    key: "steadbyte.role.stack.badge2",
    page: "steadbyte",
    label: "Stack badge 2",
    default: "No template",
  },

  // -------------------------------------------------- 04 - the honest footnote
  {
    key: "steadbyte.section.honest.index",
    page: "steadbyte",
    label: "Honest notes section index marker",
    default: "04",
  },
  {
    key: "steadbyte.honest.eyebrow",
    page: "steadbyte",
    label: "Honest notes eyebrow",
    default: "Honest notes",
  },
  {
    key: "steadbyte.honest.title",
    page: "steadbyte",
    label: "Honest notes heading",
    default: "What this site does not do yet",
  },
  {
    key: "steadbyte.honest.description",
    page: "steadbyte",
    label: "Honest notes description",
    default:
      "A page about my own work is the easiest place to oversell, so here is the list of things I have not built rather than a list of near future features.",
    multiline: true,
  },
  {
    key: "steadbyte.honest.item1",
    page: "steadbyte",
    label: "Honest note 1",
    default: "There is no public analytics dashboard. Traffic numbers are not something I publish.",
  },
  {
    key: "steadbyte.honest.item2",
    page: "steadbyte",
    label: "Honest note 2",
    default: "There is no automated test suite yet. Correctness currently rests on type checking, a production build, and manual checks per release.",
  },
  {
    key: "steadbyte.honest.item3",
    page: "steadbyte",
    label: "Honest note 3",
    default: "Content is written in one language at a time. I have not built a side by side translation workflow.",
  },
  {
    key: "steadbyte.honest.item4",
    page: "steadbyte",
    label: "Honest note 4",
    default: "There is no offline mode or native mobile app. This is a responsive website and nothing more.",
  },
  {
    key: "steadbyte.honest.item5",
    page: "steadbyte",
    label: "Honest note 5",
    default: "Charts on the project pages are hand entered from my own records, not pulled live from a monitoring system.",
  },

  // ---------------------------------------------------------------- closing
  {
    key: "steadbyte.closing.title",
    page: "steadbyte",
    label: "Closing title",
    default: "Curious about a specific decision?",
  },
  {
    key: "steadbyte.closing.body",
    page: "steadbyte",
    label: "Closing body",
    default:
      "If you want the reasoning behind the data model, the publish flow, or anything else on this site, ask me directly. I would rather explain a choice than defend a claim.",
    multiline: true,
  },
];
