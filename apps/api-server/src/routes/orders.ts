import { Router, type IRouter } from "express";
import { OrderModel, getNextSequence } from "@workspace/db";
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

const router: IRouter = Router();

function serializeDates<T extends { createdAt: Date; updatedAt: Date }>(row: T) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
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
  if (
    parsed.data.guestCount !== undefined &&
    parsed.data.guestCount !== null &&
    (!Number.isInteger(parsed.data.guestCount) || parsed.data.guestCount < 1)
  ) {
    res.status(400).json({ error: "guestCount must be an integer of at least 1" });
    return;
  }

  const ipAddress = (req.ip ?? "").replace(/^::ffff:/, "") || undefined;
  const userAgent = req.headers["user-agent"] || undefined;

  // Fire-and-forget geo lookup so it doesn't slow the response
  const geoPromise = ipAddress ? lookupGeo(ipAddress) : Promise.resolve({});

  let geo: { geoCountry?: string; geoRegion?: string; geoCity?: string } = {};
  try {
    geo = await geoPromise;
  } catch {
    logger.warn("Geo lookup failed");
  }

  try {
    const id = await getNextSequence("orders");
    const orderDoc = await OrderModel.create({
      ...parsed.data,
      id,
      ipAddress,
      userAgent,
      ...geo,
    });

    const order = orderDoc.toObject();

    // Send emails asynchronously — don't block the response
    Promise.all([
      sendBookingConfirmation(order),
      sendAdminBookingNotification(order),
    ]).catch(() => { /* non-fatal */ });

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
    const order = await OrderModel.findOneAndUpdate(
      { id: params.data.id },
      { $set: { ...parsed.data, updatedAt: new Date() } },
      { new: true, runValidators: true }
    ).lean();
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
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
