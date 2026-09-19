/**
 * Types for the entry layer.
 *
 * Job history, projects, certifications, and skills used to be constants in
 * src/data/portfolio.ts. They now live in Postgres, and that file is kept as
 * the sample set the site falls back to while a list is still empty.
 *
 * The stored shape is deliberately a superset of the published shape: every row
 * carries `visible` and `sortOrder`, which the panel needs and the public pages
 * ignore. Keeping them on the same object means the panel does not have to
 * refetch anything the page already has.
 */
import type { Certification, Project, Role, Skill } from "@/data/portfolio";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;

export type EntryTable = "career" | "projects" | "certifications" | "skills";

/** The Postgres table behind each list. */
export const ENTRY_TABLE: Record<EntryTable, string> = {
  career: "portfolio_career",
  projects: "portfolio_projects",
  certifications: "portfolio_certifications",
  skills: "portfolio_skills",
};

/** Fields every stored entry carries and the public pages never read. */
export interface StoredEntry {
  id: string;
  /** False means the row is invisible to the public API, not merely filtered here. */
  visible: boolean;
  sortOrder: number;
}

export interface CareerEntry extends Role, StoredEntry {}
export interface ProjectEntry extends Project, StoredEntry {}
export interface SkillEntry extends Skill, StoredEntry {}

export interface CertificationEntry extends Certification, StoredEntry {
  /** Optional on the bundled samples, always present once stored. */
  credentialUrl: string;
}

export interface CertificationImage {
  id: string;
  certificationId: string;
  storagePath: string;
  caption: string;
  /**
   * What the stored object actually is. A scan can be a PDF, and the viewer has
   * to know before it decides between an image and an embedded document, so the
   * type is recorded on upload rather than inferred from the file name.
   */
  mimeType: string;
  width: number | null;
  height: number | null;
  byteSize: number | null;
  sortOrder: number;
}

