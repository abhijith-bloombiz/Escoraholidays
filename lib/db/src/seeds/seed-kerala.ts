/**
 * Seed Kerala Destinations — populates strictly the 8 agreed destinations
 * with authentic local photography and rich travel details.
 * Also cleans up any deprecated draft destinations (Bekal, Kannur, Kumarakom, etc.)
 */
import { connectDB, disconnectDB } from "../connection";
import { DestinationModel, getNextSequence } from "../models";

const KERALA_DESTINATIONS = [
  {
    sortOrder: 1,
    name: "Kochi",
    slug: "kochi",
    region: "Ernakulam",
    type: "Heritage & Coastal",
    shortDesc: "Kochi is a beautiful coastal city known for its rich history, colonial architecture, heritage streets, and vibrant culture.",
    description: "Kochi is a beautiful coastal city known for its rich history, colonial architecture, heritage streets, and vibrant culture. Once part of the ancient Muziris spice-trade network, Fort Kochi and Mattancherry absorbed Portuguese, Dutch, and British colonial influences. Iconized by cantilevered Chinese fishing nets along Vasco da Gama Square, spice warehouses in Jew Town, and the historic 1568 Paradesi Synagogue, Kochi harmonizes centuries of maritime heritage with contemporary art and serene Arabian sea views.",
    imageUrl: "/images/destinations/kochi.jpg",
    galleryImages: JSON.stringify(["/images/destinations/kochi.jpg", "/images/destinations/kochi_2.jpg"]),
    latitude: 9.9658,
    longitude: 76.2422,
    bestSeason: "October – March",
    nightsMin: 1,
    nightsMax: 3,
    highlights: JSON.stringify([
      "Iconic cantilevered Chinese fishing nets at sunset",
      "Mattancherry Palace (Dutch Palace) and historic Ramayana murals",
      "Jew Town spice markets and the 1568 Paradesi Synagogue",
      "St. Francis Church — original burial site of Vasco da Gama",
      "Heritage walking tours through colonial Fort Kochi streets and art cafés"
    ]),
    howToReach: "Nearest airport: Cochin International Airport (COK), approx. 38 km (about 1 hour by car). Ernakulam Junction (ERS) and Ernakulam Town (ERN) railway stations are located 12 km away.",
    published: true,
  },
  {
    sortOrder: 2,
    name: "Munnar",
    slug: "munnar",
    region: "Idukki",
    type: "Hills & Plantations",
    shortDesc: "Munnar is a scenic hill station famous for its lush tea plantations, misty mountains, waterfalls, and cool climate.",
    description: "Munnar is a scenic hill station famous for its lush tea plantations, misty mountains, waterfalls, and cool climate. Perched at 1,600 metres in the Western Ghats, Munnar was the favored summer resort of the British administration in South India. Expansive carpet-like emerald tea estates, rolling fog over Anamudi Peak (the highest peak in South India), and endemic wildlife like the endangered Nilgiri Tahr create a quintessential high-altitude haven.",
    imageUrl: "/images/destinations/munnar.jpg",
    galleryImages: JSON.stringify(["/images/destinations/munnar.jpg", "/images/destinations/munnar_2.jpg"]),
    latitude: 10.0889,
    longitude: 77.0595,
    bestSeason: "September – May",
    elevation: "1,600 m",
    nightsMin: 2,
    nightsMax: 4,
    highlights: JSON.stringify([
      "Eravikulam National Park and Nilgiri Tahr sanctuary",
      "Kolukkumalai off-road jeep safari and breathtaking sunrise peak",
      "Tea museum and artisanal tea-tasting sessions in century-old estates",
      "Mattupetty Dam, Kundala Lake, and Echo Point excursions",
      "Trek through lush shola forests and scenic hillside waterfalls"
    ]),
    howToReach: "Nearest airport: Cochin International Airport (COK), approx. 110 km (3.5 hours scenic drive). Nearest railway station: Aluva (110 km).",
    published: true,
  },
  {
    sortOrder: 3,
    name: "Thekkady",
    slug: "thekkady",
    region: "Idukki",
    type: "Wildlife & Nature",
    shortDesc: "Thekkady is a nature destination known for its spice plantations, rich wildlife, Periyar Lake, and exciting nature experiences.",
    description: "Thekkady is a nature destination known for its spice plantations, rich wildlife, Periyar Lake, and exciting nature experiences. Centered around the renowned Periyar National Park and Tiger Reserve, this sanctuary is home to wild elephants, sambar deer, leopards, and rare avian species. The surrounding mist-clad slopes of Kumily are blanketed in aromatic plantations of cardamom, black pepper, nutmeg, cinnamon, and vanilla.",
    imageUrl: "/images/destinations/thekkady.jpg",
    galleryImages: JSON.stringify(["/images/destinations/thekkady.jpg", "/images/destinations/thekkady_2.jpg"]),
    latitude: 9.5916,
    longitude: 77.1600,
    bestSeason: "September – April",
    elevation: "900 – 1,200 m",
    nightsMin: 1,
    nightsMax: 3,
    highlights: JSON.stringify([
      "Scenic wildlife boat safari on Periyar Lake inside the Tiger Reserve",
      "Guided aromatic spice plantation walks with interactive botanical tastings",
      "Bamboo rafting and nature trekking through evergreen forest trails",
      "Traditional Kalaripayattu martial arts and Kathakali cultural performances",
      "Elephant junction experiences and spice market discovery in Kumily"
    ]),
    howToReach: "Nearest airport: Cochin International Airport (COK), 145 km, or Madurai Airport (IXM), 140 km. Nearest railway station: Kottayam (110 km).",
    published: true,
  },
  {
    sortOrder: 4,
    name: "Alleppey",
    slug: "alleppey",
    region: "Alappuzha",
    type: "Backwaters",
    shortDesc: "Alleppey is known as the Venice of the East, famous for its tranquil backwaters and luxurious houseboat experiences.",
    description: "Alleppey is known as the Venice of the East, famous for its tranquil backwaters and luxurious houseboat experiences. Here, a vast network of emerald lagoons, natural canals, and freshwater lakes intertwines with lush below-sea-level paddy fields in Kuttanad. Drifting aboard an exclusive handcrafted wooden Kettuvallam with your private captain and personal chef, experience life slowed to the soothing rhythm of lapping water, swaying coconut palms, and sunset skies mirrored in glass-flat backwaters.",
    imageUrl: "/images/destinations/alleppey.jpg",
    galleryImages: JSON.stringify(["/images/destinations/alleppey.jpg", "/images/destinations/alleppey_2.jpg"]),
    latitude: 9.4981,
    longitude: 76.3388,
    bestSeason: "Year-Round (Peak: October – March)",
    elevation: "Sea Level (-1m in Kuttanad)",
    nightsMin: 1,
    nightsMax: 3,
    highlights: JSON.stringify([
      "Overnight private luxury Kettuvallam houseboat charter with personal chef and starlit open deck",
      "Dawn country-boat canoe excursions slipping silently into narrow canals lined with lotus blossoms",
      "Cruising through Kuttanad, one of the world’s few farming systems operating below sea level",
      "Gourmet Malabar culinary feasts featuring fresh Karimeen (pearl spot), king prawns, and tender coconut curries",
      "Sunset champagne toast while anchored in the secluded stillness of Vembanad Lake"
    ]),
    howToReach: "Nearest airport: Cochin International Airport (COK), approx. 85 km (2 hours scenic drive). Alleppey Railway Station is located 4 km from boat jetty.",
    published: true,
  },
  {
    sortOrder: 5,
    name: "Varkala",
    slug: "varkala",
    region: "Thiruvananthapuram",
    type: "Coastal & Cliffs",
    shortDesc: "Varkala is a beautiful coastal destination known for its stunning cliffs, sandy beaches, seaside cafés, and exciting beach activities.",
    description: "Varkala is a beautiful coastal destination known for its stunning cliffs, sandy beaches, seaside cafés, and exciting beach activities. Unique along the Indian peninsula, glowing red laterite geological formations plunge dramatically into the Arabian Sea along the North Cliff promenade. Beneath lies the pristine golden strand of Papanasam Beach, famed for its therapeutic mineral springs, soothing ocean breeze, panoramic sunsets, and exhilarating ocean paragliding.",
    imageUrl: "/images/destinations/varkala.jpg",
    galleryImages: JSON.stringify(["/images/destinations/varkala.jpg", "/images/destinations/varkala_2.jpg"]),
    latitude: 8.7379,
    longitude: 76.7163,
    bestSeason: "October – March",
    nightsMin: 2,
    nightsMax: 4,
    highlights: JSON.stringify([
      "Tandem paragliding over dramatic red laterite cliffs and azure coastline",
      "North Cliff sunset promenade lined with bohemian cafés, yoga shalas, and live music",
      "Papanasam Beach and natural holy mineral water springs",
      "2,000-year-old historic Janardanaswamy Temple sanctuary",
      "Surf sessions, paddleboarding, and day trips to Kappil Lake backwater estuary"
    ]),
    howToReach: "Nearest airport: Trivandrum International Airport (TRV), approx. 45 km (1 hour drive). Varkala Sivagiri Railway Station is directly connected.",
    published: true,
  },
  {
    sortOrder: 6,
    name: "Trivandrum",
    slug: "trivandrum",
    region: "Thiruvananthapuram",
    type: "Heritage & Beach",
    shortDesc: "Trivandrum, Kerala's capital city, is known for its historic temples and cultural attractions, while nearby Kovalam is famous for its beautiful beaches and seaside activities.",
    description: "Trivandrum, Kerala's capital city, is known for its historic temples and cultural attractions, while nearby Kovalam is famous for its beautiful beaches and seaside activities. Anchored by the majestic Sree Padmanabhaswamy Temple, the world's richest sacred temple, Trivandrum showcases royal Travancore heritage, classical museums, and traditional arts. Just 15 km south, Kovalam features iconic crescent beaches sheltered by rocky headlands and the historic 30-metre red-and-white Vizhinjam Lighthouse.",
    imageUrl: "/images/destinations/trivandrum.jpg",
    galleryImages: JSON.stringify(["/images/destinations/trivandrum.jpg", "/images/destinations/trivandrum_2.jpg"]),
    latitude: 8.5241,
    longitude: 76.9366,
    bestSeason: "September – March",
    nightsMin: 2,
    nightsMax: 3,
    highlights: JSON.stringify([
      "Architectural marvel of Sree Padmanabhaswamy Temple and royal Kuthiramalika Palace",
      "Vizhinjam Lighthouse climb for 360-degree views of Kovalam's three crescent bays",
      "Authentic seaside Ayurvedic panchakarma therapies and ocean meditation",
      "Napier Museum, Kanakakkunnu Palace, and Sri Chitra Art Gallery",
      "Poovar Island estuary boat cruise where river, backwaters, and sea converge"
    ]),
    howToReach: "Trivandrum International Airport (TRV) is located 6 km from the city center. Trivandrum Central (TVC) is a premier rail gateway.",
    published: true,
  },
  {
    sortOrder: 7,
    name: "Calicut",
    slug: "calicut",
    region: "Kozhikode",
    type: "Malabar Heritage & Culinary",
    shortDesc: "A beautiful coastal city known for its rich history, Malabar culture, traditional cuisine, and scenic beaches.",
    description: "A beautiful coastal city known for its rich history, Malabar culture, traditional cuisine, and scenic beaches. Kozhikode (Calicut) has welcomed travelers since Vasco da Gama first landed at Kappad Beach in 1498. Recognized globally as UNESCO's City of Literature, Calicut is celebrated for its centuries-old spice trade, legendary culinary heritage featuring world-famous Dum Biryani and sweet Kozhikodan Halwa, bustling Sweet Meat Street (S.M. Street), and serene coastal waterways.",
    imageUrl: "/images/destinations/calicut.jpg",
    galleryImages: JSON.stringify(["/images/destinations/calicut.jpg", "/images/destinations/calicut_2.jpg"]),
    latitude: 11.2588,
    longitude: 75.7804,
    bestSeason: "October – March",
    nightsMin: 1,
    nightsMax: 3,
    highlights: JSON.stringify([
      "Historic Kappad Beach where Vasco da Gama landed in 1498",
      "Culinary exploration of authentic Malabar biryani, seafood roasts, and banana chips on S.M. Street",
      "Kayaking and stand-up paddling through tranquil backwaters and mangrove estuaries",
      "Kozhikode Beach with historic century-old pier ruins and evening street food",
      "Beypore port visit to witness traditional wooden dhow (Uru) shipbuilding by master craftsmen"
    ]),
    howToReach: "Calicut International Airport (CCJ) is located 28 km away with international and domestic connections. Kozhikode Main (CLT) is a primary railway junction.",
    published: true,
  },
  {
    sortOrder: 8,
    name: "Wayanad",
    slug: "wayanad",
    region: "Wayanad",
    type: "Misty Highlands & Rainforest",
    shortDesc: "A scenic hill destination filled with misty mountains, lush green forests, tea plantations, and beautiful waterfalls.",
    description: "A scenic hill destination filled with misty mountains, lush green forests, tea plantations, and beautiful waterfalls. Situated high on the Deccan plateau, Wayanad is part of the Nilgiri Biosphere Reserve. From prehistoric petroglyphs at Edakkal Caves to thrilling treks across the transparent Wayanad Glass Bridge and the roaring multi-tiered Soochipara Waterfalls, Wayanad combines ancient tribal wilderness with eco-luxury retreats nestled within coffee and cardamom estates.",
    imageUrl: "/images/destinations/wayanad.jpg",
    galleryImages: JSON.stringify(["/images/destinations/wayanad.jpg", "/images/destinations/wayanad_2.jpg"]),
    latitude: 11.6854,
    longitude: 76.1320,
    bestSeason: "September – May",
    elevation: "700 – 2,100 m",
    nightsMin: 2,
    nightsMax: 4,
    highlights: JSON.stringify([
      "Walk the transparent 100-foot Wayanad Glass Bridge with panoramic mountain canyon views",
      "Trek to the roaring cascades and natural jungle pools of Soochipara (Sentinel Rock) Waterfalls",
      "Explore prehistoric Neolithic petroglyphs inside the mystical Edakkal Caves",
      "Jeep safaris through Muthanga Wildlife Sanctuary to observe wild elephants and leopards",
      "Banasura Sagar Dam — India’s largest earthen dam set amidst lush island-studded reservoirs"
    ]),
    howToReach: "Nearest airport: Calicut International Airport (CCJ), approx. 85 km (2.5 hours scenic mountain drive). Nearest rail: Kozhikode (80 km).",
    published: true,
  }
];

