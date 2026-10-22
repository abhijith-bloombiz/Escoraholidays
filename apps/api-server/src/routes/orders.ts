import { Router, type IRouter } from "express";
import { OrderModel, NotificationModel, getNextSequence } from "@workspace/db";
import {
  ListOrdersQueryParams,
  ExportOrdersQueryParams,
  ListOrdersResponse,
  CreateOrderBody,
  GetOrderParams,
  GetOrderResponse,
  UpdateOrderParams,
  UpdateOrderBody,
  UpdateOrderResponse,
  DeleteOrderParams,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { sendBookingConfirmation, sendAdminBookingNotification } from "../lib/email";
import {
  triggerBookingConfirmation,
  schedulePostTripFeedback,
  cancelPostTripFeedback,
  schedulePreTripReminder,
  triggerBookingCancellation,
  triggerTravelDocumentDelivery,
} from "../services/notification-service";
import {
  triggerWhatsAppBookingConfirmation,
  triggerWhatsAppDocumentDelivery,
} from "../services/whatsapp";
import { processPublicFormConsent } from "../services/campaign-service";

const router: IRouter = Router();

function serializeDates<T extends { createdAt: Date; updatedAt: Date; convertedAt?: any; [key: string]: any }>(row: T) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    convertedAt: row.convertedAt
      ? (row.convertedAt instanceof Date ? row.convertedAt.toISOString() : String(row.convertedAt))
      : null,
    bookingReference: row.bookingReference ?? null,
    enquiryId: row.enquiryId ?? null,
    itineraryId: row.itineraryId ?? null,
    itineraryTitle: row.itineraryTitle ?? null,
    currency: row.currency ?? null,
    paymentStatus: row.paymentStatus ?? null,
    paymentTerms: row.paymentTerms ?? null,
    pricingDetails: row.pricingDetails ?? null,
    itinerarySnapshot: row.itinerarySnapshot ?? null,
    convertedBy: row.convertedBy ?? null,
  };
}

