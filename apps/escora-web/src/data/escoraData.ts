// Local high-fidelity authentic travel photography and curated Kerala travel content

export interface SocialLink {
  label: string;
  url: string;
}

export interface EscoraInfo {
  name: string;
  tagline: string;
  eyebrow: string;
  phone: string;
  email: string;
  address: string;
  socials: SocialLink[];
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  terrain: string;
  season: string;
  vibe: string;
  rating: string;
  desc: string;
  image: string;
  angle: number;
}

export interface ExperiencePanel {
  title: string;
  desc: string;
  image: string;
}

export interface ExperienceTab {
  id: string;
  label: string;
  panel1: ExperiencePanel;
  panel2: ExperiencePanel;
}

export interface ItineraryItem {
  day: string;
  title: string;
  desc: string;
}

export interface TravelCategoryItem {
  id: string;
  num: string;
  category: string;
  dest: string;
  route: string;
  pace: string;
  bestSeller: boolean;
  title: string;
  days: string;
  destinationsCount: string;
  highlightsCount: string;
  desc: string;
  btnColor: string;
  image: string;
  itinerary: ItineraryItem[];
}

export interface EscoraRetreatItem {
  id: string;
  title: string;
  tag: string;
  caption: string;
  image: string;
}

export interface TestimonialItem {
  id: string;
  author: string;
  role: string;
  quote: string;
  image: string;
}

export interface PlanningStepItem {
  step: string;
  title: string;
  desc: string;
}

export const ESCORA_INFO: EscoraInfo = {
  name: "ESCORA",
  tagline: "Where Every Journey Feels Like Home",
  eyebrow: "God's Own Country",
  phone: "+91 8157 003 344",
  email: "admin@escoraholidays.com",
  address: "1st Floor, Landmark Maple Business Tower, Kozhikode, Kerala 673014",
  socials: [
    { label: "INSTAGRAM", url: "https://www.instagram.com/escora_holidays" },
    { label: "FACEBOOK", url: "https://www.facebook.com/people/Escora-holidays" },
    { label: "LINKEDIN", url: "https://www.linkedin.com/company/escora-holidays/about/" },
    { label: "YOUTUBE", url: "https://www.youtube.com/@escoraholidays" }
  ]
};

export interface EscoraBankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  upiId: string;
}

export const ESCORA_BANK_DETAILS: EscoraBankDetails = {
  bankName: "HDFC Bank Ltd.",
  accountName: "ESCORA HOLIDAYS LLP",
  accountNumber: "99999496933336",
  ifscCode: "HDFC0010365",
  branch: "Mankavu",
  upiId: "escoraholidays@okhdfcbank"
};

