import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useListPackages, useListDestinations, useCreateEnquiry } from "@workspace/api-client-react";
import Layout from "@/components/layout/Layout";
import { useSeo } from "@/hooks/useSeo";
import { ExploreCoverflow } from "@/components/ExploreCoverflow";
import { MapPin, Compass, Calendar, Users, Search, ChevronDown } from "lucide-react";
import "./home-v2.css";

const FALLBACK_PACKAGES = [
  { id: 1, name: "The Malabar Escape", durationNights: 5, route: "Kochi · Munnar · Alleppey", category: "Honeymoon", priceFrom: 150000, heroImageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80", description: "A private five-night journey through Kerala's most iconic backwaters, spice gardens and heritage hotels.", featured: true },
  { id: 2, name: "Cardamom Hills Retreat", durationNights: 4, route: "Munnar · Thekkady", category: "Wellness", priceFrom: 120000, heroImageUrl: "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?auto=format&fit=crop&w=800&q=80", description: "Four nights among Kerala's cardamom and tea estates with yoga, ayurveda and forest walks.", featured: true },
  { id: 3, name: "Wayanad Wilds", durationNights: 3, route: "Calicut · Wayanad", category: "Adventure", priceFrom: 90000, heroImageUrl: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80", description: "Three nights in Wayanad's tribal heartland — jungle treks, waterfalls and forest living.", featured: true },
  { id: 4, name: "Spice Coast Odyssey", durationNights: 7, route: "Kochi · Marari · Kumarakom", category: "Culture", priceFrom: 220000, heroImageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80", description: "Seven nights tracing the ancient spice trade across Kerala's storied coast and backwaters.", featured: false },
];

import escoraLogo from "@assets/escora/escora-logo-green.png";
import heroBg from "@assets/escora/hero-bg.jpeg";
import { KERALA_DESTINATIONS, DESTINATION_BADGES } from "@/lib/keralaDestinations";

const FALLBACK_DESTINATIONS = KERALA_DESTINATIONS;

const HERO_DESTINATIONS = [
  { id: "munnar", name: "Munnar", src: DESTINATION_BADGES.munnar },
  { id: "alleppey", name: "Alleppey", src: DESTINATION_BADGES.alleppey },
  { id: "varkala", name: "Varkala", src: DESTINATION_BADGES.varkala },
  { id: "wayanad", name: "Wayanad", src: DESTINATION_BADGES.wayanad },
  { id: "kumarakom", name: "Kumarakom", src: DESTINATION_BADGES.kumarakom },
  { id: "thekkady", name: "Thekkady", src: DESTINATION_BADGES.thekkady },
  { id: "fort-kochi", name: "Fort Kochi", src: DESTINATION_BADGES["fort-kochi"] },
  { id: "bekal", name: "Bekal", src: DESTINATION_BADGES.bekal },
  { id: "kovalam", name: "Kovalam", src: DESTINATION_BADGES.kovalam },
  { id: "kannur", name: "Kannur", src: DESTINATION_BADGES.kannur },
];

/* ── Static data ── */
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

const RETREAT_CARDS = [
  {
    icon: (
      <svg viewBox="0 0 24 24"><path d="M12 2c1 4-2 6-2 10a4 4 0 0 0 8 0c0-4-3-6-2-10"/><path d="M8 18.5c0 1.5 1.8 2.5 4 2.5s4-1 4-2.5"/></svg>
    ),
    title: <>Ayurveda &amp; <em>Panchakarma</em></>,
    desc: "Physician-led detox in the classical Keraliya tradition — pulse diagnosis, medicated oils prepared in-house, shirodhara and rasayana.",
    offers: ["Panchakarma", "Abhyanga", "Shirodhara", "Rasayana"],
    from: "₹14,500 / night",
    delay: "",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><path d="M5 20l2-8h10l2 8"/><path d="M12 10v5"/></svg>
    ),
    title: <>Yoga &amp; <em>Meditation</em></>,
    desc: "Lakeside sunrise practice from gentle Hatha to disciplined Ashtanga, with pranayama and yoga nidra to settle the mind.",
    offers: ["Hatha", "Ashtanga", "Pranayama", "Yoga Nidra"],
    from: "₹8,200 / night",
    delay: "d1",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24"><path d="M13 4l3 8-8-3 5 5-8 3 3-8 5 5z"/></svg>
    ),
    title: <>Kalaripayattu — <em>the art</em></>,
    desc: "The world's oldest martial art, taught at a traditional kalari by a Gurukkal — forms, footwork and healing marma therapy.",
    offers: ["Meipayattu", "Kolthari", "Marma", "Uzhichil"],
    from: "₹6,500 / session",
    delay: "d2",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
    ),
    title: <>Naturopathy &amp; <em>Healthcare</em></>,
    desc: "Doctor-supervised detox, therapeutic diet, physiotherapy and lifestyle medicine — with full medical reports and home aftercare.",
    offers: ["Naturopathy", "Detox", "Physio", "Diet"],
    from: "₹11,000 / night",
    delay: "d3",
  },
];