async function lookupGeo(ip: string): Promise<{ geoCountry?: string; geoRegion?: string; geoCity?: string }> {
  // Skip loopback / private addresses
  if (!ip || ip === "::1" || ip.startsWith("127.") || ip.startsWith("192.168.") || ip.startsWith("10.") || ip === "::ffff:127.0.0.1") {
    return {};
  }
  try {
    const cleanIp = ip.replace(/^::ffff:/, "");
    const res = await fetch(`http://ip-api.com/json/${cleanIp}?fields=status,country,regionName,city`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return {};
    const data = await res.json() as { status: string; country?: string; regionName?: string; city?: string };
    if (data.status !== "success") return {};
    return { geoCountry: data.country, geoRegion: data.regionName, geoCity: data.city };
  } catch {
    return {};
  }
}

router.get("/orders/export", async (req, res): Promise<void> => {
  const query = ExportOrdersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const filter: Record<string, any> = {};
  if (query.data.status !== undefined) {
    filter.status = query.data.status;
  }

  const orders = await OrderModel.find(filter).sort({ createdAt: 1 }).lean();

  const headers = [
    "ID","Guest Name","Email","Phone","Travel Style","Destinations","Travel Date","Departure Date",
    "Guests","Budget Range","Status","Total Amount (INR)","Package","Special Requests",
    "UTM Source","UTM Medium","UTM Campaign","Country","City","Created At"
  ];

  function escapeCsv(v: string | number | null | undefined): string {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  const rows = orders.map(o => [
    o.id, o.guestName, o.guestEmail, o.guestPhone, o.travelStyle, o.destinations,
    o.travelDate, o.departureDate, o.guestCount, o.budgetRange, o.status, o.totalAmount,
    o.packageName, o.specialRequests, o.utmSource, o.utmMedium, o.utmCampaign,
    o.geoCountry, o.geoCity, o.createdAt.toISOString(),
  ].map(escapeCsv).join(","));

  const csv = [headers.join(","), ...rows].join("\r\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="enquiries-${new Date().toISOString().slice(0,10)}.csv"`);
  res.send(csv);
});

router.get("/orders", async (req, res, next): Promise<void> => {
  const query = ListOrdersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const filter: Record<string, any> = {};
  if (query.data.status !== undefined) {
    filter.status = query.data.status;
  }

  try {
    const orders = await OrderModel.find(filter).sort({ createdAt: 1 }).lean();
    res.json(ListOrdersResponse.parse(orders.map(serializeDates)));
  } catch (err) {
    next(err);
  }
});

const VALID_ORDER_STATUSES = ["enquiry", "confirmed", "completed", "cancelled"] as const;
const VALID_PAYMENT_STATUSES = ["unpaid", "partially_paid", "paid", "refunded"] as const;

function generateBookingReference(id: number): string {
  const year = new Date().getFullYear();
  const padded = String(id).padStart(4, "0");
  return `ESC-BKG-${year}-${padded}`;
}

router.post("/orders", async (req, res, next): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!parsed.data.guestName?.trim()) {
    res.status(400).json({ error: "guestName cannot be empty" });
    return;
  }
  if (!parsed.data.guestEmail?.trim()) {
    res.status(400).json({ error: "guestEmail cannot be empty" });
    return;
  }
  if (!parsed.data.guestPhone?.trim()) {
    res.status(400).json({ error: "guestPhone cannot be empty" });
    return;
  }
  if (
    parsed.data.guestCount !== undefined &&
    parsed.data.guestCount !== null &&
    (!Number.isInteger(parsed.data.guestCount) || parsed.data.guestCount < 1)
  ) {
    res.status(400).json({ error: "guestCount must be an integer of at least 1" });
    return;
  }
  if (parsed.data.totalAmount !== undefined && parsed.data.totalAmount !== null && parsed.data.totalAmount < 0) {
    res.status(400).json({ error: "totalAmount must be greater than or equal to 0" });
    return;
  }

  const rawStatus = (parsed.data as any).status;
  if (rawStatus && !VALID_ORDER_STATUSES.includes(rawStatus)) {
    res.status(400).json({
      error: `Invalid status "${rawStatus}". Supported statuses: ${VALID_ORDER_STATUSES.join(", ")}`,
    });
    return;
  }

  const rawPaymentStatus = (parsed.data as any).paymentStatus;
  if (rawPaymentStatus && !VALID_PAYMENT_STATUSES.includes(rawPaymentStatus)) {
    res.status(400).json({
      error: `Invalid paymentStatus "${rawPaymentStatus}". Supported statuses: ${VALID_PAYMENT_STATUSES.join(", ")}`,
    });
    return;
  }

  const adminUser = (req.session as any)?.username || "admin";
  const bookingStatus = rawStatus || "confirmed";
  const paymentStatus = rawPaymentStatus || "unpaid";

  // Duplicate safeguard: Prevent identical booking submission created within the last 5 seconds
  const recentDuplicate = await OrderModel.findOne({
    guestEmail: parsed.data.guestEmail.trim(),
    guestPhone: parsed.data.guestPhone.trim(),
    travelDate: parsed.data.travelDate || null,
    createdAt: { $gte: new Date(Date.now() - 5000) },
  }).lean();

  if (recentDuplicate) {
    res.status(409).json({
      error: `A booking for ${parsed.data.guestEmail} was already created recently (#${recentDuplicate.id})`,
      bookingId: recentDuplicate.id,
      bookingReference: recentDuplicate.bookingReference,
    });
    return;
  }

  const ipAddress = (req.ip ?? "").replace(/^::ffff:/, "") || undefined;
  const userAgent = req.headers["user-agent"] || undefined;

  let geo: { geoCountry?: string; geoRegion?: string; geoCity?: string } = {};
  if (ipAddress) {
    try {
      geo = await lookupGeo(ipAddress);
    } catch {
      // non-fatal
    }
  }

  try {
    const id = await getNextSequence("orders");
    const bookingReference = (parsed.data as any).bookingReference || generateBookingReference(id);
    const convertedAt = new Date();

    const orderDoc = await OrderModel.create({
      ...parsed.data,
      id,
      bookingReference,
      status: bookingStatus,
      paymentStatus,
      currency: (parsed.data as any).currency || "INR",
      convertedBy: adminUser,
      convertedAt,
      ipAddress,
      userAgent,
      ...geo,
    });

    const order = orderDoc.toObject();

    // Audit / Activity Log in NotificationModel
    try {
      const notifId = await getNextSequence("notifications");
      await NotificationModel.create({
        id: notifId,
        type: "manual_booking_created",
        category: "administrative",
        relatedType: "order",
        relatedId: id,
        recipientEmail: order.guestEmail,
        recipientName: order.guestName,
        subject: `Manual booking ${bookingReference} created for ${order.guestName}`,
        status: "sent",
        sentBy: adminUser,
        sentAt: convertedAt,
        idempotencyKey: `manual-order-${id}`,
        metadata: {
          orderId: id,
          bookingReference,
          status: bookingStatus,
          paymentStatus,
          totalAmount: order.totalAmount,
          convertedBy: adminUser,
        },
      });
    } catch (auditErr: any) {
      logger.warn({ err: auditErr?.message }, "[OrderRoute] Failed to record manual booking audit entry (non-fatal)");
    }

    // Only trigger booking confirmation automations if created in confirmed status
    if (order.status === "confirmed") {
      triggerBookingConfirmation(order).catch((err) => {
        logger.error({ err: err?.message, orderId: order.id }, "[OrderRoute] Booking confirmation trigger error on create");
      });
      triggerWhatsAppBookingConfirmation(order).catch((err) => {
        logger.error({ err: err?.message, orderId: order.id }, "[OrderRoute] WhatsApp booking confirmation trigger error on create");
      });
    }

    res.status(201).json(GetOrderResponse.parse(serializeDates(order)));
  } catch (err: any) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const order = await OrderModel.findOne({ id: params.data.id }).lean();
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json(GetOrderResponse.parse(serializeDates(order)));
  } catch {
    res.status(404).json({ error: "Order not found" });
  }
});

