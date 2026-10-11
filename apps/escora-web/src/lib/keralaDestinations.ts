import varkalaBadge from "@assets/escora/destinations/varkala.jpg";
import wayanadBadge from "@assets/escora/destinations/wayanad.jpg";
import alleppeyBadge from "@assets/escora/destinations/alleppey.jpg";
import kannurBadge from "@assets/escora/destinations/kannur.jpg";
import munnarBadge from "@assets/escora/destinations/munnar.jpg";
import fortKochiBadge from "@assets/escora/destinations/fort-kochi.jpg";
import thekkadyBadge from "@assets/escora/destinations/thekkady.jpg";
import kovalamBadge from "@assets/escora/destinations/kovalam.jpg";
import kumarakomBadge from "@assets/escora/destinations/kumarakom.jpg";
import bekalBadge from "@assets/escora/destinations/bekal.jpg";

/**
 * Locally hosted cover images — used in preference to any remote `imageUrl`
 * since hotlinked stock photo URLs (Unsplash IDs) can 404 over time. Every
 * destination in KERALA_DESTINATIONS has one of these.
 */
export const DESTINATION_BADGES: Record<string, string> = {
  varkala: varkalaBadge,
  wayanad: wayanadBadge,
  alleppey: alleppeyBadge,
  kannur: kannurBadge,
  munnar: munnarBadge,
  "fort-kochi": fortKochiBadge,
  thekkady: thekkadyBadge,
  kovalam: kovalamBadge,
  kumarakom: kumarakomBadge,
  bekal: bekalBadge,
};

export interface KeralaDestination {
  id: number;
  name: string;
  slug: string;
  region: string;
  type: string;
  shortDesc: string;
  description: string;
  imageUrl: string;
  bestSeason: string;
  elevation?: string;
  nightsMin: number;
  nightsMax: number;
  highlights: string[];
  howToReach: string;
  published: true;
}

/**
 * Fallback destination content — used on the public site when the API has no
 * data yet (fresh install) or is unreachable. Mirrors the shape seeded into
 * the database by seed-kerala-destinations.ts, so the UI looks identical
 * whether the content comes from the API or this fallback.
 */
