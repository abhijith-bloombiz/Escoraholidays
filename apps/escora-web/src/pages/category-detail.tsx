import { useParams, Link } from "wouter";
import Layout from "@/components/layout/Layout";
import { useSeo } from "@/hooks/useSeo";
import honeymoonHero from "@assets/escora/collections/honeymoon-hero.jpg";
import alleppeyBackwaters from "@assets/escora/collections/alleppey-backwaters.jpeg";
import sattvicKitchen from "@assets/escora/collections/sattvic-kitchen.webp";
import natureWildlifeHero from "@assets/escora/collections/nature-wildlife-hero.jpg";
import periyarTigerReserve from "@assets/escora/collections/periyar-tiger-reserve.webp";
import mangroveEstuaries from "@assets/escora/collections/mangrove-estuaries.jpg";
import backwatersHero from "@assets/escora/collections/backwaters-hero.webp";
import thrissurPooram from "@assets/escora/collections/thrissur-pooram.webp";
import varkalaCliffs from "@assets/escora/collections/varkala-cliffs.jpeg";
import panchakarma from "@assets/escora/collections/panchakarma.jpg";
import nelliyampathyHills from "@assets/escora/collections/nelliyampathy-hills.avif";
import malabarSpiceCoast from "@assets/escora/collections/malabar-spice-coast.jpg";
import padmanabhapuramPalace from "@assets/escora/collections/padmanabhapuram-palace.jpg";
import payyambalamDrivingBeach from "@assets/escora/collections/payyambalam-driving-beach.jpg";
import fortKochiHeritage from "@assets/escora/collections/fort-kochi-heritage.jpg";
import wayanadForestStay from "@assets/escora/collections/wayanad-forest-stay.jpeg";
import munnarTeaEstate from "@assets/escora/collections/munnar-tea-estate.jpeg";
import kovalamBeach from "@assets/escora/collections/kovalam-beach.jpeg";
import hillStationGeneric from "@assets/escora/collections/hill-station-generic.jpeg";
import vagamonMeadowsRainy from "@assets/escora/collections/vagamon-meadows-rainy.jpeg";
import wayanadChuram from "@assets/escora/collections/wayanad-churam.jpeg";
import kuruvaIsland from "@assets/escora/collections/kuruva-island.jpeg";
import alleppeyLagoonHouseboat from "@assets/escora/collections/alleppey-lagoon-houseboat.jpeg";
import bekalFort from "@assets/escora/collections/bekal-fort.jpeg";

interface CategoryData {
  label: string;
  tagline: string;
  heroImg: string;
  intro: string;
  inclusions: string[];
  highlights: { title: string; desc: string; img: string }[];
  priceFrom: string;
  priceLabel: string;
  duration: string;
}

