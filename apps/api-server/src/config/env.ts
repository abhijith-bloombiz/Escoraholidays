import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { isValidPasswordHash } from "../lib/auth-crypto";

const nodeEnv = (process.env.NODE_ENV || "development") as "development" | "production" | "test";
const isProduction = nodeEnv === "production";

// In local development, ensure .env is loaded if Node was launched without CLI env flags
if (!isProduction && typeof process.loadEnvFile === "function") {
  const currentDir = typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));
  const candidateEnvPaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env"),
    path.resolve(currentDir, "../../.env"),
    path.resolve(currentDir, "../../../.env"),
  ];

  for (const envPath of candidateEnvPaths) {
    try {
      if (fs.existsSync(envPath)) {
        process.loadEnvFile(envPath);
      }
    } catch {
      // Ignore unreadable or duplicate env files
    }
  }
}

export interface AppConfig {
  env: "development" | "production" | "test";
  port: number;
  publicUrl: string;
  mongoUri: string;
  sessionSecret: string;
  adminUsername: string;
  adminPasswordHash: string;
  adminPassword: string;
  allowedOrigins: string[];
  resendApiKey?: string;
  emailFrom: string;
  adminEmail: string;
  // Gmail SMTP / Authenticated Email Configuration
  emailProvider: "auto" | "gmail" | "resend";
  gmailUser: string;
  gmailAppPassword?: string;
  gmailFromName: string;
  gmailSmtpHost: string;
  gmailSmtpPort: number;
  isProduction: boolean;
  groqApiKey?: string;
  groqModel: string;
  groqBaseUrl?: string;
  unsplashAccessKey?: string;
  pexelsApiKey?: string;
  campaignSendingEnabled: boolean;
  resendWebhookSecret?: string;
  campaignSchedulerIntervalMs: number;
  transactionalSendingEnabled: boolean;
  enquiryFollowupDelayHours: number;
  postTripFeedbackDelayHours: number;
  feedbackReviewUrl: string;
  enableEnquiryFollowup: boolean;
  enablePostTripFeedback: boolean;
  enableBookingConfirmation: boolean;
  enableItineraryUpdateNotifications: boolean;
  enablePaymentReceipts: boolean;
  enablePaymentReminders: boolean;
  enablePreTripReminders: boolean;
  enableCancellationNotifications: boolean;
  enableDocumentDelivery: boolean;
  // WhatsApp Automation Configuration
  whatsappProvider: "mock" | "cloud_api";
  whatsappLiveSendingEnabled: boolean;
  whatsappApiToken?: string;
  whatsappPhoneNumberId?: string;
  whatsappBusinessAccountId?: string;
  whatsappWebhookVerifyToken?: string;
  whatsappAppSecret?: string;
  whatsappGraphApiVersion: string;
  whatsappTestPhoneNumber?: string;
  enableWhatsappEnquiryAcknowledgement: boolean;
  enableWhatsappBookingConfirmation: boolean;
  enableWhatsappItineraryUpdates: boolean;
  enableWhatsappPaymentReceipts: boolean;
  enableWhatsappPaymentReminders: boolean;
  enableWhatsappPreTripReminders: boolean;
  enableWhatsappPostTripFeedback: boolean;
  enableWhatsappDocumentDelivery: boolean;
  whatsappSimulateAutoDeliver: boolean;
  maintenanceMode: boolean;
  railwayVolumeMountPath?: string;
  uploadsDir?: string;
}

const rawPort = process.env.PORT || "8080";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const rawAllowedOrigins = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || "";
const allowedOrigins = rawAllowedOrigins
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Resolve username from ADMIN_USER or legacy ADMIN_USERNAME
const rawAdminUsername = process.env.ADMIN_USER || process.env.ADMIN_USERNAME || "";
const adminUsername = rawAdminUsername.trim() || (!isProduction ? "Admin" : "");

// Password hash (must be canonical scrypt format in production)
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH?.trim() || "";

// Plaintext password is strictly disabled in production
const adminPassword = !isProduction ? (process.env.ADMIN_PASSWORD || "Admin") : "";

// Session secret
const rawSessionSecret = process.env.SESSION_SECRET || "";
const sessionSecret = rawSessionSecret || (!isProduction ? "escora-dev-secret-change-in-prod" : "");

// MongoDB URI
const rawMongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL || "";
const mongoUri = rawMongoUri || (!isProduction ? "mongodb://localhost:27017/escora_dev" : "");

const KNOWN_DEV_SECRETS = new Set([
  "escora-dev-secret-change-in-prod",
  "secret",
  "changeme",
  "development",
  "keyboard cat",
  "supersecret",
  "12345678",
  "password",
]);

/**
 * Validates that all mandatory production environment variables and security secrets
 * are present, well-formed, and meet entropy standards.
 * Fails fast before the server starts or accepts incoming HTTP requests.
 * Never logs or exposes secret values.
 */
