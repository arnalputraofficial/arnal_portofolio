/**
 * Messages: the contact form's server hop, and the admin inbox's reads.
 *
 * The public side posts to /api/contact, which stores the row through a
 * SECURITY DEFINER function and then emails a copy. The panel side reads the
 * rows back under row level security, so only an allowlisted admin sees them.
 */
import { supabase, describeWriteError } from "./supabase";

export interface Message {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  read: boolean;
  createdAt: string;
}

/** One row as Postgres returns it, which is snake case. */
interface MessageRow {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface SendResult {
  ok: boolean;
  /** False when the row was stored but the notification email did not go out. */
  emailed?: boolean;
  error?: string;
}

export async function sendContactMessage(input: {
  name: string;
  email: string;
  topic: string;
  message: string;
}): Promise<SendResult> {
  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const payload = (await response.json().catch(() => null)) as SendResult | null;

    if (!response.ok) {
      return {
        ok: false,
        error: payload?.error ?? "The message could not be delivered. Please try again.",
      };
    }

    return { ok: true, emailed: payload?.emailed ?? false };
  } catch {
    return { ok: false, error: "The network dropped the request. Check the connection and retry." };
  }
}

export async function listMessages(): Promise<{ data: Message[]; error: string | null }> {
  if (!supabase) return { data: [], error: "Supabase is not configured." };

  const { data, error } = await supabase
    .from("portfolio_messages")
    .select("id, name, email, topic, message, read, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return { data: [], error: describeWriteError(error) };

  return {
    data: (data as MessageRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      topic: row.topic,
      message: row.message,
      read: row.read,
      createdAt: row.created_at,
    })),
    error: null,
  };
}

export async function markMessageRead(id: string, read: boolean): Promise<string | null> {
  if (!supabase) return "Supabase is not configured.";

  const { error } = await supabase.from("portfolio_messages").update({ read }).eq("id", id);
  return error ? describeWriteError(error) : null;
}

export async function deleteMessage(id: string): Promise<string | null> {
  if (!supabase) return "Supabase is not configured.";

  const { error } = await supabase.from("portfolio_messages").delete().eq("id", id);
  return error ? describeWriteError(error) : null;
}