// Section 3: Destination Discovery (5 Iconic Regional Landscapes of Kerala)
export const DESTINATIONS: Destination[] = [
  {
    id: "wayanad",
    name: "WAYANAD RAINFOREST",
    country: "WESTERN GHATS, KERALA",
    terrain: "Evergreen Canopy • 900m",
    season: "Best: Sep – May",
    vibe: "Ancient Mist & Biodiversity",
    rating: "4.8",
    desc: "Ancient mist-clad Chembra peaks, prehistoric Edakkal rock caves, and private eco-luxury treehouse sanctuaries hidden in evergreen canopies.",
    image: "/images/dest_1_wayanad.jpg",
    angle: -14
  },
  {
    id: "alleppey",
    name: "ALLEPPEY & VEMBANAD",
    country: "BACKWATER BASIN, KERALA",
    terrain: "Silent Lagoons • Sea Level",
    season: "Best: Year-round (Peak: Nov–Feb)",
    vibe: "Lakeside Stillness & Palm Canals",
    rating: "4.9",
    desc: "A labyrinth of palm-fringed canals, private chef dining on handcrafted wooden Kettuvallams, and starlit nights drifting over silent waters.",
    image: "/images/tour_1_backwaters.jpg",
    angle: -7
  },
  {
    id: "munnar",
    name: "MUNNAR TEA HIGHLANDS",
    country: "HIGH RANGE, KERALA",
    terrain: "Highland Tea Slopes • 1,600m",
    season: "Best: Oct – Mar",
    vibe: "Misty Summits & Colonial Soul",
    rating: "4.9",
    desc: "Dramatic mist-shrouded peaks, century-old British planter estates, cool mountain winds, and golden sunrise tea trails.",
    image: "/images/dest_3_munnar.jpg",
    angle: 0
  },
  {
    id: "thekkady",
    name: "PERIYAR & THEKKADY",
    country: "SPICE FOOTHILLS, KERALA",
    terrain: "Cardamom Hills & Riverways • 1,000m",
    season: "Best: Oct – Apr",
    vibe: "Wilderness & Spice Sanctuaries",
    rating: "4.8",
    desc: "Silent bamboo river rafting deep inside tiger reserves, wild elephant herds along lake shores, and aromatic private cardamom estates.",
    image: "/images/dest_4_rafting.jpg",
    angle: 7
  },
  {
    id: "varkala",
    name: "VARKALA & MARARI SHORES",
    country: "ARABIAN COASTLINE, KERALA",
    terrain: "Laterite Sea Cliffs • Coastline",
    season: "Best: Nov – Mar",
    vibe: "Dramatic Ocean Vistas & Peace",
    rating: "4.9",
    desc: "Dramatic red laterite sea cliffs overlooking turquoise surf, sacred mineral springs, private coconut grove pool villas, and silent sunset walks.",
    image: "/images/dest_5_varkala.jpg",
    angle: 14
  }
];

// Section 4: Signature Experiences (Pill tabs + paired large photographic panels)
export const EXPERIENCES_TABS: ExperienceTab[] = [
  {
    id: "backwaters",
    label: "Waterways & Lagoons",
    panel1: {
      title: "PRIVATE CHEF TWILIGHT CRUISE",
      desc: "Drift along silent palm-fringed lagoons aboard a private handcrafted Kettuvallam with your personal chef preparing fresh Malabar seafood on starlit decks.",
      image: "/images/exp_houseboat.jpg"
    },
    panel2: {
      title: "SECLUDED LAKEFRONT POOL VILLAS",
      desc: "Wake to tranquil Vembanad waters, dawn canoe excursions through lotus-filled tributaries, and private plunge pool seclusion in coconut groves.",
      image: "/images/exp_pool_villa.jpg"
    }
  },
  {
    id: "highlands",
    label: "Tea Trails & Highlands",
    panel1: {
      title: "DAWN TEA CUPPING WITH A PLANTER",
      desc: "Walk high-range tea slopes at first light with a 3rd-generation estate planter, followed by private single-origin cuppings in a 150-year-old British colonial bungalow.",
      image: "/images/exp_tea_bungalow.jpg"
    },
    panel2: {
      title: "MISTY PINE VALLEY HORIZONS",
      desc: "Whispering pine ridges, secluded highland walking trails above the cloud line, and sunset vistas over rolling Western Ghat meadows.",
      image: "/images/dest_2_vagamon.jpg"
    }
  },
  {
    id: "wildlife",
    label: "Wilderness & Sanctuaries",
    panel1: {
      title: "PERIYAR BAMBOO RIVER RAFTING",
      desc: "Glide silently across misty reserve waters at dawn with indigenous tribal trackers, encountering wild elephant herds and rare hornbills along the forest edge.",
      image: "/images/dest_4_rafting.jpg"
    },
    panel2: {
      title: "RAINFOREST CANOPY TREEHOUSES",
      desc: "Private eco-luxury treehouse sanctuaries nestled 60 feet above ancient rainforest floors, guided night walks for bioluminescent flora, and secret waterfalls.",
      image: "/images/exp_treehouse.jpg"
    }
  },
  {
    id: "culture",
    label: "Heritage & Living Arts",
    panel1: {
      title: "FORT KOCHI HISTORIAN WALK",
      desc: "Stroll 500-year-old Portuguese quarters, Dutch courtyards, and iconic cantilevered Chinese fishing nets at dusk alongside an architectural historian.",
      image: "/images/exp_heritage.jpg"
    },
    panel2: {
      title: "KATHAKALI GREENROOM & SACRED ARTS",
      desc: "Private front-row access to the mesmerizing 3-hour sacred makeup transformation, classical percussion masterclasses, and royal Travancore culinary feasts.",
      image: "/images/exp_kathakali.jpg"
    }
  }
];

