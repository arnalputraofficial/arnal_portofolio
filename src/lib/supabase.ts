/**
 * Supabase client for the portfolio admin panel.
 *
 * The publishable key is designed to be shipped to the browser, so it is not a
 * secret. Every access rule lives in row level security policies and in
 * SECURITY DEFINER functions inside the database, never in this file.
 *
 * When the environment variables are missing the client is null and the site
 * still renders from the defaults compiled into the bundle. Nothing breaks; the
 * admin panel simply reports that it is not configured.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && publishableKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, publishableKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Namespaced so it cannot collide with the other keys this site uses.
        storageKey: "arnal:admin-session",
      },
    })
  : null;

export const MISSING_CONFIG_MESSAGE =
  "Supabase is not configured. Copy .env.example to .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then restart the dev server.";

/** Turns a Postgres error into something worth reading on screen. */
export function describeWriteError(error: { message: string; code?: string }): string {
  if (error.code === "42501") {
    return "The database refused this change. The session has expired, or the account is no longer on the admin list. Sign in again.";
  }
  return error.message;
}
