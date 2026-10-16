import { Resend } from "resend";
import { logger } from "./logger";
import { config } from "../config/env";

let resendInstance: any = config.resendApiKey ? new Resend(config.resendApiKey) : null;
let isForcedUnconfigured = false;
const FROM = config.emailFrom || "onboarding@resend.dev";
const ADMIN_EMAIL = config.adminEmail;

export function getResendClient(): Resend | null {
  if (isForcedUnconfigured) return null;
  if (resendInstance) return resendInstance;
  if (config.resendApiKey) {
    resendInstance = new Resend(config.resendApiKey);
    return resendInstance;
  }
  return null;
}

export function setResendClientForTesting(client: any): void {
  if (client === null) {
    isForcedUnconfigured = true;
    resendInstance = null;
  } else {
    isForcedUnconfigured = false;
    resendInstance = client;
  }
}

function sanitizeError(msg?: string): string {
  if (!msg) return "Unknown delivery error";
  return msg
    .replace(/re_[a-zA-Z0-9_\-\.]+/g, "[REDACTED_API_KEY]")
    .replace(/whsec_[a-zA-Z0-9_\-\.]+/g, "[REDACTED_SECRET]");
}

export function isTransientError(errMsg?: string, statusCode?: number): boolean {
  if (!errMsg) return false;
  const lower = errMsg.toLowerCase();
  return (
    lower.includes("timeout") ||
    lower.includes("etimedout") ||
    lower.includes("econnreset") ||
    lower.includes("rate limit") ||
    lower.includes("429") ||
    lower.includes("too many requests") ||
    lower.includes("internal server error") ||
    lower.includes("500") ||
    lower.includes("502") ||
    lower.includes("503") ||
    lower.includes("504") ||
    (statusCode !== undefined && statusCode >= 500) ||
    statusCode === 429
  );
}

async function send(to: string, subject: string, html: string): Promise<void> {
  const client = getResendClient();
  if (!client) return; // email not configured — skip silently
  try {
    const { data, error } = await client.emails.send({
      from: FROM,
      to,
      subject,
      html,
    });
    if (error) {
      // If the domain is not yet verified on Resend, automatically fallback to onboarding@resend.dev
      if (error.message?.includes("domain is not verified") && FROM !== "onboarding@resend.dev") {
        logger.warn("Custom domain not verified yet on Resend. Falling back to onboarding@resend.dev");
        const fallback = await client.emails.send({
          from: "onboarding@resend.dev",
          to,
          subject,
          html,
        });
        if (!fallback.error) {
          logger.info({ id: fallback.data?.id, to }, "Email delivered via Resend onboarding domain");
          return;
        }
      }
      logger.warn({ error: sanitizeError(error.message) }, "Email send failed via Resend");
    } else {
      logger.info({ id: data?.id, to }, "Email delivered via Resend");
    }
  } catch (err: any) {
    logger.warn({ err: sanitizeError(err?.message) }, "Email send error (non-fatal)");
  }
}

/**
 * Sends an email and returns detailed delivery status for audit and tracking.
 * Includes official Resend SDK error handling, custom headers, idempotency keys,
 * secret sanitization, and transient error retry logic.
 */
