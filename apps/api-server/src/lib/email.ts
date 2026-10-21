import nodemailer, { type Transporter } from "nodemailer";
import { Resend } from "resend";
import { logger } from "./logger";
import { config } from "../config/env";

let resendInstance: any = config.resendApiKey ? new Resend(config.resendApiKey) : null;
let gmailTransporter: Transporter | null = null;
let isForcedUnconfigured = false;
let isTestingResendClient = false;
const FROM = config.emailFrom || "onboarding@resend.dev";
const ADMIN_EMAIL = config.adminEmail;

export type EmailProviderType = "gmail" | "resend" | "mock";

/**
 * Resolves the currently active email dispatch provider based on environment variables.
 * Priority: Test client injection > Explicit EMAIL_PROVIDER > Gmail credentials present > Resend API key present > mock
 */
export function getEffectiveEmailProvider(): EmailProviderType {
  if (isForcedUnconfigured) return "mock";
  if (isTestingResendClient && resendInstance) return "resend";
  if (config.emailProvider === "gmail") return "gmail";
  if (config.emailProvider === "resend") return "resend";
  if (config.emailProvider === "mock") return "mock";

  // Auto mode: If GMAIL_APP_PASSWORD is set, prioritize genuine Gmail SMTP authentication
  if (config.gmailUser && config.gmailAppPassword && config.gmailAppPassword.trim().length > 0) {
    return "gmail";
  }
  if (config.resendApiKey && config.resendApiKey.trim().length > 0) {
    return "resend";
  }
  return "mock";
}

/**
 * Returns sender information formatted for headers and UI display.
 */
export function getAuthenticatedSender(): {
  email: string;
  name: string;
  fullFrom: string;
  provider: EmailProviderType;
  isConfigured: boolean;
} {
  const provider = getEffectiveEmailProvider();
  if (provider === "gmail" || config.emailProvider === "gmail" || Boolean(config.gmailAppPassword)) {
    const email = config.gmailUser || "arunopera7@gmail.com";
    const name = config.gmailFromName || "Escora Journeys";
    const isConfigured = Boolean(config.gmailUser && config.gmailAppPassword && config.gmailAppPassword.trim().length > 0);
    return {
      email,
      name,
      fullFrom: `"${name}" <${email}>`,
      provider: "gmail",
      isConfigured,
    };
  }

  const isConfigured = Boolean(config.resendApiKey && config.resendApiKey.trim().length > 0);
  return {
    email: config.emailFrom,
    name: "Escora Journeys",
    fullFrom: config.emailFrom || "onboarding@resend.dev",
    provider: isConfigured ? "resend" : "mock",
    isConfigured,
  };
}

export function getResendClient(): Resend | null {
  if (isForcedUnconfigured) return null;
  if (resendInstance) return resendInstance;
  if (config.resendApiKey) {
    resendInstance = new Resend(config.resendApiKey);
    return resendInstance;
  }
  return null;
}

export function getGmailTransporter(): Transporter | null {
  if (isForcedUnconfigured) return null;
  if (gmailTransporter) return gmailTransporter;
  if (config.gmailUser && config.gmailAppPassword && config.gmailAppPassword.trim().length > 0) {
    gmailTransporter = nodemailer.createTransport({
      host: config.gmailSmtpHost || "smtp.gmail.com",
      port: config.gmailSmtpPort || 465,
      secure: (config.gmailSmtpPort || 465) === 465, // true for 465 SSL, false for 587 STARTTLS
      auth: {
        user: config.gmailUser,
        pass: config.gmailAppPassword.replace(/\s+/g, ""), // Strip whitespace commonly copied from Google 2FA screen
      },
    });
    return gmailTransporter;
  }
  return null;
}

export function setResendClientForTesting(client: any): void {
  if (client === null) {
    isForcedUnconfigured = true;
    isTestingResendClient = false;
    resendInstance = null;
    gmailTransporter = null;
  } else {
    isForcedUnconfigured = false;
    isTestingResendClient = true;
    resendInstance = client;
  }
}

/**
 * Validates connection to the active email provider without sending mail.
 */
