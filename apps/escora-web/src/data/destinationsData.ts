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
  featured?: boolean;
  latitude?: number;
  longitude?: number;
  sampleItinerary?: {
    title: string;
    totalNights: string;
    days: DayPlan[];
  };
  curatedStays?: CuratedStay[];
}

export const KERALA_DESTINATIONS: DestinationDetail[] = [
  {
    slug: 'kochi',
    name: 'Kochi',
    region: 'Central Malabar Coast',
    type: 'Heritage',
    shortDesc: 'Kochi is a beautiful coastal city known for its rich history, colonial architecture, heritage streets, and vibrant culture.',
    description: 'Where the Arabian Sea embraces emerald backwaters, Kochi stands as the queen of the Malabar coast. A storied crossroads of global maritime history, its heritage quarters whisper tales of Portuguese navigators, Dutch governors, British merchants, and ancient Jewish spice traders. Stroll through cobblestone streets shaded by raintrees in Fort Kochi, marvel at cantilevered Chinese fishing nets silhouetted against twilight skies, browse fragrant cardamom and cinnamon warehouses in Mattancherry, and immerse yourself in contemporary art at the world-renowned Kochi-Muziris Biennale.',
    coordinates: '9.9674°N 76.2429°E',
    elevation: 'Sea Level',
    bestSeason: 'October – March',
    nightsMin: 2,
    nightsMax: 3,
    imageUrl: '/images/destinations/kochi.jpg',
    gallery: [
      '/images/destinations/kochi.jpg',
      '/images/destinations/kochi_2.jpg'
    ],
    highlights: [
      'Sunset champagne cruise beside historic cantilevered Chinese fishing nets along the harbor mouth',
      'Guided heritage walking tour through Fort Kochi colonial avenues, St. Francis Church, and Dutch Cemeteries',
      'Private evening Kathakali masterclass and performance with greenroom makeup access',
      'Curated antiquities, pepper warehouses, and spices tour through historic Jew Town and Paradesi Synagogue',
      'Seafood dining and heritage bistro trails showcasing 500 years of global fusion cuisine'
    ],
    howToReach: 'Nearest airport: Cochin International Airport (COK), 38 km (approx. 1 hour executive chauffeur transfer). Major railway stations: Ernakulam Junction (ERS) & Ernakulam Town (ERN).',
    featured: true,
    latitude: 9.9674,
    longitude: 76.2429,
    sampleItinerary: {
      title: 'Colonial Legacies & Maritime Elegance',
      totalNights: '2 Nights / 3 Days',
      days: [
        {
          day: 1,
          title: 'Arrival & Fort Kochi Stroll',
          desc: 'Arrive via Cochin International Airport. Private luxury transfer to your heritage colonial boutique hotel. Twilight walk along Princess Street and sunset views over the Chinese fishing nets.'
        },
        {
          day: 2,
          title: 'Jew Town & Kathakali Mastery',
          desc: 'Morning exploration of Mattancherry Palace, Jew Town spice markets, and 16th-century synagogue. Evening front-row seats to an authentic Kathakali performance with greenroom access.'
        },
        {
          day: 3,
          title: 'Harbor Yacht Cruise & Departure',
          desc: 'Private morning harbor motor launch cruise across Willingdon Island and Bolgatty Palace, followed by chef-led coastal lunch before airport transit.'
        }
      ]
    },
    curatedStays: [
      { name: 'Brunton Boatyard', type: 'Heritage Waterfront Hotel', note: 'Restored Victorian shipyard hotel overlooking the bustling harbor channel with ocean liner aesthetics.' },
      { name: 'Old Harbour Hotel', type: 'Colonial Boutique Manor', note: 'A 300-year-old Dutch colonial residence surrounded by lush courtyard gardens in the heart of Fort Kochi.' }
    ]
  },
  {
    slug: 'munnar',
    name: 'Munnar',
    region: 'Idukki Highlands',
    type: 'Highlands',
    shortDesc: 'Munnar is a scenic hill station famous for its lush tea plantations, misty mountains, waterfalls, and cool climate.',
    description: 'Perched 1,600 metres above sea level where three mountain streams converge, Munnar is the crown jewel of the Western Ghats. Rolling carpet-green tea estates stretch across misty ridges as far as the eye can see, punctuated by cool mountain mists, cascading silver waterfalls, and heritage bungalows that echo a storied colonial past. Eravikulam National Park protects the endangered Nilgiri tahr, while trails through cardamom-scented shola forests lead to private picnic spots high above the cloudline.',
    coordinates: '10.0889°N 77.0595°E',
    elevation: '1,600 m – 2,695 m',
    bestSeason: 'September – May',
    nightsMin: 2,
    nightsMax: 4,
    imageUrl: '/images/destinations/munnar.jpg',
    gallery: [
      '/images/destinations/munnar.jpg',
      '/images/destinations/munnar_2.jpg'
    ],
    highlights: [
      'Pre-dawn 4x4 jeep safari ascending to Kolukkumalai summit for panoramic cloud-sea sunrise',
      'Private tea-cupping walking tour through century-old Kannan Devan estates with an expert planter',
      'Guided excursion into Eravikulam National Park to encounter the rare endangered Nilgiri tahr',
      'Scenic drives past cascading Attukal and Cheeyappara waterfalls tumbling through mountain gorges',
      'Evening sundowners beside colonial wood-burning fireplaces in historic British planter residences'
    ],
    howToReach: 'Nearest airport: Cochin International Airport (COK), approx. 110 km (3.5 hours scenic drive through mountain waterfalls). Private luxury chauffeur transit provided.',
    featured: true,
    latitude: 10.0889,
    longitude: 77.0595,
    sampleItinerary: {
      title: 'Misty Summits & Planter Heritage',
      totalNights: '3 Nights / 4 Days',
      days: [
        {
          day: 1,
          title: 'Ascent to the Tea Highlands',
          desc: 'Scenic private drive from Cochin up through mist-draped ghat roads and cascading waterfalls. Check-in to your colonial planter bungalow with valley high tea.'
        },
        {
          day: 2,
          title: 'Kolukkumalai Sunrise & Factory Cupping',
          desc: 'Dawn 4x4 safari to Kolukkumalai peak for sunrise above the clouds. Afternoon walkthrough of a 1935 orthodox tea factory and artisanal tastings.'
        },
        {
          day: 3,
          title: 'Eravikulam Wildlife & Shola Forest Trek',
          desc: 'Morning safari in Eravikulam National Park spotting wild Nilgiri tahr. Afternoon walk through high-altitude shola grasslands and organic cardamom valleys.'
        },
        {
          day: 4,
          title: 'Waterfall Picnics & Farewell',
          desc: 'Gentle morning breakfast overlooking Mattupetty reservoir before scenic chauffeur transfer down the ghats.'
        }
      ]
    },
    curatedStays: [
      { name: 'Windermere Estate', type: 'Highland Planter Retreat', note: 'Set amid 60 acres of coffee and cardamom with panoramic valley balconies and handcrafted cedar furnishings.' },
      { name: 'Tall Trees Resort', type: 'Canopy Cottage Sanctuary', note: 'Nestled deep under a canopy of 600 towering preserved trees with crystal mountain stream trails.' }
    ]
  },
  {
    slug: 'thekkady',
    name: 'Thekkady',
    region: 'Cardamom Hills & Wildlife Sanctuary',
    type: 'Forest & Wildlife',
    shortDesc: 'Thekkady is a nature destination known for its spice plantations, rich wildlife, Periyar Lake, and exciting nature experiences.',
    description: 'Set in the lush foothills of the Cardamom Hills, Thekkady is India’s premier wilderness and spice sanctuary. At its heart lies the 777-square-kilometer Periyar Tiger Reserve, centered around a historic man-made lake where wild elephant herds, sambar deer, gaur, and rare birds roam undisturbed along the water’s edge. Beyond the jungle, the cool mountain air is infused with the scent of green cardamom, black pepper, clove, and cinnamon cultivated in lush multi-tiered organic plantations that have traded with the world for millennia.',
    coordinates: '9.6031°N 77.1615°E',
    elevation: '900 m – 1,800 m',
    bestSeason: 'September – April',
    nightsMin: 2,
    nightsMax: 3,
    imageUrl: '/images/destinations/thekkady.jpg',
    gallery: [
      '/images/destinations/thekkady.jpg',
      '/images/destinations/thekkady_2.jpg'
    ],
    highlights: [
      'Early morning wildlife boat cruise on Periyar Lake watching elephant herds bathe along shores',
      'Guided sensory walking tour through certified organic cardamom, cinnamon, and pepper gardens',
      'Bamboo river rafting and guided forest trek deep into the Periyar wilderness with tribal trackers',
      'Exclusive front-row attendance at a traditional Kalaripayattu ancient martial arts demonstration',
      'Highland tribal village interaction and traditional spice-infused Travancore culinary dining'
    ],
    howToReach: 'Nearest airport: Madurai Airport (IXM), 140 km (3.5 hours); or Cochin International Airport (COK), 160 km (4 hours). Chauffeured executive SUV transfers provided.',
    featured: true,
    latitude: 9.6031,
    longitude: 77.1615,
    sampleItinerary: {
      title: 'Wild Canopies & Spice Trails',
      totalNights: '2 Nights / 3 Days',
      days: [
        {
          day: 1,
          title: 'Arrival & Aromatic Spice Walk',
          desc: 'Chauffeured arrival into Thekkady\'s cool mountain air. Afternoon guided tour through an organic spice plantation followed by an authentic Kalaripayattu martial arts show.'
        },
        {
          day: 2,
          title: 'Periyar Lake Safari & Bamboo Rafting',
          desc: 'Early dawn boat cruise on Periyar Lake spotting wild elephants and native birdlife. Midday guided nature trek with native forest naturalists.'
        },
        {
          day: 3,
          title: 'Chellarkovil Viewpoint & Departure',
          desc: 'Morning visit to Chellarkovil cliff viewpoint overlooking Tamil Nadu plains before onward private chauffeur journey.'
        }
      ]
    },
    curatedStays: [
      { name: 'Spice Village (CGH Earth)', type: 'Eco-Luxury Tribal Hamlet', note: 'Modeled after indigenous Mannan tribal huts with elephant grass thatch, spice gardens, and zero-plastic ethos.' },
      { name: 'Niraamaya Retreats Cardamom Club', type: 'Boutique Plantation Villas', note: 'Luxury cottages secluded amid dense cardamom hills with open-to-sky rain showers and Ayurveda therapies.' }
    ]
  },
  {
    slug: 'alleppey',
    name: 'Alleppey',
    region: 'Vembanad Backwaters',
    type: 'Backwaters',
    shortDesc: 'Alleppey is known as the Venice of the East, famous for its tranquil backwaters and luxurious houseboat experiences.',
    description: 'Often hailed as the Venice of the East, Alleppey (Alappuzha) is the hypnotic aquatic heartland of Kerala. Here, a vast network of emerald lagoons, natural canals, and freshwater lakes intertwines with lush below-sea-level paddy fields in Kuttanad. Drifting aboard an exclusive handcrafted wooden Kettuvallam with your private captain and personal chef, experience life slowed to the soothing rhythm of lapping water, swaying coconut palms, and sunset skies mirrored in glass-flat backwaters.',
    coordinates: '9.4981°N 76.3388°E',
    elevation: 'Sea Level (-1m in Kuttanad)',
    bestSeason: 'Year-Round (Peak: October – March)',
    nightsMin: 1,
    nightsMax: 3,
    imageUrl: '/images/destinations/alleppey.jpg',
    gallery: [
      '/images/destinations/alleppey.jpg',
      '/images/destinations/alleppey_2.jpg'
    ],
    highlights: [
      'Overnight private luxury Kettuvallam houseboat charter with personal chef and starlit open deck',
      'Dawn country-boat canoe excursions slipping silently into narrow canals lined with lotus blossoms',
      'Cruising through Kuttanad, one of the world’s few farming systems operating below sea level',
      'Gourmet Malabar culinary feasts featuring fresh Karimeen (pearl spot), king prawns, and tender coconut curries',
      'Sunset champagne toast while anchored in the secluded stillness of Vembanad Lake'
    ],
    howToReach: 'Nearest airport: Cochin International Airport (COK), approx. 85 km (2 hours scenic drive). Alleppey Railway Station is located 4 km from boat jetty.',
    featured: true,
    latitude: 9.4981,
    longitude: 76.3388,
    sampleItinerary: {
      title: 'Silent Waters & Kettuvallam Splendour',
      totalNights: '2 Nights / 3 Days',
      days: [
        {
          day: 1,
          title: 'Boarding Your Floating Palace',
          desc: 'VIP boarding of your private air-conditioned Kettuvallam at 12:00 noon. Welcome tender coconut, cruise through Vembanad Lake, authentic onboard 4-course lunch, and twilight anchoring.'
        },
        {
          day: 2,
          title: 'Dawn Canoe & Village Life',
          desc: 'Sunrise canoe tour through intimate canal tributaries where children paddle to school. Afternoon relaxation or transfer to a luxury lakeside heritage resort.'
        },
        {
          day: 3,
          title: 'Alleppey Beach & Coir Heritage',
          desc: 'Visit the historic Alleppey lighthouse, pier ruins, and traditional coir weaving villages before onward luxury chauffeur transit.'
        }
      ]
    },
    curatedStays: [
      { name: 'Escora Private Houseboat Charter', type: 'Bespoke Wooden Kettuvallam', note: 'Customized luxury vessel with handcrafted jackwood staterooms, sun observation deck, and private chef.' },
      { name: 'A premium Lake Palace Resort', type: 'Private Island Sanctuary', note: 'Waterfront luxury villas secluded on an exclusive island in Vembanad Lake accessible only by water taxi.' }
    ]
  },
  {
    slug: 'varkala',
    name: 'Varkala',
    region: 'South Kerala Coastline',
    type: 'Coastal',
    shortDesc: 'Varkala is a beautiful coastal destination known for its stunning cliffs, sandy beaches, seaside cafés, and exciting beach activities.',
    description: 'Dramatic, bohemian, and breathtakingly unique, Varkala is the only destination in southern India where monumental red laterite cliffs rise vertically from the Arabian Sea. The cliff-top promenade is dotted with vibrant artisan cafés, seafood grills, and open-air yoga shalas. Below, the holy golden sands of Papanasam Beach are cleansed by natural freshwater mineral springs emerging directly from ancient rock faces. From tandem paragliding soaring over ocean thermal winds to world-class surfing and meditative sunsets, Varkala radiates pure coastal magic.',
    coordinates: '8.7379°N 76.7163°E',
    elevation: 'Sea Level – 30 m Cliff',
    bestSeason: 'October – April',
    nightsMin: 2,
    nightsMax: 4,
    imageUrl: '/images/destinations/varkala.jpg',
    gallery: [
      '/images/destinations/varkala.jpg',
      '/images/destinations/varkala_2.jpg'
    ],
    highlights: [
      'Spectacular clifftop promenade walks overlooking turquoise waves and golden sunset horizons',
      'Tandem coastal paragliding soaring high above North Cliff with bird’s-eye Arabian Sea views',
      'Natural mineral spring cleansing baths flowing from laterite rocks on Papanasam Beach',
      'Sunset cliffside seafood dining with freshly caught red snapper, tiger prawns, and sea breezes',
      'Visit to the 2,000-year-old historic Janardanaswamy Temple and serene Sivagiri Mutt'
    ],
    howToReach: 'Nearest airport: Trivandrum International Airport (TRV), approx. 45 km (1 hour scenic coastal drive). Varkala Sivagiri Railway Station connects to all major trains.',
    featured: true,
    latitude: 8.7379,
    longitude: 76.7163,
    sampleItinerary: {
      title: 'Red Cliffs & Coastal Freedom',
      totalNights: '3 Nights / 4 Days',
      days: [
        {
          day: 1,
          title: 'Arrival & North Cliff Sunset',
          desc: 'Chauffeured arrival from Trivandrum. Check into your cliffside boutique villa. Evening walk along North Cliff and candlelight seafood dinner overlooking the ocean.'
        },
        {
          day: 2,
          title: 'Aerial Paragliding & Beach Yoga',
          desc: 'Morning beach yoga session under coconut palms. Afternoon tandem paragliding flight over the cliffs and relaxed swimming at Black Sand Beach.'
        },
        {
          day: 3,
          title: 'Temple Heritage & Ayurvedic Spa',
          desc: 'Morning spiritual visit to Janardanaswamy Temple followed by restorative Ayurvedic coastal massage. Sunset café hopping.'
        },
        {
          day: 4,
          title: 'Morning Surf & Departure',
          desc: 'Gentle coastal stroll and fresh fruit juice breakfast before private luxury transfer to Trivandrum Airport.'
        }
      ]
    },
    curatedStays: [
      { name: 'Elixir Cliff Beach Resort', type: 'Luxury Clifftop Suites', note: 'Perched on the quieter North Cliff with infinity pool facing direct Arabian Sea sunsets and oceanfront dining.' },
      { name: 'B’Canti Boutique Resort', type: 'Secluded Coastal Haven', note: 'Set on North Cliff with panoramic sea views, landscaped tropical gardens, and private beach steps.' }
    ]
  },
  {
    slug: 'trivandrum',
    name: 'Trivandrum',
    region: 'Capital Heritage & South Coast',
    type: 'Heritage',
    shortDesc: "Trivandrum, Kerala's capital city, is known for its historic temples and cultural attractions, while nearby Kovalam is famous for its beautiful beaches and seaside activities.",
    description: "Built upon seven gentle hills, Trivandrum (Thiruvananthapuram) is Kerala's elegant capital city where regal Travancore history meets coastal tropical beauty. Marvel at the awe-inspiring Padmanabhaswamy Temple — the world's richest sacred shrine with its grand Dravidian gopuram — and explore the exquisite 19th-century Kuthiramalika (Mansion of Horses) wood carvings. Just minutes away lies Kovalam's world-famous coastline with three golden crescent beaches separated by rocky headlands, anchored by the iconic 30-meter red-and-white striped Vizhinjam lighthouse, legendary Ayurvedic sanctuaries, and thrilling water activities.",
    coordinates: '8.5241°N 76.9366°E',
    elevation: '10 m – 35 m',
    bestSeason: 'October – March',
    nightsMin: 2,
    nightsMax: 3,
    imageUrl: '/images/destinations/trivandrum.jpg',
    gallery: [
      '/images/destinations/trivandrum.jpg',
      '/images/destinations/trivandrum_2.jpg'
    ],
    highlights: [
      'Exclusive guided heritage walk around the magnificent Sree Padmanabhaswamy Temple & Kuthiramalika Palace',
      'Panoramic 360-degree coastal views from atop the iconic 30-meter Vizhinjam Lighthouse',
      'Three golden crescent bays of Kovalam (Lighthouse, Hawah, and Samudra) for swimming and beachside leisure',
      'World-class physician-led authentic Ayurvedic therapies and coastal wellness sanctuaries',
      'Private day cruise to Poovar Island where tranquil backwaters, river, and the Arabian Sea unite'
    ],
    howToReach: 'Trivandrum International Airport (TRV) is located directly inside the city, just 15 minutes from city center and 20 minutes from Kovalam beaches. Trivandrum Central (TVC) is Kerala’s busiest rail junction.',
    featured: true,
    latitude: 8.5241,
    longitude: 76.9366,
    sampleItinerary: {
      title: 'Royal Temples & Crescent Shores',
      totalNights: '2 Nights / 3 Days',
      days: [
        {
          day: 1,
          title: 'Royal Travancore Heritage',
          desc: 'Arrival at Trivandrum Airport. Private chauffeur transfer to luxury seaside resort. Afternoon heritage walk of Padmanabhaswamy Temple complex and Napier Museum.'
        },
        {
          day: 2,
          title: 'Kovalam Bays & Lighthouse Sunset',
          desc: 'Morning beach yoga and Ayurvedic massage. Afternoon visit to the historic Vizhinjam Lighthouse and seaside café exploration.'
        },
        {
          day: 3,
          title: 'Poovar Estuary Boat Cruise',
          desc: 'Private morning motorboat cruise through mangrove estuaries at Poovar Island where river meets sea, followed by airport transfer.'
        }
      ]
    },
    curatedStays: [
      { name: 'The Leela Kovalam', type: 'Luxury Clifftop Palace Resort', note: 'Spectacular cliffhead location with panoramic sea views from every room, private beach access, and royal hospitality.' },
      { name: 'Niraamaya Retreats Surya Samudra', type: 'Heritage Wooden Cottages', note: 'Restored traditional Kerala wooden homes perched on rocky ocean promontories with renowned cliffside spa.' }
    ]
  },
  {
    slug: 'calicut',
    name: 'Calicut',
    region: 'Malabar Coast',
    type: 'Coastal',
    shortDesc: 'A beautiful coastal city known for its rich history, Malabar culture, traditional cuisine, and scenic beaches.',
    description: 'Famed across world history as the City of Spices and the legendary port where Vasco da Gama first made landfall in 1498, Calicut (Kozhikode) is the cultural and culinary heart of Malabar. Walk the historic sands of Kappad and Kozhikode Beach where centuries-old piers stretch into the Arabian Sea, explore the ancient craft of handcrafted wooden Uru dhow shipbuilding at Beypore, glide in a kayak along serene Chaliyar and Kadalundi river waterways, and surrender to the world-renowned aromas of authentic Malabar Dum Biryani, Halwa, and Suleimani chai on famous SM Street.',
    coordinates: '11.2588°N 75.7804°E',
    elevation: '1 m – 15 m',
    bestSeason: 'September – March',
    nightsMin: 1,
    nightsMax: 3,
    imageUrl: '/images/destinations/calicut.jpg',
    gallery: [
      '/images/destinations/calicut.jpg',
      '/images/destinations/calicut_2.jpg'
    ],
    highlights: [
      'Immersive kayaking along scenic riverways and pristine mangrove channels of Calicut',
      'Visiting 1,500-year-old traditional wooden Uru dhow shipbuilders at historic Beypore Port',
      'Legendary Malabar culinary trail exploring authentic Dum Biryani, banana chips, and Kozhikodan Halwa',
      'Sunset strolls along Kappad Beach where ancient spice trade routes shaped world history',
      'Birdwatching and silent canoe explorations in the Kadalundi mangrove estuary'
    ],
    howToReach: 'Calicut International Airport (CCJ) at Karipur, approx. 28 km (45 mins executive transfer). Kozhikode Railway Station (CLT) is a major A1 junction on the Southern Railway.',
    featured: true,
    latitude: 11.2588,
    longitude: 75.7804,
    sampleItinerary: {
      title: 'Malabar Flavors & Historic Coastlines',
      totalNights: '2 Nights / 3 Days',
      days: [
        {
          day: 1,
          title: 'Arrival & Culinary Exploration',
          desc: 'Arrival into Calicut. Check into your luxury coastal hotel. Afternoon walking tour of historic SM Street (Sweetmeat Street) and authentic Malabar biryani dinner.'
        },
        {
          day: 2,
          title: 'Kayaking & Beypore Heritage',
          desc: 'Morning kayaking adventure along tranquil waterways. Afternoon visit to Beypore shipbuilding yard witnessing massive wooden dhows crafted by master artisans.'
        },
        {
          day: 3,
          title: 'Kappad Beach & Spice Trails',
          desc: 'Morning visit to Kappad Beach where maritime history changed the world. Fresh seafood lunch before departure.'
        }
      ]
    },
    curatedStays: [
      { name: 'The Gateway Hotel Beach Road (Taj)', type: 'Colonial Coastal Hotel', note: 'Historic luxury property overlooking the Arabian Sea with authentic Malabar gourmet restaurants.' },
      { name: 'Kadavu Resort & Ayurveda Village', type: 'Riverfront Plantation Sanctuary', note: 'Sprawled along the serene banks of the Chaliyar River in traditional Mappila-style architecture.' }
    ]
  },
  {
    slug: 'wayanad',
    name: 'Wayanad',
    region: 'Northern Highlands',
    type: 'Highlands',
    shortDesc: 'A scenic hill destination filled with misty mountains, lush green forests, tea plantations, and beautiful waterfalls.',
    description: 'Cradled within the majestic peaks of the northern Western Ghats at an elevation of 700 to 2,100 metres, Wayanad is Kerala’s untamed mountain paradise. A land of ancient cloud forests, misty evergreen ridges, and fragrant coffee and spice estates, Wayanad holds human secrets dating back to the Neolithic age at Edakkal Caves. From the adrenaline of South India\'s longest glass skybridge cantilevered over deep ravines to the thunder of three-tier Soochipara Waterfalls and luxury treehouses hidden high in the forest canopy, Wayanad is nature at its most pristine.',
    coordinates: '11.6854°N 76.1320°E',
    elevation: '700 m – 2,100 m',
    bestSeason: 'September – May',
    nightsMin: 2,
    nightsMax: 4,
    imageUrl: '/images/destinations/wayanad.jpg',
    gallery: [
      '/images/destinations/wayanad.jpg',
      '/images/destinations/wayanad_2.jpg'
    ],
    highlights: [
      'Walking South India’s iconic suspended transparent Glass Skybridge with panoramic rainforest views',
      'Trekking through lush tea estates down to the thundering three-tier cascade of Soochipara Waterfalls',
      'Exploring prehistoric Neolithic petroglyphs and cave art inside the ancient Edakkal Caves',
      'Private guided nature safari in Wayanad Wildlife Sanctuary spotting wild Asian elephants and gaur',
      'Secluded luxury treehouse living high above emerald rainforest canopies and spice plantations'
    ],
    howToReach: 'Nearest airport: Calicut International Airport (CCJ), 85 km (2.5 hours scenic winding ghat drive with 9 hairpin bends). Calicut Railway Station is 75 km away.',
    featured: true,
    latitude: 11.6854,
    longitude: 76.1320,
    sampleItinerary: {
      title: 'Highland Rainforests & Waterfalls',
      totalNights: '3 Nights / 4 Days',
      days: [
        {
          day: 1,
          title: 'Ascent into Cloud Forests',
          desc: 'Scenic private 4x4 drive up the Thamarassery mountain pass. Check-in to your luxury treehouse or jungle villa with evening cardamom plantation walk.'
        },
        {
          day: 2,
          title: 'Glass Bridge & Soochipara Falls',
          desc: 'Morning thrill walking across the 900 Kandi Glass Bridge above misty canopies. Afternoon shaded hike down to the refreshing cascades of Soochipara Waterfalls.'
        },
        {
          day: 3,
          title: 'Neolithic Edakkal & Wildlife Safari',
          desc: 'Morning hike up Ambukuthi Hill to explore 6,000-year-old rock engravings in Edakkal Caves. Afternoon jeep safari in Muthanga Wildlife Sanctuary.'
        },
        {
          day: 4,
          title: 'Banasura Lake & Departure',
          desc: 'Morning visit to Banasura Sagar (India\'s largest earthen dam) with speedboating across island-dotted waters before chauffeured return.'
        }
      ]
    },
    curatedStays: [
      { name: 'Vythiri Resort', type: 'Canopy Treehouse Sanctuary', note: 'Luxury wooden treehouses and pool villas hidden deep inside pristine primary rainforest with natural stream.' },
      { name: 'Tranquil Resort', type: 'Heritage Plantation Bungalow', note: 'Set on a 400-acre private coffee and vanilla estate with shaded trekking trails and serene veranda dining.' }
    ]
  }
];

export function getDestinationBySlug(slug: string): DestinationDetail | undefined {
  const normalized = slug.trim().toLowerCase();
  const aliasMap: Record<string, string> = {
    'fort-kochi': 'kochi',
    'kovalam': 'trivandrum',
    'thiruvananthapuram': 'trivandrum',
    'kozhikode': 'calicut'
  };
  const targetSlug = aliasMap[normalized] || normalized;
  return KERALA_DESTINATIONS.find((d) => d.slug.toLowerCase() === targetSlug);
}
