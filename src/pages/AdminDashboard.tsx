import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Award,
  BarChart3,
  Briefcase,
  Database,
  ExternalLink,
  Eye,
  EyeOff,
  FileQuestion,
  FileText,
  FolderKanban,
  Globe,
  History,
  Home,
  KeyRound,
  Laptop,
  Layers,
  LogOut,
  Mail,
  Search,
  Send,
  Sparkles,
  User,
  Wrench,
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
import { CONTENT_REGISTRY, PAGE_META } from "@/content/registry";
import type { ContentPageId } from "@/content/types";
import { useAdminAuth } from "@/admin/AdminAuthProvider";
import { useEntries } from "@/entries/EntriesProvider";
import type { EntryTable } from "@/entries/types";
import { PasswordForm } from "@/admin/PasswordForm";
import ChartsPanel from "@/admin/ChartsPanel";
import ContentEditor from "@/admin/ContentEditor";
import EntriesPanel from "@/admin/EntriesPanel";
import MessagesPanel from "@/admin/MessagesPanel";
import HistoryPanel from "@/admin/HistoryPanel";
import { SessionsPanel } from "@/admin/SessionsPanel";
import { cn } from "@/lib/utils";

/**
 * What a page can be edited through.
 *
 * Content, Entries and Charts used to be destinations in their own right, so an
 * admin picked a tool first and a page second. The order is now the other way
 * round: the page is where you go, and these are the functions it offers.
 */
type PageFunction = "content" | "entries" | "charts";

const FUNCTION_META: Record<PageFunction, { label: string; icon: typeof FileText }> = {
  content: { label: "Content", icon: FileText },
  entries: { label: "Entries", icon: Database },
  charts: { label: "Charts", icon: BarChart3 },
};

const PAGE_ICONS: Record<ContentPageId, typeof FileText> = {
  global: Globe,
  home: Home,
  career: Briefcase,
  projects: FolderKanban,
  credentials: Award,
  skills: Wrench,
  about: User,
  contact: Send,
  steadbyte: Layers,
  notfound: FileQuestion,
};

/**
 * The entry table and the charts each page owns.
 *
 * Taken from where each thing is actually drawn, so editing Skills shows the
 * four charts on the Skills page rather than a guess based on the chart's name.
 * A page left out of both fields is copy only and offers Content alone.
 */
const PAGE_SCOPE: Record<ContentPageId, { table?: EntryTable; charts?: string[] }> = {
  global: {},
  home: { charts: ["health"] },
  career: { table: "career", charts: ["career-tenure", "role-scope"] },
  projects: { table: "projects", charts: ["projects-kinds"] },
  credentials: {
    table: "certifications",
    charts: ["credentials-validity", "credentials-domains"],
  },
  skills: {
    table: "skills",
    charts: ["stack-usage", "experience-spread", "skill-balance", "skill-top"],
  },
  about: {},
  contact: {},
  steadbyte: {},
  notfound: {},
};

/** The functions a page offers, in tab order. Every page has copy to edit. */
function functionsFor(pageId: ContentPageId): PageFunction[] {
  const scope = PAGE_SCOPE[pageId];
  const offered: PageFunction[] = ["content"];
  if (scope.table) offered.push("entries");
  if (scope.charts && scope.charts.length > 0) offered.push("charts");
  return offered;
}

const PAGE_NAV = PAGE_META.map((page) => ({
  id: page.id,
  label: page.title,
  description: page.description,
  path: `/admin/${page.id}`,
  icon: PAGE_ICONS[page.id],
}));