export function validateProductionConfig(cfg: AppConfig = config): void {
  if (!cfg.isProduction) {
    return;
  }

  // 1. ADMIN_USER validation
  if (!cfg.adminUsername || cfg.adminUsername.trim().length < 3) {
    throw new Error(
      "Production configuration error: ADMIN_USER is missing or invalid. A non-empty username of at least 3 characters is required."
    );
  }

  // 2. ADMIN_PASSWORD_HASH validation
  if (!cfg.adminPasswordHash) {
    throw new Error(
      "Production configuration error: ADMIN_PASSWORD_HASH is missing. In production, a secure scrypt password hash is required."
    );
  }
  if (!isValidPasswordHash(cfg.adminPasswordHash)) {
    throw new Error(
      "Production configuration error: ADMIN_PASSWORD_HASH is malformed or uses an unsupported hash format. Expected format: 'scrypt$<saltHex:32>$<derivedKeyHex:128>'."
    );
  }

  // 3. SESSION_SECRET validation
  if (!cfg.sessionSecret) {
    throw new Error(
      "Production configuration error: SESSION_SECRET is missing. A cryptographically secure secret is required."
    );
  }
  if (cfg.sessionSecret.length < 32) {
    throw new Error(
      "Production configuration error: SESSION_SECRET is too short. Must be at least 32 characters in production."
    );
  }
  if (KNOWN_DEV_SECRETS.has(cfg.sessionSecret.toLowerCase())) {
    throw new Error(
      "Production configuration error: SESSION_SECRET is set to an insecure development default. Provide a unique, high-entropy secret in production."
    );
  }

  // 4. MONGODB_URI validation
  if (!cfg.mongoUri) {
    throw new Error(
      "Production configuration error: MONGODB_URI is missing. A valid MongoDB connection string is required."
    );
  }
  if (!cfg.mongoUri.startsWith("mongodb://") && !cfg.mongoUri.startsWith("mongodb+srv://")) {
    throw new Error(
      "Production configuration error: MONGODB_URI is invalid. Connection string must start with 'mongodb://' or 'mongodb+srv://'."
    );
  }
}

/**
 * Validates WhatsApp configuration when real Meta Cloud API delivery is explicitly active.
 * Ensures server fails safely at startup if required credentials or security secrets are missing.
 * Never leaks token or secret values in error messages.
 */
export function validateWhatsAppConfig(cfg: AppConfig = config): void {
  // If explicitly configured for Meta Cloud API with live sending enabled:
  if (cfg.whatsappProvider === "cloud_api" && cfg.whatsappLiveSendingEnabled) {
    if (!cfg.whatsappApiToken || cfg.whatsappApiToken.trim().length < 10) {
      throw new Error(
        "WhatsApp configuration error: WHATSAPP_LIVE_SENDING_ENABLED=true with WHATSAPP_PROVIDER=cloud_api requires a valid WHATSAPP_API_TOKEN. Set this in your environment or use WHATSAPP_PROVIDER=mock for safe simulation."
      );
    }
    if (!cfg.whatsappPhoneNumberId || cfg.whatsappPhoneNumberId.trim().length < 5) {
      throw new Error(
        "WhatsApp configuration error: WHATSAPP_LIVE_SENDING_ENABLED=true with WHATSAPP_PROVIDER=cloud_api requires a valid WHATSAPP_PHONE_NUMBER_ID. Set this in your environment or use WHATSAPP_PROVIDER=mock for safe simulation."
      );
    }
  }

  // If running in production with cloud_api provider, webhook verification and HMAC signing secrets are mandatory
  if (cfg.isProduction && cfg.whatsappProvider === "cloud_api") {
    if (!cfg.whatsappWebhookVerifyToken || cfg.whatsappWebhookVerifyToken.trim().length < 8) {
      throw new Error(
        "WhatsApp configuration error: In production with WHATSAPP_PROVIDER=cloud_api, WHATSAPP_WEBHOOK_VERIFY_TOKEN is required for webhook handshake verification."
      );
    }
    if (!cfg.whatsappAppSecret || cfg.whatsappAppSecret.trim().length < 16) {
      throw new Error(
        "WhatsApp configuration error: In production with WHATSAPP_PROVIDER=cloud_api, WHATSAPP_APP_SECRET is required for x-hub-signature-256 HMAC verification."
      );
    }
  }
}

