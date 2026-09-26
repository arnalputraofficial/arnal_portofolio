/**
 * Admin session state for the whole app.
 *
 * Holds the Supabase auth session, checks it against the server side allowlist,
 * and exposes the actions the sign in page and the dashboard need.
 *
 * A session alone is not enough. Anyone can create an account on a Supabase
 * project whose signup endpoint is open, so after every sign in this provider
 * asks the database whether the caller is on the allowlist
 * (portfolio_admin_state). A signed in account that is not an admin is treated
 * as a visitor and signed straight back out.
 */
import * as React from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, MISSING_CONFIG_MESSAGE, supabase } from "@/lib/supabase";
import { describeAuthError, resolveAdminEmail, resolveUsername } from "@/lib/adminAccount";

export type AdminStatus = "loading" | "signed-out" | "signed-in";

export interface AdminIdentity {
  /** The address the account signs in with. */
  email: string;
  /** True while the account still carries the password it was created with. */
  mustChangePassword: boolean;
}

export interface SignInOutcome {
  ok: boolean;
  /** Set when the password has to be replaced before the panel will open. */
  mustChangePassword?: boolean;
  /** Ready to show on screen, never a raw Supabase string. */
  message?: string;
}

export interface AdminSessionInfo {
  id: string;
  sessionId: string;
  email: string;
  userAgent: string | null;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

interface AdminAuthValue {
  status: AdminStatus;
  identity: AdminIdentity | null;
  canSignIn: boolean;
  /** Set when the client could not be built at all, so the panel says why. */
  configMessage: string | null;
  currentSessionId: string;
  signIn: (username: string, password: string) => Promise<SignInOutcome>;
  signOut: () => Promise<void>;
  /** Requests a password reset email from Supabase Auth. */
  sendPasswordReset: (emailOrUsername: string) => Promise<SignInOutcome>;
  /** Updates the user's password after following a reset link. */
  resetPasswordWithToken: (nextPassword: string) => Promise<SignInOutcome>;
  /** Sets a new password and clears the must change flag. */
  changePassword: (currentPassword: string, nextPassword: string) => Promise<SignInOutcome>;
  /** Lists active admin sessions across devices. */
  listSessions: () => Promise<AdminSessionInfo[]>;
  /** Revokes a session so it gets kicked out on next heartbeat. */
  revokeSession: (sessionId: string) => Promise<boolean>;
}

const AdminAuthContext = React.createContext<AdminAuthValue | null>(null);

/** 3 hours of inactivity before an admin session is automatically signed out. */
const IDLE_TIMEOUT_MS = 3 * 60 * 60 * 1000;
const LAST_ACTIVITY_KEY = "arnal:admin-last-activity";
const SESSION_ID_KEY = "arnal:admin-session-id";

/**
 * Every tab of this browser shares one admin session, so a sign out in one tab
 * has to reach the rest. Supabase keeps its own session in localStorage, which
 * all tabs read, but it never announces that the session was dropped.
 */
const AUTH_CHANNEL_NAME = "arnal:admin-auth";
const SIGNED_OUT_MESSAGE = "signed-out";

function authChannel(): BroadcastChannel | null {
  try {
    if (typeof BroadcastChannel === "undefined") return null;
    return new BroadcastChannel(AUTH_CHANNEL_NAME);
  } catch {
    return null;
  }
}

function getOrCreateSessionId(): string {
  try {
    let sid = localStorage.getItem(SESSION_ID_KEY);
    if (!sid) {
      sid = "sess_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem(SESSION_ID_KEY, sid);
    }
    return sid;
  } catch {
    return "sess_" + Date.now().toString(36);
  }
}

function touchActivity() {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

function clearActivity() {
  try {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch {
    // Ignore storage errors
  }
}

function isIdleExpired(): boolean {
  try {
    const lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (!lastActivityStr) return false;
    const lastActivity = parseInt(lastActivityStr, 10);
    if (isNaN(lastActivity)) return false;
    return Date.now() - lastActivity >= IDLE_TIMEOUT_MS;
  } catch {
    return false;
  }
}

interface AdminStateRow {
  email: string;
  must_change_password: boolean;
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<AdminStatus>("loading");
  const [identity, setIdentity] = React.useState<AdminIdentity | null>(null);

  /**
   * Reads the allowlist state for the current session.
   *
   * Three answers, and the difference matters. An identity means the account is
   * on the allowlist. Null means the database refused the caller, which is a
   * deliberate 42501 and never worth retrying. Undefined means the answer could
   * not be read at all, and that must never be treated as a refusal: doing so
   * signed an owner out over one flaky request and sent them back to an empty
   * password box for a password the server had already accepted.
   *
   * The result is keyed by the session's user id and kept for this mount, so
   * the several auth events that describe the same session do not each pay for
   * their own round trip to the database.
   */
  const identityCache = React.useRef(new Map<string, AdminIdentity | null>());

  const loadIdentity = React.useCallback(
    async (userId: string): Promise<AdminIdentity | null | undefined> => {
      if (!supabase) return undefined;

      const cached = identityCache.current.get(userId);
      if (cached) return cached;

      // Retry up to 3 times with brief delays to withstand JWT token attachment
      // timing issues or temporary network hiccups during initial login.
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) {
          await new Promise((res) => setTimeout(res, 150 * attempt));
        }

        const { data, error } = await supabase.rpc("portfolio_admin_state");

        if (error) {
          // Two different failures arrive as 42501, and only one of them is a
          // verdict.
          //
          // portfolio_admin_state raises it on purpose, with the message "Not an
          // admin account", for a caller that is not on the allowlist. That one
          // is final and must never be retried.
          //
          // Postgres raises the very same code as "permission denied for
          // function" when the request went out without a user token, because
          // the function is granted to authenticated only, so an anonymous
          // caller is refused at the privilege layer before its body ever runs.
          // That one is a timing failure, not an answer: the password was just
          // accepted, and the token had not settled onto the request yet.
          //
          // Reading the second as the first is what made a correct password need
          // two submits. It cached "not an admin", signed the accepted session
          // straight back out, and left the owner at an empty password box; the
          // retry then worked only because the token had settled by then.
          const message = (error.message ?? "").toLowerCase();
          const refusedByAllowlist =
            error.code === "42501" && !message.includes("permission denied");

          if (refusedByAllowlist) {
            identityCache.current.set(userId, null);
            return null;
          }
          console.warn(`[admin] attempt ${attempt + 1} could not read admin state:`, error.message);
          continue;
        }

        const row = (data as AdminStateRow[] | null)?.[0];
        if (!row) {
          identityCache.current.set(userId, null);
          return null;
        }

        const next = { email: row.email, mustChangePassword: row.must_change_password };
        identityCache.current.set(userId, next);
        return next;
      }

      return undefined;
    },
    [],
  );

  /**
   * Records this browser as an active admin session.
   *
   * This is the only call allowed to claim a session id, because it runs only
   * when a password has just been accepted. A browser whose session id was
   * revoked earlier therefore gets a working session again on the next sign in,
   * instead of staying locked out behind a dead row the panel refuses to reuse.
   *
   * The row is awaited before sign in reports success, so the panel never opens
   * before the heartbeat has something to find.
   *
   * postgrest-js only sends the request when the builder is awaited, so this
   * must never be written as a bare `void supabase.rpc(...)`: that sends
   * nothing, and the heartbeat below then finds no row for a session that was
   * never revoked, which is indistinguishable from a remote sign out.
   */
  const registerSession = React.useCallback(async (): Promise<boolean> => {
    if (!supabase) return false;

    const { error } = await supabase.rpc("portfolio_register_session", {
      p_session_id: getOrCreateSessionId(),
      p_user_agent: navigator.userAgent,
    });

    if (error) {
      console.warn("[admin] could not register the admin session:", error.message);
      return false;
    }

    return true;
  }, []);

  /**
   * Turns a session into a status. Only the newest call is allowed to write, so
   * a stale one cannot overwrite what just happened.
   *
   * Two things can go wrong without this. The several auth events that describe
   * one sign in are not equally fresh, so a late "no session" answer could undo
   * a sign in that just succeeded, and the sign in page would send the user back
   * to an empty password box for a password the server had already accepted.
   */
  const applySeq = React.useRef(0);

  /**
   * Ends the session without touching the server, for the case where it is
   * already gone. The rows in the database are left alone on purpose: a revoked
   * one is the record that the owner closed that device, and sign in clears it
   * again on the next successful password.
   */
  const endSessionLocally = React.useCallback(() => {
    clearActivity();
    // Forget every verdict about every account. The cache exists to spare the
    // database a repeat read for the several auth events that describe one
    // session, so its useful life ends with that session. A "not an admin"
    // answer kept alive past a sign out is worse than no answer at all: it is
    // read again on the next sign in, before that attempt has said anything,
    // and one bad read then survives logging back in with the same correct
    // password.
    identityCache.current.clear();
    setIdentity(null);
    setStatus("signed-out");
  }, []);

  const applySession = React.useCallback(
    async (session: Session | null) => {
      const seq = ++applySeq.current;

      // An empty event is not proof that the session is gone, because a stale
      // one can arrive after a fresh sign in. Storage is the tie breaker: if a
      // session is still there, this event is old news and is dropped.
      let effective = session;
      if (!effective) {
        const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
        if (seq !== applySeq.current) return;
        effective = data.session;
      }

      if (!effective) {
        endSessionLocally();
        return;
      }

      if (isIdleExpired()) {
        // This browser was left idle for longer than the window, and the server
        // will refuse the session from here on. Clearing it locally is the
        // quiet path: calling signOut would fire another auth event while this
        // one is still being handled.
        clearActivity();
        await supabase?.auth.signOut({ scope: "local" });
        if (seq !== applySeq.current) return;
        endSessionLocally();
        return;
      }

      const next = await loadIdentity(effective.user.id);
      if (seq !== applySeq.current) return;

      // Undefined is a read failure, not a refusal. Leaving the current status
      // alone keeps the owner inside the panel while the network is flaky; the
      // next auth event or heartbeat retries, and only an explicit 42501 from
      // the database is allowed to end the session.
      if (next === undefined) {
        console.warn("[admin] admin state could not be read; keeping the current status");
        return;
      }

      if (next === null) {
        // A signed in account that is not on the allowlist gets no access to
        // anything, so a self service signup cannot be used to probe the panel.
        // The session is dropped locally rather than through signOut, which
        // would fire another auth event while this one is still being handled.
        await supabase?.auth.signOut({ scope: "local" });
        if (seq !== applySeq.current) return;
        endSessionLocally();
        return;
      }

      try {
        if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
          touchActivity();
        }
      } catch {
        // Ignore storage errors
      }

      // No register here on purpose. This runs for every auth event, including
      // a token refresh and the initial session on a reload, and registering
      // clears a revocation. Doing it here would let a device the owner closed
      // from another machine walk back in on its next token refresh. Claiming
      // the session id belongs to signIn alone, where a password was just
      // accepted; the heartbeat creates the row if it is somehow missing.
      setIdentity(next);
      setStatus("signed-in");
    },
    [loadIdentity, endSessionLocally],
  );

