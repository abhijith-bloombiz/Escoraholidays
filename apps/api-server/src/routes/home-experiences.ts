import { Router, type IRouter } from "express";
import { ExperienceModel } from "@workspace/db";

const router: IRouter = Router();

const DEFAULT_SPOTLIGHTS = [
  {
    slug: "private-houseboat-charter",
    slot: 1,
    title: "Kayaking",
    desc: "Glide through silent lagoons and tranquil backwaters on a private kayak.",
    video: "/Experience-section/12881094-hd_1920_1080_30fps.mp4",
  },
  {
    slug: "tea-planter-bungalow",
    slot: 2,
    title: "Dawn Tea Cupping with a Planter",
    desc: "Single-origin tastings & high-range trails in a 150-year-old colonial bungalow.",
    video: "/hero/15015065_1920_1080_60fps.mp4",
  },
  {
    slug: "periyar-bamboo-rafting",
    slot: 3,
    title: "Periyar Bamboo River Rafting",
    desc: "Silent misty waters with indigenous tribal trackers and wild elephant herds.",
    video: "/hero/9154179-uhd_3840_2160_25fps.mp4",
  },
  {
    slug: "theyyam-sacred-fire",
    slot: 4,
    title: "Kathakali Greenroom & Sacred Arts",
    desc: "Front-row sacred makeup transformation & royal Travancore culinary feasts.",
    video: "/hero/15015065_1920_1080_60fps.mp4",
  },
];

async function ensureDefaultSpotlights() {
  const count = await ExperienceModel.countDocuments({ isHomeSpotlight: true });
  if (count === 0) {
    for (const item of DEFAULT_SPOTLIGHTS) {
      await ExperienceModel.updateOne(
        { slug: item.slug },
        {
          $set: {
            isHomeSpotlight: true,
            spotlightSlot: item.slot,
            spotlightTitle: item.title,
            spotlightDescription: item.desc,
            spotlightVideoUrl: item.video,
          },
        }
      );
    }
  }
}

/**
 * Normalizes spotlight slots so that active spotlight experiences (up to 4)
 * have strictly unique slots 1, 2, 3, 4 without duplicates, gaps, or collisions.
 */
export async function normalizeSpotlightSlots() {
  const spotlights = await ExperienceModel.find({ isHomeSpotlight: true })
    .sort({ spotlightSlot: 1, sortOrder: 1, updatedAt: -1 })
    .lean();

  if (spotlights.length === 0) return;

  const usedSlots = new Set<number>();
  let hasDuplicatesOrInvalid = false;

  for (const exp of spotlights) {
    const slot = exp.spotlightSlot;
    if (!slot || slot < 1 || slot > 4 || usedSlots.has(slot)) {
      hasDuplicatesOrInvalid = true;
      break;
    }
    usedSlots.add(slot);
  }

  // Also fix if there are more than 4 items flagged as spotlight
  if (hasDuplicatesOrInvalid || spotlights.length > 4) {
    const active = spotlights.slice(0, 4);
    const excess = spotlights.slice(4);

    // Turn off excess spotlights beyond the 4 limit
    for (const exp of excess) {
      await ExperienceModel.updateOne(
        { id: exp.id },
        { $set: { isHomeSpotlight: false, spotlightSlot: null } }
      );
    }

    // Assign unique slots 1..4 without collisions
    const assignedSlots = new Set<number>();
    const toReassign: any[] = [];

    for (const exp of active) {
      if (
        exp.spotlightSlot &&
        exp.spotlightSlot >= 1 &&
        exp.spotlightSlot <= 4 &&
        !assignedSlots.has(exp.spotlightSlot)
      ) {
        assignedSlots.add(exp.spotlightSlot);
      } else {
        toReassign.push(exp);
      }
    }

    const availableSlots: number[] = [];
    for (let s = 1; s <= 4; s++) {
      if (!assignedSlots.has(s)) {
        availableSlots.push(s);
      }
    }

    for (let i = 0; i < toReassign.length; i++) {
      const newSlot = availableSlots[i] ?? (i + 1);
      await ExperienceModel.updateOne(
        { id: toReassign[i].id },
        { $set: { spotlightSlot: newSlot } }
      );
    }
  }
}

/**
 * Assigns an experience to a spotlight slot (1..4).
 * If another experience already occupies that slot, it swaps slots or reallocates
 * to ensure no duplicate slot orders ever occur.
 */
