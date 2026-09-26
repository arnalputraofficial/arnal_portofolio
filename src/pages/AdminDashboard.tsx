import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Database,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  History,
  KeyRound,
  Laptop,
  LogOut,
  Mail,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageSection } from "@/components/layout/SectionHeading";
import { useContent } from "@/content/ContentProvider";
import { CONTENT_REGISTRY } from "@/content/registry";
import { useAdminAuth } from "@/admin/AdminAuthProvider";
import { useEntries } from "@/entries/EntriesProvider";
import { PasswordForm } from "@/admin/PasswordForm";
import ChartsPanel from "@/admin/ChartsPanel";
import ContentEditor from "@/admin/ContentEditor";
import EntriesPanel from "@/admin/EntriesPanel";
import MessagesPanel from "@/admin/MessagesPanel";
import HistoryPanel from "@/admin/HistoryPanel";
import { SessionsPanel } from "@/admin/SessionsPanel";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    id: "content",
    label: "Content",
    path: "/admin/content",
    icon: FileText,
    description: "Strings, copy & page drafts",
  },
  {
    id: "entries",
    label: "Entries",
    path: "/admin/entries",
    icon: Database,
    description: "Career, projects, certs & skills",
  },
  {
    id: "charts",
    label: "Charts",
    path: "/admin/charts",
    icon: BarChart3,
    description: "Metrics and visual breakdowns",
  },
  {
    id: "messages",
    label: "Inbox",
    path: "/admin/messages",
    icon: Mail,
    description: "Visitor inquiries and contacts",
  },
  {
    id: "sessions",
    label: "Sessions",
    path: "/admin/sessions",
    icon: Laptop,
    description: "Active sign-in tokens",
  },
  {
    id: "history",
    label: "Revisions",
    path: "/admin/history",
    icon: History,
    description: "Audit trail and published log",
  },
  {
    id: "account",
    label: "Account",
    path: "/admin/account",
    icon: KeyRound,
    description: "Security and credentials",
  },
] as const;

type NavItemId = (typeof NAV_ITEMS)[number]["id"];

/**
 * Normalizes an admin URL path into a recognized panel ID.
 * Supports legacy aliases (e.g. /admin/inbox -> messages, /admin/revisions -> history).
 */
function resolveActiveTab(pathname: string): NavItemId {
  const segment = pathname.replace(/^\/admin\/?/, "").split("/")[0]?.toLowerCase() || "";

  if (segment === "inbox") return "messages";
  if (segment === "revisions") return "history";

  const match = NAV_ITEMS.find((item) => item.id === segment);
  return match ? match.id : "content";
}

