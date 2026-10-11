import { Router, type IRouter } from "express";
import { DestinationModel, getNextSequence } from "@workspace/db";
import {
  ListDestinationsQueryParams,
  ListDestinationsResponse,
  CreateDestinationBody,
  GetDestinationParams,
  GetDestinationResponse,
  UpdateDestinationParams,
  UpdateDestinationBody,
  UpdateDestinationResponse,
  DeleteDestinationParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeDates<T extends { createdAt: Date; updatedAt: Date }>(row: T) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

router.get("/destinations", async (req, res): Promise<void> => {
  const query = ListDestinationsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const filter: Record<string, any> = {};
  if (query.data.type !== undefined) {
    filter.type = query.data.type;
  }
  if (query.data.published !== undefined) {
    filter.published = query.data.published;
  }

  try {
    const destinations = await DestinationModel.find(filter).sort({ name: 1 }).lean();
    res.json(ListDestinationsResponse.parse(destinations.map(serializeDates)));
  } catch {
    res.json([]);
  }
});

router.post("/destinations", async (req, res): Promise<void> => {
  const parsed = CreateDestinationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const id = await getNextSequence("destinations");
  const dest = await DestinationModel.create({ ...parsed.data, id });
  res.status(201).json(GetDestinationResponse.parse(serializeDates(dest.toObject())));
});

router.get("/destinations/:id", async (req, res): Promise<void> => {
  const params = GetDestinationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const dest = await DestinationModel.findOne({ id: params.data.id }).lean();
    if (!dest) {
      res.status(404).json({ error: "Destination not found" });
      return;
    }
    res.json(GetDestinationResponse.parse(serializeDates(dest)));
  } catch {
    res.status(404).json({ error: "Destination not found" });
  }
});

router.patch("/destinations/:id", async (req, res): Promise<void> => {
  const params = UpdateDestinationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateDestinationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const dest = await DestinationModel.findOneAndUpdate(
    { id: params.data.id },
    { $set: { ...parsed.data, updatedAt: new Date() } },
    { new: true }
  ).lean();
  if (!dest) {
    res.status(404).json({ error: "Destination not found" });
    return;
  }
  res.json(UpdateDestinationResponse.parse(serializeDates(dest)));
});

router.delete("/destinations/:id", async (req, res): Promise<void> => {
  const params = DeleteDestinationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const dest = await DestinationModel.findOneAndDelete({ id: params.data.id }).lean();
  if (!dest) {
    res.status(404).json({ error: "Destination not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
