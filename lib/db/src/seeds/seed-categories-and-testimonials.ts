import { TravelCategoryModel, TestimonialModel, syncSequence } from "../models";

export const INITIAL_TRAVEL_CATEGORIES = [
  {
    slug: "honeymoon",
    label: "Honeymoon",
    description: "Candlelit houseboats, private shores and moments composed only for two — along the most romantic waterways in India.",
    imageUrl: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80",
    priceFrom: "₹6,99,000",
    priceLabel: "from / couple",
    journeyCount: "12 journeys",
    sortOrder: 0,
    published: true,
  },
  {
    slug: "health-wellness",
    label: "Health & Wellness",
    description: "Ayurveda, yoga, panchakarma and deep rest — under Kerala's ancient canopy, guided by resident physicians.",
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80",
    priceFrom: "₹8,200",
    priceLabel: "from / night",
    journeyCount: "9 programmes",
    sortOrder: 1,
    published: true,
  },
  {
    slug: "nature-wildlife",
    label: "Nature & Wildlife",
    description: "Tiger reserves, elephant corridors and shola forests — Kerala's biodiversity, led by expert field naturalists.",
    imageUrl: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80",
    priceFrom: "₹4,50,000",
    priceLabel: "from / person",
    journeyCount: "7 routes",
    sortOrder: 2,
    published: true,
  },
  {
    slug: "hill-stations",
    label: "Hill Stations",
    description: "Tea gardens, cardamom forests and colonial planter's bungalows — Kerala's highlands at their most unhurried.",
    imageUrl: "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?auto=format&fit=crop&w=1200&q=80",
    priceFrom: "₹5,20,000",
    priceLabel: "from / person",
    journeyCount: "8 itineraries",
    sortOrder: 3,
    published: true,
  },
  {
    slug: "backwaters",
    label: "Backwaters",
    description: "Private kettuvallam on 900 km of lagoons and canals — the slow, silent world of Kerala's interior waterways.",
    imageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
    priceFrom: "₹3,80,000",
    priceLabel: "from / couple",
    journeyCount: "11 journeys",
    sortOrder: 4,
    published: true,
  },
  {
    slug: "beaches",
    label: "Beaches",
    description: "Sun, cliffs, sea and slow mornings. Clifftop yoga at Varkala, white sands at Marari and fortress shores at Bekal.",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    priceFrom: null,
    priceLabel: null,
    journeyCount: "11 coastal journeys",
    sortOrder: 5,
    published: true,
  },
  {
    slug: "functional-medicine",
    label: "Functional Medicine",
    description: "Advanced diagnostics, physician-led protocols and root-cause healing — where Ayurveda meets integrative science.",
    imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80",
    priceFrom: null,
    priceLabel: null,
    journeyCount: "6 programmes",
    sortOrder: 6,
    published: true,
  },
  {
    slug: "historical-heritage",
    label: "Historical & Heritage",
    description: "Fort Kochi's spice routes, Padmanabhapuram's wood-carved halls and five centuries of colonial layering.",
    imageUrl: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80",
    priceFrom: null,
    priceLabel: null,
    journeyCount: "8 heritage routes",
    sortOrder: 7,
    published: true,
  },
];

export const INITIAL_TESTIMONIALS = [
  {
    name: "Emily D. Carter",
    quote: "ESCORA completely changed the way we think about luxury travel. From the very first conversation, everything felt personal, thoughtfully planned, and deeply respectful of authentic Kerala culture.",
    category: "Creative Director",
    dateLabel: "Winter 2025",
    location: "London",
    avatarUrl: "/images/testimonial_emily.jpg",
    photoUrl: "/images/testimonial_emily.jpg",
    photoAlt: "Emily D. Carter on a bespoke Kerala journey",
    rating: 5,
    sortOrder: 0,
    published: true,
  },
  {
    name: "Dr. Julian Weiss",
    quote: "Traveling through Munnar's tea hills and the Alleppey backwaters with Escora felt like visiting old friends. The level of care, the handpicked heritage villas, and the private houseboat were beyond compare.",
    category: "Architect & Explorer",
    dateLabel: "Autumn 2025",
    location: "Zurich",
    avatarUrl: "/images/testimonial_emily.jpg",
    photoUrl: "/images/testimonial_emily.jpg",
    photoAlt: "Dr. Julian Weiss exploring Munnar tea highlands",
    rating: 5,
    sortOrder: 1,
    published: true,
  },
  {
    name: "Sophie & Marcus Laurent",
    quote: "The bespoke Ayurvedic retreat arranged for us in Varkala and Marari was transformative. Every single detail, from the private chauffeur to the culinary masters, was executed with quiet perfection.",
    category: "Travel Writers",
    dateLabel: "Spring 2025",
    location: "Paris",
    avatarUrl: "/images/testimonial_emily.jpg",
    photoUrl: "/images/testimonial_emily.jpg",
    photoAlt: "Sophie & Marcus Laurent in Kerala",
    rating: 5,
    sortOrder: 2,
    published: true,
  },
];

/**
 * Idempotently seeds initial travel categories if none exist in the database.
 */
export async function seedCategories(): Promise<number> {
  const existingCount = await TravelCategoryModel.countDocuments();
  if (existingCount > 0) {
    console.log(`Travel categories already seeded (${existingCount} records found). Skipping.`);
    return 0;
  }

  console.log("Seeding initial Travel Categories...");
  let maxId = 0;
  for (let i = 0; i < INITIAL_TRAVEL_CATEGORIES.length; i++) {
    const id = i + 1;
    await TravelCategoryModel.create({
      ...INITIAL_TRAVEL_CATEGORIES[i],
      id,
    });
    if (id > maxId) maxId = id;
  }
  await syncSequence("travel_categories", maxId);
  console.log(`Seeded ${INITIAL_TRAVEL_CATEGORIES.length} initial travel categories.`);
  return INITIAL_TRAVEL_CATEGORIES.length;
}

/**
 * Idempotently seeds initial testimonials if none exist in the database.
 */
export async function seedTestimonials(): Promise<number> {
  const existingCount = await TestimonialModel.countDocuments();
  if (existingCount > 0) {
    console.log(`Testimonials already seeded (${existingCount} records found). Skipping.`);
    return 0;
  }

  console.log("Seeding initial Testimonials...");
  let maxId = 0;
  for (let i = 0; i < INITIAL_TESTIMONIALS.length; i++) {
    const id = i + 1;
    await TestimonialModel.create({
      ...INITIAL_TESTIMONIALS[i],
      id,
    });
    if (id > maxId) maxId = id;
  }
  await syncSequence("testimonials", maxId);
  console.log(`Seeded ${INITIAL_TESTIMONIALS.length} initial testimonials.`);
  return INITIAL_TESTIMONIALS.length;
}