// Section 3: Travel by Type (8 Travel Categories tailored for international guests)
export const TRAVEL_BY_TYPE: TravelCategoryItem[] = [
  {
    id: "backwaters",
    num: "01",
    category: "backwaters",
    dest: "Alleppey & Kumarakom",
    route: "Cochin → Alleppey → Vembanad Lake",
    pace: "Private Chauffeur",
    bestSeller: true,
    title: "BACKWATER & HOUSEBOAT HOLIDAYS",
    days: "4–6 Days",
    destinationsCount: "Private Waterways",
    highlightsCount: "Chef & Kettuvallam",
    desc: "Drift along palm-fringed lagoons aboard a private handcrafted Kettuvallam with your personal chef, crew, and starlit deck dining.",
    btnColor: "gold",
    image: "/images/exp_houseboat.jpg",
    itinerary: [
      { day: "Day 1", title: "Cochin to Alleppey Embarkation", desc: "Private chauffeur transfer to your private luxury Kettuvallam. Welcome tender coconut, freshly prepared Malabar lunch on board, and afternoon canal cruise." },
      { day: "Day 2", title: "Vembanad Lake & Village Canoeing", desc: "Morning village walk through coir-making settlements, quiet tributary canoe excursion, and sunset tea overlooking the expanse of Vembanad Lake." },
      { day: "Day 3-4", title: "Kumarakom Lakeside Sanctuary", desc: "Disembark at a tranquil lakeside heritage resort. Bird sanctuary guided walk, private Ayurvedic massage, and lakeside candlelit dinner." }
    ]
  },
  {
    id: "ayurveda",
    num: "02",
    category: "wellness",
    dest: "Thrissur & Kovalam",
    route: "Cochin → Thrissur → Kovalam Retreat",
    pace: "Doctor-Led Care",
    bestSeller: true,
    title: "AYURVEDA & WELLNESS RETREATS",
    days: "7–21 Days",
    destinationsCount: "Doctor Supervised",
    highlightsCount: "Panchakarma & Yoga",
    desc: "Immerse in classical curative healing guided by senior Vaidyas. Daily herbal therapies, Abhyanga, Shirodhara, and customized sattvic cuisine.",
    btnColor: "black",
    image: "/images/exp_ayurveda.jpg",
    itinerary: [
      { day: "Day 1", title: "Consultation & Constitution Diagnosis", desc: "Detailed 1-on-1 pulse diagnosis (Nadi Pariksha) with the Chief Ayurvedic Physician to determine your Prakriti and dosha imbalances." },
      { day: "Day 2-6", title: "Classical Rejuvenation Therapies", desc: "Two daily therapist-led sessions including four-hand Abhyanga oil massage, warm herbal Shirodhara, and steam detox (Swedana)." },
      { day: "Day 7+", title: "Mindfulness & Take-Home Protocol", desc: "Daily sunrise yoga, customized herbal diet, lifestyle counseling, and personal health regimen for your return home." }
    ]
  },
  {
    id: "hill-stations",
    num: "03",
    category: "highlands",
    dest: "Munnar & Vagamon",
    route: "Cochin → Munnar → Vagamon Meadows",
    pace: "Private Chauffeur",
    bestSeller: false,
    title: "HILL STATIONS & TEA HIGHLANDS",
    days: "4–7 Days",
    destinationsCount: "Highland Estates",
    highlightsCount: "Heritage Bungalows",
    desc: "Awaken to mist-covered tea plantations, crisp mountain air, colonial planter bungalows, guided estate walks, and panoramic summits.",
    btnColor: "black",
    image: "/images/exp_tea_bungalow.jpg",
    itinerary: [
      { day: "Day 1-2", title: "Ascent to Munnar Tea Country", desc: "Scenic drive through Cheeyappara waterfalls to your restored British planter estate. Afternoon private tea-tasting session with the resident planter." },
      { day: "Day 3-4", title: "Eravikulam & High Range Treks", desc: "Early morning private guided walk through Eravikulam National Park in search of the Nilgiri Tahr, followed by sunset over Anamudi peak." },
      { day: "Day 5", title: "Vagamon Pine Meadows", desc: "Gentle trek across misty green meadows, pine forests, and cool mountain stream paths." }
    ]
  },
  {
    id: "honeymoon",
    num: "04",
    category: "honeymoon",
    dest: "Marari & Munnar",
    route: "Munnar Clouds → Alleppey → Marari Sands",
    pace: "Intimate Seclusion",
    bestSeller: true,
    title: "KERALA HONEYMOON PACKAGES",
    days: "6–10 Days",
    destinationsCount: "Private Sanctuaries",
    highlightsCount: "Pool Villas & Sunsets",
    desc: "Intimate and secluded escapes crafted for couples. Private plunge-pool villas, sunset backwater cruises, candlelit dinners, and discreet service.",
    btnColor: "gold",
    image: "/images/exp_pool_villa.jpg",
    itinerary: [
      { day: "Day 1-3", title: "Misty Mountain Seclusion", desc: "Private pool villa in the clouds of Munnar. Rose petal bath, couples herbal massage, and fireplace dinners under highland stars." },
      { day: "Day 4-5", title: "Private Kettuvallam Honeymoon Cruise", desc: "Exclusively chartered one-bedroom houseboat with dedicated chef preparing romantic seafood feasts as you glide through silent canals." },
      { day: "Day 6-7", title: "Marari Beach Hideaway", desc: "Oceanfront villa with private plunge pool, secluded beach walks, and sunset champagne dinner on the sands." }
    ]
  },
  {
    id: "wildlife",
    num: "05",
    category: "highlands",
    dest: "Periyar & Wayanad",
    route: "Cochin → Periyar Reserve → Wayanad Canopy",
    pace: "Naturalist Guided",
    bestSeller: false,
    title: "WILDLIFE SAFARIS & NATURE TOURS",
    days: "5–8 Days",
    destinationsCount: "Tiger Reserves",
    highlightsCount: "Bamboo Rafting & Treks",
    desc: "Trek through pristine rainforests and national parks. Encounter wild elephants, exotic bird species, and embark on tranquil bamboo river rafting.",
    btnColor: "black",
    image: "/images/dest_4_rafting.jpg",
    itinerary: [
      { day: "Day 1-2", title: "Periyar Tiger Reserve Expedition", desc: "Private naturalist-led dawn jungle walk and boat safari along Periyar Lake observing wild elephants, gaur, and sambar deer." },
      { day: "Day 3-4", title: "Bamboo River Rafting", desc: "Full-day wilderness rafting through forested reserve canyons with tribal trackers and scenic forest picnic." },
      { day: "Day 5-6", title: "Wayanad Rainforest Treehouse", desc: "Stay in an authentic canopy treehouse, night nature walk for bioluminescent flora, and visit ancient Edakkal caves." }
    ]
  },
  {
    id: "beaches",
    num: "06",
    category: "coastal",
    dest: "Marari & Varkala",
    route: "Cochin → Marari Beach → Varkala Cliffs",
    pace: "Private Chauffeur",
    bestSeller: false,
    title: "SECLUDED BEACHES & COASTAL ESCAPES",
    days: "4–7 Days",
    destinationsCount: "Arabian Sea Shores",
    highlightsCount: "Cliff Walks & Sunsets",
    desc: "Unwind on golden sands framed by coconut groves. Explore iconic red laterite sea cliffs, oceanfront yoga pavilions, and fresh coastal dining.",
    btnColor: "black",
    image: "/images/tour_3_coastal.jpg",
    itinerary: [
      { day: "Day 1-3", title: "Marari Fisherman's Beach Haven", desc: "Tranquil coastal luxury in thatched villas. Morning fishermen boat launch, quiet beach reading, and farm-fresh coastal Kerala cuisine." },
      { day: "Day 4-5", title: "Varkala Cliff & Mineral Springs", desc: "Dramatic laterite cliffs overlooking the Arabian Sea, sunset cliffside dining, and healing mineral water spring visits." },
      { day: "Day 6", title: "Oceanfront Yoga & Farewell", desc: "Dawn Pranayama practice overlooking the waves and comfortable transfer to Trivandrum Airport." }
    ]
  },
  {
    id: "heritage",
    num: "07",
    category: "heritage",
    dest: "Fort Kochi & Muziris",
    route: "Fort Kochi → Mattancherry → Muziris Quay",
    pace: "Historian Escort",
    bestSeller: false,
    title: "HISTORICAL & HERITAGE TOURS",
    days: "4–6 Days",
    destinationsCount: "Colonial Quarters",
    highlightsCount: "Spice Quays & Kathakali",
    desc: "Walk centuries of spice trading history through Portuguese and Dutch architecture, ancient spice bazaars, and mesmerizing Kathakali dance.",
    btnColor: "black",
    image: "/images/exp_heritage.jpg",
    itinerary: [
      { day: "Day 1-2", title: "Fort Kochi Colonial Quarters", desc: "Private walking tour of St. Francis Church, Dutch Palace, and iconic cantilevered Chinese fishing nets with an architectural historian." },
      { day: "Day 3", title: "Jew Town & Mattancherry Spice Bazaars", desc: "Aromatic cardamom and pepper warehouses, antique courtyards, and Paradesi Synagogue." },
      { day: "Day 4-5", title: "Kathakali & Sacred Temple Arts", desc: "Front-row seats to Kathakali greenroom makeup transformation and live classical percussion performance." }
    ]
  },
  {
    id: "functional-medicine",
    num: "08",
    category: "wellness",
    dest: "Wayanad & Coastal Sanctuaries",
    route: "Cochin → Wayanad Botanical Retreat",
    pace: "Clinician Supervised",
    bestSeller: false,
    title: "FUNCTIONAL MEDICINE PROGRAMMES",
    days: "10–14 Days",
    destinationsCount: "Integrative Health",
    highlightsCount: "Gut & Metabolic Reset",
    desc: "Targeted root-cause health programmes integrating scientific diagnostics with authentic botanical therapies for long-term restorative vitality.",
    btnColor: "black",
    image: "/images/exp_yoga.jpg",
    itinerary: [
      { day: "Day 1-2", title: "Functional Health Assessment", desc: "Comprehensive biometric and metabolic assessment, gut microbiome consultation, and custom biological roadmap." },
      { day: "Day 3-9", title: "Integrative Protocol & Botanicals", desc: "Targeted botanical infusions, cellular detox, anti-inflammatory anti-oxidant diet, and personalized somatic breathwork." },
      { day: "Day 10+", title: "Metabolic Stabilization & Care Plan", desc: "Post-programme nutritional blueprint and direct tele-consultation support with functional medicine clinicians." }
    ]
  }
];

