import crypto from "node:crypto";
import {
  NotificationModel,
  AutomationSettingModel,
  SubscriberConsentModel,
  OrderModel,
  EnquiryModel,
  ItineraryModel,
  InvoiceModel,
  getNextSequence,
  type INotification,
  type IOrder,
  type IItinerary,
  type IEnquiry,
  type IInvoice,
  type IAutomationSetting,
  type NotificationType,
  type NotificationCategory,
} from "@workspace/db";
import { config } from "../config/env";
import { sendEmailWithStatus, getResendClient, sendContactConfirmation } from "../lib/email";
import { logger } from "../lib/logger";
import {
  renderBookingConfirmationEmail,
  renderItineraryUpdateEmail,
  renderEnquiryFollowupEmail,
  renderPostTripFeedbackEmail,
  renderPaymentReceiptEmail,
  renderPaymentDeadlineReminderEmail,
  renderFinalItineraryDeliveryEmail,
  renderBookingCancellationEmail,
  renderTravelDocumentDeliveryEmail,
  renderPreTripReminderEmail,
  renderOverduePaymentFollowupEmail,
  renderBirthdayAnniversaryGreetingEmail,
  renderOutstandingDocumentReminderEmail,
  renderManualAdminEmail,
} from "../lib/transactional-email-templates";

export class NotificationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code: string = "NOTIFICATION_ERROR"
  ) {
    super(message);
    this.name = "NotificationError";
  }
}

/**
 * Determines whether live outbound email sending is permissible.
 * Safe default: never sends real emails in test/mock mode or when live sending is disabled.
 */
export function isLiveTransactionalSending(): boolean {
  if (config.env === "test") {
    return false;
  }
  return Boolean(
    config.transactionalSendingEnabled &&
      config.resendApiKey &&
      config.resendApiKey.trim().length > 0 &&
      getResendClient() !== null
  );
}

/**
 * In-memory settings cache with short TTL (10s) for responsive admin overrides.
 */
let cachedSettings: IAutomationSetting | null = null;
let lastSettingsFetch = 0;

/**
 * Retrieves active automation settings from DB, falling back to env config defaults.
 */
export async function getAutomationSettings(): Promise<IAutomationSetting> {
  const now = Date.now();
  if (cachedSettings && now - lastSettingsFetch < 10000) {
    return cachedSettings;
  }

  try {
    const existing = await AutomationSettingModel.findOne({ id: "default" }).lean();
    if (existing) {
      cachedSettings = existing as IAutomationSetting;
      lastSettingsFetch = now;
      return cachedSettings;
    }

    const defaults: IAutomationSetting = {
      id: "default",
      enableBookingConfirmation: config.enableBookingConfirmation,
      enableItineraryUpdates: config.enableItineraryUpdateNotifications,
      enableEnquiryFollowups: config.enableEnquiryFollowup,
      enablePostTripFeedback: config.enablePostTripFeedback,
      enablePaymentReceipts: config.enablePaymentReceipts,
      enablePaymentReminders: config.enablePaymentReminders,
      enablePreTripReminders: config.enablePreTripReminders,
      enableCancellationNotifications: config.enableCancellationNotifications,
      enableDocumentDelivery: config.enableDocumentDelivery,
      enquiryFollowupDelayHours: config.enquiryFollowupDelayHours,
      postTripFeedbackDelayHours: config.postTripFeedbackDelayHours,
      updatedAt: new Date(),
    };

    const created = await AutomationSettingModel.create(defaults);
    cachedSettings = created.toObject();
    lastSettingsFetch = now;
    return cachedSettings;
  } catch (err) {
    logger.warn({ err }, "[Notification] Failed to query automation settings from DB, using config defaults");
    return {
      id: "default",
      enableBookingConfirmation: config.enableBookingConfirmation,
      enableItineraryUpdates: config.enableItineraryUpdateNotifications,
      enableEnquiryFollowups: config.enableEnquiryFollowup,
      enablePostTripFeedback: config.enablePostTripFeedback,
      enablePaymentReceipts: config.enablePaymentReceipts,
      enablePaymentReminders: config.enablePaymentReminders,
      enablePreTripReminders: config.enablePreTripReminders,
      enableCancellationNotifications: config.enableCancellationNotifications,
      enableDocumentDelivery: config.enableDocumentDelivery,
      enquiryFollowupDelayHours: config.enquiryFollowupDelayHours,
      postTripFeedbackDelayHours: config.postTripFeedbackDelayHours,
    };
  }
}

/**
 * Updates automation settings in DB and invalidates cache.
 */
export async function updateAutomationSettings(
  updates: Partial<IAutomationSetting>,
  updatedBy: string = "Staff Admin"
): Promise<IAutomationSetting> {
  const updated = await AutomationSettingModel.findOneAndUpdate(
    { id: "default" },
    {
      $set: {
        ...updates,
        updatedBy,
        updatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  ).lean();

  cachedSettings = updated as IAutomationSetting;
  lastSettingsFetch = Date.now();
  logger.info({ updatedBy, updates }, "[Notification] Automation settings updated by staff");
  return cachedSettings;
}

/**
 * Retrieves or lazily creates a subscriber consent token for preference/unsubscribe links.
 */
async function getOrCreateConsentToken(email: string, name?: string): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await SubscriberConsentModel.findOne({ email: normalizedEmail }).lean();
  if (existing) {
    return existing.token;
  }
  const newToken = crypto.randomBytes(24).toString("hex");
  try {
    await SubscriberConsentModel.create({
      email: normalizedEmail,
      name: name || null,
      subscribed: true,
      token: newToken,
      source: "transactional",
    });
    return newToken;
  } catch {
    const retry = await SubscriberConsentModel.findOne({ email: normalizedEmail }).lean();
    return retry?.token || newToken;
  }
}

/**
 * Triggered when a booking (Order) reaches the "confirmed" state.
 * Prevents duplicates via unique idempotencyKey.
 */
export async function triggerBookingConfirmation(order: IOrder): Promise<INotification | null> {
  const settings = await getAutomationSettings();
  if (!settings.enableBookingConfirmation) {
    logger.info({ orderId: order.id }, "[Notification] Booking confirmation automations disabled via settings");
    return null;
  }

  if (order.status !== "confirmed") {
    logger.info(
      { orderId: order.id, status: order.status },
      "[Notification] Order is not in confirmed state; skipping booking confirmation"
    );
    return null;
  }

  const normalizedEmail = (order.guestEmail || "").trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    logger.warn({ orderId: order.id }, "[Notification] Missing or invalid guest email for confirmed order");
    return null;
  }

  const idempotencyKey = `booking_confirmation:order:${order.id}`;

  // Duplicate-send protection: check if already generated
  const existing = await NotificationModel.findOne({ idempotencyKey });
  if (existing) {
    logger.info(
      { orderId: order.id, status: existing.status },
      "[Notification] Booking confirmation already created for order; skipping duplicate"
    );
    return existing.toObject();
  }

  const { subject, html } = renderBookingConfirmationEmail(order);
  const notifId = await getNextSequence("notifications");

  const isLive = isLiveTransactionalSending();
  let status: INotification["status"] = "pending";
  let messageId: string | null = null;
  let errorMsg: string | null = null;
  let sentAt: Date | null = null;

  if (isLive) {
    const resendIdempotencyKey = `escora-bc-${order.id}-${crypto.createHash("sha256").update(normalizedEmail).digest("hex").slice(0, 12)}`;
    const sendResult = await sendEmailWithStatus({
      to: normalizedEmail,
      subject,
      html,
      idempotencyKey: resendIdempotencyKey,
      retries: 2,
    });

    if (sendResult.success) {
      status = "sent";
      messageId = sendResult.messageId || null;
      sentAt = new Date();
      logger.info({ orderId: order.id, messageId }, "[Notification] Booking confirmation delivered via Resend");
    } else {
      status = "failed";
      errorMsg = sendResult.error || "Delivery provider rejected email";
      logger.error({ orderId: order.id, error: errorMsg }, "[Notification] Booking confirmation dispatch failed");
    }
  } else {
    // Simulation / safe test mode
    status = "sent";
    messageId = `mock_resend_msg_${crypto.randomUUID()}`;
    sentAt = new Date();
    logger.info({ orderId: order.id, messageId }, "[Notification] Booking confirmation processed in simulation mode");
  }

  try {
    const doc = await NotificationModel.create({
      id: notifId,
      type: "booking_confirmation",
      category: "transactional",
      relatedType: "order",
      relatedId: order.id,
      recipientEmail: normalizedEmail,
      recipientName: order.guestName,
      subject,
      status,
      sentAt,
      messageId,
      error: errorMsg,
      retryCount: 0,
      idempotencyKey,
      metadata: {
        packageId: order.packageId || null,
        packageName: order.packageName || null,
        travelDate: order.travelDate || null,
        departureDate: order.departureDate || null,
        totalAmount: order.totalAmount || null,
      },
    });
    return doc.toObject();
  } catch (err: any) {
    if (err.code === 11000) {
      // Raced creation
      const existingAfterRace = await NotificationModel.findOne({ idempotencyKey });
      return existingAfterRace ? existingAfterRace.toObject() : null;
    }
    throw err;
  }
}

