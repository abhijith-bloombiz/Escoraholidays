import crypto from "node:crypto";
import {
  CampaignModel,
  SubscriberConsentModel,
  EnquiryModel,
  OrderModel,
  AudienceGroupModel,
  getNextSequence,
  type ICampaign,
  type IAudienceGroup,
  type CampaignAudienceType,
  type CampaignStatus,
} from "@workspace/db";
import { config } from "../config/env";
import { sendEmailWithStatus } from "../lib/email";
import { logger } from "../lib/logger";

export interface RecipientAudienceItem {
  name: string;
  email: string;
  source: string;
  isSubscribed: boolean;
  token: string;
  destination?: string;
  travelStyle?: string;
}

export class CampaignError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code: string = "CAMPAIGN_ERROR"
  ) {
    super(message);
    this.name = "CampaignError";
  }
}

/**
 * Resolves the target recipient list for a campaign, deduplicating contacts
 * and cross-referencing with verified subscriber consent status.
 */
export async function resolveAudience(targetAudience: {
  type: CampaignAudienceType;
  destinations?: string[];
  travelStyle?: string | null;
  groupId?: number | null;
  groupIds?: number[];
}): Promise<{
  eligible: RecipientAudienceItem[];
  activeSubscribers: number;
  unsubscribedCount: number;
}> {
  const emailMap = new Map<
    string,
    { name: string; email: string; source: string; destination?: string; travelStyle?: string }
  >();

  // 1. Collect from Enquiries if applicable
  if (targetAudience.type === "all_contacts" || targetAudience.type === "enquiries_only") {
    const enquiries = await EnquiryModel.find().lean();
    for (const eq of enquiries) {
      const email = (eq.email || "").trim().toLowerCase();
      if (!email || !email.includes("@")) continue;
      if (!emailMap.has(email)) {
        emailMap.set(email, {
          name: (eq.name || "Valued Traveler").trim(),
          email,
          source: "enquiry",
        });
      }
    }
  }

  // 2. Collect from Orders if applicable
  if (
    targetAudience.type === "all_contacts" ||
    targetAudience.type === "confirmed_guests" ||
    targetAudience.type === "custom_segment"
  ) {
    const orderQuery: any = {};
    if (targetAudience.type === "confirmed_guests") {
      orderQuery.status = { $in: ["confirmed", "completed"] };
    }
    if (targetAudience.travelStyle) {
      orderQuery.travelStyle = targetAudience.travelStyle;
    }

    const orders = await OrderModel.find(orderQuery).lean();
    for (const ord of orders) {
      const email = (ord.guestEmail || "").trim().toLowerCase();
      if (!email || !email.includes("@")) continue;

      // Filter by destination if requested in custom segment
      if (
        targetAudience.destinations &&
        targetAudience.destinations.length > 0 &&
        ord.destinations
      ) {
        const ordDests = ord.destinations.toLowerCase();
        const matchesDest = targetAudience.destinations.some((d) =>
          ordDests.includes(d.toLowerCase())
        );
        if (!matchesDest) continue;
      }

      if (!emailMap.has(email)) {
        emailMap.set(email, {
          name: (ord.guestName || "Valued Guest").trim(),
          email,
          source: ord.status === "confirmed" || ord.status === "completed" ? "guest" : "order",
          destination: ord.destinations || undefined,
          travelStyle: ord.travelStyle || undefined,
        });
      }
    }
  }

  // 3. Collect from Audience Groups if specified
  if (
    targetAudience.type === "audience_group" ||
    targetAudience.groupId ||
    (targetAudience.groupIds && targetAudience.groupIds.length > 0)
  ) {
    const groupIds: number[] = [];
    if (targetAudience.groupId) groupIds.push(targetAudience.groupId);
    if (Array.isArray(targetAudience.groupIds)) {
      groupIds.push(...targetAudience.groupIds);
    }

    const groupFilter: any = { isArchived: { $ne: true } };
    if (groupIds.length > 0) {
      groupFilter.id = { $in: groupIds };
    }

    const groups = await AudienceGroupModel.find(groupFilter).lean();

    for (const group of groups) {
      if (group.type === "manual" && Array.isArray(group.members)) {
        for (const m of group.members) {
          const email = (m.email || "").trim().toLowerCase();
          if (!email || !email.includes("@")) continue;
          if (!emailMap.has(email)) {
            emailMap.set(email, {
              name: (m.name || "Valued Traveler").trim(),
              email,
              source: `group:${group.name}`,
            });
          }
        }
      } else if (group.type === "dynamic" && group.rules) {
        const rules = group.rules;

        // Dynamic enquiry rules
        if (
          !rules.customerStatus ||
          rules.customerStatus.length === 0 ||
          rules.customerStatus.includes("enquiry")
        ) {
          const eqQuery: any = {};
          if (rules.inactiveDays && rules.inactiveDays > 0) {
            const cutoff = new Date(Date.now() - rules.inactiveDays * 24 * 60 * 60 * 1000);
            eqQuery.createdAt = { $lte: cutoff };
          }
          const enquiries = await EnquiryModel.find(eqQuery).lean();
          for (const eq of enquiries) {
            const email = (eq.email || "").trim().toLowerCase();
            if (!email || !email.includes("@")) continue;
            if (!emailMap.has(email)) {
              emailMap.set(email, {
                name: (eq.name || "Valued Traveler").trim(),
                email,
                source: `dynamic:${group.name}`,
              });
            }
          }
        }

        // Dynamic order rules
        const ordQuery: any = {};
        if (rules.customerStatus && rules.customerStatus.length > 0) {
          const orderStatuses = rules.customerStatus.filter((s: string) => s !== "enquiry");
          if (orderStatuses.length > 0) {
            ordQuery.status = { $in: orderStatuses };
          }
        }
        if (rules.travelStyle) {
          ordQuery.travelStyle = rules.travelStyle;
        }
        if (rules.inactiveDays && rules.inactiveDays > 0) {
          const cutoff = new Date(Date.now() - rules.inactiveDays * 24 * 60 * 60 * 1000);
          ordQuery.createdAt = { $lte: cutoff };
        }

        const orders = await OrderModel.find(ordQuery).lean();
        for (const ord of orders) {
          const email = (ord.guestEmail || "").trim().toLowerCase();
          if (!email || !email.includes("@")) continue;

          if (rules.destinations && rules.destinations.length > 0 && ord.destinations) {
            const ordDests = ord.destinations.toLowerCase();
            const matchesDest = rules.destinations.some((d) =>
              ordDests.includes(d.toLowerCase())
            );
            if (!matchesDest) continue;
          }

          if (!emailMap.has(email)) {
            emailMap.set(email, {
              name: (ord.guestName || "Valued Guest").trim(),
              email,
              source: `dynamic:${group.name}`,
              destination: ord.destinations || undefined,
              travelStyle: ord.travelStyle || undefined,
            });
          }
        }
      }
    }
  }

  // 4. Query consent records for all gathered emails
  const emails = Array.from(emailMap.keys());
  const consentRecords = await SubscriberConsentModel.find({
    email: { $in: emails },
  }).lean();

  const consentMap = new Map<string, { subscribed: boolean; token: string }>();
  for (const c of consentRecords) {
    consentMap.set(c.email.toLowerCase(), {
      subscribed: c.subscribed,
      token: c.token,
    });
  }

  // 4. Build eligible list with tokens (auto-creating consent tokens for newly seen contacts)
  const eligible: RecipientAudienceItem[] = [];
  let activeSubscribers = 0;
  let unsubscribedCount = 0;

  for (const [email, info] of emailMap.entries()) {
    let consent = consentMap.get(email);
    if (!consent) {
      // Create new consent record
      const newToken = crypto.randomBytes(24).toString("hex");
      try {
        await SubscriberConsentModel.create({
          email,
          name: info.name,
          subscribed: true,
          token: newToken,
          source: info.source,
        });
        consent = { subscribed: true, token: newToken };
      } catch {
        // If raced, re-query
        const existing = await SubscriberConsentModel.findOne({ email }).lean();
        consent = {
          subscribed: existing?.subscribed ?? true,
          token: existing?.token || newToken,
        };
      }
    }

    const isSubscribed = consent.subscribed;
    if (isSubscribed) {
      activeSubscribers++;
    } else {
      unsubscribedCount++;
    }

    eligible.push({
      ...info,
      isSubscribed,
      token: consent.token,
    });
  }

  return { eligible, activeSubscribers, unsubscribedCount };
}

