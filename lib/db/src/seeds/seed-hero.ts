import { HeroSlideModel, HeroConfigModel, syncSequence } from "../models";

export const INITIAL_HERO_SLIDES = [
  {
    title: "KERALA HIGHLANDS",
    subtitle: "Misty Summits & Ancient Valleys",
    eyebrow: "GOD'S OWN COUNTRY",
    headingLine1: "A WORLD WAITING",
    headingLine2: "TO BE DISCOVERED",
    videoUrl: "/hero/15015065_1920_1080_60fps.mp4",
    posterUrl: "/images/dest_3_munnar.jpg",
    ctaText: "Plan Your Journey",
    ctaLink: "/plan",
    published: true,
    sortOrder: 1,
  },
  {
    title: "HERITAGE WATERWAYS",
    subtitle: "Arabian Sea & Living Legacies",
    eyebrow: "GOD'S OWN COUNTRY",
    headingLine1: "DISCOVER MORE,",
    headingLine2: "TRAVEL FURTHER.",
    videoUrl: "/hero/9154179-uhd_3840_2160_25fps.mp4",
    posterUrl: "/images/exp_houseboat.jpg",
    ctaText: "Explore Waterways",
    ctaLink: "/experiences/private-houseboat-charter",
    published: true,
    sortOrder: 2,
  },
];

export const INITIAL_HERO_CONFIG = {
  id: "default",
  eyebrowBadge: "GOD'S OWN COUNTRY",
  showSearchBar: false,
  slideDuration: 7,
  centerDestinationOverride: null,
  companionOverrides: null,
};

/**
 * Idempotently seeds initial hero slides and global config if none exist in the database.
 */
export async function seedHero(): Promise<number> {
  const existingSlides = await HeroSlideModel.countDocuments();
  if (existingSlides === 0) {
    console.log("Seeding initial Hero Slides...");
    let maxId = 0;
    for (let i = 0; i < INITIAL_HERO_SLIDES.length; i++) {
      const id = i + 1;
      await HeroSlideModel.create({
        ...INITIAL_HERO_SLIDES[i],
        id,
      });
      if (id > maxId) maxId = id;
    }
    await syncSequence("hero_slides", maxId);
    console.log(`Seeded ${INITIAL_HERO_SLIDES.length} initial hero slides.`);
  }

  const existingConfig = await HeroConfigModel.findOne({ id: "default" });
  if (!existingConfig) {
    console.log("Initializing default Hero Config...");
    await HeroConfigModel.create(INITIAL_HERO_CONFIG);
  }

  return INITIAL_HERO_SLIDES.length;
}