/**
 * Identifies meaningful differences between previous and updated confirmed itinerary.
 */
export function detectItineraryChanges(
  current: IItinerary,
  previous?: Partial<IItinerary>
): string[] {
  if (!previous) return [];

  const changes: string[] = [];

  if (previous.title !== undefined && previous.title.trim() !== current.title.trim()) {
    changes.push(`Journey title updated to "${current.title}"`);
  }

  if (
    previous.destination !== undefined &&
    (previous.destination || "").trim() !== (current.destination || "").trim()
  ) {
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
 * Triggered when a confirmed itinerary has meaningful changes made.
 * Avoids sending for unconfirmed drafts or repeated processing of the same edit.
 */
export async function triggerItineraryUpdate(
  itinerary: IItinerary,
  previousItinerary?: Partial<IItinerary>
): Promise<INotification | null> {
  const settings = await getAutomationSettings();
  if (!settings.enableItineraryUpdates) {
    return null;
  }

  if (itinerary.status !== "confirmed") {
    return null;
  }

  const recipientEmail = (itinerary.customerEmail || "").trim().toLowerCase();
  if (!recipientEmail || !recipientEmail.includes("@")) {
    logger.info({ itineraryId: itinerary.id }, "[Notification] Confirmed itinerary lacks customer email; update notification skipped");
    return null;
  }

  const changes = detectItineraryChanges(itinerary, previousItinerary);
  if (changes.length === 0) {
    logger.info({ itineraryId: itinerary.id }, "[Notification] No meaningful customer-facing changes detected in itinerary update");
    return null;
  }

  // Idempotency hash: based on itinerary ID and hash of the changes to avoid duplicate sends for repeated saves
  const changesHash = crypto
    .createHash("sha256")
    .update(changes.sort().join("|"))
    .digest("hex")
    .slice(0, 10);

  const idempotencyKey = `itinerary_update:itinerary:${itinerary.id}:${changesHash}`;

  const existing = await NotificationModel.findOne({ idempotencyKey });
  if (existing) {
    logger.info({ itineraryId: itinerary.id, idempotencyKey }, "[Notification] Itinerary update already notified for this exact change set");
    return existing.toObject();
  }

  const { subject, html } = renderItineraryUpdateEmail(itinerary, changes);
  const notifId = await getNextSequence("notifications");

  const isLive = isLiveTransactionalSending();
  let status: INotification["status"] = "pending";
  let messageId: string | null = null;
  let errorMsg: string | null = null;
  let sentAt: Date | null = null;

  if (isLive) {
    const resendKey = `escora-itin-${itinerary.id}-${changesHash}`;
    const sendResult = await sendEmailWithStatus({
      to: recipientEmail,
      subject,
      html,
      idempotencyKey: resendKey,
      retries: 2,
    });

    if (sendResult.success) {
      status = "sent";
      messageId = sendResult.messageId || null;
      sentAt = new Date();
      logger.info({ itineraryId: itinerary.id, messageId }, "[Notification] Itinerary update email delivered via Resend");
    } else {
      status = "failed";
      errorMsg = sendResult.error || "Delivery provider rejected email";
      logger.error({ itineraryId: itinerary.id, error: errorMsg }, "[Notification] Itinerary update dispatch failed");
    }
  } else {
    status = "sent";
    messageId = `mock_resend_msg_${crypto.randomUUID()}`;
    sentAt = new Date();
    logger.info({ itineraryId: itinerary.id, messageId }, "[Notification] Itinerary update processed in simulation mode");
  }

  try {
    const doc = await NotificationModel.create({
      id: notifId,
      type: "itinerary_update",
      category: "transactional",
      relatedType: "itinerary",
      relatedId: itinerary.id,
      recipientEmail,
      recipientName: itinerary.customerName,
      subject,
      status,
      sentAt,
      messageId,
      error: errorMsg,
      retryCount: 0,
      idempotencyKey,
      metadata: {
        changes,
        shareToken: itinerary.shareToken,
        title: itinerary.title,
      },
    });
    return doc.toObject();
  } catch (err: any) {
    if (err.code === 11000) {
      const existingAfterRace = await NotificationModel.findOne({ idempotencyKey });
      return existingAfterRace ? existingAfterRace.toObject() : null;
    }
    throw err;
  }
}

/**
 * Schedules an Enquiry Follow-Up with a configurable delay.
 * Durable in DB; executed by the background scheduler tick.
 */
export async function scheduleEnquiryFollowup(enquiry: IEnquiry): Promise<INotification | null> {
  const settings = await getAutomationSettings();
  if (!settings.enableEnquiryFollowups) {
    return null;
  }

  const normalizedEmail = (enquiry.email || "").trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return null;
  }

  const idempotencyKey = `enquiry_followup:enquiry:${enquiry.id}`;
  const existing = await NotificationModel.findOne({ idempotencyKey });
  if (existing) {
    return existing.toObject();
  }

  const delayHours = settings.enquiryFollowupDelayHours ?? config.enquiryFollowupDelayHours;
  const delayMs = delayHours * 60 * 60 * 1000;
  const scheduledFor = new Date(Date.now() + delayMs);
  const notifId = await getNextSequence("notifications");

  const doc = await NotificationModel.create({
    id: notifId,
    type: "enquiry_followup",
    category: "service_followup",
    relatedType: "enquiry",
    relatedId: enquiry.id,
    recipientEmail: normalizedEmail,
    recipientName: enquiry.name,
    subject: "Following up on your Kerala journey inquiry — Escora Holidays",
    status: "pending",
    scheduledFor,
    retryCount: 0,
    idempotencyKey,
    metadata: {
      enquiryId: enquiry.id,
      originalCreatedAt: enquiry.createdAt,
    },
  });

  logger.info(
    { enquiryId: enquiry.id, scheduledFor },
    "[Notification] Scheduled enquiry follow-up job in database"
  );

  return doc.toObject();
}

/**
 * Cancels any pending follow-up job for an enquiry (e.g. staff replied, or customer booked).
 */
export async function cancelEnquiryFollowup(enquiryId: number, reason: string): Promise<number> {
  const result = await NotificationModel.updateMany(
    {
      relatedType: "enquiry",
      relatedId: enquiryId,
      type: "enquiry_followup",
      status: "pending",
    },
    {
      $set: {
        status: "cancelled",
        error: reason,
        updatedAt: new Date(),
      },
    }
  );

  if (result.modifiedCount > 0) {
    logger.info({ enquiryId, reason }, "[Notification] Cancelled pending enquiry follow-up job");
  }

  return result.modifiedCount;
}

/**
 * Schedules Post-Trip Feedback request after an order is marked "completed".
 */
export async function schedulePostTripFeedback(order: IOrder): Promise<INotification | null> {
  const settings = await getAutomationSettings();
  if (!settings.enablePostTripFeedback) {
    return null;
  }

  if (order.status !== "completed") {
    return null;
  }

  const normalizedEmail = (order.guestEmail || "").trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return null;
  }

  const idempotencyKey = `post_trip_feedback:order:${order.id}`;
  const existing = await NotificationModel.findOne({ idempotencyKey });
  if (existing) {
    return existing.toObject();
  }

  const delayHours = settings.postTripFeedbackDelayHours ?? config.postTripFeedbackDelayHours;
  const delayMs = delayHours * 60 * 60 * 1000;
  const scheduledFor = new Date(Date.now() + delayMs);
  const notifId = await getNextSequence("notifications");

  const doc = await NotificationModel.create({
    id: notifId,
    type: "post_trip_feedback",
    category: "service_followup",
    relatedType: "order",
    relatedId: order.id,
    recipientEmail: normalizedEmail,
    recipientName: order.guestName,
    subject: "Welcome home from Kerala — How was your journey with Escora?",
    status: "pending",
    scheduledFor,
    retryCount: 0,
    idempotencyKey,
    metadata: {
      orderId: order.id,
      destinations: order.destinations,
      packageName: order.packageName,
    },
  });

  logger.info(
    { orderId: order.id, scheduledFor },
    "[Notification] Scheduled post-trip feedback request job in database"
  );

  return doc.toObject();
}

