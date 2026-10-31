import { Router, type IRouter } from "express";
import { ExperienceModel, getNextSequence, seedExperiences } from "@workspace/db";
import {
  ListExperiencesQueryParams,
  ListExperiencesResponse,
  CreateExperienceBody,
  GetExperienceResponse,
  UpdateExperienceParams,
  UpdateExperienceBody,
  UpdateExperienceResponse,
  DeleteExperienceParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeExperience<T extends { createdAt: Date; updatedAt: Date }>(row: T) {
  const obj: any = { ...row };
  obj.createdAt = row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt);
  obj.updatedAt = row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt);
  obj.gallery = Array.isArray(obj.gallery) ? obj.gallery : [];
  obj.highlights = Array.isArray(obj.highlights) ? obj.highlights : [];
  obj.inclusions = Array.isArray(obj.inclusions) ? obj.inclusions : [];
  obj.destinations = Array.isArray(obj.destinations)
    ? obj.destinations.map((d: any) => ({
        name: String(d?.name || ""),
        slug: String(d?.slug || ""),
      }))
    : [];
  return obj;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// GET /experiences — Public read endpoint with category & featured filtering
router.get("/experiences", async (req, res, next): Promise<void> => {
  const query = ListExperiencesQueryParams.safeParse(req.query);
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

  if (query.data.category) {
    filter.category = query.data.category;
  }
  if (query.data.featured !== undefined) {
    filter.featured = query.data.featured;
  }

  try {
    // Auto-seed if database is empty so experience CMS is ready out-of-the-box
    const totalCount = await ExperienceModel.countDocuments();
    if (totalCount === 0) {
      await seedExperiences();
    }

    const experiences = await ExperienceModel.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    res.json(ListExperiencesResponse.parse(experiences.map(serializeExperience)));
  } catch (err) {
    next(err);
  }
});

// POST /experiences — Admin only
router.post("/experiences", async (req, res, next): Promise<void> => {
  const parsed = CreateExperienceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!parsed.data.title?.trim()) {
    res.status(400).json({ error: "Experience title cannot be empty" });
    return;
  }
  if (!parsed.data.category?.trim()) {
    res.status(400).json({ error: "Experience category cannot be empty" });
    return;
  }

  const slug = parsed.data.slug?.trim() ? slugify(parsed.data.slug) : slugify(parsed.data.title);

  // Check slug uniqueness
  const existingWithSlug = await ExperienceModel.findOne({ slug }).lean();
  if (existingWithSlug) {
    res.status(400).json({ error: `An experience with slug '${slug}' already exists` });
    return;
  }

  try {
    const id = await getNextSequence("experiences");
    const created = await ExperienceModel.create({
      ...parsed.data,
      id,
      slug,
      gallery: parsed.data.gallery || [],
      highlights: parsed.data.highlights || [],
      inclusions: parsed.data.inclusions || [],
      destinations: parsed.data.destinations || [],
      featured: parsed.data.featured !== undefined ? parsed.data.featured : true,
      published: parsed.data.published !== undefined ? parsed.data.published : true,
      sortOrder: parsed.data.sortOrder !== undefined ? parsed.data.sortOrder : 0,
    });

    res.status(201).json(GetExperienceResponse.parse(serializeExperience(created.toObject())));
  } catch (err: any) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

// GET /experiences/:id — Lookup by numeric ID or string slug
router.get("/experiences/:id", async (req, res, next): Promise<void> => {
  const rawId = req.params.id;
  if (!rawId || typeof rawId !== "string" || !rawId.trim()) {
    res.status(404).json({ error: "Experience not found" });
    return;
  }

  const isNumeric = /^\d+$/.test(rawId);
  const filter: Record<string, any> = isNumeric
    ? { $or: [{ id: Number(rawId) }, { slug: rawId.toLowerCase() }] }
    : { slug: rawId.toLowerCase() };

  const isAdmin = Boolean((req.session as any)?.authenticated);
  if (!isAdmin) {
    filter.published = true;
  }

  try {
    let exp = await ExperienceModel.findOne(filter).lean();

    // If not found and database has 0 experiences, seed and retry
    if (!exp && (await ExperienceModel.countDocuments()) === 0) {
      await seedExperiences();
      exp = await ExperienceModel.findOne(filter).lean();
    }

    if (!exp) {
      res.status(404).json({ error: "Experience not found" });
      return;
    }
    res.json(GetExperienceResponse.parse(serializeExperience(exp)));
  } catch (err) {
    next(err);
  }
});

// PATCH /experiences/:id — Admin only
router.patch("/experiences/:id", async (req, res, next): Promise<void> => {
  const params = UpdateExperienceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateExperienceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.title !== undefined && !parsed.data.title.trim()) {
    res.status(400).json({ error: "Experience title cannot be empty" });
    return;
  }
  if (parsed.data.category !== undefined && !parsed.data.category.trim()) {
    res.status(400).json({ error: "Experience category cannot be empty" });
    return;
  }

  const updateData: Record<string, any> = { ...parsed.data, updatedAt: new Date() };

  if (parsed.data.slug !== undefined) {
    updateData.slug = slugify(parsed.data.slug);
    const existingWithSlug = await ExperienceModel.findOne({
      slug: updateData.slug,
      id: { $ne: params.data.id },
    }).lean();
    if (existingWithSlug) {
      res.status(400).json({ error: `An experience with slug '${updateData.slug}' already exists` });
      return;
    }
  }

  try {
    const updated = await ExperienceModel.findOneAndUpdate(
      { id: params.data.id },
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      res.status(404).json({ error: "Experience not found" });
      return;
    }
    res.json(UpdateExperienceResponse.parse(serializeExperience(updated)));
  } catch (err: any) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

// DELETE /experiences/:id — Admin only
router.delete("/experiences/:id", async (req, res, next): Promise<void> => {
  const params = DeleteExperienceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const deleted = await ExperienceModel.findOneAndDelete({ id: params.data.id }).lean();
    if (!deleted) {
      res.status(404).json({ error: "Experience not found" });
      return;
    }
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

export default router;