export async function sendEmailWithStatus(options: {
  to: string;
  subject: string;
  html: string;
  headers?: Record<string, string>;
  idempotencyKey?: string;
  retries?: number;
}): Promise<{ success: boolean; messageId?: string; error?: string; isTransient?: boolean }> {
  const client = getResendClient();
  if (!client) {
    return { success: false, error: "Resend email provider is not configured" };
  }

  const customHeaders: Record<string, string> = { ...(options.headers || {}) };
  if (options.idempotencyKey) {
    customHeaders["Idempotency-Key"] = options.idempotencyKey;
  }

  const maxAttempts = options.retries ?? 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { data, error } = await client.emails.send({
        from: FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        headers: Object.keys(customHeaders).length > 0 ? customHeaders : undefined,
      });

      if (error) {
        if (error.message?.includes("domain is not verified") && FROM !== "onboarding@resend.dev") {
          logger.warn("Custom domain not verified yet on Resend. Falling back to onboarding@resend.dev");
          const fallback = await client.emails.send({
            from: "onboarding@resend.dev",
            to: options.to,
            subject: options.subject,
            html: options.html,
            headers: Object.keys(customHeaders).length > 0 ? customHeaders : undefined,
          });

          if (!fallback.error && fallback.data) {
            return { success: true, messageId: fallback.data.id };
          }
          const cleanMsg = sanitizeError(fallback.error?.message || "Delivery failed");
          return { success: false, error: cleanMsg, isTransient: isTransientError(cleanMsg) };
        }

        const cleanMsg = sanitizeError(error.message);
        const isTransient = isTransientError(cleanMsg);

        if (isTransient && attempt < maxAttempts) {
          logger.warn(
            { attempt, error: cleanMsg, idempotencyKey: options.idempotencyKey },
            "Transient provider error from Resend. Retrying safely with idempotency key"
          );
          await new Promise((resolve) => setTimeout(resolve, attempt * 500));
          continue;
        }

        return { success: false, error: cleanMsg, isTransient };
      }

      return { success: true, messageId: data?.id };
    } catch (err: any) {
      const cleanMsg = sanitizeError(err?.message || "Unexpected delivery error");
      const isTransient = isTransientError(cleanMsg);

      if (isTransient && attempt < maxAttempts) {
        logger.warn(
          { attempt, error: cleanMsg, idempotencyKey: options.idempotencyKey },
          "Network exception during Resend dispatch. Retrying safely with idempotency key"
        );
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
        continue;
      }

      return { success: false, error: cleanMsg, isTransient };
    }
  }

  return { success: false, error: "Maximum delivery retry attempts exceeded", isTransient: true };
}

/**
 * Send a verification / test email to confirm Resend is working.
 */
export async function sendTestEmail(to = "abhijith.bloombiz@gmail.com"): Promise<void> {
  await send(
    to,
    "Hello World",
    "<p>Congrats on sending your <strong>first email</strong>!</p>"
  );
}

export async function sendBookingConfirmation(order: {
  guestName: string;
  guestEmail: string;
  travelStyle?: string | null;
  destinations?: string | null;
  travelDate?: string | null;
  guestCount?: number | null;
  budgetRange?: string | null;
  specialRequests?: string | null;
}): Promise<void> {
  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a1410;background:#faf9f7;padding:40px 32px;">
      <div style="font-family:monospace;font-size:11px;letter-spacing:0.2em;color:#cbab6e;text-transform:uppercase;margin-bottom:24px;">Escora · Kerala</div>
      <h1 style="font-weight:300;font-size:28px;margin:0 0 8px;">Thank you, ${order.guestName}.</h1>
      <p style="color:#6b5d4f;margin:0 0 32px;font-size:15px;">We've received your journey enquiry and will be in touch shortly to craft your perfect Kerala experience.</p>
      <div style="border-top:1px solid #e8dcc4;padding-top:24px;margin-bottom:32px;">
        <h2 style="font-size:13px;font-family:monospace;letter-spacing:0.15em;text-transform:uppercase;color:#cbab6e;margin:0 0 16px;">Your Enquiry Details</h2>
        ${order.travelStyle ? `<p style="margin:6px 0;font-size:14px;"><strong>Travel Style:</strong> ${order.travelStyle}</p>` : ""}
        ${order.destinations ? `<p style="margin:6px 0;font-size:14px;"><strong>Destinations:</strong> ${order.destinations}</p>` : ""}
        ${order.travelDate ? `<p style="margin:6px 0;font-size:14px;"><strong>Arrival Date:</strong> ${order.travelDate}</p>` : ""}
        ${order.guestCount ? `<p style="margin:6px 0;font-size:14px;"><strong>Guests:</strong> ${order.guestCount}</p>` : ""}
        ${order.budgetRange ? `<p style="margin:6px 0;font-size:14px;"><strong>Budget Range:</strong> ${order.budgetRange}</p>` : ""}
        ${order.specialRequests ? `<p style="margin:6px 0;font-size:14px;"><strong>Special Requests:</strong> ${order.specialRequests}</p>` : ""}
      </div>
      <p style="font-size:14px;color:#6b5d4f;">Our journey designers will review your preferences and reach out within 24 hours to begin crafting your itinerary.</p>
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e8dcc4;font-family:monospace;font-size:11px;color:#9c8c7c;letter-spacing:0.1em;">
        Escora · Fort Kochi, Kerala 682001 · +91 8157 003 344
      </div>
    </div>
  `;
  await send(order.guestEmail, "Your Journey Enquiry — Escora Kerala", html);
}

export async function sendAdminBookingNotification(order: {
  id: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  travelStyle?: string | null;
  destinations?: string | null;
  travelDate?: string | null;
  guestCount?: number | null;
  budgetRange?: string | null;
}): Promise<void> {
  if (!ADMIN_EMAIL) return;
  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a1410;padding:32px;">
      <h1 style="font-weight:400;font-size:22px;margin:0 0 16px;">New Journey Enquiry #${order.id}</h1>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;border-bottom:1px solid #e8e8e8;color:#666;width:140px;">Name</td><td style="padding:8px 0;border-bottom:1px solid #e8e8e8;">${order.guestName}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #e8e8e8;color:#666;">Email</td><td style="padding:8px 0;border-bottom:1px solid #e8e8e8;"><a href="mailto:${order.guestEmail}">${order.guestEmail}</a></td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #e8e8e8;color:#666;">Phone</td><td style="padding:8px 0;border-bottom:1px solid #e8e8e8;"><a href="tel:${order.guestPhone}">${order.guestPhone}</a></td></tr>
        ${order.travelStyle ? `<tr><td style="padding:8px 0;border-bottom:1px solid #e8e8e8;color:#666;">Style</td><td style="padding:8px 0;border-bottom:1px solid #e8e8e8;">${order.travelStyle}</td></tr>` : ""}
        ${order.destinations ? `<tr><td style="padding:8px 0;border-bottom:1px solid #e8e8e8;color:#666;">Destinations</td><td style="padding:8px 0;border-bottom:1px solid #e8e8e8;">${order.destinations}</td></tr>` : ""}
        ${order.travelDate ? `<tr><td style="padding:8px 0;border-bottom:1px solid #e8e8e8;color:#666;">Travel Date</td><td style="padding:8px 0;border-bottom:1px solid #e8e8e8;">${order.travelDate}</td></tr>` : ""}
        ${order.guestCount ? `<tr><td style="padding:8px 0;border-bottom:1px solid #e8e8e8;color:#666;">Guests</td><td style="padding:8px 0;border-bottom:1px solid #e8e8e8;">${order.guestCount}</td></tr>` : ""}
        ${order.budgetRange ? `<tr><td style="padding:8px 0;color:#666;">Budget</td><td style="padding:8px 0;">${order.budgetRange}</td></tr>` : ""}
      </table>
    </div>
  `;
  await send(ADMIN_EMAIL, `New Enquiry: ${order.guestName} — Escora`, html);
}

