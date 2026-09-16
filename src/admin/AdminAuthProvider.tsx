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

interface AdminAuthValue {
  status: AdminStatus;
  identity: AdminIdentity | null;
  canSignIn: boolean;
  /** Set when the client could not be built at all, so the panel says why. */
  configMessage: string | null;
  signIn: (username: string, password: string) => Promise<SignInOutcome>;
  signOut: () => Promise<void>;
  /** Requests a password reset email from Supabase Auth. */
  sendPasswordReset: (emailOrUsername: string) => Promise<SignInOutcome>;
  /** Updates the user's password after following a reset link. */
  resetPasswordWithToken: (nextPassword: string) => Promise<SignInOutcome>;
  /** Sets a new password and clears the must change flag. */
  changePassword: (currentPassword: string, nextPassword: string) => Promise<SignInOutcome>;
}

const AdminAuthContext = React.createContext<AdminAuthValue | null>(null);

interface AdminStateRow {
  email: string;
  must_change_password: boolean;
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<AdminStatus>("loading");
  const [identity, setIdentity] = React.useState<AdminIdentity | null>(null);

  /** Reads the allowlist state for the current session. Null means "not an admin". */
  const loadIdentity = React.useCallback(async (): Promise<AdminIdentity | null> => {
    if (!supabase) return null;

    const { data, error } = await supabase.rpc("portfolio_admin_state");

    if (error) {
      // 42501 is the deliberate refusal raised by the function for a caller
      // that is not on the allowlist. Anything else is a real failure and gets
      // reported in the console so it is not silently swallowed.
      if (error.code !== "42501") {
        console.warn("[admin] could not read the admin state:", error.message);
      }
      return null;
    }

    const row = (data as AdminStateRow[] | null)?.[0];
    if (!row) return null;

    return { email: row.email, mustChangePassword: row.must_change_password };
  }, []);

  const applySession = React.useCallback(
    async (session: Session | null) => {
      if (!session) {
        setIdentity(null);
        setStatus("signed-out");
        return;
      }

      const next = await loadIdentity();

      if (!next) {
        // A signed in account that is not on the allowlist gets no access to
        // anything and loses its session, so a self service signup cannot be
        // used to probe the panel.
        await supabase?.auth.signOut();
        setIdentity(null);
        setStatus("signed-out");
        return;
      }

      setIdentity(next);
      setStatus("signed-in");
    },
    [loadIdentity],
  );

  React.useEffect(() => {
    if (!supabase) {
      setStatus("signed-out");
      return;
    }

    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (active) void applySession(data.session);
    });

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

      const next = await loadIdentity();

      if (!next) {
        await supabase.auth.signOut();
        return { ok: false, message: "This account is not on the admin list for this site." };
      }

      setIdentity(next);
      setStatus("signed-in");

      return { ok: true, mustChangePassword: next.mustChangePassword };
    },
    [loadIdentity],
  );

  const signOut = React.useCallback(async () => {
    await supabase?.auth.signOut();
    setIdentity(null);
    setStatus("signed-out");
  }, []);

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

      const next = await loadIdentity();
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

      setIdentity({ email: identity.email, mustChangePassword: false });
      return { ok: true };
    },
    [identity],
  );

  const value = React.useMemo<AdminAuthValue>(
    () => ({
      status,
      identity,
      canSignIn: isSupabaseConfigured,
      configMessage: isSupabaseConfigured ? null : MISSING_CONFIG_MESSAGE,
      signIn,
      signOut,
      sendPasswordReset,
      resetPasswordWithToken,
      changePassword,
    }),
    [status, identity, signIn, signOut, sendPasswordReset, resetPasswordWithToken, changePassword],
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
