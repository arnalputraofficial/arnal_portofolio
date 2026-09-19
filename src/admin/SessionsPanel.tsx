import * as React from "react";
import { Laptop, Smartphone, LogOut, RefreshCw, Clock, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminAuth, type AdminSessionInfo } from "@/admin/AdminAuthProvider";

function parseDevice(userAgent: string | null): { name: string; type: "mobile" | "desktop" } {
  if (!userAgent) return { name: "Unknown Device", type: "desktop" };
  const ua = userAgent.toLowerCase();
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    let browser = "Mobile Device";
    if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari on iPhone";
    else if (ua.includes("chrome")) browser = "Chrome Mobile";
    return { name: browser, type: "mobile" };
  }
  let browser = "Desktop Browser";
  if (ua.includes("edg/")) browser = "Microsoft Edge";
  else if (ua.includes("chrome")) browser = "Google Chrome";
  else if (ua.includes("firefox")) browser = "Mozilla Firefox";
  else if (ua.includes("safari")) browser = "Apple Safari";
  return { name: browser, type: "desktop" };
}

function timeAgo(dateString: string): string {
  try {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch {
    return dateString;
  }
}

export function SessionsPanel() {
  const { listSessions, revokeSession, signOut } = useAdminAuth();
  const [sessions, setSessions] = React.useState<AdminSessionInfo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [revokingId, setRevokingId] = React.useState<string | null>(null);

  const fetchSessions = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await listSessions();
      setSessions(data);
    } finally {
      setLoading(false);
    }
  }, [listSessions]);

  React.useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  const handleRevoke = async (session: AdminSessionInfo) => {
    if (session.isCurrent) {
      if (confirm("Logout from this current device?")) {
        await signOut();
      }
      return;
    }

    if (confirm(`Logout session on ${parseDevice(session.userAgent).name}?`)) {
      setRevokingId(session.sessionId);
      try {
        const ok = await revokeSession(session.sessionId);
        if (ok) {
          setSessions((prev) => prev.filter((s) => s.sessionId !== session.sessionId));
        }
      } finally {
        setRevokingId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl leading-snug">Active Admin Sessions</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            List of devices currently logged in to the admin panel. Inactive sessions expire after 3 hours.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void fetchSessions()}
          disabled={loading}
          className="gap-2 font-mono text-[11px]"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="panel divide-y divide-border overflow-hidden">
        {loading && sessions.length === 0 ? (
          <div className="p-8 text-center font-mono text-[12px] text-muted-foreground">
            Loading active sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center font-mono text-[12px] text-muted-foreground">
            No other active sessions found.
          </div>
        ) : (
          sessions.map((sess) => {
            const device = parseDevice(sess.userAgent);
            const isRevoking = revokingId === sess.sessionId;

            return (
              <div
                key={sess.sessionId}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-notch border border-border bg-secondary/50 text-foreground">
                    {device.type === "mobile" ? (
                      <Smartphone className="size-4 text-primary" />
                    ) : (
                      <Laptop className="size-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-sm font-semibold tracking-tight text-foreground">
                        {device.name}
                      </span>
                      {sess.isCurrent ? (
                        <Badge variant="accent" dot>
                          Current Device
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="size-3 text-muted-foreground/80" />
                        {sess.email}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3 text-muted-foreground/80" />
                        Active {timeAgo(sess.lastActiveAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center sm:self-center">
                  <Button
                    variant={sess.isCurrent ? "outline" : "solid"}
                    size="sm"
                    onClick={() => void handleRevoke(sess)}
                    disabled={isRevoking}
                    className={
                      sess.isCurrent
                        ? "gap-1.5 font-mono text-[11px] uppercase tracking-wider"
                        : "gap-1.5 border border-destructive/40 bg-destructive/15 font-mono text-[11px] uppercase tracking-wider text-destructive hover:bg-destructive/25"
                    }
                  >
                    <LogOut className="size-3.5" />
                    {sess.isCurrent ? "Logout Current" : isRevoking ? "Logging out..." : "Logout Device"}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
