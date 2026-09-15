/**
 * Verified skill registry integration.
 *
 * IMPORTANT NOTE (honest about what actually exists):
 * - tasteskill.dev is NOT a skill data API provider. It is a collection of
 *   SKILL.md files (an anti-slop framework) for AI agents, not a people
 *   profile service.
 * - What does have a real public API is the verified-skill.com registry,
 *   which verifies skills through automated scanning (Tier 1) and LLM
 *   review (Tier 2), then returns certification + trust tier.
 *
 * This module therefore:
 *  1. Fetches real verified data from the verified-skill.com API.
 *  2. Maps the results onto relevant professional competencies.
 *  3. On network failure, returns an `offline` status as-is,
 *     WITHOUT inventing verification numbers.
 */

const API_BASE = "https://verified-skill.com/api/v1";

export interface VerifiedSkill {
  /** display name, e.g. "frontend-web" */
  slug: string;
  /** full path, e.g. "leonxlnx/taste-skill/frontend-web" */
  fullName: string;
  author: string;
  repoUrl: string;
  category: string;
  version: string;
  /** VERIFIED | TRUSTED | ... */
  certTier: string;
  /** 0-100, automated verification result */
  certScore: number;
  certMethod: string;
  certifiedAt: string;
  /** T2 / T3, higher means more trusted */
  trustTier: string;
  trustScore: number;
  stars: number;
  forks: number;
  /** true when the scan flagged this skill as problematic */
  tainted: boolean;
  trend7d: number;
}

export type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; skills: VerifiedSkill[]; fetchedAt: string }
  | { status: "offline"; reason: string; fetchedAt: string };

interface RawSkill {
  displayName?: string;
  name?: string;
  author?: string;
  repoUrl?: string;
  category?: string;
  currentVersion?: string;
  certTier?: string;
  certScore?: number;
  certMethod?: string;
  certifiedAt?: string;
  trustTier?: string;
  trustScore?: number;
  githubStars?: number;
  githubForks?: number;
  isTainted?: boolean;
  trendingScore7d?: number;
  isDeprecated?: boolean;
}

function normalize(raw: RawSkill): VerifiedSkill {
  return {
    slug: raw.displayName ?? raw.name ?? "unnamed",
    fullName: raw.name ?? "",
    author: raw.author ?? "unknown",
    repoUrl: raw.repoUrl ?? "https://verified-skill.com/skills",
    category: raw.category ?? "general",
    version: raw.currentVersion ?? "0.0.0",
    certTier: raw.certTier ?? "UNCERTIFIED",
    certScore: raw.certScore ?? 0,
    certMethod: raw.certMethod ?? "NONE",
    certifiedAt: raw.certifiedAt ?? "",
    trustTier: raw.trustTier ?? "T0",
    trustScore: raw.trustScore ?? 0,
    stars: raw.githubStars ?? 0,
    forks: raw.githubForks ?? 0,
    tainted: Boolean(raw.isTainted),
    trend7d: raw.trendingScore7d ?? 0,
  };
}

/**
 * Fetch the skill list from the registry. `repo` is optional and narrows
 * the results, e.g. "Leonxlnx/taste-skill".
 */
export async function fetchVerifiedSkills(
  repo?: string,
  signal?: AbortSignal,
): Promise<VerifiedSkill[]> {
  const url = new URL(`${API_BASE}/skills`);
  if (repo) url.searchParams.set("repo", repo);

  const res = await fetch(url.toString(), {
    signal,
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Registry responded ${res.status}`);

  const json = (await res.json()) as { skills?: RawSkill[] };
  const list = Array.isArray(json.skills) ? json.skills : [];
  return list
    .filter((s) => !s.isDeprecated)
    .map(normalize)
    .sort((a, b) => b.certScore - a.certScore || b.stars - a.stars);
}

/** Fetch the full detail of a single skill. */
export async function fetchVerifiedSkill(
  fullName: string,
  signal?: AbortSignal,
): Promise<VerifiedSkill | null> {
  const res = await fetch(`${API_BASE}/skills/${fullName}`, {
    signal,
    headers: { accept: "application/json" },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { skill?: RawSkill };
  return json.skill ? normalize(json.skill) : null;
}

/**
 * Mapping from registry skills to real work competencies.
 * Written by hand and deliberately so: this is a translation, not an
 * automated claim.
 */
export interface Competency {
  area: string;
  note: string;
  /** registry slugs that support this area */
  supportedBy: string[];
  /** whether it fits a lead/supervisor role or not */
  relevance: "direct" | "supporting";
}

export const competencyMap: Competency[] = [
  {
    area: "Quality standards & code review",
    note: "Setting the quality bar before code reaches the mainline.",
    supportedBy: ["code-review", "diagnose-gateway", "github"],
    relevance: "direct",
  },
  {
    area: "System design & visual direction",
    note: "Keeping the interface consistent across teams and products.",
    supportedBy: ["frontend-web", "brandkit", "minimalist", "taste-skill"],
    relevance: "supporting",
  },
  {
    area: "Team workflow automation",
    note: "Removing repetitive work that should not need human hands.",
    supportedBy: ["tmux", "github", "notion"],
    relevance: "direct",
  },
  {
    area: "Documentation & knowledge handover",
    note: "The key to keeping a system from depending on one person.",
    supportedBy: ["notion", "documentation"],
    relevance: "direct",
  },
];

/** Compact scores from the registry data, computed as-is from the API response. */
export function summarize(skills: VerifiedSkill[]) {
  if (!skills.length) {
    return { total: 0, verifiedRatio: 0, avgScore: 0, avgTrust: 0, tainted: 0, topCategory: "-" };
  }
  const verified = skills.filter((s) => s.certTier.toUpperCase().includes("VERIF")).length;
  const categories = skills.reduce<Record<string, number>>((acc, s) => {
    acc[s.category] = (acc[s.category] ?? 0) + 1;
    return acc;
  }, {});
  const topCategory =
    Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

  return {
    total: skills.length,
    verifiedRatio: verified / skills.length,
    avgScore: skills.reduce((a, s) => a + s.certScore, 0) / skills.length,
    avgTrust: skills.reduce((a, s) => a + s.trustScore, 0) / skills.length,
    tainted: skills.filter((s) => s.tainted).length,
    topCategory,
  };
}