/**
 * Interpolates template variables with personalization and ensures CAN-SPAM / GDPR
 * compliance by appending a verified unsubscribe link and physical company address.
 */
export function renderTemplate(
  templateHtml: string,
  recipient: { name: string; email: string; destination?: string; token: string },
  baseUrl = config.publicUrl
): string {
  const unsubscribeUrl = `${baseUrl.replace(/\/$/, "")}/api/campaigns/unsubscribe?token=${recipient.token}&email=${encodeURIComponent(recipient.email)}`;
  const year = new Date().getFullYear().toString();

  let rendered = templateHtml
    .replace(/\{\{\s*name\s*\}\}/gi, recipient.name || "Valued Guest")
    .replace(/\{\{\s*email\s*\}\}/gi, recipient.email)
    .replace(/\{\{\s*destination\s*\}\}/gi, recipient.destination || "Kerala")
    .replace(/\{\{\s*year\s*\}\}/gi, year)
    .replace(/\{\{\s*unsubscribeUrl\s*\}\}/gi, unsubscribeUrl);

  // If the user's template does not already feature the unsubscribe URL, add a branded slow-luxury footer
  if (!rendered.includes(unsubscribeUrl)) {
    const complianceFooter = `
      <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e8dcc4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; line-height: 1.6; color: #8c7e6c; text-align: center;">
        <p style="margin: 0 0 8px 0; letter-spacing: 0.15em; text-transform: uppercase; color: #cbab6e; font-weight: 600;">Escora Holidays · Slow Travel Sanctuaries</p>
        <p style="margin: 0 0 12px 0;">Heritage House, 1/284 River Road, Fort Kochi, Kerala 682001, India</p>
        <p style="margin: 0;">
          You received this message because you expressed interest in handcrafted Kerala slow travel with Escora.
          <br />
          <a href="${unsubscribeUrl}" style="color: #6b5d4f; text-decoration: underline; margin-top: 6px; display: inline-block;">Unsubscribe from marketing journeys</a>
        </p>
      </div>
    `;
    rendered += complianceFooter;
  }

  return rendered;
}