// Backward-compatible alias
export const CURATED_JOURNEYS = TRAVEL_BY_TYPE;

// Section 5: Limited Offers collage images
export interface LimitedOffersImages {
  tiltedLeft: string;
  tiltedRight: string;
  centerFront: string;
}

export const LIMITED_OFFERS_IMAGES: LimitedOffersImages = {
  tiltedLeft: "/images/dest_3_munnar.jpg",
  tiltedRight: "/images/dest_5_varkala.jpg",
  centerFront: "/images/exp_houseboat.jpg"
};

// Section 7: ESCORA Retreat (Dedicated wellness destination & programmes)
export const ESCORA_RETREAT_ITEMS: EscoraRetreatItem[] = [
  {
    id: "retreat-ayurveda",
    title: "Classical Ayurveda",
    tag: "Doctor Supervised",
    caption: "Curative Panchakarma therapies, four-hand Abhyanga, and Shirodhara tailored to your constitution.",
    image: "/images/exp_ayurveda.jpg"
  },
  {
    id: "retreat-yoga",
    title: "Sunrise Yoga & Pranayama",
    tag: "Mindful Awakening",
    caption: "Open-air dawn yoga pavilions overlooking tranquil waters, guided breathwork, and deep meditation.",
    image: "/images/exp_yoga.jpg"
  },
  {
    id: "retreat-kalaripayattu",
    title: "Kalaripayattu Martial Arts",
    tag: "Ancient Discipline",
    caption: "Kerala's 3,000-year-old warrior discipline, flexibility sequences, and therapeutic Marma healing.",
    image: "/images/retreat_3_kalaripayattu.jpg"
  },
  {
    id: "retreat-naturopathy",
    title: "Naturopathy & Sattvic Diet",
    tag: "Pure Nourishment",
    caption: "Farm-to-table organic vegetarian cuisine curated from our estate herbal gardens for gut reset.",
    image: "/images/exp_pool_villa.jpg"
  },
  {
    id: "retreat-sanctuary",
    title: "Secluded Forest Villas",
    tag: "Restorative Silence",
    caption: "Private eco-luxury villas nestled in whispering canopies, water lily ponds, and restorative natural stillness.",
    image: "/images/exp_treehouse.jpg"
  }
];

