/**
 * Revision history and activity log.
 *
 * Revisions record what a key held before it changed, which is what makes a
 * rollback possible. The activity log is the flatter, human readable trail of
 * who did what.
 */
import { History, ListChecks, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAdminEditor, useAdminHistory } from "@/admin/useAdminData";

/** Renders a timestamp as a fixed, unambiguous string. */
function stamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/** Trims a stored value down to something a table cell can hold. */
function excerpt(value: string | null): string {
  if (value === null) return "no stored value";
  const single = value.replace(/\s+/g, " ").trim();
  return single.length > 96 ? `${single.slice(0, 96)}...` : single;
}

export default function HistoryPanel() {
  const editor = useAdminEditor();
  const { revisions, activity, loading } = useAdminHistory(editor.version);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex items-center gap-4">
          <History className="size-4 text-primary" aria-hidden />
          <h3 className="eyebrow">revisions</h3>
          <span className="hairline flex-1" />
          <span className="font-mono text-[11px] text-muted-foreground">{revisions.length}</span>
        </div>

        <p className="max-w-2xl text-[14px] leading-relaxed text-muted-foreground text-pretty">
          Each row holds the value a key carried just before it was overwritten. Restoring a row
          writes that value back through the same publish path, so the change is recorded again
          rather than quietly erased.
        </p>

        {loading ? (
          <div className="panel p-6 font-mono text-[13px] text-muted-foreground">
            Reading the history
          </div>
        ) : revisions.length === 0 ? (
          <div className="panel p-6 font-mono text-[13px] text-muted-foreground">
            Nothing has been published yet, so there is nothing to roll back to.
          </div>
        ) : (
          <div className="panel divide-y divide-border">
            {revisions.map((revision) => (
              <div
                key={revision.id}
                className="flex flex-wrap items-start justify-between gap-3 p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[12px] text-foreground">{revision.key}</span>
                    <Badge variant={revision.action === "revert" ? "accent" : "muted"} size="sm">
                      {revision.action}
                    </Badge>
                  </div>
                  <p className="mt-1.5 truncate font-mono text-[11px] text-muted-foreground">
                    {excerpt(revision.value)}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground/80">
                    {stamp(revision.created_at)} · {revision.actor}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={editor.busy}
                  onClick={() => void editor.revertRevision(revision.id)}
                >
                  Restore
                  <Undo2 aria-hidden />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <Separator dashed />

      <section className="space-y-4">
        <div className="flex items-center gap-4">
          <ListChecks className="size-4 text-primary" aria-hidden />
          <h3 className="eyebrow">activity</h3>
          <span className="hairline flex-1" />
          <span className="font-mono text-[11px] text-muted-foreground">{activity.length}</span>
        </div>

        {activity.length === 0 ? (
          <div className="panel p-6 font-mono text-[13px] text-muted-foreground">
            No writes have been recorded for this account yet.
          </div>
        ) : (
          <ul className="panel divide-y divide-border">
            {activity.map((row) => (
              <li key={row.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 p-3.5">
                <Badge variant="muted" size="sm">
                  {row.action}
                </Badge>
                <span className="font-mono text-[12px] text-foreground">
                  {row.target ?? "no specific key"}
                </span>
                {row.detail ? (
                  <span className="font-mono text-[11px] text-muted-foreground">{row.detail}</span>
                ) : null}
                <span className="ml-auto font-mono text-[11px] text-muted-foreground/80">
                  {stamp(row.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