router.patch("/orders/:id", async (req, res, next): Promise<void> => {
  const params = UpdateOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (
    parsed.data.status !== undefined &&
    !VALID_ORDER_STATUSES.includes(parsed.data.status as any)
  ) {
    res.status(400).json({
      error: `Invalid status "${parsed.data.status}". Supported statuses: ${VALID_ORDER_STATUSES.join(", ")}`,
    });
    return;
  }
  if (
    parsed.data.guestCount !== undefined &&
    parsed.data.guestCount !== null &&
    (!Number.isInteger(parsed.data.guestCount) || parsed.data.guestCount < 1)
  ) {
    res.status(400).json({ error: "guestCount must be an integer of at least 1" });
    return;
  }
  if (parsed.data.totalAmount !== undefined && parsed.data.totalAmount !== null && parsed.data.totalAmount < 0) {
    res.status(400).json({ error: "totalAmount must be greater than or equal to 0" });
    return;
  }

  try {
    const existingOrder = await OrderModel.findOne({ id: params.data.id }).lean();
    if (!existingOrder) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const order = await OrderModel.findOneAndUpdate(
      { id: params.data.id },
      { $set: { ...parsed.data, updatedAt: new Date() } },
      { new: true, runValidators: true }
    ).lean();
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    // Transactional automations on valid state transitions
    if (existingOrder.status !== "confirmed" && order.status === "confirmed") {
      triggerBookingConfirmation(order).catch((err) => {
        logger.error({ err: err?.message, orderId: order.id }, "[OrderRoute] Booking confirmation trigger error");
      });
      triggerWhatsAppBookingConfirmation(order).catch((err) => {
        logger.error({ err: err?.message, orderId: order.id }, "[OrderRoute] WhatsApp booking confirmation error");
      });
      schedulePreTripReminder(order).catch((err) => {
        logger.error({ err: err?.message, orderId: order.id }, "[OrderRoute] Pre-trip reminder schedule error");
      });
    }

    if (existingOrder.status !== "completed" && order.status === "completed") {
      schedulePostTripFeedback(order).catch((err) => {
        logger.error({ err: err?.message, orderId: order.id }, "[OrderRoute] Post-trip feedback schedule error");
      });
    }

    if (existingOrder.status !== "cancelled" && order.status === "cancelled") {
      cancelPostTripFeedback(order.id, "Order cancelled").catch(() => {});
      triggerBookingCancellation(order, parsed.data.notes || "Order cancelled").catch((err) => {
        logger.error({ err: err?.message, orderId: order.id }, "[OrderRoute] Booking cancellation trigger error");
      });
    }

    res.json(UpdateOrderResponse.parse(serializeDates(order)));
  } catch (err: any) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

// Deliver travel documents or vouchers for a confirmed booking
router.post("/orders/:id/documents", async (req, res, next): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid order ID" });
    return;
  }

  const { title, documentType, notes, downloadUrl } = req.body;
  if (!title || typeof title !== "string") {
    res.status(400).json({ error: "Document title is required" });
    return;
  }

  try {
    const order = await OrderModel.findOne({ id }).lean();
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    if (order.status !== "confirmed" && order.status !== "completed") {
      res.status(400).json({ error: "Travel documents can only be issued for confirmed or completed bookings" });
      return;
    }

    const notif = await triggerTravelDocumentDelivery(order, {
      title,
      documentType,
      notes,
      downloadUrl,
    });

    triggerWhatsAppDocumentDelivery(order, title, downloadUrl).catch((err) => {
      logger.error({ err: err?.message, orderId: order.id }, "[OrderRoute] WhatsApp document delivery trigger error");
    });

    res.json({ success: true, notification: notif });
  } catch (err) {
    next(err);
  }
});

router.delete("/orders/:id", async (req, res, next): Promise<void> => {
  const params = DeleteOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const order = await OrderModel.findOneAndDelete({ id: params.data.id }).lean();
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

export default router;
