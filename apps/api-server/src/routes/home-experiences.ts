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
  if (count < 4) {
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

// GET /home-experiences — Returns the 4 spotlight experiences sorted by spotlightSlot
router.get("/home-experiences", async (req, res, next): Promise<void> => {
  try {
    await ensureDefaultSpotlights();

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
