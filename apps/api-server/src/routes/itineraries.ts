import { Router, type IRouter } from "express";
import { nanoid } from "nanoid";
import { ItineraryModel, getNextSequence } from "@workspace/db";
import {
  ListItinerariesQueryParams,
  ListItinerariesResponse,
  CreateItineraryBody,
  GetItineraryParams,
  GetItineraryResponse,
  GetItineraryByShareTokenParams,
  GetItineraryByShareTokenResponse,
  UpdateItineraryParams,
  UpdateItineraryBody,
  UpdateItineraryResponse,
  DeleteItineraryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeDates<T extends { createdAt: Date; updatedAt: Date }>(row: T) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

router.get("/itineraries", async (req, res): Promise<void> => {
  const query = ListItinerariesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const filter: Record<string, any> = {};
  if (query.data.status !== undefined) {
    filter.status = query.data.status;
  }

  try {
    const itineraries = await ItineraryModel.find(filter).sort({ createdAt: 1 }).lean();
    res.json(ListItinerariesResponse.parse(itineraries.map(serializeDates)));
  } catch {
    res.json([]);
  }
});

router.post("/itineraries", async (req, res): Promise<void> => {
  const parsed = CreateItineraryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const id = await getNextSequence("itineraries");
  const itinerary = await ItineraryModel.create({
    ...parsed.data,
    id,
    shareToken: nanoid(),
  });
  res.status(201).json(GetItineraryResponse.parse(serializeDates(itinerary.toObject())));
});

router.get("/itineraries/share/:token", async (req, res): Promise<void> => {
  const params = GetItineraryByShareTokenParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const itinerary = await ItineraryModel.findOne({ shareToken: params.data.token }).lean();
    if (!itinerary) {
      res.status(404).json({ error: "Itinerary not found" });
      return;
    }
    res.json(GetItineraryByShareTokenResponse.parse(serializeDates(itinerary)));
  } catch {
    res.status(404).json({ error: "Itinerary not found" });
  }
});

router.get("/itineraries/:id", async (req, res): Promise<void> => {
  const params = GetItineraryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const itinerary = await ItineraryModel.findOne({ id: params.data.id }).lean();
    if (!itinerary) {
      res.status(404).json({ error: "Itinerary not found" });
      return;
    }
    res.json(GetItineraryResponse.parse(serializeDates(itinerary)));
  } catch {
    res.status(404).json({ error: "Itinerary not found" });
  }
});

router.patch("/itineraries/:id", async (req, res): Promise<void> => {
  const params = UpdateItineraryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateItineraryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const itinerary = await ItineraryModel.findOneAndUpdate(
    { id: params.data.id },
    { $set: { ...parsed.data, updatedAt: new Date() } },
    { new: true }
  ).lean();
  if (!itinerary) {
    res.status(404).json({ error: "Itinerary not found" });
    return;
  }
  res.json(UpdateItineraryResponse.parse(serializeDates(itinerary)));
});

router.delete("/itineraries/:id", async (req, res): Promise<void> => {
  const params = DeleteItineraryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const itinerary = await ItineraryModel.findOneAndDelete({ id: params.data.id }).lean();
  if (!itinerary) {
    res.status(404).json({ error: "Itinerary not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