// Backward-compatible alias
export const INSTAGRAM_POSTS = ESCORA_RETREAT_ITEMS;

// Section 7: Testimonials
export const TESTIMONIALS: TestimonialItem[] = [
  {
    id: "t-1",
    author: "EMILY D. CARTER",
    role: "Creative Director, London",
    quote: "“ ESCORA completely changed the way we think about luxury travel. From the very first conversation, everything felt personal, thoughtfully planned, and deeply respectful of authentic Kerala culture. ”",
    image: "/images/testimonial_emily.jpg"
  },
  {
    id: "t-2",
    author: "DR. JULIAN WEISS",
    role: "Architect & Explorer, Zurich",
    quote: "“ Traveling through Munnar's tea hills and the Alleppey backwaters with Escora felt like visiting old friends. The level of care, the handpicked heritage villas, and the private houseboat were beyond compare. ”",
    image: "/images/testimonial_emily.jpg"
  },
  {
    id: "t-3",
    author: "SOPHIE & MARCUS LAURENT",
    role: "Travel Writers, Paris",
    quote: "“ The bespoke Ayurvedic retreat arranged for us in Varkala and Marari was transformative. Every single detail, from the private chauffeur to the culinary masters, was executed with quiet perfection. ”",
    image: "/images/testimonial_emily.jpg"
  }
];

