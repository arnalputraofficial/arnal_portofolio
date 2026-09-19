/**
 * Reads and writes for the admin panel.
 *
 * Every write goes through a SECURITY DEFINER function rather than a direct
 * table call, so the allowlist is checked inside the database and cannot be
 * skipped by editing the bundle. Reads lean on row level security, which
 * answers with an empty list for anyone who is not an admin.
 */
import * as React from "react";
import { MISSING_CONFIG_MESSAGE, describeWriteError, supabase } from "@/lib/supabase";
import { useContent } from "@/content/ContentProvider";

export interface EditorFeedback {
  tone: "status" | "error";
  text: string;
}

export interface DraftEntry {
  key: string;
  value: string;
}

export interface RevisionRow {
  id: number;
  key: string;
  value: string | null;
  action: string;
  actor: string;
  created_at: string;
}

export interface ActivityRow {
  id: number;
  actor: string;
  action: string;
  target: string | null;
  detail: string | null;
  created_at: string;
}

export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

export interface DraftSaveResult {
  /** Keys the database accepted and now holds as drafts. */
  saved: string[];
  /** Keys the database refused, with the reason, so the caller can report it. */
  failed: Array<{ key: string; message: string }>;
}

export interface AdminEditorValue {
  /** Key being written right now, so a single field can show that it is busy. */
  pendingKey: string | null;
  /** True while any write is in flight. */
  busy: boolean;
  feedback: EditorFeedback | null;
  /** Bumped after every successful write, so the history can follow along. */
  version: number;
  clearFeedback: () => void;
  /** Reports exactly which keys landed, because a batch can fail per field. */
  saveDrafts: (entries: DraftEntry[]) => Promise<DraftSaveResult>;
  /** Pass null to discard every draft. */
  discardDrafts: (keys: string[] | null) => Promise<boolean>;
  /** Pass null to publish every draft. */
  publishDrafts: (keys: string[] | null) => Promise<boolean>;
  revertRevision: (id: number) => Promise<boolean>;
}

