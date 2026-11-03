import { Router, type IRouter, type NextFunction } from "express";
import { DestinationModel, getNextSequence } from "@workspace/db";
import {
  ListDestinationsQueryParams,
  ListDestinationsResponse,
  CreateDestinationBody,
  GetDestinationResponse,
  UpdateDestinationParams,
  UpdateDestinationBody,
  UpdateDestinationResponse,
  DeleteDestinationParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeDates<T extends { createdAt: Date; updatedAt: Date }>(row: T) {
  const r = row as any;
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    galleryImages: Array.isArray(r.galleryImages) ? JSON.stringify(r.galleryImages) : r.galleryImages ?? null,
    highlights: Array.isArray(r.highlights) ? JSON.stringify(r.highlights) : r.highlights ?? null,
  };
}

router.get("/destinations", async (req, res, next): Promise<void> => {
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
  if ((query.data as any).featured !== undefined) {
    filter.featured = (query.data as any).featured;
  }

  try {
    const destinations = await DestinationModel.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
    res.json(ListDestinationsResponse.parse(destinations.map(serializeDates)));
  } catch (err) {
    next(err);
  }
});

router.post("/destinations", async (req, res, next): Promise<void> => {
  const parsed = CreateDestinationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!parsed.data.name?.trim()) {
    res.status(400).json({ error: "Destination name cannot be empty" });
    return;
  }
  if (!parsed.data.slug?.trim()) {
    res.status(400).json({ error: "Destination slug cannot be empty" });
    return;
  }
  if (!parsed.data.region?.trim()) {
    res.status(400).json({ error: "Destination region cannot be empty" });
    return;
  }
  if (!parsed.data.type?.trim()) {
    res.status(400).json({ error: "Destination type cannot be empty" });
    return;
  }
  if (parsed.data.nightsMin !== undefined && parsed.data.nightsMin !== null && parsed.data.nightsMin < 0) {
    res.status(400).json({ error: "nightsMin must be greater than or equal to 0" });
    return;
  }
  if (parsed.data.nightsMax !== undefined && parsed.data.nightsMax !== null && parsed.data.nightsMax < 0) {
    res.status(400).json({ error: "nightsMax must be greater than or equal to 0" });
    return;
  }

  try {
    const id = await getNextSequence("destinations");
    const dest = await DestinationModel.create({ ...parsed.data, id });
    res.status(201).json(GetDestinationResponse.parse(serializeDates(dest.toObject())));
  } catch (err: any) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

router.get("/destinations/:id", async (req, res, next): Promise<void> => {
  const rawId = req.params.id;
  if (!rawId || typeof rawId !== "string" || !rawId.trim()) {
    res.status(404).json({ error: "Destination not found" });
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
    const dest = await DestinationModel.findOne(filter).lean();
    if (!dest) {
      res.status(404).json({ error: "Destination not found" });
      return;
    }
    res.json(GetDestinationResponse.parse(serializeDates(dest)));
  } catch (err) {
    next(err);
  }
});

router.patch("/destinations/:id", async (req, res, next): Promise<void> => {
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

  if (parsed.data.name !== undefined && !parsed.data.name.trim()) {
    res.status(400).json({ error: "Destination name cannot be empty" });
    return;
  }
  if (parsed.data.slug !== undefined && !parsed.data.slug.trim()) {
    res.status(400).json({ error: "Destination slug cannot be empty" });
    return;
  }
  if (parsed.data.region !== undefined && !parsed.data.region.trim()) {
    res.status(400).json({ error: "Destination region cannot be empty" });
    return;
  }
  if (parsed.data.type !== undefined && !parsed.data.type.trim()) {
    res.status(400).json({ error: "Destination type cannot be empty" });
    return;
  }
  if (parsed.data.nightsMin !== undefined && parsed.data.nightsMin !== null && parsed.data.nightsMin < 0) {
    res.status(400).json({ error: "nightsMin must be greater than or equal to 0" });
    return;
  }
  if (parsed.data.nightsMax !== undefined && parsed.data.nightsMax !== null && parsed.data.nightsMax < 0) {
    res.status(400).json({ error: "nightsMax must be greater than or equal to 0" });
    return;
  }

  try {
    const dest = await DestinationModel.findOneAndUpdate(
      { id: params.data.id },
      { $set: { ...parsed.data, updatedAt: new Date() } },
      { new: true, runValidators: true }
    ).lean();
    if (!dest) {
      res.status(404).json({ error: "Destination not found" });
      return;
    }
    res.json(UpdateDestinationResponse.parse(serializeDates(dest)));
  } catch (err: any) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

router.delete("/destinations/:id", async (req, res, next): Promise<void> => {
  const params = DeleteDestinationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const dest = await DestinationModel.findOneAndDelete({ id: params.data.id }).lean();
    if (!dest) {
      res.status(404).json({ error: "Destination not found" });
      return;
    }
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

export default router;