/**
 * Creates a new campaign draft.
 */
export async function createCampaign(input: {
  name: string;
  subject: string;
  previewText?: string;
  contentHtml: string;
  targetAudience?: {
    type?: CampaignAudienceType;
    destinations?: string[];
    travelStyle?: string | null;
  };
}): Promise<ICampaign> {
  const id = await getNextSequence("campaigns");

  const campaign = await CampaignModel.create({
    id,
    name: input.name.trim(),
    subject: input.subject.trim(),
    previewText: input.previewText?.trim() || null,
    contentHtml: input.contentHtml,
    targetAudience: {
      type: input.targetAudience?.type || "all_contacts",
      destinations: input.targetAudience?.destinations || [],
      travelStyle: input.targetAudience?.travelStyle || null,
    },
    status: "draft",
    stats: {
      totalRecipients: 0,
      sentCount: 0,
      failedCount: 0,
      skippedCount: 0,
    },
    deliveries: [],
  });

  return campaign.toObject();
}

/**
 * Updates an existing campaign draft.
 */
export async function updateCampaign(
  id: number,
  data: Partial<{
    name: string;
    subject: string;
    previewText: string;
    contentHtml: string;
    targetAudience: {
      type: CampaignAudienceType;
      destinations?: string[];
      travelStyle?: string | null;
    };
  }>
): Promise<ICampaign> {
  const campaign = await CampaignModel.findOne({ id });
  if (!campaign) {
    throw new CampaignError(`Campaign #${id} not found`, 404, "NOT_FOUND");
  }

  if (campaign.status === "sending" || campaign.status === "sent") {
    throw new CampaignError(
      `Cannot edit campaign #${id} because it has already been sent or is currently dispatching`,
      400,
      "INVALID_STATE"
    );
  }

  if (data.name !== undefined) campaign.name = data.name.trim();
  if (data.subject !== undefined) campaign.subject = data.subject.trim();
  if (data.previewText !== undefined) campaign.previewText = data.previewText?.trim() || null;
  if (data.contentHtml !== undefined) campaign.contentHtml = data.contentHtml;
  if (data.targetAudience !== undefined) {
    campaign.targetAudience = {
      type: data.targetAudience.type || campaign.targetAudience.type,
      destinations: data.targetAudience.destinations || campaign.targetAudience.destinations,
      travelStyle: data.targetAudience.travelStyle ?? campaign.targetAudience.travelStyle,
    };
  }

  // If edited, reset approval so staff re-approves the modified content
  if (
    campaign.status === "approved" ||
    campaign.status === "scheduled" ||
    campaign.status === "pending_approval" ||
    campaign.status === "rejected"
  ) {
    campaign.status = "draft";
    campaign.approvedBy = null;
    campaign.approvedAt = null;
    campaign.scheduledAt = null;
    campaign.rejectionReason = null;
  }

  await campaign.save();
  return campaign.toObject();
}