const TESTIMONIALS = [
  {
    cat: "Honeymoon · Mar 2025",
    quote: '"They moved a sunset for us. Or it felt that way. A boat appeared on a backwater I\'d been told didn\'t exist — and a chef I\'d long admired was on it."',
    av: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
    name: "Eleanor V.", meta: "London · Honeymoon", delay: "",
  },
  {
    cat: "Family · Dec 2024",
    quote: '"Our family of seven, ages 6 to 78. The itinerary anticipated every single one of us."',
    av: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
    name: "Marcus T.", meta: "San Francisco · Family", delay: "d1",
  },
  {
    cat: "Wellness · Oct 2024",
    quote: '"Escora did not arrange a holiday — they arranged a <em>recovery</em>."',
    av: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
    name: "Dr. Aiko N.", meta: "Tokyo · Wellness", delay: "d2",
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

const LOADER_STORAGE_KEY = "escora-loader-last-seen";

function hasSeenLoaderToday() {
  try {
    return localStorage.getItem(LOADER_STORAGE_KEY) === new Date().toDateString();
  } catch {
    return false;
  }
}

export default function Home() {
  const [loaded, setLoaded] = useState(hasSeenLoaderToday);
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

  // Hero ESCORA destination clippath slideshow state
  const [heroDestIdx, setHeroDestIdx] = useState(0);
  const [heroMouseOffset, setHeroMouseOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Preload all destination images for zero-delay transitions
    HERO_DESTINATIONS.forEach((d) => {
      const img = new window.Image();
      img.src = d.src;
    });

    const timer = setInterval(() => {
      setHeroDestIdx((current) => (current + 1) % HERO_DESTINATIONS.length);
    }, 5600);

    return () => clearInterval(timer);
  }, []);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    setHeroMouseOffset({
      x: Math.round(relX * 16),
      y: Math.round(relY * 10),
    });
  };

  const handleHeroMouseLeave = () => {
    setHeroMouseOffset({ x: 0, y: 0 });
  };

  const [form, setForm] = useState<EnquiryForm>({
    name: "", phone: "", email: "", type: "", dates: "", pax: "2 adults (couple)", budget: "",
  });
  const createEnquiry = useCreateEnquiry();

  const categoriesRef = useRef<HTMLElement>(null);
  const packagesRef = useRef<HTMLElement>(null);
  const exploreSectionRef = useRef<HTMLElement>(null);

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

  /* Loader — only plays once per day */
  useEffect(() => {
    if (loaded) return;
    const t = setTimeout(() => {
      setLoaded(true);
      try {
        localStorage.setItem(LOADER_STORAGE_KEY, new Date().toDateString());
      } catch {
        /* private browsing or storage disabled — loader will just replay next visit */
      }
    }, 1700);
    return () => clearTimeout(t);
  }, [loaded]);

  /* Scroll reveal for .rv and .mr2 */
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -5% 0px" }
    );
    document.querySelectorAll(".rv, .mr2").forEach((el) => io.observe(el));
    /* Also reveal elements already in view */
    const heroEls = document.querySelectorAll(".hero2 .rv, .hero2 .mr2");
    const t = setTimeout(() => heroEls.forEach((el) => el.classList.add("in")), 200);
    return () => { io.disconnect(); clearTimeout(t); };
  }, [loaded]);

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

  /* Scroll to categories + activate filter */
  function jumpToCategory(id: string) {
    setActiveCat(id === "all" ? "all" : id);
    setActiveFilter(id === "all" ? "all" : id);
    const el = id === "all" ? categoriesRef.current : packagesRef.current;
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: "smooth" });
  }

  /* Cat strip click → sync pkg filter + scroll to packages */
  function onCatStripClick(id: string) {
    setActiveCat(id);
    setActiveFilter(id);
    if (packagesRef.current) {
      window.scrollTo({ top: packagesRef.current.getBoundingClientRect().top + window.scrollY - 120, behavior: "smooth" });
    }
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
        window.scrollTo({
          top: exploreSectionRef.current.getBoundingClientRect().top + window.scrollY - 120,
          behavior: "smooth",
        });
        return;
      }
    }
    if (categoriesRef.current) {
      window.scrollTo({
        top: categoriesRef.current.getBoundingClientRect().top + window.scrollY - 120,
        behavior: "smooth",
      });
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
      {/* ── Loader ── */}
      <div className={`loader${loaded ? " done" : ""}`} aria-hidden="true">
        <div className="stack">
          <img className="logo-img" src={escoraLogo} alt="Escora" />
        </div>
        <div className="bar" />
        <div className="count">Kerala · for the global traveller</div>
      </div>

      {/* ═══════════════════════════════ HERO EDITORIAL ═══════════════════════════════ */}
      <section className="hero-editorial" aria-label="Escora — Kerala, your way">
        <div
          className="hero-art-bg"
          style={{ backgroundImage: `url(${heroBg})` }}
          aria-hidden="true"
        />


        {/* Center Editorial Typography & Branding */}
        <div className="hero-center-content">
          <p className="hero-kicker">JOURNEYS THROUGH</p>

          <div
            className="hero-brand-wrap"
            onMouseMove={handleHeroMouseMove}
            onMouseLeave={handleHeroMouseLeave}
          >
            <h1 className="hero-main-title-sr">ESCORA</h1>

            <svg
              className="hero-main-title-svg"
              viewBox="0 0 1000 150"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              <defs>
                <clipPath id="escora-text-clip">
                  <text
                    x="500"
                    y="126"
                    textAnchor="middle"
                    fontFamily="'Cinzel', 'Playfair Display', 'Cormorant Garamond', Georgia, serif"
                    fontWeight="700"
                    fontSize="146"
                    letterSpacing="0.05em"
                  >
                    ESCORA
                  </text>
                </clipPath>

                <linearGradient id="escora-editorial-tint" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0a170d" stopOpacity="0.82" />
                  <stop offset="38%" stopColor="#122517" stopOpacity="0.32" />
                  <stop offset="75%" stopColor="#0e1d12" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#071009" stopOpacity="0.55" />
                </linearGradient>

                <filter id="escora-text-depth" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="2.5" stdDeviation="3.5" floodColor="#000000" floodOpacity="0.1" />
                </filter>
              </defs>

              <g clipPath="url(#escora-text-clip)" filter="url(#escora-text-depth)">
                {/* Dark baseline fill */}
                <rect width="100%" height="100%" fill="#122417" />

                {/* Slideshow of destination images with parallax and Ken Burns zoom */}
                {HERO_DESTINATIONS.map((dest, i) => {
                  const isActive = i === heroDestIdx;

                  return (
                    <g
                      key={dest.id}
                      className={`escora-dest-slide ${isActive ? "is-active" : ""}`}
                      style={{
                        transform: `translate(${heroMouseOffset.x}px, ${heroMouseOffset.y}px)`,
                      }}
                    >
                      <image
                        href={dest.src}
                        x="-14%"
                        y="-14%"
                        width="128%"
                        height="128%"
                        preserveAspectRatio="xMidYMid slice"
                        className={`escora-zoom-img ${isActive ? "anim-active" : ""}`}
                      />
                    </g>
                  );
                })}

                {/* Editorial emerald luxury tint overlay */}
                <rect
                  width="100%"
                  height="100%"
                  fill="url(#escora-editorial-tint)"
                  style={{ mixBlendMode: "multiply", pointerEvents: "none" }}
                />
              </g>
            </svg>
          </div>

          <div className="hero-subtitle">
            <span className="sub-kerala">Kerala,</span>
            <span className="sub-yourway">your way.</span>
          </div>

          <p className="hero-tagline">
            PRIVATE JOURNEYS, THOUGHTFULLY CRAFTED AROUND YOU.
          </p>
        </div>

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

      {/* ── Marquee ── */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          <div>
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span key={i} className="marquee-item">{item}<span className="sep" /></span>
            ))}
          </div>
        </div>
      </div>


      {/* ═══════════════════════ CATEGORY BENTO GRID ═══════════════════════ */}
      <section className="cat-section" id="categories" ref={categoriesRef}>
        <div className="wrap">
          <div className="cat-section-head">
            <div>
              <div className="eyebrow rv"><span className="dot" />Nº 01 — Travel by Type</div>
              <h2 className="display-md rv d2" style={{ marginTop: 16, maxWidth: "20ch" }}>
                Eight ways to discover <em style={{ fontStyle: "italic", color: "var(--gold-bright)" }}>Kerala</em>.
              </h2>
            </div>
            <p className="rv d3" style={{ maxWidth: "38ch", color: "var(--ink-mute)", fontSize: 14, lineHeight: 1.65, textAlign: "right" }}>
              Choose your travel personality — we'll compose a journey from scratch, entirely around you.
            </p>
          </div>

          {/* 5-card bento */}
          <div className="cat-bento">
            {CAT_CARDS.map((card, i) => (
              <Link
                key={card.id}
                href={`/collections/${card.id}`}
                className={`cat-card rv${i > 0 ? ` d${i}` : ""}`}
                aria-label={`${card.label} journeys in Kerala`}
                style={{ textAlign: "left", display: "block" }}
              >
                <div className="bg-img" style={{ backgroundImage: `url('${card.img}')` }} />
                <div className="scrim" />
                <span className="c-label">{card.label}</span>
                <div className="content">
                  <div className="c-name">{card.name}</div>
                  <div className="c-reveal">
                    <p>{card.desc}</p>
                  </div>
                  <div className="c-meta">
                    <div>
                      <div className="c-count">{card.count}</div>
                    </div>
                    <div>
                      <div className="c-cta">Explore <span className="arr" /></div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Beaches · Functional Medicine · Historical & Heritage — row of 3 */}
          <div className="cat-row3">
            {CAT_CARDS_ROW2.map((card) => (
              <Link
                key={card.id}
                href={`/collections/${card.id}`}
                className="cat-card rv"
                aria-label={`${card.label} journeys in Kerala`}
                style={{ textAlign: "left", display: "block" }}
              >
                <div className="bg-img" style={{ backgroundImage: `url('${card.img}')` }} />
                <div className="scrim" />
                <span className="c-label">{card.label}</span>
                <div className="content">
                  <div className="c-name" style={{ fontSize: "clamp(28px,3.5vw,48px)" }}>{card.name}</div>
                  <div className="c-reveal">
                    <p>{card.desc}</p>
                  </div>
                  <div className="c-meta">
                    <div className="c-count">{card.count}</div>
                    <div className="c-cta">Explore <span className="arr" /></div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Mobile swipe hint */}
          <p className="cat-swipe-hint">Swipe to explore all 8 journeys</p>
        </div>
      </section>

      {/* ═══════════════════════ EXPLORE KERALA ═══════════════════════ */}
      <section className="cat-section" id="explore-kerala" ref={exploreSectionRef}>
        <div className="wrap">
          <div className="cat-section-head">
            <div>
              <div className="eyebrow rv"><span className="dot" />Explore Kerala</div>
              <h2 className="display-md rv d2 explore-heading" style={{ marginTop: 16 }}>
                From Varkala's cliffs to <em style={{ fontStyle: "italic", color: "var(--gold-bright)" }}>Kannur's shores</em>.
              </h2>
            </div>
          </div>

          <ExploreCoverflow destinations={exploreDestinations} />
        </div>
      </section>

      {/* ═══════════════════════ WHY ESCORA ════════════════════════════ */}
      <section className="why-escora-section">
        <div className="wrap">
          <div className="why-escora-head rv">
            <div className="eyebrow"><span className="dot" />Nº 02 — Why Escora</div>
            <h2 className="display-md" style={{ marginTop: 16, maxWidth: "28ch" }}>
              Why the world's discerning travellers <em style={{ fontStyle: "italic", color: "var(--gold-bright)" }}>choose Escora</em>
            </h2>
            <p style={{ color: "var(--ink-mute)", fontSize: 15, lineHeight: 1.75, maxWidth: "48ch", marginTop: 16 }}>
              We don't sell packages. We compose journeys — built entirely around you, from the first conversation to the final farewell.
            </p>
          </div>
          <div className="why-escora-grid">
            {[
              {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                title: "Completely Private Journeys",
                desc: "No shared buses. No fixed departures. Every element of your trip is exclusive to you and your group.",
              },
              {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6v6l4 2"/></svg>,
                title: "Kerala Specialists",
                desc: "One destination. A decade of local expertise. We know every road, every estate, every chef worth knowing.",
              },
              {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
                title: "Handpicked Stays",
                desc: "Every hotel, homestay and houseboat is personally inspected by our team before it earns a place in your itinerary.",
              },
              {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
                title: "Local Curators",
                desc: "Your guides, planners and hosts are people who actually live in Kerala — born here, rooted here, and fluent in English.",
              },
              {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.26h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
                title: "24 × 7 Concierge",
                desc: "Support before, during and after travel. A real person answers — not a chatbot.",
              },
              {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
                title: "Fully Tailored",
                desc: "Nothing is pre-packaged. Your dates, your pace, your companions, your interests — built from a blank canvas.",
              },
            ].map((item, i) => (
              <div key={i} className={`why-card rv${i > 0 ? ` d${Math.min(i, 3)}` : ""}`}>
                <div className="why-icon">{item.icon}</div>
                <div className="why-check">✓</div>
                <h4 className="why-title">{item.title}</h4>
                <p className="why-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ PLANNING PROCESS ════════════════════════════ */}
      <section className="process-section">
        <div className="wrap">
          <div className="process-head rv">
            <div className="eyebrow"><span className="dot" />Nº 03 — How It Works</div>
            <h2 className="display-md" style={{ marginTop: 16, maxWidth: "24ch" }}>
              How your <em style={{ fontStyle: "italic", color: "var(--gold-bright)" }}>journey begins</em>
            </h2>
            <p style={{ color: "var(--ink-mute)", fontSize: 15, lineHeight: 1.75, maxWidth: "48ch", marginTop: 16 }}>
              Luxury clients deserve to know exactly what happens after they reach out. Here's how we build your journey — from first message to final farewell.
            </p>
          </div>
          <div className="process-steps">
            {[
              { n: "01", title: "Tell us your dream", desc: "Share your travel style, dates, who you're travelling with and what you're hoping to feel. No form is too vague — we work with ideas as much as specifics." },
              { n: "02", title: "Speak with a Kerala curator", desc: "Within 24 hours, a dedicated Escora curator calls or messages you. We ask questions most agents never think to ask." },
              { n: "03", title: "Receive your bespoke itinerary", desc: "Your curator crafts a day-by-day journey — hand-selected stays, private experiences, local access — presented for your review." },
              { n: "04", title: "Refine together", desc: "Nothing is locked until you love it. We adjust, swap and rethink until every detail feels exactly right." },
              { n: "05", title: "Travel with concierge support", desc: "From airport arrival to final departure, your Escora concierge is on call. Every day. Every hour. Any situation." },
              { n: "06", title: "Post-trip support", desc: "Once you're home, we're still here. Memories shared, feedback welcomed, and your next Kerala chapter ready to begin whenever you are." },
            ].map((step, i) => (
              <div key={i} className={`process-step rv${i > 0 ? ` d${Math.min(i, 3)}` : ""}`}>
                <div className="step-num">{step.n}</div>
                <div className="step-body">
                  <h4 className="step-title">{step.title}</h4>
                  <p className="step-desc">{step.desc}</p>
                </div>
                {i < 5 && <div className="step-arrow">↓</div>}
              </div>
            ))}
          </div>
          <div className="process-cta rv">
            <a className="btn primary" href="#contact">Start the conversation <span className="arrow" /></a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ STATS BAND ════════════════════════════ */}
      <div className="stats-band">
        <div className="inner">
          {[
            { n: "10", l: "Years on the ground" },
            { n: "2,400+", l: "Journeys composed" },
            { n: "14", l: "Regions of Kerala" },
            { n: "98%", l: "Return guests" },
          ].map((s, i) => (
            <div key={i} className={`stat-cell rv${i > 0 ? ` d${i}` : ""}`}>
              <div className="n">{s.n}</div>
              <div className="l">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════ ESCORA RETREAT ════════════════════════════ */}
      <section className="retreat2" id="retreat">
        <div className="wrap">
          <div className="head">
            <div>
              <div className="eyebrow rv"><span className="dot" />Nº 04 — Escora Retreat</div>
              <h2 className="display-md rv d2" style={{ marginTop: 16, maxWidth: "18ch" }}>
                Healing, the <em style={{ fontStyle: "italic", color: "var(--gold-bright)" }}>Kerala</em> way.
              </h2>
            </div>
            <div className="rv d3">
              <p style={{ color: "var(--ink-mute)", fontSize: 14.5, lineHeight: 1.7, maxWidth: "50ch", marginBottom: 28 }}>
                Set on the quiet shore of Vembanad Lake — our NABH-accredited wellness home, where physicians, yogis and kalari masters work as one. Every programme is composed for you alone.
              </p>
              <a className="btn primary" href="#contact">Enquire about the Retreat <span className="arrow" /></a>
            </div>
          </div>

          <div className="retreat2-row">
            {RETREAT_CARDS.map((r, i) => (
              <div key={i} className={`rcard rv${r.delay ? ` ${r.delay}` : ""}`}>
                <div className="icon">{r.icon}</div>
                <h4>{r.title}</h4>
                <p>{r.desc}</p>
                <div className="offers">
                  {r.offers.map((o, j) => <span key={j}>{o}</span>)}
                </div>
                <div className="from" style={{ borderTop: "1px solid var(--line)", paddingTop: 16, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "var(--f-mono)", fontSize: 9, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--ink-mute)" }}>Enquire to book</span>
                  <span style={{ color: "var(--gold)", fontSize: 13 }}>→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ TESTIMONIALS ════════════════════════════ */}
      <section className="testi2">
        <div className="wrap">
          <div className="head">
            <div className="eyebrow rv"><span className="dot" />Nº 05 — From Our Travellers</div>
            <h2 className="display-sm rv d2" style={{ marginTop: 16, maxWidth: "22ch" }}>
              Quiet praise, from <em style={{ fontStyle: "italic", color: "var(--gold-bright)" }}>quiet</em> people.
            </h2>
          </div>
          <div className="testi2-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className={`t2card rv${t.delay ? ` ${t.delay}` : ""}`}>
                <div className="cat-dot">{t.cat}</div>
                <div className="stars">★ ★ ★ ★ ★</div>
                <blockquote dangerouslySetInnerHTML={{ __html: t.quote }} />
                <div className="who">
                  <div className="av" style={{ backgroundImage: `url('${t.av}')` }} />
                  <div>
                    <div className="nm">{t.name}</div>
                    <div className="mt">{t.meta}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ CTA + INLINE ENQUIRY FORM ═══════════════════ */}
      <section className="cta2" id="contact">
        <div className="bg-img" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=2400&q=80')" }} />
        <div className="wrap">
          <div className="left">
            <div className="eyebrow rv" style={{ marginBottom: 22 }}><span className="dot" />Nº 06 — Begin</div>
            <h2 className="rv d1">Start with a<br/>blank <em>canvas</em>.</h2>
            <p className="lede rv d2">
              Tell us the kind of journey you have in mind. A Kerala curator will write back within 24 hours with three options — yours to refine, reject or rearrange.
            </p>
            <div className="contact-info rv d3">
              {[
                { lbl: "WhatsApp", val: "+91 8157 003 344", href: "https://wa.me/918157003344" },
                { lbl: "Email", val: "hello@escoraholidays.com", href: "mailto:hello@escoraholidays.com" },
                { lbl: "Office", val: "1st Floor, Landmark Maple Business Tower, Kozhikode, Kerala 673014", href: "#" },
              ].map((row, i) => (
                <div key={i} className="c-info-row">
                  <div className="bar" />
                  <div>
                    <div className="lbl">{row.lbl}</div>
                    <a href={row.href}>{row.val}</a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rv d2">
            {enquirySent ? (
              <div className="iform" style={{ textAlign: "center", padding: "36px 0", display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>
                <div style={{ width: 60, height: 60, border: "1px solid var(--gold)", borderRadius: "50%", display: "grid", placeItems: "center" }}>
                  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="var(--gold)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <p style={{ fontFamily: "var(--f-display)", fontSize: 30, color: "var(--ink)", fontWeight: 400 }}>
                  Enquiry <em style={{ fontStyle: "italic", color: "var(--gold-bright)" }}>received</em>.
                </p>
                <p style={{ color: "var(--ink-mute)", fontSize: 14, maxWidth: "38ch", lineHeight: 1.65 }}>
                  A Kerala curator will write to you within 24 hours. For a faster reply, message us on WhatsApp now.
                </p>
                <a className="btn primary" href={`https://wa.me/918157003344?text=${buildWAMsg()}`} target="_blank" rel="noopener noreferrer">
                  Continue on WhatsApp <span className="arrow" />
                </a>
              </div>
            ) : (
              <form className="iform" onSubmit={handleEnquirySubmit}>
                <div className="eyebrow form-ey"><span className="dot" />Send an Enquiry</div>
                <div className="irow">
                  <div className="ifield">
                    <label htmlFor="form-name">Your name</label>
                    <input id="form-name" type="text" placeholder="Priya / James…" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="ifield">
                    <label htmlFor="form-phone">Phone / WhatsApp</label>
                    <input id="form-phone" type="tel" placeholder="+91 …" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                  </div>
                </div>
                <div className="irow">
                  <div className="ifield">
                    <label htmlFor="form-email">Email</label>
                    <input id="form-email" type="email" placeholder="you@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <div className="ifield">
                    <label htmlFor="form-type">Travel type</label>
                    <select id="form-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
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
                <div className="irow">
                  <div className="ifield">
                    <label htmlFor="form-dates">Approximate dates</label>
                    <input id="form-dates" type="text" placeholder="e.g. Nov 2026, 7 nights" value={form.dates} onChange={(e) => setForm({ ...form, dates: e.target.value })} />
                  </div>
                </div>
                <div className="irow">
                  <div className="ifield">
                    <label htmlFor="form-pax">Number of travellers</label>
                    <select id="form-pax" value={form.pax} onChange={(e) => setForm({ ...form, pax: e.target.value })}>
                      <option>2 adults (couple)</option>
                      <option>1 adult (solo)</option>
                      <option>Family with children</option>
                      <option>Small group (4–8)</option>
                    </select>
                  </div>
                  <div className="ifield">
                    <label htmlFor="form-budget">Budget (₹ INR, approx.)</label>
                    <input id="form-budget" type="text" placeholder="e.g. ₹5–10 lakhs" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
                  </div>
                </div>
                <div className="form-note-sm">Kerala · India — NABH Accredited Retreat</div>
                {enquiryError && <p style={{ color: "#c0392b", fontSize: 13, marginTop: 8 }}>{enquiryError}</p>}
                <div className="form-actions">
                  <button className="btn primary" type="submit" disabled={createEnquiry.isPending}>
                    {createEnquiry.isPending ? "Sending…" : "Send Enquiry"} <span className="arrow" />
                  </button>
                  <a className="btn" href={`https://wa.me/918157003344?text=Hello%20Escora%20%E2%80%94%20I'd%20like%20to%20plan%20a%20Kerala%20journey.`} target="_blank" rel="noopener noreferrer">
                    WhatsApp us <span className="arrow" />
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

    </Layout>
  );
}
