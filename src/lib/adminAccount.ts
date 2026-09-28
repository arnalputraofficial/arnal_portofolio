/**
 * Maps the username typed into the sign in form onto the email address that
 * Supabase Auth actually stores.
 *
 * Supabase Auth signs people in with an email address or a phone number, and
 * offers no username login. Rather than pretend otherwise, the form takes a
 * username and this module resolves it. The address it resolves to is already
 * printed on the contact page, so nothing secret is held here.
 *
 * Adding an account is a two step job:
 *   1. add the address to the allowlist in the database (portfolio_admins)
 *   2. add the username to email pair below
 * An account that is missing from either place cannot sign in.
 */

export const ADMIN_ACCOUNTS: Record<string, string> = {
  arnalputra: "arnal@steadbyte.com",
};

/**
 * Every address this site treats as an administrator. Derived from the map
 * above so the two can never drift apart. Password resets are only ever sent
 * to an address on this list, which keeps the form from becoming a way to
 * probe for arbitrary accounts.
 */
export const ADMIN_EMAILS: string[] = Object.values(ADMIN_ACCOUNTS).map((email) =>
  email.toLowerCase(),
);

/** Minimum length the new password has to reach. Supabase enforces its own too. */
export const MIN_PASSWORD_LENGTH = 12;

/**
 * Resolves a username, case and surrounding whitespace ignored.
 * Returns null when the username is not one this site knows about.
 */
export function resolveUsername(username: string): string | null {
  const key = username.trim().toLowerCase();
  if (!key) return null;
  return ADMIN_ACCOUNTS[key] ?? null;
}

/**
 * Resolves a username or email input to an email address.
 *
 * A username is looked up in the map above. An email is only accepted when it
 * is already on the administrator list; anything else resolves to null so the
 * caller can stay silent about which addresses exist.
 */
export function resolveAdminEmail(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  const direct = ADMIN_ACCOUNTS[trimmed];
  if (direct) return direct;

  if (trimmed.includes("@") && ADMIN_EMAILS.includes(trimmed)) {
    return trimmed;
  }

  return null;
}

export type PasswordProblem = "short" | "same" | "mismatch" | null;

/** Checks a proposed password pair and reports the first problem it finds. */
export function checkNewPassword(
  password: string,
  confirmation: string,
  current: string,
): PasswordProblem {
  if (password.length < MIN_PASSWORD_LENGTH) return "short";
  if (password !== confirmation) return "mismatch";
  if (password === current) return "same";
  return null;
}

export const PASSWORD_PROBLEM_TEXT: Record<Exclude<PasswordProblem, null>, string> = {
  short: `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
  mismatch: "The two entries do not match.",
  same: "That is the password you signed in with. Pick a different one.",
};

/**
 * Turns a Supabase auth error into something worth reading on screen.
 * The raw messages are written for developers, so the common ones are
 * translated and anything unrecognised is passed through unchanged rather
 * than hidden.
 */
export function describeAuthError(message: string): string {
  const text = message.toLowerCase();

  if (text.includes("invalid login credentials")) {
    return "That username and password combination was not accepted.";
  }
  if (text.includes("email not confirmed")) {
    return "This account still has an unconfirmed address. Confirm it in the Supabase dashboard first.";
  }
  if (text.includes("rate limit") || text.includes("too many")) {
    return "Too many attempts. Wait a minute before trying again.";
  }
  if (text.includes("failed to fetch") || text.includes("network")) {
    return "Could not reach Supabase. Check the connection and try again.";
  }
  if (text.includes("should be different from the old password")) {
    return "That is the password you signed in with. Pick a different one.";
  }
  if (text.includes("password should be at least")) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  return message;
}