/**
 * Submits a draft or rejected campaign for staff review and approval.
 */
export async function submitCampaignForApproval(id: number): Promise<ICampaign> {
  const campaign = await CampaignModel.findOne({ id });
  if (!campaign) {
    throw new CampaignError(`Campaign #${id} not found`, 404, "NOT_FOUND");
  }

  if (campaign.status === "sending" || campaign.status === "sent") {
    throw new CampaignError(
      `Cannot submit campaign #${id} in status "${campaign.status}"`,
      400,
      "INVALID_STATE"
    );
  }

  if (!campaign.name.trim() || !campaign.subject.trim() || !campaign.contentHtml.trim()) {
    throw new CampaignError(
      "Campaign must have a name, subject line, and email content before submission",
      400,
      "VALIDATION_ERROR"
    );
  }

  campaign.status = "pending_approval";
  campaign.submittedForApprovalAt = new Date();
  campaign.rejectionReason = null;
  await campaign.save();

  logger.info({ campaignId: id }, "[Campaign] Campaign submitted for approval");
  return campaign.toObject();
}

/**
 * Rejects a campaign with a recorded reason.
 */
export async function rejectCampaign(
  id: number,
  staffUsername: string,
  reason: string
): Promise<ICampaign> {
  const campaign = await CampaignModel.findOne({ id });
  if (!campaign) {
    throw new CampaignError(`Campaign #${id} not found`, 404, "NOT_FOUND");
  }

  if (campaign.status === "sending" || campaign.status === "sent") {
    throw new CampaignError(
      `Cannot reject campaign #${id} in status "${campaign.status}"`,
      400,
      "INVALID_STATE"
    );
  }

  campaign.status = "rejected";
  campaign.rejectedBy = staffUsername;
  campaign.rejectedAt = new Date();
  campaign.rejectionReason = reason.trim() || "Changes requested by reviewer";
  campaign.approvedBy = null;
  campaign.approvedAt = null;
  campaign.scheduledAt = null;
  await campaign.save();

  logger.info({ campaignId: id, staffUsername, reason }, "[Campaign] Campaign rejected with reason");
  return campaign.toObject();
}

/**
 * Duplicates an existing campaign into a new draft.
 */
export async function duplicateCampaign(id: number): Promise<ICampaign> {
  const campaign = await CampaignModel.findOne({ id }).lean();
  if (!campaign) {
    throw new CampaignError(`Campaign #${id} not found`, 404, "NOT_FOUND");
  }

  const newId = await getNextSequence("campaigns");
  const duplicated = await CampaignModel.create({
    id: newId,
    name: `Copy of ${campaign.name}`,
    subject: campaign.subject,
    previewText: campaign.previewText || null,
    contentHtml: campaign.contentHtml,
    targetAudience: { ...campaign.targetAudience },
    status: "draft",
    stats: {
      totalRecipients: 0,
      sentCount: 0,
      failedCount: 0,
      skippedCount: 0,
    },
    deliveries: [],
    deliveryMode: null,
  });

  logger.info({ originalId: id, newId }, "[Campaign] Campaign duplicated into new draft");
  return duplicated.toObject();
}

/**
 * Deletes a draft campaign.
 */
export async function deleteCampaign(id: number): Promise<void> {
  const campaign = await CampaignModel.findOne({ id });
  if (!campaign) {
    throw new CampaignError(`Campaign #${id} not found`, 404, "NOT_FOUND");
  }

  if (campaign.status === "sending" || campaign.status === "sent") {
    throw new CampaignError(
      `Cannot delete campaign #${id} because it has already been sent`,
      400,
      "INVALID_STATE"
    );
  }

  await CampaignModel.deleteOne({ id });
}

/**
 * Preview audience estimates and sample contacts.
 */
export async function previewCampaignAudience(id: number) {
  const campaign = await CampaignModel.findOne({ id }).lean();
  if (!campaign) {
    throw new CampaignError(`Campaign #${id} not found`, 404, "NOT_FOUND");
  }

  const { eligible, activeSubscribers, unsubscribedCount } = await resolveAudience(
    campaign.targetAudience
  );

  return {
    eligibleRecipients: eligible.length,
    activeSubscribers,
    unsubscribedCount,
    sampleRecipients: eligible.slice(0, 10).map((r) => ({
      name: r.name,
      email: r.email,
      source: r.source,
      isSubscribed: r.isSubscribed,
    })),
  };
}