const SYSTEM_NAV = [
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

type NavDestination = ContentPageId | (typeof SYSTEM_NAV)[number]["id"];

const PAGE_IDS: string[] = PAGE_META.map((page) => page.id);
const DEFAULT_PAGE: ContentPageId = "home";

/**
 * Addresses that named a function instead of a page.
 *
 * They keep working because bookmarks were built around them, but each now
 * lands on a page that offers the function it asked for.
 */
const LEGACY_PATHS: Record<string, string> = {
  content: `/admin/${DEFAULT_PAGE}?fn=content`,
  entries: "/admin/career?fn=entries",
  charts: "/admin/skills?fn=charts",
  inbox: "/admin/messages",
  revisions: "/admin/history",
};

interface ResolvedRoute {
  destination: NavDestination;
  fn: PageFunction;
  /** Non-null when the address bar has to be rewritten before rendering. */
  redirectTo: string | null;
}

/** Turns the address bar into a destination, a function, and any fix-up. */
function resolveRoute(pathname: string, search: string): ResolvedRoute {
  const segment = pathname.replace(/^\/admin\/?/, "").split("/")[0]?.toLowerCase() ?? "";
  const fallback: ResolvedRoute = {
    destination: DEFAULT_PAGE,
    fn: "content",
    redirectTo: `/admin/${DEFAULT_PAGE}`,
  };

  if (!segment) return fallback;

  const legacy = LEGACY_PATHS[segment];
  if (legacy) return { ...fallback, redirectTo: legacy };

  if (!PAGE_IDS.includes(segment)) {
    const system = SYSTEM_NAV.find((item) => item.id === segment);
    return system ? { destination: system.id, fn: "content", redirectTo: null } : fallback;
  }

  const pageId = segment as ContentPageId;
  const offered = functionsFor(pageId);
  const requested = new URLSearchParams(search).get("fn")?.toLowerCase() ?? "";
  const fn = (offered as string[]).includes(requested)
    ? (requested as PageFunction)
    : offered[0];

  // Keep the address bar stating the function so any view can be shared or
  // bookmarked. A page with one function needs no parameter at all.
  const needsParam = offered.length > 1 && requested !== fn;
  const needsStripped = offered.length === 1 && requested !== "";
  const redirectTo = needsParam
    ? `/admin/${pageId}?fn=${fn}`
    : needsStripped
      ? `/admin/${pageId}`
      : null;

  return { destination: pageId, fn, redirectTo };
}

/** The page that owns an entry table, so a search hit lands there directly. */
function entriesPathFor(table: EntryTable): string {
  const owner = PAGE_META.find((page) => PAGE_SCOPE[page.id].table === table);
  return owner ? `/admin/${owner.id}?fn=entries` : `/admin/career?fn=entries`;
}

interface NavButtonProps {
  label: string;
  description: string;
  icon: typeof FileText;
  isActive: boolean;
  badge: string | number | null;
  onSelect: () => void;
}

/** One row in either sidebar group, so both groups read the same way. */
function NavButton({ label, description, icon: Icon, isActive, badge, onSelect }: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      title={description}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex min-h-[44px] shrink-0 touch-manipulation items-center justify-between gap-3 rounded-md px-3.5 py-2.5 text-left text-[13px] font-medium transition-all active:scale-[0.98]",
        isActive
          ? "bg-primary/10 font-semibold text-primary shadow-sm"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <Icon
          className={cn(
            "size-4 shrink-0 transition-colors",
            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
          )}
          aria-hidden
        />
        <span className="truncate">{label}</span>
      </span>

      {badge !== null ? (
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] tabular-nums",
            isActive
              ? "bg-primary font-semibold text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export default function AdminDashboard() {
  const { identity, signOut } = useAdminAuth();
  const { drafts, overrides, previewing, setPreviewing } = useContent();
  const { all } = useEntries();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const route = resolveRoute(location.pathname, location.search);
  const { destination, fn } = route;
  const isPageView = PAGE_IDS.includes(destination);
  const offered = isPageView ? functionsFor(destination as ContentPageId) : [];
  const pageScope = isPageView ? PAGE_SCOPE[destination as ContentPageId] : undefined;

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

  // Rewrite the address bar when it is bare /admin, an old function-first path,
  // or simply not stating the function the view resolved to.
  React.useEffect(() => {
    if (route.redirectTo) navigate(route.redirectTo, { replace: true });
  }, [route.redirectTo, navigate]);

  // Drafts per page, so a sidebar row can say which page has unpublished work.
  const draftsByPage = React.useMemo(() => {
    const counts: Partial<Record<ContentPageId, number>> = {};
    for (const entry of CONTENT_REGISTRY) {
      if (drafts[entry.key] !== undefined) {
        counts[entry.page] = (counts[entry.page] ?? 0) + 1;
      }
    }
    return counts;
  }, [drafts]);

  const publishedCount = Object.keys(overrides).length;
  const totalEntriesCount =
    all.career.length + all.projects.length + all.certifications.length + all.skills.length;
  const draftCount = Object.keys(drafts).length;

  /**
   * Every address the console can jump to: one row per function a page offers,
   * plus the system screens. Searching "charts" therefore finds the pages that
   * have one, which is the point of listing functions rather than pages.
   */
  const searchDestinations = React.useMemo(() => {
    const rows: { key: string; label: string; hint: string; icon: typeof FileText; path: string }[] =
      [];

    for (const page of PAGE_NAV) {
      const offeredFns = functionsFor(page.id);
      for (const id of offeredFns) {
        rows.push({
          key: `${page.id}-${id}`,
          label: offeredFns.length > 1 ? `${page.label} — ${FUNCTION_META[id].label}` : page.label,
          hint: page.description,
          icon: id === "content" ? page.icon : FUNCTION_META[id].icon,
          path:
            offeredFns.length > 1 ? `/admin/${page.id}?fn=${id}` : `/admin/${page.id}`,
        });
      }
    }

    for (const item of SYSTEM_NAV) {
      rows.push({
        key: item.id,
        label: item.label,
        hint: item.description,
        icon: item.icon,
        path: item.path,
      });
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) => row.label.toLowerCase().includes(q) || row.hint.toLowerCase().includes(q),
    );
  }, [searchQuery]);

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
          {/* Mobile: one horizontal strip. Desktop: two labelled lists. */}
          <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 pb-2 lg:mx-0 lg:block lg:space-y-6 lg:overflow-x-visible lg:px-0 lg:pb-0">
            <nav aria-label="Site pages" className="flex shrink-0 gap-1 lg:block lg:space-y-1">
              <h2 className="hidden px-3.5 pb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground lg:block">
                Pages
              </h2>
              {PAGE_NAV.map((item) => {
                const pending = draftsByPage[item.id] ?? 0;
                const pageActive = destination === item.id;
                const pageFns = functionsFor(item.id as ContentPageId);
                return (
                  <div key={item.id} className="shrink-0">
                    <NavButton
                      label={item.label}
                      description={item.description}
                      icon={item.icon}
                      isActive={pageActive}
                      badge={pending > 0 ? `${pending} draft${pending === 1 ? "" : "s"}` : null}
                      onSelect={() => navigate(item.path)}
                    />
                    {/* The functions this page owns, listed under it on desktop.
                        Mobile keeps them as the tab strip above the content. */}
                    {pageActive && pageFns.length > 1 ? (
                      <div className="mt-1 hidden flex-col gap-0.5 border-l border-border/70 pl-2.5 lg:flex">
                        {pageFns.map((fnId) => {
                          const fmeta = FUNCTION_META[fnId];
                          const FIcon = fmeta.icon;
                          const fnActive = fn === fnId;
                          return (
                            <button
                              key={fnId}
                              type="button"
                              onClick={() => navigate(`/admin/${item.id}?fn=${fnId}`)}
                              aria-current={fnActive ? "true" : undefined}
                              className={cn(
                                "flex min-h-[38px] touch-manipulation items-center gap-2.5 rounded-md px-3 py-2 text-left text-[12px] font-medium transition-colors active:scale-[0.98]",
                                fnActive
                                  ? "bg-primary/10 font-semibold text-primary"
                                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                              )}
                            >
                              <FIcon
                                className={cn(
                                  "size-3.5 shrink-0",
                                  fnActive ? "text-primary" : "text-muted-foreground",
                                )}
                                aria-hidden
                              />
                              <span className="truncate">{fmeta.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>

            <span aria-hidden className="my-1 w-px shrink-0 self-stretch bg-border lg:hidden" />

            <nav aria-label="System" className="flex shrink-0 gap-1 lg:block lg:space-y-1">
              <h2 className="hidden px-3.5 pb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground lg:block">
                System
              </h2>
              {SYSTEM_NAV.map((item) => (
                <NavButton
                  key={item.id}
                  label={item.label}
                  description={item.description}
                  icon={item.icon}
                  isActive={destination === item.id}
                  badge={null}
                  onSelect={() => navigate(item.path)}
                />
              ))}
            </nav>
          </div>

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
                <span>Drafts</span>
                <span className="font-semibold text-foreground">{draftCount}</span>
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
          {isPageView ? (
            <>
              {/* The functions this page offers. Omitted when it has only one. */}
              {offered.length > 1 ? (
                <div
                  role="tablist"
                  aria-label="Editing functions"
                  className="no-scrollbar -mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-border px-4 pb-px sm:mx-0 sm:px-0"
                >
                  {offered.map((id) => {
                    const meta = FUNCTION_META[id];
                    const Icon = meta.icon;
                    const active = fn === id;
                    return (
                      <button
                        key={id}
                        id={`fn-tab-${id}`}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        aria-controls="fn-panel"
                        onClick={() => navigate(`/admin/${destination}?fn=${id}`)}
                        className={cn(
                          "flex min-h-[44px] shrink-0 touch-manipulation items-center gap-2 border-b-2 px-3.5 text-[13px] font-medium transition-colors active:scale-[0.98]",
                          active
                            ? "border-primary text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-4",
                            active ? "text-primary" : "text-muted-foreground",
                          )}
                          aria-hidden
                        />
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <div id="fn-panel" role="tabpanel" aria-labelledby={`fn-tab-${fn}`}>
                {fn === "content" ? (
                  <ContentEditor pageId={destination as ContentPageId} hidePageSelector />
                ) : null}

                {fn === "entries" && pageScope?.table ? (
                  <EntriesPanel table={pageScope.table} hideTableSelector />
                ) : null}

                {fn === "charts" && pageScope?.charts ? (
                  <ChartsPanel specIds={pageScope.charts} />
                ) : null}
              </div>
            </>
          ) : null}

          {destination === "messages" ? <MessagesPanel /> : null}

          {destination === "sessions" ? <SessionsPanel /> : null}

          {destination === "history" ? <HistoryPanel /> : null}

          {destination === "account" ? (
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
            {/* Pages with their functions, plus the system screens */}
            <div>
              <div className="px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Go to
              </div>
              <div className="mt-1 space-y-1">
                {searchDestinations.map((row) => (
                  <button
                    key={row.key}
                    type="button"
                    onClick={() => {
                      navigate(row.path);
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="flex min-h-[44px] w-full touch-manipulation items-center justify-between gap-3 rounded-md p-2.5 text-left transition-colors hover:bg-muted/60 active:bg-muted"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <row.icon className="size-4 shrink-0 text-primary" aria-hidden />
                      <span className="truncate text-[13px] font-medium">{row.label}</span>
                    </span>
                    <span className="hidden max-w-[45%] shrink-0 truncate font-mono text-[11px] text-muted-foreground sm:inline">
                      {row.hint}
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
                          navigate(entriesPathFor("career"));
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
                          navigate(entriesPathFor("projects"));
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
                          navigate(entriesPathFor("certifications"));
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
                          navigate(entriesPathFor("skills"));
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
