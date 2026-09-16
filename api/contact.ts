/**
 * Contact form endpoint.
 *
 * The browser posts the four fields here, this function stores the message in
 * Postgres through the SECURITY DEFINER function `portfolio_send_message`, and
 * then asks Resend to deliver an email built from the same palette as the site.
 *
 * Two rules shape this file:
 *
 * The message is stored first. Email delivery is best effort, so a visitor is
 * never told "sent" when the only copy would have lived in an inbox that a
 * provider outage swallowed.
 *
 * Nothing but the API key lives on the server. The Supabase publishable key is
 * deliberately shipped to the browser everywhere else, so it is not treated as
 * a secret here either.
 */
/**
 * The two shapes this function touches, declared here so the endpoint carries
 * no dependency of its own. Vercel hands over exactly these members.
 */
interface RequestLike {
  method?: string;
  body: unknown;
}

interface ResponseLike {
  setHeader(name: string, value: string): void;
  status(code: number): { json(payload: unknown): void };
}

const MIN_MESSAGE = 20;
const MAX_MESSAGE = 5000;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
const RESEND_KEY = process.env.RESEND_API_KEY ?? "";
const MAIL_FROM = process.env.CONTACT_FROM_EMAIL ?? "Portfolio <onboarding@resend.dev>";
const MAIL_TO = process.env.CONTACT_TO_EMAIL ?? "";

interface Payload {
  name: string;
  email: string;
  topic: string;
  message: string;
}

/** Colours read straight from the tailwind config, so mail and site agree. */
const INK_950 = "#12100d";
const INK_900 = "#1d1915";
const INK_850 = "#231e19";
const INK_800 = "#2e2721";
const INK_400 = "#8f806e";
const INK_300 = "#ad9f8d";
const INK_100 = "#e8e3dc";
const RUST = "#d55128";
const MOSS = "#6a9364";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function readBody(body: unknown): Payload | null {
  if (typeof body !== "object" || body === null) return null;
  const raw = body as Record<string, unknown>;

  const pick = (key: string) => (typeof raw[key] === "string" ? (raw[key] as string).trim() : "");

  const payload: Payload = {
    name: pick("name"),
    email: pick("email"),
    topic: pick("topic") || "General inquiry",
    message: pick("message"),
  };

  if (payload.name.length < 2 || payload.name.length > 100) return null;
  if (payload.email.length < 5 || payload.email.length > 200) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return null;
  if (payload.message.length < MIN_MESSAGE || payload.message.length > MAX_MESSAGE) return null;

  return payload;
}