/**
 * Mandatory staff approval action.
 */
export async function approveCampaign(id: number, staffUsername: string): Promise<ICampaign> {
  const campaign = await CampaignModel.findOne({ id });
  if (!campaign) {
    throw new CampaignError(`Campaign #${id} not found`, 404, "NOT_FOUND");
  }

  if (campaign.status === "sending" || campaign.status === "sent") {
    throw new CampaignError(
      `Cannot approve campaign #${id} in status "${campaign.status}"`,
      400,
      "INVALID_STATE"
    );
  }

  campaign.status = "approved";
  campaign.approvedBy = staffUsername;
  campaign.approvedAt = new Date();
  campaign.rejectionReason = null;
  await campaign.save();

  logger.info({ campaignId: id, staffUsername }, "[Campaign] Campaign approved by staff");
  return campaign.toObject();
}

/**
 * Schedules an approved campaign for future dispatch.
 */
export async function scheduleCampaign(id: number, scheduledAtStr: string): Promise<ICampaign> {
  const campaign = await CampaignModel.findOne({ id });
  if (!campaign) {
    throw new CampaignError(`Campaign #${id} not found`, 404, "NOT_FOUND");
  }

  // Approval safeguard: MUST be approved before scheduling
  if (campaign.status !== "approved") {
    throw new CampaignError(
      "Campaign must receive explicit staff approval before it can be scheduled",
      400,
      "APPROVAL_REQUIRED"
    );
  }

  const targetDate = new Date(scheduledAtStr);
  if (Number.isNaN(targetDate.getTime())) {
    throw new CampaignError("Invalid scheduledAt timestamp provided", 400, "INVALID_DATE");
  }

  campaign.status = "scheduled";
  campaign.scheduledAt = targetDate;
  await campaign.save();

  logger.info({ campaignId: id, scheduledAt: targetDate }, "[Campaign] Campaign scheduled");
  return campaign.toObject();
}

/**
 * Cancels a scheduled or approved campaign.
 */
export async function cancelCampaign(id: number): Promise<ICampaign> {
  const campaign = await CampaignModel.findOne({ id });
  if (!campaign) {
    throw new CampaignError(`Campaign #${id} not found`, 404, "NOT_FOUND");
  }

  if (campaign.status === "sent") {
    throw new CampaignError("Cannot cancel a campaign that has already been sent", 400, "INVALID_STATE");
  }

  campaign.status = "cancelled";
  campaign.scheduledAt = null;
  await campaign.save();

  logger.info({ campaignId: id }, "[Campaign] Campaign cancelled");
  return campaign.toObject();
}

/**
 * Executes controlled campaign dispatch with consent safeguards and delivery tracking.
 */
