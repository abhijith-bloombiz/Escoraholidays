import crypto from "node:crypto";
import {
  WhatsAppMessageModel,
  WhatsAppConsentModel,
  WhatsAppSettingModel,
  getNextSequence,
  type IWhatsAppMessage,
  type IWhatsAppConsent,
  type IWhatsAppSetting,
  type WhatsAppMessageType,
  type WhatsAppMessageCategory,
  type WhatsAppDeliveryStatus,
  type IEnquiry,
  type IOrder,
  type IItinerary,
  type IInvoice,
} from "@workspace/db";
import { config } from "../../config/env";
import { logger } from "../../lib/logger";
import { getWhatsAppProvider } from "./provider-factory";
import { normalizePhoneNumber } from "./types";

export class WhatsAppServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code: string = "WHATSAPP_SERVICE_ERROR"
  ) {
    super(message);
    this.name = "WhatsAppServiceError";
  }
}

/**
 * Cache settings in-memory for 10 seconds to reduce DB round-trips
 */
let cachedSettings: IWhatsAppSetting | null = null;
let lastSettingsFetch = 0;

export async function getWhatsAppSettings(): Promise<IWhatsAppSetting> {
  const now = Date.now();
  if (cachedSettings && now - lastSettingsFetch < 10000) {
    return cachedSettings;
  }

  try {
    const existing = await WhatsAppSettingModel.findOne({ id: "default" }).lean();
    if (existing) {
      cachedSettings = existing as IWhatsAppSetting;
      lastSettingsFetch = now;
      return cachedSettings;
    }

    const defaults: IWhatsAppSetting = {
      id: "default",
      provider: config.whatsappProvider,
      enableEnquiryAcknowledgement: config.enableWhatsappEnquiryAcknowledgement,
      enableBookingConfirmation: config.enableWhatsappBookingConfirmation,
      enableItineraryUpdates: config.enableWhatsappItineraryUpdates,
      enablePaymentReceipts: config.enableWhatsappPaymentReceipts,
      enablePaymentReminders: config.enableWhatsappPaymentReminders,
      enablePreTripReminders: config.enableWhatsappPreTripReminders,
      enablePostTripFeedback: config.enableWhatsappPostTripFeedback,
      enableEnquiryFollowups: false,
      enableDocumentDelivery: config.enableWhatsappDocumentDelivery,
      simulateAutoDelivery: config.whatsappSimulateAutoDeliver,
      enquiryFollowupDelayHours: 24,
      postTripFeedbackDelayHours: 24,
      updatedAt: new Date(),
    };

    const created = await WhatsAppSettingModel.create(defaults);
    cachedSettings = created.toObject();
    lastSettingsFetch = now;
    return cachedSettings;
  } catch (err) {
    logger.warn({ err }, "[WhatsAppService] Failed to fetch settings from DB, using config defaults");
    return {
      id: "default",
      provider: config.whatsappProvider,
      enableEnquiryAcknowledgement: config.enableWhatsappEnquiryAcknowledgement,
      enableBookingConfirmation: config.enableWhatsappBookingConfirmation,
      enableItineraryUpdates: config.enableWhatsappItineraryUpdates,
      enablePaymentReceipts: config.enableWhatsappPaymentReceipts,
      enablePaymentReminders: config.enableWhatsappPaymentReminders,
      enablePreTripReminders: config.enableWhatsappPreTripReminders,
      enablePostTripFeedback: config.enableWhatsappPostTripFeedback,
      enableEnquiryFollowups: false,
      enableDocumentDelivery: config.enableWhatsappDocumentDelivery,
      simulateAutoDelivery: config.whatsappSimulateAutoDeliver,
      enquiryFollowupDelayHours: 24,
      postTripFeedbackDelayHours: 24,
      updatedAt: new Date(),
    };
  }
}

export async function updateWhatsAppSettings(
  updates: Partial<IWhatsAppSetting>,
  staffUsername: string = "Admin"
): Promise<IWhatsAppSetting> {
  const settings = await WhatsAppSettingModel.findOneAndUpdate(
    { id: "default" },
    { $set: { ...updates, updatedBy: staffUsername, updatedAt: new Date() } },
    { new: true, upsert: true }
  ).lean();

  cachedSettings = settings as IWhatsAppSetting;
  lastSettingsFetch = Date.now();
  logger.info({ updatedBy: staffUsername }, "[WhatsAppService] Updated WhatsApp automation settings");
  return cachedSettings;
}

/**
 * Checks customer WhatsApp consent & opt-out rules.
 * STRICT POLICY:
 * 1. Submitting an enquiry or booking NEVER grants marketing consent.
 * 2. If message is marketing, explicit opt-in (marketingConsent === true) is mandatory.
 * 3. If customer has requested transactional opt-out, ALL messages are blocked.
 */
