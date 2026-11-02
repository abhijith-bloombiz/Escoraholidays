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
  if (obj.duration !== undefined && obj.duration !== null) {
    const d = Number(obj.duration);
    obj.duration = !isNaN(d) && d > 0 ? d : 8;
  } else {
    obj.duration = 8;
  }
  return obj;
}

// Automatically re-sequences slides so every slide has a distinct, 1-based sequential sortOrder (1, 2, 3...)
// If targetId and newOrder are passed, targetId is positioned at newOrder and other slides shift seamlessly without collision.
async function resequenceHeroSlides(targetId?: number, newOrder?: number): Promise<void> {
  const allSlides = await HeroSlideModel.find().sort({ sortOrder: 1, createdAt: 1, id: 1 });
  if (!allSlides.length) return;

  let orderedList: typeof allSlides = [];
  if (targetId !== undefined && newOrder !== undefined) {
    const target = allSlides.find((s) => s.id === targetId);
    const others = allSlides.filter((s) => s.id !== targetId);
    if (target) {
      const insertIdx = Math.max(0, Math.min(newOrder - 1, others.length));
      orderedList = [...others];
      orderedList.splice(insertIdx, 0, target);
    } else {
      orderedList = allSlides;
    }
  } else {
    orderedList = allSlides;
  }

  const bulkOps = orderedList.map((slide, idx) => ({
    updateOne: {
      filter: { id: slide.id },
      update: { $set: { sortOrder: idx + 1 } },
    },
  }));

  if (bulkOps.length > 0) {
    await HeroSlideModel.bulkWrite(bulkOps);
  }
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

    let slides = await HeroSlideModel.find(filter)
      .sort({ sortOrder: 1, createdAt: 1, id: 1 })
      .lean();

    // If duplicate sort orders exist, automatically resequence to clean 1, 2, 3...
    const hasDuplicateOrder = slides.some((s, idx) => idx > 0 && s.sortOrder === slides[idx - 1].sortOrder);
    if (hasDuplicateOrder) {
      await resequenceHeroSlides();
      slides = await HeroSlideModel.find(filter)
        .sort({ sortOrder: 1, createdAt: 1, id: 1 })
        .lean();
    }

    res.json(ListHeroSlidesResponse.parse(slides.map(serializeDates)));
  } catch (err) {
    next(err);
  }
});

// POST /hero/slides — Create hero slide (Admin only)
router.post("/hero/slides", async (req, res, next): Promise<void> => {
  const rawBody: any = { ...req.body };
  if (rawBody.duration !== undefined && rawBody.duration !== null && rawBody.duration !== "") {
    const num = Number(rawBody.duration);
    if (!isNaN(num) && num > 0) {
      rawBody.duration = num;
    }
  }

  const preparedBody = {
    title: rawBody.title || rawBody.headingLine1 || "Hero Slide",
    subtitle: rawBody.subtitle || "",
    eyebrow: rawBody.eyebrow || "GOD'S OWN COUNTRY",
    videoUrl: rawBody.videoUrl || "/hero/15015065_1920_1080_60fps.mp4",
    ...rawBody,
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
    const count = await HeroSlideModel.countDocuments();
    const requestedOrder =
      typeof parsed.data.sortOrder === "number" && parsed.data.sortOrder > 0
        ? parsed.data.sortOrder
        : count + 1;

    const created = await HeroSlideModel.create({
      ...parsed.data,
      id,
      published: parsed.data.published !== undefined ? parsed.data.published : true,
      sortOrder: requestedOrder,
    });

    // Seamlessly resequence all slides to prevent collisions
    await resequenceHeroSlides(id, requestedOrder);
    const refreshed = await HeroSlideModel.findOne({ id }).lean();

    res.status(201).json(GetHeroSlideResponse.parse(serializeDates(refreshed || created.toObject())));
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

  const rawBody: any = { ...req.body };
  if (rawBody.duration !== undefined && rawBody.duration !== null && rawBody.duration !== "") {
    const num = Number(rawBody.duration);
    if (!isNaN(num) && num > 0) {
      rawBody.duration = num;
    }
  }

  const parsed = UpdateHeroSlideBody.safeParse(rawBody);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    // If sortOrder is explicitly provided, reposition this slide and shift conflicting slides
    if (typeof parsed.data.sortOrder === "number" && parsed.data.sortOrder > 0) {
      await resequenceHeroSlides(params.data.id, parsed.data.sortOrder);
    }

    const updated = await HeroSlideModel.findOneAndUpdate(
      { id: params.data.id },
      { $set: { ...parsed.data, updatedAt: new Date() } },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      res.status(404).json({ error: "Hero slide not found" });
      return;
    }

    const refreshed = await HeroSlideModel.findOne({ id: params.data.id }).lean();
    res.json(UpdateHeroSlideResponse.parse(serializeDates(refreshed || updated)));
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
    // Clean up gaps after deleting a slide
    await resequenceHeroSlides();
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