export async function sendCampaign(
  id: number,
  options?: { mock?: boolean; alreadyClaimed?: boolean }
): Promise<ICampaign> {
  let campaign;

  if (options?.alreadyClaimed) {
    campaign = await CampaignModel.findOne({ id });
    if (!campaign) {
      throw new CampaignError(`Campaign #${id} not found`, 404, "NOT_FOUND");
    }
  } else {
    // 1. Atomic Campaign Claiming Safeguard:
    // Prevents duplicate concurrent sends across multiple workers or HTTP requests.
    campaign = await CampaignModel.findOneAndUpdate(
      {
        id,
        status: { $in: ["approved", "scheduled"] },
        approvedBy: { $ne: null },
      },
      {
        $set: { status: "sending" },
      },
      { new: true }
    );

    if (!campaign) {
      const existing = await CampaignModel.findOne({ id }).lean();
      if (!existing) {
        throw new CampaignError(`Campaign #${id} not found`, 404, "NOT_FOUND");
      }
      if (!existing.approvedBy) {
        throw new CampaignError(
          `Campaign #${id} lacks authorized staff approval metadata`,
          400,
          "APPROVAL_REQUIRED"
        );
      }
      if (existing.status !== "approved" && existing.status !== "scheduled") {
        throw new CampaignError(
          `Campaign #${id} cannot be sent because it has not been approved by staff (current status: "${existing.status}")`,
          400,
          "APPROVAL_REQUIRED"
        );
      }
      throw new CampaignError(
        `Campaign #${id} cannot be sent in status "${existing.status}"`,
        400,
        "INVALID_STATE"
      );
    }
  }

  // 2. Resolve audience
  const { eligible } = await resolveAudience(campaign.targetAudience);

  // 3. Determine if live delivery is permissible
  // Safe sending default: Never send real emails unless explicitly enabled via env AND API key is present AND not in mock mode
  const isLiveDelivery =
    config.campaignSendingEnabled === true &&
    Boolean(config.resendApiKey && config.resendApiKey.trim().length > 0) &&
    options?.mock !== true;

  logger.info(
    {
      campaignId: id,
      totalRecipients: eligible.length,
      isLiveDelivery,
      mockOption: options?.mock,
    },
    "[Campaign] Beginning campaign delivery dispatch"
  );

  // Existing deliveries map for restart recovery and duplicate prevention
  const existingDeliveryMap = new Map(
    (campaign.deliveries || []).map((d) => [d.recipientEmail.toLowerCase(), d])
  );

  const finalDeliveries: ICampaign["deliveries"] = [];
  let sentCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (const recipient of eligible) {
    const normalizedEmail = recipient.email.toLowerCase();

    // Check if recipient was already delivered in a previous run (e.g., recovery after server restart)
    const existing = existingDeliveryMap.get(normalizedEmail);
    if (
      existing &&
      (existing.status === "sent" ||
        existing.status === "accepted" ||
        existing.status === "delivered" ||
        existing.status === "simulated" ||
        existing.status === "skipped_unsubscribed")
    ) {
      finalDeliveries.push(
        typeof (existing as any).toObject === "function"
          ? (existing as any).toObject()
          : { ...existing }
      );
      if (
        existing.status === "sent" ||
        existing.status === "accepted" ||
        existing.status === "delivered" ||
        existing.status === "simulated"
      ) {
        sentCount++;
      } else {
        skippedCount++;
      }
      continue;
    }

    // 4. Strict Consent Safeguard: Recheck recipient consent immediately before dispatch in DB
    const latestConsent = await SubscriberConsentModel.findOne({
      email: normalizedEmail,
    }).lean();

    if (!recipient.isSubscribed || (latestConsent && !latestConsent.subscribed)) {
      finalDeliveries.push({
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        status: "skipped_unsubscribed",
        deliveryStatus: "skipped_unsubscribed",
        sentAt: new Date(),
        error: "Recipient opted out of marketing communications",
      });
      skippedCount++;
      continue;
    }

    // 5. Render personalized content with merge tags & CAN-SPAM compliant unsubscribe link
    const personalizedHtml = renderTemplate(campaign.contentHtml, {
      ...recipient,
      token: latestConsent?.token || recipient.token,
    });
    const recipientToken = latestConsent?.token || recipient.token;
    const unsubscribeUrl = `${config.publicUrl.replace(/\/$/, "")}/api/campaigns/unsubscribe?token=${recipientToken}&email=${encodeURIComponent(recipient.email)}`;

    if (isLiveDelivery) {
      // Deterministic idempotency key: avoids duplicate sends even after ambiguous network disconnects
      const idempotencyKey = `escora-camp-${campaign.id}-${crypto.createHash("sha256").update(normalizedEmail).digest("hex").slice(0, 16)}`;

      try {
        const sendResult = await sendEmailWithStatus({
          to: recipient.email,
          subject: campaign.subject,
          html: personalizedHtml,
          idempotencyKey,
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });

        if (sendResult.success) {
          finalDeliveries.push({
            recipientEmail: recipient.email,
            recipientName: recipient.name,
            status: "accepted",
            deliveryStatus: "accepted",
            sentAt: new Date(),
            messageId: sendResult.messageId || null,
          });
          sentCount++;
        } else {
          finalDeliveries.push({
            recipientEmail: recipient.email,
            recipientName: recipient.name,
            status: "failed",
            deliveryStatus: "failed",
            sentAt: new Date(),
            error: sendResult.error || "Delivery provider rejected email",
          });
          failedCount++;
        }
      } catch (err: any) {
        finalDeliveries.push({
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          status: "failed",
          deliveryStatus: "failed",
          sentAt: new Date(),
          error: err?.message || "Delivery exception",
        });
        failedCount++;
      }
    } else {
      // 6. Safe Mock / Simulation Mode: Zero outbound calls to Resend
      finalDeliveries.push({
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        status: "sent",
        deliveryStatus: "simulated",
        sentAt: new Date(),
        messageId: `mock_resend_msg_${crypto.randomUUID()}`,
      });
      sentCount++;
    }
  }

  // 7. Update statistics and finalize campaign status atomically
  const sentAt = new Date();
  const stats = {
    totalRecipients: eligible.length,
    sentCount,
    failedCount,
    skippedCount,
  };

  await CampaignModel.updateOne(
    { id: campaign.id },
    {
      $set: {
        status: "sent",
        sentAt,
        stats,
        deliveries: finalDeliveries,
        deliveryMode: isLiveDelivery ? "live" : "simulated",
        updatedAt: new Date(),
      },
    }
  );

  const updatedCampaign = await CampaignModel.findOne({ id: campaign.id });
  if (!updatedCampaign) {
    throw new CampaignError(`Campaign #${id} not found after delivery`, 404, "NOT_FOUND");
  }

  logger.info(
    {
      campaignId: id,
      totalRecipients: eligible.length,
      sentCount,
      failedCount,
      skippedCount,
    },
    "[Campaign] Campaign dispatch finished"
  );

  return updatedCampaign.toObject();
}