/**
 * Cancels any pending post-trip feedback request (e.g. if order was reverted from completed).
 */
export async function cancelPostTripFeedback(orderId: number, reason: string): Promise<number> {
  const result = await NotificationModel.updateMany(
    {
      relatedType: "order",
      relatedId: orderId,
      type: "post_trip_feedback",
      status: "pending",
    },
    {
      $set: {
        status: "cancelled",
        error: reason,
        updatedAt: new Date(),
      },
    }
  );

  if (result.modifiedCount > 0) {
    logger.info({ orderId, reason }, "[Notification] Cancelled pending post-trip feedback job");
  }

  return result.modifiedCount;
}

/**
 * Triggers official payment receipt email upon verified payment on an invoice.
 */
export async function triggerPaymentReceipt(
  invoice: IInvoice,
  amountPaidNow?: number
): Promise<INotification | null> {
  const settings = await getAutomationSettings();
  if (!settings.enablePaymentReceipts) {
    logger.info({ invoiceId: invoice.id }, "[Notification] Payment receipt automations disabled via settings");
    return null;
  }
  const email = (invoice.customerEmail || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    logger.warn({ invoiceId: invoice.id }, "[Notification] Missing or invalid customer email on invoice");
    return null;
  }

  const idempotencyKey = `payment_receipt:invoice:${invoice.id}:${invoice.paidAmount}`;
  const existing = await NotificationModel.findOne({ idempotencyKey }).lean();
  if (existing) {
    logger.info({ invoiceId: invoice.id }, "[Notification] Payment receipt already dispatched for this payment amount");
    return existing;
  }

  const { subject, html } = renderPaymentReceiptEmail(invoice, amountPaidNow);
  const notifId = await getNextSequence("notifications");
  const notification = await NotificationModel.create({
    id: notifId,
    type: "payment_receipt",
    category: "transactional",
    relatedType: "invoice",
    relatedId: invoice.id,
    recipientEmail: email,
    recipientName: invoice.customerName,
    subject,
    status: "pending",
    retryCount: 0,
    idempotencyKey,
    metadata: {
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      balanceDue: invoice.balanceDue,
      amountPaidNow,
    },
  });

  await dispatchNotificationEmail(notification, subject, html);
  return notification;
}

/**
 * Triggers official customer enquiry receipt acknowledgement.
 */
