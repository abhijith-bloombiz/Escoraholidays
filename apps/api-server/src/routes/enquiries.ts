import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { EnquiryModel, ItineraryModel, OrderModel, NotificationModel, getNextSequence } from "@workspace/db";
import {
  ListEnquiriesQueryParams,
  ListEnquiriesResponse,
  CreateEnquiryBody,
  GetEnquiryParams,
  GetEnquiryResponse,
  UpdateEnquiryParams,
  UpdateEnquiryBody,
  UpdateEnquiryResponse,
  DeleteEnquiryParams,
  AssistEnquiryParams,
  AssistEnquiryBody,
  AssistEnquiryResponse,
  ConvertEnquiryParams,
  ConvertEnquiryBody,
} from "@workspace/api-zod";
import { sendContactConfirmation, sendAdminContactNotification } from "../lib/email";
import {
  scheduleEnquiryFollowup,
  cancelEnquiryFollowup,
  triggerEnquiryAcknowledgement,
  sendManualAdminEmail,
  triggerBookingConfirmation,
} from "../services/notification-service";
import {
  triggerWhatsAppEnquiryAcknowledgement,
  triggerWhatsAppBookingConfirmation,
} from "../services/whatsapp";
import { aiService, AiServiceError, assistEnquiry } from "../services/ai";
import { createRateLimiter } from "../middleware/rate-limiter";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const enquiryAiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many AI assistant requests. Please wait a moment before trying again.",
});

function serializeDates<T extends { createdAt: Date; updatedAt: Date; convertedAt?: any; [key: string]: any }>(row: T) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    convertedAt: row.convertedAt
      ? (row.convertedAt instanceof Date ? row.convertedAt.toISOString() : String(row.convertedAt))
      : null,
    bookingId: row.bookingId ?? null,
    bookingReference: row.bookingReference ?? null,
    convertedBy: row.convertedBy ?? null,
  };
}

function generateBookingReference(id: number): string {
  const year = new Date().getFullYear();
  const padded = String(id).padStart(4, "0");
  return `ESC-BKG-${year}-${padded}`;
}

const VALID_ENQUIRY_STATUSES = ["new", "read", "replied", "converted"] as const;

router.post("/enquiries", async (req, res, next): Promise<void> => {
  const parsed = CreateEnquiryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!parsed.data.name?.trim()) {
    res.status(400).json({ error: "Name cannot be empty" });
    return;
  }
  if (!parsed.data.email?.trim()) {
    res.status(400).json({ error: "Email cannot be empty" });
    return;
  }
  if (!parsed.data.message?.trim()) {
    res.status(400).json({ error: "Message cannot be empty" });
    return;
  }

  try {
    const id = await getNextSequence("enquiries");
    const enquiryDoc = await EnquiryModel.create({ ...parsed.data, id });
    const enquiry = enquiryDoc.toObject();
    const serialized = serializeDates(enquiry);

    // Send emails and WhatsApp notifications asynchronously — don't block the response
    Promise.all([
      sendContactConfirmation(enquiry),
      sendAdminContactNotification(enquiry),
      triggerEnquiryAcknowledgement(enquiry),
      triggerWhatsAppEnquiryAcknowledgement(enquiry),
    ]).catch(() => { /* non-fatal */ });

    // Schedule polite customer follow-up in durable DB queue
    scheduleEnquiryFollowup(enquiry).catch((err) => {
      logger.error({ err: err?.message, enquiryId: enquiry.id }, "[EnquiryRoute] Failed to schedule enquiry follow-up");
    });

    res.status(201).json(GetEnquiryResponse.parse(serialized));
  } catch (err: any) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

router.get("/enquiries", async (req, res, next): Promise<void> => {
  const query = ListEnquiriesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const filter: Record<string, any> = {};
  if (query.data.status) {
    filter.status = query.data.status;
  }

  try {
    const rows = await EnquiryModel.find(filter).sort({ createdAt: 1 }).lean();
    res.json(ListEnquiriesResponse.parse(rows.map(serializeDates)));
  } catch (err) {
    next(err);
  }
});

router.get("/enquiries/:id", async (req, res): Promise<void> => {
  const params = GetEnquiryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const row = await EnquiryModel.findOne({ id: params.data.id }).lean();
    if (!row) {
      res.status(404).json({ error: "Enquiry not found" });
      return;
    }
    res.json(GetEnquiryResponse.parse(serializeDates(row)));
  } catch {
    res.status(404).json({ error: "Enquiry not found" });
  }
});