export async function verifyWhatsAppConsent(
  phone: string,
  category: WhatsAppMessageCategory
): Promise<{ allowed: boolean; reason?: string; status: WhatsAppDeliveryStatus }> {
  const norm = normalizePhoneNumber(phone);
  if (!norm.valid) {
    return {
      allowed: false,
      reason: norm.error || "Invalid phone number format",
      status: "skipped_invalid_phone",
    };
  }

  const consent = await WhatsAppConsentModel.findOne({ phone: norm.normalized }).lean();

  // If customer explicitly opted out of all WhatsApp communications:
  if (consent?.transactionalOptOut) {
    return {
      allowed: false,
      reason: "Customer has explicitly opted out of all WhatsApp messages.",
      status: "skipped_opted_out",
    };
  }

  // If message category is marketing, require explicit marketing opt-in:
  if (category === "marketing") {
    if (!consent || !consent.marketingConsent) {
      return {
        allowed: false,
        reason:
          "Marketing WhatsApp message blocked: Customer has not provided explicit marketing consent. In accordance with WhatsApp policies and Escora privacy standards, submitting an enquiry or booking does not grant marketing consent.",
        status: "skipped_no_consent",
      };
    }
  }

  return { allowed: true, status: "pending" };
}

export interface SendWhatsAppMessageOptions {
  recipientPhone: string;
  recipientName: string;
  messageType: WhatsAppMessageType;
  category: WhatsAppMessageCategory;
  trigger: string;
  relatedType: "enquiry" | "order" | "itinerary" | "invoice" | "custom";
  relatedId: number;
  bodyText: string;
  templateName?: string;
  templateLanguage?: string;
  templateVariables?: Record<string, any>;
  idempotencyKey: string;
  metadata?: Record<string, any>;
}

/**
 * Core dispatch function for sending WhatsApp messages.
 * Enforces:
 * 1. Phone number normalization
 * 2. Strict idempotency (never duplicate sends)
 * 3. Customer consent & opt-out safeguards
 * 4. Automation setting toggles
 * 5. Provider abstraction (Mock vs Cloud API)
 * 6. Audit logging & simulated delivery progression
 */
