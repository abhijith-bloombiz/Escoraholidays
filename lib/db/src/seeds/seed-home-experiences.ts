import { HomeExperienceCardModel, IHomeExperienceCard } from "../models/home-experience.model";

export const DEFAULT_HOME_EXPERIENCE_CARDS: Omit<IHomeExperienceCard, "createdAt" | "updatedAt">[] = [
  {
    id: 1,
    slot: 1,
    tag: "Lagoon Waters",
    duration: "2–3 Hours",
    title: "Kayaking",
    location: "Alleppey Waters",
    desc: "Glide through silent lagoons and tranquil backwaters on a private kayak.",
    inclusion: "Includes private single/tandem sea kayaks, safety equipment, and local waterways guide.",
    videoUrl: "/Experience-section/12881094-hd_1920_1080_30fps.mp4",
    posterUrl: "/images/exp_houseboat.jpg",
    experienceSlug: "alleppey-kayaking-expedition",
    ctaText: "Curate This Experience",
    published: true,
    sortOrder: 1,
  },
  {
    id: 2,
    slot: 2,
    tag: "Estate Seclusion",
    duration: "Dawn // 3 Hours",
    title: "Dawn Tea Cupping with a Planter",
    location: "Munnar Highlands",
    desc: "Single-origin tastings & high-range trails in a 150-year-old colonial bungalow.",
    inclusion: "Handpick tender tea leaves, explore vintage rolling factory, and taste rare artisanal white teas.",
    videoUrl: "/hero/15015065_1920_1080_60fps.mp4",
    posterUrl: "/images/exp_tea_bungalow.jpg",
    experienceSlug: "munnar-tea-cupping-planter",
    ctaText: "Curate This Experience",
    published: true,
    sortOrder: 2,
  },
  {
    id: 3,
    slot: 3,
    tag: "Wilderness Reserve",
    duration: "Full Day",
    title: "Periyar Bamboo River Rafting",
    location: "Periyar Reserve",
    desc: "Silent misty waters with indigenous tribal trackers and wild elephant herds.",
    inclusion: "Non-motorized eco-rafting, armed forest naturalist, and breakfast on remote islands.",
    videoUrl: "/hero/9154179-uhd_3840_2160_25fps.mp4",
    posterUrl: "/images/dest_4_rafting.jpg",
    experienceSlug: "periyar-bamboo-river-rafting",
    ctaText: "Curate This Experience",
    published: true,
    sortOrder: 3,
  },
  {
    id: 4,
    slot: 4,
    tag: "Living Arts",
    duration: "Masterclass",
    title: "Kathakali Greenroom & Sacred Arts",
    location: "Thrissur Cultural Quarters",
    desc: "Front-row sacred makeup transformation & royal Travancore culinary feasts.",
    inclusion: "Exclusive discussion with the master artiste, sacred natural pigment demonstration, and seated sadhya.",
    videoUrl: "/hero/15015065_1920_1080_60fps.mp4",
    posterUrl: "/images/exp_kathakali.jpg",
    experienceSlug: "kathakali-greenroom-sacred-arts",
    ctaText: "Curate This Experience",
    published: true,
    sortOrder: 4,
  },
];

export async function seedHomeExperienceCards(forceReset = false): Promise<void> {
  const count = await HomeExperienceCardModel.countDocuments();
  if (count === 0 || forceReset) {
    console.log("[db] Seeding exact homepage experience cards...");
    for (const card of DEFAULT_HOME_EXPERIENCE_CARDS) {
      await HomeExperienceCardModel.findOneAndUpdate(
        { slot: card.slot },
        { $set: card },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log("[db] Seeded 4 homepage experience cards successfully.");
  }
}
