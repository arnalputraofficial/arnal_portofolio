/**
 * Copy that appears on every page: navigation, header, footer, and the profile
 * details that are repeated across the site.
 *
 * Defaults are pulled from the data file where one already exists, so there is
 * still a single source of truth for the initial value.
 */
import { profile } from "@/data/portfolio";
import type { ContentEntry } from "./types";

export const GLOBAL_CONTENT: ContentEntry[] = [
  // ------------------------------------------------------------- profile
  {
    key: "global.profile.avatar",
    page: "global",
    label: "Profile photo",
    default: "",
    hint: "Storage path or full public image URL. Upload directly in the profile section or paste a URL.",
  },
  {
    key: "global.profile.fullName",
    page: "global",
    label: "Full name",
    default: profile.fullName,
    hint: "Header, footer, and the opening paragraph on the home page.",
  },
  {
    key: "global.profile.role",
    page: "global",
    label: "Role title",
    default: profile.role,
    hint: "Shown under the name in the header.",
  },
  {
    key: "global.profile.tagline",
    page: "global",
    label: "Tagline",
    default: profile.tagline,
    multiline: true,
    hint: "One sentence describing what you do.",
  },
  {
    key: "global.profile.location",
    page: "global",
    label: "Location",
    default: profile.location,
    hint: "Used in the header meta line, the home call block, and the footer.",
  },
  {
    key: "global.profile.timezone",
    page: "global",
    label: "Timezone",
    default: profile.timezone,
    hint: "Used in the header meta line and the footer.",
  },
  {
    key: "global.profile.email",
    page: "global",
    label: "Contact email address",
    default: profile.email,
    hint: "Shown in the header, footer, and About. The mailto link and the contact form follow this value, so the displayed text and the link always match.",
  },
  {
    key: "global.profile.availability",
    page: "global",
    label: "Availability line",
    default: profile.availability,
    multiline: true,
    hint: "Shown in the home call block and the footer.",
  },

  // ------------------------------------------------------ header and nav
  {
    key: "nav.home",
    page: "global",
    label: "Navigation: Home",
    default: "Home",
  },
  {
    key: "nav.career",
    page: "global",
    label: "Navigation: Career",
    default: "Career",
  },
  {
    key: "nav.projects",
    page: "global",
    label: "Navigation: Projects",
    default: "Projects",
  },
  {
    key: "nav.skills",
    page: "global",
    label: "Navigation: Skills",
    default: "Skills",
  },
  {
    key: "nav.credentials",
    page: "global",
    label: "Navigation: Credentials",
    default: "Credentials",
  },
  {
    key: "nav.about",
    page: "global",
    label: "Navigation: About",
    default: "About",
  },
  {
    key: "nav.contact",
    page: "global",
    label: "Navigation: Contact",
    default: "Contact",
  },
  {
    key: "nav.steadbyte",
    page: "global",
    label: "Navigation: About Steadbyte",
    default: "About Steadbyte",
  },
  {
    key: "header.monogram",
    page: "global",
    label: "Header monogram",
    default: "AF",
    hint: "Two letters shown in the square mark next to your name.",
  },
  {
    key: "header.cta",
    page: "global",
    label: "Header button",
    default: "Hire Me",
    hint: "The button on the right of the desktop header.",
  },
  {
    key: "header.menu.open",
    page: "global",
    label: "Menu button, open state",
    default: "Open menu",
    hint: "Screen reader label for the mobile menu button.",
  },
  {
    key: "header.menu.close",
    page: "global",
    label: "Menu button, close state",
    default: "Close menu",
    hint: "Screen reader label while the mobile menu is open.",
  },
  {
    key: "header.aria.home",
    page: "global",
    label: "Home link description",
    default: "Go to home",
    hint: "Screen reader label for the header mark.",
  },
  {
    key: "header.aria.nav",
    page: "global",
    label: "Main navigation description",
    default: "Main navigation",
    hint: "Screen reader label for the navigation landmark.",
  },

  // -------------------------------------------------------------- footer
  {
    key: "footer.rollingStrip",
    page: "global",
    label: "Footer skill strip",
    default:
      "Kubernetes\nTerraform\nPostgreSQL\nObservability\nITIL 4\nBudget Ownership\nTeam Mentoring\nNetwork Security\nArchitecture Design\nGuided On-call",
    multiline: true,
    hint: "One item per line. Delete every line to hide the strip.",
  },
  {
    key: "footer.closing",
    page: "global",
    label: "Footer statement",
    default: "Good systems do not feel heroic.\n*They just work, every single day.*",
    multiline: true,
    hint:
      "One line here is one line on the page. Wrap a line in asterisks to render it in the dimmer colour, like *this line*.",
  },
  {
    key: "footer.siteMap",
    page: "global",
    label: "Footer column heading: navigation",
    default: "Site Map",
  },
  {
    key: "footer.network",
    page: "global",
    label: "Footer column heading: network",
    default: "Network",
  },
  {
    key: "footer.aria.map",
    page: "global",
    label: "Footer navigation description",
    default: "Site map",
    hint: "Screen reader label for the footer navigation landmark.",
  },
  {
    key: "footer.copyright",
    page: "global",
    label: "Copyright line",
    default: "Built by hand, run on purpose.",
    hint: "The year and your name are added automatically before this text.",
  },
  {
    key: "footer.dataNote",
    page: "global",
    label: "Footer data note",
    default: "Project & career data is sample content. Replace it in src/data/portfolio.ts",
    multiline: true,
    hint: "An honesty note about the sample data. Remove it once the real history is in place.",
  },

  // ------------------------------------------------- table chrome (shared)
  {
    key: "global.table.search",
    page: "global",
    label: "Table: search placeholder",
    default: "Search across all columns",
    hint: "Used when a table does not set its own search hint.",
  },
  {
    key: "global.table.empty",
    page: "global",
    label: "Table: empty message",
    default: "No rows match this filter.",
    hint: "Shown when the filters leave no rows.",
  },
  {
    key: "global.table.emptyHint",
    page: "global",
    label: "Table: empty message hint",
    default: "Try loosening the filters or the keyword",
  },
  {
    key: "global.table.clearSearch",
    page: "global",
    label: "Table: clear search label",
    default: "Clear search",
    hint: "Screen reader label for the small button inside the search box.",
  },
  {
    key: "global.table.filterBy",
    page: "global",
    label: "Table: filter description",
    default: "Filter by {label}",
    hint: "Token: {label} is the filter name.",
  },
  {
    key: "global.table.all",
    page: "global",
    label: "Table: filter all option",
    default: "All {label}",
    hint: "Token: {label} is the filter name, already lowercased.",
  },
  {
    key: "global.table.reset",
    page: "global",
    label: "Table: reset button",
    default: "Reset",
  },
  {
    key: "global.table.showing",
    page: "global",
    label: "Table: row count",
    default: "Showing {shown} of {total} rows",
    hint: "Tokens: {shown}, {total}.",
  },
  {
    key: "global.table.activeFilters",
    page: "global",
    label: "Table: active filter count",
    default: ", {count} active filters",
    hint: "Token: {count}. Appended to the row count, so keep the leading comma.",
  },
  {
    key: "global.table.page",
    page: "global",
    label: "Table: page indicator",
    default: "Page {page} / {pages}",
    hint: "Tokens: {page}, {pages}.",
  },
  {
    key: "global.table.previous",
    page: "global",
    label: "Table: previous page label",
    default: "Previous page",
    hint: "Screen reader label for the back arrow.",
  },
  {
    key: "global.table.next",
    page: "global",
    label: "Table: next page label",
    default: "Next page",
    hint: "Screen reader label for the forward arrow.",
  },
];
