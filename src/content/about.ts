/**
 * About page copy.
 */
import type { ContentEntry } from "./types";

export const ABOUT_CONTENT: ContentEntry[] = [
  {
    key: "about.eyebrow",
    page: "about",
    label: "Page eyebrow",
    default: "Personal File",
  },
  {
    key: "about.title",
    page: "about",
    label: "Page main heading",
    default: "I am most useful when the systems are not okay",
  },
  {
    key: "about.lead",
    page: "about",
    label: "Page lead paragraph",
    default:
      "I build and lead IT teams that keep systems running when pressure arrives, not teams that merely keep servers powered on.",
    multiline: true,
  },
  {
    key: "about.stat.tenure",
    page: "about",
    label: "Stat label: technical tenure",
    default: "Technical tenure",
  },
  {
    key: "about.stat.people",
    page: "about",
    label: "Stat label: people led",
    default: "People led",
  },
  {
    key: "about.stat.sites",
    page: "about",
    label: "Stat label: sites watched over",
    default: "Sites watched over",
  },
  {
    key: "about.stat.tools",
    page: "about",
    label: "Stat label: tools used",
    default: "Tools used along the way",
  },
  {
    key: "about.stat.tenure.suffix",
    page: "about",
    label: "Stat suffix: tenure counter",
    default: " yrs",
  },
  {
    key: "about.stat.tenure.hint",
    page: "about",
    label: "Stat hint: tenure",
    default: "{duration} since the first role",
    hint: "Token: {duration} is a human-readable span.",
  },
  {
    key: "about.stat.people.suffix",
    page: "about",
    label: "Stat suffix: people counter",
    default: " people",
  },
  {
    key: "about.stat.people.hint.empty",
    page: "about",
    label: "Stat hint: no current role",
    default: "No role recorded yet",
  },
  {
    key: "about.stat.sites.hint",
    page: "about",
    label: "Stat hint: sites managed",
    default: "Stores, warehouses, and branch offices",
  },
  {
    key: "about.stat.tools.hint",
    page: "about",
    label: "Stat hint: tools touched",
    default: "Spread across real projects, not a wish list",
  },
  {
    key: "about.working.eyebrow",
    page: "about",
    label: "Working style eyebrow",
    default: "Working style",
  },
  {
    key: "about.working.title",
    page: "about",
    label: "Working style heading",
    default: "Four things you can use to test me",
  },
  {
    key: "about.working.description",
    page: "about",
    label: "Working style description",
    default: "Not scores I pin on myself, but habits you can check with a follow-up question.",
    multiline: true,
  },
  {
    key: "about.principles.eyebrow",
    page: "about",
    label: "Principles eyebrow",
    default: "Principles",
  },
  {
    key: "about.principles.title",
    page: "about",
    label: "Principles heading",
    default: "Four sentences I repeat to the team",
  },
  {
    key: "about.principles.description",
    page: "about",
    label: "Principles description",
    default:
      "A principle that has never been used to turn down a request is not a principle, it is decoration.",
    multiline: true,
  },
  {
    key: "about.missteps.eyebrow",
    page: "about",
    label: "Missteps eyebrow",
    default: "Missteps",
  },
  {
    key: "about.mistakes.title",
    page: "about",
    label: "Missteps heading",
    default: "Three decisions I regret, with the price attached",
  },
  {
    key: "about.mistakes.description",
    page: "about",
    label: "Missteps description",
    default:
      "This section is usually missing from a portfolio. I include it because how someone handles a mistake says more than their list of wins.",
    multiline: true,
  },
  {
    key: "about.faq.eyebrow",
    page: "about",
    label: "FAQ eyebrow",
    default: "Questions",
  },
  {
    key: "about.faq.title",
    page: "about",
    label: "FAQ heading",
    default: "What usually comes up after reading the whole page",
  },
  {
    key: "about.faq.role.answer",
    page: "about",
    label: "FAQ answer: role you are ready for",
    default:
      "{availability}. I am most useful in organisations with many operational sites, a small team that has to grow, and a budget that needs guarding. Not a place looking for someone to simply keep servers powered on.",
    multiline: true,
    hint: "Token: {availability}, pulled from the profile availability text.",
  },

  // ------------------------------------------------------ profile panel
  {
    key: "about.profile.eyebrow",
    page: "about",
    label: "Profile panel eyebrow",
    default: "profile",
  },
  {
    key: "about.profile.field.name",
    page: "about",
    label: "Profile panel field: name",
    default: "name",
  },
  {
    key: "about.profile.field.role",
    page: "about",
    label: "Profile panel field: role",
    default: "role",
  },
  {
    key: "about.profile.field.location",
    page: "about",
    label: "Profile panel field: location",
    default: "location",
  },
  {
    key: "about.profile.field.timezone",
    page: "about",
    label: "Profile panel field: time zone",
    default: "time zone",
  },
  {
    key: "about.profile.field.email",
    page: "about",
    label: "Profile panel field: email",
    default: "email",
  },
  {
    key: "about.profile.button",
    page: "about",
    label: "Profile panel button",
    default: "Send a message",
  },
  {
    key: "about.cta.title",
    page: "about",
    label: "CTA title",
    default: "Let's talk",
  },
  {
    key: "about.cta.body",
    page: "about",
    label: "CTA body",
    default: "Reach out if you want to compare notes on running IT in the field.",
    multiline: true,
  },
  {
    key: "about.cta.button",
    page: "about",
    label: "CTA button",
    default: "Get in touch",
  },
  {
    key: "about.projects.button",
    page: "about",
    label: "Profile panel: projects button",
    default: "Open the project file",
  },
];