export async function verifyEmailTransport(): Promise<{
  success: boolean;
  provider: EmailProviderType;
  message: string;
}> {
  const provider = getEffectiveEmailProvider();
  if (provider === "gmail") {
    const transporter = getGmailTransporter();
    if (!transporter) {
      return {
        success: false,
        provider: "gmail",
        message: "Gmail SMTP credentials not configured. Please set GMAIL_APP_PASSWORD in environment variables.",
      };
    }
    try {
      await transporter.verify();
      return {
        success: true,
        provider: "gmail",
        message: `Successfully authenticated with Gmail SMTP server for ${config.gmailUser}`,
      };
    } catch (err: any) {
      let msg = sanitizeError(err?.message || "Gmail verification failed");
      if (err?.code === "EAUTH" || err?.responseCode === 535) {
        msg = `Gmail SMTP authentication failed for ${config.gmailUser}. Please verify your 16-character Google App Password in .env.`;
      }
      return { success: false, provider: "gmail", message: msg };
    }
  }

  if (provider === "resend") {
    if (!config.resendApiKey) {
      return { success: false, provider: "resend", message: "RESEND_API_KEY is not configured" };
    }
    return { success: true, provider: "resend", message: "Resend API key configured" };
  }

  return { success: false, provider: "mock", message: "No live email provider is configured" };
}

function sanitizeError(msg?: string): string {
  if (!msg) return "Unknown delivery error";
  return msg
    .replace(/re_[a-zA-Z0-9_\-\.]+/g, "[REDACTED_API_KEY]")
    .replace(/whsec_[a-zA-Z0-9_\-\.]+/g, "[REDACTED_SECRET]")
    .replace(/[a-zA-Z0-9]{16}/g, (match) => (match.length === 16 ? "[REDACTED_APP_PASSWORD]" : match));
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
  await sendEmailWithStatus({ to, subject, html });
}

export interface EmailSendResult {
  success: boolean;
  status: "accepted" | "simulated" | "delivered" | "failed";
  messageId?: string;
  error?: string;
  provider: EmailProviderType;
  from?: string;
  isTransient?: boolean;
  smtpResponse?: string;
  providerResponse?: string;
  acceptedRecipients?: string[];
  rejectedRecipients?: string[];
  sentAt?: Date;
}

/**
 * Sends an email via either Gmail SMTP or Resend, returning detailed delivery status for audit and tracking.
 * Includes official Google SMTP authentication, Resend fallback, custom headers,
 * idempotency keys, secret sanitization, and transient error retry logic.
 */