/**
 * Handles public unsubscribe requests via token verification.
 */
export async function handleUnsubscribe(
  token: string,
  email: string
): Promise<{ ok: boolean; message: string }> {
  const normalizedEmail = (email || "").trim().toLowerCase();
  const normalizedToken = (token || "").trim();

  if (!normalizedEmail || !normalizedToken) {
    throw new CampaignError("Email and unsubscribe token are required", 400, "INVALID_INPUT");
  }

  const consent = await SubscriberConsentModel.findOne({
    email: normalizedEmail,
    token: normalizedToken,
  });

  if (!consent) {
    throw new CampaignError(
      "Invalid or expired unsubscribe link. Please verify the link in your email.",
      400,
      "INVALID_TOKEN"
    );
  }

  consent.subscribed = false;
  consent.unsubscribedAt = new Date();
  await consent.save();

  logger.info({ email: normalizedEmail }, "[Consent] Guest unsubscribed successfully");

  return {
    ok: true,
    message: "You have been successfully unsubscribed from Escora Holidays marketing communications.",
  };
}

/**
 * Lists subscriber consent status for administration.
 */
export async function listSubscribers(subscribedFilter?: boolean) {
  const query: any = {};
  if (typeof subscribedFilter === "boolean") {
    query.subscribed = subscribedFilter;
  }
  return SubscriberConsentModel.find(query).sort({ updatedAt: -1 }).lean();
}

/**
 * ============================================================================
 * AUDIENCE GROUP MANAGEMENT (Manual & Dynamic Segmentation)
 * ============================================================================
 */

export async function listAudienceGroups() {
  const groups = await AudienceGroupModel.find({ isArchived: { $ne: true } })
    .sort({ createdAt: -1 })
    .lean();

  const results = [];
  for (const g of groups) {
    if (g.type === "manual") {
      results.push({
        ...g,
        memberCount: g.members?.length || 0,
      });
    } else {
      const { eligible, activeSubscribers, unsubscribedCount } = await resolveAudience({
        type: "audience_group",
        groupId: g.id,
      } as any);
      results.push({
        ...g,
        memberCount: eligible.length,
        activeSubscribers,
        unsubscribedCount,
      });
    }
  }
  return results;
}

export async function createAudienceGroup(data: {
  name: string;
  description?: string;
  type: "manual" | "dynamic";
  members?: Array<{ email: string; name?: string; source?: string }>;
  rules?: any;
}) {
  if (!data.name || !data.name.trim()) {
    throw new CampaignError("Group name is required", 400);
  }

  const id = await getNextSequence("audience_groups");
  const doc = await AudienceGroupModel.create({
    id,
    name: data.name.trim(),
    description: data.description?.trim() || null,
    type: data.type || "manual",
    members: (data.members || []).map((m) => ({
      email: m.email.trim().toLowerCase(),
      name: m.name?.trim() || null,
      source: m.source || "manual",
      addedAt: new Date(),
    })),
    rules: data.rules || {},
    isArchived: false,
  });

  logger.info({ groupId: id, name: doc.name, type: doc.type }, "[Audience] Audience group created");
  return doc.toObject();
}