router.get("/enquiries/:id/proposals", async (req, res, next): Promise<void> => {
  const params = GetEnquiryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const proposals = await ItineraryModel.find({ enquiryId: params.data.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(proposals.map(serializeDates));
  } catch (err) {
    next(err);
  }
});

router.patch("/enquiries/:id", async (req, res, next): Promise<void> => {
  const params = UpdateEnquiryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateEnquiryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (
    parsed.data.status !== undefined &&
    !VALID_ENQUIRY_STATUSES.includes(parsed.data.status as any)
  ) {
    res.status(400).json({
      error: `Invalid status "${parsed.data.status}". Supported statuses: ${VALID_ENQUIRY_STATUSES.join(", ")}`,
    });
    return;
  }

  try {
    const row = await EnquiryModel.findOneAndUpdate(
      { id: params.data.id },
      { $set: { ...parsed.data, updatedAt: new Date() } },
      { new: true, runValidators: true }
    ).lean();
    if (!row) {
      res.status(404).json({ error: "Enquiry not found" });
      return;
    }

    // If enquiry was marked as replied, cancel any pending customer follow-up
    if (row.status === "replied") {
      cancelEnquiryFollowup(row.id, "Staff replied to enquiry").catch(() => {});
    }

    res.json(UpdateEnquiryResponse.parse(serializeDates(row)));
  } catch (err: any) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

router.delete("/enquiries/:id", async (req, res, next): Promise<void> => {
  const params = DeleteEnquiryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const row = await EnquiryModel.findOneAndDelete({ id: params.data.id }).lean();
    if (!row) {
      res.status(404).json({ error: "Enquiry not found" });
      return;
    }

    // Cancel pending follow-up job if enquiry is deleted
    cancelEnquiryFollowup(params.data.id, "Enquiry deleted").catch(() => {});

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/enquiries/:id/ai-assist
 * Admin AI Enquiry Assistant:
 * Analyzes the enquiry, extracts verified facts, drafts personalized slow-luxury reply,
 * and recommends next actions. Requires authenticated admin session.
 */
router.post(
  "/enquiries/:id/ai-assist",
  enquiryAiRateLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params = AssistEnquiryParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const bodyParsed = AssistEnquiryBody.safeParse(req.body || {});
    if (!bodyParsed.success) {
      res.status(400).json({ error: bodyParsed.error.message });
      return;
    }

    try {
      const enquiry = await EnquiryModel.findOne({ id: params.data.id }).lean();
      if (!enquiry) {
        res.status(404).json({ error: "Enquiry not found" });
        return;
      }

      if (!aiService.isConfigured()) {
        res.status(503).json({
          error: "The Escora AI Enquiry Assistant is currently offline for maintenance.",
          code: "MISSING_CONFIG",
        });
        return;
      }

      const result = await assistEnquiry({
        enquiry: {
          id: enquiry.id,
          name: enquiry.name,
          email: enquiry.email,
          phone: enquiry.phone,
          message: enquiry.message,
          status: enquiry.status,
          createdAt: enquiry.createdAt,
        },
        focusPrompt: bodyParsed.data.focusPrompt,
        replyTone: bodyParsed.data.replyTone,
      });

      res.json(result);
    } catch (err: any) {
      if (err instanceof AiServiceError) {
        res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
          provider: err.provider,
        });
        return;
      }

      logger.warn({ err: err?.message }, "[EnquiryRoute] Unexpected error during AI assistance");
      res.status(500).json({
        error: "An unexpected error occurred while processing the enquiry assistant request.",
      });
    }
  }
);

/**
 * POST /api/enquiries/:id/reply
 * Allows staff to send a custom reviewed response to a customer enquiry.
 * Updates enquiry status to "replied" and cancels any pending automated follow-up.
 */
router.post("/enquiries/:id/reply", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid enquiry ID" });
    return;
  }

  const { title, replyMessage, markReplied = true } = req.body;
  if (!replyMessage || typeof replyMessage !== "string" || !replyMessage.trim()) {
    res.status(400).json({ error: "Reply message cannot be empty" });
    return;
  }

  try {
    const enquiry = await EnquiryModel.findOne({ id }).lean();
    if (!enquiry) {
      res.status(404).json({ error: "Enquiry not found" });
      return;
    }

    const notification = await sendManualAdminEmail({
      type: "custom_enquiry_response",
      category: "administrative",
      relatedType: "enquiry",
      relatedId: enquiry.id,
      recipientEmail: enquiry.email,
      recipientName: enquiry.name,
      title: title?.trim() || `Reply to Your Escora Journey Enquiry (#${enquiry.id})`,
      bodyHtml: `<p style="white-space: pre-wrap;">${replyMessage.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`,
    });

    if (markReplied) {
      await EnquiryModel.updateOne({ id }, { $set: { status: "replied", updatedAt: new Date() } });
      await cancelEnquiryFollowup(enquiry.id, "Staff sent manual response");
    }

    res.json({ success: true, notification });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/enquiries/:id/proposals
 * Returns all itinerary proposals linked to this customer enquiry in newest-first order.
 */
router.get("/enquiries/:id/proposals", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const enquiryId = Number(req.params.id);
  if (Number.isNaN(enquiryId)) {
    res.status(400).json({ error: "Invalid enquiry ID" });
    return;
  }

  try {
    const proposals = await ItineraryModel.find({ enquiryId }).sort({ createdAt: -1 }).lean();
    res.json(proposals.map(serializeDates));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/enquiries/:id/convert
 * Manually converts an enquiry into an official booking (Order).
 * Preserves customer details, trip parameters, itinerary snapshot, and commercial terms.
 * Updates enquiry status to 'converted' with linked booking reference.
 * Restricts access to authorized admin sessions.
 */
router.post("/enquiries/:id/convert", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const params = ConvertEnquiryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const enquiryId = params.data.id;
  const parsed = ConvertEnquiryBody.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const adminUser = (req.session as any)?.username || "admin";

  try {
    // 1. Verify enquiry exists
    const enquiry = await EnquiryModel.findOne({ id: enquiryId });
    if (!enquiry) {
      res.status(404).json({ error: `Enquiry #${enquiryId} not found` });
      return;
    }

    // 2. Check for duplicate conversion (idempotency & concurrency safeguard)
    if (enquiry.status === "converted" || enquiry.bookingId) {
      const existingBooking = await OrderModel.findOne({
        $or: [{ id: enquiry.bookingId }, { enquiryId }],
      }).lean();

      res.status(409).json({
        error: `Enquiry #${enquiryId} has already been converted to booking #${existingBooking?.id || enquiry.bookingId}`,
        bookingId: existingBooking?.id || enquiry.bookingId,
        bookingReference: existingBooking?.bookingReference || enquiry.bookingReference,
      });
      return;
    }

    const existingOrder = await OrderModel.findOne({ enquiryId }).lean();
    if (existingOrder) {
      await EnquiryModel.updateOne(
        { id: enquiryId },
        {
          $set: {
            status: "converted",
            bookingId: existingOrder.id,
            bookingReference: existingOrder.bookingReference,
            convertedAt: existingOrder.convertedAt || new Date(),
            convertedBy: existingOrder.convertedBy || adminUser,
            updatedAt: new Date(),
          },
        }
      );

      res.status(409).json({
        error: `Enquiry #${enquiryId} has already been converted to booking #${existingOrder.id}`,
        bookingId: existingOrder.id,
        bookingReference: existingOrder.bookingReference,
      });
      return;
    }

    // 3. Resolve proposal / itinerary details if provided
    let itineraryDoc: any = null;
    let itinerarySnapshot: string | null = null;
    let pricingDetails: string | null = null;
    let itineraryTitle: string | null = null;
    const input = parsed.data;
    const rawProposalId = typeof (req.body as any)?.proposalId === "number" ? (req.body as any).proposalId : undefined;
    const targetItineraryId = input.itineraryId || rawProposalId;

    if (targetItineraryId) {
      itineraryDoc = await ItineraryModel.findOne({ id: targetItineraryId });
      if (!itineraryDoc) {
        res.status(400).json({ error: `Selected itinerary proposal #${targetItineraryId} was not found` });
        return;
      }

      // Snapshot the accepted itinerary configuration
      itineraryTitle = itineraryDoc.title;
      itinerarySnapshot = JSON.stringify({
        id: itineraryDoc.id,
        title: itineraryDoc.title,
        shareToken: itineraryDoc.shareToken,
        destination: itineraryDoc.destination,
        startDate: itineraryDoc.startDate,
        endDate: itineraryDoc.endDate,
        summary: itineraryDoc.summary,
        days: itineraryDoc.days,
        stays: itineraryDoc.stays,
        inclusions: itineraryDoc.inclusions,
        exclusions: itineraryDoc.exclusions,
        tripIncludes: itineraryDoc.tripIncludes,
        transportation: itineraryDoc.transportation,
        hotelTerms: itineraryDoc.hotelTerms,
        paymentTerms: itineraryDoc.paymentTerms,
        importantInfo: itineraryDoc.importantInfo,
      });
      pricingDetails = itineraryDoc.pricing;
    }

    // 4. Resolve customer information (enquiry baseline with optional overrides)
    const guestName = (input.guestName || enquiry.name || "").trim();
    const guestEmail = (input.guestEmail || enquiry.email || "").trim();
    const guestPhone = (input.guestPhone || enquiry.phone || "").trim();

    if (!guestName) {
      res.status(400).json({ error: "Customer guest name is required for booking conversion" });
      return;
    }
    if (!guestEmail) {
      res.status(400).json({ error: "Customer email is required for booking conversion" });
      return;
    }
    if (!guestPhone) {
      res.status(400).json({ error: "Customer phone number is required for booking conversion" });
      return;
    }

    // 5. Resolve trip parameters
    const destinations = (
      input.destinations ||
      itineraryDoc?.destination ||
      ""
    ).trim();

    if (!destinations) {
      res.status(400).json({
        error: "Destination or package must be established before conversion to booking",
      });
      return;
    }

    const travelDate = (input.travelDate || itineraryDoc?.startDate || "").trim();
    if (!travelDate) {
      res.status(400).json({
        error: "Requested arrival travel date must be established before conversion to booking",
      });
      return;
    }

    const departureDate = (input.departureDate || itineraryDoc?.endDate || "").trim() || undefined;

    let guestCount = input.guestCount;
    if (guestCount === undefined || guestCount === null) {
      if (itineraryDoc?.adults || itineraryDoc?.children) {
        guestCount = (itineraryDoc.adults || 0) + (itineraryDoc.children || 0) + (itineraryDoc.infants || 0);
      }
    }
    if (!guestCount || guestCount < 1) {
      guestCount = 1;
    }

    // 6. Resolve pricing & commercial terms
    let totalAmount = input.totalAmount;
    if (totalAmount === undefined || totalAmount === null) {
      if (itineraryDoc?.pricing) {
        try {
          const parsedPricing = JSON.parse(itineraryDoc.pricing);
          totalAmount = Number(parsedPricing.total) || 0;
        } catch {
          totalAmount = 0;
        }
      } else {
        totalAmount = 0;
      }
    }
    if (totalAmount < 0) {
      res.status(400).json({ error: "Total amount cannot be negative" });
      return;
    }

    const currency = (input.currency || itineraryDoc?.currency || "INR").trim();
    const paymentTerms = (input.paymentTerms || itineraryDoc?.paymentTerms || "Standard deposit upon confirmation").trim();

    // 7. Booking & Payment statuses (tracked independently)
    const targetStatus = input.status || (req.body as any)?.bookingStatus;
    const bookingStatus = (targetStatus === "confirmed" ? "confirmed" : "enquiry");
    const paymentStatus = (input.paymentStatus === "partially_paid" ? "partially_paid" : "unpaid");

    const travelStyle = input.travelStyle || "Bespoke Kerala Journey";
    const specialRequests = input.specialRequests || undefined;
    const internalNotes = input.notes || `Manually converted from Inbox Enquiry #${enquiryId} by ${adminUser}`;

    // 8. Generate sequence ID and booking reference
    const orderId = await getNextSequence("orders");
    const bookingReference = generateBookingReference(orderId);
    const convertedAt = new Date();

    // 9. Atomic creation with fallback safety
    let createdOrder: any = null;
    try {
      createdOrder = await OrderModel.create({
        id: orderId,
        bookingReference,
        enquiryId,
        itineraryId: itineraryDoc?.id || null,
        itineraryTitle,
        guestName,
        guestEmail,
        guestPhone,
        travelStyle,
        destinations,
        travelDate,
        departureDate,
        guestCount,
        totalAmount,
        currency,
        status: bookingStatus,
        paymentStatus,
        paymentTerms,
        specialRequests,
        notes: internalNotes,
        pricingDetails,
        itinerarySnapshot,
        convertedBy: adminUser,
        convertedAt,
      });

      // Update Enquiry to converted state with linkage
      await EnquiryModel.updateOne(
        { id: enquiryId },
        {
          $set: {
            status: "converted",
            bookingId: orderId,
            bookingReference,
            convertedAt,
            convertedBy: adminUser,
            updatedAt: new Date(),
          },
        }
      );

      // If an itinerary proposal was linked, ensure its status is marked as confirmed
      if (itineraryDoc && itineraryDoc.status !== "confirmed") {
        await ItineraryModel.updateOne(
          { id: itineraryDoc.id },
          { $set: { status: "confirmed", updatedAt: new Date() } }
        );
      }
    } catch (createErr: any) {
      if (createdOrder) {
        await OrderModel.deleteOne({ id: orderId }).catch(() => {});
      }
      throw createErr;
    }

    // 10. Audit / Activity Log in NotificationModel
    try {
      const notifId = await getNextSequence("notifications");
      await NotificationModel.create({
        id: notifId,
        type: "enquiry_conversion",
        category: "administrative",
        relatedType: "enquiry",
        relatedId: enquiryId,
        recipientEmail: guestEmail,
        recipientName: guestName,
        subject: `Enquiry #${enquiryId} converted to Booking ${bookingReference}`,
        status: "sent",
        sentBy: adminUser,
        sentAt: convertedAt,
        idempotencyKey: `conversion-${enquiryId}-${orderId}`,
        metadata: {
          enquiryId,
          orderId,
          bookingReference,
          itineraryId: itineraryDoc?.id,
          totalAmount,
          currency,
          convertedBy: adminUser,
          bookingStatus,
          paymentStatus,
        },
      });
    } catch (auditErr: any) {
      logger.warn({ err: auditErr?.message }, "[EnquiryRoute] Failed to record conversion audit entry (non-fatal)");
    }

    // 11. Cancel any pending automated enquiry follow-up
    cancelEnquiryFollowup(enquiryId, `Enquiry converted to booking ${bookingReference}`).catch(() => {});

    // 12. If created directly in confirmed status, trigger confirmation automations
    if (bookingStatus === "confirmed") {
      triggerBookingConfirmation(createdOrder).catch(() => {});
      triggerWhatsAppBookingConfirmation(createdOrder).catch(() => {});
    }

    // Fetch refreshed enquiry doc
    const updatedEnquiry = await EnquiryModel.findOne({ id: enquiryId }).lean();

    res.status(201).json({
      success: true,
      booking: serializeDates(createdOrder.toObject()),
      enquiry: serializeDates(updatedEnquiry!),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