export async function assignSpotlightSlot(experienceId: number, targetSlot: number) {
  const slot = Math.max(1, Math.min(4, Math.round(targetSlot)));

  // Current experience
  const currentExp = await ExperienceModel.findOne({ id: experienceId }).lean();
  const oldSlot = currentExp?.spotlightSlot;

  // Find conflicting experience already occupying this slot
  const conflictingExp = await ExperienceModel.findOne({
    id: { $ne: experienceId },
    isHomeSpotlight: true,
    spotlightSlot: slot,
  }).lean();

  if (conflictingExp) {
    // If currentExp already had a valid slot, swap positions!
    if (oldSlot && oldSlot >= 1 && oldSlot <= 4 && oldSlot !== slot) {
      await ExperienceModel.updateOne(
        { id: conflictingExp.id },
        { $set: { spotlightSlot: oldSlot } }
      );
    } else {
      // Find the first available slot among 1, 2, 3, 4
      const otherSpotlights = await ExperienceModel.find({
        id: { $nin: [experienceId, conflictingExp.id] },
        isHomeSpotlight: true,
      }).lean();

      const occupied = new Set(otherSpotlights.map((e) => e.spotlightSlot));
      occupied.add(slot);

      let availableSlot = 1;
      for (let s = 1; s <= 4; s++) {
        if (!occupied.has(s)) {
          availableSlot = s;
          break;
        }
      }

      await ExperienceModel.updateOne(
        { id: conflictingExp.id },
        { $set: { spotlightSlot: availableSlot } }
      );
    }
  }

  // Set the target slot on current experience
  await ExperienceModel.updateOne(
    { id: experienceId },
    { $set: { isHomeSpotlight: true, spotlightSlot: slot } }
  );

  // Normalize all spotlight slots to guarantee uniqueness
  await normalizeSpotlightSlots();
}

// GET /home-experiences — Returns the 4 spotlight experiences sorted by spotlightSlot
router.get("/home-experiences", async (req, res, next): Promise<void> => {
  try {
    await ensureDefaultSpotlights();
    await normalizeSpotlightSlots();

    const experiences = await ExperienceModel.find({ isHomeSpotlight: true })
      .sort({ spotlightSlot: 1, sortOrder: 1 })
      .limit(4)
      .lean();

    const cards = experiences.map((exp: any, idx: number) => ({
      _id: String(exp._id),
      id: exp.id,
      slot: exp.spotlightSlot || idx + 1,
      title: exp.spotlightTitle || exp.title,
      tag: exp.category,
      location: exp.destinations?.[0]?.name || "Kerala",
      duration: exp.duration || "Half Day",
      desc: exp.spotlightDescription || exp.tagline || (exp.story ? exp.story.slice(0, 110) + "..." : ""),
      inclusion: exp.inclusions?.[0] || "",
      videoUrl: exp.spotlightVideoUrl || "/Experience-section/12881094-hd_1920_1080_30fps.mp4",
      posterUrl: exp.heroImage || "/images/exp_houseboat.jpg",
      experienceSlug: exp.slug,
      slug: exp.slug,
      published: exp.published,
      sortOrder: exp.spotlightSlot || idx + 1,
      createdAt: exp.createdAt instanceof Date ? exp.createdAt.toISOString() : String(exp.createdAt),
      updatedAt: exp.updatedAt instanceof Date ? exp.updatedAt.toISOString() : String(exp.updatedAt),
    }));

    res.json(cards);
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

    const exp: any = await ExperienceModel.findOne({ isHomeSpotlight: true, spotlightSlot: slot }).lean();
    if (!exp) {
      res.status(404).json({ error: `Card for slot ${slot} not found` });
      return;
    }

    res.json({
      _id: String(exp._id),
      id: exp.id,
      slot: exp.spotlightSlot || slot,
      title: exp.spotlightTitle || exp.title,
      tag: exp.category,
      location: exp.destinations?.[0]?.name || "Kerala",
      duration: exp.duration || "Half Day",
      desc: exp.spotlightDescription || exp.tagline || (exp.story ? exp.story.slice(0, 110) + "..." : ""),
      inclusion: exp.inclusions?.[0] || "",
      videoUrl: exp.spotlightVideoUrl || "/Experience-section/12881094-hd_1920_1080_30fps.mp4",
      posterUrl: exp.heroImage || "/images/exp_houseboat.jpg",
      experienceSlug: exp.slug,
      slug: exp.slug,
      published: exp.published,
      sortOrder: exp.spotlightSlot || slot,
      createdAt: exp.createdAt instanceof Date ? exp.createdAt.toISOString() : String(exp.createdAt),
      updatedAt: exp.updatedAt instanceof Date ? exp.updatedAt.toISOString() : String(exp.updatedAt),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
