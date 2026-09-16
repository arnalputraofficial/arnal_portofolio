/**
 * Credentials page copy.
 */
import type { ContentEntry } from "./types";

export const CREDENTIALS_CONTENT: ContentEntry[] = [
  {
    key: "credentials.eyebrow",
    page: "credentials",
    label: "Page eyebrow",
    default: "Credentials File",
  },
  {
    key: "credentials.title",
    page: "credentials",
    label: "Page main heading",
    default: "Certifications and formal qualifications",
  },
  {
    key: "credentials.lead",
    page: "credentials",
    label: "Page lead paragraph",
    default:
      "A certificate is not proof of skill, only proof that I passed a specific exam once. That is why I show the expired ones and the ones being renewed, not just the active ones.",
    multiline: true,
  },
  {
    key: "credentials.stat.active",
    page: "credentials",
    label: "Stat label: active certs",
    default: "Active certificates",
  },
  {
    key: "credentials.stat.renewal",
    page: "credentials",
    label: "Stat label: needs renewal",
    default: "Needs renewal",
  },
  {
    key: "credentials.stat.domains",
    page: "credentials",
    label: "Stat label: domains covered",
    default: "Domains covered",
  },
  {
    key: "credentials.stat.investment",
    page: "credentials",
    label: "Stat label: total investment",
    default: "Total invested",
  },
  {
    key: "credentials.validity.eyebrow",
    page: "credentials",
    label: "Validity section eyebrow",
    default: "Validity",
  },
  {
    key: "credentials.validity.title",
    page: "credentials",
    label: "Validity section heading",
    default: "How much longer each credential holds up",
  },
  {
    key: "credentials.composition.eyebrow",
    page: "credentials",
    label: "Composition section eyebrow",
    default: "Composition",
  },
  {
    key: "credentials.composition.title",
    page: "credentials",
    label: "Composition section heading",
    default: "The domains I went after, and what they mean for a lead role",
  },
  {
    key: "credentials.table.eyebrow",
    page: "credentials",
    label: "Table section eyebrow",
    default: "Full file",
  },
  {
    key: "credentials.table.title",
    page: "credentials",
    label: "Table section heading",
    default: "Every credential, filterable and checkable",
  },
  {
    key: "credentials.table.description",
    page: "credentials",
    label: "Table section description",
    default:
      "Use the search to find a specific issuer, or filter by domain and status. The credential ID column can be copied for verification.",
    multiline: true,
  },
];
