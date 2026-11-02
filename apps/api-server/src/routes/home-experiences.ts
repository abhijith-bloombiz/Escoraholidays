import { Router, type IRouter } from "express";
import {
  HomeExperienceCardModel,
  seedHomeExperienceCards,
  DEFAULT_HOME_EXPERIENCE_CARDS,
  insertHomeExperienceCardSchema,
  updateHomeExperienceCardSchema,
} from "@workspace/db";

const router: IRouter = Router();

function serializeCard(doc: any) {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  if (obj.createdAt) {
    obj.createdAt = obj.createdAt instanceof Date ? obj.createdAt.toISOString() : String(obj.createdAt);
  }
  if (obj.updatedAt) {
    obj.updatedAt = obj.updatedAt instanceof Date ? obj.updatedAt.toISOString() : String(obj.updatedAt);
  }
  return obj;
}

// GET /home-experiences — Public read endpoint returning the 4 cards in slot order
router.get("/home-experiences", async (req, res, next): Promise<void> => {
  try {
    let count = await HomeExperienceCardModel.countDocuments();
    if (count === 0) {
      await seedHomeExperienceCards();
    }

    const cards = await HomeExperienceCardModel.find().sort({ slot: 1 });
    res.json(cards.map(serializeCard));
  } catch (err) {
    next(err);
  }
});

// GET /home-experiences/:slot — Read single card by slot (1..4)
router.get("/home-experiences/:slot", async (req, res, next): Promise<void> => {
  try {
    const slot = parseInt(req.params.slot, 10);
    if (isNaN(slot) || slot < 1 || slot > 4) {
      res.status(400).json({ error: "Invalid slot number. Must be between 1 and 4." });
      return;
    }

    let card = await HomeExperienceCardModel.findOne({ slot });
    if (!card) {
      const defaultCard = DEFAULT_HOME_EXPERIENCE_CARDS.find((c) => c.slot === slot);
      if (defaultCard) {
        card = await HomeExperienceCardModel.create(defaultCard);
      } else {
        res.status(404).json({ error: `Home experience card for slot ${slot} not found.` });
        return;
      }
    }

    res.json(serializeCard(card));
  } catch (err) {
    next(err);
  }
});

// PUT /home-experiences/:slot — Update or upsert card by slot (Admin only)
router.put("/home-experiences/:slot", async (req, res, next): Promise<void> => {
  try {
    const slot = parseInt(req.params.slot, 10);
    if (isNaN(slot) || slot < 1 || slot > 4) {
      res.status(400).json({ error: "Invalid slot number. Must be between 1 and 4." });
      return;
    }

    const parseResult = updateHomeExperienceCardSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.flatten() });
      return;
    }

    const data = parseResult.data;
    const updateData: Record<string, any> = {
      ...data,
      slot,
      updatedAt: new Date(),
    };

    let card = await HomeExperienceCardModel.findOneAndUpdate(
      { slot },
      { $set: updateData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json(serializeCard(card));
  } catch (err) {
    next(err);
  }
});

// PATCH /home-experiences/:slot — Partial update (Admin only)
router.patch("/home-experiences/:slot", async (req, res, next): Promise<void> => {
  try {
    const slot = parseInt(req.params.slot, 10);
    if (isNaN(slot) || slot < 1 || slot > 4) {
      res.status(400).json({ error: "Invalid slot number. Must be between 1 and 4." });
      return;
    }

    const parseResult = updateHomeExperienceCardSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.flatten() });
      return;
    }

    const card = await HomeExperienceCardModel.findOneAndUpdate(
      { slot },
      { $set: { ...parseResult.data, updatedAt: new Date() } },
      { new: true }
    );

    if (!card) {
      res.status(404).json({ error: `Card for slot ${slot} not found` });
      return;
    }

    res.json(serializeCard(card));
  } catch (err) {
    next(err);
  }
});

export default router;
