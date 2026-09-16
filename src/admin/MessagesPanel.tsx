/**
 * The inbox.
 *
 * Every message the contact form stores lands here, newest first, and stays
 * readable after the notification email has been archived or lost.
 *
 * Reading a row is a write, because the panel marks it read once you open it.
 * That is why each card carries its own state rather than a bulk action: the
 * database holds exactly what the screen shows.
 *
 * The public half of this feature lives in api/contact.ts. This file only ever
 * reads, marks, and deletes, all under row level security.
 */
import * as React from "react";
import { Check, Copy, Loader2, Mail, MailOpen, RefreshCw, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { deleteMessage, listMessages, markMessageRead, type Message } from "@/lib/messages";

function when(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type FilterTab = "all" | "unread" | "read";

export default function MessagesPanel() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [problem, setProblem] = React.useState("");
  const [busyId, setBusyId] = React.useState("");
  const [open, setOpen] = React.useState<Message | null>(null);
  const [search, setSearch] = React.useState("");
  const [tab, setTab] = React.useState<FilterTab>("all");
  const [copied, setCopied] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    const { data, error } = await listMessages();
    setMessages(data);
    setProblem(error ?? "");
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const unreadCount = messages.filter((m) => !m.read).length;
  const readCount = messages.filter((m) => m.read).length;

  const filteredMessages = React.useMemo(() => {
    return messages.filter((msg) => {
      if (tab === "unread" && msg.read) return false;
      if (tab === "read" && !msg.read) return false;
      if (!search.trim()) return true;

      const q = search.toLowerCase();
      return (
        msg.name.toLowerCase().includes(q) ||
        msg.email.toLowerCase().includes(q) ||
        msg.topic.toLowerCase().includes(q) ||
        msg.message.toLowerCase().includes(q)
      );
    });
  }, [messages, tab, search]);

  async function toggleRead(message: Message) {
    setBusyId(message.id);
    const nextState = !message.read;
    const error = await markMessageRead(message.id, nextState);
    setBusyId("");
    if (error) {
      setProblem(error);
      return;
    }
    setMessages((prev) =>
      prev.map((item) => (item.id === message.id ? { ...item, read: nextState } : item)),
    );
    if (open?.id === message.id) {
      setOpen((prev) => (prev ? { ...prev, read: nextState } : null));
    }
  }

  async function remove(message: Message) {
    setBusyId(message.id);
    const error = await deleteMessage(message.id);
    setBusyId("");
    if (error) {
      setProblem(error);
      return;
    }
    if (open?.id === message.id) {
      setOpen(null);
    }
    setMessages((prev) => prev.filter((item) => item.id !== message.id));
  }

  async function openMessage(message: Message) {
    setOpen(message);
    if (message.read) return;
    const error = await markMessageRead(message.id, true);
    if (error) {
      setProblem(error);
      return;
    }
    setMessages((prev) =>
      prev.map((item) => (item.id === message.id ? { ...item, read: true } : item)),
    );
  }

  function handleCopyEmail(email: string) {
    void navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl tracking-tight">Messages Inbox</h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
            View all contact form inquiries submitted by visitors. Each message is saved in the database in real-time and mirrored to your email.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={unreadCount > 0 ? "accent" : "moss"} dot>
            {unreadCount > 0 ? `${unreadCount} unread` : "all read"}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />}
            Refresh
          </Button>
        </div>
      </div>

      {problem && (
        <p
          role="alert"
          className="mt-6 rounded-notch border border-destructive/40 bg-destructive/10 p-4 font-mono text-[12px] text-destructive"
        >
          {problem}
        </p>
      )}

      {/* Filter and Search Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-1.5">
          {(["all", "unread", "read"] as FilterTab[]).map((t) => {
            const count = t === "all" ? messages.length : t === "unread" ? unreadCount : readCount;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-notch px-3 py-1.5 font-mono text-[12px] capitalize transition-colors",
                  tab === t
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {t} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="text"
            placeholder="Search sender, topic, message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 pr-8 text-[13px]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          )}
        </div>
      </div>

      {loading && messages.length === 0 && (
        <p className="mt-10 font-mono text-[12px] text-muted-foreground">Loading inbox messages...</p>
      )}

      {!loading && filteredMessages.length === 0 && !problem && (
        <div className="panel mt-8 p-6">
          <p className="eyebrow">no messages found</p>
          <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
            {search
              ? `No messages matched "${search}". Try clearing your search or switching filters.`
              : "Nothing has arrived in this view yet."}
          </p>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {filteredMessages.map((message) => (
          <article
            key={message.id}
            className={cn(
              "panel flex flex-wrap items-start justify-between gap-4 p-5 transition-colors hover:bg-accent/30",
              !message.read ? "border-l-4 border-l-primary bg-primary/[0.02]" : "opacity-90",
            )}
          >
            <button
              type="button"
              onClick={() => void openMessage(message)}
              className="min-w-0 flex-1 text-left"
            >
              <div className="flex flex-wrap items-center gap-3">
                {message.read ? (
                  <MailOpen className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                ) : (
                  <Mail className="size-4 shrink-0 text-primary" aria-hidden />
                )}
                <span className="font-display text-[15px] font-semibold tracking-tight">
                  {message.name}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">{message.email}</span>
                <span className="font-mono text-[11px] text-muted-foreground/80">
                  {when(message.createdAt)}
                </span>
              </div>
              <p className="mt-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                {message.topic}
              </p>
              <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                {message.message}
              </p>
            </button>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={busyId === message.id}
                onClick={() => void toggleRead(message)}
              >
                {busyId === message.id ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : message.read ? (
                  <Mail className="size-4" aria-hidden />
                ) : (
                  <Check className="size-4" aria-hidden />
                )}
                {message.read ? "Mark unread" : "Mark read"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={busyId === message.id}
                onClick={() => void remove(message)}
                className="hover:text-destructive"
              >
                <Trash2 className="size-4" aria-hidden />
                Delete
              </Button>
            </div>
          </article>
        ))}
      </div>

      {/* Detailed POV Message Modal Dialog */}
      <Dialog open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent className="max-w-2xl">
          {open && (
            <>
              <div className="border-b border-border pb-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="eyebrow text-primary">Message Details &bull; POV Admin</span>
                  <Badge variant={open.read ? "moss" : "accent"}>
                    {open.read ? "Read" : "Unread"}
                  </Badge>
                </div>
                <DialogTitle className="mt-2 font-display text-2xl tracking-tight">
                  {open.topic}
                </DialogTitle>
                <DialogDescription className="mt-1.5 font-mono text-[12px] text-muted-foreground">
                  Received {when(open.createdAt)}
                </DialogDescription>
              </div>

              {/* Sender Details Metadata Card */}
              <div className="panel p-4 text-[13px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground block">
                      Sender Name
                    </span>
                    <span className="font-semibold text-foreground text-[14px]">{open.name}</span>
                  </div>
                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground block">
                      Email Address
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <a
                        href={`mailto:${open.email}`}
                        className="font-mono text-primary underline decoration-primary/40 hover:decoration-primary"
                      >
                        {open.email}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(open.email)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1"
                        title="Copy email to clipboard"
                      >
                        {copied ? <Check className="size-3.5 text-moss" /> : <Copy className="size-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="mt-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground block mb-2">
                  Message Body
                </span>
                <div className="panel p-5 bg-background/80 font-sans text-[14px] leading-relaxed whitespace-pre-wrap border-dashed border-border/80 text-foreground">
                  {open.message}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  <Button asChild size="sm">
                    <a href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.topic}`)}`}>
                      <Mail className="size-4" aria-hidden />
                      Reply by Email
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === open.id}
                    onClick={() => void toggleRead(open)}
                  >
                    {open.read ? "Mark as Unread" : "Mark as Read"}
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busyId === open.id}
                  onClick={() => void remove(open)}
                  className="hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden />
                  Delete Message
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
