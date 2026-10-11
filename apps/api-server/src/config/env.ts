import path from "node:path";

export interface AppConfig {
  env: "development" | "production" | "test";
  port: number;
  publicUrl: string;
  mongoUri: string;
  sessionSecret: string;
  resendApiKey?: string;
  emailFrom: string;
  adminEmail: string;
  isProduction: boolean;
}

const nodeEnv = (process.env.NODE_ENV || "development") as "development" | "production" | "test";
const rawPort = process.env.PORT || "8080";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

export const config: AppConfig = {
  env: nodeEnv,
  port,
  publicUrl: process.env.PUBLIC_URL || "https://www.escoraholidays.com",
  mongoUri: process.env.MONGODB_URI || process.env.DATABASE_URL || "mongodb://localhost:27017/escora_dev",
  sessionSecret: process.env.SESSION_SECRET || "escora-dev-secret-change-in-prod",
  resendApiKey: process.env.RESEND_API_KEY || undefined,
  emailFrom: process.env.EMAIL_FROM || "Escora Journeys <hello@escoraholidays.com>",
  adminEmail: process.env.ADMIN_EMAIL || "admin@escoraholidays.com",
  isProduction: nodeEnv === "production",
};
