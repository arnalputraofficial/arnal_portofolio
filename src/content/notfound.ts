/**
 * NotFound page copy.
 */
import type { ContentEntry } from "./types";

export const NOTFOUND_CONTENT: ContentEntry[] = [
  {
    key: "notfound.code",
    page: "notfound",
    label: "Error code marker",
    default: "404",
    hint: "Shown twice: as the small marker and as the large outline numeral.",
  },
  {
    key: "notfound.eyebrow",
    page: "notfound",
    label: "Error eyebrow",
    default: "page not found",
  },
  {
    key: "notfound.aside.title",
    page: "notfound",
    label: "Aside heading: mistyped address",
    default: "if the address was mistyped",
  },
  {
    key: "notfound.aside.body",
    page: "notfound",
    label: "Aside paragraph: mistyped address",
    default:
      "Every address on this site is a plain English word: /career, /projects, /credentials. There is no translated version behind them, so adding another word will not help.",
    multiline: true,
  },
  {
    key: "notfound.aside.shortcuts",
    page: "notfound",
    label: "Aside heading: shortcuts",
    default: "shortcuts",
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
    key: "notfound.mistyped.title",
    page: "notfound",
    label: "Mistyped address eyebrow",
    default: "if the address was mistyped",
  },
  {
    key: "notfound.mistyped.lead",
    page: "notfound",
    label: "Mistyped address lead",
    default: "Every address on this site is a plain English word:",
    hint: "Printed before the three inline route examples. Keep the closing colon.",
  },
  {
    key: "notfound.mistyped.tail",
    page: "notfound",
    label: "Mistyped address continuation",
    default:
      "There is no translated version behind them, so adding another word will not help.",
    multiline: true,
    hint: "Printed after the three inline route examples. The sentence is split around them.",
  },
  {
    key: "notfound.shortcuts.title",
    page: "notfound",
    label: "Shortcuts eyebrow",
    default: "shortcuts",
  },
  {
    key: "notfound.available.title",
    page: "notfound",
    label: "Available pages heading",
    default: "Every page that is available",
  },
  {
    key: "notfound.route.home.hint",
    page: "notfound",
    label: "Route card: home hint",
    default: "Summary and headline numbers",
  },
  {
    key: "notfound.route.career.hint",
    page: "notfound",
    label: "Route card: career hint",
    default: "Ten years of role history",
  },
  {
    key: "notfound.route.projects.hint",
    page: "notfound",
    label: "Route card: projects hint",
    default: "Twelve pieces of traceable work",
  },
  {
    key: "notfound.route.credentials.hint",
    page: "notfound",
    label: "Route card: credentials hint",
    default: "Including the expired ones",
  },
  {
    key: "notfound.route.skills.hint",
    page: "notfound",
    label: "Route card: skills hint",
    default: "Self ratings and registry data",
  },
  {
    key: "notfound.route.about.hint",
    page: "notfound",
    label: "Route card: about hint",
    default: "Working principles and my mistakes",
  },
  {
    key: "notfound.route.contact.hint",
    page: "notfound",
    label: "Route card: contact hint",
    default: "Email, GitHub, and LinkedIn",
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
    key: "notfound.report.title",
    page: "notfound",
    label: "Broken link report button",
    default: "Report a broken link",
  },
  {
    key: "notfound.report.body",
    page: "notfound",
    label: "Broken link report paragraph",
    default:
      "If you ended up here through a link from somewhere else, I want to know. Send me the origin address so I can fix it.",
    multiline: true,
  },
  {
    key: "notfound.report.button",
    page: "notfound",
    label: "Broken link report button",
    default: "Report a broken link",
  },
  {
    key: "notfound.route.1.label",
    page: "notfound",
    label: "Route list 1: name",
    default: "Home",
  },
  {
    key: "notfound.route.1.hint",
    page: "notfound",
    label: "Route list 1: description",
    default: "Summary and headline numbers",
  },
  {
    key: "notfound.route.2.label",
    page: "notfound",
    label: "Route list 2: name",
    default: "Career",
  },
  {
    key: "notfound.route.2.hint",
    page: "notfound",
    label: "Route list 2: description",
    default: "Ten years of role history",
  },
  {
    key: "notfound.route.3.label",
    page: "notfound",
    label: "Route list 3: name",
    default: "Projects",
  },
  {
    key: "notfound.route.3.hint",
    page: "notfound",
    label: "Route list 3: description",
    default: "Twelve pieces of traceable work",
  },
  {
    key: "notfound.route.4.label",
    page: "notfound",
    label: "Route list 4: name",
    default: "Skills",
  },
  {
    key: "notfound.route.4.hint",
    page: "notfound",
    label: "Route list 4: description",
    default: "Self ratings and registry data",
  },
  {
    key: "notfound.route.5.label",
    page: "notfound",
    label: "Route list 5: name",
    default: "Credentials",
  },
  {
    key: "notfound.route.5.hint",
    page: "notfound",
    label: "Route list 5: description",
    default: "Including the expired ones",
  },
  {
    key: "notfound.route.6.label",
    page: "notfound",
    label: "Route list 6: name",
    default: "About",
  },
  {
    key: "notfound.route.6.hint",
    page: "notfound",
    label: "Route list 6: description",
    default: "Working principles and my mistakes",
  },
  {
    key: "notfound.route.7.label",
    page: "notfound",
    label: "Route list 7: name",
    default: "Contact",
  },
  {
    key: "notfound.route.7.hint",
    page: "notfound",
    label: "Route list 7: description",
    default: "Email, GitHub, and LinkedIn",
  },
];
