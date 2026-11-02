import { HomeExperienceCardModel, IHomeExperienceCard } from "../models/home-experience.model";

export const DEFAULT_HOME_EXPERIENCE_CARDS: Omit<IHomeExperienceCard, "createdAt" | "updatedAt">[] = [
  {
    id: 1,
    slot: 1,
    tag: "Exclusive Charter",
    duration: "4 Hours",
    title: "Private Chef Twilight Cruise",
    location: "Alleppey Waters",
    desc: "Drift along silent palm-fringed lagoons aboard a handcrafted Kettuvallam with your personal chef preparing fresh Malabar seafood on starlit decks.",
    inclusion: "Includes exclusive wooden vessel charter, 3-course customized menu, and twilight flute accompaniment.",
    videoUrl: "/Experience-section/12881094-hd_1920_1080_30fps.mp4",
    posterUrl: "/images/exp_houseboat.jpg",
    experienceSlug: "alleppey-private-chef-cruise",
    ctaText: "Curate This Experience",
    published: true,
    sortOrder: 1,
  },
  {
    id: 2,
    slot: 2,
    tag: "Estate Seclusion",
    duration: "Overnight Sanctuary",
    title: "Secluded Lakefront Pool Villas",
    location: "Kumarakom Sanctuary",
    desc: "Wake to tranquil Vembanad waters, dawn canoe excursions through lotus-filled tributaries, and private plunge pool seclusion in coconut groves.",
    inclusion: "Heritage architecture, private open-to-sky shower, and dedicated lakeside butler.",
    videoUrl: "/Experience-section/12881094-hd_1920_1080_30fps.mp4",
    posterUrl: "/images/exp_pool_villa.jpg",
    experienceSlug: "kumarakom-lakefront-villa",
    ctaText: "Curate This Experience",
    published: true,
    sortOrder: 2,
  },
  {
    id: 3,
    slot: 3,
    tag: "Private Planter",
    duration: "Dawn // 3 Hours",
    title: "Dawn Tea Cupping with a Planter",
    location: "Munnar Highlands",
    desc: "Walk high-range tea slopes at first light with a 3rd-generation estate planter, followed by private single-origin cuppings in a 150-year-old colonial bungalow.",
    inclusion: "Handpick tender tea leaves, explore vintage rolling factory, and taste rare artisanal white teas.",
    videoUrl: "/hero/15015065_1920_1080_60fps.mp4",
    posterUrl: "/images/exp_tea_bungalow.jpg",
    experienceSlug: "munnar-tea-cupping-planter",
    ctaText: "Curate This Experience",
    published: true,
    sortOrder: 3,
  },
  {
    id: 4,
    slot: 4,
    tag: "Tribal Trackers",
    duration: "Full Day Wilderness",
    title: "Periyar Bamboo River Rafting",
    location: "Periyar Reserve",
    desc: "Glide silently across misty reserve waters at dawn with indigenous tribal trackers, encountering wild elephant herds and rare hornbills along the forest edge.",
    inclusion: "Non-motorized eco-rafting, armed forest naturalist, and breakfast on remote islands.",
    videoUrl: "/hero/9154179-uhd_3840_2160_25fps.mp4",
    posterUrl: "/images/dest_4_rafting.jpg",
    experienceSlug: "periyar-bamboo-river-rafting",
    ctaText: "Curate This Experience",
    published: true,
    sortOrder: 4,
  },
];

export async function seedHomeExperienceCards(): Promise<void> {
  const count = await HomeExperienceCardModel.countDocuments();
  if (count === 0) {
    console.log("[db] Seeding default 4 homepage experience cards...");
    for (const card of DEFAULT_HOME_EXPERIENCE_CARDS) {
      await HomeExperienceCardModel.create(card);
    }
    console.log("[db] Seeded 4 homepage experience cards successfully.");
  }
}
