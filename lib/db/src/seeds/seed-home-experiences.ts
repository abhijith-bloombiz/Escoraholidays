import { HomeExperienceCardModel, IHomeExperienceCard } from "../models/home-experience.model";

export const DEFAULT_HOME_EXPERIENCE_CARDS: Omit<IHomeExperienceCard, "createdAt" | "updatedAt">[] = [
  {
    id: 1,
    slot: 1,
    tag: "Backwater Cruise",
    duration: "Overnight / Day Cruise",
    title: "Luxury Houseboat Experience",
    location: "Alleppey Backwaters",
    desc: "An iconic Kerala experience with private cruising, beautiful backwaters and personalised dining.",
    inclusion: "Includes exclusive wooden vessel charter, 3-course customized menu, and twilight flute accompaniment.",
    videoUrl: "/Experience-section/12881094-hd_1920_1080_30fps.mp4",
    posterUrl: "/images/exp_houseboat.jpg",
    experienceSlug: "luxury-houseboat-experience",
    ctaText: "Curate This Experience",
    published: true,
    sortOrder: 1,
  },
  {
    id: 2,
    slot: 2,
    tag: "Mountain Sunrise",
    duration: "Dawn // 4 Hours",
    title: "Kolukkumalai Jeep Safari & Sunrise",
    location: "Kolukkumalai Hills, Munnar",
    desc: "Thrilling off-road adventure combined with breathtaking mountain sunrise views.",
    inclusion: "Includes private 4x4 mountain ascent, high-range terrain driver, and orthodox tea tasting session.",
    videoUrl: "/hero/15015065_1920_1080_60fps.mp4",
    posterUrl: "/images/dest_3_munnar.jpg",
    experienceSlug: "kolukkumalai-jeep-safari-sunrise",
    ctaText: "Curate This Experience",
    published: true,
    sortOrder: 2,
  },
  {
    id: 3,
    slot: 3,
    tag: "Waterways Adventure",
    duration: "2–3 Hours",
    title: "Kayaking",
    location: "Calicut",
    desc: "An immersive water adventure that lets travellers explore Kerala's waterways up close.",
    inclusion: "Includes single/tandem sea kayaks, certified waterways guide, life jackets, and fresh tender coconut.",
    videoUrl: "/hero/9154179-uhd_3840_2160_25fps.mp4",
    posterUrl: "/images/dest_2_alleppey.jpg",
    experienceSlug: "kayaking",
    ctaText: "Curate This Experience",
    published: true,
    sortOrder: 3,
  },
  {
    id: 4,
    slot: 4,
    tag: "Coastal Flight",
    duration: "1–2 Hours",
    title: "Paragliding",
    location: "Varkala Beach",
    desc: "An exciting aerial experience with spectacular views of Varkala's coastline.",
    inclusion: "Includes tandem flight with certified instructor, safety harness & helmet, and full HD GoPro video footage.",
    videoUrl: "/hero/15015065_1920_1080_60fps.mp4",
    posterUrl: "/images/dest_5_varkala.jpg",
    experienceSlug: "paragliding",
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