export async function getAudienceGroup(id: number) {
  const group = await AudienceGroupModel.findOne({ id }).lean();
  if (!group || group.isArchived) {
    throw new CampaignError(`Audience group #${id} not found`, 404, "NOT_FOUND");
  }

  const { eligible, activeSubscribers, unsubscribedCount } = await resolveAudience({
    type: "audience_group",
    groupId: group.id,
  } as any);

  return {
    ...group,
    memberCount: eligible.length,
    activeSubscribers,
    unsubscribedCount,
    resolvedMembers: eligible,
  };
}

export async function updateAudienceGroup(
  id: number,
  data: Partial<{
    name: string;
    description: string;
    type: "manual" | "dynamic";
    members: Array<{ email: string; name?: string; source?: string }>;
    rules: any;
  }>
) {
  const group = await AudienceGroupModel.findOne({ id });
  if (!group || group.isArchived) {
    throw new CampaignError(`Audience group #${id} not found`, 404, "NOT_FOUND");
  }

  if (data.name !== undefined) group.name = data.name.trim();
  if (data.description !== undefined) group.description = data.description?.trim() || null;
  if (data.type !== undefined) group.type = data.type;
  if (data.rules !== undefined) group.rules = data.rules;
  if (data.members !== undefined) {
    group.members = data.members.map((m) => ({
      email: m.email.trim().toLowerCase(),
      name: m.name?.trim() || null,
      source: m.source || "manual",
      addedAt: new Date(),
    }));
  }

  await group.save();
  logger.info({ groupId: id, name: group.name }, "[Audience] Audience group updated");
  return group.toObject();
}

export async function deleteAudienceGroup(id: number) {
  const group = await AudienceGroupModel.findOne({ id });
  if (!group) {
    throw new CampaignError(`Audience group #${id} not found`, 404, "NOT_FOUND");
  }

  group.isArchived = true;
  await group.save();
  logger.info({ groupId: id }, "[Audience] Audience group archived");
}

export async function addAudienceGroupMember(
  id: number,
  member: { email: string; name?: string; source?: string }
) {
  const group = await AudienceGroupModel.findOne({ id });
  if (!group || group.isArchived) {
    throw new CampaignError(`Audience group #${id} not found`, 404, "NOT_FOUND");
  }
  if (group.type !== "manual") {
    throw new CampaignError("Cannot manually add contacts to a dynamic audience group", 400);
  }

  const cleanEmail = member.email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new CampaignError("Valid email address is required", 400);
  }

  const existingIdx = group.members.findIndex((m) => m.email.toLowerCase() === cleanEmail);
  if (existingIdx >= 0) {
    group.members[existingIdx].name = member.name?.trim() || group.members[existingIdx].name;
  } else {
    group.members.push({
      email: cleanEmail,
      name: member.name?.trim() || null,
      source: member.source || "manual",
      addedAt: new Date(),
    });
  }

  await group.save();
  logger.info({ groupId: id, email: cleanEmail }, "[Audience] Member added to manual group");
  return group.toObject();
}

export async function removeAudienceGroupMember(id: number, email: string) {
  const group = await AudienceGroupModel.findOne({ id });
  if (!group || group.isArchived) {
    throw new CampaignError(`Audience group #${id} not found`, 404, "NOT_FOUND");
  }
  if (group.type !== "manual") {
    throw new CampaignError("Cannot manually remove contacts from a dynamic audience group", 400);
  }

  const cleanEmail = email.trim().toLowerCase();
  group.members = group.members.filter((m) => m.email.toLowerCase() !== cleanEmail);
  await group.save();
  logger.info({ groupId: id, email: cleanEmail }, "[Audience] Member removed from manual group");
  return group.toObject();
}

export async function previewAudienceGroup(id: number) {
  const group = await AudienceGroupModel.findOne({ id }).lean();
  if (!group || group.isArchived) {
    throw new CampaignError(`Audience group #${id} not found`, 404, "NOT_FOUND");
  }

  const { eligible, activeSubscribers, unsubscribedCount } = await resolveAudience({
    type: "audience_group",
    groupId: group.id,
  } as any);

  return {
    group,
    eligibleRecipients: eligible.length,
    activeSubscribers,
    unsubscribedCount,
    sampleRecipients: eligible.slice(0, 20).map((r) => ({
      name: r.name,
      email: r.email,
      source: r.source,
      isSubscribed: r.isSubscribed,
    })),
  };
}

