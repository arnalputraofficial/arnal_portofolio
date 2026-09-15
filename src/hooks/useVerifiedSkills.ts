import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchVerifiedSkills,
  summarize,
  type FetchState,
  type VerifiedSkill,
} from "@/lib/tasteskill";

const CACHE_KEY = "arnal:verified-skills:v1";
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

interface Cached {
  fetchedAt: string;
  skills: VerifiedSkill[];
}

function readCache(): Cached | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cached;
    const age = Date.now() - new Date(parsed.fetchedAt).getTime();
    if (!Array.isArray(parsed.skills) || age > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(skills: VerifiedSkill[]) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ fetchedAt: new Date().toISOString(), skills } satisfies Cached),
    );
  } catch {
    /* storage full or blocked: ignore it, not fatal */
  }
}

/**
 * Fetches verified skills from the registry, with caching and honest
 * network-failure handling (`offline` status, not fake data).
 */
export function useVerifiedSkills(repo?: string) {
  const [state, setState] = useState<FetchState>({ status: "idle" });
  const [refreshing, setRefreshing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (force = false) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (!force) {
        const cached = readCache();
        if (cached) {
          setState({
            status: "ready",
            skills: cached.skills,
            fetchedAt: cached.fetchedAt,
          });
          return;
        }
      }

      setRefreshing(true);
      setState((prev) => (prev.status === "ready" ? prev : { status: "loading" }));

      try {
        const skills = await fetchVerifiedSkills(repo, controller.signal);
        const fetchedAt = new Date().toISOString();
        writeCache(skills);
        setState({ status: "ready", skills, fetchedAt });
      } catch (err) {
        if (controller.signal.aborted) return;
        setState({
          status: "offline",
          reason: err instanceof Error ? err.message : "Network unavailable",
          fetchedAt: new Date().toISOString(),
        });
      } finally {
        if (!controller.signal.aborted) setRefreshing(false);
      }
    },
    [repo],
  );

  useEffect(() => {
    void load(false);
    return () => abortRef.current?.abort();
  }, [load]);

  return { state, refresh: () => load(true), refreshing, summarize };
}
