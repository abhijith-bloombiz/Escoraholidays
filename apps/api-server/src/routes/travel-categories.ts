import { Router, type IRouter } from "express";
import { TravelCategoryModel, getNextSequence } from "@workspace/db";
import {
  ListTravelCategoriesQueryParams,
  ListTravelCategoriesResponse,
  CreateTravelCategoryBody,
  GetTravelCategoryParams,
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

router.get("/travel-categories", async (req, res): Promise<void> => {
  const query = ListTravelCategoriesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const filter: Record<string, any> = {};
  if (query.data.published !== undefined) {
    filter.published = query.data.published;
  }

  try {
    const categories = await TravelCategoryModel.find(filter)
      .sort({ sortOrder: 1, label: 1 })
      .lean();
    res.json(ListTravelCategoriesResponse.parse(categories.map(serializeDates)));
  } catch {
    res.json([]);
  }
});

router.post("/travel-categories", async (req, res): Promise<void> => {
  const parsed = CreateTravelCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const id = await getNextSequence("travel_categories");
  const cat = await TravelCategoryModel.create({ ...parsed.data, id });
  res.status(201).json(GetTravelCategoryResponse.parse(serializeDates(cat.toObject())));
});

router.get("/travel-categories/:id", async (req, res): Promise<void> => {
  const params = GetTravelCategoryParams.safeParse(req.params);
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
    res.json(GetTravelCategoryResponse.parse(serializeDates(cat)));
  } catch {
    res.status(404).json({ error: "Travel category not found" });
  }
});

router.patch("/travel-categories/:id", async (req, res): Promise<void> => {
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
  const cat = await TravelCategoryModel.findOneAndUpdate(
    { id: params.data.id },
    { $set: { ...parsed.data, updatedAt: new Date() } },
    { new: true }
  ).lean();
  if (!cat) {
    res.status(404).json({ error: "Travel category not found" });
    return;
  }
  res.json(UpdateTravelCategoryResponse.parse(serializeDates(cat)));
});

router.delete("/travel-categories/:id", async (req, res): Promise<void> => {
  const params = DeleteTravelCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const cat = await TravelCategoryModel.findOneAndDelete({ id: params.data.id }).lean();
  if (!cat) {
    res.status(404).json({ error: "Travel category not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