export async function sendContactConfirmation(enquiry: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a1410;background:#faf9f7;padding:40px 32px;">
      <div style="font-family:monospace;font-size:11px;letter-spacing:0.2em;color:#cbab6e;text-transform:uppercase;margin-bottom:24px;">Escora · Kerala</div>
      <h1 style="font-weight:300;font-size:26px;margin:0 0 12px;">Hello, ${enquiry.name}.</h1>
      <p style="color:#6b5d4f;margin:0 0 28px;font-size:15px;">Thank you for reaching out. We've received your message and will reply within one business day.</p>
      <div style="background:#f0ece4;padding:20px 24px;border-left:3px solid #cbab6e;margin-bottom:32px;font-size:14px;color:#4a3d30;font-style:italic;">
        "${enquiry.message}"
      </div>
      <div style="margin-top:40px;font-family:monospace;font-size:11px;color:#9c8c7c;letter-spacing:0.1em;">
        Escora · Fort Kochi, Kerala 682001 · +91 8157 003 344
      </div>
    </div>
  `;
  await send(enquiry.email, "We've received your message — Escora", html);
}

export async function sendAdminContactNotification(enquiry: {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
}): Promise<void> {
  if (!ADMIN_EMAIL) return;
  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a1410;padding:32px;">
      <h1 style="font-weight:400;font-size:22px;margin:0 0 16px;">New Contact Message #${enquiry.id}</h1>
      <p><strong>From:</strong> ${enquiry.name} &lt;<a href="mailto:${enquiry.email}">${enquiry.email}</a>&gt;</p>
      ${enquiry.phone ? `<p><strong>Phone:</strong> ${enquiry.phone}</p>` : ""}
      <div style="background:#f5f5f5;padding:16px;margin-top:16px;font-size:14px;white-space:pre-wrap;">${enquiry.message}</div>
    </div>
  `;
  await send(ADMIN_EMAIL, `New Contact: ${enquiry.name} — Escora`, html);
}
