import { Router, type IRouter } from "express";
import { TestimonialModel, getNextSequence } from "@workspace/db";
import {
  ListTestimonialsQueryParams,
  ListTestimonialsResponse,
  CreateTestimonialBody,
  GetTestimonialParams,
  GetTestimonialResponse,
  UpdateTestimonialParams,
  UpdateTestimonialBody,
  UpdateTestimonialResponse,
  DeleteTestimonialParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeDates<T extends { createdAt: Date; updatedAt: Date }>(row: T) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

// GET /testimonials — Public read endpoint returns published only unless admin
router.get("/testimonials", async (req, res, next): Promise<void> => {
  const query = ListTestimonialsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const isAdmin = Boolean((req.session as any)?.authenticated);
  const filter: Record<string, any> = {};

  if (!isAdmin) {
    // Public visitors only see published testimonials
    filter.published = true;
  } else if (query.data.published !== undefined) {
    filter.published = query.data.published;
  }

  try {
    const testimonials = await TestimonialModel.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();
    res.json(ListTestimonialsResponse.parse(testimonials.map(serializeDates)));
  } catch (err) {
    next(err);
  }
});

// POST /testimonials — Admin only
router.post("/testimonials", async (req, res, next): Promise<void> => {
  const parsed = CreateTestimonialBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!parsed.data.name?.trim()) {
    res.status(400).json({ error: "Customer name cannot be empty" });
    return;
  }
  if (!parsed.data.quote?.trim()) {
    res.status(400).json({ error: "Testimonial quote cannot be empty" });
    return;
  }

  try {
    const id = await getNextSequence("testimonials");
    const testimonial = await TestimonialModel.create({
      ...parsed.data,
      id,
      name: parsed.data.name.trim(),
      quote: parsed.data.quote.trim(),
    });
    res.status(201).json(GetTestimonialResponse.parse(serializeDates(testimonial.toObject())));
  } catch (err: any) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

// GET /testimonials/:id
router.get("/testimonials/:id", async (req, res): Promise<void> => {
  const params = GetTestimonialParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const testimonial = await TestimonialModel.findOne({ id: params.data.id }).lean();
    if (!testimonial) {
      res.status(404).json({ error: "Testimonial not found" });
      return;
    }

    const isAdmin = Boolean((req.session as any)?.authenticated);
    if (!isAdmin && !testimonial.published) {
      res.status(404).json({ error: "Testimonial not found" });
      return;
    }

    res.json(GetTestimonialResponse.parse(serializeDates(testimonial)));
  } catch {
    res.status(404).json({ error: "Testimonial not found" });
  }
});

// PATCH /testimonials/:id — Admin only
router.patch("/testimonials/:id", async (req, res, next): Promise<void> => {
  const params = UpdateTestimonialParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTestimonialBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.name !== undefined && !parsed.data.name.trim()) {
    res.status(400).json({ error: "Customer name cannot be empty" });
    return;
  }
  if (parsed.data.quote !== undefined && !parsed.data.quote.trim()) {
    res.status(400).json({ error: "Testimonial quote cannot be empty" });
    return;
  }

  try {
    const updatePayload: Record<string, any> = { ...parsed.data, updatedAt: new Date() };
    if (parsed.data.name !== undefined) updatePayload.name = parsed.data.name.trim();
    if (parsed.data.quote !== undefined) updatePayload.quote = parsed.data.quote.trim();

    const testimonial = await TestimonialModel.findOneAndUpdate(
      { id: params.data.id },
      { $set: updatePayload },
      { new: true, runValidators: true }
    ).lean();

    if (!testimonial) {
      res.status(404).json({ error: "Testimonial not found" });
      return;
    }
    res.json(UpdateTestimonialResponse.parse(serializeDates(testimonial)));
  } catch (err: any) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

// DELETE /testimonials/:id — Admin only
router.delete("/testimonials/:id", async (req, res, next): Promise<void> => {
  const params = DeleteTestimonialParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const testimonial = await TestimonialModel.findOneAndDelete({ id: params.data.id }).lean();
    if (!testimonial) {
      res.status(404).json({ error: "Testimonial not found" });
      return;
    }
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

export default router;
