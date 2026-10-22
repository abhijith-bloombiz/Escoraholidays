import { CampaignModel, type ICampaign } from "@workspace/db";
import { config } from "../config/env";
import { logger } from "../lib/logger";
import { sendCampaign } from "./campaign-service";
import {
  processDueEmailNotifications,
  recoverStaleEmailNotifications,
} from "./notification-service";

let schedulerTimer: NodeJS.Timeout | null = null;
let isProcessing = false;

/**
 * Atomically claims and dispatches one due scheduled campaign.
 * Uses findOneAndUpdate to guarantee atomic claiming and eliminate double-sends
 * across concurrent server processes or cluster workers.
 */
export async function processDueScheduledCampaigns(): Promise<ICampaign | null> {
  const now = new Date();

  // Atomic claim: matches campaigns that:
  // 1. Have status "scheduled"
  // 2. scheduledAt <= now
  // Immediately transitions status to "sending" so no other worker can claim it.
  const claimed = await CampaignModel.findOneAndUpdate(
    {
      status: "scheduled",
      scheduledAt: { $lte: now },
    },
    {
      $set: { status: "sending", updatedAt: now },
    },
    { new: true }
  );

  if (!claimed) {
    return null;
  }

  logger.info(
    { campaignId: claimed.id, scheduledAt: claimed.scheduledAt },
    "[CampaignScheduler] Claimed due campaign for scheduled delivery"
  );

  try {
    const result = await sendCampaign(claimed.id, { alreadyClaimed: true });
    logger.info(
      { campaignId: claimed.id, sentCount: result.stats.sentCount },
      "[CampaignScheduler] Scheduled campaign dispatch completed successfully"
    );
    return result;
  } catch (err: any) {
    logger.error(
      { campaignId: claimed.id, err: err?.message },
      "[CampaignScheduler] Scheduled campaign dispatch failed; setting status to failed"
    );
    await CampaignModel.updateOne(
      { id: claimed.id },
      { $set: { status: "failed", updatedAt: new Date() } }
    );
    return null;
  }
}

/**
 * Recovers campaigns that were interrupted mid-flight (e.g. unexpected server restarts or crashes).
 * Detects campaigns stuck in "sending" and safely resumes dispatch without duplicate emails.
 */
export async function recoverStaleCampaigns(staleThresholdMs: number = 5 * 60 * 1000): Promise<number> {
  const cutoff = new Date(Date.now() - staleThresholdMs);

  const staleCampaigns = await CampaignModel.find({
    status: "sending",
    updatedAt: { $lte: cutoff },
  }).lean();

  if (staleCampaigns.length === 0) {
    return 0;
  }

  logger.warn(
    { count: staleCampaigns.length },
    "[CampaignScheduler] Detected interrupted/stale campaigns in 'sending' state. Initiating recovery."
  );

  let recoveredCount = 0;
  for (const c of staleCampaigns) {
    try {
      logger.info({ campaignId: c.id }, "[CampaignScheduler] Resuming interrupted campaign");
      await sendCampaign(c.id, { alreadyClaimed: true });
      recoveredCount++;
    } catch (err: any) {
      logger.error(
        { campaignId: c.id, err: err?.message },
        "[CampaignScheduler] Failed to recover stale campaign"
      );
    }
  }

  return recoveredCount;
}

/**
 * Scheduler tick handler. Executes atomic claiming and stale campaign recovery.
 */
export async function runSchedulerTick(): Promise<void> {
  if (isProcessing) {
    return;
  }

  isProcessing = true;
  try {
    // 1. Process due scheduled campaigns until none remain due
    let dueCampaign = await processDueScheduledCampaigns();
    while (dueCampaign) {
      dueCampaign = await processDueScheduledCampaigns();
    }

    // 2. Process due transactional and customer follow-up email notifications
    await processDueEmailNotifications();
  } catch (err: any) {
    logger.error({ err: err?.message }, "[CampaignScheduler] Error during scheduler tick");
  } finally {
    isProcessing = false;
  }
}

/**
 * Starts the background campaign scheduler loop.
 */
export function startCampaignScheduler(intervalMs?: number): void {
  if (schedulerTimer) {
    return;
  }

  const pollInterval = intervalMs ?? config.campaignSchedulerIntervalMs ?? 20000;

  logger.info(
    { pollIntervalMs: pollInterval },
    "[CampaignScheduler] Starting background campaign dispatch scheduler"
  );

  // Run immediate recovery for any campaigns or notifications interrupted prior to restart (threshold = 0)
  recoverStaleCampaigns(0).catch((err) => {
    logger.warn({ err: err?.message }, "[CampaignScheduler] Initial restart recovery error");
  });
  recoverStaleEmailNotifications(0).catch((err) => {
    logger.warn({ err: err?.message }, "[CampaignScheduler] Initial restart notification recovery error");
  });

  schedulerTimer = setInterval(() => {
    runSchedulerTick().catch((err) => {
      logger.error({ err: err?.message }, "[CampaignScheduler] Unhandled error in tick");
    });
  }, pollInterval);

  // Do not hold process alive if only the scheduler timer is pending
  if (schedulerTimer.unref) {
    schedulerTimer.unref();
  }
}

/**
 * Stops the background campaign scheduler cleanly.
 */
export function stopCampaignScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    logger.info("[CampaignScheduler] Stopped background campaign scheduler");
  }
}
