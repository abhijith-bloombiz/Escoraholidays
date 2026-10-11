import { Router, type IRouter } from "express";
import { PackageModel, getNextSequence } from "@workspace/db";
import {
  ListPackagesQueryParams,
  ListPackagesResponse,
  CreatePackageBody,
  GetPackageParams,
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

router.get("/packages", async (req, res): Promise<void> => {
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
  } catch {
    res.json([]);
  }
});

router.post("/packages", async (req, res): Promise<void> => {
  const parsed = CreatePackageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const id = await getNextSequence("packages");
  const pkg = await PackageModel.create({ ...parsed.data, id });
  res.status(201).json(GetPackageResponse.parse(serializeDates(pkg.toObject())));
});

router.get("/packages/:id", async (req, res): Promise<void> => {
  const params = GetPackageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const pkg = await PackageModel.findOne({ id: params.data.id }).lean();
    if (!pkg) {
      res.status(404).json({ error: "Package not found" });
      return;
    }
    res.json(GetPackageResponse.parse(serializeDates(pkg)));
  } catch {
    res.status(404).json({ error: "Package not found" });
  }
});

router.patch("/packages/:id", async (req, res): Promise<void> => {
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
  const pkg = await PackageModel.findOneAndUpdate(
    { id: params.data.id },
    { $set: { ...parsed.data, updatedAt: new Date() } },
    { new: true }
  ).lean();
  if (!pkg) {
    res.status(404).json({ error: "Package not found" });
    return;
  }
  res.json(UpdatePackageResponse.parse(serializeDates(pkg)));
});

router.delete("/packages/:id", async (req, res): Promise<void> => {
  const params = DeletePackageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const pkg = await PackageModel.findOneAndDelete({ id: params.data.id }).lean();
  if (!pkg) {
    res.status(404).json({ error: "Package not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