export function htmlToPlainText(html: string): string {
  if (!html) return "";
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s+\n/g, "\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function sendEmailWithStatus(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  headers?: Record<string, string>;
  idempotencyKey?: string;
  retries?: number;
}): Promise<EmailSendResult> {
  const provider = getEffectiveEmailProvider();
  const sender = getAuthenticatedSender();
  const fromAddress = options.from || sender.fullFrom;
  const maxAttempts = options.retries ?? 2;
  const textContent = options.text || htmlToPlainText(options.html);

  // -------------------------------------------------------------
  // PROVIDER 0: MOCK / SIMULATION MODE
  // -------------------------------------------------------------
  if (provider === "mock") {
    const mockId = `simulated_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    logger.info({ to: options.to, mockId }, "[Email] Simulation mode dispatch (no live email sent)");
    return {
      success: true,
      status: "simulated",
      messageId: mockId,
      provider: "mock",
      from: fromAddress,
      providerResponse: "Mock provider simulation (zero network transmission)",
      acceptedRecipients: [options.to],
      rejectedRecipients: [],
      sentAt: new Date(),
    };
  }

  // -------------------------------------------------------------
  // PROVIDER 1: GMAIL SMTP (GENUINE GOOGLE ACCOUNT AUTHENTICATION)
  // -------------------------------------------------------------
  if (provider === "gmail" || config.emailProvider === "gmail") {
    const transporter = getGmailTransporter();
    if (!transporter) {
      return {
        success: false,
        status: "failed",
        provider: "gmail",
        error: `Gmail credentials missing. Please set GMAIL_APP_PASSWORD in your environment variables for ${config.gmailUser}.`,
      };
    }

    const customHeaders: Record<string, string> = { ...(options.headers || {}) };
    if (options.idempotencyKey) {
      customHeaders["X-Idempotency-Key"] = options.idempotencyKey;
    }

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const info = await transporter.sendMail({
          from: fromAddress,
          to: options.to,
          subject: options.subject,
          text: textContent,
          html: options.html,
          headers: Object.keys(customHeaders).length > 0 ? customHeaders : undefined,
        });

        const accepted = (info.accepted || []).map((r: any) => String(r?.address || r));
        const rejected = (info.rejected || []).map((r: any) => String(r?.address || r));

        if (rejected.length > 0 && accepted.length === 0) {
          logger.warn(
            { to: options.to, response: info.response, rejected },
            "Gmail SMTP relay rejected recipient address"
          );
          return {
            success: false,
            status: "failed",
            error: `Gmail SMTP relay rejected recipient: ${rejected.join(", ")}. Response: ${info.response || "No response details"}`,
            provider: "gmail",
            from: fromAddress,
            smtpResponse: info.response,
            providerResponse: info.response,
            acceptedRecipients: accepted,
            rejectedRecipients: rejected,
            sentAt: new Date(),
          };
        }

        logger.info(
          { messageId: info.messageId, to: options.to, from: fromAddress, response: info.response },
          "Email accepted by Gmail SMTP relay (inbox delivery unconfirmed)"
        );
        return {
          success: true,
          status: "accepted",
          messageId: info.messageId,
          provider: "gmail",
          from: fromAddress,
          smtpResponse: info.response,
          providerResponse: info.response,
          acceptedRecipients: accepted,
          rejectedRecipients: rejected,
          sentAt: new Date(),
        };
      } catch (err: any) {
        let cleanMsg = sanitizeError(err?.message || "Delivery error via Gmail SMTP");
        if (err?.code === "EAUTH" || err?.responseCode === 535) {
          cleanMsg = `Gmail authentication failed for ${config.gmailUser}. Ensure 2-Step Verification is active and your Google App Password is correct.`;
          return { success: false, status: "failed", error: cleanMsg, provider: "gmail", from: fromAddress, isTransient: false };
        }

        const isTransient = isTransientError(cleanMsg);
        if (isTransient && attempt < maxAttempts) {
          logger.warn(
            { attempt, error: cleanMsg },
            "Transient network error via Gmail SMTP. Retrying delivery..."
          );
          await new Promise((resolve) => setTimeout(resolve, attempt * 500));
          continue;
        }

        logger.warn({ error: cleanMsg, to: options.to }, "Email send failed via Gmail SMTP");
        return { success: false, status: "failed", error: cleanMsg, provider: "gmail", from: fromAddress, isTransient };
      }
    }

    return {
      success: false,
      status: "failed",
      error: "Maximum delivery retry attempts exceeded on Gmail SMTP",
      provider: "gmail",
      from: fromAddress,
      isTransient: true,
    };
  }

  // -------------------------------------------------------------
  // PROVIDER 2: RESEND (DOMAIN / ONBOARDING INTEGRATION)
  // -------------------------------------------------------------
  const client = getResendClient();
  if (!client) {
    return {
      success: false,
      status: "failed",
      provider: "mock",
      error: "No email provider is configured. Please configure GMAIL_USER and GMAIL_APP_PASSWORD, or RESEND_API_KEY in your environment.",
    };
  }

  const customHeaders: Record<string, string> = { ...(options.headers || {}) };
  if (options.idempotencyKey) {
    customHeaders["Idempotency-Key"] = options.idempotencyKey;
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { data, error } = await client.emails.send({
        from: FROM,
        to: options.to,
        subject: options.subject,
        text: textContent,
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
            text: textContent,
            html: options.html,
            headers: Object.keys(customHeaders).length > 0 ? customHeaders : undefined,
          });

          if (!fallback.error && fallback.data) {
            return {
              success: true,
              status: "accepted",
              messageId: fallback.data.id,
              provider: "resend",
              from: "onboarding@resend.dev",
              providerResponse: "Accepted by Resend API via fallback address",
              acceptedRecipients: [options.to],
              rejectedRecipients: [],
              sentAt: new Date(),
            };
          }
          const cleanMsg = sanitizeError(fallback.error?.message || "Delivery failed");
          return { success: false, status: "failed", error: cleanMsg, provider: "resend", isTransient: isTransientError(cleanMsg) };
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

        return { success: false, status: "failed", error: cleanMsg, provider: "resend", isTransient };
      }

      return {
        success: true,
        status: "accepted",
        messageId: data?.id,
        provider: "resend",
        from: FROM,
        providerResponse: "Accepted by Resend API for delivery (inbox delivery unconfirmed)",
        acceptedRecipients: [options.to],
        rejectedRecipients: [],
        sentAt: new Date(),
      };
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

      return { success: false, status: "failed", error: cleanMsg, provider: "resend", isTransient };
    }
  }

  return { success: false, status: "failed", error: "Maximum delivery retry attempts exceeded", provider: "resend", isTransient: true };
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
