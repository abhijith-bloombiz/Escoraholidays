import { Router, type IRouter, type NextFunction } from "express";
import { PackageModel, OrderModel, getNextSequence } from "@workspace/db";
import {
  ListPackagesQueryParams,
  ListPackagesResponse,
  CreatePackageBody,
  GetPackageResponse,
  UpdatePackageParams,
  UpdatePackageBody,
  UpdatePackageResponse,
  DeletePackageParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeDates<T extends { createdAt: Date; updatedAt: Date }>(row: T) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

router.get("/packages", async (req, res, next): Promise<void> => {
  const query = ListPackagesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const filter: Record<string, any> = {};
  if (query.data.category !== undefined) {
    filter.category = query.data.category;
  }
  if (query.data.published !== undefined) {
    filter.published = query.data.published;
  }
  if (query.data.featured !== undefined) {
    filter.featured = query.data.featured;
  }

  try {
    const packages = await PackageModel.find(filter).sort({ name: 1 }).lean();
    res.json(ListPackagesResponse.parse(packages.map(serializeDates)));
  } catch (err) {
    next(err);
  }
});

router.post("/packages", async (req, res, next): Promise<void> => {
  const parsed = CreatePackageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!parsed.data.name?.trim()) {
    res.status(400).json({ error: "Package name cannot be empty" });
    return;
  }
  if (!parsed.data.slug?.trim()) {
    res.status(400).json({ error: "Package slug cannot be empty" });
    return;
  }
  if (!parsed.data.category?.trim()) {
    res.status(400).json({ error: "Package category cannot be empty" });
    return;
  }
  if (
    parsed.data.durationNights === undefined ||
    parsed.data.durationNights === null ||
    !Number.isInteger(parsed.data.durationNights) ||
    parsed.data.durationNights < 1
  ) {
    res.status(400).json({ error: "durationNights must be an integer of at least 1" });
    return;
  }
  if (parsed.data.priceFrom !== undefined && parsed.data.priceFrom !== null && parsed.data.priceFrom < 0) {
    res.status(400).json({ error: "priceFrom must be greater than or equal to 0" });
    return;
  }

  try {
    const id = await getNextSequence("packages");
    const pkg = await PackageModel.create({ ...parsed.data, id });
    res.status(201).json(GetPackageResponse.parse(serializeDates(pkg.toObject())));
  } catch (err: any) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

router.get("/packages/:id", async (req, res, next): Promise<void> => {
  const rawId = req.params.id;
  if (!rawId || typeof rawId !== "string" || !rawId.trim()) {
    res.status(404).json({ error: "Package not found" });
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
    const pkg = await PackageModel.findOne(filter).lean();
    if (!pkg) {
      res.status(404).json({ error: "Package not found" });
      return;
    }
    res.json(GetPackageResponse.parse(serializeDates(pkg)));
  } catch (err) {
    next(err);
  }
});

router.patch("/packages/:id", async (req, res, next): Promise<void> => {
  const params = UpdatePackageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdatePackageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.name !== undefined && !parsed.data.name.trim()) {
    res.status(400).json({ error: "Package name cannot be empty" });
    return;
  }
  if (parsed.data.slug !== undefined && !parsed.data.slug.trim()) {
    res.status(400).json({ error: "Package slug cannot be empty" });
    return;
  }
  if (parsed.data.category !== undefined && !parsed.data.category.trim()) {
    res.status(400).json({ error: "Package category cannot be empty" });
    return;
  }
  if (
    parsed.data.durationNights !== undefined &&
    parsed.data.durationNights !== null &&
    (!Number.isInteger(parsed.data.durationNights) || parsed.data.durationNights < 1)
  ) {
    res.status(400).json({ error: "durationNights must be an integer of at least 1" });
    return;
  }
  if (parsed.data.priceFrom !== undefined && parsed.data.priceFrom !== null && parsed.data.priceFrom < 0) {
    res.status(400).json({ error: "priceFrom must be greater than or equal to 0" });
    return;
  }

  try {
    const pkg = await PackageModel.findOneAndUpdate(
      { id: params.data.id },
      { $set: { ...parsed.data, updatedAt: new Date() } },
      { new: true, runValidators: true }
    ).lean();
    if (!pkg) {
      res.status(404).json({ error: "Package not found" });
      return;
    }
    res.json(UpdatePackageResponse.parse(serializeDates(pkg)));
  } catch (err: any) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

router.delete("/packages/:id", async (req, res, next): Promise<void> => {
  const params = DeletePackageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    // Check if any existing orders reference this package to preserve history and prevent data loss
    const orderCount = await OrderModel.countDocuments({ packageId: params.data.id });
    if (orderCount > 0) {
      res.status(409).json({
        error: `Cannot delete package #${params.data.id} because ${orderCount} existing order(s) reference it. Consider unpublishing the package instead to preserve historical records.`,
      });
      return;
    }

    const pkg = await PackageModel.findOneAndDelete({ id: params.data.id }).lean();
    if (!pkg) {
      res.status(404).json({ error: "Package not found" });
      return;
    }
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

export default router;