export function useAdminEditor(): AdminEditorValue {
  const { reload } = useContent();

  const [pendingKey, setPendingKey] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [feedback, setFeedback] = React.useState<EditorFeedback | null>(null);
  const [version, setVersion] = React.useState(0);

  const clearFeedback = React.useCallback(() => setFeedback(null), []);

  /**
   * Every action ends the same way: pull the real state back from the database
   * and report what happened. Refetching rather than patching local state is
   * what keeps the panel honest when a batch fails half way through.
   */
  const finish = React.useCallback(
    async (ok: boolean, text: string) => {
      await reload();
      setPendingKey(null);
      setBusy(false);
      setFeedback({ tone: ok ? "status" : "error", text });
      if (ok) setVersion((n) => n + 1);
      return ok;
    },
    [reload],
  );

  const refuse = React.useCallback((text: string) => {
    setBusy(false);
    setPendingKey(null);
    setFeedback({ tone: "error", text });
    return false;
  }, []);

  const saveDrafts = React.useCallback(
    async (entries: DraftEntry[]): Promise<DraftSaveResult> => {
      if (entries.length === 0) return { saved: [], failed: [] };

      if (!supabase) {
        refuse(MISSING_CONFIG_MESSAGE);
        return {
          saved: [],
          failed: entries.map((entry) => ({ key: entry.key, message: MISSING_CONFIG_MESSAGE })),
        };
      }

      setBusy(true);
      setFeedback(null);

      // One refused field must not cancel the rest of the batch. The editor
      // sends every unsaved field at once, so stopping at the first error used
      // to drop every field after it without saying so.
      const saved: string[] = [];
      const failed: Array<{ key: string; message: string }> = [];

      for (const entry of entries) {
        setPendingKey(entry.key);

        const { error } = await supabase.rpc("portfolio_save_draft", {
          p_key: entry.key,
          p_value: entry.value,
        });

        if (error) {
          console.warn(`[admin] draft refused for ${entry.key}:`, error.message);
          failed.push({ key: entry.key, message: describeWriteError(error) });
        } else {
          saved.push(entry.key);
        }
      }

      if (failed.length === 0) {
        await finish(
          true,
          `${plural(saved.length, "draft", "drafts")} saved. A draft stays private until it is published.`,
        );
        return { saved, failed };
      }

      const [first] = failed;
      const head =
        failed.length === 1
          ? `${first.key} was refused: ${first.message}`
          : `${failed.length} fields were refused, the first being ${first.key}: ${first.message}`;
      const tail =
        saved.length > 0
          ? ` The other ${plural(saved.length, "field", "fields")} in this batch were saved as drafts.`
          : " Nothing in this batch was saved.";

      await finish(false, `${head}.${tail}`);
      return { saved, failed };
    },
    [finish, refuse],
  );

  const discardDrafts = React.useCallback(
    async (keys: string[] | null): Promise<boolean> => {
      if (!supabase) return refuse(MISSING_CONFIG_MESSAGE);

      setBusy(true);
      setFeedback(null);

      if (keys === null) {
        const { data, error } = await supabase.rpc("portfolio_discard_draft", { p_key: null });

        if (error) {
          return finish(false, `The drafts were not discarded. ${describeWriteError(error)}`);
        }

        return finish(
          true,
          `${plural(Number(data ?? 0), "draft", "drafts")} discarded. The published site is untouched.`,
        );
      }

      for (const key of keys) {
        setPendingKey(key);

        const { error } = await supabase.rpc("portfolio_discard_draft", { p_key: key });

        if (error) {
          return finish(false, `The draft for ${key} was not discarded. ${describeWriteError(error)}`);
        }
      }

      return finish(
        true,
        `${plural(keys.length, "draft", "drafts")} discarded. The published site is untouched.`,
      );
    },
    [finish, refuse],
  );

  const publishDrafts = React.useCallback(
    async (keys: string[] | null): Promise<boolean> => {
      if (!supabase) return refuse(MISSING_CONFIG_MESSAGE);

      setBusy(true);
      setFeedback(null);

      const { data, error } = await supabase.rpc("portfolio_publish", { p_keys: keys });

      if (error) {
        return finish(false, `Nothing was published. ${describeWriteError(error)}`);
      }

      return finish(
        true,
        `${plural(Number(data ?? 0), "key", "keys")} published. Every visitor sees this now.`,
      );
    },
    [finish, refuse],
  );

  const revertRevision = React.useCallback(
    async (id: number): Promise<boolean> => {
      if (!supabase) return refuse(MISSING_CONFIG_MESSAGE);

      setBusy(true);
      setFeedback(null);

      const { data, error } = await supabase.rpc("portfolio_revert", { p_revision_id: id });

      if (error) {
        return finish(false, `Revision ${id} was not restored. ${describeWriteError(error)}`);
      }

      return finish(true, `${String(data)} restored to what revision ${id} recorded.`);
    },
    [finish, refuse],
  );

  return {
    pendingKey,
    busy,
    feedback,
    version,
    clearFeedback,
    saveDrafts,
    discardDrafts,
    publishDrafts,
    revertRevision,
  };
}

export interface AdminHistoryValue {
  revisions: RevisionRow[];
  activity: ActivityRow[];
  loading: boolean;
}

/**
 * The revision list and the activity log.
 *
 * Reloading is driven by the editor's version counter rather than by the
 * component, so a write anywhere in the panel refreshes both lists without the
 * two having to know about each other.
 */
export function useAdminHistory(version: number): AdminHistoryValue {
  const [revisions, setRevisions] = React.useState<RevisionRow[]>([]);
  const [activity, setActivity] = React.useState<ActivityRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    void Promise.all([
      supabase
        .from("portfolio_revisions")
        .select("id, key, value, action, actor, created_at")
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("portfolio_activity")
        .select("id, actor, action, target, detail, created_at")
        .order("created_at", { ascending: false })
        .limit(40),
    ]).then(([revisionResult, activityResult]) => {
      if (!active) return;

      if (revisionResult.error) {
        console.warn("[admin] could not read the revision list:", revisionResult.error.message);
      } else {
        setRevisions((revisionResult.data ?? []) as RevisionRow[]);
      }

      if (activityResult.error) {
        console.warn("[admin] could not read the activity log:", activityResult.error.message);
      } else {
        setActivity((activityResult.data ?? []) as ActivityRow[]);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [version]);

  return { revisions, activity, loading };
}
