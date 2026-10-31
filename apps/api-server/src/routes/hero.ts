import { Router, type IRouter } from "express";
import { HeroSlideModel, HeroConfigModel, getNextSequence, seedHero } from "@workspace/db";
import {
  ListHeroSlidesQueryParams,
  ListHeroSlidesResponse,
  CreateHeroSlideBody,
  GetHeroSlideParams,
  GetHeroSlideResponse,
  UpdateHeroSlideParams,
  UpdateHeroSlideBody,
  UpdateHeroSlideResponse,
  DeleteHeroSlideParams,
  GetHeroConfigResponse,
  UpdateHeroConfigBody,
  UpdateHeroConfigResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeDates(row: any) {
  if (!row) return row;
  const obj: any = { ...row };
  if (row.createdAt) {
    obj.createdAt = row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt);
  }
  if (row.updatedAt) {
    obj.updatedAt = row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt);
  } else {
    obj.updatedAt = new Date().toISOString();
  }
  return obj;
}

// GET /hero/slides — List all slides (published only for public visitors)
router.get("/hero/slides", async (req, res, next): Promise<void> => {
  const query = ListHeroSlidesQueryParams.safeParse(req.query);
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
    const totalCount = await HeroSlideModel.countDocuments();
    if (totalCount === 0) {
      await seedHero();
    }

    const slides = await HeroSlideModel.find(filter)
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    res.json(ListHeroSlidesResponse.parse(slides.map(serializeDates)));
  } catch (err) {
    next(err);
  }
});

// POST /hero/slides — Create hero slide (Admin only)
router.post("/hero/slides", async (req, res, next): Promise<void> => {
  const preparedBody = {
    title: req.body.title || req.body.headingLine1 || "Hero Slide",
    subtitle: req.body.subtitle || "",
    eyebrow: req.body.eyebrow || "GOD'S OWN COUNTRY",
    videoUrl: req.body.videoUrl || "/hero/15015065_1920_1080_60fps.mp4",
    ...req.body,
  };

  const parsed = CreateHeroSlideBody.safeParse(preparedBody);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!parsed.data.headingLine1?.trim()) {
    res.status(400).json({ error: "Heading line 1 cannot be empty" });
    return;
  }

  try {
    const id = await getNextSequence("hero_slides");
    const created = await HeroSlideModel.create({
      ...parsed.data,
      id,
      published: parsed.data.published !== undefined ? parsed.data.published : true,
      sortOrder: parsed.data.sortOrder !== undefined ? parsed.data.sortOrder : 0,
    });

    res.status(201).json(GetHeroSlideResponse.parse(serializeDates(created.toObject())));
  } catch (err: any) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

// GET /hero/slides/:id — Get hero slide by ID
router.get("/hero/slides/:id", async (req, res, next): Promise<void> => {
  const params = GetHeroSlideParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const isAdmin = Boolean((req.session as any)?.authenticated);
  const filter: Record<string, any> = { id: params.data.id };
  if (!isAdmin) {
    filter.published = true;
  }

  try {
    const slide = await HeroSlideModel.findOne(filter).lean();
    if (!slide) {
      res.status(404).json({ error: "Hero slide not found" });
      return;
    }
    res.json(GetHeroSlideResponse.parse(serializeDates(slide)));
  } catch (err) {
    next(err);
  }
});

// PATCH /hero/slides/:id — Update hero slide (Admin only)
router.patch("/hero/slides/:id", async (req, res, next): Promise<void> => {
  const params = UpdateHeroSlideParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateHeroSlideBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const updated = await HeroSlideModel.findOneAndUpdate(
      { id: params.data.id },
      { $set: { ...parsed.data, updatedAt: new Date() } },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      res.status(404).json({ error: "Hero slide not found" });
      return;
    }
    res.json(UpdateHeroSlideResponse.parse(serializeDates(updated)));
  } catch (err: any) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

// DELETE /hero/slides/:id — Delete hero slide (Admin only)
router.delete("/hero/slides/:id", async (req, res, next): Promise<void> => {
  const params = DeleteHeroSlideParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const deleted = await HeroSlideModel.findOneAndDelete({ id: params.data.id }).lean();
    if (!deleted) {
      res.status(404).json({ error: "Hero slide not found" });
      return;
    }
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

// GET /hero/config — Get hero global configuration
router.get("/hero/config", async (req, res, next): Promise<void> => {
  try {
    let config: any = await HeroConfigModel.findOne({ id: "default" }).lean();
    if (!config) {
      await seedHero();
      config = await HeroConfigModel.findOne({ id: "default" }).lean();
    }

    if (!config) {
      config = {
        id: "default",
        eyebrowBadge: "GOD'S OWN COUNTRY",
        showSearchBar: false,
        slideDuration: 7,
        centerDestinationOverride: null,
        companionOverrides: null,
        updatedAt: new Date(),
      };
    }

    res.json(GetHeroConfigResponse.parse(serializeDates(config)));
  } catch (err) {
    next(err);
  }
});

// PATCH /hero/config — Update hero global configuration (Admin only)
router.patch("/hero/config", async (req, res, next): Promise<void> => {
  const parsed = UpdateHeroConfigBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const updated = await HeroConfigModel.findOneAndUpdate(
      { id: "default" },
      { $set: { ...parsed.data, updatedAt: new Date() } },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    if (!updated) {
      res.status(404).json({ error: "Failed to update hero config" });
      return;
    }

    res.json(UpdateHeroConfigResponse.parse(serializeDates(updated)));
  } catch (err: any) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

export default router;