const CATEGORIES: Record<string, CategoryData> = {
  honeymoon: {
    label: "Honeymoon",
    tagline: "Where every moment is composed for two",
    heroImg: honeymoonHero,
    intro: "Kerala offers the most romantic backdrop in India — private houseboats drifting through silent lagoons, heritage villas on mist-covered hillsides, and candlelit dinners on your own stretch of shore. Every Escora honeymoon is crafted from scratch: no package tours, no shared itineraries.",
    inclusions: [
      "Private luxury kettuvallam (houseboat) with personal chef",
      "Couples' Ayurveda rituals — Abhyanga, Shirodhara, Kizhi",
      "Candlelit dinner on a private rice-barge or cliff terrace",
      "Vintage car transfers between destinations",
      "Heritage manor or boutique villa accommodation throughout",
      "Sunset cruise on Vembanad Lake or Ashtamudi backwaters",
      "Personalised welcome — rose petals, champagne, fresh florals",
      "24-hour Escora concierge throughout your journey",
    ],
    highlights: [
      { title: "Alleppey Backwaters", desc: "Three days on a private kettuvallam, drifting through rice paddies and palm-fringed canals.", img: alleppeyBackwaters },
      { title: "Fort Kochi Nights", desc: "Colonial heritage, Portuguese architecture and waterfront dining in Kerala's most storied city.", img: "https://images.unsplash.com/photo-1605955794720-651b9ae7f5e7?auto=format&fit=crop&w=800&q=80" },
      { title: "Varkala Cliffs", desc: "Clifftop yoga, black-sand beaches and seafood at sunset — Kerala's most dramatic coastline.", img: varkalaCliffs },
      { title: "Wayanad Forest Stay", desc: "A private forest cottage on a foggy, mist-laced hillside — pure romance under the canopy.", img: wayanadForestStay },
    ],
    priceFrom: "₹6,99,000",
    priceLabel: "per couple",
    duration: "5–10 nights",
  },
  "health-wellness": {
    label: "Health & Wellness",
    tagline: "Ancient healing, physician-led and deeply restorative",
    heroImg: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=2000&q=80",
    intro: "Kerala is the birthplace of Ayurveda. Escora's wellness programmes are designed by resident physicians — not spa menus — combining authentic panchakarma, yoga and naturopathy in properties that are themselves places of healing. Slow down. Go deep.",
    inclusions: [
      "Full physician consultation and personalised health assessment",
      "Daily Ayurvedic treatments — Abhyanga, Shirodhara, Navara Kizhi",
      "Authentic panchakarma (for programmes of 14 nights or more)",
      "Twice-daily yoga and pranayama with resident teacher",
      "Therapeutic vegetarian and sattvic cuisine",
      "Meditation and breathwork sessions",
      "Herbal supplements and take-home wellness kit",
      "Follow-up physician consultation 30 days after departure",
    ],
    highlights: [
      { title: "Panchakarma", desc: "The complete Ayurvedic detox — five-stage purification under daily physician supervision.", img: panchakarma },
      { title: "Yoga & Pranayama", desc: "Morning asana and breathwork on the banks of Vembanad Lake as the mist lifts.", img: "https://images.unsplash.com/photo-1573590330099-d6c7355ec595?auto=format&fit=crop&w=800&q=80" },
      { title: "Sattvic Kitchen", desc: "Farm-to-table vegetarian cuisine cooked with medicinal herbs and traditional spices.", img: sattvicKitchen },
      { title: "Guided Meditation", desc: "Silent sitting and breathwork led by trained meditation teachers — a daily practice to still the mind amid Kerala's calm.", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRb7O1H_W68NztFNaogjUGvI5gbOjwfKA_aib7dHmY2XiE9LxjsmFvgXNjD&s=10" },
    ],
    priceFrom: "₹8,200",
    priceLabel: "per night",
    duration: "7–21 nights",
  },
  "nature-wildlife": {
    label: "Nature & Wildlife",
    tagline: "Into Kerala's ancient forests and living ecosystems",
    heroImg: natureWildlifeHero,
    intro: "Kerala is home to some of South Asia's most biodiverse ecosystems — tiger reserves, elephant corridors, shola grasslands and mangrove estuaries. Escora's nature journeys are led by field naturalists who have spent decades in these forests.",
    inclusions: [
      "Expert field naturalist guide for all safaris and treks",
      "Jeep safari in Periyar Tiger Reserve and Wayanad Wildlife Sanctuary",
      "Night spotlight safari (where permitted by forest authorities)",
      "Guided birding walks — Kerala has over 500 bird species",
      "Boat safari on Periyar Lake at dawn",
      "Ethical elephant observation at sanctioned sites",
      "Jungle lodge or forest tented camp accommodation",
      "All meals including field picnics and campfire dinners",
    ],
    highlights: [
      { title: "Periyar Tiger Reserve", desc: "Boat safaris across the reservoir at dawn — elephant herds, gaur and the occasional tiger track.", img: periyarTigerReserve },
      { title: "Wayanad Sanctuaries", desc: "Dhoni Hills, Muthanga and Tholpetty — three connected reserves with leopard, tiger and flying squirrel.", img: "https://sanctuarynaturefoundation.org/uploads/Article/Elephants%20feeding%20in%20the%20high%20altitude%20grasslands%20of%20Brahmagiris_1619788949.jpg" },
      { title: "Athirapally Waterfalls", desc: "Kerala's largest waterfall, thundering through dense rainforest — the dramatic backdrop for countless films and a favourite haunt of hornbills and langurs.", img: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/32/97/e2/23/caption.jpg?w=1200&h=-1&s=1" },
      { title: "Mangrove Estuaries", desc: "Canoe through Kannur's mangroves at high tide — birds, crabs and the strange silence of the tidal forest.", img: mangroveEstuaries },
    ],
    priceFrom: "₹4,50,000",
    priceLabel: "per person",
    duration: "4–8 nights",
  },
  "hill-stations": {
    label: "Hill Stations",
    tagline: "Tea gardens, cardamom forests and colonial-era planter's life",
    heroImg: hillStationGeneric,
    intro: "At altitude — Munnar at 1,600m, Vagamon at 1,100m, Wayanad's plateau — Kerala becomes a different country: cold mornings, British-era bungalows, rolling carpets of tea and the scent of cardamom on every breeze. Escora's hill-station journeys open doors that most travellers never find.",
    inclusions: [
      "Private heritage planter's bungalow or boutique estate stay",
      "Guided tea estate walk with resident tea-master",
      "Sunrise viewpoint trek with breakfast in the fields",
      "Spice and cardamom plantation tour with harvest experience",
      "Waterfall treks — Attukad, Lakkam, Nyayamakad",
      "Private cooking session with estate-grown produce",
      "All meals at the estate; plantation-fresh and local",
      "4WD mountain road transfers",
    ],
    highlights: [
      { title: "Munnar Tea Estates", desc: "The Kanan Devan Hills — 30,000 acres of contiguous tea, the largest private estate in India. Pickers at work in the early morning fog.", img: munnarTeaEstate },
      { title: "Vagamon Meadows", desc: "Pine-clad meadows and paragliding cliffs in the rains — misty, green and entirely unhurried.", img: vagamonMeadowsRainy },
      { title: "Wayanad Churam", desc: "Hairpin bends cutting through dense forest, seen from above as the clouds roll over the mountains.", img: wayanadChuram },
      { title: "Nelliyampathy Hills", desc: "Kerala's quietest hill station — orange groves, a mirror lake and zero tourist infrastructure.", img: nelliyampathyHills },
    ],
    priceFrom: "₹5,20,000",
    priceLabel: "per person",
    duration: "3–7 nights",
  },
  backwaters: {
    label: "Backwaters",
    tagline: "The slow world of lagoons, canals and rice-barge life",
    heroImg: backwatersHero,
    intro: "The backwaters of Kerala — 900 kilometres of interconnected lakes, lagoons, rivers and canals — are one of the world's great slow-travel experiences. Escora charters private kettuvallam for journeys that have nothing to do with the tourist houseboat circuit.",
    inclusions: [
      "Exclusive private kettuvallam charter (no shared boats, ever)",
      "On-board personal chef serving Kerala cuisine",
      "Village immersion — coir weaving, toddy tapping, country-boat ride",
      "Sunrise canoe through narrow village canals",
      "Kathakali or Mohiniyattam performance at a heritage venue",
      "Sunset cocktails on the sundeck",
      "Bird watching with a local naturalist on board",
      "Optional: private Ayurveda treatments on board",
    ],
    highlights: [
      { title: "Alleppey Lagoons", desc: "A full luxury houseboat gliding across the wide lagoon — the premier Kerala backwater experience.", img: alleppeyLagoonHouseboat },
      { title: "Kettuvallam Trip in Kerala Backwaters", desc: "A traditional rice-barge houseboat, hand-built from jackwood and coir, drifting the canals at the pace the backwaters themselves set.", img: "https://keralaboathouse.in/wp-content/uploads/2026/05/Whats-in-the-Package.webp" },
      { title: "Ashtamudi Estuary", desc: "Kollam's vast eight-armed estuary — mangroves, prawn farms and a quiet that the Alleppey circuit never reaches.", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Houseboats_at_Kerala_Backwaters.jpg/500px-Houseboats_at_Kerala_Backwaters.jpg?utm_source=en.wikivoyage.org&utm_campaign=parser&utm_content=thumbnail" },
      { title: "Kuruva Island", desc: "Small wooden boats drifting through water carpeted in lily flowers — one of Kerala's most peaceful backwater corners.", img: kuruvaIsland },
    ],
    priceFrom: "₹3,80,000",
    priceLabel: "per couple",
    duration: "2–5 nights",
  },
  beaches: {
    label: "Beaches",
    tagline: "Sun, cliffs, sea and Kerala's quietest shores",
    heroImg: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80",
    intro: "Kerala's 580-kilometre coastline holds beaches that range from the dramatic red laterite cliffs of Varkala to the white sands of Marari and the fortress-backed shores of Bekal. Escora's beach journeys are slow by design: clifftop yoga at dawn, seafood pulled from the water that morning, afternoons with nowhere to be.",
    inclusions: [
      "Private beachfront villa or boutique cliff-resort accommodation",
      "Sunrise yoga or Kalaripayattu on the beach",
      "Boat trip to secluded coves inaccessible by road",
      "Locally caught seafood dinner at the water's edge",
      "Sunset sailing on a traditional vallam",
      "Snorkelling or kayaking (seasonal)",
      "Coastal heritage walk — fishing villages, Chinese nets, spice wharfs",
      "All beach transfers and day excursions",
    ],
    highlights: [
      { title: "Varkala Cliffs", desc: "Kerala's most dramatic shoreline — 15-metre laterite cliffs, natural spring water and Jatayu's mythic shadow.", img: varkalaCliffs },
      { title: "Payyambalam Driving Beach", desc: "One of India's rare drivable shores — a long stretch of firm Kannur sand where the Arabian Sea meets open road.", img: payyambalamDrivingBeach },
      { title: "Kovalam Lighthouse", desc: "Kovalam's iconic lighthouse beach — clear blue sea, golden sand and a premium holiday feel for travellers from around the world.", img: kovalamBeach },
      { title: "Bekal Fort Beach", desc: "The ancient sea-facing Bekal fort, its ramparts framed by palm groves and the Arabian Sea.", img: bekalFort },
    ],
    priceFrom: "₹3,20,000",
    priceLabel: "per person",
    duration: "3–6 nights",
  },
  "functional-medicine": {
    label: "Functional Medicine",
    tagline: "Advanced diagnostics, root-cause medicine and integrative healing",
    heroImg: "https://t3.ftcdn.net/jpg/08/96/92/46/360_F_896924613_cBF8GQxQ8zaYXBbGAWreb8sKHhXyyGS1.jpg",
    intro: "Escora's Functional Medicine programmes combine the diagnostic rigour of modern integrative medicine with Kerala's deep wellness traditions. Designed for those who want answers — not just symptom management — these programmes pair advanced biomarker testing with personalised Ayurvedic and naturopathic protocols.",
    inclusions: [
      "Comprehensive functional health assessment — over 80 biomarkers",
      "One-on-one consultations with integrative medicine physician",
      "Personalised therapeutic protocol — Ayurveda, naturopathy or combined",
      "Advanced gut health analysis and microbiome review",
      "Hormonal and metabolic panel (thyroid, cortisol, insulin, lipids)",
      "Nutritional therapy and anti-inflammatory dietary plan",
      "Supervised therapeutic fasting (where clinically indicated)",
      "Detailed take-home report and 3-month follow-up plan",
    ],
    highlights: [
      { title: "Advanced Diagnostics", desc: "Full biomarker panel assessed by integrative physicians at a modern Ayurveda hospital and wellness centre — not a wellness questionnaire.", img: "https://www.meitra.com/public/upload_file/62d00031ece641657798705.jpg" },
      { title: "Integrative Protocols", desc: "Bridging Ayurvedic tradition with evidence-based functional medicine — the best of both lineages.", img: "https://www.news-medical.net/images/news/ImageForNews_795571_17314637892575252.jpg" },
      { title: "Cosmetology Treatment", desc: "Advanced dermatological and cosmetic procedures performed by licensed cosmetologists — from skin rejuvenation to non-surgical aesthetic treatments.", img: "https://macare.in/wp-content/uploads/2021/12/dermatology.jpg" },
      { title: "Medical Specialties", desc: "Dermatology, dentistry and ophthalmology delivered by licensed specialists — a dermatologist (MD/DNB) for skin, hair and nails, a dentist (BDS/MDS) for teeth and gums, and an ophthalmologist (MS) or optometrist for eye health.", img: "https://www.elistercare.com/_next/image?url=%2Fassets%2Fimages%2Fspecialities%2Fbanner.png&w=3840&q=75" },
    ],
    priceFrom: "₹1,20,000",
    priceLabel: "per person",
    duration: "7–14 nights",
  },
  "historical-heritage": {
    label: "Historical & Heritage",
    tagline: "Tracing Kerala's spice routes, kingdoms and colonial legacy",
    heroImg: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=2000&q=80",
    intro: "Kerala's history is the history of the world's desire for spice. Portuguese, Dutch, Chinese, Arab and British trade routes all converged here, layering architecture, food, religion and art into something uniquely complex. Escora's heritage journeys are led by historians and curators who open private collections, forgotten temples and unvisited palaces.",
    inclusions: [
      "Private guided heritage walk — Fort Kochi's Jewish Quarter and Mattancherry",
      "Exclusive after-hours access to Padmanabhapuram Palace",
      "Expert-led tour of Dutch and Portuguese colonial architecture",
      "Spice exchange history trail — Malabar coast to Cochin harbour",
      "Kathakali and Mohiniyattam performance at a heritage venue",
      "Lunch at a Paradesi Jewish community home (seasonal)",
      "Antique and art market tour with a specialist curator",
      "Handloom and Kasavu weaving village visit",
    ],
    highlights: [
      { title: "Fort Kochi", desc: "The oldest European settlement in India — Chinese fishing nets, a Portuguese church, a Dutch palace and a Jewish synagogue within one square kilometre.", img: fortKochiHeritage },
      { title: "Padmanabhapuram Palace", desc: "The finest wooden palace in Asia — 500 years of Kerala craftsmanship, maintained by the Royal Family of Travancore.", img: padmanabhapuramPalace },
      { title: "Malabar Spice Coast", desc: "The Calicut coast where Vasco da Gama first landed — the route that changed world history.", img: malabarSpiceCoast },
      { title: "Thrissur Pooram", desc: "Kerala's greatest festival — 200 caparisoned elephants, 500-year-old percussion traditions and a crowd of half a million.", img: thrissurPooram },
      { title: "Martial Art", desc: "Kalaripayattu — the world's oldest surviving martial art, practised in Kerala for over a thousand years, blending combat, healing and discipline.", img: "https://www.keralatourism.org/images/artforms/large/kalaripayattu20131111114353_27_1.jpg" },
      { title: "Thira, Thayyam & Kathakali", desc: "Kerala's ritual performing arts — elaborate costumes, trance-like devotion and centuries-old storytelling traditions brought vividly to life.", img: "https://images.unsplash.com/photo-1591414638143-12980893e46f?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8a2F0aGFrYWxpfGVufDB8fDB8fHww" },
    ],
    priceFrom: "₹4,80,000",
    priceLabel: "per person",
    duration: "4–8 nights",
  },
};

export default function CategoryDetail() {
  const { category } = useParams<{ category: string }>();
  const data = category ? CATEGORIES[category] : undefined;

  const SEO_META: Record<string, { title: string; description: string }> = {
    "honeymoon": {
      title: "Kerala Honeymoon Packages — Private & Romantic Getaways",
      description: "Luxury Kerala honeymoon packages for couples — private houseboat stays on Alleppey backwaters, heritage villas in Munnar, candlelit beach dinners. Fully bespoke honeymoon itineraries by Escora.",
    },
    "health-wellness": {
      title: "Kerala Ayurveda Retreats & Wellness Holidays",
      description: "Authentic Ayurveda retreats and wellness holidays in Kerala — panchakarma treatments, yoga, naturopathy, and physician-led programmes at Kerala's finest healing centres. Curated by Escora.",
    },
    "nature-wildlife": {
      title: "Kerala Wildlife Safari & Nature Tours — Wayanad, Thekkady",
      description: "Private Kerala wildlife tours — elephant corridors in Wayanad, tiger reserves in Thekkady, shola forests and bird sanctuaries. Expert naturalist-led safaris by Escora.",
    },
    "hill-stations": {
      title: "Kerala Hill Station Holidays — Munnar, Wayanad, Vagamon",
      description: "Luxury Kerala hill station holidays — misty Munnar tea estates, Wayanad jungle lodges, Vagamon meadows. British-era bungalows, cardamom walks and cool highland escapes curated by Escora.",
    },
    "backwaters": {
      title: "Kerala Backwater Houseboat Holidays — Alleppey & Kumarakom",
      description: "Private houseboat holidays on Kerala's backwaters — Alleppey, Kumarakom, Vembanad Lake. Traditional kettuvallam charters with chef, away from the tourist circuit. Curated by Escora.",
    },
    "beaches": {
      title: "Kerala Beach Holidays — Varkala, Marari & Bekal",
      description: "Luxury Kerala beach holidays — clifftop yoga at Varkala, secluded Marari sands, fortress shores of Bekal. Private beach stays and slow coastal itineraries by Escora.",
    },
    "functional-medicine": {
      title: "Functional Medicine & Integrative Health Retreats in Kerala",
      description: "Kerala functional medicine retreats combining advanced biomarker diagnostics, integrative health protocols, and traditional Ayurveda — for those seeking root-cause healing, not just symptom relief. By Escora.",
    },
    "historical-heritage": {
      title: "Kerala Heritage Tours — Fort Kochi, Malabar & Padmanabhapuram",
      description: "Private Kerala heritage tours — Fort Kochi's spice-trade history, Kozhikode Malabar coast, Padmanabhapuram palace, Dutch and Portuguese legacy. Historian-led journeys by Escora.",
    },
  };
  const seoMeta = category ? SEO_META[category] : undefined;

  useSeo({
    title: seoMeta?.title ?? (data ? `${data.label} Journeys — Private Kerala Tours` : "Collection"),
    description: seoMeta?.description ?? (data ? data.intro.slice(0, 155) : "Discover Escora's curated Kerala collections."),
    url: `https://www.escoraholidays.com/collections/${category ?? ""}`,
  });

  if (!data) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center px-6">
          <p className="font-mono text-gold text-sm tracking-[0.3em] uppercase">Not Found</p>
          <h1 className="font-serif text-4xl text-ink">Collection not found</h1>
          <Link href="/" className="font-mono text-xs text-gold uppercase tracking-widest hover:underline">
            ← Back to Home
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[70dvh] w-full overflow-hidden flex items-end pb-16 pt-24">
        <div className="absolute inset-0 z-0">
          <img
            src={data.heroImg}
            alt={data.label}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />
        </div>
        <div className="relative z-10 container mx-auto px-6 md:px-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-mono text-[11px] text-white/60 uppercase tracking-[0.2em] hover:text-gold transition-colors mb-8 block"
          >
            ← Collections
          </Link>
          <p className="font-mono text-gold text-sm tracking-[0.3em] uppercase mb-4">{data.duration}</p>
          <h1 className="font-serif text-5xl md:text-7xl text-white leading-[1.05] font-light max-w-3xl">
            {data.label}
          </h1>
          <p className="font-serif text-xl text-white/70 italic mt-4 max-w-xl">{data.tagline}</p>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-20 bg-bg">
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-3xl mx-auto text-center">
            <p className="font-sans text-ink-soft text-lg leading-relaxed">{data.intro}</p>
            <div className="mt-10">
              <a
                href="/contact"
                className="inline-block font-mono text-xs uppercase tracking-widest bg-gold text-bg px-8 py-4 hover:bg-gold/80 transition-colors"
              >
                Plan this journey
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-20 bg-bg-2 border-y border-line">
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-4xl mx-auto">
            <p className="font-mono text-gold text-[11px] tracking-[0.3em] uppercase mb-3">Every Journey Includes</p>
            <h2 className="font-serif text-4xl md:text-5xl text-ink font-light mb-12">
              What's <em className="italic">Included</em>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-5">
              {data.inclusions.map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <span className="mt-1.5 flex-shrink-0 w-5 h-[1px] bg-gold" />
                  <p className="font-sans text-ink-soft leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-20 bg-bg">
        <div className="container mx-auto px-6 md:px-12">
          <p className="font-mono text-gold text-[11px] tracking-[0.3em] uppercase mb-3">Experiences</p>
          <h2 className="font-serif text-4xl md:text-5xl text-ink font-light mb-12">
            Journey <em className="italic">Highlights</em>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {data.highlights.map((h, i) => (
              <div key={i} className="group">
                <div className="aspect-[16/9] overflow-hidden mb-5">
                  <img
                    src={h.img}
                    alt={h.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <h3 className="font-serif text-2xl text-ink mb-2">{h.title}</h3>
                <p className="font-sans text-ink-soft leading-relaxed">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-bg-2 border-t border-line">
        <div className="container mx-auto px-6 md:px-12 text-center">
          <p className="font-mono text-gold text-[11px] tracking-[0.3em] uppercase mb-4">Ready to begin?</p>
          <h2 className="font-serif text-4xl md:text-5xl text-ink font-light mb-6 max-w-2xl mx-auto">
            Let us compose your<br /><em className="italic">{data.label}</em> journey
          </h2>
          <p className="font-sans text-ink-soft max-w-lg mx-auto mb-10">
            Every Escora journey is built from scratch — your dates, your pace, your companions. Tell us what you're imagining.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="font-mono text-xs uppercase tracking-widest bg-gold text-bg px-8 py-4 hover:bg-gold/80 transition-colors"
            >
              Send an Enquiry
            </a>
            <a
              href={`https://wa.me/918157003344?text=Hello%20Escora%20%E2%80%94%20I'm%20interested%20in%20a%20${encodeURIComponent(data.label)}%20journey%20in%20Kerala.`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs uppercase tracking-widest border border-line text-ink-soft px-8 py-4 hover:border-gold hover:text-gold transition-colors"
            >
              WhatsApp us
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
