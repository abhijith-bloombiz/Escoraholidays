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
  isProduction: boolean;
  groqApiKey?: string;
  groqModel: string;
  groqBaseUrl?: string;
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
  emailFrom: process.env.EMAIL_FROM || "Escora Journeys <hello@escoraholidays.com>",
  adminEmail: process.env.ADMIN_EMAIL || "admin@escoraholidays.com",
  isProduction,
  groqApiKey: process.env.GROQ_API_KEY?.trim() || undefined,
  groqModel: process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
  groqBaseUrl: process.env.GROQ_BASE_URL?.trim() || undefined,
};

// Fail fast immediately on import if running under production environment
if (isProduction) {
  validateProductionConfig(config);
}