export async function triggerEnquiryAcknowledgement(
  enquiry: IEnquiry
): Promise<INotification | null> {
  const email = (enquiry.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return null;

  const idempotencyKey = `enquiry_ack:enquiry:${enquiry.id}`;
  const existing = await NotificationModel.findOne({ idempotencyKey }).lean();
  if (existing) return existing;

  const subject = "We've received your message — Escora";
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

  const notifId = await getNextSequence("notifications");
  const notification = await NotificationModel.create({
    id: notifId,
    type: "enquiry_acknowledgement",
    category: "transactional",
    relatedType: "enquiry",
    relatedId: enquiry.id,
    recipientEmail: email,
    recipientName: enquiry.name,
    subject,
    status: "pending",
    retryCount: 0,
    idempotencyKey,
  });

  await dispatchNotificationEmail(notification, subject, html);
  return notification;
}

/**
 * Delivers final confirmed itinerary with live share link.
 */
export async function triggerFinalItineraryDelivery(
  itinerary: IItinerary
): Promise<INotification | null> {
  const email = (itinerary.customerEmail || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    logger.warn({ itineraryId: itinerary.id }, "[Notification] Missing or invalid customer email on itinerary");
    return null;
  }
  if (itinerary.status === "draft" || itinerary.status === "archived") {
    logger.warn({ itineraryId: itinerary.id, status: itinerary.status }, "[Notification] Cannot deliver draft or archived itinerary as final");
    return null;
  }

  const idempotencyKey = `final_itinerary:itinerary:${itinerary.id}:${itinerary.updatedAt?.getTime?.() || Date.now()}`;
  const shareUrl = `${config.publicUrl.replace(/\/$/, "")}/itinerary/${itinerary.shareToken}`;
  const { subject, html } = renderFinalItineraryDeliveryEmail(itinerary, shareUrl);

  const notifId = await getNextSequence("notifications");
  const notification = await NotificationModel.create({
    id: notifId,
    type: "final_itinerary_delivery",
    category: "transactional",
    relatedType: "itinerary",
    relatedId: itinerary.id,
    recipientEmail: email,
    recipientName: itinerary.customerName,
    subject,
    status: "pending",
    retryCount: 0,
    idempotencyKey,
    metadata: {
      shareToken: itinerary.shareToken,
      title: itinerary.title,
    },
  });

  await dispatchNotificationEmail(notification, subject, html);
  return notification;
}

/**
 * Delivers booking cancellation notification.
 */
export async function triggerBookingCancellation(
  order: IOrder,
  reason?: string
): Promise<INotification | null> {
  const settings = await getAutomationSettings();
  if (!settings.enableCancellationNotifications) return null;
  const email = (order.guestEmail || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return null;

  const idempotencyKey = `booking_cancellation:order:${order.id}`;
  const existing = await NotificationModel.findOne({ idempotencyKey }).lean();
  if (existing) return existing;

  const { subject, html } = renderBookingCancellationEmail(order, reason);
  const notifId = await getNextSequence("notifications");
  const notification = await NotificationModel.create({
    id: notifId,
    type: "booking_cancellation",
    category: "transactional",
    relatedType: "order",
    relatedId: order.id,
    recipientEmail: email,
    recipientName: order.guestName,
    subject,
    status: "pending",
    retryCount: 0,
    idempotencyKey,
    metadata: { reason },
  });

  await dispatchNotificationEmail(notification, subject, html);
  return notification;
}

/**
 * Delivers travel documents and vouchers.
 */
export async function triggerTravelDocumentDelivery(
  order: IOrder,
  details: { title: string; documentType?: string; notes?: string; downloadUrl?: string }
): Promise<INotification | null> {
  const settings = await getAutomationSettings();
  if (!settings.enableDocumentDelivery) return null;
  const email = (order.guestEmail || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return null;

  const idempotencyKey = `travel_docs:order:${order.id}:${crypto.createHash("sha256").update(details.title).digest("hex").slice(0, 10)}`;
  const existing = await NotificationModel.findOne({ idempotencyKey }).lean();
  if (existing) return existing;

  const { subject, html } = renderTravelDocumentDeliveryEmail(order, details);
  const notifId = await getNextSequence("notifications");
  const notification = await NotificationModel.create({
    id: notifId,
    type: "travel_document_delivery",
    category: "transactional",
    relatedType: "order",
    relatedId: order.id,
    recipientEmail: email,
    recipientName: order.guestName,
    subject,
    status: "pending",
    retryCount: 0,
    idempotencyKey,
    metadata: details,
  });

  await dispatchNotificationEmail(notification, subject, html);
  return notification;
}

/**
 * Schedules pre-trip reminder prior to customer arrival.
 */
export async function schedulePreTripReminder(
  order: IOrder,
  daysBeforeTrip: number = 3
): Promise<INotification | null> {
  const settings = await getAutomationSettings();
  if (!settings.enablePreTripReminders) return null;
  if (order.status !== "confirmed") return null;

  const email = (order.guestEmail || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return null;

  const travelDateStr = order.travelDate;
  if (!travelDateStr) return null;

  const travelDate = new Date(travelDateStr);
  if (Number.isNaN(travelDate.getTime())) return null;

  const scheduledFor = new Date(travelDate.getTime() - daysBeforeTrip * 24 * 60 * 60 * 1000);
  const idempotencyKey = `pre_trip_reminder:order:${order.id}`;
  const existing = await NotificationModel.findOne({ idempotencyKey }).lean();
  if (existing) return existing;

  const notifId = await getNextSequence("notifications");
  const notification = await NotificationModel.create({
    id: notifId,
    type: "pre_trip_reminder",
    category: "service_followup",
    relatedType: "order",
    relatedId: order.id,
    recipientEmail: email,
    recipientName: order.guestName,
    subject: `Your Kerala Journey Begins Soon — Essential Pre-Trip Details (Ref #${order.id})`,
    status: "pending",
    scheduledFor,
    retryCount: 0,
    idempotencyKey,
    metadata: {
      travelDate: order.travelDate,
      departureDate: order.departureDate,
    },
  });
  return notification;
}

/**
 * Schedules payment deadline reminder prior to invoice due date.
 */
export async function schedulePaymentDeadlineReminder(
  invoice: IInvoice,
  daysBeforeDue: number = 3
): Promise<INotification | null> {
  const settings = await getAutomationSettings();
  if (!settings.enablePaymentReminders) return null;
  if (!invoice.dueDate || invoice.balanceDue <= 0 || invoice.status === "paid" || invoice.status === "cancelled") {
    return null;
  }
  const email = (invoice.customerEmail || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return null;

  const dueDate = new Date(invoice.dueDate);
  if (Number.isNaN(dueDate.getTime())) return null;

  const scheduledFor = new Date(dueDate.getTime() - daysBeforeDue * 24 * 60 * 60 * 1000);
  const idempotencyKey = `payment_deadline_reminder:invoice:${invoice.id}:${invoice.dueDate}`;
  const existing = await NotificationModel.findOne({ idempotencyKey }).lean();
  if (existing) return existing;

  const notifId = await getNextSequence("notifications");
  const notification = await NotificationModel.create({
    id: notifId,
    type: "payment_deadline_reminder",
    category: "transactional",
    relatedType: "invoice",
    relatedId: invoice.id,
    recipientEmail: email,
    recipientName: invoice.customerName,
    subject: `Upcoming Payment Due: Invoice #${invoice.invoiceNumber} — Escora`,
    status: "pending",
    scheduledFor,
    retryCount: 0,
    idempotencyKey,
    metadata: {
      invoiceNumber: invoice.invoiceNumber,
      dueDate: invoice.dueDate,
      balanceDue: invoice.balanceDue,
    },
  });
  return notification;
}

/**
 * Schedules overdue payment follow-up notice when invoice is past due.
 */
export async function scheduleOverduePaymentFollowup(
  invoice: IInvoice
): Promise<INotification | null> {
  const settings = await getAutomationSettings();
  if (!settings.enablePaymentReminders) return null;
  if (invoice.balanceDue <= 0 || invoice.status === "paid" || invoice.status === "cancelled") {
    return null;
  }
  const email = (invoice.customerEmail || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return null;

  const idempotencyKey = `overdue_payment:invoice:${invoice.id}`;
  const existing = await NotificationModel.findOne({ idempotencyKey }).lean();
  if (existing) return existing;

  const notifId = await getNextSequence("notifications");
  const notification = await NotificationModel.create({
    id: notifId,
    type: "overdue_payment_followup",
    category: "transactional",
    relatedType: "invoice",
    relatedId: invoice.id,
    recipientEmail: email,
    recipientName: invoice.customerName,
    subject: `Overdue Notice: Invoice #${invoice.invoiceNumber} — Escora`,
    status: "pending",
    scheduledFor: new Date(),
    retryCount: 0,
    idempotencyKey,
    metadata: {
      invoiceNumber: invoice.invoiceNumber,
      balanceDue: invoice.balanceDue,
    },
  });
  return notification;
}

/**
 * Schedules outstanding travel document reminder.
 */
export async function scheduleOutstandingDocumentReminder(
  order: IOrder,
  missingDocs: string[],
  scheduledFor: Date = new Date()
): Promise<INotification | null> {
  const email = (order.guestEmail || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return null;

  const idempotencyKey = `outstanding_docs:order:${order.id}:${crypto.createHash("sha256").update(missingDocs.join(",")).digest("hex").slice(0, 10)}`;
  const existing = await NotificationModel.findOne({ idempotencyKey }).lean();
  if (existing) return existing;

  const notifId = await getNextSequence("notifications");
  const notification = await NotificationModel.create({
    id: notifId,
    type: "outstanding_document_reminder",
    category: "service_followup",
    relatedType: "order",
    relatedId: order.id,
    recipientEmail: email,
    recipientName: order.guestName,
    subject: `Required Travel Documentation Pending — Booking #${order.id}`,
    status: "pending",
    scheduledFor,
    retryCount: 0,
    idempotencyKey,
    metadata: { missingDocs },
  });
  return notification;
}

/**
 * Creates an admin approval-required notification (sensitive, promotional, or major change).
 */
export async function queueApprovalRequiredNotification(params: {
  type: NotificationType;
  category: NotificationCategory;
  relatedType: "order" | "itinerary" | "enquiry" | "invoice" | "customer";
  relatedId: number;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyHtml: string;
  metadata?: Record<string, any>;
}): Promise<INotification> {
  const email = params.recipientEmail.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new NotificationError("Invalid recipient email address");
  }

  const notifId = await getNextSequence("notifications");
  const idempotencyKey = `approval_required:${params.type}:${params.relatedType}:${params.relatedId}:${Date.now()}`;

  const notification = await NotificationModel.create({
    id: notifId,
    type: params.type,
    category: params.category,
    relatedType: params.relatedType,
    relatedId: params.relatedId,
    recipientEmail: email,
    recipientName: params.recipientName,
    subject: params.subject,
    status: "pending_approval",
    requiresApproval: true,
    retryCount: 0,
    idempotencyKey,
    metadata: {
      ...params.metadata,
      bodyHtml: params.bodyHtml,
    },
  });
  return notification;
}

/**
 * Staff approves a pending notification for dispatch.
 */
export async function approveNotification(id: number, staffUsername: string): Promise<INotification> {
  const notif = await NotificationModel.findOne({ id });
  if (!notif) {
    throw new NotificationError("Notification not found", 404);
  }
  if (notif.status !== "pending_approval") {
    throw new NotificationError(`Notification is not in pending_approval state (status: ${notif.status})`, 400);
  }

  notif.status = "pending";
  notif.approvedBy = staffUsername;
  notif.approvedAt = new Date();
  notif.scheduledFor = new Date(); // Ready for worker tick
  notif.updatedAt = new Date();
  await notif.save();

  logger.info({ id, staffUsername }, "[Notification] Admin approved notification for dispatch");
  return notif;
}

/**
 * Staff rejects or cancels a pending notification.
 */
export async function rejectNotification(id: number, reason: string): Promise<INotification> {
  const notif = await NotificationModel.findOne({ id });
  if (!notif) {
    throw new NotificationError("Notification not found", 404);
  }
  notif.status = "cancelled";
  notif.error = reason;
  notif.updatedAt = new Date();
  await notif.save();
  logger.info({ id, reason }, "[Notification] Admin rejected/cancelled notification");
  return notif;
}

/**
 * Staff cancels a scheduled or pending notification.
 */
export async function cancelNotification(
  id: number,
  reason: string = "Cancelled by staff",
  staffUsername: string = "Staff Admin"
): Promise<INotification> {
  const notif = await NotificationModel.findOne({ id });
  if (!notif) {
    throw new NotificationError("Notification not found", 404);
  }
  if (notif.status === "sent") {
    throw new NotificationError("Cannot cancel a notification that has already been delivered", 400);
  }

  notif.status = "cancelled";
  notif.error = reason;
  notif.metadata = {
    ...(notif.metadata || {}),
    cancelledBy: staffUsername,
    cancelledAt: new Date(),
  };
  notif.updatedAt = new Date();
  await notif.save();

  logger.info({ id, reason, staffUsername }, "[Notification] Staff cancelled notification");
  return notif;
}

/**
 * Staff edits an un-sent notification (status: pending or pending_approval).
 */
export async function updateNotification(
  id: number,
  updates: {
    subject?: string;
    recipientName?: string;
    recipientEmail?: string;
    bodyHtml?: string;
    notes?: string;
    metadata?: Record<string, any>;
  },
  staffUsername: string = "Staff Admin"
): Promise<INotification> {
  const notif = await NotificationModel.findOne({ id });
  if (!notif) {
    throw new NotificationError("Notification not found", 404);
  }

  if (notif.status !== "pending" && notif.status !== "pending_approval") {
    throw new NotificationError(
      `Cannot edit notification in '${notif.status}' status. Only pending or pending_approval notifications can be edited.`,
      400
    );
  }

  if (updates.subject !== undefined) {
    notif.subject = updates.subject.trim();
  }
  if (updates.recipientName !== undefined) {
    notif.recipientName = updates.recipientName.trim();
  }
  if (updates.recipientEmail !== undefined) {
    const email = updates.recipientEmail.trim().toLowerCase();
    if (!email.includes("@")) {
      throw new NotificationError("Invalid recipient email address", 400);
    }
    notif.recipientEmail = email;
  }

  const existingMeta = notif.metadata || {};
  notif.metadata = {
    ...existingMeta,
    ...(updates.metadata || {}),
    ...(updates.bodyHtml ? { bodyHtml: updates.bodyHtml } : {}),
    ...(updates.notes ? { notes: updates.notes } : {}),
    lastEditedBy: staffUsername,
    lastEditedAt: new Date(),
  };

  notif.updatedAt = new Date();
  await notif.save();

  logger.info({ id, staffUsername }, "[Notification] Staff edited notification content");
  return notif;
}

/**
 * Retrieves a single notification record by ID.
 */
export async function getNotificationById(id: number): Promise<INotification> {
  const notif = await NotificationModel.findOne({ id }).lean();
  if (!notif) {
    throw new NotificationError("Notification not found", 404);
  }
  return notif;
}

/**
 * Generates slow-luxury rendered HTML preview for a notification.
 */
export async function getNotificationPreview(id: number): Promise<{
  id: number;
  subject: string;
  recipientEmail: string;
  recipientName: string;
  html: string;
  status: string;
  type: string;
}> {
  const notif = await NotificationModel.findOne({ id }).lean();
  if (!notif) {
    throw new NotificationError("Notification not found", 404);
  }

  const email = notif.recipientEmail;
  const name = notif.recipientName;
  const token = await getOrCreateConsentToken(email, name);
  const unsubscribeUrl = `${config.publicUrl.replace(/\/$/, "")}/api/campaigns/unsubscribe?token=${token}&email=${encodeURIComponent(email)}`;

  let previewHtml = "";

  if (notif.metadata?.bodyHtml) {
    const rendered = renderManualAdminEmail({
      title: notif.subject,
      greetingName: name,
      bodyHtml: notif.metadata.bodyHtml,
      callToAction: notif.metadata?.callToAction,
      unsubscribeUrl,
    });
    previewHtml = rendered.html;
  } else if (notif.type === "booking_confirmation") {
    const order = await OrderModel.findOne({ id: notif.relatedId }).lean();
    if (order) {
      previewHtml = renderBookingConfirmationEmail(order).html;
    }
  } else if (notif.type === "payment_receipt") {
    const invoice = await InvoiceModel.findOne({ id: notif.relatedId }).lean();
    if (invoice) {
      previewHtml = renderPaymentReceiptEmail(invoice, notif.metadata?.amountPaidNow).html;
    }
  } else if (notif.type === "payment_deadline_reminder") {
    const invoice = await InvoiceModel.findOne({ id: notif.relatedId }).lean();
    if (invoice) {
      previewHtml = renderPaymentDeadlineReminderEmail(invoice).html;
    }
  } else if (notif.type === "overdue_payment_followup") {
    const invoice = await InvoiceModel.findOne({ id: notif.relatedId }).lean();
    if (invoice) {
      previewHtml = renderOverduePaymentFollowupEmail(invoice).html;
    }
  } else if (notif.type === "final_itinerary_delivery") {
    const itinerary = await ItineraryModel.findOne({ id: notif.relatedId }).lean();
    if (itinerary) {
      const shareUrl = `${config.publicUrl.replace(/\/$/, "")}/itinerary/${itinerary.shareToken}`;
      previewHtml = renderFinalItineraryDeliveryEmail(itinerary, shareUrl).html;
    }
  } else if (notif.type === "itinerary_update") {
    previewHtml = renderItineraryUpdateEmail(
      { customerName: name, title: notif.subject, shareToken: notif.metadata?.shareToken || "preview" } as any,
      notif.metadata?.changesSummary || ["Updated itinerary details"]
    ).html;
  } else if (notif.type === "enquiry_followup") {
    previewHtml = renderEnquiryFollowupEmail({ name, email }, unsubscribeUrl).html;
  } else if (notif.type === "post_trip_feedback") {
    const order = await OrderModel.findOne({ id: notif.relatedId }).lean();
    const reviewUrl = config.feedbackReviewUrl || `${config.publicUrl.replace(/\/$/, "")}/contact`;
    previewHtml = renderPostTripFeedbackEmail(
      { id: order?.id || notif.relatedId, guestName: name, destinations: order?.destinations || "Kerala" },
      reviewUrl,
      unsubscribeUrl
    ).html;
  } else if (notif.type === "booking_cancellation") {
    const order = await OrderModel.findOne({ id: notif.relatedId }).lean();
    previewHtml = renderBookingCancellationEmail(
      order || ({ id: notif.relatedId, guestName: name } as any),
      notif.metadata?.reason
    ).html;
  } else if (notif.type === "travel_document_delivery") {
    const order = await OrderModel.findOne({ id: notif.relatedId }).lean();
    previewHtml = renderTravelDocumentDeliveryEmail(
      order || ({ id: notif.relatedId, guestName: name } as any),
      {
        title: (notif.metadata as any)?.title || notif.subject,
        documentType: (notif.metadata as any)?.documentType,
        notes: (notif.metadata as any)?.notes,
        downloadUrl: (notif.metadata as any)?.downloadUrl,
      }
    ).html;
  } else if (notif.type === "pre_trip_reminder") {
    const order = await OrderModel.findOne({ id: notif.relatedId }).lean();
    previewHtml = renderPreTripReminderEmail(
      order || ({ id: notif.relatedId, guestName: name, travelDate: notif.metadata?.travelDate } as any),
      notif.metadata
    ).html;
  } else if (notif.type === "outstanding_document_reminder") {
    const order = await OrderModel.findOne({ id: notif.relatedId }).lean();
    previewHtml = renderOutstandingDocumentReminderEmail(
      order || ({ id: notif.relatedId, guestName: name } as any),
      notif.metadata?.missingDocs || ["Government ID"]
    ).html;
  } else if (notif.type === "birthday_anniversary_greeting") {
    previewHtml = renderBirthdayAnniversaryGreetingEmail(
      { name, email },
      notif.metadata?.occasion || "birthday",
      unsubscribeUrl
    ).html;
  }

  if (!previewHtml) {
    previewHtml = renderManualAdminEmail({
      title: notif.subject,
      greetingName: name,
      bodyHtml: `<p>${notif.subject}</p>`,
      unsubscribeUrl,
    }).html;
  }

  return {
    id: notif.id,
    subject: notif.subject,
    recipientEmail: notif.recipientEmail,
    recipientName: notif.recipientName,
    html: previewHtml,
    status: notif.status,
    type: notif.type,
  };
}

/**
 * Sends a manual admin email (custom responses, quotations, proposals, disputes, disruptions)
 * or queues it for staff approval.
 */
export async function sendManualAdminEmail(params: {
  type: NotificationType;
  recipientEmail: string;
  recipientName: string;
  title: string;
  bodyHtml: string;
  relatedType: "order" | "itinerary" | "enquiry" | "invoice" | "customer";
  relatedId: number;
  callToAction?: { label: string; url: string };
  category?: NotificationCategory;
  sentBy?: string;
  queueApproval?: boolean;
  metadata?: Record<string, any>;
}): Promise<INotification> {
  const email = params.recipientEmail.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new NotificationError("Invalid recipient email address");
  }

  const token = await getOrCreateConsentToken(email, params.recipientName);
  const unsubscribeUrl = `${config.publicUrl.replace(/\/$/, "")}/api/campaigns/unsubscribe?token=${token}&email=${encodeURIComponent(email)}`;

  const { subject, html } = renderManualAdminEmail({
    title: params.title,
    greetingName: params.recipientName,
    bodyHtml: params.bodyHtml,
    callToAction: params.callToAction,
    unsubscribeUrl,
  });

  const notifId = await getNextSequence("notifications");
  const idempotencyKey = `manual_admin:${params.type}:${params.relatedType}:${params.relatedId}:${Date.now()}`;
  const staffUsername = params.sentBy || "Staff Admin";
  const shouldQueueApproval = Boolean(params.queueApproval);

  const notification = await NotificationModel.create({
    id: notifId,
    type: params.type,
    category: params.category || "administrative",
    relatedType: params.relatedType,
    relatedId: params.relatedId,
    recipientEmail: email,
    recipientName: params.recipientName,
    subject,
    status: shouldQueueApproval ? "pending_approval" : "pending",
    requiresApproval: shouldQueueApproval,
    sentBy: staffUsername,
    retryCount: 0,
    idempotencyKey,
    metadata: {
      ...params.metadata,
      bodyHtml: params.bodyHtml,
      callToAction: params.callToAction,
      sentBy: staffUsername,
    },
  });

  if (!shouldQueueApproval) {
    await dispatchNotificationEmail(notification, subject, html);
  } else {
    logger.info(
      { notifId, staffUsername, type: params.type },
      "[Notification] Manual email queued for administrative approval"
    );
  }

  return notification;
}

/**
 * Durable worker tick handler: Atomically claims and dispatches due scheduled email notifications.
 * Integrated directly with the background scheduler tick.
 */
export async function processDueEmailNotifications(): Promise<number> {
  const now = new Date();

  // Find due pending notifications (excluding pending_approval)
  const dueList = await NotificationModel.find({
    status: "pending",
    scheduledFor: { $lte: now },
  })
    .limit(10)
    .lean();

  if (dueList.length === 0) {
    return 0;
  }

  let processedCount = 0;

  for (const notif of dueList) {
    // Atomic claiming safeguard: Transitions to "sending" so no concurrent worker can double-dispatch
    const claimed = await NotificationModel.findOneAndUpdate(
      { id: notif.id, status: "pending" },
      { $set: { status: "sending", updatedAt: now } },
      { new: true }
    );

    if (!claimed) {
      continue; // Claimed by another worker
    }

    try {
      // 1. Lifecycle verification checks based on notification type
      if (claimed.type === "enquiry_followup") {
        const enquiry = await EnquiryModel.findOne({ id: claimed.relatedId }).lean();
        if (!enquiry) {
          claimed.status = "cancelled";
          claimed.error = "Original enquiry record no longer exists";
          await claimed.save();
          continue;
        }

        // Avoid following up if staff already replied or marked resolved
        if (enquiry.status === "replied") {
          claimed.status = "cancelled";
          claimed.error = "Staff already replied to customer enquiry";
          await claimed.save();
          logger.info({ enquiryId: enquiry.id }, "[Notification] Enquiry follow-up cancelled: staff already replied");
          continue;
        }

        // Avoid following up if customer has already booked
        const existingOrder = await OrderModel.findOne({
          guestEmail: claimed.recipientEmail.toLowerCase(),
          status: { $in: ["confirmed", "completed"] },
        }).lean();

        if (existingOrder) {
          claimed.status = "cancelled";
          claimed.error = `Customer already has confirmed booking #${existingOrder.id}`;
          await claimed.save();
          logger.info(
            { enquiryId: enquiry.id, orderId: existingOrder.id },
            "[Notification] Enquiry follow-up cancelled: customer has booked an order"
          );
          continue;
        }

        // Respect unsubscribe / suppression status
        const consent = await SubscriberConsentModel.findOne({
          email: claimed.recipientEmail.toLowerCase(),
        }).lean();

        if (consent && !consent.subscribed) {
          claimed.status = "skipped";
          claimed.error = "Recipient unsubscribed from email communications";
          await claimed.save();
          logger.info({ email: claimed.recipientEmail }, "[Notification] Enquiry follow-up skipped: unsubscribed");
          continue;
        }

        // Render follow-up template with verified unsubscribe link
        const token = consent?.token || (await getOrCreateConsentToken(claimed.recipientEmail, claimed.recipientName));
        const unsubscribeUrl = `${config.publicUrl.replace(/\/$/, "")}/api/campaigns/unsubscribe?token=${token}&email=${encodeURIComponent(claimed.recipientEmail)}`;
        const { subject, html } = renderEnquiryFollowupEmail(
          { name: claimed.recipientName, email: claimed.recipientEmail },
          unsubscribeUrl
        );

        await dispatchNotificationEmail(claimed, subject, html);
        processedCount++;
      } else if (claimed.type === "post_trip_feedback") {
        const order = await OrderModel.findOne({ id: claimed.relatedId }).lean();
        if (!order || order.status !== "completed") {
          claimed.status = "cancelled";
          claimed.error = `Order is no longer in completed state (status: ${order?.status || "missing"})`;
          await claimed.save();
          continue;
        }

        const consent = await SubscriberConsentModel.findOne({
          email: claimed.recipientEmail.toLowerCase(),
        }).lean();

        if (consent && !consent.subscribed) {
          claimed.status = "skipped";
          claimed.error = "Recipient unsubscribed from review & marketing communications";
          await claimed.save();
          continue;
        }

        const token = consent?.token || (await getOrCreateConsentToken(claimed.recipientEmail, claimed.recipientName));
        const unsubscribeUrl = `${config.publicUrl.replace(/\/$/, "")}/api/campaigns/unsubscribe?token=${token}&email=${encodeURIComponent(claimed.recipientEmail)}`;
        const reviewUrl = config.feedbackReviewUrl || `${config.publicUrl.replace(/\/$/, "")}/contact`;

        const { subject, html } = renderPostTripFeedbackEmail(
          { id: order.id, guestName: order.guestName, destinations: order.destinations },
          reviewUrl,
          unsubscribeUrl
        );

        await dispatchNotificationEmail(claimed, subject, html);
        processedCount++;
      } else if (claimed.type === "payment_deadline_reminder") {
        const invoice = await InvoiceModel.findOne({ id: claimed.relatedId }).lean();
        if (!invoice || invoice.status === "paid" || invoice.status === "cancelled" || invoice.balanceDue <= 0) {
          claimed.status = "cancelled";
          claimed.error = "Invoice balance is settled or invoice was cancelled";
          await claimed.save();
          continue;
        }
        const { subject, html } = renderPaymentDeadlineReminderEmail(invoice);
        await dispatchNotificationEmail(claimed, subject, html);
        processedCount++;
      } else if (claimed.type === "overdue_payment_followup") {
        const invoice = await InvoiceModel.findOne({ id: claimed.relatedId }).lean();
        if (!invoice || invoice.status === "paid" || invoice.status === "cancelled" || invoice.balanceDue <= 0) {
          claimed.status = "cancelled";
          claimed.error = "Invoice balance is settled or invoice was cancelled";
          await claimed.save();
          continue;
        }
        const { subject, html } = renderOverduePaymentFollowupEmail(invoice);
        await dispatchNotificationEmail(claimed, subject, html);
        processedCount++;
      } else if (claimed.type === "pre_trip_reminder") {
        const order = await OrderModel.findOne({ id: claimed.relatedId }).lean();
        if (!order || order.status !== "confirmed") {
          claimed.status = "cancelled";
          claimed.error = `Order is no longer confirmed (status: ${order?.status || "missing"})`;
          await claimed.save();
          continue;
        }
        const { subject, html } = renderPreTripReminderEmail(order, claimed.metadata);
        await dispatchNotificationEmail(claimed, subject, html);
        processedCount++;
      } else if (claimed.type === "outstanding_document_reminder") {
        const order = await OrderModel.findOne({ id: claimed.relatedId }).lean();
        if (!order || order.status !== "confirmed") {
          claimed.status = "cancelled";
          claimed.error = `Order is no longer confirmed (status: ${order?.status || "missing"})`;
          await claimed.save();
          continue;
        }
        const { subject, html } = renderOutstandingDocumentReminderEmail(
          order,
          claimed.metadata?.missingDocs || ["Government-issued Photo ID / Passport Details"]
        );
        await dispatchNotificationEmail(claimed, subject, html);
        processedCount++;
      } else if (claimed.type === "birthday_anniversary_greeting") {
        const consent = await SubscriberConsentModel.findOne({
          email: claimed.recipientEmail.toLowerCase(),
        }).lean();
        if (consent && !consent.subscribed) {
          claimed.status = "skipped";
          claimed.error = "Recipient unsubscribed from celebratory and marketing messages";
          await claimed.save();
          continue;
        }
        const token = consent?.token || (await getOrCreateConsentToken(claimed.recipientEmail, claimed.recipientName));
        const unsubscribeUrl = `${config.publicUrl.replace(/\/$/, "")}/api/campaigns/unsubscribe?token=${token}&email=${encodeURIComponent(claimed.recipientEmail)}`;
        const { subject, html } = renderBirthdayAnniversaryGreetingEmail(
          { name: claimed.recipientName, email: claimed.recipientEmail },
          claimed.metadata?.occasion || "birthday",
          unsubscribeUrl
        );
        await dispatchNotificationEmail(claimed, subject, html);
        processedCount++;
      } else if (claimed.type === "final_itinerary_delivery") {
        const itinerary = await ItineraryModel.findOne({ id: claimed.relatedId }).lean();
        if (!itinerary || itinerary.status === "draft" || itinerary.status === "archived") {
          claimed.status = "cancelled";
          claimed.error = "Itinerary is in draft or archived status; draft itineraries cannot be delivered as final";
          await claimed.save();
          continue;
        }
        const shareUrl = `${config.publicUrl.replace(/\/$/, "")}/itinerary/${itinerary.shareToken}`;
        const { subject, html } = renderFinalItineraryDeliveryEmail(itinerary, shareUrl);
        await dispatchNotificationEmail(claimed, subject, html);
        processedCount++;
      } else if (claimed.metadata?.bodyHtml) {
        // Handle approval-approved or manual custom admin messages
        const token = await getOrCreateConsentToken(claimed.recipientEmail, claimed.recipientName);
        const unsubscribeUrl = `${config.publicUrl.replace(/\/$/, "")}/api/campaigns/unsubscribe?token=${token}&email=${encodeURIComponent(claimed.recipientEmail)}`;
        const { subject, html } = renderManualAdminEmail({
          title: claimed.subject,
          greetingName: claimed.recipientName,
          bodyHtml: claimed.metadata.bodyHtml,
          callToAction: claimed.metadata?.callToAction,
          unsubscribeUrl,
        });
        await dispatchNotificationEmail(claimed, subject, html);
        processedCount++;
      }
    } catch (err: any) {
      logger.error({ notifId: claimed.id, err: err?.message }, "[Notification] Error processing scheduled notification");
      claimed.retryCount = (claimed.retryCount || 0) + 1;
      if (claimed.retryCount >= 2) {
        claimed.status = "failed";
        claimed.error = err?.message || "Internal processing exception";
      } else {
        // Retry in 5 minutes
        claimed.status = "pending";
        claimed.scheduledFor = new Date(Date.now() + 5 * 60 * 1000);
      }
      await claimed.save();
    }
  }

  return processedCount;
}

/**
 * Dispatches an email for a claimed notification with bounded retries and status recording.
 */
async function dispatchNotificationEmail(
  claimed: any,
  subject: string,
  html: string
): Promise<void> {
  const isLive = isLiveTransactionalSending();

  if (isLive) {
    const resendIdempotencyKey = `escora-notif-${claimed.id}-${crypto.createHash("sha256").update(claimed.recipientEmail).digest("hex").slice(0, 10)}`;
    const sendResult = await sendEmailWithStatus({
      to: claimed.recipientEmail,
      subject,
      html,
      idempotencyKey: resendIdempotencyKey,
      retries: 2,
    });

    if (sendResult.success) {
      claimed.status = "sent";
      claimed.messageId = sendResult.messageId || null;
      claimed.sentAt = new Date();
      claimed.error = null;
    } else {
      claimed.retryCount = (claimed.retryCount || 0) + 1;
      if (claimed.retryCount >= 2) {
        claimed.status = "failed";
        claimed.error = sendResult.error || "Delivery provider rejected email";
      } else {
        claimed.status = "pending";
        claimed.scheduledFor = new Date(Date.now() + 5 * 60 * 1000);
        claimed.error = sendResult.error;
      }
    }
  } else {
    // Safe simulation mode
    claimed.status = "sent";
    claimed.messageId = `mock_resend_msg_${crypto.randomUUID()}`;
    claimed.sentAt = new Date();
    claimed.error = null;
  }

  claimed.subject = subject;
  claimed.updatedAt = new Date();
  await claimed.save();
}

/**
 * Recovers notifications stuck in "sending" state following unexpected server restarts.
 */
export async function recoverStaleEmailNotifications(
  staleThresholdMs: number = 5 * 60 * 1000
): Promise<number> {
  const cutoff = new Date(Date.now() - staleThresholdMs);

  const stale = await NotificationModel.find({
    status: "sending",
    updatedAt: { $lte: cutoff },
  });

  if (stale.length === 0) {
    return 0;
  }

  logger.warn({ count: stale.length }, "[Notification] Detected stale notifications in 'sending' state. Resetting to pending.");

  for (const notif of stale) {
    notif.status = "pending";
    notif.updatedAt = new Date();
    await notif.save();
  }

  return stale.length;
}

/**
 * Lists notification records for administration inspection.
 */
export async function listEmailNotifications(filter?: {
  type?: string;
  status?: string;
  relatedType?: string;
  relatedId?: number;
  limit?: number;
}) {
  const query: any = {};
  if (filter?.type) query.type = filter.type;
  if (filter?.status) query.status = filter.status;
  if (filter?.relatedType) query.relatedType = filter.relatedType;
  if (filter?.relatedId) query.relatedId = filter.relatedId;

  const limit = Math.min(filter?.limit || 100, 200);

  return NotificationModel.find(query).sort({ createdAt: -1 }).limit(limit).lean();
}

/**
 * Retries a failed notification manually (admin only).
 */
export async function retryEmailNotification(id: number): Promise<INotification> {
  const notif = await NotificationModel.findOne({ id });
  if (!notif) {
    throw new NotificationError(`Notification #${id} not found`, 404, "NOT_FOUND");
  }

  notif.status = "pending";
  notif.scheduledFor = new Date();
  notif.retryCount = 0;
  notif.error = null;
  notif.updatedAt = new Date();
  await notif.save();

  return notif.toObject();
}