  React.useEffect(() => {
    if (!supabase) {
      setStatus("signed-out");
      return;
    }

    let active = true;

    // onAuthStateChange fires INITIAL_SESSION on its own once the client has
    // finished starting up, and signIn() resolves only after every subscriber
    // has run, so it is the single source of truth here. A second getSession()
    // call would only add a competing answer that can be slower.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) void applySession(session);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [applySession]);

  const signIn = React.useCallback(
    async (username: string, password: string): Promise<SignInOutcome> => {
      if (!supabase) return { ok: false, message: MISSING_CONFIG_MESSAGE };

      const email = resolveUsername(username);
      if (!email) {
        // Deliberately the same wording as a wrong password. The form should
        // not become a way to discover which usernames exist.
        return { ok: false, message: "That username and password combination was not accepted." };
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) return { ok: false, message: describeAuthError(error.message) };
      if (!data.session) {
        return { ok: false, message: "The sign in did not return a session. Try again." };
      }

      const next = await loadIdentity(data.session.user.id);

      if (next === undefined) {
        // The password was accepted, so the session is real. Only the allowlist
        // check failed to come back, and reporting that as a rejected account
        // sent the owner back to an empty password box for a password the
        // server had already taken. The session is left in place so the next
        // event can finish the job.
        return {
          ok: false,
          message: "The admin list could not be checked. Check the connection and try again.",
        };
      }

      if (next === null) {
        await supabase.auth.signOut();
        return { ok: false, message: "This account is not on the admin list for this site." };
      }

      // Claim the write slot. signInWithPassword resolves only after every auth
      // subscriber has run, so the applySession calls those subscribers started
      // are already in flight and are not ordered against this promise. Without
      // a claim of its own, a slower one of them could land after this and write
      // a status that predates the password the server just accepted, which
      // reads to the owner as a dashboard that opened and then closed itself.
      // Every await below has finished by now, so the claim is taken as late as
      // it can be and only cancels work that started before the password was
      // known to be good.
      applySeq.current += 1;

      touchActivity();
      setIdentity(next);
      setStatus("signed-in");

      // The auth listener runs applySession too, but it is not ordered against
      // this promise. Registering here means the dashboard never opens before
      // the row the heartbeat looks for exists.
      await registerSession();

      return { ok: true, mustChangePassword: next.mustChangePassword };
    },
    [loadIdentity, registerSession],
  );

  const signOut = React.useCallback(async () => {
    const sid = getOrCreateSessionId();
    try {
      await supabase?.rpc("portfolio_revoke_session", { p_session_id: sid });
    } catch {
      // Ignore if cannot contact db during logout
    }
    await supabase?.auth.signOut();

    // Supabase clears the storage all tabs share, but a tab sitting in the
    // background will not look at it until its next heartbeat. Announcing the
    // sign out closes the panel everywhere at once, which is what a single
    // shared session is supposed to mean.
    const channel = authChannel();
    if (channel) {
      channel.postMessage(SIGNED_OUT_MESSAGE);
      channel.close();
    }

    endSessionLocally();
  }, [endSessionLocally]);

  /**
   * Follows a sign out that happened in another tab of this browser.
   */
  React.useEffect(() => {
    const channel = authChannel();
    if (!channel) return;

    channel.onmessage = (event: MessageEvent) => {
      if (event.data === SIGNED_OUT_MESSAGE) endSessionLocally();
    };

    return () => channel.close();
  }, [endSessionLocally]);

  /**
   * Tracks user interaction (mouse/touch/keyboard/scroll) while signed in,
   * checks heartbeat with server to see if this session was remotely revoked,
   * and automatically signs out after 3 hours of inactivity.
   */
  React.useEffect(() => {
    if (status !== "signed-in") return;

    let lastUpdate = 0;
    const pingSession = async () => {
      await supabase?.rpc("portfolio_touch_session", { p_session_id: getOrCreateSessionId() });
    };

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastUpdate > 10_000) {
        lastUpdate = now;
        touchActivity();
        // Awaited inside pingSession so the request is actually sent. The
        // answer is not needed here: checkIdle below owns that decision.
        void pingSession();
      }
    };

    const checkIdle = async () => {
      if (isIdleExpired()) {
        void signOut();
        return;
      }
      // Check if session was revoked remotely
      if (!supabase) return;

      // Touch is the heartbeat: it moves last_active_at and answers false only
      // for a session the owner revoked from another device. Registering again
      // here was the old way out of a missing row, but it also made a revoked
      // session look alive again, so the answer is now taken as final.
      const { data, error } = await supabase.rpc("portfolio_touch_session", {
        p_session_id: getOrCreateSessionId(),
      });
      if (error || data !== false) return;

      void signOut();
    };

    const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "scroll", "touchstart"];
    events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));

    const intervalId = setInterval(() => void checkIdle(), 30_000);

    const onFocusOrVisible = () => {
      if (document.visibilityState === "visible") {
        void checkIdle();
      }
    };
    window.addEventListener("visibilitychange", onFocusOrVisible);
    window.addEventListener("focus", onFocusOrVisible);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
      clearInterval(intervalId);
      window.removeEventListener("visibilitychange", onFocusOrVisible);
      window.removeEventListener("focus", onFocusOrVisible);
    };
  }, [status, signOut]);

  const sendPasswordReset = React.useCallback(
    async (emailOrUsername: string): Promise<SignInOutcome> => {
      if (!supabase) return { ok: false, message: MISSING_CONFIG_MESSAGE };

      const email = resolveAdminEmail(emailOrUsername);
      if (!email) {
        // Return success message to avoid email enumeration
        return {
          ok: true,
          message:
            "If that email belongs to an administrator account, a password reset link has been sent.",
        };
      }

      const redirectTo = `${window.location.origin}/admin/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        return { ok: false, message: describeAuthError(error.message) };
      }

      return {
        ok: true,
        message: `Password reset link sent to ${email}. Check your inbox.`,
      };
    },
    [],
  );

  const resetPasswordWithToken = React.useCallback(
    async (nextPassword: string): Promise<SignInOutcome> => {
      if (!supabase) return { ok: false, message: MISSING_CONFIG_MESSAGE };

      const { error: updateError } = await supabase.auth.updateUser({ password: nextPassword });
      if (updateError) return { ok: false, message: describeAuthError(updateError.message) };

      // Also ensure password changed flag is cleared if present
      await supabase.rpc("portfolio_password_changed");

      // The flag just moved in the database, so the cached answer is stale.
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) return { ok: true };

      identityCache.current.delete(userId);

      const next = await loadIdentity(userId);
      if (next) {
        setIdentity(next);
        setStatus("signed-in");
      }

      return { ok: true };
    },
    [loadIdentity],
  );

  const changePassword = React.useCallback(
    async (currentPassword: string, nextPassword: string): Promise<SignInOutcome> => {
      if (!supabase) return { ok: false, message: MISSING_CONFIG_MESSAGE };

      if (!identity) return { ok: false, message: "The session expired. Sign in again." };

      // Supabase wants the current password before it will accept a new one,
      // which also stops a borrowed browser from being used to lock the owner
      // out of their own account.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: identity.email,
        password: currentPassword,
      });

      if (verifyError) return { ok: false, message: describeAuthError(verifyError.message) };

      const { error: updateError } = await supabase.auth.updateUser({ password: nextPassword });
      if (updateError) return { ok: false, message: describeAuthError(updateError.message) };

      // The flag lives in the database, so clearing it is a second call. If
      // this one fails the owner is asked again next time, which is the safe
      // direction to fail in.
      const { error: flagError } = await supabase.rpc("portfolio_password_changed");
      if (flagError) {
        console.warn("[admin] password changed but the flag was not cleared:", flagError.message);
        return {
          ok: false,
          message:
            "The password was changed, but the account flag could not be updated. Reload and sign in with the new password.",
        };
      }

      const settled: AdminIdentity = { email: identity.email, mustChangePassword: false };

      // Keep the cache in step, or the next auth event would read the flag
      // back as it was before this change.
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) identityCache.current.set(sessionData.session.user.id, settled);

      setIdentity(settled);
      return { ok: true };
    },
    [identity],
  );

  const currentSessionId = getOrCreateSessionId();

  const listSessions = React.useCallback(async (): Promise<AdminSessionInfo[]> => {
    if (!supabase) return [];
    const currentId = getOrCreateSessionId();
    const { data, error } = await supabase.rpc("portfolio_list_sessions");
    if (error || !Array.isArray(data)) return [];

    return data.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      sessionId: String(row.session_id),
      email: String(row.email),
      userAgent: (row.user_agent as string | null) ?? null,
      createdAt: String(row.created_at),
      lastActiveAt: String(row.last_active_at),
      isCurrent: String(row.session_id) === currentId,
    }));
  }, []);

  const revokeSession = React.useCallback(async (sessionIdToRevoke: string): Promise<boolean> => {
    if (!supabase) return false;
    const { error } = await supabase.rpc("portfolio_revoke_session", {
      p_session_id: sessionIdToRevoke,
    });
    return !error;
  }, []);

  const value = React.useMemo<AdminAuthValue>(
    () => ({
      status,
      identity,
      canSignIn: isSupabaseConfigured,
      configMessage: isSupabaseConfigured ? null : MISSING_CONFIG_MESSAGE,
      currentSessionId,
      signIn,
      signOut,
      sendPasswordReset,
      resetPasswordWithToken,
      changePassword,
      listSessions,
      revokeSession,
    }),
    [
      status,
      identity,
      currentSessionId,
      signIn,
      signOut,
      sendPasswordReset,
      resetPasswordWithToken,
      changePassword,
      listSessions,
      revokeSession,
    ],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthValue {
  const context = React.useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be called inside an AdminAuthProvider");
  }
  return context;
}
