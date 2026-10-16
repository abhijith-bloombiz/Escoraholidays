import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useListPackages, useListDestinations, useCreateEnquiry } from "@workspace/api-client-react";
import Layout from "@/components/layout/Layout";
import { useSeo } from "@/hooks/useSeo";
import { ExploreCoverflow } from "@/components/ExploreCoverflow";
import { TravelTypeCoverflow, TravelTypeItem } from "@/components/TravelTypeCoverflow";
import { MapPin, Compass, Calendar, Users, Search, ChevronDown, Flower2, SunMedium, Swords, HeartPulse } from "lucide-react";
import TheEscoraWay from "@/components/TheEscoraWay";
import Kerala3DDestinationExplorer from "@/components/Kerala3DDestinationExplorer";
import Destination360Experience from "@/components/Destination360Experience";
import FromYourIdeaToKerala from "@/components/FromYourIdeaToKerala";
import { useSectionSnapAssist } from "@/hooks/useSectionSnapAssist";
import "./home-v2.css";

const FALLBACK_PACKAGES = [
  { id: 1, name: "The Malabar Escape", durationNights: 5, route: "Kochi · Munnar · Alleppey", category: "Honeymoon", priceFrom: 150000, heroImageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80", description: "A private five-night journey through Kerala's most iconic backwaters, spice gardens and heritage hotels.", featured: true },
  { id: 2, name: "Cardamom Hills Retreat", durationNights: 4, route: "Munnar · Thekkady", category: "Wellness", priceFrom: 120000, heroImageUrl: "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?auto=format&fit=crop&w=800&q=80", description: "Four nights among Kerala's cardamom and tea estates with yoga, ayurveda and forest walks.", featured: true },
  { id: 3, name: "Wayanad Wilds", durationNights: 3, route: "Calicut · Wayanad", category: "Adventure", priceFrom: 90000, heroImageUrl: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80", description: "Three nights in Wayanad's tribal heartland — jungle treks, waterfalls and forest living.", featured: true },
  { id: 4, name: "Spice Coast Odyssey", durationNights: 7, route: "Kochi · Marari · Kumarakom", category: "Culture", priceFrom: 220000, heroImageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80", description: "Seven nights tracing the ancient spice trade across Kerala's storied coast and backwaters.", featured: false },
];

import heroBg from "@assets/escora/hero-bg-kerala.png";
import FloatingWaterHero from "@/components/FloatingWaterHero";
import whyEscoraBg from "@assets/escora/why-escora-bg.jpeg";
import typeWildlife from "@assets/escora/collections/nature-wildlife-hero.jpg";
import typeHeritage from "@assets/escora/collections/fort-kochi-heritage.jpg";
import typeHoneymoon from "@assets/escora/collections/honeymoon-hero.jpg";
import typeAyurveda from "@assets/escora/collections/panchakarma.jpg";
import typeMedicine from "@assets/escora/collections/medical-tourism.jpeg";
import { KERALA_DESTINATIONS, DESTINATION_BADGES } from "@/lib/keralaDestinations";

const FALLBACK_DESTINATIONS = KERALA_DESTINATIONS;

/* ── Travel by Type (3D Coverflow Items — Preserving Exact Original Contents) ── */
const TRAVEL_TYPE_ITEMS: TravelTypeItem[] = [
  {
    id: "honeymoon",
    label: "Honeymoon",
    img: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80",
    name: <>Honey-<br/><em>moon</em></>,
    desc: "Candlelit houseboats, private shores and moments composed only for two — along the most romantic waterways in India.",
    price: "₹6,99,000",
    priceLabel: "from / couple",
    count: "12 journeys",
    link: "/collections/honeymoon",
  },
  {
    id: "health-wellness",
    label: "Wellness",
    img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80",
    name: <>Health &amp;<br/><em>Wellness</em></>,
    desc: "Ayurveda, yoga, panchakarma and deep rest — under Kerala's ancient canopy, guided by resident physicians.",
    price: "₹8,200",
    priceLabel: "from / night",
    count: "9 programmes",
    link: "/collections/health-wellness",
  },
  {
    id: "nature-wildlife",
    label: "Wildlife",
    img: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80",
    name: <>Nature &amp;<br/><em>Wildlife</em></>,
    desc: "Tiger reserves, elephant corridors and shola forests — Kerala's biodiversity, led by expert field naturalists.",
    price: "₹4,50,000",
    priceLabel: "from / person",
    count: "7 routes",
    link: "/collections/nature-wildlife",
  },
  {
    id: "hill-stations",
    label: "Hills",
    img: "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?auto=format&fit=crop&w=1200&q=80",
    name: <>Hill<br/><em>Stations</em></>,
    desc: "Tea gardens, cardamom forests and colonial planter's bungalows — Kerala's highlands at their most unhurried.",
    price: "₹5,20,000",
    priceLabel: "from / person",
    count: "8 itineraries",
    link: "/collections/hill-stations",
  },
  {
    id: "backwaters",
    label: "Backwaters",
    img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
    name: <>Back-<br/><em>waters</em></>,
    desc: "Private kettuvallam on 900 km of lagoons and canals — the slow, silent world of Kerala's interior waterways.",
    price: "₹3,80,000",
    priceLabel: "from / couple",
    count: "11 journeys",
    link: "/collections/backwaters",
  },
  {
    id: "beaches",
    label: "Beaches",
    img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    name: <>Kerala<br/><em>Beaches</em></>,
    desc: "Sun, cliffs, sea and slow mornings. Clifftop yoga at Varkala, white sands at Marari and fortress shores at Bekal.",
    count: "11 coastal journeys",
    link: "/collections/beaches",
  },
  {
    id: "functional-medicine",
    label: "Medicine",
    img: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80",
    name: <>Functional<br/><em>Medicine</em></>,
    desc: "Advanced diagnostics, physician-led protocols and root-cause healing — where Ayurveda meets integrative science.",
    count: "6 programmes",
    link: "/collections/functional-medicine",
  },
  {
    id: "historical-heritage",
    label: "Heritage",
    img: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80",
    name: <>Historical<br/><em>&amp; Heritage</em></>,
    desc: "Fort Kochi's spice routes, Padmanabhapuram's wood-carved halls and five centuries of colonial layering.",
    count: "8 heritage routes",
    link: "/collections/historical-heritage",
  },
];

const CAT_CARDS = [
  {
    id: "honeymoon",
    label: "Honeymoon",
    img: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80",
    name: <>Honey-<br/><em>moon</em></>,
    desc: "Candlelit houseboats, private shores and moments composed only for two — along the most romantic waterways in India.",
    price: "₹6,99,000", priceLabel: "from / couple", count: "12 journeys",
  },
  {
    id: "health-wellness",
    label: "Wellness",
    img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80",
    name: <>Health &amp;<br/><em>Wellness</em></>,
    desc: "Ayurveda, yoga, panchakarma and deep rest — under Kerala's ancient canopy, guided by resident physicians.",
    price: "₹8,200", priceLabel: "from / night", count: "9 programmes",
  },
  {
    id: "nature-wildlife",
    label: "Wildlife",
    img: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80",
    name: <>Nature &amp;<br/><em>Wildlife</em></>,
    desc: "Tiger reserves, elephant corridors and shola forests — Kerala's biodiversity, led by expert field naturalists.",
    price: "₹4,50,000", priceLabel: "from / person", count: "7 routes",
  },
  {
    id: "hill-stations",
    label: "Hills",
    img: "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?auto=format&fit=crop&w=1200&q=80",
    name: <>Hill<br/><em>Stations</em></>,
    desc: "Tea gardens, cardamom forests and colonial planter's bungalows — Kerala's highlands at their most unhurried.",
    price: "₹5,20,000", priceLabel: "from / person", count: "8 itineraries",
  },
  {
    id: "backwaters",
    label: "Backwaters",
    img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
    name: <>Back-<br/><em>waters</em></>,
    desc: "Private kettuvallam on 900 km of lagoons and canals — the slow, silent world of Kerala's interior waterways.",
    price: "₹3,80,000", priceLabel: "from / couple", count: "11 journeys",
  },
];

const CAT_CARDS_ROW2 = [
  {
    id: "beaches",
    label: "Beaches",
    img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    name: <>Kerala<br/><em>Beaches</em></>,
    desc: "Sun, cliffs, sea and slow mornings. Clifftop yoga at Varkala, white sands at Marari and fortress shores at Bekal.",
    count: "11 coastal journeys",
  },
  {
    id: "functional-medicine",
    label: "Medicine",
    img: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80",
    name: <>Functional<br/><em>Medicine</em></>,
    desc: "Advanced diagnostics, physician-led protocols and root-cause healing — where Ayurveda meets integrative science.",
    count: "6 programmes",
  },
  {
    id: "historical-heritage",
    label: "Heritage",
    img: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80",
    name: <>Historical<br/><em>&amp; Heritage</em></>,
    desc: "Fort Kochi's spice routes, Padmanabhapuram's wood-carved halls and five centuries of colonial layering.",
    count: "8 heritage routes",
  },
];

const PKG2_CARDS = [
  {
    cats: ["honeymoon", "luxury"],
    catTag: "Honeymoon", price: "₹6,99,000", priceLabel: "per couple",
    // Kerala backwaters — houseboat on golden water, perfect for romance
    img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
    nights: "07 Nights · 08 Days · Alleppey → Munnar",
    title: <>The <em>Backwater</em> Sonata</>,
    desc: "Private houseboat with chef, a 1920s heritage tea bungalow, dawn kalaripayattu and a moonlit dinner on a rice-barge.",
    tags: ["Romance", "Private", "Couples"],
  },
  {
    cats: ["health", "solo"],
    catTag: "Wellness", price: "₹12,30,000", priceLabel: "per person",
    // Yoga meditation by water — calm, restorative, Ayurveda retreat mood
    img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80",
    nights: "14 Nights · 15 Days · Kumarakom → Varkala",
    title: <>The <em>Ayurveda</em> Retreat</>,
    desc: "Physician-led panchakarma on Vembanad Lake — medicated oils, daily consultations, vegetarian cuisine and a boat to a forgotten island.",
    tags: ["Wellness", "Solo", "Slow"],
  },
  {
    cats: ["family"],
    catTag: "Family", price: "₹10,15,000", priceLabel: "family of 4",
    // Kerala tropical canopy — represents the jungle lodges and wildlife reserves of Wayanad
    img: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80",
    nights: "10 Nights · 11 Days · Thekkady → Wayanad",
    title: <>Hills, <em>Tea</em> &amp; Tigers</>,
    desc: "Periyar wildlife dawns, a private treehouse in Wayanad and a spice-estate stay — designed for curious families, ages 4 to 84.",
    tags: ["Family", "Wildlife", "Nature"],
  },
  {
    cats: ["luxury", "honeymoon"],
    catTag: "Luxury", price: "₹18,50,000", priceLabel: "per couple",
    // Private infinity pool in tropical luxury resort — heritage indulgence
    img: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80",
    nights: "08 Nights · 09 Days · Kochi → Kovalam",
    title: <>The <em>Palace</em> Circuit</>,
    desc: "Four of Kerala's most extraordinary heritage properties — private butler, personal chef and a sunset cruise on a restored kettuvallam.",
    tags: ["Luxury", "Heritage", "Private"],
  },
  {
    cats: ["solo", "leisure"],
    catTag: "Solo", price: "₹4,50,000", priceLabel: "per person",
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=80",
    nights: "07 Nights · 08 Days · Fort Kochi → Wayanad",
    title: <>The <em>Solo</em> Navigator</>,
    desc: "Meet a Kathakali master, cycle a spice village at dawn, spend two nights in a forest treehouse — entirely at your own pace.",
    tags: ["Solo", "Culture", "Adventure"],
  },
  {
    cats: ["leisure", "family"],
    catTag: "Leisure", price: "₹3,80,000", priceLabel: "per person",
    img: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80",
    nights: "06 Nights · 07 Days · Varkala → Alleppey",
    title: <>Sun, <em>Sea</em> &amp; Spice</>,
    desc: "Clifftop yoga at sunrise, unhurried backwater days, fresh seafood by the shore — Kerala's most relaxed coastal route.",
    tags: ["Leisure", "Beach", "Slow"],
  },
];

const ESCORA_RETREAT_CARDS = [
  {
    step: "01",
    name: "Ayurveda & Panchakarma",
    icon: <Flower2 className="retreat-card-icon" strokeWidth={1.75} />,
    title: (
      <>
        Ayurveda &amp; <em>Panchakarma</em>
      </>
    ),
    desc: "Physician-led detox in the classical Keraliya tradition — pulse diagnosis, medicated oils prepared in-house, shirodhara and rasayana.",
    tags: ["PANCHAKARMA", "ABHYANGA", "SHIRODHARA", "RASAYANA"],
    img: "/assets/retreat/retreat-ayurveda.jpg",
    alt: "Ayurveda & Panchakarma wellness sanctuary with traditional brass uruli and oils in Kerala",
  },
  {
    step: "02",
    name: "Yoga & Meditation",
    icon: <SunMedium className="retreat-card-icon" strokeWidth={1.75} />,
    title: (
      <>
        Yoga &amp; <em>Meditation</em>
      </>
    ),
    desc: "Lakeside sunrise practice from gentle Hatha to disciplined Ashtanga, with pranayama and yoga nidra to settle the mind.",
    tags: ["HATHA", "ASHTANGA", "PRANAYAMA", "YOGA NIDRA"],
    img: "/assets/retreat/retreat-yoga.jpg",
    alt: "Yoga and meditation practice at sunrise by Vembanad Lake in Kerala",
  },
  {
    step: "03",
    name: "Kalaripayattu — the art",
    icon: <Swords className="retreat-card-icon" strokeWidth={1.75} />,
    title: (
      <>
        Kalaripayattu — <em>the art</em>
      </>
    ),
    desc: "The world's oldest martial art, taught at a traditional kalari by a Gurukkal — forms, footwork and healing marma therapy.",
    tags: ["MEIPAYATTU", "KOLTHARI", "MARMA", "UZHICHIL"],
    img: "/assets/retreat/retreat-kalari.jpg",
    alt: "Traditional Kalaripayattu martial art combat training with swords and shields in a Kerala kalari",
  },
  {
    step: "04",
    name: "Naturopathy & Healthcare",
    icon: <HeartPulse className="retreat-card-icon" strokeWidth={1.75} />,
    title: (
      <>
        Naturopathy &amp; <em>Healthcare</em>
      </>
    ),
    desc: "Doctor-supervised detox, therapeutic diet, physiotherapy and lifestyle medicine — with full medical reports and home aftercare.",
    tags: ["NATUROPATHY", "DETOX", "PHYSIO", "DIET"],
    img: "/assets/retreat/retreat-naturopathy.jpg",
    alt: "Naturopathy herbal remedies and natural medicine overlooking Kerala backwaters",
  },
];

const TESTIMONIALS = [
  {
    cat: "Honeymoon · Mar 2025",
    quote: '"They moved a sunset for us. Or it felt that way. A boat appeared on a backwater I\'d been told didn\'t exist — and a chef I\'d long admired was on it."',
    av: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
    name: "Eleanor V.",
    meta: "London · Honeymoon",
    photo: "/assets/testimonials/sunset-houseboat.jpg",
    photoAlt: "Eleanor watching sunset houseboat on Kerala backwaters",
    rating: 5,
    delay: "",
  },
  {
    cat: "Family · Dec 2024",
    quote: '"Our family of seven, ages 6 to 78. The itinerary anticipated every single one of us."',
    av: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
    name: "Marcus T.",
    meta: "San Francisco · Family",
    photo: "/assets/testimonials/kerala-estate.jpg",
    photoAlt: "Kerala heritage estate by water with family atmosphere",
    rating: 5,
    delay: "d1",
  },
  {
    cat: "Wellness · Oct 2024",
    quote: '"Escora did not arrange a holiday — they arranged a <em>recovery</em>."',
    av: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
    name: "Dr. Aiko N.",
    meta: "Tokyo · Wellness",
    photo: "/assets/testimonials/munnar-hills.jpg",
    photoAlt: "Misty tea hills of Munnar Kerala at sunrise",
    rating: 5,
    delay: "d2",
  },
];

const MARQUEE_ITEMS = [
  "Backwaters of Alleppey", "Tea hills of Munnar", "Fort Kochi nights",
  "Wayanad jungles", "Varkala cliffs", "Ayurveda at Kumarakom", "Thekkady spice trails",
];

const TYPE_PILLS = [
  { label: "Honeymoon", id: "honeymoon" },
  { label: "Health & Wellness", id: "health-wellness" },
  { label: "Nature & Wildlife", id: "nature-wildlife" },
  { label: "Hill Stations", id: "hill-stations" },
  { label: "Backwaters", id: "backwaters" },
  { label: "Beaches", id: "beaches" },
  { label: "Functional Medicine", id: "functional-medicine" },
  { label: "Historical & Heritage", id: "historical-heritage" },
];

const CAT_STRIP_BTNS = [
  { label: "All Journeys", id: "all" },
  { label: "Honeymoon", id: "honeymoon" },
  { label: "Health & Wellness", id: "health-wellness" },
  { label: "Nature & Wildlife", id: "nature-wildlife" },
  { label: "Hill Stations", id: "hill-stations" },
  { label: "Backwaters", id: "backwaters" },
  { label: "Beaches", id: "beaches" },
  { label: "Functional Medicine", id: "functional-medicine" },
  { label: "Historical & Heritage", id: "historical-heritage" },
];

/* ── Enquiry form state ── */
interface EnquiryForm {
  name: string; phone: string; email: string; type: string;
  dates: string; pax: string; budget: string;
}

export default function Home() {
  const [whyVideoOpen, setWhyVideoOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeCat, setActiveCat] = useState("all");
  const [enquirySent, setEnquirySent] = useState(false);
  const [enquiryError, setEnquiryError] = useState("");
  const [selectedDest, setSelectedDest] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedWhen, setSelectedWhen] = useState("");
  const [selectedPax, setSelectedPax] = useState("");
  const [openDropdown, setOpenDropdown] = useState<"where" | "type" | "when" | "pax" | null>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Preload hero background image
    const heroImg = new window.Image();
    heroImg.src = heroBg;
  }, []);

  const [form, setForm] = useState<EnquiryForm>({
    name: "", phone: "", email: "", type: "", dates: "", pax: "2 adults (couple)", budget: "",
  });
  const createEnquiry = useCreateEnquiry();

  const categoriesRef = useRef<HTMLElement>(null);
  const packagesRef = useRef<HTMLElement>(null);
  const exploreSectionRef = useRef<HTMLElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);

  // Fluid scroll-assisted section-to-viewport docking across the homepage
  useSectionSnapAssist([
    "hero",
    "the-escora-way",
    "categories",
    "explore-kerala",
    "dest-360",
    "why-escora",
    "how-it-works",
    "retreat",
    "testimonials",
    "contact",
  ]);
  const [activeRetreatCard, setActiveRetreatCard] = useState<number>(1);

  const handleRetreatCardClick = (i: number, e?: React.MouseEvent | React.KeyboardEvent) => {
    setActiveRetreatCard(i);
    setForm((f) => ({
      ...f,
      type: "Health & Wellness",
      budget: f.budget || "₹10,000+ / night",
    }));

    const contactEl = document.getElementById("contact");
    if (contactEl) {
      if (e) e.preventDefault();
      contactEl.scrollIntoView({ behavior: "smooth" });
      window.history.pushState(null, "", "#contact");
      setTimeout(() => {
        const nameInput = document.getElementById("form-name") as HTMLInputElement | null;
        nameInput?.focus({ preventScroll: true });
      }, 700);
    }
  };
  const [activeTestimonialIdx, setActiveTestimonialIdx] = useState<number>(0);
  const [isTestimonialHovered, setIsTestimonialHovered] = useState<boolean>(false);

  useEffect(() => {
    if (isTestimonialHovered) return;
    const timer = setInterval(() => {
      setActiveTestimonialIdx((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isTestimonialHovered]);



  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useSeo({
    description: "Escora crafts luxury Kerala holiday packages — private honeymoon tours, Ayurveda retreats, backwater houseboat stays, and bespoke itineraries for discerning travellers from UK, Europe & the Gulf.",
    url: "https://www.escoraholidays.com/",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "TravelAgency",
      name: "Escora",
      url: "https://www.escoraholidays.com",
      logo: "https://www.escoraholidays.com/escora-logo.png",
      image: "https://www.escoraholidays.com/opengraph.jpg",
      description: "Boutique destination management studio crafting private journeys through Kerala for discerning travellers.",
      address: { "@type": "PostalAddress", streetAddress: "1st Floor, Landmark Maple Business Tower", addressLocality: "Kozhikode", addressRegion: "Kerala", postalCode: "673014", addressCountry: "IN" },
      telephone: "+918157003344",
      priceRange: "₹₹₹₹",
      areaServed: { "@type": "State", name: "Kerala", containedInPlace: { "@type": "Country", name: "India" } },
      sameAs: [
        "https://www.linkedin.com/company/escora-holidays/about/",
        "https://www.instagram.com/escora_holidays",
        "https://www.facebook.com/people/Escora-holidays",
      ],
      openingHoursSpecification: { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], opens: "09:00", closes: "18:00" },
    },
  });

  const { data: packagesData } = useListPackages({ published: true, featured: true });
  const { data: destinationsData } = useListDestinations({ published: true });
  const exploreDestinations = destinationsData && destinationsData.length > 0 ? destinationsData : FALLBACK_DESTINATIONS;

  /* Bidirectional scroll reveal for .rv, .mr2 and cards (triggers on scroll forward & backward) */
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in", "card-in-view");
          } else {
            // Keep hero elements visible, but toggle other elements bidirectionally
            if (!e.target.closest(".hero-editorial, .hero2")) {
              e.target.classList.remove("in", "card-in-view");
            }
          }
        });
      },
      { threshold: [0, 0.12], rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".rv, .mr2, .stat-cell").forEach((el) => io.observe(el));
    /* Also reveal elements already in view in hero */
    const heroEls = document.querySelectorAll(".hero-editorial .rv, .hero-editorial .mr2, .hero2 .rv, .hero2 .mr2");
    const t = setTimeout(() => heroEls.forEach((el) => el.classList.add("in", "card-in-view")), 200);
    return () => { io.disconnect(); clearTimeout(t); };
  }, []);

  /* Build pkg cards — fall back to built-in samples when API has no data */
  const pkgCards = (packagesData?.length ? packagesData : FALLBACK_PACKAGES).slice(0, 6).map((pkg) => ({
    cats: [pkg.category?.toLowerCase() || "luxury"],
    catTag: pkg.category || "Journey",
    price: pkg.priceFrom ? `₹${Number(pkg.priceFrom).toLocaleString("en-IN")}` : "₹—",
    priceLabel: "per person",
    img: pkg.heroImageUrl || "",
    nights: `${pkg.durationNights} Nights`,
    title: <>{pkg.name}</>,
    desc: pkg.description || "",
    tags: [pkg.category || "Private"],
  }));

  /* Helper to scroll smoothly using Lenis 60fps */
  function smoothScrollTo(el: HTMLElement | null, offset = -100) {
    if (!el) return;
    if (window.__lenis) {
      window.__lenis.scrollTo(el, { offset, duration: 1.25 });
    } else {
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: "smooth" });
    }
  }

  /* Scroll to categories + activate filter */
  function jumpToCategory(id: string) {
    setActiveCat(id === "all" ? "all" : id);
    setActiveFilter(id === "all" ? "all" : id);
    const el = id === "all" ? categoriesRef.current : packagesRef.current;
    smoothScrollTo(el, -100);
  }

  /* Cat strip click → sync pkg filter + scroll to packages */
  function onCatStripClick(id: string) {
    setActiveCat(id);
    setActiveFilter(id);
    smoothScrollTo(packagesRef.current, -100);
  }

  function handleHeroSearch() {
    setOpenDropdown(null);
    if (selectedType) {
      const match = CAT_CARDS.find((c) => c.label.toLowerCase() === selectedType.toLowerCase()) ||
                    CAT_CARDS_ROW2.find((c) => c.label.toLowerCase() === selectedType.toLowerCase()) ||
                    TYPE_PILLS.find((p) => p.label.toLowerCase() === selectedType.toLowerCase());
      if (match) {
        jumpToCategory(match.id);
        return;
      }
    }
    if (selectedDest) {
      if (exploreSectionRef.current) {
        smoothScrollTo(exploreSectionRef.current, -100);
        return;
      }
    }
    if (categoriesRef.current) {
      smoothScrollTo(categoriesRef.current, -100);
    }
  }

  function handleEnquirySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone || !form.email) return;
    setEnquiryError("");
    const message =
      `Journey type: ${form.type || "Not specified"}\n` +
      `Travellers: ${form.pax || "Not specified"}\n` +
      `Approximate dates: ${form.dates || "Not specified"}\n` +
      `Budget: ${form.budget || "Not specified"}`;
    createEnquiry.mutate(
      { data: { name: form.name, email: form.email, phone: form.phone, message } },
      {
        onSuccess: () => setEnquirySent(true),
        onError: () => setEnquiryError("Something went wrong. Please try again or message us on WhatsApp."),
      }
    );
  }

  function buildWAMsg() {
    return encodeURIComponent(
      `New Escora Enquiry\nName: ${form.name}\nPhone: ${form.phone}` +
      (form.type ? `\nJourney type: ${form.type}` : "") +
      (form.pax ? `\nTravellers: ${form.pax}` : "") +
      (form.dates ? `\nDates: ${form.dates}` : "") +
      (form.budget ? `\nBudget: ${form.budget}` : "")
    );
  }

  return (
    <Layout>
      {/* ═══════════════════════════════ HERO EDITORIAL ═══════════════════════════════ */}
      <section
        className="hero-editorial"
        id="hero"
        aria-label="Escora — Kerala, your way"
        ref={heroSectionRef}
      >
        <FloatingWaterHero containerRef={heroSectionRef} />


        {/* Visually hidden H1 for SEO semantics */}
        <h1 className="sr-only">Escora Holidays — Kerala, Luxury Private Travel</h1>

        {/* Floating Bottom Search & Booking Capsule */}
        <div className="hero-search-wrapper" ref={searchBarRef}>
          <div className="hero-search-capsule" role="search" aria-label="Search bespoke journeys">
            {/* 1. Where to */}
            <div
              className={`search-col ${openDropdown === "where" ? "is-open" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdown(openDropdown === "where" ? null : "where");
              }}
            >
              <div className="col-icon">
                <MapPin size={18} strokeWidth={1.9} />
              </div>
              <div className="col-info">
                <span className="col-title">Where to</span>
                <span className={`col-subtitle ${selectedDest ? "has-val" : ""}`}>
                  {selectedDest || "Where in Kerala?"}
                </span>
              </div>

              {openDropdown === "where" && (
                <div className="search-popover where-popover" onClick={(e) => e.stopPropagation()}>
                  <div className="popover-heading">Popular Destinations</div>
                  <div className="dest-chips-grid">
                    {[
                      { name: "All Kerala", desc: "Signature Journeys" },
                      { name: "Munnar", desc: "Tea country & misty peaks" },
                      { name: "Alleppey", desc: "Backwaters & houseboats" },
                      { name: "Wayanad", desc: "Rainforests & waterfalls" },
                      { name: "Kochi", desc: "Spice trading & heritage" },
                      { name: "Thekkady", desc: "Periyar wildlife & spice" },
                      { name: "Kovalam", desc: "Arabian sea beaches" },
                      { name: "Kumarakom", desc: "Bird sanctuary & lake" },
                    ].map((dest) => (
                      <button
                        key={dest.name}
                        type="button"
                        className={`dest-chip ${selectedDest === dest.name ? "selected" : ""}`}
                        onClick={() => {
                          setSelectedDest(dest.name === "All Kerala" ? "" : dest.name);
                          setOpenDropdown(null);
                        }}
                      >
                        <b>{dest.name}</b>
                        <small>{dest.desc}</small>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="search-col-sep" />

            {/* 2. Journey type */}
            <div
              className={`search-col ${openDropdown === "type" ? "is-open" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdown(openDropdown === "type" ? null : "type");
              }}
            >
              <div className="col-icon">
                <Compass size={18} strokeWidth={1.9} />
              </div>
              <div className="col-info">
                <span className="col-title">Journey type</span>
                <span className={`col-subtitle ${selectedType ? "has-val" : ""}`}>
                  {selectedType || "Choose an experience"}
                </span>
              </div>
              <div className="col-chevron">
                <ChevronDown size={14} strokeWidth={2.2} style={{ transform: openDropdown === "type" ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </div>

              {openDropdown === "type" && (
                <div className="search-popover type-popover" onClick={(e) => e.stopPropagation()}>
                  <div className="popover-heading">Escora Collections</div>
                  <div className="type-options-list">
                    {[
                      { id: "honeymoon", label: "Honeymoon", note: "Candlelit houseboats & intimate shores" },
                      { id: "health-wellness", label: "Health & Wellness", note: "Ayurveda, panchakarma & yoga" },
                      { id: "nature-wildlife", label: "Nature & Wildlife", note: "Tiger reserves & elephant corridors" },
                      { id: "hill-stations", label: "Hill Stations", note: "Tea gardens & planter's bungalows" },
                      { id: "backwaters", label: "Backwaters", note: "Private lagoons & slow canals" },
                      { id: "beaches", label: "Beaches", note: "Varkala cliffs & secluded coves" },
                      { id: "functional-medicine", label: "Functional Medicine", note: "Targeted physician-led rejuvenation" },
                      { id: "historical-heritage", label: "Historical & Heritage", note: "Ancient Malabar spice trading ports" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`type-option ${selectedType === item.label ? "selected" : ""}`}
                        onClick={() => {
                          setSelectedType(item.label);
                          setOpenDropdown(null);
                        }}
                      >
                        <span className="opt-label">{item.label}</span>
                        <span className="opt-note">{item.note}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="search-col-sep" />

            {/* 3. When */}
            <div
              className={`search-col ${openDropdown === "when" ? "is-open" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdown(openDropdown === "when" ? null : "when");
              }}
            >
              <div className="col-icon">
                <Calendar size={18} strokeWidth={1.9} />
              </div>
              <div className="col-info">
                <span className="col-title">When</span>
                <span className={`col-subtitle ${selectedWhen ? "has-val" : ""}`}>
                  {selectedWhen || "Add dates"}
                </span>
              </div>

              {openDropdown === "when" && (
                <div className="search-popover when-popover" onClick={(e) => e.stopPropagation()}>
                  <div className="popover-heading">Best Times to Travel</div>
                  <div className="when-options-list">
                    {[
                      { season: "Oct – Mar", title: "Peak Winter Season", desc: "Cool pleasant weather across backwaters & hills" },
                      { season: "Apr – May", title: "Summer Escapes", desc: "Cool highland tea estates of Munnar & Wayanad" },
                      { season: "Jun – Sep", title: "Monsoon Ayurveda", desc: "Atmosphere ideal for herbs & panchakarma" },
                      { season: "Flexible", title: "I'm Flexible", desc: "Let Escora recommend based on travel goals" },
                    ].map((w) => (
                      <button
                        key={w.season}
                        type="button"
                        className={`when-option ${selectedWhen === w.season ? "selected" : ""}`}
                        onClick={() => {
                          setSelectedWhen(w.season);
                          setOpenDropdown(null);
                        }}
                      >
                        <span className="when-season">{w.season}</span>
                        <div className="when-details">
                          <b>{w.title}</b>
                          <small>{w.desc}</small>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="search-col-sep" />

            {/* 4. Travellers */}
            <div
              className={`search-col ${openDropdown === "pax" ? "is-open" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdown(openDropdown === "pax" ? null : "pax");
              }}
            >
              <div className="col-icon">
                <Users size={18} strokeWidth={1.9} />
              </div>
              <div className="col-info">
                <span className="col-title">Travellers</span>
                <span className={`col-subtitle ${selectedPax ? "has-val" : ""}`}>
                  {selectedPax || "Add guests"}
                </span>
              </div>
              <div className="col-chevron">
                <ChevronDown size={14} strokeWidth={2.2} style={{ transform: openDropdown === "pax" ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </div>

              {openDropdown === "pax" && (
                <div className="search-popover pax-popover" onClick={(e) => e.stopPropagation()}>
                  <div className="popover-heading">Who is Travelling?</div>
                  <div className="pax-options-list">
                    {[
                      { label: "2 Adults (Couple)", desc: "Honeymoon or romantic retreat" },
                      { label: "1 Adult (Solo)", desc: "Wellness & slow exploration" },
                      { label: "Family (3–4 Guests)", desc: "Private vehicle & paced stops" },
                      { label: "Small Group (5+ Guests)", desc: "Private estate villa & cruising" },
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        className={`pax-option ${selectedPax === p.label ? "selected" : ""}`}
                        onClick={() => {
                          setSelectedPax(p.label);
                          setOpenDropdown(null);
                        }}
                      >
                        <b>{p.label}</b>
                        <small>{p.desc}</small>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Search Action Button */}
            <button
              type="button"
              className="search-go-btn"
              onClick={handleHeroSearch}
              aria-label="Search curated journeys"
            >
              <Search size={19} strokeWidth={2.4} color="#ffffff" />
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ THE ESCORA WAY ═══════════════════════ */}
      <TheEscoraWay />

      {/* ═══════════════════════ TRAVEL BY TYPE ═══════════════════════ */}
      <section
        className="cat-section"
        id="categories"
        ref={categoriesRef}
      >
        <div className="wrap">
          <div className="cat-section-head">
            <div>
              <div className="eyebrow rv"><span className="dot" />Travel by Type</div>
              <h2 className="display-md rv d2" style={{ maxWidth: "20ch" }}>
                Eight ways to discover <em style={{ fontStyle: "italic", color: "var(--gold-bright)" }}>Kerala</em>.
              </h2>
            </div>
            <p className="rv d3" style={{ maxWidth: "38ch", color: "var(--ink-mute)", fontSize: 14, lineHeight: 1.65, textAlign: "right" }}>
              Choose your travel personality — we'll compose a journey from scratch, entirely around you.
            </p>
          </div>

          <ExploreCoverflow items={TRAVEL_TYPE_ITEMS} />
        </div>
      </section>

      {/* ═══════════════════════ 3D DESTINATION EXPLORER ═══════════════════════ */}
      <Kerala3DDestinationExplorer
        ref={exploreSectionRef}
        id="explore-kerala"
        destinations={destinationsData}
      />

      {/* ═══════════════════════ 360° DESTINATION EXPERIENCE ═══════════════════════ */}
      <Destination360Experience destinations={destinationsData} />


      {/* ═══════════════════════ WHY ESCORA — LANDSCAPE PANORAMA ═══════════════════════ */}
      <section className="why-esc-section" id="why-escora" aria-label="Why choose Escora">
        {/* Background landscape */}
        <div className="why-esc-bg" style={{ backgroundImage: `url(${whyEscoraBg})` }} aria-hidden="true" />
        {/* Cream overlay for readability */}
        <div className="why-esc-overlay" aria-hidden="true" />

        <div className="why-esc-inner">
          {/* ── Left panel: editorial copy ── */}
          <div className="why-esc-left">
            <div className="why-esc-eyebrow rv">
              <span className="dot" />WHY ESCORA
            </div>
            <h2 className="why-esc-heading rv d1">
              Why the world's discerning travellers{" "}
              <em className="why-esc-heading-em">choose Escora</em>
            </h2>
            <p className="why-esc-desc rv d2">
              We don't sell packages. We compose journeys — built entirely around you, from the first conversation to the final farewell.
            </p>
            <button
              type="button"
              className="why-esc-play-btn rv d3"
              onClick={() => setWhyVideoOpen(true)}
              aria-label="Watch our Kerala story video"
            >
              <span className="why-esc-play-circle" aria-hidden="true">
                <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
                  <path d="M9 6L1 11V1L9 6Z" fill="currentColor" />
                </svg>
              </span>
              WATCH OUR STORY
            </button>
          </div>

          {/* ── Right panel: 3×2 benefits grid ── */}
          <div className="why-esc-right">
            {[
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                ),
                title: "Completely Private Journeys",
                desc: "No shared buses. No fixed departures. Every element of your trip is exclusive to you and your group.",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                ),
                title: "Kerala Specialists",
                desc: "One destination. A decade of local expertise. We know every road, every estate, every chef worth knowing.",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                ),
                title: "Handpicked Stays",
                desc: "Every hotel, homestay and houseboat is personally inspected by our team before it earns a place in your itinerary.",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                ),
                title: "Local Curators",
                desc: "Your guides, planners and hosts are people who actually live in Kerala — born here, rooted here, and fluent in English.",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.26h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                ),
                title: "24 × 7 Concierge",
                desc: "Support before, during and after travel. A real person answers — not a chatbot.",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 11 12 14 22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                ),
                title: "Fully Tailored",
                desc: "Nothing is pre-packaged. Your dates, your pace, your companions, your interests — built from a blank canvas.",
              },
            ].map((item, i) => (
              <div key={i} className={`why-esc-card rv${i > 0 ? ` d${Math.min(i, 3)}` : ""}`}>
                <span className="why-esc-card-icon" aria-hidden="true">{item.icon}</span>
                <h4 className="why-esc-card-title">{item.title}</h4>
                <p className="why-esc-card-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Escora video modal */}
      {whyVideoOpen && (
        <div
          className="why-esc-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Escora Kerala Story Video"
          onClick={() => setWhyVideoOpen(false)}
        >
          <div className="why-esc-modal-frame" onClick={(e) => e.stopPropagation()}>
            <video src="/BGVideo.mp4" poster="/hero-poster.jpg" controls autoPlay playsInline />
            <button
              type="button"
              className="why-esc-modal-close"
              onClick={() => setWhyVideoOpen(false)}
              aria-label="Close video"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════ FROM YOUR IDEA TO KERALA ════════════════════ */}
      <FromYourIdeaToKerala />

      {/* ═══════════════════════ ESCORA RETREAT ════════════════════════════ */}
      <section className="escora-retreat-section" id="retreat" aria-label="Escora Retreat">
        {/* Decorative botanical leaf line arts in margins */}
        <svg
          className="retreat-botanical retreat-botanical-left"
          viewBox="0 0 160 320"
          fill="none"
          stroke="#c59a58"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10 310 C30 220 50 140 120 20" />
          <path d="M35 250 C15 235 5 210 20 190 C35 210 38 230 35 250" />
          <path d="M48 210 C68 195 80 170 70 150 C55 170 50 190 48 210" />
          <path d="M62 165 C40 145 35 120 50 100 C65 120 65 145 62 165" />
          <path d="M80 120 C100 100 115 80 105 60 C90 80 82 100 80 120" />
          <path d="M98 75 C80 55 80 30 95 15 C108 32 102 55 98 75" />
          <path d="M120 20 C135 10 145 15 140 30 C130 35 125 28 120 20" />
        </svg>

        <svg
          className="retreat-botanical retreat-botanical-right"
          viewBox="0 0 160 320"
          fill="none"
          stroke="#c59a58"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M150 10 C130 100 110 180 40 300" />
          <path d="M125 70 C145 85 155 110 140 130 C125 110 122 90 125 70" />
          <path d="M112 110 C92 125 80 150 90 170 C105 150 110 130 112 110" />
          <path d="M98 155 C120 175 125 200 110 220 C95 200 95 175 98 155" />
          <path d="M80 200 C60 220 45 240 55 260 C70 240 78 220 80 200" />
          <path d="M62 245 C80 265 80 290 65 305 C52 288 58 265 62 245" />
        </svg>

        <div className="retreat-leaf-shadow-tr" aria-hidden="true" />
        <div className="retreat-leaf-shadow-bl" aria-hidden="true" />

        <div className="retreat-container">
          <div className="retreat-header">
            <div className="retreat-header-left">
              <div className="retreat-eyebrow rv">
                <span className="retreat-eyebrow-dot" />
                ESCORA RETREAT
              </div>
              <h2 className="retreat-title rv d1">
                Healing, the <em>Kerala</em> way.
              </h2>
            </div>
            <div className="retreat-header-right rv d2">
              <p className="retreat-lede">
                Set on the quiet shore of Vembanad Lake — our NABH-accredited wellness home, where physicians, yogis and kalari masters work as one. Every programme is composed for you alone.
              </p>
            </div>
          </div>

          <div className="retreat-cards-grid">
            {ESCORA_RETREAT_CARDS.map((card, i) => {
              const isActive = activeRetreatCard === i;
              return (
                <a
                  key={i}
                  href="#contact"
                  className={`retreat-arch-card rv${i > 0 ? ` d${i}` : ""}${isActive ? " is-active" : ""}`}
                  onClick={(e) => handleRetreatCardClick(i, e)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleRetreatCardClick(i, e);
                    }
                  }}
                  aria-label={`Enquire about ${card.name} - Step ${card.step}`}
                >
                  {/* Golden Apex Dot on active card */}
                  {isActive && <div className="retreat-apex-dot" aria-hidden="true" />}

                  <div className="retreat-card-content">
                    <div className="retreat-card-icon-badge" aria-hidden="true">
                      {card.icon}
                    </div>
                    <h3 className="retreat-card-title">{card.title}</h3>
                    <p className="retreat-card-desc">{card.desc}</p>

                    <div className="retreat-card-tags">
                      {card.tags.map((tag, tIdx) => (
                        <span key={tIdx} className="retreat-card-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="retreat-card-photo-wrap">
                    <img
                      src={card.img}
                      alt={card.alt}
                      className="retreat-card-photo"
                      loading="lazy"
                    />
                    <div className="retreat-card-photo-overlay" aria-hidden="true" />
                    <div className="retreat-card-photo-bottom">
                      <div className="retreat-card-num">{card.step}</div>
                      <div
                        className="retreat-card-action-btn"
                        aria-hidden="true"
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14" />
                          <path d="M12 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════ TRAVELLER TESTIMONIALS CAROUSEL ════════════════════════ */}
      <section
        className="testi-carousel-section"
        id="testimonials"
        aria-label="Traveller Stories"
        onMouseEnter={() => setIsTestimonialHovered(true)}
        onMouseLeave={() => setIsTestimonialHovered(false)}
        onTouchStart={() => setIsTestimonialHovered(true)}
        onTouchEnd={() => setIsTestimonialHovered(false)}
      >
        {/* Subtle Kerala landscape backdrop scenery */}
        <div className="testi-scenery-backdrop" aria-hidden="true">
          <div className="testi-scenery-left" />
          <div className="testi-scenery-right" />
          <svg className="testi-birds" viewBox="0 0 160 80" fill="none" stroke="rgba(26,63,44,0.35)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M10 25 Q18 18 26 25 Q34 18 42 25" />
            <path d="M55 15 Q61 9 67 15 Q73 9 79 15" />
            <path d="M90 32 Q96 26 102 32 Q108 26 114 32" />
          </svg>
        </div>

        {/* Botanical leaf accents in corners */}
        <div className="testi-corner-leaf testi-leaf-tl" aria-hidden="true" />
        <div className="testi-corner-leaf testi-leaf-bl" aria-hidden="true" />
        <div className="testi-corner-leaf testi-leaf-br" aria-hidden="true" />

        <div className="testi-carousel-header">
          <div className="testi-eyebrow rv">
            <span className="testi-eyebrow-line" />
            <span>TRAVELLERS SAY IT BETTER</span>
            <span className="testi-eyebrow-line" />
          </div>
          <h2 className="testi-title rv d1">
            Real Stories. <em>Lasting Memories.</em>
          </h2>
          <p className="testi-subtitle rv d2">
            Travellers from around the world share their unforgettable experiences with Escora.
          </p>
        </div>

        <div className="testi-carousel-wrapper">
          <div className="testi-carousel-stage">
            {TESTIMONIALS.map((t, i) => {
              const N = TESTIMONIALS.length;
              let diff = i - activeTestimonialIdx;
              if (diff > N / 2) diff -= N;
              if (diff < -N / 2) diff += N;

              const isCenter = diff === 0;
              const isLeft = diff === -1;
              const isRight = diff === 1;

              return (
                <div
                  key={i}
                  className={`testi-carousel-item${isCenter ? " is-center" : ""}${isLeft ? " is-left" : ""}${isRight ? " is-right" : ""}`}
                  style={{
                    transform: isCenter
                      ? "translateX(0) scale(1)"
                      : isLeft
                      ? "translateX(calc(-100% - 24px)) scale(0.96)"
                      : isRight
                      ? "translateX(calc(100% + 24px)) scale(0.96)"
                      : "translateX(0) scale(0.85)",
                    opacity: isCenter ? 1 : Math.abs(diff) === 1 ? 0.68 : 0,
                    pointerEvents: isCenter ? "auto" : Math.abs(diff) === 1 ? "auto" : "none",
                    zIndex: isCenter ? 5 : 2,
                  }}
                  onClick={() => {
                    if (!isCenter) setActiveTestimonialIdx(i);
                  }}
                  role={isCenter ? "group" : "button"}
                  tabIndex={isCenter ? undefined : 0}
                  aria-label={isCenter ? undefined : `View testimonial by ${t.name}`}
                  onKeyDown={(e) => {
                    if (!isCenter && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      setActiveTestimonialIdx(i);
                    }
                  }}
                >
                  <div className="testi-card">
                    {/* Left side: Travel Photo */}
                    <div className="testi-card-photo-wrap">
                      <img
                        src={t.photo}
                        alt={t.photoAlt}
                        className="testi-card-photo"
                        loading="lazy"
                      />
                    </div>

                    {/* Right side: Testimonial content */}
                    <div className="testi-card-body">
                      <div className="testi-quote-mark" aria-hidden="true">
                        <svg viewBox="0 0 32 24" width="32" height="24" fill="#c59a58">
                          <path d="M0 14.2c0-8.2 5.5-13.4 12.8-14.2l1.6 2.6C9.2 3.6 7 6.4 6.8 9.8c1.2-.4 2.6-.4 3.8.2 2.6 1.4 3.8 4.2 3.4 7-0.4 3-2.8 5.6-5.8 5.8-4.6.4-8.2-3.4-8.2-8.6zm17.6 0c0-8.2 5.5-13.4 12.8-14.2l1.6 2.6c-5.2 1-7.4 3.8-7.6 7.2 1.2-.4 2.6-.4 3.8.2 2.6 1.4 3.8 4.2 3.4 7-0.4 3-2.8 5.6-5.8 5.8-4.6.4-8.2-3.4-8.2-8.6z" />
                        </svg>
                      </div>

                      <blockquote
                        className="testi-quote-text"
                        dangerouslySetInnerHTML={{ __html: t.quote }}
                      />

                      <div className="testi-card-footer">
                        <div className="testi-author-info">
                          <img src={t.av} alt={t.name} className="testi-author-avatar" />
                          <div>
                            <div className="testi-author-name">{t.name}</div>
                            <div className="testi-author-meta">{t.meta}</div>
                          </div>
                        </div>

                        <div className="testi-rating" aria-label="5 out of 5 stars">
                          {"★".repeat(t.rating)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Left and Right navigation arrows overlapping the central card edges */}
            <button
              type="button"
              className="testi-nav-arrow prev"
              onClick={() => setActiveTestimonialIdx((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
              aria-label="Previous testimonial"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <button
              type="button"
              className="testi-nav-arrow next"
              onClick={() => setActiveTestimonialIdx((prev) => (prev + 1) % TESTIMONIALS.length)}
              aria-label="Next testimonial"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* Bottom pagination indicator pills */}
          <div className="testi-indicators" role="tablist" aria-label="Testimonial indicators">
            {TESTIMONIALS.map((t, idx) => (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={activeTestimonialIdx === idx}
                aria-label={`View testimonial from ${t.name}`}
                className={`testi-indicator-pill${activeTestimonialIdx === idx ? " is-active" : ""}`}
                onClick={() => setActiveTestimonialIdx(idx)}
              />
            ))}
          </div>
        </div>
      </section>
      <section className="enquiry-section-v2" id="contact" aria-label="Begin Your Journey">
        <div className="enquiry-bg-image" style={{ backgroundImage: "url('/assets/enquiry-sunset.jpg')" }} aria-hidden="true" />
        <div className="enquiry-bg-gradient" aria-hidden="true" />

        <div className="enquiry-container">
          <div className="enquiry-grid">
            {/* Left Column: Heading, description & contact info */}
            <div className="enquiry-left">
              <div className="enquiry-eyebrow rv">
                <span className="enquiry-eyebrow-dot" />
                BEGIN YOUR JOURNEY
              </div>
              <h2 className="enquiry-title rv d1">
                Start with a<br />
                blank <em>canvas.</em>
              </h2>
              <p className="enquiry-desc rv d2">
                Tell us the kind of journey you have in mind. A Kerala curator will write back within 24 hours with three options — yours to refine, reject or rearrange.
              </p>

              <div className="enquiry-contact-list rv d3">
                <div className="enquiry-contact-item">
                  <div className="enquiry-contact-badge">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                  </div>
                  <div>
                    <div className="enquiry-contact-lbl">WHATSAPP</div>
                    <a className="enquiry-contact-val" href="https://wa.me/918157003344" target="_blank" rel="noopener noreferrer">
                      +91 8157 003 344
                    </a>
                  </div>
                </div>

                <div className="enquiry-contact-item">
                  <div className="enquiry-contact-badge">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="enquiry-contact-lbl">EMAIL</div>
                    <a className="enquiry-contact-val" href="mailto:hello@escoraholidays.com">
                      hello@escoraholidays.com
                    </a>
                  </div>
                </div>

                <div className="enquiry-contact-item">
                  <div className="enquiry-contact-badge">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <div className="enquiry-contact-lbl">OFFICE</div>
                    <div className="enquiry-contact-val">
                      1st Floor, Landmark Maple Business Tower, Kozhikode, Kerala 673014
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Warm Ivory Enquiry Panel */}
            <div className="enquiry-right rv d2">
              <div className="enquiry-card-panel">
                <svg
                  className="enquiry-panel-botanical"
                  viewBox="0 0 160 160"
                  fill="none"
                  stroke="#c59a58"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M160 10 C130 30 100 70 80 140" />
                  <path d="M140 25 C145 12 158 8 160 10 C155 24 146 28 140 25 Z" />
                  <path d="M125 45 C115 35 118 20 128 20 C132 30 128 42 125 45 Z" />
                  <path d="M110 70 C125 65 135 50 130 42 C118 48 112 60 110 70 Z" />
                  <path d="M98 92 C85 82 86 68 96 66 C102 75 100 87 98 92 Z" />
                  <path d="M88 115 C102 110 110 96 104 88 C94 94 90 106 88 115 Z" />
                  <path d="M80 138 C70 126 72 112 82 110 C87 118 84 132 80 138 Z" />
                </svg>

                {enquirySent ? (
                  <div className="enquiry-success-view">
                    <div className="enquiry-success-icon">
                      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#c59a58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="enquiry-success-title">
                      Enquiry <em>received.</em>
                    </h3>
                    <p className="enquiry-success-desc">
                      A Kerala curator will write to you within 24 hours with three curated options. For a faster reply, message us on WhatsApp now.
                    </p>
                    <a
                      className="enquiry-submit-btn enquiry-success-wa"
                      href={`https://wa.me/918157003344?text=${buildWAMsg()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>Continue on WhatsApp</span>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="M12 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleEnquirySubmit} className="enquiry-form">
                    <div className="enquiry-panel-header">
                      <div className="enquiry-panel-eyebrow">
                        <span className="enquiry-eyebrow-dot" />
                        SEND AN ENQUIRY
                      </div>
                      <p className="enquiry-panel-subtitle">
                        Share a few details and we'll plan your personalized Kerala journey.
                      </p>
                    </div>

                    <div className="enquiry-fields-grid">
                      <div className="enquiry-field">
                        <label htmlFor="form-name">YOUR NAME</label>
                        <div className="enquiry-input-box">
                          <svg className="enquiry-input-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          <input
                            id="form-name"
                            type="text"
                            placeholder="Priya / James…"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="enquiry-field">
                        <label htmlFor="form-phone">PHONE / WHATSAPP</label>
                        <div className="enquiry-input-box">
                          <svg className="enquiry-input-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          <input
                            id="form-phone"
                            type="tel"
                            placeholder="+91 …"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="enquiry-field">
                        <label htmlFor="form-email">EMAIL</label>
                        <div className="enquiry-input-box">
                          <svg className="enquiry-input-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="20" height="16" x="2" y="4" rx="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                          </svg>
                          <input
                            id="form-email"
                            type="email"
                            placeholder="you@email.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="enquiry-field">
                        <label htmlFor="form-type">TRAVEL TYPE</label>
                        <div className="enquiry-input-box">
                          <svg className="enquiry-input-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 20h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-1V4a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
                            <path d="M9 2v4h6V2" />
                            <line x1="12" y1="11" x2="12" y2="15" />
                          </svg>
                          <select
                            id="form-type"
                            value={form.type}
                            onChange={(e) => setForm({ ...form, type: e.target.value })}
                          >
                            <option value="">— Select journey type —</option>
                            <option>Honeymoon</option>
                            <option>Health &amp; Wellness</option>
                            <option>Nature &amp; Wildlife</option>
                            <option>Hill Stations</option>
                            <option>Backwaters</option>
                            <option>Beaches</option>
                            <option>Functional Medicine</option>
                            <option>Historical &amp; Heritage</option>
                            <option>Not sure yet — help me plan</option>
                          </select>
                        </div>
                      </div>

                      <div className="enquiry-field">
                        <label htmlFor="form-dates">APPROXIMATE DATES</label>
                        <div className="enquiry-input-box">
                          <svg className="enquiry-input-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <input
                            id="form-dates"
                            type="text"
                            placeholder="e.g. Nov 2026, 7 nights"
                            value={form.dates}
                            onChange={(e) => setForm({ ...form, dates: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="enquiry-field">
                        <label htmlFor="form-pax">NUMBER OF TRAVELLERS</label>
                        <div className="enquiry-input-box">
                          <svg className="enquiry-input-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          <select
                            id="form-pax"
                            value={form.pax}
                            onChange={(e) => setForm({ ...form, pax: e.target.value })}
                          >
                            <option>2 adults (couple)</option>
                            <option>1 adult (solo)</option>
                            <option>Family with children</option>
                            <option>Small group (4–8)</option>
                          </select>
                        </div>
                      </div>

                      <div className="enquiry-field enquiry-field-full">
                        <label htmlFor="form-budget">BUDGET ( ₹ INR, APPROX. )</label>
                        <div className="enquiry-input-box">
                          <span className="enquiry-currency-icon">₹</span>
                          <input
                            id="form-budget"
                            type="text"
                            placeholder="e.g. ₹5–10 lakhs"
                            value={form.budget}
                            onChange={(e) => setForm({ ...form, budget: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="enquiry-note-divider">
                      <span className="enquiry-divider-line" />
                      <span>KERALA · INDIA — NABH ACCREDITED RETREAT</span>
                      <span className="enquiry-divider-line" />
                    </div>

                    {enquiryError && <p className="enquiry-error-msg">{enquiryError}</p>}

                    <div className="enquiry-buttons-row">
                      <button className="enquiry-submit-btn" type="submit" disabled={createEnquiry.isPending}>
                        <span>{createEnquiry.isPending ? "SENDING…" : "SEND ENQUIRY"}</span>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14" />
                          <path d="M12 5l7 7-7 7" />
                        </svg>
                      </button>

                      <a
                        className="enquiry-wa-btn"
                        href={`https://wa.me/918157003344?text=${encodeURIComponent(
                          form.name || form.phone
                            ? `Hello Escora — I'd like to plan a Kerala journey.\nName: ${form.name || "Traveller"}\nPhone: ${form.phone || ""}`
                            : "Hello Escora — I'd like to plan a Kerala journey."
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                        <span>WHATSAPP US</span>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14" />
                          <path d="M12 5l7 7-7 7" />
                        </svg>
                      </a>
                    </div>

                    <div className="enquiry-features-row">
                      <div className="enquiry-feature-item">
                        <svg className="enquiry-feature-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#b08745" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <div className="enquiry-feature-text">
                          <strong>REPLY WITHIN</strong>
                          <span>24 HOURS</span>
                        </div>
                      </div>

                      <div className="enquiry-feature-divider" />

                      <div className="enquiry-feature-item">
                        <svg className="enquiry-feature-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#b08745" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                        <div className="enquiry-feature-text">
                          <strong>THREE CURATED</strong>
                          <span>OPTIONS</span>
                        </div>
                      </div>

                      <div className="enquiry-feature-divider" />

                      <div className="enquiry-feature-item">
                        <svg className="enquiry-feature-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#b08745" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 20A7 7 0 0 1 4 13c0-4.42 3.58-8 8-8 1.5 0 2.9.41 4.1 1.13L20 2v4.87c.72 1.2 1.13 2.6 1.13 4.13 0 4.42-3.58 8-8 8h-2.13z" />
                          <path d="M4 13l8 8" />
                        </svg>
                        <div className="enquiry-feature-text">
                          <strong>YOURS TO REFINE,</strong>
                          <span>REJECT OR REARRANGE</span>
                        </div>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

    </Layout>
  );
}