// The 6 journey planning steps from ESCORA content requirements
export const PLANNING_STEPS: PlanningStepItem[] = [
  { step: "01", title: "Tell us your dream", desc: "Share your travel vision, interests, pace, and special wishes with our Kerala experts." },
  { step: "02", title: "Speak with a Kerala curator", desc: "Connect 1-on-1 with a seasoned local curator who knows every hidden hill and tranquil backwater." },
  { step: "03", title: "Receive your bespoke itinerary", desc: "A tailored day-by-day plan with boutique stays, private experiences, and chauffeured transit." },
  { step: "04", title: "Refine together", desc: "Fine-tune dates, inclusions, dietary requirements, and pacing until it feels just right." },
  { step: "05", title: "Travel with concierge support", desc: "Seamless on-ground 24/7 concierge assistance throughout your entire stay in God's Own Country." },
  { step: "06", title: "Post-trip support", desc: "Thoughtful follow-up and continued care as you return with cherished memories." }
];

// Section: Premium Partners
export interface PremiumPartnerPhase {
  phase: string;
  title: string;
  description: string;
}

export interface PremiumPartnerHighlight {
  title: string;
  description: string;
}

export interface PremiumPartner {
  id: string;
  name: string;
  sanctuaryType: string;
  badge: string;
  location: string;
  address: string;
  pincode: string;
  tagline: string;
  description: string;
  facilityType: string;
  frameworkName: string;
  frameworkDescription: string;
  journeyPhases: PremiumPartnerPhase[];
  highlights: PremiumPartnerHighlight[];
  image: string;
  logo: string;
  websiteUrl: string;
  featured: boolean;
}

