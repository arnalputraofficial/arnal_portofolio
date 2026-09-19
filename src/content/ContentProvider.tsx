/**
 * Resolves editable strings at render time.
 *
 * Precedence, highest first:
 *   1. a draft, but only while preview mode is on and only for a signed in admin
 *   2. a published override
 *   3. the default compiled into the bundle
 *
 * If the database is unreachable the site still renders from the defaults. A
 * failed fetch degrades to the shipped copy, it never leaves the page blank.
 */
import * as React from "react";
import { CONTENT_DEFAULTS } from "@/content/registry";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type ValueMap = Record<string, string>;
type Tokens = Record<string, string | number>;

const PREVIEW_FLAG = "arnal:content-preview";

interface ContentContextValue {
  /** False until the first load attempt has settled. */
  ready: boolean;
  /** Published overrides, as stored in the database. */
  overrides: ValueMap;
  /** Unpublished drafts. Empty unless an admin has loaded them. */
  drafts: ValueMap;
  /** While true, drafts are rendered instead of published values. */
  previewing: boolean;
  setPreviewing: (next: boolean) => void;
  replaceDrafts: (next: ValueMap) => void;
  reload: () => Promise<void>;
  /** Resolve a key to the string that should be shown. */
  text: (key: string, tokens?: Tokens) => string;
}

const ContentContext = React.createContext<ContentContextValue | null>(null);

function applyTokens(value: string, tokens?: Tokens): string {
  if (!tokens) return value;
  return value.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in tokens ? String(tokens[name]) : match,
  );
}

function readPreviewFlag(): boolean {
  try {
    return window.sessionStorage.getItem(PREVIEW_FLAG) === "1";
  } catch {
    return false;
  }
}

/** Turns a key and value result set into the lookup the renderer wants. */
function toValueMap(rows: unknown): ValueMap {
  const next: ValueMap = {};
  for (const row of (rows ?? []) as Array<{ key: string; value: string }>) {
    next[row.key] = row.value;
  }
  return next;
}

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = React.useState<ValueMap>({});
  const [drafts, setDrafts] = React.useState<ValueMap>({});
  const [ready, setReady] = React.useState(!isSupabaseConfigured);
  const [previewing, setPreviewingState] = React.useState(readPreviewFlag);

  const reload = React.useCallback(async () => {
    if (!supabase) {
      setReady(true);
      return;
    }

    const client = supabase;

    // Drafts are only accessible by authenticated admins. To avoid generating
    // a 401 console error for public visitors, we only query portfolio_drafts
    // if there is an active session in local storage / client.
    const sessionRes = await client.auth.getSession();
    const hasSession = Boolean(sessionRes.data.session);

    const [published, draftsResult] = await Promise.all([
      client.from("portfolio_content").select("key, value"),
      hasSession
        ? client.from("portfolio_drafts").select("key, value")
        : Promise.resolve({ data: [] as { key: string; value: string }[], error: null }),
    ]);

    if (published.error) {
      console.warn("[content] could not load overrides, using defaults:", published.error.message);
    } else {
      setOverrides(toValueMap(published.data));
    }

    if (draftsResult.error) {
      console.warn("[content] could not load drafts:", draftsResult.error.message);
    } else {
      setDrafts(toValueMap(draftsResult.data));
    }

    setReady(true);
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const setPreviewing = React.useCallback((next: boolean) => {
    setPreviewingState(next);
    try {
      window.sessionStorage.setItem(PREVIEW_FLAG, next ? "1" : "0");
    } catch {
      // Session storage can be blocked. Preview still works for this render.
    }
  }, []);

  const text = React.useCallback(
    (key: string, tokens?: Tokens): string => {
      const candidate = previewing ? drafts[key] ?? overrides[key] : overrides[key];
      const value = candidate ?? CONTENT_DEFAULTS[key];

      if (value === undefined) {
        if (import.meta.env.DEV) {
          console.warn(`[content] unknown content key: ${key}`);
        }
        return key;
      }

      return applyTokens(value, tokens);
    },
    [drafts, overrides, previewing],
  );

  const value = React.useMemo<ContentContextValue>(
    () => ({
      ready,
      overrides,
      drafts,
      previewing,
      setPreviewing,
      replaceDrafts: setDrafts,
      reload,
      text,
    }),
    [ready, overrides, drafts, previewing, setPreviewing, reload, text],
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent(): ContentContextValue {
  const context = React.useContext(ContentContext);
  if (!context) {
    throw new Error("useContent must be called inside a ContentProvider");
  }
  return context;
}

/** Shorthand for components that only need to resolve strings. */
export function useSiteText() {
  return useContent().text;
}