export async function seedKerala(): Promise<boolean> {
  await connectDB();
  const approvedSlugs = KERALA_DESTINATIONS.map((d) => d.slug);

  // 1. Permanently remove unapproved or deprecated draft destinations
  const deleteResult = await DestinationModel.deleteMany({
    slug: { $nin: approvedSlugs }
  });
  if (deleteResult.deletedCount > 0) {
    console.log(`✓ Deleted ${deleteResult.deletedCount} deprecated destination(s) from database.`);
  }

  // 2. Upsert each of the 8 approved destinations
  for (const d of KERALA_DESTINATIONS) {
    const existing = await DestinationModel.findOne({ slug: d.slug });
    if (!existing) {
      const id = await getNextSequence("destinations");
      await DestinationModel.create({ ...d, id });
      console.log(`✓ Created destination: ${d.name} (sortOrder: ${d.sortOrder})`);
    } else {
      await DestinationModel.updateOne(
        { slug: d.slug },
        {
          $set: {
            name: d.name,
            sortOrder: d.sortOrder,
            region: d.region,
            type: d.type,
            shortDesc: d.shortDesc,
            description: d.description,
            imageUrl: d.imageUrl,
            galleryImages: d.galleryImages,
            highlights: d.highlights,
            howToReach: d.howToReach,
            bestSeason: d.bestSeason,
            elevation: d.elevation,
            nightsMin: d.nightsMin,
            nightsMax: d.nightsMax,
            published: true,
            updatedAt: new Date(),
          }
        }
      );
      console.log(`✓ Updated destination: ${d.name} (sortOrder: ${d.sortOrder})`);
    }
  }

  console.log(`✓ Kerala destinations successfully synced (total 8 destinations).`);
  return true;
}

const scriptPath = process.argv[1]?.replace(/\\/g, "/") ?? "";
if (scriptPath.endsWith("seed-kerala.ts")) {
  seedKerala()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
