import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { nanoid } from "nanoid";
import {
  ItineraryTemplateModel,
  ItineraryModel,
  OrderModel,
  seedPredefinedTemplates,
} from "@workspace/db";
import {
  ListItineraryTemplatesQueryParams,
  ListItineraryTemplatesResponse,
  CreateItineraryTemplateBody,
  GetItineraryTemplateParams,
  GetItineraryTemplateResponse,
  UpdateItineraryTemplateParams,
  UpdateItineraryTemplateBody,
  UpdateItineraryTemplateResponse,
  DeleteItineraryTemplateParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeDates<T extends { createdAt: Date; updatedAt: Date }>(row: T) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Helper to check if a template is referenced by any existing customer proposals or orders.
 */
async function checkTemplateReferences(templateId: string, referenceNumber?: string | null, label?: string) {
  const conditions: any[] = [];
  if (referenceNumber) {
    conditions.push({ referenceNumber });
  }
  if (label) {
    conditions.push({ title: { $regex: label, $options: "i" } });
  }

  let itineraryCount = 0;
  if (conditions.length > 0) {
    itineraryCount = await ItineraryModel.countDocuments({ $or: conditions });
  }

  let orderCount = 0;
  if (label) {
    orderCount = await OrderModel.countDocuments({
      $or: [
        { packageName: { $regex: label, $options: "i" } },
        { itineraryTitle: { $regex: label, $options: "i" } },
      ],
    });
  }

  return {
    isReferenced: itineraryCount > 0 || orderCount > 0,
    itineraryCount,
    orderCount,
  };
}

/**
 * GET /api/itinerary-templates
 * List all itinerary templates with optional status filtering.
 * Auto-seeds predefined templates if the collection is empty.
 */
router.get("/itinerary-templates", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const query = ListItineraryTemplatesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  try {
    // Seed predefined templates on first run if database has no templates
    const totalCount = await ItineraryTemplateModel.countDocuments();
    if (totalCount === 0) {
      await seedPredefinedTemplates();
    }

    const filter: Record<string, any> = {};
    if (query.data.status && query.data.status !== "all") {
      filter.status = query.data.status;
    } else if (!query.data.status) {
      // By default exclude archived templates
      filter.status = { $ne: "archived" };
    }

    const templates = await ItineraryTemplateModel.find(filter)
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean();

    res.json(ListItineraryTemplatesResponse.parse(templates.map(serializeDates)));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/itinerary-templates
 * Create a new itinerary template.
 */
router.post("/itinerary-templates", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const parsed = CreateItineraryTemplateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { label, title, description, destination } = parsed.data;

  if (!label?.trim()) {
    res.status(400).json({ error: "Template label cannot be empty" });
    return;
  }
  if (!title?.trim()) {
    res.status(400).json({ error: "Template title cannot be empty" });
    return;
  }
  if (!description?.trim()) {
    res.status(400).json({ error: "Template description cannot be empty" });
    return;
  }
  if (!destination?.trim()) {
    res.status(400).json({ error: "Template destination cannot be empty" });
    return;
  }

  try {
    // Generate an ID if not provided, or normalize provided ID
    let templateId = parsed.data.id?.trim();
    if (!templateId) {
      const slug = label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      templateId = `${slug || "template"}-${nanoid(6)}`;
    } else {
      const existing = await ItineraryTemplateModel.findOne({ id: templateId }).lean();
      if (existing) {
        res.status(400).json({ error: `A template with ID "${templateId}" already exists.` });
        return;
      }
    }

    const created = await ItineraryTemplateModel.create({
      ...parsed.data,
      id: templateId,
      days: parsed.data.days || "[]",
      stays: parsed.data.stays || "[]",
      pricing: parsed.data.pricing || "{}",
      status: parsed.data.status || "active",
      isPredefined: parsed.data.isPredefined ?? false,
      displayOrder: parsed.data.displayOrder ?? 99,
    });

    res.status(201).json(GetItineraryTemplateResponse.parse(serializeDates(created.toObject())));
  } catch (err: any) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

/**
 * GET /api/itinerary-templates/:id
 * Get a specific itinerary template by ID.
 */
router.get("/itinerary-templates/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const params = GetItineraryTemplateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const template = await ItineraryTemplateModel.findOne({ id: params.data.id }).lean();
    if (!template) {
      res.status(404).json({ error: "Itinerary template not found" });
      return;
    }
    res.json(GetItineraryTemplateResponse.parse(serializeDates(template)));
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/itinerary-templates/:id
 * Update an existing itinerary template.
 */
router.patch("/itinerary-templates/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const params = UpdateItineraryTemplateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateItineraryTemplateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.label !== undefined && !parsed.data.label.trim()) {
    res.status(400).json({ error: "Template label cannot be empty" });
    return;
  }
  if (parsed.data.title !== undefined && !parsed.data.title.trim()) {
    res.status(400).json({ error: "Template title cannot be empty" });
    return;
  }
  if (parsed.data.description !== undefined && !parsed.data.description.trim()) {
    res.status(400).json({ error: "Template description cannot be empty" });
    return;
  }
  if (parsed.data.destination !== undefined && !parsed.data.destination.trim()) {
    res.status(400).json({ error: "Template destination cannot be empty" });
    return;
  }

  try {
    const existing = await ItineraryTemplateModel.findOne({ id: params.data.id }).lean();
    if (!existing) {
      res.status(404).json({ error: "Itinerary template not found" });
      return;
    }

    const updated = await ItineraryTemplateModel.findOneAndUpdate(
      { id: params.data.id },
      { $set: { ...parsed.data, updatedAt: new Date() } },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      res.status(404).json({ error: "Itinerary template not found" });
      return;
    }

    res.json(UpdateItineraryTemplateResponse.parse(serializeDates(updated)));
  } catch (err: any) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

/**
 * DELETE /api/itinerary-templates/:id
 * Delete or safely archive an itinerary template.
 * If referenced by proposals or bookings, it archives the template to protect business data.
 */
router.delete("/itinerary-templates/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const params = DeleteItineraryTemplateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const template = await ItineraryTemplateModel.findOne({ id: params.data.id }).lean();
    if (!template) {
      res.status(404).json({ error: "Itinerary template not found" });
      return;
    }

    // Inspect references before deletion
    const refCheck = await checkTemplateReferences(
      template.id,
      template.referenceNumber,
      template.label
    );

    // If template is referenced by proposals/bookings, or if it is a predefined template,
    // safely archive it instead of hard-deleting to avoid breaking existing records
    if (refCheck.isReferenced || template.isPredefined || req.query.archive === "true") {
      await ItineraryTemplateModel.findOneAndUpdate(
        { id: params.data.id },
        { $set: { status: "archived", updatedAt: new Date() } }
      );
      res.sendStatus(204);
      return;
    }

    // If completely unreferenced custom template, hard delete
    await ItineraryTemplateModel.findOneAndDelete({ id: params.data.id });
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

export default router;
