import crypto from "node:crypto";
import {
  CampaignModel,
  SubscriberConsentModel,
  EnquiryModel,
  OrderModel,
  InvoiceModel,
  AudienceGroupModel,
  getNextSequence,
  type ICampaign,
  type IAudienceGroup,
  type CampaignAudienceType,
  type CampaignStatus,
  type ISubscriberConsent,
} from "@workspace/db";
import { config } from "../config/env";
import { sendEmailWithStatus, getEffectiveEmailProvider } from "../lib/email";
import { logger } from "../lib/logger";
import {
  resolveMergeTags,
  resolveDestinationFromOrders,
  renderCampaignForRecipient,
  buildUnsubscribeUrl,
  detectUnresolvedAndMalformedTags,
  type PreSendValidationSummary,
} from "./merge-tag-resolver";

export interface RecipientAudienceItem {
  name: string;
  email: string;
  source: string;
  isSubscribed: boolean;
  isSuppressed?: boolean;
  suppressionReason?: string | null;
  consentStatus?: "subscribed" | "not_subscribed" | "unsubscribed" | "suppressed";
  isEligible: boolean;
  eligibilityReason?: string;
  exclusionReason?: string;
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
 * Generates a cryptographic HMAC-SHA256 unsubscribe token deterministically from an email address
 * when a persistent record does not exist in SubscriberConsentModel.
 */
export function generateDeterministicToken(email: string): string {
  const secret = process.env.SESSION_SECRET || config.sessionSecret || "escora-deterministic-token-salt-32chars";
  return crypto.createHmac("sha256", secret).update((email || "").toLowerCase().trim()).digest("hex");
}

/**
 * Resolves the target recipient list for a campaign, deduplicating contacts
 * and cross-referencing with authoritative subscriber consent status.
 */
export async function resolveAudience(targetAudience: {
  type: CampaignAudienceType;
  destinations?: string[];
  travelStyle?: string | null;
  groupId?: number | string | null;
  groupIds?: Array<number | string>;
}): Promise<{
  eligible: RecipientAudienceItem[];
  totalSelected: number;
  eligibleRecipients: number;
  eligibleCount: number;
  activeSubscribers: number;
  subscribedCount: number;
  notSubscribedCount: number;
  unsubscribedCount: number;
  suppressedCount: number;
  excludedNotSubscribed: number;
  excludedUnsubscribed: number;
  excludedSuppressed: number;
}> {
  // 0. Validate supported audience type
  const validAudienceTypes: CampaignAudienceType[] = [
    "all_contacts",
    "enquiries_only",
    "confirmed_guests",
    "subscribed_contacts",
    "audience_group",
    "custom_segment",
  ];
  if (!targetAudience?.type || !validAudienceTypes.includes(targetAudience.type)) {
    throw new CampaignError(
      `Invalid audience segment type "${targetAudience?.type}". Expected one of: all_contacts, enquiries_only, confirmed_guests, subscribed_contacts, audience_group.`,
      400,
      "INVALID_AUDIENCE_TYPE"
    );
  }

  // 0b. Safeguard for retired 'custom_segment': Return 0 recipients to prevent accidental dispatch
  if ((targetAudience.type as string) === "custom_segment") {
    return {
      eligible: [],
      totalSelected: 0,
      eligibleRecipients: 0,
      eligibleCount: 0,
      activeSubscribers: 0,
      subscribedCount: 0,
      notSubscribedCount: 0,
      unsubscribedCount: 0,
      suppressedCount: 0,
      excludedNotSubscribed: 0,
      excludedUnsubscribed: 0,
      excludedSuppressed: 0,
    };
  }

  const emailMap = new Map<
    string,
    { name: string; email: string; source: string; destination?: string; travelStyle?: string }
  >();

  // 1. Collect from Subscribed Contacts Only (New explicit consent segment)
  if (targetAudience.type === "subscribed_contacts") {
    const subscribers = await SubscriberConsentModel.find({
      suppressed: { $ne: true },
      unsubscribedAt: null,
      $or: [
        { status: "subscribed" },
        {
          subscribed: true,
          status: { $nin: ["not_subscribed", "unsubscribed", "suppressed"] },
          $or: [
            { consentDate: { $ne: null } },
            { source: { $regex: /newsletter|consent|opt_in|form/i } },
            { doubleOptInConfirmed: true },
          ],
        },
      ],
    }).lean();
    for (const sub of subscribers) {
      const email = (sub.email || "").trim().toLowerCase();
      if (!email || !email.includes("@")) continue;
      if (!emailMap.has(email)) {
        emailMap.set(email, {
          name: (sub.name || "Valued Subscriber").trim(),
          email,
          source: sub.source || "subscriber",
        });
      }
    }
  }

  // 2. Collect from Enquiries if applicable
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

  // 3. Collect from Orders if applicable
  if (
    targetAudience.type === "all_contacts" ||
    targetAudience.type === "confirmed_guests"
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

      // Filter by destination if requested
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

  // 3b. For 'all_contacts', also include registered subscribers and contacts who haven't submitted enquiries or orders yet
  if (targetAudience.type === "all_contacts") {
    const subscribers = await SubscriberConsentModel.find().lean();
    for (const sub of subscribers) {
      const email = (sub.email || "").trim().toLowerCase();
      if (!email || !email.includes("@")) continue;
      if (!emailMap.has(email)) {
        emailMap.set(email, {
          name: (sub.name || "Valued Subscriber").trim(),
          email,
          source: sub.source || "subscriber",
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
    if (targetAudience.groupId != null && !Number.isNaN(Number(targetAudience.groupId))) {
      groupIds.push(Number(targetAudience.groupId));
    }
    if (Array.isArray(targetAudience.groupIds)) {
      for (const gid of targetAudience.groupIds) {
        const num = Number(gid);
        if (!Number.isNaN(num) && !groupIds.includes(num)) {
          groupIds.push(num);
        }
      }
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

        // Normalize status list
        const rawStatus: any = rules.customerStatus;
        const statusList: string[] = Array.isArray(rawStatus)
          ? rawStatus.map((s: any) => String(s).toLowerCase().trim())
          : typeof rawStatus === "string" && (rawStatus as string).trim()
            ? [(rawStatus as string).toLowerCase().trim()]
            : [];

        const includesAll = statusList.length === 0 || statusList.includes("all");
        const includesEnquiries =
          includesAll || statusList.includes("enquiry") || statusList.includes("lead_only");
        const includesOrders =
          includesAll ||
          statusList.some((s) =>
            ["confirmed", "completed", "confirmed_bookers", "repeat_customers"].includes(s)
          );

        // Dynamic enquiry rules
        if (includesEnquiries) {
          const eqQuery: any = {};
          if (rules.inactiveDays && rules.inactiveDays > 0) {
            const cutoff = new Date(Date.now() - rules.inactiveDays * 24 * 60 * 60 * 1000);
            eqQuery.createdAt = { $lte: cutoff };
          }
          const enquiries = await EnquiryModel.find(eqQuery).lean();
          for (const eq of enquiries) {
            const email = (eq.email || "").trim().toLowerCase();
            if (!email || !email.includes("@")) continue;

            const eqDest = (eq as any).destination;
            if (rules.destinations && rules.destinations.length > 0 && eqDest) {
              const eqDestLower = String(eqDest).toLowerCase();
              const matchesDest = rules.destinations.some((d: string) =>
                eqDestLower.includes(d.toLowerCase())
              );
              if (!matchesDest) continue;
            }

            if (!emailMap.has(email)) {
              emailMap.set(email, {
                name: (eq.name || "Valued Traveler").trim(),
                email,
                source: `dynamic:${group.name}`,
                destination: eqDest || undefined,
              });
            }
          }
        }

        // Dynamic order rules
        if (includesOrders) {
          const ordQuery: any = {
            status: { $in: ["confirmed", "completed"] },
          };
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
              const matchesDest = rules.destinations.some((d: string) =>
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
  }

  // 4. Deterministic order & destination lookup for all gathered contacts
  const emails = Array.from(emailMap.keys());
  const ordersForEmails = await OrderModel.find({
    guestEmail: { $in: emails },
  })
    .sort({ createdAt: -1 })
    .lean();

  const ordersByEmail = new Map<string, Array<any>>();
  for (const ord of ordersForEmails) {
    const em = (ord.guestEmail || "").trim().toLowerCase();
    if (!ordersByEmail.has(em)) ordersByEmail.set(em, []);
    ordersByEmail.get(em)!.push(ord);
  }

  // Refine each contact in emailMap with authentic, deterministic data
  for (const [email, info] of emailMap.entries()) {
    const userOrders = ordersByEmail.get(email);
    if (userOrders && userOrders.length > 0) {
      const resolvedDest = resolveDestinationFromOrders(userOrders);
      if (resolvedDest) {
        info.destination = resolvedDest;
      }
      // If name was a generic placeholder, use the authentic guestName from booking
      const confirmedOrLatest =
        userOrders.find((o) => o.status === "confirmed" || o.status === "completed") ||
        userOrders[0];
      if (
        confirmedOrLatest?.guestName &&
        (!info.name ||
          info.name === "Valued Guest" ||
          info.name === "Valued Traveler" ||
          info.name.trim().length === 0)
      ) {
        info.name = confirmedOrLatest.guestName.trim();
      }
    }
  }

  // 4b. Filter by minBookings if specified in dynamic rules
  if (targetAudience.type === "audience_group" && targetAudience.groupId != null) {
    const grpId = Number(targetAudience.groupId);
    if (!Number.isNaN(grpId)) {
      const grp = await AudienceGroupModel.findOne({ id: grpId }).lean();
      if (grp?.type === "dynamic" && grp.rules?.minBookings && grp.rules.minBookings > 1) {
        for (const [email] of emailMap.entries()) {
          const orderCount = ordersByEmail.get(email)?.length || 0;
          if (orderCount < grp.rules.minBookings) {
            emailMap.delete(email);
          }
        }
      }
    }
  }

  // 5. Query consent records for all gathered emails
  const consentRecords = await SubscriberConsentModel.find({
    email: { $in: emails },
  }).lean();

  const consentMap = new Map<
    string,
    {
      status: "subscribed" | "not_subscribed" | "unsubscribed" | "suppressed";
      subscribed: boolean;
      token: string;
      suppressed: boolean;
      suppressionReason?: string | null;
    }
  >();
  for (const c of consentRecords) {
    const isSuppressed = Boolean(c.suppressed || c.status === "suppressed");
    const isUnsubscribed = Boolean(
      c.status === "unsubscribed" ||
      (!c.subscribed && c.unsubscribedAt)
    );
    const isExplicitlySubscribed = Boolean(
      !isSuppressed &&
      !isUnsubscribed &&
      (c.status === "subscribed" ||
        (c.subscribed && (c.consentDate || c.source?.includes("newsletter") || c.source?.includes("consent"))))
    );

    let resolvedStatus: "subscribed" | "not_subscribed" | "unsubscribed" | "suppressed" = "not_subscribed";
    if (isSuppressed) {
      resolvedStatus = "suppressed";
    } else if (isUnsubscribed) {
      resolvedStatus = "unsubscribed";
    } else if (isExplicitlySubscribed) {
      resolvedStatus = "subscribed";
    }

    consentMap.set(c.email.toLowerCase(), {
      status: resolvedStatus,
      subscribed: resolvedStatus === "subscribed",
      token: c.token,
      suppressed: isSuppressed,
      suppressionReason: c.suppressionReason,
    });
  }

  // 6. Build audience items with accurate 4-state consent classification and eligibility
  const eligible: RecipientAudienceItem[] = [];
  let activeSubscribers = 0;
  let notSubscribedCount = 0;
  let excludedUnsubscribed = 0;
  let excludedSuppressed = 0;

  for (const [email, info] of emailMap.entries()) {
    let consent = consentMap.get(email);
    if (!consent) {
      // In-memory default to Not Subscribed: Enquiries, bookings, and unverified contacts NEVER automatically get marketing consent!
      // Audience resolution is purely read-only and must NEVER create or modify consent records.
      consent = {
        status: "not_subscribed",
        subscribed: false,
        token: generateDeterministicToken(email),
        suppressed: false,
        suppressionReason: null,
      };
    }

    const isSuppressed = Boolean(consent.status === "suppressed" || consent.suppressed);
    const isSubscribed = Boolean(consent.status === "subscribed");
    const isUnsubscribed = Boolean(consent.status === "unsubscribed");

    let isEligible = false;
    let eligibilityReason: string | undefined;
    let exclusionReason: string | undefined;

    if (isSuppressed) {
      excludedSuppressed++;
      isEligible = false;
      exclusionReason = consent.suppressionReason || "Recipient suppressed from marketing delivery";
    } else if (isUnsubscribed) {
      excludedUnsubscribed++;
      isEligible = false;
      exclusionReason = "Recipient opted out of marketing communications (Unsubscribed)";
    } else if (isSubscribed) {
      activeSubscribers++;
      isEligible = true;
      eligibilityReason = "Subscribed with marketing consent";
    } else {
      notSubscribedCount++;
      isEligible = false;
      exclusionReason = "Missing verified marketing consent";
    }

    const token = consent.token || generateDeterministicToken(email);

    eligible.push({
      ...info,
      isSubscribed,
      isSuppressed,
      suppressionReason: consent.suppressionReason,
      consentStatus: consent.status,
      isEligible,
      eligibilityReason,
      exclusionReason,
      token,
    });
  }

  const totalSelected = emailMap.size;
  const unsubscribedCount = excludedUnsubscribed;

  // Subscribed contacts are eligible only when valid marketing consent exists and they are not suppressed.
  // Not-subscribed contacts are not treated as having consent across all audience types.
  const eligibleRecipients = activeSubscribers;
  const eligibleCount = eligibleRecipients;
  const excludedNotSubscribed = notSubscribedCount;

  return {
    eligible,
    totalSelected,
    eligibleRecipients,
    eligibleCount,
    activeSubscribers,
    subscribedCount: activeSubscribers,
    notSubscribedCount,
    unsubscribedCount,
    suppressedCount: excludedSuppressed,
    excludedNotSubscribed,
    excludedUnsubscribed,
    excludedSuppressed,
  };
}

/**
 * Interpolates template variables with personalization and ensures CAN-SPAM / GDPR
 * compliance by appending a verified unsubscribe link and physical company address.
 * Delegated to the centralized resolveMergeTags engine for secure, HTML-escaped, non-recursive rendering.
 */
export function renderTemplate(
  templateHtml: string,
  recipient: { name: string; email: string; destination?: string; token: string },
  baseUrl = config.publicUrl
): string {
  const result = resolveMergeTags(
    templateHtml,
    {
      name: recipient.name,
      email: recipient.email,
      destination: recipient.destination,
      token: recipient.token,
    },
    { isHtml: true, baseUrl }
  );

  let rendered = result.rendered;
  const unsubscribeUrl = buildUnsubscribeUrl(recipient.token, recipient.email, baseUrl);

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
    groupId?: number | string | null;
    groupIds?: Array<number | string>;
  };
}): Promise<ICampaign> {
  if ((input.targetAudience?.type as string) === "custom_segment") {
    throw new CampaignError(
      "The 'Custom Destination Segment' audience option has been retired. Please select one of the five supported audience segments: All Contacts, Inquiries Prospects Only, Confirmed Journey Guests Only, Subscribed Contacts Only, or Audience Group.",
      400,
      "RETIRED_AUDIENCE_SEGMENT"
    );
  }

  const validTypes: CampaignAudienceType[] = [
    "all_contacts",
    "enquiries_only",
    "confirmed_guests",
    "subscribed_contacts",
    "audience_group",
  ];
  if (input.targetAudience?.type && !validTypes.includes(input.targetAudience.type)) {
    throw new CampaignError(
      `Invalid audience segment type "${input.targetAudience.type}". Expected one of: all_contacts, enquiries_only, confirmed_guests, subscribed_contacts, audience_group.`,
      400,
      "INVALID_AUDIENCE_TYPE"
    );
  }

  const id = await getNextSequence("campaigns");

  const parsedGroupId =
    input.targetAudience?.groupId != null &&
    input.targetAudience.groupId !== "" &&
    !Number.isNaN(Number(input.targetAudience.groupId))
      ? Number(input.targetAudience.groupId)
      : null;

  const parsedGroupIds = Array.isArray(input.targetAudience?.groupIds)
    ? input.targetAudience.groupIds.map(Number).filter((n) => !Number.isNaN(n))
    : parsedGroupId !== null
      ? [parsedGroupId]
      : [];

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
      groupId: parsedGroupId,
      groupIds: parsedGroupIds,
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
 * Updates an existing campaign draft or eligible status.
 * Safeguards:
 * - Sending: Disallowed.
 * - Sent: Disallowed (must duplicate).
 * - Scheduled: Direct edit disallowed (must unschedule first).
 * - Approved / Pending / Rejected / Cancelled: Invalides approval & returns to Draft.
 */
export async function updateCampaign(
  id: number,
  data: Partial<{
    name: string;
    subject: string;
    previewText: string | null;
    contentHtml: string;
    targetAudience: {
      type: CampaignAudienceType;
      destinations?: string[];
      travelStyle?: string | null;
      groupId?: number | string | null;
      groupIds?: Array<number | string>;
    };
  }>
): Promise<ICampaign> {
  const campaign = await CampaignModel.findOne({ id });
  if (!campaign) {
    throw new CampaignError(`Campaign #${id} not found`, 404, "NOT_FOUND");
  }

  if (campaign.status === "sending") {
    throw new CampaignError(
      `Cannot edit campaign #${id} while it is actively sending`,
      400,
      "INVALID_STATE"
    );
  }

  if (campaign.status === "sent") {
    throw new CampaignError(
      `Cannot edit campaign #${id} because it has already been sent. Please duplicate it to create an editable draft.`,
      400,
      "CANNOT_EDIT_SENT"
    );
  }

  if (campaign.status === "scheduled") {
    throw new CampaignError(
      `Cannot edit campaign #${id} while it is scheduled. Please unschedule the campaign first before editing.`,
      400,
      "SCHEDULED_CAMPAIGN"
    );
  }

  if (data.name !== undefined) campaign.name = data.name.trim();
  if (data.subject !== undefined) campaign.subject = data.subject.trim();
  if (data.previewText !== undefined) campaign.previewText = data.previewText?.trim() || null;
  if (data.contentHtml !== undefined) campaign.contentHtml = data.contentHtml;
  if (data.targetAudience !== undefined) {
    if ((data.targetAudience.type as string) === "custom_segment") {
      throw new CampaignError(
        "The 'Custom Destination Segment' audience option has been retired. Please select one of the five supported audience segments: All Contacts, Inquiries Prospects Only, Confirmed Journey Guests Only, Subscribed Contacts Only, or Audience Group.",
        400,
        "RETIRED_AUDIENCE_SEGMENT"
      );
    }

    const validTypes: CampaignAudienceType[] = [
      "all_contacts",
      "enquiries_only",
      "confirmed_guests",
      "subscribed_contacts",
      "audience_group",
    ];
    if (data.targetAudience.type && !validTypes.includes(data.targetAudience.type)) {
      throw new CampaignError(
        `Invalid audience segment type "${data.targetAudience.type}". Expected one of: all_contacts, enquiries_only, confirmed_guests, subscribed_contacts, audience_group.`,
        400,
        "INVALID_AUDIENCE_TYPE"
      );
    }

    const parsedGroupId =
      data.targetAudience.groupId !== undefined
        ? (data.targetAudience.groupId != null &&
           data.targetAudience.groupId !== "" &&
           !Number.isNaN(Number(data.targetAudience.groupId))
            ? Number(data.targetAudience.groupId)
            : null)
        : campaign.targetAudience.groupId;

    const parsedGroupIds =
      data.targetAudience.groupIds !== undefined
        ? (Array.isArray(data.targetAudience.groupIds)
            ? data.targetAudience.groupIds.map(Number).filter((n) => !Number.isNaN(n))
            : [])
        : (campaign.targetAudience.groupIds || []);

    campaign.targetAudience = {
      type: data.targetAudience.type || campaign.targetAudience.type,
      destinations:
        data.targetAudience.destinations !== undefined
          ? data.targetAudience.destinations
          : campaign.targetAudience.destinations,
      travelStyle:
        data.targetAudience.travelStyle !== undefined
          ? data.targetAudience.travelStyle
          : campaign.targetAudience.travelStyle,
      groupId: parsedGroupId,
      groupIds: parsedGroupIds,
    };
  }

  // If edited, reset approval and return to draft so staff re-approves the modified content
  if (
    campaign.status === "approved" ||
    campaign.status === "pending_approval" ||
    campaign.status === "rejected" ||
    campaign.status === "cancelled"
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

  const result = await resolveAudience(campaign.targetAudience);

  return {
    totalSelected: result.totalSelected,
    eligibleRecipients: result.eligibleRecipients,
    eligibleCount: result.eligibleCount,
    activeSubscribers: result.activeSubscribers,
    subscribedCount: result.subscribedCount,
    notSubscribedCount: result.notSubscribedCount,
    unsubscribedCount: result.unsubscribedCount,
    suppressedCount: result.suppressedCount,
    excludedNotSubscribed: result.excludedNotSubscribed,
    excludedUnsubscribed: result.excludedUnsubscribed,
    excludedSuppressed: result.excludedSuppressed,
    sampleRecipients: result.eligible.slice(0, 100).map((r) => ({
      name: r.name,
      email: r.email,
      source: r.source,
      isSubscribed: r.isSubscribed,
      isSuppressed: r.isSuppressed,
      consentStatus: r.consentStatus,
      isEligible: r.isEligible,
      eligibilityReason: r.eligibilityReason,
      exclusionReason: r.exclusionReason,
      destination: r.destination,
      hasDestination: Boolean(r.destination),
    })),
  };
}

/**
 * Evaluates campaign merge tags and recipient data before dispatch,
 * identifying ready recipients, excluded recipients, and fallbacks.
 */
export async function validateCampaignPreSend(id: number): Promise<PreSendValidationSummary> {
  const campaign = await CampaignModel.findOne({ id }).lean();
  if (!campaign) {
    throw new CampaignError(`Campaign #${id} not found`, 404, "NOT_FOUND");
  }

  if ((campaign.targetAudience?.type as string) === "custom_segment") {
    return {
      campaignId: id,
      totalEligible: 0,
      readyToSend: 0,
      excludedCount: 1,
      canSend: false,
      fallbacksSummary: {
        nameFallbackCount: 0,
        destinationFallbackCount: 0,
        exactDestinationCount: 0,
      },
      unresolvedTags: [],
      malformedTags: [],
      exclusionReasons: [
        {
          email: "(none)",
          reason:
            "The 'Custom Destination Segment' audience option has been retired. Please edit this campaign and select a supported audience segment before sending.",
          code: "RETIRED_AUDIENCE_SEGMENT",
        },
      ],
      sampleRecipients: [],
    };
  }

  const { eligible } = await resolveAudience(campaign.targetAudience);

  let readyToSend = 0;
  let nameFallbackCount = 0;
  let destinationFallbackCount = 0;
  let exactDestinationCount = 0;
  const unresolvedTagsSet = new Set<string>();
  const malformedTagsSet = new Set<string>();
  const exclusionReasons: PreSendValidationSummary["exclusionReasons"] = [];
  const sampleRecipients: PreSendValidationSummary["sampleRecipients"] = [];

  for (const recipient of eligible) {
    if (!recipient.email || !recipient.email.includes("@")) {
      exclusionReasons.push({
        email: recipient.email || "(blank)",
        reason: "Missing or invalid recipient email address",
        code: "INVALID_EMAIL",
      });
      continue;
    }

    if (recipient.isSuppressed) {
      exclusionReasons.push({
        email: recipient.email,
        reason: recipient.suppressionReason || "Recipient address suppressed from marketing delivery",
        code: "SUPPRESSED",
      });
      continue;
    }

    if (recipient.consentStatus === "unsubscribed") {
      exclusionReasons.push({
        email: recipient.email,
        reason: "Recipient has opted out of marketing communications (Unsubscribed)",
        code: "UNSUBSCRIBED",
      });
      continue;
    }

    if (!recipient.isSubscribed || recipient.consentStatus !== "subscribed") {
      exclusionReasons.push({
        email: recipient.email,
        reason: "Missing verified marketing consent",
        code: "NOT_SUBSCRIBED",
      });
      continue;
    }

    if (!recipient.token) {
      exclusionReasons.push({
        email: recipient.email,
        reason: "Missing consent token; cannot generate compliant unsubscribe link",
        code: "MISSING_CONSENT_TOKEN",
      });
      continue;
    }

    const rendered = renderCampaignForRecipient(
      campaign,
      recipient,
      { baseUrl: config.publicUrl }
    );

    if (!rendered.success) {
      exclusionReasons.push({
        email: recipient.email,
        reason: rendered.errors.join("; "),
        code: "UNRESOLVED_TAGS",
      });
      continue;
    }

    readyToSend++;
    if (rendered.usedFallbacks.name) {
      nameFallbackCount++;
    }
    if (rendered.usedFallbacks.destination) {
      destinationFallbackCount++;
    } else {
      exactDestinationCount++;
    }

    if (sampleRecipients.length < 5) {
      sampleRecipients.push({
        email: recipient.email,
        name: recipient.name,
        destination: recipient.destination || "Kerala",
        usedNameFallback: rendered.usedFallbacks.name,
        usedDestinationFallback: rendered.usedFallbacks.destination,
        previewSubject: rendered.renderedSubject,
      });
    }
  }

  // Also inspect template itself for unresolvable tags
  const templateDetect = detectUnresolvedAndMalformedTags(
    `${campaign.subject} ${campaign.contentHtml} ${campaign.previewText || ""}`
  );
  const supportedPattern = /\{\{\s*(name|destination|year|email|unsubscribeurl)\s*\}\}/i;
  const invalidTemplateTags = templateDetect.unresolved.filter((t) => !supportedPattern.test(t));
  for (const t of invalidTemplateTags) unresolvedTagsSet.add(t);
  for (const m of templateDetect.malformed) malformedTagsSet.add(m);

  return {
    campaignId: id,
    totalEligible: eligible.length,
    readyToSend,
    excludedCount: exclusionReasons.length,
    canSend: readyToSend > 0 && unresolvedTagsSet.size === 0 && malformedTagsSet.size === 0,
    fallbacksSummary: {
      nameFallbackCount,
      destinationFallbackCount,
      exactDestinationCount,
    },
    unresolvedTags: Array.from(unresolvedTagsSet),
    malformedTags: Array.from(malformedTagsSet),
    exclusionReasons: exclusionReasons.slice(0, 250),
    sampleRecipients,
    blockReason:
      readyToSend === 0
        ? "This campaign has 0 eligible marketing recipients. All selected contacts are either not subscribed, unsubscribed, or suppressed."
        : unresolvedTagsSet.size > 0
          ? `Unresolved merge tags found: ${Array.from(unresolvedTagsSet).join(", ")}`
          : malformedTagsSet.size > 0
            ? `Malformed merge tags found: ${Array.from(malformedTagsSet).join(", ")}`
            : null,
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

  if ((campaign.targetAudience?.type as string) === "custom_segment") {
    throw new CampaignError(
      `Campaign #${id} cannot be approved because it uses the retired 'Custom Destination Segment'. Please edit the campaign and reassign its audience to a supported segment before approval.`,
      400,
      "RETIRED_AUDIENCE_SEGMENT"
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
 * Schedules a campaign for future dispatch directly from draft or scheduled state.
 */
export async function scheduleCampaign(id: number, scheduledAtStr: string): Promise<ICampaign> {
  const campaign = await CampaignModel.findOne({ id });
  if (!campaign) {
    throw new CampaignError(`Campaign #${id} not found`, 404, "NOT_FOUND");
  }

  if ((campaign.targetAudience?.type as string) === "custom_segment") {
    throw new CampaignError(
      `Campaign #${id} cannot be scheduled because it uses the retired 'Custom Destination Segment'. Please edit the campaign and reassign its audience to a supported segment.`,
      400,
      "RETIRED_AUDIENCE_SEGMENT"
    );
  }

  if (campaign.status !== "draft" && campaign.status !== "scheduled" && campaign.status !== "approved") {
    throw new CampaignError(
      `Campaign #${id} in status "${campaign.status}" cannot be scheduled. Only draft or scheduled campaigns can be scheduled.`,
      400,
      "INVALID_STATE"
    );
  }

  const targetDate = new Date(scheduledAtStr);
  if (Number.isNaN(targetDate.getTime()) || targetDate.getTime() <= Date.now()) {
    throw new CampaignError("Scheduled time must be a valid future timestamp", 400, "INVALID_DATE");
  }

  campaign.status = "scheduled";
  campaign.scheduledAt = targetDate;
  await campaign.save();

  logger.info({ campaignId: id, scheduledAt: targetDate }, "[Campaign] Campaign scheduled directly by Admin");
  return campaign.toObject();
}

/**
 * Cancels a scheduled campaign and returns it to draft.
 */
export async function cancelCampaign(id: number): Promise<ICampaign> {
  const campaign = await CampaignModel.findOne({ id });
  if (!campaign) {
    throw new CampaignError(`Campaign #${id} not found`, 404, "NOT_FOUND");
  }

  if (campaign.status === "sent" || campaign.status === "sending") {
    throw new CampaignError(`Cannot cancel a campaign in status "${campaign.status}"`, 400, "INVALID_STATE");
  }

  campaign.status = "draft";
  campaign.scheduledAt = null;
  await campaign.save();

  logger.info({ campaignId: id }, "[Campaign] Campaign unscheduled and returned to draft");
  return campaign.toObject();
}

/**
 * Executes controlled campaign dispatch with consent safeguards and delivery tracking.
 * Directly callable by Admin without approval gates. Never simulates sending in production.
 */
export async function sendCampaign(
  id: number,
  options?: { alreadyClaimed?: boolean }
): Promise<ICampaign> {
  const existingCheck = await CampaignModel.findOne({ id }).lean();
  if (!existingCheck) {
    throw new CampaignError(`Campaign #${id} not found`, 404, "NOT_FOUND");
  }

  if ((existingCheck.targetAudience?.type as string) === "custom_segment") {
    throw new CampaignError(
      `Campaign #${id} cannot be dispatched because it uses the retired 'Custom Destination Segment'. Please edit the campaign and reassign its audience to a supported segment.`,
      400,
      "RETIRED_AUDIENCE_SEGMENT"
    );
  }

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
        status: { $in: ["draft", "scheduled", "approved"] },
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
      throw new CampaignError(
        `Campaign #${id} cannot be sent in status "${existing.status}"`,
        400,
        "INVALID_STATE"
      );
    }
  }

  // 2. Pre-send audience check for retired segment
  if ((campaign.targetAudience?.type as string) === "custom_segment") {
    throw new CampaignError(
      `Campaign #${id} cannot be dispatched because it uses the retired 'Custom Destination Segment'. Please edit the campaign and reassign its audience to a supported segment.`,
      400,
      "RETIRED_AUDIENCE_SEGMENT"
    );
  }

  // 3. Resolve audience
  const { eligible } = await resolveAudience(campaign.targetAudience);

  // 4. Safeguard: Prevent empty/misleading dispatch when zero recipients are eligible
  const eligibleRecipientsList = eligible.filter(
    (r) => r.isSubscribed && r.consentStatus === "subscribed" && !r.isSuppressed
  );

  if (eligibleRecipientsList.length === 0) {
    if (!options?.alreadyClaimed) {
      await CampaignModel.updateOne({ id }, { $set: { status: "draft" } });
    }
    throw new CampaignError(
      "Campaign has 0 eligible marketing recipients with verified explicit consent. Dispatch blocked to prevent misleading empty dispatch.",
      400,
      "ZERO_ELIGIBLE_RECIPIENTS"
    );
  }

  // 5. Verify sending flags and email provider availability
  if (config.campaignSendingEnabled !== true) {
    if (!options?.alreadyClaimed) {
      await CampaignModel.updateOne({ id }, { $set: { status: "draft" } });
    }
    throw new CampaignError(
      "Live campaign sending is disabled in server configuration (CAMPAIGN_SENDING_ENABLED is false).",
      400,
      "CAMPAIGN_SENDING_DISABLED"
    );
  }

  const effectiveProvider = getEffectiveEmailProvider();
  if (effectiveProvider === "none") {
    if (!options?.alreadyClaimed) {
      await CampaignModel.updateOne({ id }, { $set: { status: "draft" } });
    }
    throw new CampaignError(
      "No email provider is configured. Please configure Gmail credentials or Resend API key.",
      400,
      "PROVIDER_MISSING"
    );
  }

  logger.info(
    {
      campaignId: id,
      totalRecipients: eligible.length,
      provider: effectiveProvider,
    },
    "[Campaign] Beginning live campaign delivery dispatch"
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

    // 4. Strict Consent & Suppression Safeguard: Recheck recipient consent immediately before dispatch in DB
    const latestConsent = await SubscriberConsentModel.findOne({
      email: normalizedEmail,
    }).lean();

    const isSuppressed = Boolean(latestConsent?.suppressed || latestConsent?.status === "suppressed");
    const isUnsubscribed = Boolean(
      latestConsent?.status === "unsubscribed" || (!latestConsent?.subscribed && latestConsent?.unsubscribedAt)
    );
    const isExplicitlySubscribed = Boolean(
      !isSuppressed &&
      !isUnsubscribed &&
      (latestConsent?.status === "subscribed" ||
        (latestConsent?.subscribed &&
          (latestConsent?.consentDate ||
            latestConsent?.source?.includes("newsletter") ||
            latestConsent?.source?.includes("consent"))))
    );

    const isEligibleForDispatch = Boolean(isExplicitlySubscribed && !isSuppressed && !isUnsubscribed);

    if (!isEligibleForDispatch) {
      let errorMsg = "Missing verified marketing consent";
      if (isSuppressed) {
        errorMsg = `Recipient suppressed from marketing communications (${latestConsent?.suppressionReason || "Suppression rule active"})`;
      } else if (isUnsubscribed) {
        errorMsg = "Recipient opted out of marketing communications (Unsubscribed)";
      }

      finalDeliveries.push({
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        status: "skipped_unsubscribed",
        deliveryStatus: "skipped_unsubscribed",
        sentAt: new Date(),
        error: errorMsg,
      });
      skippedCount++;
      continue;
    }

    // 5. Pre-send validation & merge tag resolution
    const recipientToken = latestConsent?.token || recipient.token || generateDeterministicToken(recipient.email);
    if (!recipientToken) {
      finalDeliveries.push({
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        status: "failed",
        deliveryStatus: "failed",
        sentAt: new Date(),
        error: "Missing cryptographic consent token; cannot generate compliant unsubscribe link",
      });
      failedCount++;
      continue;
    }

    const rendered = renderCampaignForRecipient(
      campaign,
      {
        ...recipient,
        token: recipientToken,
      },
      { baseUrl: config.publicUrl }
    );

    if (!rendered.success) {
      finalDeliveries.push({
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        status: "failed",
        deliveryStatus: "failed",
        sentAt: new Date(),
        error: `Personalization failed: ${rendered.errors.join("; ")}`,
      });
      failedCount++;
      continue;
    }

    const unsubscribeUrl = buildUnsubscribeUrl(recipientToken, recipient.email, config.publicUrl);

    // Deterministic idempotency key: avoids duplicate sends even after ambiguous network disconnects
    const idempotencyKey = `escora-camp-${campaign.id}-${crypto.createHash("sha256").update(normalizedEmail).digest("hex").slice(0, 16)}`;

    try {
      const sendResult = await sendEmailWithStatus({
        to: recipient.email,
        subject: rendered.renderedSubject,
        html: rendered.renderedHtml,
        idempotencyKey,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });

      if (sendResult.success) {
        const effStatus = sendResult.status === "delivered" ? "delivered" : "accepted";
        finalDeliveries.push({
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          status: effStatus,
          deliveryStatus: effStatus,
          sentAt: sendResult.sentAt || new Date(),
          messageId: sendResult.messageId || null,
          provider: sendResult.provider,
          smtpResponse: sendResult.smtpResponse || null,
          providerResponse: sendResult.providerResponse || null,
          acceptedRecipients: sendResult.acceptedRecipients || [recipient.email],
          rejectedRecipients: sendResult.rejectedRecipients || [],
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
          provider: sendResult.provider,
          smtpResponse: sendResult.smtpResponse || null,
          providerResponse: sendResult.providerResponse || null,
          acceptedRecipients: sendResult.acceptedRecipients || [],
          rejectedRecipients: sendResult.rejectedRecipients || [recipient.email],
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
  }

  // 6. Update statistics and finalize campaign status atomically
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
        deliveryMode: "live",
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

  let consent = await SubscriberConsentModel.findOne({
    email: normalizedEmail,
  });

  const expectedDeterministic = generateDeterministicToken(normalizedEmail);
  const isMatch = (consent && consent.token === normalizedToken) || normalizedToken === expectedDeterministic;

  if (!isMatch) {
    throw new CampaignError(
      "Invalid or expired unsubscribe link. Please verify the link in your email.",
      400,
      "INVALID_TOKEN"
    );
  }

  if (!consent) {
    consent = new SubscriberConsentModel({
      email: normalizedEmail,
      token: normalizedToken,
      source: "unsubscribe_link",
    });
  }

  consent.status = "unsubscribed";
  consent.subscribed = false;
  consent.unsubscribedAt = new Date();
  if (!consent.auditLog) consent.auditLog = [];
  consent.auditLog.push({
    action: "unsubscribed",
    performedBy: "customer",
    timestamp: new Date(),
    reason: "One-click unsubscribe link activated",
  });
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
export async function listSubscribers(
  filter?:
    | boolean
    | {
      subscribed?: boolean;
      suppressed?: boolean;
      status?: "subscribed" | "not_subscribed" | "unsubscribed" | "suppressed";
      search?: string;
    }
) {
  const query: any = {};
  if (typeof filter === "boolean") {
    query.subscribed = filter;
  } else if (filter && typeof filter === "object") {
    if (filter.status) {
      if (filter.status === "suppressed") {
        query.$or = [{ suppressed: true }, { status: "suppressed" }];
      } else if (filter.status === "subscribed") {
        query.status = "subscribed";
        query.subscribed = true;
        query.suppressed = { $ne: true };
      } else if (filter.status === "unsubscribed") {
        query.status = "unsubscribed";
        query.suppressed = { $ne: true };
      } else if (filter.status === "not_subscribed") {
        query.status = "not_subscribed";
        query.suppressed = { $ne: true };
      }
    } else {
      if (typeof filter.subscribed === "boolean") {
        query.subscribed = filter.subscribed;
      }
      if (typeof filter.suppressed === "boolean") {
        query.suppressed = filter.suppressed;
      }
    }
    if (filter.search?.trim()) {
      const s = filter.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [{ email: { $regex: s, $options: "i" } }, { name: { $regex: s, $options: "i" } }];
    }
  }
  const records = await SubscriberConsentModel.find(query).sort({ updatedAt: -1 }).lean();
  return records.map((r) => {
    let resolvedStatus = r.status;
    if (!resolvedStatus) {
      if (r.suppressed) resolvedStatus = "suppressed";
      else if (r.unsubscribedAt || (!r.subscribed && r.unsubscribedAt)) resolvedStatus = "unsubscribed";
      else if (r.subscribed && (r.consentDate || r.source?.includes("newsletter") || r.source?.includes("consent"))) resolvedStatus = "subscribed";
      else resolvedStatus = "not_subscribed";
    }
    return {
      ...r,
      status: resolvedStatus,
    };
  });
}

/**
 * Unsubscribes an email from marketing communications with recorded reason and admin actor.
 */
export async function adminUnsubscribeSubscriber(
  email: string,
  adminUsername: string,
  reason?: string,
  source?: string
): Promise<ISubscriberConsent> {
  const normalized = email.toLowerCase().trim();
  if (!normalized || !normalized.includes("@")) {
    throw new CampaignError("Invalid email address provided", 400, "INVALID_EMAIL");
  }

  let consent = await SubscriberConsentModel.findOne({ email: normalized });
  if (!consent) {
    consent = new SubscriberConsentModel({
      email: normalized,
      status: "unsubscribed",
      subscribed: false,
      token: crypto.randomBytes(24).toString("hex"),
      source: source || "admin_manual",
    });
  }

  consent.status = "unsubscribed";
  consent.subscribed = false;
  consent.unsubscribedAt = new Date();
  consent.source = source || consent.source || "admin_manual";
  consent.updatedBy = adminUsername;

  if (!consent.auditLog) consent.auditLog = [];
  consent.auditLog.push({
    action: "unsubscribed",
    performedBy: adminUsername,
    timestamp: new Date(),
    reason: reason?.trim() || "Unsubscribed by administrator in consent registry",
    source: consent.source,
  });

  await consent.save();
  logger.info({ email: normalized, adminUsername, reason }, "[Consent] Contact unsubscribed by admin");
  return consent.toObject();
}

/**
 * Records explicit marketing consent provided genuinely by the customer.
 */
export async function recordExplicitConsent(
  email: string,
  adminUsername: string,
  data: {
    name?: string;
    consentMethod: string;
    source: string;
    consentDate?: Date | string;
    doubleOptInConfirmed?: boolean;
    notes?: string;
  }
): Promise<ISubscriberConsent> {
  const normalized = email.toLowerCase().trim();
  if (!normalized || !normalized.includes("@")) {
    throw new CampaignError("Invalid email address provided", 400, "INVALID_EMAIL");
  }

  if (!data.consentMethod?.trim() || !data.source?.trim()) {
    throw new CampaignError(
      "Consent method and genuine source are required to record explicit subscription consent",
      400,
      "VALIDATION_ERROR"
    );
  }

  let consent = await SubscriberConsentModel.findOne({ email: normalized });
  if (!consent) {
    consent = new SubscriberConsentModel({
      email: normalized,
      name: data.name?.trim() || null,
      token: crypto.randomBytes(24).toString("hex"),
    });
  } else if (data.name?.trim()) {
    consent.name = data.name.trim();
  }

  // If email was suppressed, recording explicit fresh consent lifts suppression
  if (consent.suppressed) {
    consent.suppressed = false;
    consent.suppressedAt = null;
    consent.suppressionReason = null;
    consent.suppressedBy = null;
  }

  const cDate = data.consentDate ? new Date(data.consentDate) : new Date();
  consent.status = "subscribed";
  consent.subscribed = true;
  consent.unsubscribedAt = null;
  consent.source = data.source.trim();
  consent.consentDate = Number.isNaN(cDate.getTime()) ? new Date() : cDate;
  consent.consentMethod = data.consentMethod.trim();
  consent.doubleOptInConfirmed = Boolean(data.doubleOptInConfirmed);
  consent.updatedBy = adminUsername;

  if (!consent.auditLog) consent.auditLog = [];
  consent.auditLog.push({
    action: "subscribed",
    performedBy: adminUsername,
    timestamp: new Date(),
    reason: data.notes?.trim() || "Explicit subscription consent recorded",
    method: data.consentMethod.trim(),
    source: data.source.trim(),
  });

  await consent.save();
  logger.info({ email: normalized, adminUsername, source: data.source }, "[Consent] Explicit consent recorded");
  return consent.toObject();
}

/**
 * Suppresses an email address from all marketing communications.
 */
export async function suppressEmailAddress(
  email: string,
  adminUsername: string,
  reason: string
): Promise<ISubscriberConsent> {
  const normalized = email.toLowerCase().trim();
  if (!normalized || !normalized.includes("@")) {
    throw new CampaignError("Invalid email address provided", 400, "INVALID_EMAIL");
  }

  if (!reason?.trim()) {
    throw new CampaignError("A suppression reason is required", 400, "VALIDATION_ERROR");
  }

  let consent = await SubscriberConsentModel.findOne({ email: normalized });
  if (!consent) {
    consent = new SubscriberConsentModel({
      email: normalized,
      token: crypto.randomBytes(24).toString("hex"),
      source: "admin_suppression",
    });
  }

  consent.status = "suppressed";
  consent.suppressed = true;
  consent.suppressedAt = new Date();
  consent.suppressionReason = reason.trim();
  consent.suppressedBy = adminUsername;
  consent.subscribed = false;
  if (!consent.unsubscribedAt) consent.unsubscribedAt = new Date();
  consent.updatedBy = adminUsername;

  if (!consent.auditLog) consent.auditLog = [];
  consent.auditLog.push({
    action: "suppressed",
    performedBy: adminUsername,
    timestamp: new Date(),
    reason: reason.trim(),
  });

  await consent.save();
  logger.info({ email: normalized, adminUsername, reason }, "[Consent] Email address suppressed");
  return consent.toObject();
}

/**
 * Lifts email suppression. Leaves status as unsubscribed unless explicit consent is separately recorded.
 */
export async function unsuppressEmailAddress(
  email: string,
  adminUsername: string,
  reason?: string
): Promise<ISubscriberConsent> {
  const normalized = email.toLowerCase().trim();
  const consent = await SubscriberConsentModel.findOne({ email: normalized });
  if (!consent) {
    throw new CampaignError(`Contact record for ${normalized} not found`, 404, "NOT_FOUND");
  }

  consent.suppressed = false;
  consent.suppressedAt = null;
  consent.suppressionReason = null;
  consent.suppressedBy = null;
  consent.status = "unsubscribed";
  consent.subscribed = false;
  consent.updatedBy = adminUsername;

  if (!consent.auditLog) consent.auditLog = [];
  consent.auditLog.push({
    action: "unsuppressed",
    performedBy: adminUsername,
    timestamp: new Date(),
    reason: reason?.trim() || "Suppression removed by admin",
  });

  await consent.save();
  logger.info({ email: normalized, adminUsername }, "[Consent] Email address suppression lifted");
  return consent.toObject();
}

/**
 * Public website newsletter signup handler.
 * Enforces rate limiting, normalization, duplicate prevention, and opt-out/suppression protection.
 */
export async function subscribeToNewsletter(email: string, name?: string): Promise<{
  success: boolean;
  message: string;
  alreadySubscribed?: boolean;
}> {
  const normalized = email.toLowerCase().trim();
  if (!normalized || !normalized.includes("@") || !normalized.includes(".")) {
    throw new CampaignError("Please provide a valid email address.", 400, "INVALID_EMAIL");
  }

  let consent = await SubscriberConsentModel.findOne({ email: normalized });

  // 1. If address is suppressed, preserve suppression protection and return safe acknowledgement
  if (consent?.suppressed || consent?.status === "suppressed") {
    logger.info({ email: normalized }, "[Newsletter] Signup attempted for suppressed email; protection preserved");
    return {
      success: true,
      message: "Thank you for subscribing! Check your inbox for updates.",
    };
  }

  // 2. If address was previously unsubscribed, DO NOT silently resubscribe!
  if (consent?.status === "unsubscribed" || (!consent?.subscribed && consent?.unsubscribedAt)) {
    logger.info({ email: normalized }, "[Newsletter] Signup attempted for unsubscribed email; opt-out preserved");
    return {
      success: true,
      message: "Thank you for your interest! Your email is recorded in our system.",
    };
  }

  // 3. If already subscribed, return friendly duplicate status
  if (consent?.status === "subscribed" && consent?.subscribed) {
    return {
      success: true,
      alreadySubscribed: true,
      message: "You are already subscribed to the Escora newsletter!",
    };
  }

  // 4. Record genuine explicit subscription consent
  const newToken = consent?.token || crypto.randomBytes(24).toString("hex");
  if (!consent) {
    consent = new SubscriberConsentModel({
      email: normalized,
      name: name?.trim() || null,
      status: "subscribed",
      subscribed: true,
      token: newToken,
      source: "website_newsletter",
      consentDate: new Date(),
      consentMethod: "web_footer_form",
      auditLog: [
        {
          action: "subscribed",
          performedBy: "customer",
          timestamp: new Date(),
          source: "website_newsletter",
          method: "web_footer_form",
          reason: "Public website newsletter subscription",
        },
      ],
    });
  } else {
    consent.status = "subscribed";
    consent.subscribed = true;
    consent.source = "website_newsletter";
    consent.consentDate = new Date();
    consent.consentMethod = "web_footer_form";
    if (name?.trim() && !consent.name) consent.name = name.trim();
    if (!consent.auditLog) consent.auditLog = [];
    consent.auditLog.push({
      action: "subscribed",
      performedBy: "customer",
      timestamp: new Date(),
      source: "website_newsletter",
      method: "web_footer_form",
      reason: "Public website newsletter subscription",
    });
  }

  await consent.save();
  logger.info({ email: normalized }, "[Newsletter] New subscriber consent recorded");

  return {
    success: true,
    message: "Thank you for subscribing! Welcome to Escora slow journeys.",
  };
}

/**
 * Processes optional marketing consent from public contact/enquiry/booking forms.
 * - When marketingConsent === true: Records explicit consent IF NOT suppressed AND NOT unsubscribed.
 * - When marketingConsent is falsy or omitted: Does NOT grant consent. If new record is created, status is 'not_subscribed'.
 * - Never silently overrides an existing Unsubscribed or Suppressed status.
 */
export async function processPublicFormConsent(options: {
  email: string;
  name?: string;
  marketingConsent?: boolean;
  source: string;
}): Promise<void> {
  const normalized = options.email.toLowerCase().trim();
  if (!normalized || !normalized.includes("@")) return;

  const consent = await SubscriberConsentModel.findOne({ email: normalized });

  if (options.marketingConsent === true) {
    // If contact is already suppressed or unsubscribed, NEVER silently override!
    if (consent) {
      if (consent.suppressed || consent.status === "suppressed") {
        logger.info(
          { email: normalized },
          "[Consent] Public form submitted with consent checkbox, but address is suppressed; suppression preserved"
        );
        return;
      }
      if (consent.status === "unsubscribed" || (!consent.subscribed && consent.unsubscribedAt)) {
        logger.info(
          { email: normalized },
          "[Consent] Public form submitted with consent checkbox, but contact is unsubscribed; opt-out preserved"
        );
        return;
      }
      // If already subscribed or not_subscribed, update with fresh consent
      consent.status = "subscribed";
      consent.subscribed = true;
      consent.consentDate = new Date();
      consent.consentMethod = "contact_form_checkbox";
      consent.source = options.source;
      if (options.name?.trim() && !consent.name) consent.name = options.name.trim();
      if (!consent.auditLog) consent.auditLog = [];
      consent.auditLog.push({
        action: "subscribed",
        performedBy: "customer",
        timestamp: new Date(),
        source: options.source,
        method: "contact_form_checkbox",
        reason: "Public contact form marketing consent checkbox selected",
      });
      await consent.save();
    } else {
      // Create new explicit subscription
      const newToken = crypto.randomBytes(24).toString("hex");
      await SubscriberConsentModel.create({
        email: normalized,
        name: options.name?.trim() || null,
        status: "subscribed",
        subscribed: true,
        token: newToken,
        source: options.source,
        consentDate: new Date(),
        consentMethod: "contact_form_checkbox",
        auditLog: [
          {
            action: "subscribed",
            performedBy: "customer",
            timestamp: new Date(),
            source: options.source,
            method: "contact_form_checkbox",
            reason: "Public contact form marketing consent checkbox selected",
          },
        ],
      });
    }
    logger.info({ email: normalized, source: options.source }, "[Consent] Explicit marketing consent recorded from public form");
  } else {
    // marketingConsent is false or omitted
    // If contact does not exist in consent table yet, record as NOT SUBSCRIBED
    if (!consent) {
      const newToken = crypto.randomBytes(24).toString("hex");
      try {
        await SubscriberConsentModel.create({
          email: normalized,
          name: options.name?.trim() || null,
          status: "not_subscribed",
          subscribed: false,
          token: newToken,
          source: options.source,
          unsubscribedAt: null,
        });
      } catch {
        // Race condition safe
      }
    }
  }
}

/**
 * Inspects relationships across the application for a given contact email.
 */
export async function inspectContactRelationships(email: string) {
  const normalized = email.toLowerCase().trim();
  if (!normalized) {
    throw new CampaignError("Invalid email address", 400, "INVALID_EMAIL");
  }

  const emailRegex = new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

  const [enquiriesCount, ordersCount, invoicesCount, groups, deliveriesCount, consent] = await Promise.all([
    EnquiryModel.countDocuments({ email: emailRegex }),
    OrderModel.countDocuments({ guestEmail: emailRegex }),
    InvoiceModel.countDocuments({ customerEmail: emailRegex }),
    AudienceGroupModel.find({ "members.email": normalized, isArchived: { $ne: true } })
      .select("id name")
      .lean(),
    CampaignModel.countDocuments({ "deliveries.recipientEmail": emailRegex }),
    SubscriberConsentModel.findOne({ email: normalized }).lean(),
  ]);

  const hasFinancialOrBookingRecords = ordersCount > 0 || invoicesCount > 0;
  const canDelete = !hasFinancialOrBookingRecords;

  let message = "";
  if (hasFinancialOrBookingRecords) {
    message = `Contact cannot be safely deleted because active itinerary/financial records exist (${ordersCount} bookings/orders, ${invoicesCount} invoices). Financial and booking documents must be preserved for statutory compliance and accounting integrity. You can unsubscribe or suppress the email address instead.`;
  } else if (enquiriesCount > 0) {
    message = `Contact has ${enquiriesCount} enquiry record(s) and membership in ${groups.length} customer group(s). Safe to delete contact record.`;
  } else {
    message = "Contact has no associated order or invoice records and can be safely removed.";
  }

  return {
    email: normalized,
    enquiriesCount,
    ordersCount,
    invoicesCount,
    deliveriesCount,
    audienceGroups: groups.map((g) => ({ id: g.id, name: g.name })),
    hasFinancialOrBookingRecords,
    canDelete,
    isSuppressed: Boolean(consent?.suppressed),
    isOptedOut: Boolean(consent && !consent.subscribed),
    message,
  };
}

/**
 * Safely deletes a contact record, respecting financial record locks and preserving opt-out / suppression tombstones.
 */
export async function deleteContactRecordSafely(email: string, adminUsername: string) {
  const inspection = await inspectContactRelationships(email);
  if (!inspection.canDelete) {
    throw new CampaignError(inspection.message, 400, "CANNOT_DELETE_ACTIVE_RECORDS");
  }

  const normalized = inspection.email;
  const emailRegex = new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

  // 1. Remove from all Audience Group memberships
  const groupUpdateResult = await AudienceGroupModel.updateMany(
    { "members.email": normalized },
    { $pull: { members: { email: normalized } } }
  );

  // 1b. Remove unconverted enquiry records
  const enqResult = await EnquiryModel.deleteMany({ email: emailRegex, status: { $ne: "converted" } });

  // 2. For subscriber consent:
  // If the contact is suppressed or unsubscribed, PRESERVE the tombstone to prevent future accidental marketing!
  const consent = await SubscriberConsentModel.findOne({ email: normalized });
  let consentPreserved = false;
  if (consent) {
    if (consent.suppressed || !consent.subscribed) {
      if (!consent.auditLog) consent.auditLog = [];
      consent.auditLog.push({
        action: "deleted",
        performedBy: adminUsername,
        timestamp: new Date(),
        reason:
          "Contact record detached from customer groups; suppression/opt-out status preserved as protective tombstone",
      });
      consent.updatedBy = adminUsername;
      await consent.save();
      consentPreserved = true;
    } else {
      await SubscriberConsentModel.deleteOne({ email: normalized });
    }
  }

  logger.info(
    {
      email: normalized,
      adminUsername,
      groupsUpdated: groupUpdateResult.modifiedCount,
      enquiriesRemoved: enqResult.deletedCount,
      consentPreserved,
    },
    "[Consent] Contact record safely removed"
  );

  return {
    success: true,
    email: normalized,
    groupsUpdated: groupUpdateResult.modifiedCount,
    enquiriesRemoved: enqResult.deletedCount,
    consentPreserved,
    message: consentPreserved
      ? "Contact removed from customer groups and enquiry listings. Marketing opt-out/suppression protection is preserved to safeguard the customer."
      : "Contact record, enquiries, and consent entry successfully removed.",
  };
}

/**
 * Audits existing consent records for anomalies (such as "Opted Out Guest" with subscribed: true)
 * and reconciles them to canonical opt-out status with an audit trail.
 */
export async function auditAndFixConsentInconsistencies(adminUsername: string) {
  const inconsistent = await SubscriberConsentModel.find({
    subscribed: true,
    $or: [{ name: /opted\s*out/i }, { email: /^optout\./i }, { source: /opt_out/i }],
  });

  const fixed: Array<{ email: string; name?: string | null; previousStatus: string }> = [];

  for (const record of inconsistent) {
    record.subscribed = false;
    record.unsubscribedAt = record.unsubscribedAt || new Date();
    record.source = "audit_reconciliation";
    record.updatedBy = adminUsername;

    if (!record.auditLog) record.auditLog = [];
    record.auditLog.push({
      action: "reconciled",
      performedBy: adminUsername,
      timestamp: new Date(),
      reason:
        "Audit reconciliation: Corrected inconsistent consent status from legacy auto-subscription of opt-out test fixture",
    });

    await record.save();
    fixed.push({
      email: record.email,
      name: record.name,
      previousStatus: "subscribed",
    });
  }

  logger.info({ count: fixed.length, adminUsername }, "[Consent] Audit reconciliation completed");
  return {
    totalEvaluated: inconsistent.length,
    totalFixed: fixed.length,
    fixedRecords: fixed,
  };
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

  const {
    eligible,
    totalSelected,
    activeSubscribers,
    unsubscribedCount,
    excludedNotSubscribed,
    excludedUnsubscribed,
    excludedSuppressed,
  } = await resolveAudience({
    type: "audience_group",
    groupId: group.id,
  } as any);

  return {
    group,
    groupId: String(group.id),
    name: group.name,
    type: group.type,
    eligibleRecipients: activeSubscribers,
    eligibleCount: activeSubscribers,
    totalMatching: totalSelected,
    totalSelected,
    activeSubscribers,
    subscribedCount: activeSubscribers,
    notSubscribedCount: excludedNotSubscribed,
    unsubscribedCount,
    unsubscribedExcluded: unsubscribedCount,
    suppressedCount: excludedSuppressed,
    excludedNotSubscribed,
    excludedUnsubscribed,
    excludedSuppressed,
    sampleRecipients: eligible.slice(0, 50).map((r) => ({
      name: r.name,
      email: r.email,
      source: r.source,
      isSubscribed: r.isSubscribed,
      isSuppressed: r.isSuppressed,
      consentStatus: r.consentStatus,
      isEligible: r.isEligible,
      eligibilityReason: r.eligibilityReason,
      exclusionReason: r.exclusionReason,
    })),
  };
}

/**
 * Migrates legacy campaign approval states (pending_approval, approved, rejected) to draft.
 * Safely resolves obsolete states without accidentally triggering sends.
 */
export async function migrateLegacyCampaignApprovalStates(): Promise<number> {
  const result = await CampaignModel.updateMany(
    { status: { $in: ["pending_approval", "approved", "rejected"] } },
    {
      $set: {
        status: "draft",
        updatedAt: new Date(),
      },
    }
  );
  if (result.modifiedCount > 0) {
    logger.info(
      { modifiedCount: result.modifiedCount },
      "[Campaign] Migrated legacy pending_approval/approved/rejected campaigns safely to draft"
    );
  }
  return result.modifiedCount;
}