/** True for a scan the browser renders as a document instead of a picture. */
export function isPdfScan(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

/**
 * A screenshot or photo attached to a project.
 *
 * The same shape as a certificate scan minus the document case: a project
 * picture is always a picture, so the detail dialog never has to branch
 * between an image and an embedded viewer.
 */
export interface ProjectImage {
  id: string;
  projectId: string;
  storagePath: string;
  /** The words that go with the picture. Optional, and written after upload. */
  caption: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  byteSize: number | null;
  sortOrder: number;
}

/**
 * One point on the "Budget and impact per year" chart, set by hand.
 *
 * The chart used to average the impact of the projects dated to each year,
 * which made the line a side effect of the table. An empty list is what "not
 * set yet" looks like, and the chart falls back to that average when it is.
 */
export interface ProjectCurvePoint {
  year: number;
  /** Bar height, in millions of rupiah, matching a project's budgetM. */
  budgetM: number;
  /** Line height, 0 to 100, matching a project's impact. */
  impact: number;
}

/** The payload of the portfolio_entries() function. */
export interface EntrySnapshot {
  version: number;
  career: CareerEntry[];
  projects: ProjectEntry[];
  projectImages: ProjectImage[];
  projectCurve: ProjectCurvePoint[];
  certifications: CertificationEntry[];
  certificationImages: CertificationImage[];
  skills: SkillEntry[];
}

/**
 * Everything below is a boundary: the payload comes from the network, so a
 * missing key is filled with the empty value the pages expect rather than
 * being trusted. The value lists (project kind, certificate domain, skill
 * category, role level) are checked by the database before they are stored, so
 * they are narrowed here rather than re-validated.
 */
type Raw = Record<string, unknown>;

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asOptionalText(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asOptionalNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asRows(value: unknown): Raw[] {
  return Array.isArray(value) ? value.filter((row): row is Raw => typeof row === "object" && row !== null) : [];
}

function parseCareer(row: Raw): CareerEntry {
  return {
    id: asText(row.id),
    title: asText(row.title),
    company: asText(row.company),
    sector: asText(row.sector),
    location: asText(row.location),
    start: asText(row.start),
    end: asOptionalText(row.end),
    level: asText(row.level) as Role["level"],
    headcount: asNumber(row.headcount),
    summary: asText(row.summary),
    highlights: asList(row.highlights),
    stack: asList(row.stack),
    visible: asBoolean(row.visible, true),
    sortOrder: asNumber(row.sortOrder),
  };
}

function parseProject(row: Raw): ProjectEntry {
  return {
    id: asText(row.id),
    name: asText(row.name),
    kind: asText(row.kind) as Project["kind"],
    status: asText(row.status) as Project["status"],
    role: asText(row.role),
    year: asNumber(row.year),
    months: asNumber(row.months),
    teamSize: asNumber(row.teamSize),
    budgetM: asNumber(row.budgetM),
    impact: asNumber(row.impact),
    stack: asList(row.stack),
    summary: asText(row.summary),
    location: asText(row.location),
    featured: asBoolean(row.featured),
    visible: asBoolean(row.visible, true),
    sortOrder: asNumber(row.sortOrder),
  };
}

function parseProjectImage(row: Raw): ProjectImage {
  return {
    id: asText(row.id),
    projectId: asText(row.projectId),
    storagePath: asText(row.storagePath),
    caption: asText(row.caption),
    mimeType: asText(row.mimeType) || "image/jpeg",
    width: asOptionalNumber(row.width),
    height: asOptionalNumber(row.height),
    byteSize: asOptionalNumber(row.byteSize),
    sortOrder: asNumber(row.sortOrder),
  };
}

function parseCurvePoint(row: Raw): ProjectCurvePoint {
  return {
    year: asNumber(row.year),
    budgetM: asNumber(row.budgetM),
    impact: asNumber(row.impact),
  };
}

function parseCertification(row: Raw): CertificationEntry {
  return {
    id: asText(row.id),
    name: asText(row.name),
    issuer: asText(row.issuer),
    domain: asText(row.domain) as Certification["domain"],
    issued: asText(row.issued),
    expires: asOptionalText(row.expires),
    credentialId: asText(row.credentialId),
    credentialUrl: asText(row.credentialUrl),
    status: asText(row.status) as Certification["status"],
    cost: asNumber(row.cost),
    visible: asBoolean(row.visible, true),
    sortOrder: asNumber(row.sortOrder),
  };
}

function parseSkill(row: Raw): SkillEntry {
  return {
    id: asText(row.id),
    name: asText(row.name),
    category: asText(row.category),
    level: asNumber(row.level),
    years: asNumber(row.years),
    since: asNumber(row.since),
    evidence: asList(row.evidence),
    visible: asBoolean(row.visible, true),
    sortOrder: asNumber(row.sortOrder),
  };
}

function parseImage(row: Raw): CertificationImage {
  return {
    id: asText(row.id),
    certificationId: asText(row.certificationId),
    storagePath: asText(row.storagePath),
    caption: asText(row.caption),
    // Every row predating the column was a raster image, which is what the
    // fallback assumes; a missing key here means an older server, not a PDF.
    mimeType: asText(row.mimeType) || "image/jpeg",
    width: asOptionalNumber(row.width),
    height: asOptionalNumber(row.height),
    byteSize: asOptionalNumber(row.byteSize),
    sortOrder: asNumber(row.sortOrder),
  };
}

/** Returns null when the payload is not the expected shape at all. */
export function parseSnapshot(value: unknown): EntrySnapshot | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Raw;

  return {
    version: asNumber(raw.version, 1),
    career: asRows(raw.career).map(parseCareer),
    projects: asRows(raw.projects).map(parseProject),
    projectImages: asRows(raw.projectImages).map(parseProjectImage),
    // A row without a usable year would land on the axis at zero and drag the
    // line with it, so it is dropped rather than plotted.
    projectCurve: asRows(raw.projectCurve)
      .map(parseCurvePoint)
      .filter((point) => point.year > 0),
    certifications: asRows(raw.certifications).map(parseCertification),
    certificationImages: asRows(raw.certificationImages).map(parseImage),
    skills: asRows(raw.skills).map(parseSkill),
  };
}

/** Public URL of a stored image. Derived, never stored. */
export function publicImageUrl(storagePath: string): string | null {
  if (!supabaseUrl || !storagePath) return null;
  return `${supabaseUrl}/storage/v1/object/public/portfolio-media/${storagePath}`;
}
