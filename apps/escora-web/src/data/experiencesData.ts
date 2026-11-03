export interface ExperienceItem {
  slug: string;
  title: string;
  category: 'Waterways & Houseboats' | 'Tea & Highlands' | 'Wilderness & Wildlife' | 'Heritage & Sacred Arts' | 'Wellness & Ayurveda' | 'Coastal & Adventure';
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
    slug: 'luxury-houseboat-experience',
    title: 'Luxury Houseboat Experience',
    category: 'Waterways & Houseboats',
    tagline: 'Private Cruising, Beautiful Backwaters & Personalized Onboard Dining',
    duration: 'Full Day Cruise or 1–2 Night Charter',
    intensity: 'Gentle & Relaxed',
    bestTime: 'October – March (Peak) & Monsoon Season',
    vibe: 'Romantic, Silent & Unhurried',
    heroImage: '/images/exp_houseboat.jpg',
    gallery: [
      '/images/exp_houseboat.jpg',
      '/images/tour_1_backwaters.jpg',
      '/images/dest_kumarakom.jpg',
      '/images/offer_3_boat.jpg'
    ],
    story: 'Drift along the emerald waterways of Kerala aboard an iconic handcrafted Kettuvallam. Built from seasoned jackwood tied with natural coir rope without iron nails, your vessel offers complete seclusion, air-conditioned staterooms, and an open-air observation deck. With a private captain and personal chef preparing fresh pearl spot fish, Malabar curries, and coconut delicacies tailored to your tastes, cruise past palm-fringed village banks and anchor under star-strewn skies in silent lagoons.',
    highlights: [
      'Private luxury Kettuvallam charter with dedicated captain, crew, and personal chef',
      'Customized authentic Malabar culinary feasts served on panoramic dining decks',
      'Gentle twilight cruising through mirror-flat lagoons away from tourist boat congestion',
      'Sunrise canoe excursions into narrow village canals lined with lotus blossoms',
      'Air-conditioned master staterooms with artisanal woodcraft and modern en-suite baths'
    ],
    inclusions: [
      'Exclusive private houseboat charter and crew services',
      'All meals (breakfast, lunch, sunset high tea, multi-course dinner)',
      'Fresh tender coconut water, spiced afternoon chai, and traditional Kerala snacks',
      'Dawn country-boat canoe transfer into shallow village tributaries',
      'Harbor boarding concierge and luggage assistance'
    ],
    destinations: [
      { name: 'Alleppey Backwaters', slug: 'alleppey' }
    ],
    conciergeTip: 'Request a dawn canoe excursion at 6:30 AM before motorized boats start — the backwaters are completely silent and morning light filters through the palms.'
  },
  {
    slug: 'kolukkumalai-jeep-safari-sunrise',
    title: 'Kolukkumalai Jeep Safari & Sunrise',
    category: 'Tea & Highlands',
    tagline: 'Thrilling Off-Road Mountain Adventure & Breathtaking Cloud-Sea Sunrise',
    duration: 'Dawn // 4–5 Hours',
    intensity: 'Moderate Activity',
    bestTime: 'September – May',
    vibe: 'Exhilarating, Panoramic & Sublime',
    heroImage: '/images/dest_3_munnar.jpg',
    gallery: [
      '/images/dest_3_munnar.jpg',
      '/images/tour_3_tea_highlands.jpg',
      '/images/offer_2_summit.jpg',
      '/images/hero_mountain.jpg'
    ],
    story: 'Embark on a heart-pounding pre-dawn 4x4 mountain safari ascending to 7,900 feet at Kolukkumalai, home to the world’s highest organic tea plantations. As your rugged jeep navigates steep boulder-strewn trails through morning mist, arrive at the summit ridge just as the first golden rays pierce the horizon. Watch an endless, rolling blanket of clouds wash across the Western Ghats between Kerala and Tamil Nadu. Continue with a walk through heritage tea slopes and visit a functioning 1930s orthodox tea factory to sample artisanal highland brews.',
    highlights: [
      'Thrilling private 4x4 mountain ascent through rugged highland tea trails',
      'Spectacular panoramic sunrise over a sweeping 360-degree sea of clouds',
      'Exploring century-old organic tea bushes thriving at 7,900 ft above sea level',
      'Guided walkthrough of a heritage 1935 wooden orthodox tea rolling factory',
      'Fresh estate tea tasting session with breathtaking valley views'
    ],
    inclusions: [
      'Private 4x4 mountain terrain jeep with professional high-range driver',
      'Kolukkumalai estate entry permits and tea factory access fees',
      'Guided orthodox tea tasting and factory demonstration',
      'Warm highland beverages and breakfast box',
      'Hotel pickup and drop-off in Munnar'
    ],
    destinations: [
      { name: 'Kolukkumalai Hills, Munnar', slug: 'munnar' }
    ],
    conciergeTip: 'Wear warm layered woollens and sturdy walking shoes — temperatures at the 5:00 AM summit regularly dip below 10°C before the sun climbs over the peaks.'
  },
  {
    slug: 'kayaking',
    title: 'Kayaking',
    category: 'Waterways & Houseboats',
    tagline: 'An Immersive Water Adventure Exploring Kerala’s Waterways Up Close',
    duration: '2–3 Hours',
    intensity: 'Moderate Activity',
    bestTime: 'October – March (Early Morning or Golden Hour)',
    vibe: 'Tranquil, Immersive & Eco-Conscious',
    heroImage: '/images/dest_4_rafting.jpg',
    gallery: [
      '/images/dest_4_rafting.jpg',
      '/images/tour_1_backwaters.jpg',
      '/images/dest_kumarakom.jpg',
      '/images/exp_houseboat.jpg'
    ],
    story: 'Step into a sleek kayak and glide silently across the tranquil waterways of Kerala. Unlike larger motorized boats, kayaking allows you to slip effortlessly into narrow village canals shaded by dense overhead coconut fronds, passing traditional thatched homes, ducks paddling in morning light, and riverside spice gardens. Guided by native watermen who know every turn of the lagoons, this adventure offers an intimate, slow-paced connection with God’s Own Country.',
    highlights: [
      'Navigating intimate, narrow village tributaries inaccessible to motorized houseboats',
      'Observing native birdlife including blue kingfishers, cormorants, and pond herons',
      'Stopping at a quiet waterside village home for fresh coconut water and warm spiced tea',
      'Stable, high-performance single and tandem touring kayaks suitable for all skill levels',
      'Golden-hour sunlight reflecting across mirror-calm backwater canals'
    ],
    inclusions: [
      'Premium touring kayaks, lightweight paddles, and certified life jackets',
      'Accompanied by a licensed waterways guide and safety escort',
      'Waterproof dry bags for cameras and phones',
      'Fresh tender coconut and mineral water refreshments',
      'Waterfront launch and return transfers'
    ],
    destinations: [
      { name: 'Alleppey & Vembanad', slug: 'alleppey' },
      { name: 'Kumarakom', slug: 'kumarakom' }
    ],
    conciergeTip: 'Choose the 6:30 AM dawn departure: the canals are mirror-flat, temperatures are delightfully cool, and morning village life begins at the water’s edge.'
  },
  {
    slug: 'paragliding',
    title: 'Paragliding',
    category: 'Coastal & Adventure',
    tagline: 'An Exciting Aerial Experience with Spectacular Views of Varkala’s Coastline',
    duration: '1–2 Hours (15–20 Min Flight)',
    intensity: 'Active Exploration',
    bestTime: 'October – April',
    vibe: 'Exhilarating, Majestic & Scenic',
    heroImage: '/images/dest_5_varkala.jpg',
    gallery: [
      '/images/dest_5_varkala.jpg',
      '/images/tour_6_coastal.jpg',
      '/images/tour_3_coastal.jpg',
      '/images/dest_kovalam.jpg'
    ],
    story: 'Soar like a sea eagle high above the iconic cliffs of Varkala. Strapped securely in tandem with an internationally certified master pilot, launch smoothly from the clifftop on onshore ocean breezes. Float effortlessly hundreds of feet above the Arabian Sea, taking in sweeping 360-degree aerial views of the dramatic red laterite cliffs, crashing surf, crescent golden sands, and coconut groves stretching to the horizon before a gentle touchdown on the beach.',
    highlights: [
      'Tandem flight piloted by experienced, internationally certified paragliding instructors',
      'Unrivalled aerial perspectives of Varkala’s North Cliff, Papanasam Beach, and the Arabian Sea',
      'Smooth coastal thermal gliding requiring zero prior flight experience',
      'High-definition action camera footage capturing your entire flight from takeoff to landing',
      'Comprehensive pre-flight briefing with certified safety standards'
    ],
    inclusions: [
      'Tandem paragliding equipment, certified harness, and safety helmet',
      'Licensed master pilot fee and flight insurance',
      'Full HD video and photography package delivered to your phone',
      'Clifftop launch site access and beach landing retrieval',
      'Chauffeured transfers to takeoff point'
    ],
    destinations: [
      { name: 'Varkala Beach', slug: 'varkala' }
    ],
    conciergeTip: 'Late afternoon flights (3:30 PM to 5:00 PM) offer the most reliable coastal sea thermals and paint the red cliffs in warm golden sunset light.'
  },
  {
    slug: 'periyar-lake-boating',
    title: 'Periyar Lake Boating',
    category: 'Wilderness & Wildlife',
    tagline: 'Scenic Reserve Waterways, Lush Forests & Wild Elephant Shorelines',
    duration: 'Half Day // 2–3 Hours',
    intensity: 'Gentle & Relaxed',
    bestTime: 'October – April',
    vibe: 'Serene, Wild & Atmospheric',
    heroImage: '/images/tour_5_wildlife.jpg',
    gallery: [
      '/images/tour_5_wildlife.jpg',
      '/images/dest_4_rafting.jpg',
      '/images/why_1_private_pace.jpg',
      '/images/offer_3_boat.jpg'
    ],
    story: 'Enjoy a scenic boat ride through the beautiful Periyar Lake, surrounded by lush forests and rich wildlife. Established around a historic lake formed in 1895, the Periyar Tiger Reserve spans 777 square kilometers of evergreen tropical rainforest. As your boat glides past petrified tree trunks rising from the water, observe wild elephant herds bathing along the grassy banks, sambar deer, wild boar, and otters playing near the shoreline.',
    highlights: [
      'Scenic wildlife boat cruise through the protected sanctuary of Periyar Tiger Reserve',
      'Frequent sightings of wild elephants, herds of gaur (bison), and sambar deer along the shore',
      'Iconic submerged tree trunks creating a surreal, atmospheric water landscape',
      'Accompanied by an armed forest department naturalist and wildlife guide',
      'Superb vantage points for birdwatching, including Malabar hornbills and kingfishers'
    ],
    inclusions: [
      'Reserved Periyar Tiger Reserve sanctuary boat tickets',
      'Forest department entry permits and eco-development conservation fees',
      'Certified eco-naturalist guide assistance',
      'Safety life vests and onboard assistance',
      'Private hotel transfer to boat jetty'
    ],
    destinations: [
      { name: 'Periyar Lake, Periyar Tiger Reserve', slug: 'thekkady' }
    ],
    conciergeTip: 'Book the earliest morning boat departure (7:30 AM): mist still blankets the water, animal activity along the lake edge is at its highest, and temperatures are pleasantly cool.'
  },
  {
    slug: 'kathakali-performance',
    title: 'Kathakali Performance',
    category: 'Heritage & Sacred Arts',
    tagline: 'Traditional Dance-Drama, Expressive Movements & Captivating Storytelling',
    duration: 'Evening // 2.5 Hours',
    intensity: 'Gentle & Relaxed',
    bestTime: 'Year-Round',
    vibe: 'Captivating, Mythological & Cultured',
    heroImage: '/images/exp_kathakali.jpg',
    gallery: [
      '/images/exp_kathakali.jpg',
      '/images/retreat_3_kalaripayattu.jpg',
      '/images/exp_heritage.jpg',
      '/images/dest_fort_kochi.jpg'
    ],
    story: 'Experience Kerala’s traditional dance-drama through expressive movements, elaborate costumes, and captivating storytelling. Kathakali combines classical dance, mime, martial arts postures, and live percussion to narrate epics from Hindu mythology. Arriving early, watch the sacred greenroom ritual where artistes apply intricate facial makeup from crushed minerals, rice paste, and stone soot before illuminating the stage around a ceremonial brass oil lamp.',
    highlights: [
      'Exclusive access to the greenroom to witness the meticulous facial makeup transformation',
      'Demonstration and explanation of the 9 classical facial emotions (Navarasas) and hand mudras',
      'Thunderous live percussion by master Chenda and Maddalam traditional drummers',
      'Towering carved headdresses (Kiritam) and majestic multi-layered silk costumes',
      'Post-performance interaction and photo opportunity with the master artistes'
    ],
    inclusions: [
      'VIP reserved seating at a premier heritage cultural theatre',
      'Greenroom access and natural pigment preparation explanation',
      'English synopsis and narrative guide to the performance',
      'Q&A session with senior troupe member',
      'Chauffeured hotel transfers in Fort Kochi'
    ],
    destinations: [
      { name: 'Kochi', slug: 'fort-kochi' }
    ],
    conciergeTip: 'Arrive 45 minutes before curtain call to witness the silent greenroom makeup — watching actors transform into deities through ancient techniques is an unforgettable art in itself.'
  },
  {
    slug: 'wayanad-glass-bridge',
    title: 'Wayanad Glass Bridge',
    category: 'Wilderness & Wildlife',
    tagline: 'Breathtaking Panoramic Mountain Views from a Suspended Transparent Skywalk',
    duration: 'Half Day // 2–3 Hours',
    intensity: 'Moderate Activity',
    bestTime: 'September – May',
    vibe: 'Thrilling, Breathtaking & Photogenic',
    heroImage: '/images/dest_1_wayanad.jpg',
    gallery: [
      '/images/dest_1_wayanad.jpg',
      '/images/exp_treehouse.jpg',
      '/images/tour_2_rainforest.jpg',
      '/images/offer_1_hike.jpg'
    ],
    story: 'Experience breathtaking panoramic views of Wayanad’s mountains and lush green landscapes from a transparent glass bridge. Cantilevered high above mist-covered valleys at 900 meters elevation, the glass skywalk allows travellers to look directly down into deep evergreen rainforest canopies. Surrounded by rolling coffee estates and the majestic Chembra range, this modern architectural marvel offers South India’s most exhilarating mountain viewpoint.',
    highlights: [
      'Walking across transparent high-strength tempered glass cantilevered over mountain chasms',
      'Unobstructed 360-degree vistas across Wayanad’s rainforests and rolling mist valleys',
      'Exceptional photography vantage point with a sensation of floating among the clouds',
      'Scenic 4x4 mountain drive through highland coffee, pepper, and tea estates',
      'Adjoining hilltop viewing deck and peaceful garden relaxation zones'
    ],
    inclusions: [
      'VIP fast-track glass bridge entry pass and protective overshoes',
      'Private 4x4 mountain transfer up the estate approach road',
      'Dedicated guide escort for estate navigation',
      'Highland viewpoint photo stops',
      'Complimentary bottled water'
    ],
    destinations: [
      { name: 'Wayanad Glass Bridge', slug: 'wayanad' }
    ],
    conciergeTip: 'Morning visits around 9:00 AM provide the clearest visibility as the valley fog burns off, giving you crystal-clear panoramic mountain vistas for photography.'
  },
  {
    slug: 'soochipara-waterfalls-experience',
    title: 'Soochipara Waterfalls Experience',
    category: 'Wilderness & Wildlife',
    tagline: 'Cascading Forest Waterfall, Dense Greenery & Natural Rock Pools',
    duration: 'Half Day // 3–4 Hours',
    intensity: 'Moderate Activity',
    bestTime: 'September – March',
    vibe: 'Refreshing, Natural & Invigorating',
    heroImage: '/images/tour_2_rainforest.jpg',
    gallery: [
      '/images/tour_2_rainforest.jpg',
      '/images/dest_1_wayanad.jpg',
      '/images/offer_1_hike.jpg',
      '/images/exp_treehouse.jpg'
    ],
    story: 'Discover a spectacular cascading waterfall surrounded by dense greenery and the natural beauty of Wayanad. Known locally as Sentinel Rock, Soochipara cascades down three dramatic tiers from over 200 meters into a cool, crystal-clear natural pool. The journey begins with a scenic 2-kilometer shaded downhill hike through tea estates and moist evergreen forests, filled with the calls of hornbills and giant Malabar squirrels.',
    highlights: [
      'Trekking along shaded stone trails through fragrant tea gardens and tropical foliage',
      'Thunderous three-tier waterfall cascading down 200 meters of granite cliffs',
      'Rejuvenating natural plunge pool for dipping your feet in cool mountain water',
      'Towering sheer cliff faces framed by primary Western Ghats rainforest',
      'Rich biodiversity with native forest birds, giant squirrels, and rare forest flora'
    ],
    inclusions: [
      'Forest department entry permits and eco-tourism conservation passes',
      'Accompanied by an experienced local nature trek guide',
      'Walking poles and trail safety assistance',
      'Hydration pack and light snacks',
      'Private hotel transport to the trail base'
    ],
    destinations: [
      { name: 'Soochipara Waterfalls', slug: 'wayanad' }
    ],
    conciergeTip: 'Wear shoes with sturdy tread as the stones near the spray zone stay slick. The return hike is uphill, so take your time and enjoy the shaded tea-plantation scenery.'
  },
  {
    slug: 'spice-plantation-tour',
    title: 'Spice Plantation Tour',
    category: 'Heritage & Sacred Arts',
    tagline: 'Explore Aromatic Spice Gardens & Traditional Cultivation Heritage',
    duration: '2–3 Hours',
    intensity: 'Gentle & Relaxed',
    bestTime: 'Year-Round',
    vibe: 'Aromatic, Educational & Sensory',
    heroImage: '/images/exp_tea_bungalow.jpg',
    gallery: [
      '/images/exp_tea_bungalow.jpg',
      '/images/why_1_private_pace.jpg',
      '/images/ayurveda_herbal_oils.jpg',
      '/images/tour_5_wildlife.jpg'
    ],
    story: 'Explore Kerala’s aromatic spice gardens and discover how traditional spices are cultivated. Guided by a resident botanist, walk through multi-layered family-owned plantations where black pepper vines climb tall silver oaks, green cardamom clusters flourish near the forest floor, and fragrant trees yield cinnamon, nutmeg, clove, and vanilla. Discover how spices fueled 3,000 years of global trade and how each botanical is prepared for Ayurvedic healing.',
    highlights: [
      'Guided sensory walk through a certified organic highland spice garden',
      'Hands-on identification of real cardamom pods, cinnamon bark, and black pepper vines',
      'Demonstration of traditional harvesting, sun-curing, and grading methods',
      'Insights into medicinal properties of native herbs used in classical Ayurveda',
      'Tasting freshly brewed estate herbal tea infused with clove, ginger, and cardamom'
    ],
    inclusions: [
      'Private spice estate admission and expert botanical guide escort',
      'Fresh herbal tea tasting and traditional Kerala snacks',
      'Curated whole spice gift kit from the estate',
      'Access to spice drying rooms and essential oil extraction exhibits',
      'Private hotel transfers in Thekkady or Munnar'
    ],
    destinations: [
      { name: 'Thekkady Spice Plantations', slug: 'thekkady' }
    ],
    conciergeTip: 'Pick up vacuum-sealed whole green cardamom (grade 8mm+) and fresh nutmeg directly from the drying sheds — the aroma is incomparably fresher than supermarket spice jars.'
  },
  {
    slug: 'varkala-cliff-beach-experience',
    title: 'Varkala Cliff & Beach Experience',
    category: 'Coastal & Adventure',
    tagline: 'Stunning Coastal Cliffs, Golden Sandy Beaches, Seaside Cafés & Ocean Views',
    duration: 'Half Day to Full Day',
    intensity: 'Gentle & Relaxed',
    bestTime: 'October – March',
    vibe: 'Bohemian, Scenic & Coastal',
    heroImage: '/images/dest_5_varkala.jpg',
    gallery: [
      '/images/dest_5_varkala.jpg',
      '/images/exp_yoga.jpg',
      '/images/tour_6_coastal.jpg',
      '/images/tour_3_coastal.jpg'
    ],
    story: 'Discover stunning coastal cliffs, golden sandy beaches, seaside cafés, and beautiful ocean views in Varkala. Unique along the entire Indian coastline, towering red laterite cliffs stand directly above the turquoise Arabian Sea. Stroll along the pedestrian North Cliff promenade lined with bohemian cafés and handicraft shops, descend to the holy sands of Papanasam Beach with its natural mineral springs, and watch the sun melt into the ocean as evening lamps glow along the cliff edge.',
    highlights: [
      'Strolling the picturesque clifftop walkway with uninterrupted views of the Arabian Sea',
      'Relaxing on the golden sands of Papanasam Beach beneath dramatic red cliffs',
      'Enjoying fresh seafood, fruit juices, and Kerala delicacies at oceanfront cafés',
      'Discovering natural freshwater mineral springs emerging directly from laterite rocks',
      'Spectacular cliffside sunset vantage points as fishing catamarans light up the dusk'
    ],
    inclusions: [
      'Dedicated local host and clifftop heritage walking guide',
      'Reserved cliffside sunset table with panoramic ocean view',
      'Fresh coconut water and coastal refreshments',
      'Optional escorted visit to the 2,000-year-old Janardanaswamy Temple',
      'Private chauffeur transfers'
    ],
    destinations: [
      { name: 'Varkala Cliff and Varkala Beach', slug: 'varkala' }
    ],
    conciergeTip: 'Reserve an ocean-facing table at a North Cliff café by 5:15 PM. Watching the sun dip below the Arabian Sea while waves crash against the laterite cliffs below is a defining Kerala memory.'
  }
];

export function getExperienceBySlug(slug: string): ExperienceItem | undefined {
  const normalized = slug.trim().toLowerCase();
  return KERALA_EXPERIENCES.find((e) => e.slug.toLowerCase() === normalized);
}