/** Stores the message and returns its id, or throws with a readable reason. */
async function storeMessage(payload: Payload): Promise<string> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/portfolio_send_message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({
      p_name: payload.name,
      p_email: payload.email,
      p_topic: payload.topic,
      p_message: payload.message,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase refused the message (${response.status}): ${detail.slice(0, 200)}`);
  }

  return (await response.json()) as string;
}

function renderEmail(payload: Payload, receivedAt: string): string {
  const safe = {
    name: escapeHtml(payload.name),
    email: escapeHtml(payload.email),
    topic: escapeHtml(payload.topic),
    message: escapeHtml(payload.message).replace(/\n/g, "<br>"),
  };

  const monoStyle = `font-family:'JetBrains Mono','Courier New',Consolas,monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>New Inquiry: ${safe.topic}</title>
</head>
<body style="margin:0;padding:0;background-color:${INK_950};color:${INK_100};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${INK_950};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background-color:${INK_900};border:1px solid ${INK_800};border-radius:8px;overflow:hidden;box-shadow:0 12px 32px rgba(0,0,0,0.4);">
          <!-- Top Accent Bar -->
          <tr>
            <td style="height:4px;background-color:${RUST};font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td style="padding:32px 32px 16px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="${monoStyle}color:${RUST};">07 / INCOMING INQUIRY</div>
                    <h1 style="margin:10px 0 0 0;font-size:22px;line-height:1.3;font-weight:700;color:${INK_100};letter-spacing:-0.02em;">${safe.topic}</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Meta Information Box -->
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${INK_950};border:1px solid ${INK_800};border-radius:6px;border-collapse:separate;">
                <tr>
                  <td width="30%" style="padding:12px 16px 6px 16px;${monoStyle}color:${INK_300};vertical-align:top;">FROM</td>
                  <td width="70%" style="padding:12px 16px 6px 16px;font-size:14px;font-weight:600;color:${INK_100};">${safe.name}</td>
                </tr>
                <tr>
                  <td style="padding:4px 16px 6px 16px;${monoStyle}color:${INK_300};vertical-align:top;">SENDER EMAIL</td>
                  <td style="padding:4px 16px 6px 16px;font-size:14px;">
                    <a href="mailto:${safe.email}" style="color:${RUST};text-decoration:none;font-weight:500;">${safe.email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 16px 12px 16px;${monoStyle}color:${INK_300};vertical-align:top;">TIMESTAMP</td>
                  <td style="padding:4px 16px 12px 16px;font-size:13px;color:${INK_300};font-family:'JetBrains Mono','Courier New',monospace;">${escapeHtml(receivedAt)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding:0 32px 32px 32px;">
              <div style="${monoStyle}color:${INK_300};margin-bottom:8px;">MESSAGE CONTENT</div>
              <div style="background-color:${INK_950};border:1px dashed ${INK_800};border-radius:6px;padding:20px;font-size:14px;line-height:1.7;color:${INK_100};word-break:break-word;">
                ${safe.message}
              </div>

              <!-- Action Callout Box -->
              <div style="margin-top:20px;padding:14px 16px;background-color:${INK_850};border-left:3px solid ${RUST};border-radius:0 6px 6px 0;font-size:13px;line-height:1.5;color:${INK_100};">
                <strong style="color:${RUST};">Quick Action:</strong> Direct reply to this email will respond directly to <span style="color:${RUST};">${safe.name}</span> (&lt;${safe.email}&gt;).
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;background-color:${INK_950};border-top:1px solid ${INK_800};${monoStyle}color:${INK_400};text-align:left;">
              arnal-portofolio &bull; Rust &amp; Ink System &bull; Contact Form Notification
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderText(payload: Payload, receivedAt: string): string {
  return [
    `New inquiry: ${payload.topic}`,
    "",
    `From:     ${payload.name}`,
    `Reply to: ${payload.email}`,
    `Received: ${receivedAt}`,
    "",
    "Message",
    "-------",
    payload.message,
  ].join("\n");
}

async function sendEmail(payload: Payload, receivedAt: string): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_KEY}`,
    },
    body: JSON.stringify({
      from: MAIL_FROM,
      to: [MAIL_TO],
      reply_to: payload.email,
      subject: `[Portfolio] ${payload.topic} from ${payload.name}`,
      html: renderEmail(payload, receivedAt),
      text: renderText(payload, receivedAt),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend refused the email (${response.status}): ${detail.slice(0, 200)}`);
  }
}

export default async function handler(request: RequestLike, response: ResponseLike) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ ok: false, error: "Use POST for this endpoint." });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return response.status(500).json({ ok: false, error: "The message store is not configured." });
  }

  const payload = readBody(request.body);
  if (!payload) {
    return response.status(400).json({ ok: false, error: "The message did not pass validation." });
  }

  const receivedAt = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";

  let id: string;
  try {
    id = await storeMessage(payload);
  } catch (error) {
    console.error("[contact] store failed", error);
    return response
      .status(502)
      .json({ ok: false, error: "The message could not be stored. Please try again." });
  }

  // The row is safe now, so a mail failure is reported honestly instead of
  // pretending the whole submission worked.
  if (!RESEND_KEY || !MAIL_TO) {
    console.warn("[contact] stored without email: RESEND_API_KEY or CONTACT_TO_EMAIL is missing");
    return response.status(200).json({ ok: true, id, emailed: false });
  }

  try {
    await sendEmail(payload, receivedAt);
    return response.status(200).json({ ok: true, id, emailed: true });
  } catch (error) {
    console.error("[contact] email failed", error);
    return response.status(200).json({ ok: true, id, emailed: false });
  }
}