export const KERALA_DESTINATIONS: KeralaDestination[] = [
  {
    id: 1,
    name: "Varkala",
    slug: "varkala",
    region: "Thiruvananthapuram",
    type: "Coastal",
    shortDesc: "Kerala's only clifftop beach town — red laterite cliffs above the Arabian Sea, cafés and yoga shalas along the edge.",
    description: "Varkala's defining feature is its unique geology — the only place along Kerala's coastline where cliffs meet the sea directly, creating a dramatic natural promenade known as the North Cliff. Beneath the cliffs, Papanasam Beach (\"sins-destroying\") draws pilgrims who believe a ritual dip here brings absolution, anchored by the 2,000-year-old Sree Janardanaswamy Temple and the hillside Sivagiri Mutt, an ashram founded in honour of social reformer Sree Narayana Guru. Natural mineral springs near the beach are considered medicinally significant. Since the 1980s, Varkala has evolved into a bohemian-to-boutique destination with yoga retreats, Ayurvedic spas and clifftop dining, while retaining a quieter, more spiritual character than Kerala's other beach towns.",
    imageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=2000&q=80",
    bestSeason: "October – March",
    nightsMin: 2,
    nightsMax: 3,
    highlights: [
      "North Cliff promenade — cafés, shops and sunset viewpoints along the cliff edge",
      "Papanasam Beach — ritual dip beneath the cliffs, one of Kerala's few pilgrimage beaches",
      "Sree Janardanaswamy Temple — a 2,000-year-old Vishnu temple",
      "Sivagiri Mutt — hillside ashram of social reformer Sree Narayana Guru",
      "Clifftop Ayurvedic spas and massage centres",
      "Kappil Lake backwater boat rides and Anjengo (Anchuthengu) Fort nearby",
    ],
    howToReach: "Nearest airport: Trivandrum International Airport (TRV), approx. 45–50 km (about 1 hour by road). Varkala also has its own railway station on the Thiruvananthapuram–Kochi line.",
    published: true,
  },
  {
    id: 2,
    name: "Wayanad",
    slug: "wayanad",
    region: "Wayanad",
    type: "Forest",
    shortDesc: "Misty highland forests, coffee estates, Edakkal's prehistoric caves and Chembra's heart-shaped lake.",
    description: "Sitting on the Deccan plateau at elevations between 700–2,100 metres, Wayanad is characterised by evergreen and deciduous forests, bamboo thickets and terraced plantations of coffee, tea, pepper and cardamom. The Edakkal Caves contain Neolithic-era petroglyphs dated to around 6000 BCE, among the oldest evidence of human habitation in South India. The district's wildlife sanctuaries — Muthanga and Tholpetty — form part of the larger Nilgiri Biosphere Reserve, contiguous with Bandipur and Nagarhole, hosting elephants, tigers and gaur. Chembra Peak, the district's highest point, is famed for its heart-shaped Hridaya Saras lake, reached via a moderate trek, while the man-made Banasura Sagar Dam — the largest earthen dam in India — creates a reservoir dotted with small islands amid the hills.",
    imageUrl: "https://images.unsplash.com/photo-1691342538271-5a97b7c1c089?auto=format&fit=crop&w=2000&q=80",
    bestSeason: "October – May",
    elevation: "700–2,100 m",
    nightsMin: 3,
    nightsMax: 4,
    highlights: [
      "Edakkal Caves — prehistoric petroglyphs (~6000 BCE) reached via a rock-cut trail near Ambukuthi Hill",
      "Chembra Peak trek to the heart-shaped Hridaya Saras lake (permit required, daily trekkers limited)",
      "Banasura Sagar Dam — India's largest earthen dam, with boating and island views",
      "Muthanga Wildlife Sanctuary — jeep safaris through deciduous forest",
      "Tholpetty Wildlife Sanctuary — a quieter safari zone within the Nilgiri Biosphere Reserve",
      "Pookode Lake, Soochipara and Meenmutty waterfalls, and working spice/coffee estate visits",
    ],
    howToReach: "Nearest airports: Kozhikode (Calicut) International Airport (CCJ), approx. 90 km, or Kannur International Airport (CNN), approx. 70–90 km depending on entry point. No railway station within the district — road transfer from either airport.",
    published: true,
  },
  {
    id: 3,
    name: "Alleppey",
    slug: "alleppey",
    region: "Alappuzha",
    type: "Backwaters",
    shortDesc: "The 'Venice of the East' — kettuvallam houseboats drifting through Kuttanad's below-sea-level paddy fields.",
    description: "Alappuzha's backwater network is fed by the Vembanad Lake system and threads through the Kuttanad region, one of the few places in the world where farming happens below sea level, reclaimed from the lake for rice cultivation. The town itself was planned in the 18th century by Dewan Raja Kesavadas with a grid of canals for the spice trade, once earning it the nickname \"Venice of the East.\" Multi-day cruises aboard converted kettuvallam rice barges are the region's signature experience, gliding past coconut groves, toddy shops and village life along narrow canals. The Nehru Trophy Snake Boat Race, held on Punnamada Lake every August, features chundan vallams over 100 feet long crewed by up to 100 rowers, while Alappuzha Beach and its 19th-century pier offer a quieter coastal counterpoint to the inland waterways.",
    imageUrl: "https://images.unsplash.com/photo-1785932413547-cdd1159e1f1e?auto=format&fit=crop&w=2000&q=80",
    bestSeason: "November – February",
    nightsMin: 1,
    nightsMax: 2,
    highlights: [
      "Overnight or day kettuvallam houseboat cruise through Vembanad Lake and Kuttanad's canals",
      "Nehru Trophy Snake Boat Race on Punnamada Lake (second Saturday of August)",
      "Kuttanad — the 'rice bowl of Kerala', with below-sea-level paddy-field villages",
      "Alappuzha Beach and its historic 19th-century pier",
      "Marari Beach nearby for a quieter coastal stay",
      "Krishnapuram Palace murals and St. Mary's Forane Church",
    ],
    howToReach: "Nearest airport: Cochin International Airport (COK), approx. 85 km (about 1.5–2 hours). Alappuzha also has a well-connected railway station.",
    published: true,
  },
  {
    id: 4,
    name: "Kannur",
    slug: "kannur",
    region: "Kannur",
    type: "Coastal",
    shortDesc: "Malabar's untouristed coast — Muzhappilangad's drive-in beach, Thalassery's forts, and the ritual fire of Theyyam.",
    description: "Historically a major Malabar Coast spice-trading port, Kannur retains layers of colonial history through St. Angelo Fort (built by the Portuguese in 1505) and the nearby handloom town of Thalassery, famous for its own fort, a distinctive Malabar biryani and centuries-old weaving traditions. The district is the epicentre of Theyyam, a ritual performance art in which performers undergo elaborate transformation through costume, face-painting and trance-like dance to embody deities — usually performed in temple groves between November and May. The Parassinikadavu Sri Muthappan Temple is unusual in staging Theyyam performances almost daily, not just seasonally. Muzhappilangad is India's only true drive-in beach, a 4-km stretch of firm sand where vehicles can be driven along the shore, and the wider district's plantation-covered hills and river estuaries — like Dharmadam Island — round out a coast that rewards travellers who go slow.",
    imageUrl: "https://images.unsplash.com/photo-1741243781186-fee59344ea4f?auto=format&fit=crop&w=2000&q=80",
    bestSeason: "November – May",
    nightsMin: 2,
    nightsMax: 3,
    highlights: [
      "Muzhappilangad Drive-in Beach — 4 km of drivable sand, India's longest such beach",
      "Theyyam ritual performances at village temple groves (season: November–May)",
      "Parassinikadavu Sri Muthappan Temple — near-daily Theyyam rituals",
      "St. Angelo Fort (1505, Portuguese-built) and Thalassery Fort",
      "Thalassery handloom weaving centres and its famous biryani",
      "Dharmadam Island and sunset at Payyambalam Beach",
    ],
    howToReach: "Nearest airport: Kannur International Airport (CNN), approx. 25–30 km. Kannur also sits on the main Konkan/west-coast railway line with frequent connections.",
    published: true,
  },
  {
    id: 5,
    name: "Munnar",
    slug: "munnar",
    region: "Idukki",
    type: "Hills",
    shortDesc: "Endless tea estates across the Western Ghats, Eravikulam's Nilgiri tahr and Anamudi, South India's highest peak.",
    description: "Sitting at the confluence of three mountain streams, Munnar was developed as a hill station and tea-growing centre by British planters in the late 19th century, and its rolling plantations — many still operated by Tata-owned Kannan Devan Hills Plantations — remain the region's visual signature. Eravikulam National Park, just outside town, protects one of the largest surviving populations of the endangered Nilgiri tahr and encompasses Anamudi peak (2,695 m), the highest point in India outside the Himalayan range (the park closes for several weeks around February–March for tahr calving season — worth confirming exact dates before travel). The region's cool climate supports cardamom and other spice cultivation in surrounding valleys, and beyond the plantations, Munnar offers viewpoints, dams and a Tea Museum documenting the estates' colonial-era origins.",
    imageUrl: "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?auto=format&fit=crop&w=2000&q=80",
    bestSeason: "November – May",
    elevation: "~1,600 m (Anamudi peak: 2,695 m)",
    nightsMin: 2,
    nightsMax: 3,
    highlights: [
      "Eravikulam National Park — Nilgiri tahr sightings and shuttle-accessed viewpoints",
      "Anamudi Peak trek — the highest point in South India, at 2,695 m (permit-restricted)",
      "Tea Museum and working tea-estate tours with the Kannan Devan Hills heritage story",
      "Mattupetty Dam and Kundala Lake boating",
      "Top Station viewpoint over the Western Ghats and the Tamil Nadu border",
      "Cardamom and spice plantation visits around Chinnakanal",
    ],
    howToReach: "Nearest airport: Cochin International Airport (COK), approx. 110–120 km (about 3.5 hours by road). No railway station within Munnar — nearest is Aluva, near Kochi.",
    published: true,
  },
  {
    id: 6,
    name: "Fort Kochi",
    slug: "fort-kochi",
    region: "Ernakulam",
    type: "Heritage",
    shortDesc: "Chinese fishing nets, Jew Town's 1568 synagogue and the Dutch Palace's centuries-old murals.",
    description: "Once part of the ancient Muziris spice-trade network, Fort Kochi and adjoining Mattancherry absorbed centuries of foreign influence, visible in the Portuguese-built St. Francis Church (where Vasco da Gama was originally buried), Dutch-era warehouses and British colonial bungalows lining quiet lanes. The Chinese fishing nets (cheena vala) along the shore, introduced by traders from the court of Kublai Khan in the 14th century, remain in daily operational use and are among Kerala's most photographed sights. Mattancherry Palace — also called the Dutch Palace — houses murals depicting the Ramayana and portraits of Kochi's royal family, while adjacent Jew Town, centred on the 1568 Paradesi Synagogue, preserves the legacy of Kochi's historic Paradesi Jewish community amid antique shops and spice warehouses. Every two years, the Kochi-Muziris Biennale — India's largest contemporary art exhibition — transforms heritage buildings like Aspinwall House into gallery spaces.",
    imageUrl: "https://images.unsplash.com/photo-1783068146008-022c4472de73?auto=format&fit=crop&w=2000&q=80",
    bestSeason: "October – March",
    nightsMin: 1,
    nightsMax: 2,
    highlights: [
      "Chinese fishing nets at the harbour mouth — best photographed at sunset",
      "Mattancherry Palace (Dutch Palace) — 16th-century murals and royal portraits",
      "Jew Town and the Paradesi Synagogue, built in 1568",
      "St. Francis Church (1503) — Vasco da Gama's original burial site",
      "Kochi-Muziris Biennale at Aspinwall House and other heritage venues (biennial, Dec–Mar)",
      "Kathakali and Kalaripayattu performance venues, and Santa Cruz Basilica",
    ],
    howToReach: "Nearest airport: Cochin International Airport (COK), approx. 35–45 km (about 1 hour). Ernakulam Junction and Ernakulam Town railway stations are both a short ferry or drive away.",
    published: true,
  },
  {
    id: 7,
    name: "Thekkady",
    slug: "thekkady",
    region: "Idukki",
    type: "Wildlife",
    shortDesc: "Periyar Tiger Reserve's lake safaris, ringed by cardamom, pepper and clove plantations.",
    description: "Periyar Tiger Reserve, established around Periyar Lake — formed by a 19th-century British-built dam — spans evergreen and deciduous forest across 777 sq km and is one of India's most visited wildlife reserves, though tiger sightings remain rare; elephants, sambar deer and langurs are more commonly seen. Boat safaris on the lake, run several times daily by the forest department, are the signature wildlife-viewing activity. The surrounding hills, part of Kerala's historic \"High Range,\" are covered in plantations of cardamom, black pepper, cinnamon, clove, nutmeg and vanilla, and Thekkady is considered one of the birthplaces of Kerala's spice-trade reputation — making it a hybrid wildlife-and-agritourism destination with trekking, bamboo rafting and working plantation tours alongside the reserve itself.",
    imageUrl: "https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?auto=format&fit=crop&w=2000&q=80",
    bestSeason: "October – March",
    elevation: "~900–1,100 m",
    nightsMin: 2,
    nightsMax: 2,
    highlights: [
      "Periyar Lake boat safari — forest-department run, several departures daily",
      "Spice plantation tours — cardamom, pepper, clove and vanilla, with tasting and processing demos",
      "Guided nature treks and bamboo rafting through the forest department's eco-tourism programmes",
      "Periyar Tiger Trail — multi-day guided trekking (permit-based)",
      "Elephant interaction and safari experiences near the reserve",
      "Kumily town spice markets and Ayurvedic centres",
    ],
    howToReach: "Nearest major airport: Cochin International Airport (COK), approx. 145 km; Madurai Airport (Tamil Nadu) is closer at approx. 114 km. No railway station in Thekkady — nearest is Kottayam.",
    published: true,
  },
  {
    id: 8,
    name: "Kovalam",
    slug: "kovalam",
    region: "Thiruvananthapuram",
    type: "Coastal",
    shortDesc: "Kerala's original beach resort — three crescent coves anchored by the 30-metre Vizhinjam lighthouse.",
    description: "Kovalam's coastline is shaped into three distinct beaches — Lighthouse Beach, Hawah Beach and Samudra Beach — divided by rocky headlands, each with a different character. Lighthouse Beach takes its name from the 30-metre Vizhinjam lighthouse on its southern promontory, climbable via 142 steps for panoramic coastal views. Hawah Beach, historically known as \"Eve's Beach\" from its 1970s hippie-era reputation, is quieter and less commercial, while Samudra Beach to the north is the largest and least crowded, favoured by locals and the luxury resorts along its shore. Kovalam has drawn international visitors since the 1930s and holds a long-established reputation as a centre for authentic Ayurvedic treatment and panchakarma therapy, balancing beach-town energy with genuine wellness tourism.",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80",
    bestSeason: "November – March",
    nightsMin: 2,
    nightsMax: 2,
    highlights: [
      "Vizhinjam Lighthouse — climb 142 steps for a panoramic coastal view",
      "Lighthouse Beach — promenade, cafés and water sports",
      "Hawah Beach — a quieter, less commercial stretch of sand",
      "Samudra Beach — the largest cove, favoured by locals and resort guests",
      "Ayurvedic spa and panchakarma treatment centres",
      "Day trips to Vizhinjam fishing harbour and the Poovar backwaters",
    ],
    howToReach: "Nearest airport: Trivandrum International Airport (TRV), approx. 13–16 km (about 30 minutes) — one of the shortest airport transfers of any Kerala destination.",
    published: true,
  },
  {
    id: 9,
    name: "Kumarakom",
    slug: "kumarakom",
    region: "Kottayam",
    type: "Backwaters",
    shortDesc: "A quieter Vembanad Lake shore — a 14-acre bird sanctuary and lake-facing luxury resorts.",
    description: "Set within the Vembanad Lake ecosystem — the longest lake in India — Kumarakom is defined by a network of canals, paddy fields, mangroves and coconut groves that create a lush, water-woven landscape. The Kumarakom Bird Sanctuary, a 14-acre reserve established by Kerala Tourism, protects mangrove and wetland habitat frequented by cormorants, darters and herons, plus migratory species including Siberian cranes, with peak breeding season from June to August. Pathiramanal, a small island accessible only by boat within Vembanad Lake, is a haven for rare migratory birds and a popular short-cruise destination. Unlike Alappuzha's overnight houseboat culture, Kumarakom has developed as a luxury resort destination, with high-end properties built directly on the lake — often with private canals or floating cottages — for travellers seeking a more secluded backwater experience.",
    imageUrl: "https://images.unsplash.com/photo-1715785849770-22374ff8bdfb?auto=format&fit=crop&w=2000&q=80",
    bestSeason: "November – February",
    nightsMin: 1,
    nightsMax: 2,
    highlights: [
      "Kumarakom Bird Sanctuary — mangrove walking trails, peak birding June–August",
      "Vembanad Lake sunset cruise or canoe tour through backwater canals",
      "Pathiramanal Island — a boat-only excursion for rare migratory birds",
      "Luxury lake-resort stays with private canal or floating-cottage access",
      "Ayurvedic wellness treatments at resort spas",
      "Local toddy-tapping and coir-making village demonstrations",
    ],
    howToReach: "Nearest airport: Cochin International Airport (COK), approx. 75–90 km (about 1.5–2 hours). Kottayam railway station is the closest rail link.",
    published: true,
  },
  {
    id: 10,
    name: "Bekal",
    slug: "bekal",
    region: "Kasaragod",
    type: "Coastal",
    shortDesc: "Kerala's largest fort — a 17th-century laterite stronghold above unspoiled northern beaches.",
    description: "Bekal Fort, built around 1650 in a distinctive keyhole/polygonal shape from laterite stone, is the largest fort in Kerala and one of the best-preserved on the Malabar coast, with ramparts, an observation tower and tunnels offering sweeping views of the Arabian Sea. The fort complex sits within Bekal Fort Beach Park, combining the historic structure with a landscaped beachfront. Nearby Kappil Beach, about 6 km away, is a scenic spot where a freshwater lagoon meets the sea, with the Kodi Cliff viewpoint above offering panoramic coastal views. The wider Kasaragod district — Kerala's northernmost — is dotted with additional forts reflecting a layered history of regional dynasties, plus the twin Anandashram meditation caves cut into a nearby hillock, and remains less developed for tourism than southern Kerala, giving it an unspoiled character.",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80",
    bestSeason: "October – March",
    nightsMin: 1,
    nightsMax: 2,
    highlights: [
      "Bekal Fort — a 17th-century laterite fort with ramparts and a sea-view observation tower",
      "Bekal Fort Beach Park — landscaped beachfront adjoining the fort",
      "Kappil Beach and Kodi Cliff viewpoint — lagoon-meets-sea scenery, about 6 km away",
      "Chandragiri Fort and river boat rides nearby",
      "Anandashram meditation caves — a heritage and spiritual site",
      "Valiyaparamba backwaters houseboat cruise",
    ],
    howToReach: "Nearest airport: Kannur International Airport (CNN), approx. 50–55 km; Mangalore International Airport (Karnataka) is a similar distance. Kanhangad and Kasaragod railway stations are both nearby.",
    published: true,
  },
];

export function findKeralaDestinationBySlug(slug: string) {
  return KERALA_DESTINATIONS.find((d) => d.slug === slug);
}

export function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/**
 * Maps a destination slug to the itinerary template (from itineraryTemplates.ts)
 * that best represents a real trip there, plus how many of that template's
 * nights are actually spent in this destination. Only destinations with a
 * template that genuinely covers them as a real stop (not a footnote) are
 * listed here — Kannur, Kumarakom and Bekal have no matching template yet.
 */
export const DESTINATION_ITINERARY_MAP: Record<string, { templateId: string; nightsHere: number }> = {
  varkala: { templateId: "varkala", nightsHere: 1 },
  wayanad: { templateId: "kozhikode-wayanad", nightsHere: 2 },
  munnar: { templateId: "kerala-classic", nightsHere: 2 },
  thekkady: { templateId: "kerala-classic", nightsHere: 1 },
  alleppey: { templateId: "kerala-classic", nightsHere: 1 },
  "fort-kochi": { templateId: "kerala-classic", nightsHere: 1 },
  kovalam: { templateId: "kerala-group-quote", nightsHere: 2 },
};