export const config: AppConfig = {
  env: nodeEnv,
  port,
  publicUrl: process.env.PUBLIC_URL || "https://www.escoraholidays.com",
  mongoUri,
  sessionSecret,
  adminUsername,
  adminPasswordHash,
  adminPassword,
  allowedOrigins,
  resendApiKey: process.env.RESEND_API_KEY || undefined,
  emailFrom: process.env.EMAIL_FROM || "Escora Journeys <admin@escoraholidays.com>",
  adminEmail: process.env.ADMIN_EMAIL || "admin@escoraholidays.com",
  // Gmail SMTP / Authenticated Email Configuration
  emailProvider: process.env.EMAIL_PROVIDER === "gmail" ? "gmail" : process.env.EMAIL_PROVIDER === "resend" ? "resend" : "auto",
  gmailUser: process.env.GMAIL_USER?.trim() || "arunopera7@gmail.com",
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD?.trim() || undefined,
  gmailFromName: process.env.GMAIL_FROM_NAME?.trim() || "Escora Journeys",
  gmailSmtpHost: process.env.GMAIL_SMTP_HOST?.trim() || "smtp.gmail.com",
  gmailSmtpPort: Number(process.env.GMAIL_SMTP_PORT) || 465,
  isProduction,
  groqApiKey: process.env.GROQ_API_KEY?.trim() || undefined,
  groqModel: process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
  groqBaseUrl: process.env.GROQ_BASE_URL?.trim() || undefined,
  unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY?.trim() || undefined,
  pexelsApiKey: process.env.PEXELS_API_KEY?.trim() || undefined,
  campaignSendingEnabled: process.env.CAMPAIGN_SENDING_ENABLED === "true",
  resendWebhookSecret: process.env.RESEND_WEBHOOK_SECRET || undefined,
  campaignSchedulerIntervalMs: Number(process.env.CAMPAIGN_SCHEDULER_INTERVAL_MS) || 20000,
  transactionalSendingEnabled:
    process.env.TRANSACTIONAL_SENDING_ENABLED === "true" ||
    (process.env.NODE_ENV === "production" && Boolean(process.env.RESEND_API_KEY)),
  enquiryFollowupDelayHours: Number(process.env.ENQUIRY_FOLLOWUP_DELAY_HOURS) || 24,
  postTripFeedbackDelayHours: Number(process.env.POST_TRIP_FEEDBACK_DELAY_HOURS) || 24,
  feedbackReviewUrl:
    process.env.FEEDBACK_REVIEW_URL ||
    `${process.env.PUBLIC_URL || "https://www.escoraholidays.com"}/contact`,
  enableEnquiryFollowup: process.env.ENABLE_ENQUIRY_FOLLOWUP !== "false",
  enablePostTripFeedback: process.env.ENABLE_POST_TRIP_FEEDBACK !== "false",
  enableBookingConfirmation: process.env.ENABLE_BOOKING_CONFIRMATION !== "false",
  enableItineraryUpdateNotifications: process.env.ENABLE_ITINERARY_UPDATE_NOTIFICATIONS !== "false",
  enablePaymentReceipts: process.env.ENABLE_PAYMENT_RECEIPTS !== "false",
  enablePaymentReminders: process.env.ENABLE_PAYMENT_REMINDERS !== "false",
  enablePreTripReminders: process.env.ENABLE_PRE_TRIP_REMINDERS !== "false",
  enableCancellationNotifications: process.env.ENABLE_CANCELLATION_NOTIFICATIONS !== "false",
  enableDocumentDelivery: process.env.ENABLE_DOCUMENT_DELIVERY !== "false",
  // WhatsApp Automation Defaults
  whatsappProvider: (process.env.WHATSAPP_PROVIDER === "cloud_api" ? "cloud_api" : "mock"),
  whatsappLiveSendingEnabled: process.env.WHATSAPP_LIVE_SENDING_ENABLED === "true",
  whatsappApiToken: process.env.WHATSAPP_API_TOKEN?.trim() || undefined,
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || undefined,
  whatsappBusinessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim() || undefined,
  whatsappWebhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim() || undefined,
  whatsappAppSecret: process.env.WHATSAPP_APP_SECRET?.trim() || undefined,
  whatsappGraphApiVersion: process.env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v20.0",
  whatsappTestPhoneNumber: process.env.WHATSAPP_TEST_PHONE_NUMBER?.trim() || undefined,
  enableWhatsappEnquiryAcknowledgement: process.env.ENABLE_WHATSAPP_ENQUIRY_ACKNOWLEDGEMENT !== "false",
  enableWhatsappBookingConfirmation: process.env.ENABLE_WHATSAPP_BOOKING_CONFIRMATION !== "false",
  enableWhatsappItineraryUpdates: process.env.ENABLE_WHATSAPP_ITINERARY_UPDATES !== "false",
  enableWhatsappPaymentReceipts: process.env.ENABLE_WHATSAPP_PAYMENT_RECEIPTS !== "false",
  enableWhatsappPaymentReminders: process.env.ENABLE_WHATSAPP_PAYMENT_REMINDERS !== "false",
  enableWhatsappPreTripReminders: process.env.ENABLE_WHATSAPP_PRE_TRIP_REMINDERS !== "false",
  enableWhatsappPostTripFeedback: process.env.ENABLE_WHATSAPP_POST_TRIP_FEEDBACK !== "false",
  enableWhatsappDocumentDelivery: process.env.ENABLE_WHATSAPP_DOCUMENT_DELIVERY !== "false",
  whatsappSimulateAutoDeliver: process.env.WHATSAPP_SIMULATE_AUTO_DELIVER !== "false",
  maintenanceMode: process.env.MAINTENANCE_MODE !== "false",
  railwayVolumeMountPath: process.env.RAILWAY_VOLUME_MOUNT_PATH?.trim() || undefined,
  uploadsDir: process.env.UPLOADS_DIR?.trim() || undefined,
};

// Fail fast immediately on import if running under production environment
if (isProduction) {
  validateProductionConfig(config);
}
validateWhatsAppConfig(config);
