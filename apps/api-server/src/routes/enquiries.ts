import { Router, type IRouter } from "express";
import { EnquiryModel, getNextSequence } from "@workspace/db";
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
} from "@workspace/api-zod";
import { sendContactConfirmation, sendAdminContactNotification } from "../lib/email";

const router: IRouter = Router();

function serializeDates<T extends { createdAt: Date; updatedAt: Date }>(row: T) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

router.post("/enquiries", async (req, res): Promise<void> => {
  const parsed = CreateEnquiryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const id = await getNextSequence("enquiries");
  const enquiryDoc = await EnquiryModel.create({ ...parsed.data, id });
  const enquiry = enquiryDoc.toObject();
  const serialized = serializeDates(enquiry);

  // Send emails asynchronously — don't block the response
  Promise.all([
    sendContactConfirmation(enquiry),
    sendAdminContactNotification(enquiry),
  ]).catch(() => { /* non-fatal */ });

  res.status(201).json(GetEnquiryResponse.parse(serialized));
});

router.get("/enquiries", async (req, res): Promise<void> => {
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
  } catch {
    res.json([]);
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

router.patch("/enquiries/:id", async (req, res): Promise<void> => {
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
  const row = await EnquiryModel.findOneAndUpdate(
    { id: params.data.id },
    { $set: { ...parsed.data, updatedAt: new Date() } },
    { new: true }
  ).lean();
  if (!row) {
    res.status(404).json({ error: "Enquiry not found" });
    return;
  }
  res.json(UpdateEnquiryResponse.parse(serializeDates(row)));
});

router.delete("/enquiries/:id", async (req, res): Promise<void> => {
  const params = DeleteEnquiryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const row = await EnquiryModel.findOneAndDelete({ id: params.data.id }).lean();
  if (!row) {
    res.status(404).json({ error: "Enquiry not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