export const PREMIUM_PARTNERS: PremiumPartner[] = [
  {
    id: "tulah-clinical-wellness",
    name: "Tulah Clinical Wellness",
    sanctuaryType: "Clinical Wellness Sanctuary",
    badge: "Official Premium Partner",
    location: "Kakkanchery, Chelambra, Kerala",
    address: "Kakkanchery, Chelambra, Kerala 673634, India",
    pincode: "673634",
    tagline: "Where Ancient Healing Practices Blend with Innovative Clinical Therapies",
    description:
      "Tulah Clinical Wellness Sanctuary is a clinical wellness sanctuary located in Kakkanchery, Chelambra, Kerala 673634, India, designed to blend ancient healing practices with innovative clinical therapies. It operates as a doctor-led multidisciplinary facility offering personalized journeys structured around Diagnose, Assess, Heal, and Sustain phases, utilizing proprietary frameworks like the Tulah Life Index™ for precise physiological insights.",
    facilityType: "Doctor-Led Multidisciplinary Facility",
    frameworkName: "Tulah Life Index™",
    frameworkDescription:
      "Proprietary framework for precise physiological insights, tracking cellular, metabolic, and biometric markers to tailor personalized healing journeys.",
    journeyPhases: [
      {
        phase: "01",
        title: "Diagnose",
        description: "In-depth physiological, cellular, and biomarker baseline assessment."
      },
      {
        phase: "02",
        title: "Assess",
        description: "Multidisciplinary doctor consultation, holistic evaluation, and bio-mapping."
      },
      {
        phase: "03",
        title: "Heal",
        description: "Targeted clinical treatments, regenerative therapies, Ayurveda, and precision nutrition."
      },
      {
        phase: "04",
        title: "Sustain",
        description: "Long-term metabolic vitality protocols, sustainable habits, and ongoing guidance."
      }
    ],
    highlights: [
      {
        title: "Doctor-Led Care",
        description: "Multidisciplinary team of clinicians, specialists, and Ayurvedic physicians."
      },
      {
        title: "Tulah Life Index™",
        description: "Proprietary diagnostic framework delivering precise physiological insights."
      },
      {
        title: "The Sonorium",
        description: "World's largest sound-healing dome & celestial acoustic resonance chamber."
      },
      {
        title: "30-Acre Eco Sanctuary",
        description: "LEED & WELL-certified design with radiant cooling in the Malabar hills."
      }
    ],
    image: "/images/tulah-sanctuary.png",
    logo: "/images/tulah-logo-light.png",
    websiteUrl: "https://tulah.life",
    featured: true
  }
];


export interface AccreditationItem {
  id: string;
  name: string;
  label: string;
  sublabel?: string;
  logo: string;
  alt: string;
}

export const CERTIFICATES_ACCREDITATIONS: AccreditationItem[] = [
  {
    id: 'kerala-tourism',
    name: 'Kerala Tourism',
    label: 'Kerala Tourism',
    sublabel: "God's Own Country",
    logo: '/images/accreditations/kerala-tourism.jpg',
    alt: "Kerala Tourism - God's Own Country"
  },
  {
    id: 'iata',
    name: 'IATA',
    label: 'IATA Accredited',
    sublabel: 'International Air Transport Association',
    logo: '/images/accreditations/iata.jpg',
    alt: 'IATA - International Air Transport Association'
  },
  {
    id: 'nidhi',
    name: 'NIDHI+',
    label: 'NIDHI+ Ministry of Tourism',
    sublabel: 'National Integrated Database of Hospitality Industry',
    logo: '/images/accreditations/nidhi.png',
    alt: 'NIDHI+ National Integrated Database of Hospitality Industry'
  },
  {
    id: 'attoi',
    name: 'ATTOI',
    label: 'ATTOI Member',
    sublabel: 'Association of Tourism Trade Organisations',
    logo: '/images/accreditations/attoi.jpg',
    alt: 'ATTOI - Association of Tourism Trade Organisations, India'
  }
];
