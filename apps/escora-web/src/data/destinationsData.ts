export interface CuratedStay {
  name: string;
  type: string;
  note: string;
}

export interface DayPlan {
  day: number;
  title: string;
  desc: string;
}

export interface DestinationDetail {
  slug: string;
  name: string;
  region: string;
  type: 'Highlands' | 'Backwaters' | 'Coastal' | 'Forest & Wildlife' | 'Heritage';
  shortDesc: string;
  description: string;
  coordinates: string;
  elevation?: string;
  bestSeason: string;
  nightsMin: number;
  nightsMax: number;
  imageUrl: string;
  gallery: string[];
  highlights: string[];
  howToReach: string;
  sampleItinerary?: {
    title: string;
    totalNights: string;
    days: DayPlan[];
  };
  curatedStays?: CuratedStay[];
}

export const KERALA_DESTINATIONS: DestinationDetail[] = [
  {
    slug: 'munnar',
    name: 'Munnar',
    region: 'Idukki Highlands',
    type: 'Highlands',
    shortDesc: 'Misty rolling tea highlands, century-old British colonial bungalows, cool mountain breezes, and the wild Nilgiri tahr on Anamudi slopes.',
    description: 'Perched 1,600 metres above sea level where three mountain streams converge, Munnar is the crown jewel of the Western Ghats. Rolling carpet-green tea estates stretch as far as the eye can see, punctuated by cool mountain mists, cascading silver waterfalls, and heritage bungalows that echo a storied colonial past. Eravikulam National Park protects the endangered Nilgiri tahr, while trails through cardamom-scented shola forests lead to private picnic spots high above the cloudline.',
    coordinates: '10.08°N 77.06°E',
    elevation: '1,600 m – 2,695 m',
    bestSeason: 'September – May',
    nightsMin: 2,
    nightsMax: 4,
    imageUrl: '/images/dest_3_munnar.jpg',
    gallery: [
      '/images/dest_3_munnar.jpg',
      '/images/tour_3_tea_highlands.jpg',
      '/images/exp_tea_bungalow.jpg',
      '/images/dest_2_vagamon.jpg'
    ],
    highlights: [
      'Private dawn tea-cupping walking tour through century-old Kannan Devan estates with a 3rd-generation planter',
      'Exclusive permit excursion to Eravikulam National Park to witness the rare Nilgiri tahr in their natural habitat',
      'Highland private picnics overlooking Mattupetty reservoir and rolling eucalyptus ridges',
      'Strolls through private organic cardamom and cinnamon plantations around Chinnakanal',
      'Sundowners by a wood-burning colonial fireplace in a restored British heritage planter residence'
    ],
    howToReach: 'Nearest airport: Cochin International Airport (COK), approx. 110 km (3.5 hours scenic drive through mountain waterfalls). Private luxury chauffeur transit provided.',
    sampleItinerary: {
      title: 'Misty Summits & Planter Heritage',
      totalNights: '3 Nights / 4 Days',
      days: [
        {
          day: 1,
          title: 'Ascent to the Tea Highlands',
          desc: 'Private scenic drive from Cochin up through mist-draped ghat roads and Cheeyappara falls. Check-in to your heritage tea estate bungalow with afternoon high tea overlooking the valley.'
        },
        {
          day: 2,
          title: 'Planter Trail & Private Tea Cupping',
          desc: 'Dawn walk through rolling tea fields with a resident planter. Afternoon visit to the historical tea museum, followed by a private single-origin cupping session and sunset strolls.'
        },
        {
          day: 3,
          title: 'Eravikulam & Shola Forest Sanctuaries',
          desc: 'Morning VIP access to Eravikulam National Park. Afternoon lakeside relaxation at Mattupetty and an aromatic spice walk through mountain valleys.'
        },
        {
          day: 4,
          title: 'Highland Sunrise & Onward Journey',
          desc: 'Crisp mountain dawn with estate-fresh brew. Leisurely breakfast on the verandah before chauffeured transfer down toward the backwaters or Cochin.'
        }
      ]
    },
    curatedStays: [
      { name: 'Lockhart Estate Bungalow', type: 'Colonial Planter Residence', note: '140-year-old stone architecture set amidst private organic tea hills.' },
      { name: 'Windermere Estate', type: 'Highland Luxury Retreat', note: 'Coffee and cardamom sanctuary offering panoramic valley sunset vistas.' },
      { name: 'Chandy’s Windy Woods', type: 'Boutique Forest Lodge', note: 'Contemporary glass-and-stone luxury nestled into high mountain slopes.' }
    ]
  },
  {
    slug: 'alleppey',
    name: 'Alleppey & Vembanad',
    region: 'Alappuzha Waterways',
    type: 'Backwaters',
    shortDesc: 'Silent emerald palm canals, private handcrafted Kettuvallam houseboats with personal chefs, and tranquil village life below sea level.',
    description: 'Revered as the Venice of the East, Alappuzha is an intricate tapestry of freshwater rivers, tranquil lagoons, and canals fed by the majestic Vembanad Lake. Gliding aboard a private handcrafted Kettuvallam — made of jackwood and coir without a single nail — you encounter an unhurried, timeless world of toddy-tappers, lotus meadows, and below-sea-level paddy fields in Kuttanad. Nights on the water are silent, accompanied only by the soft rhythm of water and starry skies.',
    coordinates: '9.49°N 76.33°E',
    elevation: 'Sea Level (Below-sea-level farming)',
    bestSeason: 'Year-round (Peak: October – March)',
    nightsMin: 1,
    nightsMax: 3,
    imageUrl: '/images/tour_1_backwaters.jpg',
    gallery: [
      '/images/tour_1_backwaters.jpg',
      '/images/exp_houseboat.jpg',
      '/images/exp_pool_villa.jpg',
      '/images/dest_kumarakom.jpg'
    ],
    highlights: [
      'Private luxury Kettuvallam charter equipped with air-conditioned staterooms and your personal onboard chef',
      'Candlelit dinners anchored in secluded lagoons with fresh Karimeen Pollichathu caught that afternoon',
      'Sunrise country canoe excursions into narrow village canals inaccessible to larger craft',
      'Slow exploration of Kuttanad — the only region in India where agriculture flourishes below sea level',
      'Sunset cruise across Vembanad Lake with traditional hot banana fritters and spiced chai'
    ],
    howToReach: 'Nearest airport: Cochin International Airport (COK), approx. 85 km (1.5 to 2 hours drive via private highway chauffeur).',
    sampleItinerary: {
      title: 'The Silent Waterways Voyage',
      totalNights: '2 Nights / 3 Days',
      days: [
        {
          day: 1,
          title: 'Embarkation on the Private Kettuvallam',
          desc: 'Board your private luxury houseboat at midday with fresh tender coconut water. Cruise along Vembanad Lake as your chef prepares a traditional multi-course Kerala banana-leaf feast. Sunset anchor in quiet waters.'
        },
        {
          day: 2,
          title: 'Dawn Canoe & Village Waterways',
          desc: 'Wake to mist rising off the lake. Transfer into a slender wooden canoe guided by a local boatman to explore narrow village waterways. Afternoon relaxation at a private lakeside boutique villa.'
        },
        {
          day: 3,
          title: 'Lake Strolls & Departure',
          desc: 'Slow lakeside breakfast with views of migratory aquatic birds. Leisurely morning by the pool villa before your concierge chauffeur arrives.'
        }
      ]
    },
    curatedStays: [
      { name: 'ESCORA Sovereign Kettuvallam', type: 'Private Houseboat Charter', note: 'Handcrafted luxury barge with personalized culinary crew and private observation deck.' },
      { name: 'Purity at Lake Vembanad', type: 'Waterfront Boutique Sanctuary', note: 'Art-filled Italian-Keralite retreat right on the tranquil shore.' },
      { name: 'Aymanam Heritage Retreat', type: 'Historic Waterfront Residence', note: 'Aristocratic riverside mansion with serene private gardens.' }
    ]
  },
  {
    slug: 'wayanad',
    name: 'Wayanad Rainforest',
    region: 'Deccan Plateau Ghats',
    type: 'Forest & Wildlife',
    shortDesc: 'Ancient mist-clad rainforests, Neolithic Edakkal rock caves, wild elephant sanctuaries, and eco-luxury canopy treehouses 60 feet above the forest floor.',
    description: 'Resting on the southern tip of the Deccan plateau, Wayanad is an unspoiled mountain wilderness of evergreen canopies, bamboo groves, and ancient spice plantations. The district forms a crucial wildlife corridor of the Nilgiri Biosphere Reserve, where wild Asian elephants, leopards, and gaurs roam free. Neolithic petroglyphs at Edakkal Caves whisper of civilizations dating back 8,000 years, while secluded luxury treehouses provide an unmatched connection to the untamed forest.',
    coordinates: '11.68°N 76.13°E',
    elevation: '700 m – 2,100 m',
    bestSeason: 'September – May',
    nightsMin: 2,
    nightsMax: 4,
    imageUrl: '/images/dest_1_wayanad.jpg',
    gallery: [
      '/images/dest_1_wayanad.jpg',
      '/images/exp_treehouse.jpg',
      '/images/dest_4_rafting.jpg',
      '/images/tour_2_rainforest.jpg'
    ],
    highlights: [
      'Eco-luxury treehouse suites suspended 60 feet above the forest canopy with open valley panoramas',
      'Guided private trek to the Neolithic Edakkal Caves with an anthropological guide',
      'Exclusive 4x4 wildlife safari through Muthanga Sanctuary in search of wild elephant herds',
      'Quiet bamboo rafting across the serene waters of Banasura Sagar Lake',
      'Private plantation walk learning the cultivation of Malabar black pepper, ginger, and wild coffee'
    ],
    howToReach: 'Nearest airports: Calicut/Kozhikode International Airport (CCJ), 85 km (2.5 hours); or Kannur International Airport (CNN), 90 km. Private luxury 4x4/SUV escort.',
    sampleItinerary: {
      title: 'Rainforest Canopy & Wildlife Trail',
      totalNights: '3 Nights / 4 Days',
      days: [
        {
          day: 1,
          title: 'Ascent into the Rainforest Canopy',
          desc: 'Chauffeur escort up the dramatic Thamarassery Ghat pass into Wayanad. Check in to your private canopy treehouse sanctuary surrounded by birdsong and mountain mist.'
        },
        {
          day: 2,
          title: 'Neolithic Secrets & Spice Estates',
          desc: 'Morning private trek to Edakkal Caves to examine prehistoric petroglyphs. Afternoon tasting of single-estate Robusta coffees and spice harvesting at a family-run heritage plantation.'
        },
        {
          day: 3,
          title: 'Wildlife Safari & Banasura Waters',
          desc: 'Dawn jeep safari through Muthanga Reserve accompanied by a naturalist tracker. Afternoon serene boat cruise on Banasura Sagar reservoir.'
        },
        {
          day: 4,
          title: 'Forest Dawn & Calicut Transit',
          desc: 'Enjoy a slow morning listening to the waking jungle canopy. Chauffeured transfer down to Kozhikode for coastal culinary journeys or airport departure.'
        }
      ]
    },
    curatedStays: [
      { name: 'Vythiri Resort Treehouse', type: 'Canopy Eco-Sanctuary', note: 'Engineered entirely from natural materials over a mountain stream.' },
      { name: 'Tranquil Resort', type: 'Coffee Estate Hideaway', note: 'Private 400-acre working coffee and pepper plantation with heritage rooms.' },
      { name: 'Pepper Trail', type: 'Colonial Plantation Bungalow', note: 'Restored 140-year-old estate bungalow surrounded by pristine tropical forest.' }
    ]
  },
  {
    slug: 'fort-kochi',
    name: 'Fort Kochi',
    region: 'Central Malabar Coast',
    type: 'Heritage',
    shortDesc: 'Centuries-old Chinese cantilevered fishing nets, Portuguese churches, Dutch palaces, Jew Town spice merchants, and world-renowned Biennale art spaces.',
    description: 'Steeped in half a millennium of maritime history, Fort Kochi is a living museum where Arab, Portuguese, Dutch, and British influences meld into a hypnotic coastal rhythm. Massive Chinese cantilevered fishing nets still dip silently into the harbour at sunset. Cobblestoned lanes are lined with pastel-washed heritage mansions, spice warehouses exuding black pepper and cardamom, and contemporary art galleries that host the celebrated Kochi-Muziris Biennale.',
    coordinates: '9.96°N 76.24°E',
    elevation: 'Sea Level',
    bestSeason: 'October – March',
    nightsMin: 1,
    nightsMax: 3,
    imageUrl: '/images/dest_fort_kochi.jpg',
    gallery: [
      '/images/dest_fort_kochi.jpg',
      '/images/exp_heritage.jpg',
      '/images/exp_kathakali.jpg',
      '/images/tour_1_classic.jpg'
    ],
    highlights: [
      'Sunset cocktails overlooking the iconic 14th-century Chinese fishing nets in active operation',
      'Private walking tour with a local historian through Jew Town and the 1568 Paradesi Synagogue',
      'Exclusive backstage access to the sacred Kathakali makeup transformation and live classical performance',
      'Curated contemporary art tour through Kochi-Muziris Biennale venues and colonial warehouses',
      'Fine dining at historic courtyards sampling royal Travancore coastal seafood and Syrian Christian delicacies'
    ],
    howToReach: 'Nearest airport: Cochin International Airport (COK), approx. 38 km (1 hour smooth transit via executive chauffeur).',
    sampleItinerary: {
      title: 'Spice Routes & Colonial Heritage',
      totalNights: '2 Nights / 3 Days',
      days: [
        {
          day: 1,
          title: 'Arrival in the Historic Port',
          desc: 'Executive transfer from Cochin airport to your colonial boutique heritage hotel in Fort Kochi. Sunset walk past the Chinese fishing nets followed by dinner at a restored Dutch courtyard.'
        },
        {
          day: 2,
          title: 'Historian Walk, Jew Town & Sacred Arts',
          desc: 'Morning walking exploration of St. Francis Church, Mattancherry Palace murals, and antique spice stores in Jew Town. Evening private front-row seats for a traditional Kathakali performance.'
        },
        {
          day: 3,
          title: 'Artisan Cafés & Onward Transfer',
          desc: 'Morning coffee at a historic art café. Leisurely check-out and private transfer to Munnar highlands or Alleppey waterways.'
        }
      ]
    },
    curatedStays: [
      { name: 'Brunton Boatyard', type: 'Colonial Maritime Luxury', note: 'Restored Victorian shipyard hotel directly on the harbor entrance.' },
      { name: 'Malabar House', type: 'Design Heritage Boutique', note: '18th-century residence combining contemporary Indian art with historic architecture.' },
      { name: 'Old Harbour Hotel', type: 'Portuguese Heritage Residence', note: '300-year-old boutique property with lush open garden courtyards.' }
    ]
  },
  {
    slug: 'thekkady',
    name: 'Thekkady & Periyar',
    region: 'Cardamom Hills',
    type: 'Forest & Wildlife',
    shortDesc: 'Periyar Tiger Reserve lake safaris, wild elephant herds at the water’s edge, spice plantation aromatherapy, and dawn bamboo river rafting.',
    description: 'Resting in the aromatic Cardamom Hills, Thekkady is a sanctuary where pristine wilderness meets centuries of spice-trade history. Centred around Periyar Lake, the 777 sq km tiger reserve is home to wild Asian elephants, gaurs, Nilgiri langurs, and over 320 species of birds. The surrounding hills are draped in endless spice plantations of cardamom, black pepper, cinnamon, nutmeg, and vanilla, filling the mountain air with an intoxicating fragrance.',
    coordinates: '9.59°N 77.16°E',
    elevation: '900 m – 1,200 m',
    bestSeason: 'October – April',
    nightsMin: 2,
    nightsMax: 3,
    imageUrl: '/images/dest_4_rafting.jpg',
    gallery: [
      '/images/dest_4_rafting.jpg',
      '/images/tour_5_wildlife.jpg',
      '/images/dest_2_vagamon.jpg',
      '/images/offer_1_hike.jpg'
    ],
    highlights: [
      'Dawn bamboo river rafting accompanied by tribal trackers through secluded forest waterways',
      'Private boat safari across Periyar Lake observing wild elephant families bathing at the shoreline',
      'Hands-on organic spice plantation walk with a botanist explaining pepper pollination and vanilla curing',
      'Night jungle scouting with armed forest rangers for nocturnal mammals and glowing flora',
      'Traditional Kalaripayattu martial arts demonstration at an authentic earthen arena'
    ],
    howToReach: 'Nearest airports: Cochin International Airport (COK), 145 km (4 hours); or Madurai Airport, 115 km (3 hours). Private SUV chauffeur provided.',
    sampleItinerary: {
      title: 'Wild Cardamom & Forest Trails',
      totalNights: '2 Nights / 3 Days',
      days: [
        {
          day: 1,
          title: 'Ascent to the Spice Foothills',
          desc: 'Scenic drive through rubber and spice plantations into Thekkady. Check-in to your eco-lodge and evening martial arts showcase of Kalaripayattu.'
        },
        {
          day: 2,
          title: 'Periyar Rafting & Spice Discovery',
          desc: 'Early morning bamboo rafting and jungle walk with indigenous forest guides. Afternoon aromatic spice tour followed by a private tribal-infused dinner.'
        },
        {
          day: 3,
          title: 'Wildlife Watch & Departure',
          desc: 'Morning boat safari across Periyar Lake. Relaxed breakfast before departing toward Alleppey backwaters or Madurai.'
        }
      ]
    },
    curatedStays: [
      { name: 'Spice Village (CGH Earth)', type: 'Tribal Eco-Sanctuary', note: 'Thatch-roofed tribal cottages built with elephant grass in a botanical haven.' },
      { name: 'Niraamaya Retreats Cardamom Club', type: 'Luxury Mountain Hideaway', note: 'Private cottages set inside an operating 9-acre cardamom estate.' },
      { name: 'Amritara Shalimar Spice Garden', type: 'Boutique Forest Sanctuary', note: 'Charming thatched villas surrounded by natural streams and wildlife.' }
    ]
  },
  {
    slug: 'varkala',
    name: 'Varkala',
    region: 'South Arabian Coastline',
    type: 'Coastal',
    shortDesc: 'Dramatic red laterite sea cliffs meeting turquoise Arabian waters, clifftop yoga shalas, sacred mineral springs, and golden sunset beaches.',
    description: 'Varkala is uniquely breathtaking — the only place in southern India where striking red laterite cliffs plunge directly into the Arabian Sea. Beneath the dramatic cliff promenade lies Papanasam Beach, famed for its ancient purifying mineral waters. Above, bohemian clifftop cafés and open-air yoga pavilions catch ocean breezes, while nearby luxury pool villas tucked inside coconut groves offer complete barefoot tranquility.',
    coordinates: '8.73°N 76.71°E',
    elevation: 'Clifftop Coastline (30m above sea level)',
    bestSeason: 'October – March',
    nightsMin: 2,
    nightsMax: 4,
    imageUrl: '/images/dest_5_varkala.jpg',
    gallery: [
      '/images/dest_5_varkala.jpg',
      '/images/tour_6_coastal.jpg',
      '/images/retreat_1_ayurveda.jpg',
      '/images/exp_pool_villa.jpg'
    ],
    highlights: [
      'Clifftop oceanfront yoga and pranayama sessions at sunrise with master practitioners',
      'Sunset walks along the dramatic red laterite cliff promenade overlooking the ocean surf',
      'Private Ayurvedic rejuvenation treatments using indigenous coastal herb oils and thermal waters',
      'Canoe cruise through the tranquil Kappil Lake where freshwater lagoon meets the Arabian Sea',
      'Visit to the 2,000-year-old Sree Janardanaswamy Vishnu temple on the sacred hillside'
    ],
    howToReach: 'Nearest airport: Trivandrum International Airport (TRV), approx. 45 km (1 hour scenic coastal drive).',
    sampleItinerary: {
      title: 'Red Cliffs & Ocean Healing',
      totalNights: '3 Nights / 4 Days',
      days: [
        {
          day: 1,
          title: 'Arrival on the Clifftop Coast',
          desc: 'Private airport pickup from Trivandrum. Settle into your clifftop villa sanctuary with sunset drinks overlooking the crashing ocean waves.'
        },
        {
          day: 2,
          title: 'Ocean Yoga & Mineral Springs',
          desc: 'Morning sunrise yoga on a private timber deck. Afternoon Ayurvedic consultation and therapeutic herbal massage, followed by a clifftop dinner.'
        },
        {
          day: 3,
          title: 'Kappil Lagoon & Coastal Exploration',
          desc: 'Boat excursion through Kappil Lake where the backwater kisses the sea. Afternoon beach leisure and evening temple walk.'
        },
        {
          day: 4,
          title: 'Barefoot Dawn & Departure',
          desc: 'Final sunrise meditation and nourishing coastal breakfast before your chauffeur transfer to Trivandrum or Kovalam.'
        }
      ]
    },
    curatedStays: [
      { name: 'Elixir Cliff Resort', type: 'Luxury Clifftop Hideaway', note: 'Panoramic sea-view suites perched atop the north cliff.' },
      { name: 'Gateway Varkala (IHCL)', type: 'Clifftop Luxury Resort', note: 'Set in a quiet palm forest above the Arabian Sea with world-class dining.' },
      { name: 'B’Canti Boutique Resort', type: 'Private Coastal Haven', note: 'Intimate cliff-edge pool resort offering classical Ayurvedic therapies.' }
    ]
  },
  {
    slug: 'bekal',
    name: 'Bekal',
    region: 'North Malabar Shore',
    type: 'Coastal',
    shortDesc: 'A monumental 17th-century laterite sea fort above pristine, untouristed Malabar beaches, and secluded backwater estuary boat charters.',
    description: 'Located on Kerala’s northernmost coast, Bekal is defined by its monumental 17th-century laterite fort — the largest and most dramatic in Kerala. Resembling a giant keyhole extending out into the Arabian Sea, its weathered ramparts and observation towers provide sweeping 360-degree ocean vistas. Far from mass tourism, Bekal offers tranquil secluded beaches, the pristine Valiyaparamba backwaters, and ultra-luxury private sanctuaries.',
    coordinates: '12.39°N 75.03°E',
    elevation: 'Sea Level',
    bestSeason: 'October – March',
    nightsMin: 2,
    nightsMax: 3,
    imageUrl: '/images/dest_bekal.jpg',
    gallery: [
      '/images/dest_bekal.jpg',
      '/images/dest_kannur.jpg',
      '/images/tour_6_coastal.jpg',
      '/images/exp_pool_villa.jpg'
    ],
    highlights: [
      'Private sunset walk along the ramparts of Bekal Fort with waves breaking against the laterite walls',
      'Exclusive day cruise through the uncrowded Valiyaparamba backwater islands',
      'Barefoot strolls along golden, crowd-free Malabar sands at Kappil Beach',
      'Private dining set in secluded beachfront coconut groves under the stars',
      'Visit to ancient hillock meditation caves at Anandashram'
    ],
    howToReach: 'Nearest airports: Kannur International Airport (CNN), 55 km; or Mangalore International Airport (IXE), 70 km. Executive chauffeur escort.',
    sampleItinerary: {
      title: 'North Malabar Fortresses & Shores',
      totalNights: '2 Nights / 3 Days',
      days: [
        {
          day: 1,
          title: 'Arrival in North Malabar',
          desc: 'Private transfer from Kannur or Mangalore airport. Check into your private luxury beach villa. Evening sunset walk along the fort ramparts.'
        },
        {
          day: 2,
          title: 'Valiyaparamba Backwaters & Beach Leisure',
          desc: 'Morning private solar boat charter through the secluded Valiyaparamba estuary. Afternoon rejuvenating Ayurvedic therapy and seaside dinner.'
        },
        {
          day: 3,
          title: 'Malabar Dawn & Departure',
          desc: 'Coastal breakfast overlooking the waves. Relaxed morning before onward transfer to Kannur for a Theyyam experience or flight departure.'
        }
      ]
    },
    curatedStays: [
      { name: 'Taj Bekal Resort & Spa', type: 'Ultra-Luxury Beach Sanctuary', note: 'Kettuvallam-inspired luxury villas with private plunge pools along the backwater estuary.' },
      { name: 'The Lalit Resort & Spa Bekal', type: 'Luxury Riverfront Haven', note: 'Surrounded by the serene Nombili River with an internationally acclaimed spa.' }
    ]
  },
  {
    slug: 'kannur',
    name: 'Kannur',
    region: 'North Malabar Heritage',
    type: 'Coastal',
    shortDesc: 'The sacred heartland of the Theyyam fire ritual, Asia’s longest drive-in beach at Muzhappilangad, handloom weaving, and Thalassery spice forts.',
    description: 'Kannur is Malabar’s untamed cultural epicentre. It is here that Theyyam — an ancient ritualistic performance where men transform into living deities through elaborate face-paint, tower-like headgears, and ecstatic fire dances — is performed in sacred groves. Kannur also boasts Muzhappilangad, India’s only true drive-in beach where vehicles glide along four kilometres of hard golden sands, and Thalassery’s celebrated culinary and weaving heritage.',
    coordinates: '11.87°N 75.37°E',
    elevation: 'Sea Level',
    bestSeason: 'November – May (Theyyam ritual season)',
    nightsMin: 2,
    nightsMax: 3,
    imageUrl: '/images/dest_kannur.jpg',
    gallery: [
      '/images/dest_kannur.jpg',
      '/images/dest_bekal.jpg',
      '/images/exp_heritage.jpg',
      '/images/exp_kathakali.jpg'
    ],
    highlights: [
      'Private night access to an authentic village temple grove to witness the sacred Theyyam fire dance in trance',
      'Thrilling sunset drive along the water’s edge at Muzhappilangad, India’s longest drive-in beach',
      'Exploration of St. Angelo Fort (built 1505) and Thalassery Fort with an architectural guide',
      'Tasting of authentic Thalassery dum biryani and heirloom Malabar snacks at a private family table',
      'Visits to traditional master handloom weaving cooperatives preserving century-old techniques'
    ],
    howToReach: 'Nearest airport: Kannur International Airport (CNN), approx. 25 km (35 minutes drive). Kannur railway station is on the main coastal express line.',
    sampleItinerary: {
      title: 'Sacred Theyyam & The Malabar Shore',
      totalNights: '2 Nights / 3 Days',
      days: [
        {
          day: 1,
          title: 'Arrival in North Malabar’s Cultural Capital',
          desc: 'Airport greeting and transfer to your beachfront retreat. Sunset drive on the sands of Muzhappilangad Beach followed by Malabar coastal dinner.'
        },
        {
          day: 2,
          title: 'The Living Gods: Theyyam Ritual Immersion',
          desc: 'Day visit to St. Angelo Fort and Thalassery handloom houses. At dusk, escorted trip with a cultural custodian to a village shrine to witness Theyyam transformations.'
        },
        {
          day: 3,
          title: 'Spice Port Farewell',
          desc: 'Morning beach stroll and traditional appam breakfast before transfer to Kannur airport or onward to Wayanad highlands.'
        }
      ]
    },
    curatedStays: [
      { name: 'Kk Homes & Heritage', type: 'Boutique Malabar Sanctuary', note: 'Intimate coastal retreat offering insider access to local temple groves.' },
      { name: 'The Malabar Beach Resort', type: 'Seaside Coastal Lodge', note: 'Serene rooms situated on the quiet shores of Kannur with direct beach access.' }
    ]
  },
  {
    slug: 'kumarakom',
    name: 'Kumarakom',
    region: 'Vembanad Eastern Shore',
    type: 'Backwaters',
    shortDesc: 'A tranquil 14-acre bird sanctuary on Vembanad Lake, private luxury lakefront villas with plunge pools, and silent dawn canoe excursions.',
    description: 'Set on the eastern shore of Vembanad Lake, Kumarakom is the quieter, more secluded counterpart to Alleppey. Here, luxury resorts are built directly along tranquil waterways, with private villas boasting plunge pools, floating cottages, and lush gardens visited by kingfishers. The 14-acre Kumarakom Bird Sanctuary shelters migratory Siberian cranes, egrets, and darters, offering unmatched dawn birding amidst lotus ponds.',
    coordinates: '9.62°N 76.43°E',
    elevation: 'Sea Level',
    bestSeason: 'November – February (Birding peak: June – August & Nov – Feb)',
    nightsMin: 2,
    nightsMax: 3,
    imageUrl: '/images/dest_kumarakom.jpg',
    gallery: [
      '/images/dest_kumarakom.jpg',
      '/images/exp_pool_villa.jpg',
      '/images/tour_1_backwaters.jpg',
      '/images/exp_houseboat.jpg'
    ],
    highlights: [
      'Early morning private naturalist walking tour through Kumarakom Bird Sanctuary',
      'Private sunset speedboat or wooden canoe tour to Pathiramanal birding island',
      'Deep Ayurvedic rejuvenation therapies in tranquil open-air treatment pavilions over the water',
      'Village life immersion: traditional toddy tapping demonstrations and coir fiber spinning',
      'Private lakeside candlelit seafood dining featuring pearl spot fish and fresh tiger prawns'
    ],
    howToReach: 'Nearest airport: Cochin International Airport (COK), approx. 75 km (1.5 hours drive). Kottayam railway station is 14 km away.',
    sampleItinerary: {
      title: 'Lakeside Serenity & Birding Sanctuaries',
      totalNights: '2 Nights / 3 Days',
      days: [
        {
          day: 1,
          title: 'Arrival on the Vembanad Waterfront',
          desc: 'Private transfer from Cochin to Kumarakom. Check into your waterfront pool villa. Sunset cocktail cruise on the lake.'
        },
        {
          day: 2,
          title: 'Birding Island & Ayurvedic Pampering',
          desc: 'Dawn boat safari through Kumarakom Bird Sanctuary with binoculars and naturalist. Afternoon Ayurvedic massage followed by high tea.'
        },
        {
          day: 3,
          title: 'Morning Waters & Departure',
          desc: 'Relaxed breakfast by the lotus lagoon. Private transfer to Cochin airport or onwards to the hill station of Munnar.'
        }
      ]
    },
    curatedStays: [
      { name: 'Kumarakom Lake Resort', type: 'Heritage Luxury Sanctuary', note: 'Recognized worldwide for traditional 16th-century ancestral Keralite villas.' },
      { name: 'The Zuri Kumarakom', type: 'Luxury Island Resort & Spa', note: 'Features one of South India’s largest holistic spa complexes on the lagoon.' }
    ]
  },
  {
    slug: 'kovalam',
    name: 'Kovalam',
    region: 'South Kerala Shoreline',
    type: 'Coastal',
    shortDesc: 'Three golden crescent bays framed by coconut palm groves, anchored by the iconic red-and-white striped Vizhinjam lighthouse.',
    description: 'Kovalam has been a beloved retreat for discerning global travellers since the 1930s when the Maharani of Travancore popularized its sheltered bays. Three distinct crescent beaches — Lighthouse, Hawah, and Samudra — are separated by rocky promontories. The 30-metre striped Vizhinjam lighthouse affords sweeping coastal panoramas, while world-renowned Ayurvedic treatment centres deliver authentic Panchakarma therapies right along the warm Arabian Sea.',
    coordinates: '8.40°N 76.98°E',
    elevation: 'Sea Level',
    bestSeason: 'November – March',
    nightsMin: 2,
    nightsMax: 3,
    imageUrl: '/images/dest_kovalam.jpg',
    gallery: [
      '/images/dest_kovalam.jpg',
      '/images/dest_5_varkala.jpg',
      '/images/retreat_1_ayurveda.jpg',
      '/images/tour_6_coastal.jpg'
    ],
    highlights: [
      'Climb the 142 steps of the 30-metre Vizhinjam lighthouse for 360-degree views of the crescent bays',
      'Signature Ayurvedic Panchakarma therapy sessions tailored by veteran Vaidyas (hereditary physicians)',
      'Private day excursion to the Poovar golden sand island where river, sea, and backwater converge',
      'Fresh catch of the day dining along Lighthouse Beach with private table arrangements',
      'Excursion into Trivandrum for the Padmanabhaswamy temple and Travancore royal palaces'
    ],
    howToReach: 'Nearest airport: Trivandrum International Airport (TRV), approx. 14 km (a brief 25-minute executive transfer).',
    sampleItinerary: {
      title: 'Crescent Bays & Ayurvedic Bliss',
      totalNights: '2 Nights / 3 Days',
      days: [
        {
          day: 1,
          title: 'Arrival on the Royal Shore',
          desc: 'Quick 25-minute transfer from Trivandrum airport to your luxury clifftop beach resort. Sunset walk along Lighthouse Beach.'
        },
        {
          day: 2,
          title: 'Ayurveda & Poovar Estuary',
          desc: 'Morning consultation with an Ayurvedic physician followed by Abhyanga massage. Afternoon excursion to Poovar’s mangrove backwaters.'
        },
        {
          day: 3,
          title: 'Lighthouse Sunrise & Departure',
          desc: 'Morning climb to Vizhinjam lighthouse before breakfast on the terrace. Leisurely check-out and airport transfer.'
        }
      ]
    },
    curatedStays: [
      { name: 'The Leela Kovalam', type: 'Clifftop Luxury Palace', note: 'Perched on a dramatic cliff with private beach access and panoramic sea vistas.' },
      { name: 'Niraamaya Retreats Surya Samudra', type: 'Heritage Wellness Sanctuary', note: 'Traditional Keralite wooden cottages perched on rocky shores with world-class wellness.' }
    ]
  }
];

export function getDestinationBySlug(slug: string): DestinationDetail | undefined {
  const normalized = slug.trim().toLowerCase();
  return KERALA_DESTINATIONS.find((d) => d.slug.toLowerCase() === normalized);
}