export async function sendWhatsAppMessage(
  options: SendWhatsAppMessageOptions
): Promise<IWhatsAppMessage> {
  const {
    recipientPhone,
    recipientName,
    messageType,
    category,
    trigger,
    relatedType,
    relatedId,
    bodyText,
    templateName,
    templateLanguage = "en",
    templateVariables,
    idempotencyKey,
    metadata = {},
  } = options;

  // 1. Idempotency Check: Prevent duplicate sends
  const existing = await WhatsAppMessageModel.findOne({ idempotencyKey }).lean();
  if (existing) {
    if (["simulated", "sent", "delivered", "read"].includes(existing.status)) {
      logger.info(
        { idempotencyKey, messageId: existing.id, status: existing.status },
        "[WhatsAppService] Idempotent hit: message already dispatched, returning existing record"
      );
      return existing as IWhatsAppMessage;
    }
  }

  // 2. Normalize recipient phone number
  const norm = normalizePhoneNumber(recipientPhone);
  if (!norm.valid) {
    logger.warn({ recipientPhone, error: norm.error }, "[WhatsAppService] Recipient phone invalid");
    const nextId = existing ? existing.id : await getNextSequence("whatsapp_messages");
    const saved = await WhatsAppMessageModel.findOneAndUpdate(
      { idempotencyKey },
      {
        $set: {
          id: nextId,
          recipientPhone: recipientPhone || "invalid",
          recipientName,
          messageType,
          category,
          trigger,
          relatedType,
          relatedId,
          bodyText,
          templateName,
          templateLanguage,
          templateVariables,
          provider: "mock",
          status: "skipped_invalid_phone",
          error: norm.error || "Invalid phone number",
          idempotencyKey,
          metadata,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, new: true }
    ).lean();
    return saved as IWhatsAppMessage;
  }

  const normalizedPhone = norm.normalized;

  // 3. Automation Toggle Check
  const settings = await getWhatsAppSettings();
  const isTypeEnabled = checkTypeEnabled(messageType, settings);
  if (!isTypeEnabled) {
    logger.info(
      { messageType },
      `[WhatsAppService] Automation type "${messageType}" is disabled in settings. Skipping dispatch.`
    );
    const nextId = existing ? existing.id : await getNextSequence("whatsapp_messages");
    const saved = await WhatsAppMessageModel.findOneAndUpdate(
      { idempotencyKey },
      {
        $set: {
          id: nextId,
          recipientPhone: normalizedPhone,
          recipientName,
          messageType,
          category,
          trigger,
          relatedType,
          relatedId,
          bodyText,
          templateName,
          templateLanguage,
          templateVariables,
          provider: settings.provider,
          status: "skipped_disabled",
          error: `Automation type "${messageType}" is disabled in WhatsApp settings.`,
          idempotencyKey,
          metadata,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, new: true }
    ).lean();
    return saved as IWhatsAppMessage;
  }

  // 4. Consent & Opt-Out Safeguard
  const consentCheck = await verifyWhatsAppConsent(normalizedPhone, category);
  if (!consentCheck.allowed) {
    logger.warn(
      { phone: normalizedPhone, category, status: consentCheck.status, reason: consentCheck.reason },
      "[WhatsAppService] WhatsApp message blocked by consent safeguard"
    );
    const nextId = existing ? existing.id : await getNextSequence("whatsapp_messages");
    const saved = await WhatsAppMessageModel.findOneAndUpdate(
      { idempotencyKey },
      {
        $set: {
          id: nextId,
          recipientPhone: normalizedPhone,
          recipientName,
          messageType,
          category,
          trigger,
          relatedType,
          relatedId,
          bodyText,
          templateName,
          templateLanguage,
          templateVariables,
          provider: settings.provider,
          status: consentCheck.status,
          error: consentCheck.reason,
          idempotencyKey,
          metadata,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, new: true }
    ).lean();
    return saved as IWhatsAppMessage;
  }

  // 5. Dispatch via Active Provider (Mock by default)
  const provider = getWhatsAppProvider();
  let sendResult;
  try {
    sendResult = await provider.sendMessage({
      to: normalizedPhone,
      recipientName,
      type: templateName ? "template" : "text",
      templateName,
      templateLanguage,
      templateVariables,
      text: bodyText,
      idempotencyKey,
      metadata,
    });
  } catch (err: any) {
    logger.error({ err: err?.message, phone: normalizedPhone }, "[WhatsAppService] Provider dispatch error");
    sendResult = {
      success: false,
      provider: provider.name,
      providerMessageId: `mock_error_${Date.now()}`,
      providerStatus: "failed" as const,
      rawResponse: { error: err?.message },
      error: err?.message || "Provider send failed",
      sentAt: new Date(),
    };
  }

  // 6. Record in Database
  const nextId = existing ? existing.id : await getNextSequence("whatsapp_messages");
  const finalStatus: WhatsAppDeliveryStatus = sendResult.success
    ? (sendResult.providerStatus as WhatsAppDeliveryStatus)
    : "failed";

  const savedRecord = await WhatsAppMessageModel.findOneAndUpdate(
    { idempotencyKey },
    {
      $set: {
        id: nextId,
        recipientPhone: normalizedPhone,
        recipientName,
        messageType,
        category,
        trigger,
        relatedType,
        relatedId,
        bodyText,
        templateName,
        templateLanguage,
        templateVariables,
        provider: sendResult.provider,
        providerMessageId: sendResult.providerMessageId,
        providerStatus: sendResult.providerStatus,
        providerResponse: sendResult.rawResponse,
        status: finalStatus,
        error: sendResult.error || null,
        sentAt: sendResult.sentAt,
        metadata,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true, new: true }
  ).lean();

  const savedMessage = savedRecord as IWhatsAppMessage;

  // 7. In Mock mode with simulateAutoDelivery enabled, schedule simulated delivered & read state transitions
  if (
    provider.name === "mock" &&
    settings.simulateAutoDelivery &&
    finalStatus === "simulated"
  ) {
    simulateDeliveryLifecycle(savedMessage.id);
  }

  return savedMessage;
}

/**
 * Simulates real-time delivery transitions in mock mode for testing and admin dashboard observation.
 */
function simulateDeliveryLifecycle(messageId: number): void {
  // Simulate delivered after 2 seconds
  setTimeout(async () => {
    try {
      await WhatsAppMessageModel.findOneAndUpdate(
        { id: messageId, status: "simulated" },
        {
          $set: {
            status: "delivered",
            providerStatus: "delivered",
            deliveredAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );
    } catch {
      // ignore
    }
  }, 2000);

  // Simulate read after 5 seconds
  setTimeout(async () => {
    try {
      await WhatsAppMessageModel.findOneAndUpdate(
        { id: messageId, status: { $in: ["simulated", "delivered"] } },
        {
          $set: {
            status: "read",
            providerStatus: "read",
            readAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );
    } catch {
      // ignore
    }
  }, 5000);
}

function checkTypeEnabled(messageType: WhatsAppMessageType, settings: IWhatsAppSetting): boolean {
  switch (messageType) {
    case "enquiry_acknowledgement":
      return settings.enableEnquiryAcknowledgement;
    case "booking_confirmation":
      return settings.enableBookingConfirmation;
    case "itinerary_update":
    case "final_itinerary_delivery":
      return settings.enableItineraryUpdates;
    case "payment_receipt":
      return settings.enablePaymentReceipts;
    case "payment_reminder":
      return settings.enablePaymentReminders;
    case "pre_trip_reminder":
      return settings.enablePreTripReminders;
    case "post_trip_feedback":
      return settings.enablePostTripFeedback;
    case "enquiry_followup":
      return settings.enableEnquiryFollowups;
    case "document_delivery":
      return settings.enableDocumentDelivery;
    default:
      return true;
  }
}

// ==============================================================================
// Workflow Triggers (Enquiry, Booking, Itinerary, Invoice, Documents)
// ==============================================================================

/**
 * Triggered upon new contact enquiry submission.
 * Sends an immediate, slow-luxury concierge greeting to the guest on WhatsApp (in mock mode).
 * IMPORTANT: Does NOT grant marketing consent.
 */
export async function triggerWhatsAppEnquiryAcknowledgement(
  enquiry: IEnquiry
): Promise<IWhatsAppMessage | null> {
  if (!enquiry.phone) {
    return null;
  }

  const idempotencyKey = `wa_ack_enq_${enquiry.id}`;
  const bodyText =
`Namaste *${enquiry.name}*,

Thank you for inquiring with Escora Holidays. We have received your message regarding your journey to Kerala (Ref: #ENQ-${enquiry.id}).

A private travel designer is reviewing your preferences and will craft a bespoke, slow-luxury travel plan tailored to you.

If you have additional notes or questions, you can reply directly to this message.

Warm regards,
Escora Holidays Concierge
www.escoraholidays.com`;

  try {
    return await sendWhatsAppMessage({
      recipientPhone: enquiry.phone,
      recipientName: enquiry.name,
      messageType: "enquiry_acknowledgement",
      category: "transactional",
      trigger: "enquiry_created",
      relatedType: "enquiry",
      relatedId: enquiry.id,
      bodyText,
      templateName: "escora_enquiry_acknowledgement_v1",
      templateVariables: {
        guest_name: enquiry.name,
        enquiry_id: enquiry.id,
      },
      idempotencyKey,
      metadata: { enquiryEmail: enquiry.email },
    });
  } catch (err: any) {
    logger.error({ err: err?.message, enquiryId: enquiry.id }, "[WhatsAppService] Enquiry ack trigger failed");
    return null;
  }
}

/**
 * Triggered when a booking order is confirmed.
 */
export async function triggerWhatsAppBookingConfirmation(
  order: IOrder
): Promise<IWhatsAppMessage | null> {
  if (!order.guestPhone) {
    return null;
  }

  // Business verification: booking confirmation only applies to confirmed orders
  if (order.status !== "confirmed") {
    logger.info(
      { orderId: order.id, status: order.status },
      "[WhatsAppService] Order is not confirmed; skipping WhatsApp booking confirmation"
    );
    return null;
  }

  const idempotencyKey = `wa_conf_ord_${order.id}`;
  const journeyName = order.packageName || "Kerala Signature Journey";
  const dates = order.travelDate
    ? `${order.travelDate}${order.departureDate ? ` to ${order.departureDate}` : ""}`
    : "Dates as confirmed";

  const bodyText =
`Namaste *${order.guestName}*,

We are delighted to confirm your journey with Escora Holidays (Booking Ref: #ESC-${order.id}).

✨ *Journey*: ${journeyName}
📅 *Dates*: ${dates}
👥 *Guests*: ${order.guestCount || 2}

Your personal travel designer has reserved your sanctuary stays. Your finalized day-by-day itinerary and concierge details are being assembled.

Warm regards,
Escora Holidays Concierge`;

  try {
    return await sendWhatsAppMessage({
      recipientPhone: order.guestPhone,
      recipientName: order.guestName,
      messageType: "booking_confirmation",
      category: "transactional",
      trigger: "order_confirmed",
      relatedType: "order",
      relatedId: order.id,
      bodyText,
      templateName: "escora_booking_confirmation_v1",
      templateVariables: {
        guest_name: order.guestName,
        booking_id: order.id,
        journey_name: journeyName,
        travel_dates: dates,
      },
      idempotencyKey,
      metadata: { orderEmail: order.guestEmail },
    });
  } catch (err: any) {
    logger.error({ err: err?.message, orderId: order.id }, "[WhatsAppService] Booking confirmation trigger failed");
    return null;
  }
}

/**
/**
 * Compares two itinerary snapshots to identify customer-facing changes.
 */
function detectWhatsAppItineraryChanges(current: IItinerary, previous?: Partial<IItinerary>): string[] {
  if (!previous) return [];
  const changes: string[] = [];

  if (previous.title !== undefined && previous.title.trim() !== current.title.trim()) {
    changes.push(`Journey title updated to "${current.title}"`);
  }
  if (previous.destination !== undefined && (previous.destination || "").trim() !== (current.destination || "").trim()) {
    changes.push(`Destinations revised to "${current.destination || "Kerala"}"`);
  }
  const prevStart = previous.startDate || "";
  const prevEnd = previous.endDate || "";
  const currStart = current.startDate || "";
  const currEnd = current.endDate || "";
  if ((previous.startDate !== undefined && prevStart !== currStart) || (previous.endDate !== undefined && prevEnd !== currEnd)) {
    const newDates = [currStart, currEnd].filter(Boolean).join(" to ");
    changes.push(`Confirmed travel dates updated: ${newDates || "Flexible"}`);
  }
  if (previous.days !== undefined && previous.days !== current.days) {
    changes.push("Day-by-day experience schedule refined");
  }
  if (previous.stays !== undefined && previous.stays !== current.stays) {
    changes.push("Curated hotel and sanctuary stays updated");
  }
  if (previous.pricing !== undefined && previous.pricing !== current.pricing) {
    changes.push("Journey pricing and package terms adjusted");
  }
  if (previous.inclusions !== undefined && previous.inclusions !== current.inclusions) {
    changes.push("Curated inclusions updated");
  }
  if (previous.exclusions !== undefined && previous.exclusions !== current.exclusions) {
    changes.push("Trip exclusions updated");
  }
  if (previous.transportation !== undefined && previous.transportation !== current.transportation) {
    changes.push("Private transport arrangements revised");
  }

  return changes;
}

/**
 * Triggered when a confirmed itinerary has meaningful customer-facing changes made.
 * Avoids sending for unconfirmed drafts or repeated saves of unchanged itineraries.
 */
export async function triggerWhatsAppItineraryUpdate(
  itinerary: IItinerary,
  previousItinerary?: Partial<IItinerary>
): Promise<IWhatsAppMessage | null> {
  if (!itinerary.customerPhone) {
    return null;
  }

  // Business verification: only confirmed itineraries receive customer update notifications
  if (itinerary.status !== "confirmed") {
    logger.info(
      { itineraryId: itinerary.id, status: itinerary.status },
      "[WhatsAppService] Itinerary is not confirmed; skipping WhatsApp itinerary update"
    );
    return null;
  }

  let idempotencyKey: string;

  // If previousItinerary was provided, check for meaningful customer-facing changes
  if (previousItinerary) {
    const changes = detectWhatsAppItineraryChanges(itinerary, previousItinerary);
    if (changes.length === 0) {
      logger.info(
        { itineraryId: itinerary.id },
        "[WhatsAppService] No meaningful customer-facing changes detected; skipping WhatsApp itinerary update"
      );
      return null;
    }
    const changesHash = crypto.createHash("sha256").update(changes.sort().join("|")).digest("hex").slice(0, 10);
    idempotencyKey = `wa_itin_upd_${itinerary.id}_${changesHash}`;
  } else {
    // Fallback when previous snapshot is not supplied
    idempotencyKey = `wa_itin_upd_${itinerary.id}_${itinerary.updatedAt?.getTime?.() || "v1"}`;
  }

  const publicUrl = config.publicUrl.replace(/\/$/, "");
  const shareLink = `${publicUrl}/itineraries/share/${itinerary.shareToken}`;

  const bodyText =
`Namaste *${itinerary.customerName}*,

Your travel curator has updated your personalized itinerary for *"${itinerary.title}"*.

✨ View your revised itinerary:
${shareLink}

Warm regards,
Escora Holidays Concierge`;

  try {
    return await sendWhatsAppMessage({
      recipientPhone: itinerary.customerPhone,
      recipientName: itinerary.customerName,
      messageType: "itinerary_update",
      category: "transactional",
      trigger: "itinerary_updated",
      relatedType: "itinerary",
      relatedId: itinerary.id,
      bodyText,
      templateName: "escora_itinerary_update_v1",
      templateVariables: {
        customer_name: itinerary.customerName,
        itinerary_title: itinerary.title,
        share_url: shareLink,
      },
      idempotencyKey,
      metadata: { shareToken: itinerary.shareToken },
    });
  } catch (err: any) {
    logger.error({ err: err?.message, itineraryId: itinerary.id }, "[WhatsAppService] Itinerary update trigger failed");
    return null;
  }
}

/**
 * Triggered when an invoice payment receipt is recorded.
 */
export async function triggerWhatsAppPaymentReceipt(
  invoice: IInvoice
): Promise<IWhatsAppMessage | null> {
  if (!invoice.customerPhone) {
    return null;
  }

  // Business verification: only trigger after payment is settled and non-cancelled
  if (invoice.status === "cancelled" || !invoice.paidAmount || invoice.paidAmount <= 0) {
    logger.info(
      { invoiceId: invoice.id, status: invoice.status, paidAmount: invoice.paidAmount },
      "[WhatsAppService] Invoice is cancelled or has zero paid amount; skipping WhatsApp payment receipt"
    );
    return null;
  }

  const idempotencyKey = `wa_inv_rcpt_${invoice.id}_${invoice.paidAmount}`;
  const bodyText =
`Namaste *${invoice.customerName}*,

We gratefully acknowledge receipt of your payment for Invoice *#${invoice.invoiceNumber}*.

💳 Amount Paid: INR ${invoice.paidAmount?.toLocaleString("en-IN") || 0}
💰 Remaining Balance: INR ${invoice.balanceDue?.toLocaleString("en-IN") || 0}

Thank you for choosing Escora Holidays.

Warm regards,
Escora Holidays Accounts & Concierge`;

  try {
    return await sendWhatsAppMessage({
      recipientPhone: invoice.customerPhone,
      recipientName: invoice.customerName,
      messageType: "payment_receipt",
      category: "transactional",
      trigger: "payment_received",
      relatedType: "invoice",
      relatedId: invoice.id,
      bodyText,
      templateName: "escora_payment_receipt_v1",
      templateVariables: {
        customer_name: invoice.customerName,
        invoice_number: invoice.invoiceNumber,
        paid_amount: invoice.paidAmount,
        balance_due: invoice.balanceDue,
      },
      idempotencyKey,
      metadata: { invoiceNumber: invoice.invoiceNumber },
    });
  } catch (err: any) {
    logger.error({ err: err?.message, invoiceId: invoice.id }, "[WhatsAppService] Payment receipt trigger failed");
    return null;
  }
}

/**
 * Triggered when travel documents or vouchers are delivered.
 */
export async function triggerWhatsAppDocumentDelivery(
  order: IOrder,
  documentTitle: string,
  downloadUrl?: string
): Promise<IWhatsAppMessage | null> {
  if (!order.guestPhone) {
    return null;
  }

  // Business verification: travel documents must only be delivered for confirmed or completed bookings
  if (order.status !== "confirmed" && order.status !== "completed") {
    logger.info(
      { orderId: order.id, status: order.status },
      "[WhatsAppService] Order is not confirmed or completed; skipping WhatsApp document delivery"
    );
    return null;
  }

  if (!documentTitle || !documentTitle.trim()) {
    return null;
  }

  const idempotencyKey = `wa_doc_${order.id}_${crypto.createHash("md5").update(documentTitle.trim()).digest("hex")}`;
  const bodyText =
`Namaste *${order.guestName}*,

Your travel documents for your upcoming Kerala journey (#ESC-${order.id}) have been issued.

📄 Document: *${documentTitle}*
${downloadUrl ? `🔗 Access: ${downloadUrl}\n` : ""}
We look forward to welcoming you to God's Own Country.

Warm regards,
Escora Holidays Concierge`;

  try {
    return await sendWhatsAppMessage({
      recipientPhone: order.guestPhone,
      recipientName: order.guestName,
      messageType: "document_delivery",
      category: "transactional",
      trigger: "document_delivered",
      relatedType: "order",
      relatedId: order.id,
      bodyText,
      templateName: "escora_document_delivery_v1",
      templateVariables: {
        guest_name: order.guestName,
        document_title: documentTitle,
        booking_id: order.id,
      },
      idempotencyKey,
      metadata: { documentTitle, downloadUrl },
    });
  } catch (err: any) {
    logger.error({ err: err?.message, orderId: order.id }, "[WhatsAppService] Document delivery trigger failed");
    return null;
  }
}

/**
 * Triggered when an invoice payment reminder is due.
 * Only sends if payment is genuinely outstanding and invoice is not paid/cancelled.
 */
export async function triggerWhatsAppPaymentReminder(
  invoice: IInvoice
): Promise<IWhatsAppMessage | null> {
  if (!invoice.customerPhone) {
    return null;
  }

  // Business verification: only trigger when payment is genuinely outstanding
  if (invoice.balanceDue <= 0 || invoice.status === "paid" || invoice.status === "cancelled") {
    logger.info(
      { invoiceId: invoice.id, status: invoice.status, balanceDue: invoice.balanceDue },
      "[WhatsAppService] Invoice has no balance due or is settled; skipping WhatsApp payment reminder"
    );
    return null;
  }

  const dueDateFormatted = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "Shortly";
  const idempotencyKey = `wa_pay_rem_${invoice.id}_${invoice.dueDate || "nodue"}_${invoice.balanceDue}`;

  const bodyText =
`Namaste *${invoice.customerName}*,

This is a gentle payment reminder from Escora Holidays for Invoice #${invoice.invoiceNumber}.

💳 *Outstanding Balance*: ₹${invoice.balanceDue.toLocaleString("en-IN")}
📅 *Due Date*: ${dueDateFormatted}
✨ *Total Amount*: ₹${invoice.totalAmount.toLocaleString("en-IN")}

To ensure uninterrupted travel arrangements and seamless sanctuary reservations, please arrange settlement prior to the due date.

Warm regards,
Escora Holidays Accounts Concierge`;

  try {
    return await sendWhatsAppMessage({
      recipientPhone: invoice.customerPhone,
      recipientName: invoice.customerName,
      messageType: "payment_reminder",
      category: "transactional",
      trigger: "payment_reminder_due",
      relatedType: "invoice",
      relatedId: invoice.id,
      bodyText,
      templateName: "escora_payment_reminder_v1",
      templateVariables: {
        customer_name: invoice.customerName,
        invoice_number: invoice.invoiceNumber,
        balance_due: invoice.balanceDue,
        due_date: dueDateFormatted,
      },
      idempotencyKey,
      metadata: { invoiceNumber: invoice.invoiceNumber, balanceDue: invoice.balanceDue },
    });
  } catch (err: any) {
    logger.error({ err: err?.message, invoiceId: invoice.id }, "[WhatsAppService] Payment reminder trigger failed");
    return null;
  }
}

/**
 * Triggered prior to guest arrival/departure.
 * Only triggers if booking is confirmed and travel date is set.
 */
export async function triggerWhatsAppPreTripReminder(
  order: IOrder
): Promise<IWhatsAppMessage | null> {
  if (!order.guestPhone) {
    return null;
  }

  // Business verification: order must be confirmed
  if (order.status !== "confirmed") {
    logger.info(
      { orderId: order.id, status: order.status },
      "[WhatsAppService] Order is not confirmed; skipping WhatsApp pre-trip reminder"
    );
    return null;
  }

  const travelDate = order.travelDate || "upcoming departure";
  const idempotencyKey = `wa_pre_trip_${order.id}_${order.travelDate || "notravel"}`;

  const bodyText =
`Namaste *${order.guestName}*,

Your private Kerala escape (#ESC-${order.id}) begins in just a few days!

🗓 *Departure Date*: ${travelDate}
🌿 *Curated Journey*: ${order.packageName || "Kerala Signature Sanctuary"}
👥 *Party*: ${order.guestCount || 2} guest(s)

Our private chauffeur and regional concierge are preparing for your arrival. Remember to carry light cottons, comfortable walking footwear, and rain gear if traveling during the monsoon harvest.

Warm regards,
Escora Holidays Concierge`;

  try {
    return await sendWhatsAppMessage({
      recipientPhone: order.guestPhone,
      recipientName: order.guestName,
      messageType: "pre_trip_reminder",
      category: "service_followup",
      trigger: "pre_trip_reminder_due",
      relatedType: "order",
      relatedId: order.id,
      bodyText,
      templateName: "escora_pre_trip_reminder_v1",
      templateVariables: {
        guest_name: order.guestName,
        booking_id: order.id,
        travel_date: travelDate,
      },
      idempotencyKey,
      metadata: { travelDate: order.travelDate },
    });
  } catch (err: any) {
    logger.error({ err: err?.message, orderId: order.id }, "[WhatsAppService] Pre-trip reminder trigger failed");
    return null;
  }
}

/**
 * Triggered after journey completion for slow-luxury feedback.
 * Only triggers if order is genuinely in completed state.
 */
export async function triggerWhatsAppPostTripFeedback(
  order: IOrder
): Promise<IWhatsAppMessage | null> {
  if (!order.guestPhone) {
    return null;
  }

  // Business verification: only trigger if order is completed
  if (order.status !== "completed") {
    logger.info(
      { orderId: order.id, status: order.status },
      "[WhatsAppService] Order is not completed; skipping WhatsApp post-trip feedback"
    );
    return null;
  }

  const idempotencyKey = `wa_post_trip_${order.id}`;
  const reviewUrl = config.feedbackReviewUrl || `${config.publicUrl.replace(/\/$/, "")}/contact`;

  const bodyText =
`Namaste *${order.guestName}*,

Welcome home from your Kerala journey with Escora Holidays (#ESC-${order.id}).

We hope your time in God's Own Country brought you peaceful moments, unhurried discoveries, and timeless memories.

✨ We would be deeply honored to hear your thoughts on your experience:
${reviewUrl}

Warm regards,
Escora Holidays Concierge
www.escoraholidays.com`;

  try {
    return await sendWhatsAppMessage({
      recipientPhone: order.guestPhone,
      recipientName: order.guestName,
      messageType: "post_trip_feedback",
      category: "service_followup",
      trigger: "post_trip_feedback_due",
      relatedType: "order",
      relatedId: order.id,
      bodyText,
      templateName: "escora_post_trip_feedback_v1",
      templateVariables: {
        guest_name: order.guestName,
        booking_id: order.id,
        review_url: reviewUrl,
      },
      idempotencyKey,
      metadata: { orderId: order.id },
    });
  } catch (err: any) {
    logger.error({ err: err?.message, orderId: order.id }, "[WhatsAppService] Post-trip feedback trigger failed");
    return null;
  }
}

// ==============================================================================
// Admin Query & Management Functions
// ==============================================================================

export interface ListWhatsAppMessagesFilter {
  status?: string;
  direction?: string;
  messageType?: string;
  relatedType?: string;
  relatedId?: number;
  phone?: string;
  search?: string;
  limit?: number;
}

export async function listWhatsAppMessages(filter: ListWhatsAppMessagesFilter = {}): Promise<IWhatsAppMessage[]> {
  const query: Record<string, any> = {};

  if (filter.status && filter.status !== "all") {
    query.status = filter.status;
  }
  if (filter.direction && filter.direction !== "all") {
    query.direction = filter.direction;
  }
  if (filter.messageType && filter.messageType !== "all") {
    query.messageType = filter.messageType;
  }
  if (filter.relatedType && filter.relatedType !== "all") {
    query.relatedType = filter.relatedType;
  }
  if (filter.relatedId !== undefined && !Number.isNaN(filter.relatedId)) {
    query.relatedId = filter.relatedId;
  }
  if (filter.phone) {
    query.recipientPhone = { $regex: filter.phone.trim(), $options: "i" };
  }
  if (filter.search && filter.search.trim()) {
    const s = filter.search.trim();
    query.$or = [
      { recipientPhone: { $regex: s, $options: "i" } },
      { recipientName: { $regex: s, $options: "i" } },
      { bodyText: { $regex: s, $options: "i" } },
      { idempotencyKey: { $regex: s, $options: "i" } },
    ];
  }

  const limit = Math.min(filter.limit || 100, 500);
  const rows = await WhatsAppMessageModel.find(query).sort({ createdAt: -1 }).limit(limit).lean();
  return rows as IWhatsAppMessage[];
}

export async function getWhatsAppMessageById(id: number): Promise<IWhatsAppMessage> {
  const row = await WhatsAppMessageModel.findOne({ id }).lean();
  if (!row) {
    throw new WhatsAppServiceError(`WhatsApp message #${id} not found`, 404, "NOT_FOUND");
  }
  return row as IWhatsAppMessage;
}

/**
 * Retries a failed or cancelled WhatsApp message without creating duplicates.
 */
export async function retryWhatsAppMessage(id: number): Promise<IWhatsAppMessage> {
  const existing = await WhatsAppMessageModel.findOne({ id }).lean();
  if (!existing) {
    throw new WhatsAppServiceError(`WhatsApp message #${id} not found`, 404, "NOT_FOUND");
  }

  if (["sent", "delivered", "read"].includes(existing.status)) {
    throw new WhatsAppServiceError(
      `Message #${id} is already in state "${existing.status}" and cannot be retried.`,
      400,
      "ALREADY_DELIVERED"
    );
  }

  // Re-verify consent
  const consent = await verifyWhatsAppConsent(existing.recipientPhone, existing.category);
  if (!consent.allowed) {
    const updated = await WhatsAppMessageModel.findOneAndUpdate(
      { id },
      {
        $set: {
          status: consent.status,
          error: consent.reason,
          updatedAt: new Date(),
        },
        $inc: { retryCount: 1 },
      },
      { new: true }
    ).lean();
    return updated as IWhatsAppMessage;
  }

  const provider = getWhatsAppProvider();
  let sendResult;
  try {
    sendResult = await provider.sendMessage({
      to: existing.recipientPhone,
      recipientName: existing.recipientName,
      type: existing.templateName ? "template" : "text",
      templateName: existing.templateName || undefined,
      templateLanguage: existing.templateLanguage || "en",
      templateVariables: existing.templateVariables || undefined,
      text: existing.bodyText,
      idempotencyKey: `${existing.idempotencyKey}_retry_${existing.retryCount + 1}`,
      metadata: existing.metadata,
    });
  } catch (err: any) {
    sendResult = {
      success: false,
      provider: provider.name,
      providerMessageId: `mock_error_${Date.now()}`,
      providerStatus: "failed" as const,
      rawResponse: { error: err?.message },
      error: err?.message || "Retry provider send failed",
      sentAt: new Date(),
    };
  }

  const finalStatus: WhatsAppDeliveryStatus = sendResult.success
    ? (sendResult.providerStatus as WhatsAppDeliveryStatus)
    : "failed";

  const updated = await WhatsAppMessageModel.findOneAndUpdate(
    { id },
    {
      $set: {
        provider: sendResult.provider,
        providerMessageId: sendResult.providerMessageId,
        providerStatus: sendResult.providerStatus,
        providerResponse: sendResult.rawResponse,
        status: finalStatus,
        error: sendResult.error || null,
        sentAt: sendResult.sentAt,
        updatedAt: new Date(),
      },
      $inc: { retryCount: 1 },
    },
    { new: true }
  ).lean();

  if (provider.name === "mock" && finalStatus === "simulated") {
    simulateDeliveryLifecycle(id);
  }

  logger.info({ messageId: id, status: finalStatus }, "[WhatsAppService] Retried WhatsApp message");
  return updated as IWhatsAppMessage;
}

// ==============================================================================
// Customer Consent & Opt-Out Management
// ==============================================================================

export async function getWhatsAppConsent(phone: string): Promise<IWhatsAppConsent | null> {
  const norm = normalizePhoneNumber(phone);
  if (!norm.valid) {
    return null;
  }
  const consent = await WhatsAppConsentModel.findOne({ phone: norm.normalized }).lean();
  return consent as IWhatsAppConsent | null;
}

export async function setWhatsAppConsent(
  phone: string,
  params: {
    transactionalOptOut?: boolean;
    marketingConsent?: boolean;
    name?: string;
    source?: string;
    notes?: string;
    optOutReason?: string;
    staffUsername?: string;
  }
): Promise<IWhatsAppConsent> {
  const norm = normalizePhoneNumber(phone);
  if (!norm.valid) {
    throw new WhatsAppServiceError(norm.error || "Invalid phone number", 400, "INVALID_PHONE");
  }

  const existing = await WhatsAppConsentModel.findOne({ phone: norm.normalized }).lean();

  const updates: Partial<IWhatsAppConsent> = {
    phone: norm.normalized,
    updatedAt: new Date(),
  };

  if (params.name !== undefined) updates.name = params.name;
  if (params.notes !== undefined) {
    updates.notes = params.notes;
  } else if (params.optOutReason !== undefined) {
    updates.notes = params.optOutReason;
  }
  if (params.transactionalOptOut !== undefined) {
    updates.transactionalOptOut = params.transactionalOptOut;
    if (params.transactionalOptOut) {
      updates.optedOutAt = new Date();
    }
  }
  if (params.marketingConsent !== undefined) {
    updates.marketingConsent = params.marketingConsent;
    if (params.marketingConsent) {
      updates.optedInAt = new Date();
    }
  }
  if (params.source) updates.source = params.source;
  if (params.notes !== undefined) updates.notes = params.notes;
  if (params.staffUsername) updates.updatedBy = params.staffUsername;

  const doc = await WhatsAppConsentModel.findOneAndUpdate(
    { phone: norm.normalized },
    { $set: updates, $setOnInsert: { createdAt: new Date() } },
    { upsert: true, new: true }
  ).lean();

  logger.info(
    { phone: norm.normalized, transactionalOptOut: doc?.transactionalOptOut, marketingConsent: doc?.marketingConsent },
    "[WhatsAppService] Updated customer WhatsApp consent record"
  );

  return doc as IWhatsAppConsent;
}
