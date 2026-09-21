import * as React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSection } from "@/components/layout/SectionHeading";
import { useContent } from "@/content/ContentProvider";
import { CONTENT_REGISTRY } from "@/content/registry";
import { useAdminAuth } from "@/admin/AdminAuthProvider";
import { PasswordForm } from "@/admin/PasswordForm";
import ChartsPanel from "@/admin/ChartsPanel";
import ContentEditor from "@/admin/ContentEditor";
import EntriesPanel from "@/admin/EntriesPanel";
import MessagesPanel from "@/admin/MessagesPanel";
import HistoryPanel from "@/admin/HistoryPanel";
import { SessionsPanel } from "@/admin/SessionsPanel";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "content", label: "Content" },
  { id: "entries", label: "Entries" },
  { id: "charts", label: "Charts" },
  { id: "messages", label: "Inbox" },
  { id: "sessions", label: "Sessions" },
  { id: "history", label: "Revisions" },
  { id: "account", label: "Account" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * The panel.
 *
 * Every editable surface behind one row of tabs: the wording, the entry lists,
 * the charts, the inbox, the sessions, and the revisions. Nothing here is
 * decorative. Every control writes through a database function that checks the
 * allowlist first.
 */
export default function AdminDashboard() {
  const { identity, signOut } = useAdminAuth();
  const { drafts, overrides, previewing } = useContent();
  const [tab, setTab] = React.useState<TabId>("content");

  const draftCount = Object.keys(drafts).length;
  const publishedCount = Object.keys(overrides).length;

  return (
    <PageSection className="pt-16 sm:pt-20">
      <span className="eyebrow">admin panel</span>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl">
            Signed in
          </h1>
          <p className="mt-4 font-mono text-[13px] text-muted-foreground">{identity?.email}</p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={previewing ? "accent" : "moss"} dot>
            {previewing ? "previewing drafts" : "session live"}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Figure label="editable strings" value={CONTENT_REGISTRY.length} />
        <Figure label="published overrides" value={publishedCount} />
        <Figure label="unpublished drafts" value={draftCount} />
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-1 border-b border-border pb-px">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setTab(entry.id)}
            aria-current={tab === entry.id ? "true" : undefined}
            className={cn(
              "relative inline-flex items-center gap-2 border-b-2 px-3.5 py-2.5",
              "font-mono text-[12px] uppercase tracking-[0.1em]",
              "transition-all duration-200 ease-out-expo",
              tab === entry.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {entry.label}
            {entry.id === "content" && draftCount > 0 ? (
              <span className="rounded-sm bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                {draftCount}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "content" ? <ContentEditor /> : null}

        {tab === "entries" ? <EntriesPanel /> : null}

        {tab === "charts" ? <ChartsPanel /> : null}

        {tab === "messages" ? <MessagesPanel /> : null}

        {tab === "sessions" ? <SessionsPanel /> : null}

        {tab === "history" ? <HistoryPanel /> : null}

        {tab === "account" ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
            <div className="panel p-6">
              <h2 className="font-display text-xl leading-snug">Replace the password</h2>
              <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground text-pretty">
                The current password is asked for even now that it is already yours. That is what
                stops a browser left open on this panel from being used to lock you out.
              </p>
              <div className="mt-6">
                <PasswordForm submitLabel="Replace password" onDone={() => undefined} />
              </div>
            </div>

            <aside className="panel-flagged p-6">
              <h3 className="eyebrow">what this account can do</h3>
              <ul className="mt-4 space-y-3 text-[13px] leading-relaxed text-muted-foreground text-pretty">
                <li>
                  Save drafts, publish them, and restore an earlier revision. All three are
                  recorded in the activity log with the address it was done from.
                </li>
                <li>
                  Nothing here can change the allowlist. Adding or removing an admin address is a
                  database change on purpose.
                </li>
              </ul>
              <div className="mt-6">
                <Button asChild variant="outline" size="sm">
                  <Link to="/">View the public site</Link>
                </Button>
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </PageSection>
  );
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel px-5 py-4">
      <p className="font-display text-3xl leading-none tracking-tight">{value}</p>
      <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