export default function AdminDashboard() {
  const { identity, signOut } = useAdminAuth();
  const { drafts, overrides, previewing, setPreviewing } = useContent();
  const { all, storedCharts } = useEntries();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const activeTab = resolveActiveTab(location.pathname);

  // Keyboard shortcut Ctrl+K or Cmd+K to launch search-to-navigate
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync URL when the current path is just /admin or /admin/ without a tab segment,
  // or redirect legacy aliases to the primary canonical path.
  React.useEffect(() => {
    const rawSegment = location.pathname.replace(/^\/admin\/?/, "").split("/")[0]?.toLowerCase() || "";
    if (!rawSegment) {
      navigate("/admin/content", { replace: true });
    } else if (rawSegment === "inbox") {
      navigate("/admin/messages", { replace: true });
    } else if (rawSegment === "revisions") {
      navigate("/admin/history", { replace: true });
    }
  }, [location.pathname, navigate]);

  const draftCount = Object.keys(drafts).length;
  const publishedCount = Object.keys(overrides).length;
  const totalEntriesCount =
    all.career.length + all.projects.length + all.certifications.length + all.skills.length;
  const chartCustomCount = Object.keys(storedCharts).length;

  return (
    <PageSection className="pt-10 sm:pt-14 pb-20">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-4 border-b border-border/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="eyebrow">system console</span>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Admin Panel
          </h1>
          <p className="mt-1 font-mono text-[12px] text-muted-foreground">{identity?.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchOpen(true)}
            className="h-9 gap-2 font-mono text-[11px] text-muted-foreground hover:text-foreground active:scale-[0.98]"
          >
            <Search className="size-3.5" aria-hidden />
            <span>Search...</span>
            <kbd className="pointer-events-none hidden h-4 select-none items-center gap-0.5 rounded border border-border bg-muted px-1 font-mono text-[10px] font-medium md:flex">
              Ctrl K
            </kbd>
          </Button>

          <Button
            variant={previewing ? "default" : "outline"}
            size="sm"
            onClick={() => setPreviewing(!previewing)}
            className="h-9 gap-1.5 font-mono text-[11px] active:scale-[0.98]"
          >
            {previewing ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5 text-muted-foreground" />}
            <span>{previewing ? "Preview: ON" : "Preview: OFF"}</span>
          </Button>

          <Badge variant={previewing ? "accent" : "moss"} dot className="hidden sm:inline-flex">
            {previewing ? "previewing drafts" : "session live"}
          </Badge>

          <Button asChild variant="ghost" size="sm" className="h-9 gap-1.5 font-mono text-[11px]">
            <Link to="/" target="_blank" rel="noopener noreferrer">
              <span>Public site</span>
              <ExternalLink className="size-3.5" aria-hidden />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void signOut()}
            className="h-9 gap-1.5 font-mono text-[11px] active:scale-[0.98]"
          >
            <LogOut className="size-3.5" aria-hidden />
            <span>Sign out</span>
          </Button>
        </div>
      </div>

      {/* Main Grid Layout: Left Sidebar + Right Content Area */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
        {/* Primary Sidebar */}
        <aside className="space-y-6">
          {/* Mobile horizontal scroll / desktop vertical list */}
          <nav
            aria-label="Admin navigation"
            className="no-scrollbar flex gap-1 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-col lg:overflow-x-visible lg:pb-0"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;

              let badgeText: string | number | null = null;
              if (item.id === "content" && draftCount > 0) {
                badgeText = `${draftCount} draft`;
              } else if (item.id === "entries" && totalEntriesCount > 0) {
                badgeText = totalEntriesCount;
              } else if (item.id === "charts" && chartCustomCount > 0) {
                badgeText = chartCustomCount;
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.path)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center justify-between gap-3 px-3.5 py-2.5 text-left text-[13px] font-medium transition-all rounded-md shrink-0 active:scale-[0.98] touch-manipulation min-h-[44px]",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold shadow-sm"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                      )}
                      aria-hidden
                    />
                    <span>{item.label}</span>
                  </div>

                  {badgeText ? (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-mono text-[10px] tabular-nums",
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {badgeText}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Quick Metrics Widget in Sidebar (hidden on mobile, visible on desktop) */}
          <div className="hidden space-y-2 rounded-lg border border-border/60 bg-muted/20 p-4 lg:block">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" aria-hidden />
              <span className="font-mono text-[11px] uppercase tracking-wider">Overview</span>
            </div>
            <div className="mt-3 space-y-2.5 font-mono text-[12px]">
              <div className="flex justify-between text-muted-foreground">
                <span>Strings</span>
                <span className="font-semibold text-foreground">{CONTENT_REGISTRY.length}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Published</span>
                <span className="font-semibold text-foreground">{publishedCount}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Total entries</span>
                <span className="font-semibold text-foreground">{totalEntriesCount}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Primary Content View Area */}
        <main className="min-w-0">
          {activeTab === "content" ? <ContentEditor /> : null}

          {activeTab === "entries" ? <EntriesPanel /> : null}

          {activeTab === "charts" ? <ChartsPanel /> : null}

          {activeTab === "messages" ? <MessagesPanel /> : null}

          {activeTab === "sessions" ? <SessionsPanel /> : null}

          {activeTab === "history" ? <HistoryPanel /> : null}

          {activeTab === "account" ? (
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
        </main>
      </div>

      {/* Global Quick Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-xl p-4 sm:p-6 w-[95vw] max-h-[85vh] flex flex-col">
          <div className="sr-only">
            <DialogTitle>Search Console</DialogTitle>
            <DialogDescription>Quickly jump to any section or entry</DialogDescription>
          </div>

          <div className="relative flex items-center border-b border-border pb-3 shrink-0">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to search panels or entries..."
              className="border-0 bg-transparent px-3 py-1 font-mono text-[14px] focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
            {searchQuery ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 touch-manipulation"
                onClick={() => setSearchQuery("")}
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </div>

          <div className="mt-2 overflow-y-auto space-y-4 pr-1 flex-1">
            {/* Nav Panels */}
            <div>
              <div className="px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Navigation Panels
              </div>
              <div className="mt-1 space-y-1">
                {NAV_ITEMS.filter(
                  (item) =>
                    !searchQuery ||
                    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.description.toLowerCase().includes(searchQuery.toLowerCase()),
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      navigate(item.path);
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="flex w-full items-center justify-between rounded-md p-2.5 text-left transition-colors hover:bg-muted/60 active:bg-muted touch-manipulation min-h-[44px]"
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className="size-4 text-primary shrink-0" />
                      <span className="text-[13px] font-medium">{item.label}</span>
                    </div>
                    <span className="font-mono text-[11px] text-muted-foreground hidden sm:inline">
                      {item.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Entries Matches */}
            {searchQuery.trim().length > 0 ? (
              <div>
                <div className="px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Data Entries
                </div>
                <div className="mt-1 space-y-1">
                  {all.career
                    .filter(
                      (c) =>
                        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        c.company.toLowerCase().includes(searchQuery.toLowerCase()),
                    )
                    .map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          navigate("/admin/entries");
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex w-full items-center justify-between rounded-md p-2.5 text-left transition-colors hover:bg-muted/60 active:bg-muted touch-manipulation min-h-[44px]"
                      >
                        <span className="text-[13px] line-clamp-1">{c.title} ({c.company})</span>
                        <Badge variant="outline" className="text-[10px] shrink-0 ml-2">Career</Badge>
                      </button>
                    ))}

                  {all.projects
                    .filter(
                      (p) =>
                        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.role.toLowerCase().includes(searchQuery.toLowerCase()),
                    )
                    .map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          navigate("/admin/entries");
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex w-full items-center justify-between rounded-md p-2.5 text-left transition-colors hover:bg-muted/60 active:bg-muted touch-manipulation min-h-[44px]"
                      >
                        <span className="text-[13px] line-clamp-1">{p.name}</span>
                        <Badge variant="outline" className="text-[10px] shrink-0 ml-2">Project</Badge>
                      </button>
                    ))}

                  {all.certifications
                    .filter(
                      (crt) =>
                        crt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        crt.issuer.toLowerCase().includes(searchQuery.toLowerCase()),
                    )
                    .map((crt) => (
                      <button
                        key={crt.id}
                        type="button"
                        onClick={() => {
                          navigate("/admin/entries");
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex w-full items-center justify-between rounded-md p-2.5 text-left transition-colors hover:bg-muted/60 active:bg-muted touch-manipulation min-h-[44px]"
                      >
                        <span className="text-[13px] line-clamp-1">{crt.name}</span>
                        <Badge variant="outline" className="text-[10px] shrink-0 ml-2">Certification</Badge>
                      </button>
                    ))}

                  {all.skills
                    .filter(
                      (s) =>
                        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.category.toLowerCase().includes(searchQuery.toLowerCase()),
                    )
                    .map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          navigate("/admin/entries");
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex w-full items-center justify-between rounded-md p-2.5 text-left transition-colors hover:bg-muted/60 active:bg-muted touch-manipulation min-h-[44px]"
                      >
                        <span className="text-[13px] line-clamp-1">{s.name}</span>
                        <Badge variant="outline" className="text-[10px] shrink-0 ml-2">Skill</Badge>
                      </button>
                    ))}
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </PageSection>
  );
}
