import app from "./app";
import { config, validateProductionConfig } from "./config/env";
import { logger } from "./lib/logger";
import { connectDB, disconnectDB } from "@workspace/db";
import { startCampaignScheduler, stopCampaignScheduler } from "./services/campaign-scheduler";
import { migrateLegacyCampaignApprovalStates } from "./services/campaign-service";

async function bootstrap() {
  validateProductionConfig(config);

  if (!config.isProduction) {
    logger.info("Dev Notice: Running in local development mode with standard dev defaults.");
  }

  try {
    await connectDB();
    logger.info("Connected to MongoDB successfully");

    // Automatically migrate any legacy pending_approval/approved/rejected campaigns safely to draft
    await migrateLegacyCampaignApprovalStates().catch((err) => {
      logger.warn({ err: err?.message }, "[Migration] Legacy campaign approval state migration failed");
    });

    // Start reliable background campaign scheduler
    startCampaignScheduler();
  } catch (err) {
    logger.error({ err }, "Initial database connection failed; will retry on incoming requests");
  }

  const server = app.listen(config.port, () => {
    logger.info({ port: config.port, env: config.env }, "Escora Holidays API Server started");
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down HTTP server...");
    stopCampaignScheduler();
    server.close(async () => {
      logger.info("HTTP server closed");
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((err) => {
  logger.fatal({ err: err instanceof Error ? err.message : String(err) }, "Fatal error during server startup");
  process.exit(1);
});

