import { Router, type IRouter } from "express";
import { TravelCategoryModel, PackageModel, getNextSequence } from "@workspace/db";
import {
  ListTravelCategoriesQueryParams,
  ListTravelCategoriesResponse,
  CreateTravelCategoryBody,
  GetTravelCategoryResponse,
  UpdateTravelCategoryParams,
  UpdateTravelCategoryBody,
  UpdateTravelCategoryResponse,
  DeleteTravelCategoryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeDates<T extends { createdAt: Date; updatedAt: Date }>(row: T) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

router.get("/travel-categories", async (req, res, next): Promise<void> => {
  const query = ListTravelCategoriesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const isAdmin = Boolean((req.session as any)?.authenticated);
  const filter: Record<string, any> = {};

  if (!isAdmin) {
    filter.published = true;
  } else if (query.data.published !== undefined) {
    filter.published = query.data.published;
  }

  try {
    const categories = await TravelCategoryModel.find(filter)
      .sort({ sortOrder: 1, label: 1 })
      .lean();
    res.json(ListTravelCategoriesResponse.parse(categories.map(serializeDates)));
  } catch (err) {
    next(err);
  }
});

router.post("/travel-categories", async (req, res, next): Promise<void> => {
  const parsed = CreateTravelCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!parsed.data.label?.trim()) {
    res.status(400).json({ error: "Category label cannot be empty" });
    return;
  }
  if (!parsed.data.slug?.trim()) {
    res.status(400).json({ error: "Category slug cannot be empty" });
    return;
  }

  try {
    const id = await getNextSequence("travel_categories");
    const cat = await TravelCategoryModel.create({
      ...parsed.data,
      id,
      label: parsed.data.label.trim(),
      slug: parsed.data.slug.trim(),
    });
    res.status(201).json(GetTravelCategoryResponse.parse(serializeDates(cat.toObject())));
  } catch (err: any) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

router.get("/travel-categories/:id", async (req, res): Promise<void> => {
  const rawId = req.params.id;
  if (!rawId || typeof rawId !== "string" || !rawId.trim()) {
    res.status(404).json({ error: "Travel category not found" });
    return;
  }

  const isNumeric = /^\d+$/.test(rawId);
  const filter: Record<string, any> = isNumeric
    ? { $or: [{ id: Number(rawId) }, { slug: rawId }] }
    : { slug: rawId };

  const isAdmin = Boolean((req.session as any)?.authenticated);
  if (!isAdmin) {
    filter.published = true;
  }

  try {
    const cat = await TravelCategoryModel.findOne(filter).lean();
    if (!cat) {
      res.status(404).json({ error: "Travel category not found" });
      return;
    }
    res.json(GetTravelCategoryResponse.parse(serializeDates(cat)));
  } catch {
    res.status(404).json({ error: "Travel category not found" });
  }
});

router.patch("/travel-categories/:id", async (req, res, next): Promise<void> => {
  const params = UpdateTravelCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTravelCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.label !== undefined && !parsed.data.label.trim()) {
    res.status(400).json({ error: "Category label cannot be empty" });
    return;
  }
  if (parsed.data.slug !== undefined && !parsed.data.slug.trim()) {
    res.status(400).json({ error: "Category slug cannot be empty" });
    return;
  }

  try {
    const updatePayload: Record<string, any> = { ...parsed.data, updatedAt: new Date() };
    if (parsed.data.label !== undefined) updatePayload.label = parsed.data.label.trim();
    if (parsed.data.slug !== undefined) updatePayload.slug = parsed.data.slug.trim();

    const cat = await TravelCategoryModel.findOneAndUpdate(
      { id: params.data.id },
      { $set: updatePayload },
      { new: true, runValidators: true }
    ).lean();
    if (!cat) {
      res.status(404).json({ error: "Travel category not found" });
      return;
    }
    res.json(UpdateTravelCategoryResponse.parse(serializeDates(cat)));
  } catch (err: any) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

router.delete("/travel-categories/:id", async (req, res, next): Promise<void> => {
  const params = DeleteTravelCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const cat = await TravelCategoryModel.findOne({ id: params.data.id }).lean();
    if (!cat) {
      res.status(404).json({ error: "Travel category not found" });
      return;
    }

    // Safety check for dependencies: do any packages reference this category?
    const dependentPackages = await PackageModel.countDocuments({
      category: { $in: [cat.slug, cat.label] },
    });
    if (dependentPackages > 0) {
      res.status(409).json({
        error: `Cannot delete category "${cat.label}" because ${dependentPackages} package(s) reference it. Please reassign or delete those packages first.`,
      });
      return;
    }

    await TravelCategoryModel.deleteOne({ id: params.data.id });
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

export default router;
