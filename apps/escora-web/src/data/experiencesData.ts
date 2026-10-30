export interface ExperienceItem {
  slug: string;
  title: string;
  category: 'Waterways & Houseboats' | 'Tea & Highlands' | 'Wilderness & Wildlife' | 'Heritage & Sacred Arts' | 'Wellness & Ayurveda';
  tagline: string;
  duration: string;
  intensity: 'Gentle & Relaxed' | 'Moderate Activity' | 'Active Exploration';
  bestTime: string;
  vibe: string;
  heroImage: string;
  gallery: string[];
  story: string;
  highlights: string[];
  inclusions: string[];
  destinations: { name: string; slug: string }[];
  conciergeTip: string;
}

export const KERALA_EXPERIENCES: ExperienceItem[] = [
  {
    slug: 'ayurveda-wellness',
    title: 'The Art of Classical Kerala Healing',
    category: 'Wellness & Ayurveda',
    tagline: '5,000 Years of Vedic Wisdom, Medicinal Herb Gardens & Physician-Led Rejuvenation',
    duration: 'Single Day to 7-14 Day Panchakarma',
    intensity: 'Gentle & Relaxed',
    bestTime: 'June – November (Monsoon is classical Ayurveda prime season) & Winter',
    vibe: 'Restorative, Grounding & Serene',
    heroImage: '/images/exp_ayurveda.jpg',
    gallery: [
      '/images/exp_ayurveda.jpg',
      '/images/exp_yoga.jpg',
      '/images/retreat_1_ayurveda.jpg',
      '/images/retreat_4_naturopathy.jpg'
    ],
    story: 'Kerala is the uncontested birthplace and living sanctuary of classical Ayurveda. Here, ancient Vedic medicine is not a spa amenity — it is a sacred lineage preserved across generations by hereditary Vaidyas (physicians). Set in open-air wooden pavilions beside whispering coconut palms or tranquil mountain rivers, your journey begins with an in-depth Nadi Pariksha (pulse diagnosis) determining your unique doshic constitution. Under the gentle guidance of resident physicians, treatments like warm herbal oil Abhyanga, forehead-flowing Shirodhara with medicated buttermilk, and warm poultice Kizhi dissolve chronic stress and restore vital Ojas.',
    highlights: [
      'Comprehensive personal pulse consultation with an experienced Ayurvedic physician',
      'Daily authentic Abhyanga synchronised four-hand massages with warm, tailored medicated oils',
      'Traditional Shirodhara (warm medicated oil or buttermilk poured in continuous rhythm across the third eye)',
      'Sunrise pranayama and gentle Hatha yoga overlooking tranquil lagoons or misty mountains',
      'Customized Dosha-balancing organic Sattvic dining prepared fresh from local estate gardens'
    ],
    inclusions: [
      'Private initial & exit consultations with Chief Ayurvedic Physician',
      'All prescribed medicated herbal oils, poultices, and decoctions',
      'Dedicated therapist and private treatment pavilion access',
      'Curated organic Ayurvedic cuisine adhering to your body type',
      'Daily guided morning yoga and sunset meditation sessions'
    ],
    destinations: [
      { name: 'Kovalam', slug: 'kovalam' },
      { name: 'Varkala', slug: 'varkala' },
      { name: 'Kumarakom', slug: 'kumarakom' }
    ],
    conciergeTip: 'The Kerala monsoon (Karkidaka, June to August) is traditionally considered the most potent time for Ayurvedic healing, as the cool, humid air opens the pores to absorb medicinal oils deeply.'
  },
  {
    slug: 'private-houseboat-charter',
    title: 'Private Chef Kettuvallam Backwater Voyage',
    category: 'Waterways & Houseboats',
    tagline: 'Handcrafted Jackwood Houseboats, Silent Lagoons & Starlit Waterways',
    duration: 'Full Day Cruise or Overnight Charter (1–3 Nights)',
    intensity: 'Gentle & Relaxed',
    bestTime: 'Year-Round (Peak: October – March)',
    vibe: 'Romantic, Silent & Unhurried',
    heroImage: '/images/exp_houseboat.jpg',
    gallery: [
      '/images/exp_houseboat.jpg',
      '/images/tour_1_backwaters.jpg',
      '/images/dest_kumarakom.jpg',
      '/images/exp_pool_villa.jpg'
    ],
    story: 'Step aboard a private handcrafted Kettuvallam — an iconic heritage vessel built entirely from seasoned jackwood planks tied together with coconut coir rope without a single iron nail. Converted into an exquisite floating sanctuary, your boat features air-conditioned staterooms, a shaded sundeck, and your personal captain, navigator, and private chef. As you drift silently through emerald canals lined with swaying palms and lotus blossoms, watch village life unfold on the riverbanks. As twilight settles, drop anchor in the middle of a tranquil lagoon where your chef presents a candlelit feast of fresh pearl spot fish marinated in spicy shallots and coconut milk.',
    highlights: [
      'Exclusive private charter with no other passengers aboard',
      'Personal onboard chef serving bespoke regional Malabar seafood and vegetarian feasts',
      'Evening anchoring in secluded, peaceful lagoons away from tourist boat congestion',
      'Silent dawn canoe transfers into shallow village canals too narrow for motorized vessels',
      'Sundeck lounges for golden-hour cocktails as egrets and kingfishers fly overhead'
    ],
    inclusions: [
      'Private captain, dedicated chef, and personal cabin steward',
      'All gourmet meals prepared fresh to your dietary preferences',
      'Fresh coconut water, afternoon spiced chai, and heirloom Kerala snacks',
      'Slender country boat/canoe excursion through village tributaries',
      'Private harbor boarding and luggage concierge escort'
    ],
    destinations: [
      { name: 'Alleppey & Vembanad', slug: 'alleppey' },
      { name: 'Kumarakom', slug: 'kumarakom' }
    ],
    conciergeTip: 'Request our private sunrise canoe add-on: at 6:30 AM before motorized boats start, the backwaters are completely mirror-flat and peaceful.'
  },
  {
    slug: 'tea-planter-bungalow',
    title: 'Planter’s Trail & High-Range Tea Cupping',
    category: 'Tea & Highlands',
    tagline: 'Colonial Stone Bungalows, First-Flush Dawn Walks & Single-Origin Cuppings',
    duration: 'Half-Day Trail or 2-Night Estate Immersion',
    intensity: 'Moderate Activity',
    bestTime: 'September – May',
    vibe: 'Aristocratic, Crisp & Inspiring',
    heroImage: '/images/exp_tea_bungalow.jpg',
    gallery: [
      '/images/exp_tea_bungalow.jpg',
      '/images/dest_3_munnar.jpg',
      '/images/tour_3_tea_highlands.jpg',
      '/images/dest_2_vagamon.jpg'
    ],
    story: 'Ascend into the misty high ranges of Munnar where the air turns crisp and smells of eucalyptus and tender tea buds. Here, British planters in the 1880s built solitary granite bungalows with roaring hearths, rose gardens, and wraparound verandahs. In this exclusive experience, accompany a veteran 3rd-generation planter onto the slopes at first light. Watch skilled estate workers pluck ‘two leaves and a bud’ with rhythmic precision, visit a heritage orthodox factory, and conclude with a private tea-tasting flight comparing delicate white teas, golden flowery pekoes, and brisk highland black teas.',
    highlights: [
      'Exclusive access to private heritage estates closed to commercial tourism',
      'Guided estate walk with an experienced planter sharing colonial lore and modern botany',
      'Master tea-cupping masterclass learning to evaluate clarity, aroma, astringency, and liquor',
      'Afternoon British high tea on a manicured lawn overlooking cloud-draped mountain valleys',
      'Evenings beside an authentic wood-burning stone fireplace with vintage books and highland spirits'
    ],
    inclusions: [
      'Private 4x4 estate transportation through rough mountain tracks',
      'Resident planter or certified tea master accompaniment',
      'Tasting of 6 rare single-origin and orthodox high-range teas',
      'Gourmet planters lunch or formal tea spread on the lawn',
      'Complimentary gift pack of estate-grown first-flush orthodox tea'
    ],
    destinations: [
      { name: 'Munnar', slug: 'munnar' },
      { name: 'Wayanad', slug: 'wayanad' }
    ],
    conciergeTip: 'Bring warm layers: temperatures at high-altitude tea estates can drop to 10°C in the evenings between November and February.'
  },
  {
    slug: 'theyyam-sacred-fire',
    title: 'The Ancient Fire & Spirit Trance of Theyyam',
    category: 'Heritage & Sacred Arts',
    tagline: 'Living Deities, Towering Headdresses & Ecstatic Rituals in Sacred Malabar Groves',
    duration: 'Night Excursion (4–6 Hours)',
    intensity: 'Active Exploration',
    bestTime: 'November – May (Theyyam season in North Malabar)',
    vibe: 'Mystical, Spellbinding & Sacred',
    heroImage: '/images/exp_kathakali.jpg',
    gallery: [
      '/images/exp_kathakali.jpg',
      '/images/dest_kannur.jpg',
      '/images/dest_bekal.jpg',
      '/images/exp_heritage.jpg'
    ],
    story: 'Deep in the laterite groves and village shrines of northern Malabar, an art older than written memory comes alive in the dead of night. Theyyam is not theatre; it is an ecstatic ritual in which mortal performers surrender their consciousness to embody deities, spirits, and ancestors. Prepared over five hours of meticulous natural facial painting using powdered rice and turmeric, adorned in towering coconut leaf crowns and glowing embers, the Theyyam leaps through roaring fire to the thunderous pulse of Chenda drums. To stand in the crowd as the deity blesses devotees with whispered counsel is an unforgettable encounter with the primordial soul of India.',
    highlights: [
      'Respectful insider access to non-commercial village temple groves in Kannur and Kasaragod',
      'Witness the intimate, 4-hour makeup and adornment transformation in the sacred greenroom (Aniyara)',
      'Hear the dramatic mythology and folklore translated live by a local cultural anthropologist',
      'Observe the awe-inspiring Agni Kandakarnan Theyyam leaping across glowing coal pyres',
      'Receive a personal blessing and sacred yellow rice from the deity in trance'
    ],
    inclusions: [
      'Accompaniment by an English-speaking cultural custodian from Malabar',
      'Private luxury chauffeur transfer to and from rural shrine locations',
      'Traditional organic village dinner or midnight snacks',
      'Temple protocol orientation and photography permissions guidance',
      'Donation to the traditional performer family guild'
    ],
    destinations: [
      { name: 'Kannur', slug: 'kannur' },
      { name: 'Bekal', slug: 'bekal' }
    ],
    conciergeTip: 'Theyyam schedules are governed by the Malayalam astrological calendar. Our concierge monitors local temple notices weekly to secure the most dramatic, authentic rituals for our guests.'
  },
  {
    slug: 'periyar-bamboo-rafting',
    title: 'Dawn Bamboo Rafting & Wildlife Safari',
    category: 'Wilderness & Wildlife',
    tagline: 'Silent Reservoirs, Indigenous Tribal Trackers & Wild Elephant Corridors',
    duration: 'Full-Day Eco-Excursion (6–8 Hours)',
    intensity: 'Moderate Activity',
    bestTime: 'October – April',
    vibe: 'Adventurous, Pristine & Exhilarating',
    heroImage: '/images/dest_4_rafting.jpg',
    gallery: [
      '/images/dest_4_rafting.jpg',
      '/images/tour_5_wildlife.jpg',
      '/images/offer_1_hike.jpg',
      '/images/dest_1_wayanad.jpg'
    ],
    story: 'Glide in absolute silence across the misty waters of Periyar Lake aboard a traditional handcrafted bamboo raft. As dawn breaks over the reserve, mist lifts from the submerged tree trunks, revealing wild Asian elephant herds grazing on the water’s edge and sambar deer alert to nearby predators. Guided by indigenous Mannan and Paliyan tribal trackers who know every print in the mud, this journey combines silent lake paddling with guided walking safaris through deciduous and evergreen canopies where wild boars, Malabar giant squirrels, and rare hornbills dwell.',
    highlights: [
      'Silent, non-motorized bamboo rafting offering up-close, undisturbed wildlife observation',
      'Guidance by native tribal trackers with instinctive ability to spot hidden fauna',
      'High chances of sighting wild Asian elephants, gaur (Indian bison), and otter packs',
      'Trek through moist deciduous forests with interpretations of ancient medicinal flora',
      'Panoramic packed jungle breakfast on a secluded lake island'
    ],
    inclusions: [
      'Official forest department permits and dedicated sanctuary access',
      'Two indigenous tribal trackers and armed eco-tourism guides',
      'Handcrafted bamboo raft charter with safety life-jackets and equipment',
      'Nutritious jungle trail breakfast and picnic lunch',
      'Private round-trip transfers from your Thekkady resort'
    ],
    destinations: [
      { name: 'Thekkady & Periyar', slug: 'thekkady' },
      { name: 'Wayanad', slug: 'wayanad' }
    ],
    conciergeTip: 'Wear neutral earth tones (khaki, olive, brown) and sturdy walking shoes. Bright clothing can alert wildlife and decrease sighting opportunities.'
  },
  {
    slug: 'fort-kochi-heritage-walk',
    title: 'Spice Routes, Dutch Quarters & Living History',
    category: 'Heritage & Sacred Arts',
    tagline: '500 Years of Maritime History, Chinese Nets, Jew Town & Contemporary Art',
    duration: 'Half-Day Walking & Rickshaw Experience (4 Hours)',
    intensity: 'Gentle & Relaxed',
    bestTime: 'October – March',
    vibe: 'Cultured, Atmospheric & Storied',
    heroImage: '/images/exp_heritage.jpg',
    gallery: [
      '/images/exp_heritage.jpg',
      '/images/dest_fort_kochi.jpg',
      '/images/exp_kathakali.jpg',
      '/images/tour_1_classic.jpg'
    ],
    highlights: [
      'Private walking exploration of Vasco da Gama’s original burial site at St. Francis Church (1503)',
      'Hands-on demonstration helping local fishermen hoist the massive Chinese cantilevered nets at sunset',
      'Private tour of Jew Town and the 1568 Paradesi Synagogue with its hand-painted blue Cantonese tiles',
      'Tasting of fragrant black pepper, cardamom, and clove in a functioning 100-year-old spice trading house',
      'Curated visit to Kochi-Muziris Biennale contemporary art spaces and vintage antique courtyards'
    ],
    inclusions: [
      'Accompaniment by an expert architectural and historical guide',
      'All heritage entry tickets and special permits',
      'Traditional electric tuk-tuk / private carriage transit for longer stretches',
      'Artisan South Indian filter coffee and Malabar spice refreshments',
      'Sunset harbour boat cruise viewing the waterfront forts from the water'
    ],
    story: 'Wandering through the shaded cobblestone lanes of Fort Kochi is like walking through a living tapestry of maritime empire. Arab dhows, Chinese merchant fleets, Portuguese armadas, Dutch governors, and British traders all left an indelible imprint on this tropical island. Alongside an architectural historian, discover 500-year-old stone churches, centuries-old spice warehouses where mountains of ginger dry on burlap, and vibrant contemporary art installations that have established Kochi as South Asia’s creative capital.',
    destinations: [
      { name: 'Fort Kochi', slug: 'fort-kochi' }
    ],
    conciergeTip: 'Time this walk for late afternoon (around 3:30 PM) to end precisely at sunset when the silhouette of the Chinese fishing nets against the golden Arabian sea is at its most photogenic.'
  },
  {
    slug: 'rainforest-treehouse',
    title: 'Canopy Treehouse Seclusion in Wayanad',
    category: 'Wilderness & Wildlife',
    tagline: 'Eco-Luxury Solitude 60 Feet Above Pristine Rainforest Floors',
    duration: 'Overnight to 3-Night Forest Immersion',
    intensity: 'Moderate Activity',
    bestTime: 'September – May',
    vibe: 'Secluded, Ethereal & Rejuvenating',
    heroImage: '/images/exp_treehouse.jpg',
    gallery: [
      '/images/exp_treehouse.jpg',
      '/images/dest_1_wayanad.jpg',
      '/images/tour_2_rainforest.jpg',
      '/images/offer_2_summit.jpg'
    ],
    story: 'Hidden deep within the untouched rainforests of Wayanad, luxury reaches new heights. Suspended 60 to 90 feet above the forest floor on ancient hardwood trees, your private treehouse is engineered from indigenous bamboo, thatch, and timber without disturbing a single root. Up in the canopy, cool mountain breezes whistle through open wooden louvres, hornbills perch just feet away, and morning coffee is enjoyed above swirling carpets of valley mist. At night, fall asleep to the symphony of chirping cicadas, mountain streams, and the gentle rustle of the jungle canopy.',
    highlights: [
      'Architecturally stunning treehouse suites equipped with modern ensuite luxury amenities',
      'Ascent via a unique counterweighted water-hydraulic elevator or wooden sky bridge',
      'Private balcony viewing platforms overlooking unbroken rainforest valleys',
      'Night nature walks with a resident naturalist searching for bioluminescent fungi and tree frogs',
      'Forest-to-table organic dining featuring heirloom Malabar jungle spices and wild honey'
    ],
    inclusions: [
      'Private treehouse accommodation with panoramic canopy views',
      'All gourmet meals, afternoon teas, and trail refreshments',
      'Guided daily morning canopy bird-watching tours',
      'Guided rainforest trek to secret natural stream waterfalls',
      '4x4 rough-terrain jungle transfer to the hideaway'
    ],
    destinations: [
      { name: 'Wayanad', slug: 'wayanad' }
    ],
    conciergeTip: 'Because treehouses are built high in the canopy, pack a small duffel bag for the night while your larger suitcases rest safely in the estate lounge below.'
  },
  {
    slug: 'marari-slow-coast',
    title: 'Private Pool Villa & Coconut Grove Coast',
    category: 'Wellness & Ayurveda',
    tagline: 'Secluded White Sands, Private Plunge Pools & Coastal Stillness',
    duration: '2 to 5 Nights Slow Retreat',
    intensity: 'Gentle & Relaxed',
    bestTime: 'October – April',
    vibe: 'Tranquil, Barefoot & Luxurious',
    heroImage: '/images/exp_pool_villa.jpg',
    gallery: [
      '/images/exp_pool_villa.jpg',
      '/images/dest_5_varkala.jpg',
      '/images/tour_6_coastal.jpg',
      '/images/retreat_1_ayurveda.jpg'
    ],
    story: 'Far away from crowded tourist beaches, Marari is Kerala’s best-kept coastal secret: a sanctuary of quiet white sand, swaying coconut groves, and traditional fishing hamlets where time slows to a soothing crawl. Staying in private thatched pool villas hidden behind tropical foliage, days are measured not by hours, but by the rise and fall of the tide. Wake to the call of sea eagles, take long solitary walks along miles of clean sand, indulge in beachfront Ayurvedic therapies, and dine on fresh grilled seafood caught by local fishermen that morning.',
    highlights: [
      'Secluded private pool villas nestled inside expansive organic coconut plantations',
      'Miles of uncrowded, pristine golden-white sand beach free from commercial bustle',
      'Al fresco Ayurvedic massages listening to the rhythmic swell of the Arabian Sea',
      'Visits to nearby organic butterfly gardens and lotus conservation ponds',
      'Sunset private candlelit beach dinners with your feet in the warm sand'
    ],
    inclusions: [
      'Luxury private pool villa accommodation with personalized butler service',
      'Daily gourmet farm-and-sea-to-table breakfast and dinner',
      'Complimentary bicycles for exploring quiet coastal village roads',
      'Daily beach yoga session under coconut palms',
      'Private airport or railway transfer in luxury vehicle'
    ],
    destinations: [
      { name: 'Varkala', slug: 'varkala' },
      { name: 'Kovalam', slug: 'kovalam' },
      { name: 'Alleppey & Vembanad', slug: 'alleppey' }
    ],
    conciergeTip: 'Marari is the ideal ending segment for any Kerala journey: after trekking in Munnar and cruising Alleppey, spend 3 nights here completely unwinding before your flight home.'
  }
];

export function getExperienceBySlug(slug: string): ExperienceItem | undefined {
  const normalized = slug.trim().toLowerCase();
  return KERALA_EXPERIENCES.find((e) => e.slug.toLowerCase() === normalized);
}
