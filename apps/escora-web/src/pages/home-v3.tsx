import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useListDestinations, useCreateEnquiry } from "@workspace/api-client-react";
import Layout from "@/components/layout/Layout";
import { useSeo } from "@/hooks/useSeo";
import { useAutoScrollStrip } from "@/hooks/useAutoScrollStrip";
import { KERALA_DESTINATIONS, DESTINATION_BADGES } from "@/lib/keralaDestinations";
import "./home-v3.css";

import heroBg from "@assets/escora/hero-bg.jpeg";
import heroMunnar from "@assets/escora/collections/munnar-tea-estate.jpeg";
import heroHills from "@assets/escora/collections/hill-stations-hero.jpg";
import heroKuttanad from "@assets/escora/collections/kuttanad-rice-fields.webp";
import heroWayanad from "@assets/escora/collections/wayanad-forest-stay.jpeg";
import heroAlleppey from "@assets/escora/collections/alleppey-backwaters.jpeg";
import honeymoonHero from "@assets/escora/collections/honeymoon-hero.jpg";
import natureWildlifeHero from "@assets/escora/collections/nature-wildlife-hero.jpg";
import hillStationGeneric from "@assets/escora/collections/hill-station-generic.jpeg";
import backwatersHero from "@assets/escora/collections/backwaters-hero.webp";
import varkalaCliffs from "@assets/escora/collections/varkala-cliffs.jpeg";
import medicalTourism from "@assets/escora/collections/medical-tourism.jpeg";
import fortKochiHeritage from "@assets/escora/collections/fort-kochi-heritage.jpg";
import panchakarma from "@assets/escora/collections/panchakarma.jpg";
import padmanabhapuramPalace from "@assets/escora/collections/padmanabhapuram-palace.jpg";
import sattvicKitchen from "@assets/escora/collections/sattvic-kitchen.webp";

const YOGA_IMG = "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80";

/* ── Static data ── */
const HERO_SLIDES = [
  { img: heroBg, place: "Kerala · Private Slow Journeys" },
  { img: heroMunnar, place: "Munnar · Tea country" },
  { img: heroHills, place: "Western Ghats · Shola hills" },
  { img: heroKuttanad, place: "Kuttanad · Rice bowl of Kerala" },
  { img: heroWayanad, place: "Wayanad · Forest hideaways" },
  { img: heroAlleppey, place: "Alleppey · Backwaters" },
];
const HERO_INTERVAL_MS = 6500;

const WHY_POINTS = [
  {
    icon: <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    title: "Completely Private Journeys",
    desc: "No shared buses. No fixed departures. Every element of your trip is exclusive to you and your group.",
  },
  {
    icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
    title: "Kerala Specialists",
    desc: "One destination. A decade of local expertise. We know every road, every estate, every chef worth knowing.",
  },
  {
    icon: <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    title: "Handpicked Stays",
    desc: "Every hotel, homestay and houseboat is personally inspected by our team before it earns a place in your itinerary.",
  },
  {
    icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    title: "Local Curators",
    desc: "Your guides, planners and hosts are people who actually live in Kerala — born here, rooted here, and fluent in English.",
  },
  {
    icon: <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.26h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    title: "24 × 7 Concierge",
    desc: "Support before, during and after travel. A real person answers — not a chatbot.",
  },
  {
    icon: <svg viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    title: "Fully Tailored",
    desc: "Nothing is pre-packaged. Your dates, your pace, your companions, your interests — built from a blank canvas.",
  },
];

const WAYS = [
  { id: "honeymoon", label: "Honeymoon", img: honeymoonHero, desc: "Candlelit houseboats, private shores and moments composed only for two." },
  { id: "health-wellness", label: "Health & Wellness", img: YOGA_IMG, desc: "Ayurveda, yoga and deep rest, guided by resident physicians." },
  { id: "nature-wildlife", label: "Nature & Wildlife", img: natureWildlifeHero, desc: "Tiger reserves, elephant corridors and shola forests with field naturalists." },
  { id: "hill-stations", label: "Hill Stations", img: hillStationGeneric, desc: "Tea gardens, cardamom forests and colonial planters' bungalows." },
  { id: "backwaters", label: "Backwaters", img: backwatersHero, desc: "Private kettuvallam on 900 km of lagoons and silent canals." },
  { id: "beaches", label: "Beaches", img: varkalaCliffs, desc: "Clifftop yoga at Varkala, white sands at Marari, fortress shores at Bekal." },
  { id: "functional-medicine", label: "Functional Medicine", img: medicalTourism, desc: "Advanced diagnostics and root-cause healing, where Ayurveda meets science." },
  { id: "historical-heritage", label: "Historical & Heritage", img: fortKochiHeritage, desc: "Fort Kochi's spice routes and five centuries of colonial layering." },
];
const WAYS_INTERVAL_MS = 3800;

const STATS = [
  { value: 10, suffix: "", label: "Years on the ground" },
  { value: 2400, suffix: "+", label: "Journeys composed" },
  { value: 14, suffix: "", label: "Regions of Kerala" },
  { value: 98, suffix: "%", label: "Return guests" },
];

const RETREATS = [
  {
    title: "Ayurveda & Panchakarma",
    sub: "Panchakarma · Abhyanga · Shirodhara · Rasayana",
    desc: "Physician-led detox in the classical Keraliya tradition — pulse diagnosis, medicated oils prepared in-house, shirodhara and rasayana.",
    img: panchakarma,
  },
  {
    title: "Yoga & Meditation",
    sub: "Hatha · Ashtanga · Pranayama · Yoga Nidra",
    desc: "Lakeside sunrise practice from gentle Hatha to disciplined Ashtanga, with pranayama and yoga nidra to settle the mind.",
    img: YOGA_IMG,
  },
  {
    title: "Kalaripayattu — the art",
    sub: "Meipayattu · Kolthari · Marma · Uzhichil",
    desc: "The world's oldest martial art, taught at a traditional kalari by a Gurukkal — forms, footwork and healing marma therapy.",
    img: padmanabhapuramPalace,
  },
  {
    title: "Naturopathy & Healthcare",
    sub: "Naturopathy · Detox · Physio · Diet",
    desc: "Doctor-supervised detox, therapeutic diet, physiotherapy and lifestyle medicine — with full medical reports and home aftercare.",
    img: sattvicKitchen,
  },
];

const PROCESS_STEPS = [
  {
    title: "Tell us your dream",
    desc: "Share your travel style, dates, who you're travelling with and what you're hoping to feel. No form is too vague — we work with ideas as much as specifics.",
    icon: <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  },
  {
    title: "Speak with a Kerala curator",
    desc: "Within 24 hours, a dedicated Escora curator calls or messages you. We ask questions most agents never think to ask.",
    icon: <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>,
  },
  {
    title: "Receive your bespoke itinerary",
    desc: "Your curator crafts a day-by-day journey — hand-selected stays, private experiences, local access — presented for your review.",
    icon: <svg viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  },
  {
    title: "Refine together",
    desc: "Nothing is locked until you love it. We adjust, swap and rethink until every detail feels exactly right.",
    icon: <svg viewBox="0 0 24 24"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
  },
  {
    title: "Travel with concierge support",
    desc: "From airport arrival to final departure, your Escora concierge is on call. Every day. Every hour. Any situation.",
    icon: <svg viewBox="0 0 24 24"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>,
  },
  {
    title: "Post-trip support",
    desc: "Once you're home, we're still here. Memories shared, feedback welcomed, and your next Kerala chapter ready to begin whenever you are.",
    icon: <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  },
];

const TESTIMONIALS = [
  {
    cat: "Honeymoon · Mar 2025",
    quote: "They moved a sunset for us. Or it felt that way. A boat appeared on a backwater I'd been told didn't exist — and a chef I'd long admired was on it.",
    av: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
    name: "Eleanor V.", meta: "London · Honeymoon",
  },
  {
    cat: "Family · Dec 2024",
    quote: "Our family of seven, ages 6 to 78. The itinerary anticipated every single one of us.",
    av: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
    name: "Marcus T.", meta: "San Francisco · Family",
  },
  {
    cat: "Wellness · Oct 2024",
    quote: "Escora did not arrange a holiday — they arranged a recovery.",
    av: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
    name: "Dr. Aiko N.", meta: "Tokyo · Wellness",
  },
];
const TESTI_INTERVAL_MS = 7000;

const HERO_SOCIAL = [
  { label: "Facebook", href: "https://www.facebook.com/people/Escora-holidays", icon: <path d="M13.5 21v-7.5h2.5l.4-3H13.5V8.5c0-.87.24-1.46 1.49-1.46h1.6V4.36C16.3 4.25 15.3 4.2 14.2 4.2c-2.3 0-3.86 1.4-3.86 3.98V10.5H7.8v3h2.54V21h3.16z" fill="currentColor" stroke="none" /> },
  { label: "Instagram", href: "https://www.instagram.com/escora_holidays", icon: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" /></> },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/escora-holidays/about/", icon: <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.114 20.452H3.558V9h3.556v11.452z" fill="currentColor" stroke="none" /> },
];

const TRAVEL_TYPES = [
  "Honeymoon", "Health & Wellness", "Nature & Wildlife", "Hill Stations", "Backwaters",
  "Beaches", "Functional Medicine", "Historical & Heritage", "Not sure yet — help me plan",
];

interface EnquiryForm {
  name: string; phone: string; email: string; type: string;
  dates: string; pax: string; budget: string; notes: string;
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/* Counts a stat up from 0 the first time it scrolls into view. */
function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(prefersReducedMotion() ? value : 0);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const DURATION = 1600;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION);
        const eased = 1 - Math.pow(1 - t, 3);
        setShown(Math.round(value * eased));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value]);

  return <span ref={ref}>{shown.toLocaleString("en-IN")}{suffix}</span>;
}

/* Wave geometry for the process timeline — one node per column, alternating
   low/high, joined by a smooth cubic curve. Coordinates are in a 1200×160
   viewBox that stretches to the grid's width. */
const WAVE_W = 1200;
const WAVE_H = 160;
const WAVE_LOW = 118;
const WAVE_HIGH = 42;
const waveNodes = PROCESS_STEPS.map((_, i) => ({
  x: (WAVE_W / PROCESS_STEPS.length) * (i + 0.5),
  y: i % 2 === 0 ? WAVE_LOW : WAVE_HIGH,
}));
const wavePath = (() => {
  const half = WAVE_W / PROCESS_STEPS.length / 2;
  let d = `M 0 ${WAVE_LOW - 18} C ${half * 0.6} ${WAVE_LOW - 8}, ${waveNodes[0].x - half * 0.6} ${WAVE_LOW}, ${waveNodes[0].x} ${waveNodes[0].y}`;
  for (let i = 1; i < waveNodes.length; i++) {
    const a = waveNodes[i - 1];
    const b = waveNodes[i];
    d += ` C ${a.x + half} ${a.y}, ${b.x - half} ${b.y}, ${b.x} ${b.y}`;
  }
  const last = waveNodes[waveNodes.length - 1];
  d += ` C ${last.x + half * 0.6} ${last.y}, ${WAVE_W - half * 0.6} ${last.y + 10}, ${WAVE_W} ${last.y + 16}`;
  return d;
})();

export default function HomeV3() {
  const [slide, setSlide] = useState(0);
  const [tourOpen, setTourOpen] = useState(false);
  const [way, setWay] = useState(0);
  const [wayAnimate, setWayAnimate] = useState(true);
  const [waysPaused, setWaysPaused] = useState(false);
  const [testi, setTesti] = useState(0);
  const [testiPaused, setTestiPaused] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);
  const [enquiryError, setEnquiryError] = useState("");
  const [form, setForm] = useState<EnquiryForm>({
    name: "", phone: "", email: "", type: "", dates: "", pax: "2 adults (couple)", budget: "", notes: "",
  });
  const createEnquiry = useCreateEnquiry();

  const planRef = useRef<HTMLElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const exploreScrollRef = useRef<HTMLDivElement>(null);

  useSeo({
    description: "Escora crafts luxury Kerala holiday packages — private honeymoon tours, Ayurveda retreats, backwater houseboat stays, and bespoke itineraries for discerning travellers from UK, Europe & the Gulf.",
    url: "https://www.escoraholidays.com/",
  });

  const { data: destinationsData } = useListDestinations({ published: true });
  const exploreDestinations = destinationsData && destinationsData.length > 0 ? destinationsData : KERALA_DESTINATIONS;
  useAutoScrollStrip(exploreScrollRef, [exploreDestinations]);

  /* Bidirectional scroll reveal for .rv and .mr2 */
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in", "card-in-view");
          } else {
            if (!e.target.closest(".v3-hero")) {
              e.target.classList.remove("in", "card-in-view");
            }
          }
        });
      },
      { threshold: [0, 0.12], rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".v3home .rv, .v3home .mr2").forEach((el) => io.observe(el));
    const heroEls = document.querySelectorAll(".v3-hero .rv, .v3-hero .mr2");
    const t = setTimeout(() => heroEls.forEach((el) => el.classList.add("in", "card-in-view")), 150);
    return () => { io.disconnect(); clearTimeout(t); };
  }, []);

  /* Hero slideshow */
  useEffect(() => {
    if (prefersReducedMotion() || tourOpen) return;
    const t = setTimeout(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), HERO_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [slide, tourOpen]);

  /* Eight-ways carousel. The track renders the eight cards twice; stepping
     past the last real card lands on its duplicate of card 1, then snaps
     back to the real card 1 with transitions off, so the loop is seamless. */
  useEffect(() => {
    if (waysPaused || prefersReducedMotion()) return;
    const t = setTimeout(() => stepWay(1), WAYS_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [way, waysPaused]);

  useEffect(() => {
    if (wayAnimate) return;
    // Re-enable transitions on the frame after an instant jump.
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setWayAnimate(true)));
    return () => cancelAnimationFrame(raf);
  }, [wayAnimate]);

  function stepWay(dir: 1 | -1) {
    if (prefersReducedMotion()) {
      // No transitions to wait on, so no duplicate-card trick — just wrap.
      setWay((w) => (w + dir + WAYS.length) % WAYS.length);
      return;
    }
    if (dir === -1 && way === 0) {
      // Jump (unanimated) to the duplicate of card 1, then animate back one.
      setWayAnimate(false);
      setWay(WAYS.length);
      requestAnimationFrame(() => requestAnimationFrame(() => { setWayAnimate(true); setWay(WAYS.length - 1); }));
      return;
    }
    setWay((w) => w + dir);
  }

  function onWaysTransitionEnd(e: React.TransitionEvent) {
    if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
    if (way >= WAYS.length) {
      setWayAnimate(false);
      setWay(way - WAYS.length);
    }
  }

  /* Testimonials — rotates the highlighted (centre) card */
  useEffect(() => {
    if (testiPaused || prefersReducedMotion()) return;
    const t = setTimeout(() => setTesti((i) => (i + 1) % TESTIMONIALS.length), TESTI_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [testi, testiPaused]);

  /* Watch-tour modal — close on Escape */
  useEffect(() => {
    if (!tourOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setTourOpen(false); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [tourOpen]);

  function scrollToPlan(prefill?: Partial<EnquiryForm>) {
    if (prefill) setForm((f) => ({ ...f, ...prefill }));
    const el = planRef.current;
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: "smooth" });
    setTimeout(() => nameInputRef.current?.focus({ preventScroll: true }), 700);
  }

  function handleEnquirySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone || !form.email) return;
    setEnquiryError("");
    const message =
      `Journey type: ${form.type || "Not specified"}\n` +
      `Travellers: ${form.pax || "Not specified"}\n` +
      `Approximate dates: ${form.dates || "Not specified"}\n` +
      `Budget: ${form.budget || "Not specified"}` +
      (form.notes ? `\n\nAbout the journey:\n${form.notes}` : "");
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

  const activeWay = way % WAYS.length;
  const testiOrder = [
    (testi + TESTIMONIALS.length - 1) % TESTIMONIALS.length,
    testi,
    (testi + 1) % TESTIMONIALS.length,
  ];

  return (
    <Layout>
      <div className="v3home">
        {/* ═══════════════════════════════ HERO ═══════════════════════════════ */}
        <section className="v3-hero" aria-label="Kerala, your way">
          <div className="v3-hero-slides" aria-hidden="true">
            {HERO_SLIDES.map((s, i) => (
              <div
                key={s.place}
                className={`v3-hero-slide${i === slide ? " active" : ""}`}
                style={{ backgroundImage: `url('${s.img}')` }}
              />
            ))}
          </div>
          <div className="v3-hero-veil" />

          <div className="v3-hero-inner">
            <div className="v3-hero-center">
              <p className="v3-hero-kicker rv">Composed for every kind of traveller.</p>
              <h1 className="v3-hero-title">
                <span className="mr2"><span>Kerala,</span></span>
                <span className="mr2 d2"><span className="v3-hero-title-big">your way.</span></span>
              </h1>
            </div>

            <div className="v3-hero-mid rv d3">
              <p className="v3-hero-lede">
                A destination management studio crafting private, slow-luxury journeys through Kerala — for the world's most discerning travellers, since 2016.
              </p>
              <button type="button" className="v3-tour-btn" onClick={() => setTourOpen(true)}>
                <span className="play" aria-hidden="true" />
                Watch tour
              </button>
            </div>

            <div className="v3-hero-bottom rv d4">
              <div className="v3-hero-count">
                <b>{pad2(slide + 1)}</b> / {pad2(HERO_SLIDES.length)}
                <span className="place">{HERO_SLIDES[slide].place}</span>
                <span className="dots">
                  {HERO_SLIDES.map((s, i) => (
                    <button
                      key={s.place}
                      type="button"
                      className={i === slide ? "on" : ""}
                      onClick={() => setSlide(i)}
                      aria-label={`Show slide ${i + 1}: ${s.place}`}
                    />
                  ))}
                </span>
              </div>
              <div className="v3-hero-social">
                {HERO_SOCIAL.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {tourOpen && (
          <div className="v3-tour" role="dialog" aria-modal="true" aria-label="Escora Kerala tour video" onClick={() => setTourOpen(false)}>
            <div className="v3-tour-frame" onClick={(e) => e.stopPropagation()}>
              <video src="/BGVideo.mp4" poster="/hero-poster.jpg" controls autoPlay playsInline />
              <button type="button" className="v3-tour-close" onClick={() => setTourOpen(false)} aria-label="Close video">×</button>
            </div>
          </div>
        )}

        {/* ═══════════════════ PLAN A JOURNEY (hero continuation) ═══════════════════ */}
        <section className="v3-plan" id="plan" ref={planRef}>
          <div className="v3-plan-band" aria-hidden="true" />
          <div className="v3-wrap v3-plan-grid">
            <div className="v3-plan-left">
              <div className="v3-plan-head rv">
                <span className="v3-eyebrow on-dark"><span className="dot" />Nº 01 — Begin</span>
                <h2>Plan a journey<br />with us.</h2>
                <p>You are one conversation away from a Kerala composed entirely around you.</p>
              </div>

              <ol className="v3-why-list">
                {WHY_POINTS.map((p, i) => (
                  <li key={p.title} className={`rv${i > 0 ? ` d${Math.min(i, 4)}` : ""}`}>
                    <span className="v3-why-icon" aria-hidden="true">{p.icon}</span>
                    <div>
                      <h3>{p.title}</h3>
                      <p>{p.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="v3-plan-card rv d2">
              {enquirySent ? (
                <div className="v3-form-done">
                  <div className="tick">
                    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <h3>Enquiry received.</h3>
                  <p>A Kerala curator will write to you within 24 hours. For a faster reply, message us on WhatsApp now.</p>
                  <a className="v3-btn primary" href={`https://wa.me/918157003344?text=${buildWAMsg()}`} target="_blank" rel="noopener noreferrer">
                    Continue on WhatsApp
                  </a>
                </div>
              ) : (
                <form onSubmit={handleEnquirySubmit} noValidate={false}>
                  <div className="v3-form-intro">
                    <span className="icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
                    </span>
                    <p>Write us a few words about your journey and a Kerala curator will prepare a proposal for you within <b>24 hours</b>.</p>
                  </div>

                  <div className="v3-form-row">
                    <label className="v3-field">
                      <span>Your name</span>
                      <input ref={nameInputRef} type="text" placeholder="Priya / James…" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoComplete="name" />
                    </label>
                    <label className="v3-field">
                      <span>Email</span>
                      <input type="email" placeholder="you@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" />
                    </label>
                  </div>
                  <div className="v3-form-row">
                    <label className="v3-field">
                      <span>Phone / WhatsApp</span>
                      <input type="tel" placeholder="+91 …" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required autoComplete="tel" />
                    </label>
                    <label className="v3-field">
                      <span>Travel type</span>
                      <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                        <option value="">Select journey type</option>
                        {TRAVEL_TYPES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="v3-form-row three">
                    <label className="v3-field">
                      <span>Approximate dates</span>
                      <input type="text" placeholder="e.g. Nov 2026, 7 nights" value={form.dates} onChange={(e) => setForm({ ...form, dates: e.target.value })} />
                    </label>
                    <label className="v3-field">
                      <span>Travellers</span>
                      <select value={form.pax} onChange={(e) => setForm({ ...form, pax: e.target.value })}>
                        <option>2 adults (couple)</option>
                        <option>1 adult (solo)</option>
                        <option>Family with children</option>
                        <option>Small group (4–8)</option>
                      </select>
                    </label>
                    <label className="v3-field">
                      <span>Budget (₹ INR)</span>
                      <input type="text" placeholder="e.g. ₹5–10 lakhs" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
                    </label>
                  </div>

                  <label className="v3-field">
                    <span>Tell us more <em className="opt">Optional</em></span>
                    <textarea rows={4} placeholder="Occasions, pace, must-sees, dietary needs — anything that helps us compose your journey." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </label>

                  {enquiryError && <p className="v3-form-error" role="alert">{enquiryError}</p>}

                  <button className="v3-btn primary block" type="submit" disabled={createEnquiry.isPending}>
                    {createEnquiry.isPending ? "Sending…" : "Send Enquiry"}
                  </button>
                  <p className="v3-form-foot">
                    Prefer to talk? <a href="https://wa.me/918157003344?text=Hello%20Escora%20%E2%80%94%20I'd%20like%20to%20plan%20a%20Kerala%20journey." target="_blank" rel="noopener noreferrer">WhatsApp +91 8157 003 344</a> or write to <a href="mailto:hello@escoraholidays.com">hello@escoraholidays.com</a>
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ EIGHT WAYS TO DISCOVER KERALA ═══════════════════════ */}
        <section className="v3-ways" id="categories" aria-label="Eight ways to discover Kerala">
          <div className="v3-wrap v3-ways-grid">
            <div className="v3-ways-intro">
              <span className="v3-pill rv"><span className="dot" />02 · Travel by type</span>
              <h2 className="rv d1">Eight ways to discover Kerala.</h2>
              <p className="rv d2">Choose your travel personality — we'll compose a journey from scratch, entirely around you.</p>
              <button type="button" className="v3-btn primary rv d3" onClick={() => scrollToPlan()}>Plan a Journey</button>
            </div>

            <div
              className="v3-ways-viewport"
              onMouseEnter={() => setWaysPaused(true)}
              onMouseLeave={() => setWaysPaused(false)}
              onFocus={() => setWaysPaused(true)}
              onBlur={() => setWaysPaused(false)}
            >
              <div
                className={`v3-ways-track${wayAnimate ? "" : " no-anim"}`}
                style={{ transform: `translateX(calc(${way} * -1 * (var(--w-sm) + var(--gap))))` }}
                onTransitionEnd={onWaysTransitionEnd}
              >
                {[...WAYS, ...WAYS].map((w, i) => {
                  const rel = i - way;
                  const isActive = rel === 0;
                  const offset = rel > 0 ? (rel % 2 === 1 ? " off-a" : " off-b") : "";
                  return (
                    <Link
                      key={`${w.id}-${i}`}
                      href={`/collections/${w.id}`}
                      className={`v3-way-card${isActive ? " active" : ""}${offset}`}
                      aria-hidden={i >= WAYS.length ? true : undefined}
                      tabIndex={i >= WAYS.length ? -1 : undefined}
                    >
                      <div className="img" style={{ backgroundImage: `url('${w.img}')` }}>
                        <span className="tag">{w.label}</span>
                      </div>
                      <div className="cap">
                        <h3>{w.label}</h3>
                        <p>{w.desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="v3-ways-controls">
                <span className="count"><b>{pad2(activeWay + 1)}</b> / {pad2(WAYS.length)}</span>
                <div className="v3-prevnext">
                  <button type="button" onClick={() => stepWay(-1)} aria-label="Previous journey type">← Prev</button>
                  <button type="button" onClick={() => stepWay(1)} aria-label="Next journey type">Next →</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════ STATS ════════════════════════════ */}
        <section className="v3-stats" aria-label="Escora in numbers">
          <div className="v3-wrap">
            <div className="v3-stats-block rv">
              {STATS.map((s, i) => (
                <div key={s.label} className="v3-stat">
                  {i > 0 && <span className="sep" aria-hidden="true" />}
                  <div className="n"><CountUp value={s.value} suffix={s.suffix} /></div>
                  <div className="l">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ EXPLORE KERALA ═══════════════════════ */}
        <section className="v3-explore" id="explore-kerala">
          <div className="v3-wrap">
            <div className="v3-section-head">
              <div>
                <span className="v3-eyebrow rv"><span className="dot" />Nº 03 — Explore Kerala</span>
                <h2 className="rv d1">From Varkala's cliffs to <em>Kannur's shores</em>.</h2>
              </div>
              <Link href="/destinations" className="v3-link rv d2">All destinations →</Link>
            </div>
          </div>
          <div className="v3-explore-scroll" ref={exploreScrollRef}>
            <div className="v3-explore-track">
              {[...exploreDestinations, ...exploreDestinations].map((dest, i) => {
                const region = "region" in dest ? dest.region : undefined;
                const img = DESTINATION_BADGES[dest.slug] || dest.imageUrl || heroAlleppey;
                return (
                  <Link
                    key={`${dest.id}-${i}`}
                    href={`/destinations/${dest.slug}`}
                    className="v3-explore-card"
                    aria-label={`Explore ${dest.name}, Kerala`}
                    aria-hidden={i >= exploreDestinations.length ? true : undefined}
                    tabIndex={i >= exploreDestinations.length ? -1 : undefined}
                    draggable={false}
                  >
                    <img src={img} alt={`${dest.name} — Escora Holidays`} draggable={false} loading="lazy" />
                    <div className="scrim" />
                    <div className="caption">
                      {region && <span className="region">{region}</span>}
                      <span className="more">View More →</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ ESCORA RETREAT ════════════════════════════ */}
        <section className="v3-retreat" id="retreat">
          <div className="v3-wrap">
            <div className="v3-section-head">
              <div>
                <span className="v3-eyebrow rv"><span className="dot" />Nº 04 — Escora Retreat</span>
                <h2 className="rv d1">Healing, the <em>Kerala</em> way.</h2>
              </div>
              <div className="v3-retreat-intro rv d2">
                <p>Set on the quiet shore of Vembanad Lake — our NABH-accredited wellness home, where physicians, yogis and kalari masters work as one. Every programme is composed for you alone.</p>
                <button type="button" className="v3-btn primary" onClick={() => scrollToPlan({ type: "Health & Wellness", notes: "I'd like to know more about the Escora Retreat." })}>
                  Enquire about the Retreat
                </button>
              </div>
            </div>

            <div className="v3-retreat-bento">
              {RETREATS.map((r, i) => (
                <button
                  key={r.title}
                  type="button"
                  className={`v3-retreat-card c${i + 1} rv${i > 0 ? ` d${i}` : ""}`}
                  onClick={() => scrollToPlan({ type: "Health & Wellness", notes: `I'm interested in ${r.title.replace(" — the art", "")} at the Escora Retreat.` })}
                  aria-label={`Enquire about ${r.title}`}
                >
                  <div className="img" style={{ backgroundImage: `url('${r.img}')` }} />
                  <div className="scrim" />
                  <div className="body">
                    <div className="text">
                      <h3>{r.title}</h3>
                      <p className="sub">{r.sub}</p>
                      <p className="desc">{r.desc}</p>
                    </div>
                    <span className="arrow" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════ HOW IT WORKS — WAVE TIMELINE ════════════════════ */}
        <section className="v3-process">
          <div className="v3-wrap">
            <div className="v3-process-head">
              <span className="v3-kicker rv">— Nº 05 · How it works —</span>
              <h2 className="rv d1">How your journey begins<span className="dot">.</span></h2>
              <span className="v3-process-ghost" aria-hidden="true">06</span>
            </div>

            <div className="v3-wave rv">
              <svg className="v3-wave-line" viewBox={`0 0 ${WAVE_W} ${WAVE_H}`} preserveAspectRatio="none" aria-hidden="true">
                <path className="shadow" d={wavePath} transform="translate(0 14)" vectorEffect="non-scaling-stroke" />
                <path className="line" d={wavePath} pathLength={1} vectorEffect="non-scaling-stroke" />
              </svg>

              {PROCESS_STEPS.map((step, i) => {
                const high = i % 2 === 1;
                return (
                  <div
                    key={step.title}
                    className={`v3-step${high ? " high" : " low"}`}
                    style={{ "--col": i + 1, "--node-y": `${waveNodes[i].y}px` } as React.CSSProperties}
                  >
                    <span className="v3-step-node" aria-hidden="true">{step.icon}</span>
                    <div className="v3-step-text">
                      <span className="num" aria-hidden="true">{i + 1}</span>
                      <h3><span className="v3-sr">Step {i + 1}: </span>{step.title}</h3>
                      <p>{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="v3-process-foot">
              <span><b>6</b> steps · one dedicated curator</span>
              <button type="button" className="v3-link" onClick={() => scrollToPlan()}>↗ Start the conversation</button>
            </div>
          </div>
        </section>

        {/* ════════════════════════ TESTIMONIALS ════════════════════════════ */}
        <section
          className="v3-testi"
          aria-label="Testimonials"
          onMouseEnter={() => setTestiPaused(true)}
          onMouseLeave={() => setTestiPaused(false)}
        >
          <div className="v3-wrap">
            <div className="v3-testi-head">
              <span className="v3-kicker rv">See what our travellers have to say</span>
              <h2 className="rv d1">Testimonials</h2>
            </div>

            <div className="v3-testi-row">
              {testiOrder.map((idx, pos) => {
                const t = TESTIMONIALS[idx];
                const center = pos === 1;
                return (
                  <figure
                    key={`${idx}-${testi}`}
                    className={`v3-testi-item${center ? " center" : " side"}`}
                    onClick={center ? undefined : () => setTesti(idx)}
                  >
                    <div className="v3-testi-card">
                      <svg className="q" viewBox="0 0 48 36" aria-hidden="true"><path d="M0 36V21.6C0 9.6 6 2.4 18 0l2.4 4.8C13.2 7.2 10.2 11.4 9.6 16.8H19.2V36H0zm28.8 0V21.6C28.8 9.6 34.8 2.4 46.8 0L49.2 4.8C42 7.2 39 11.4 38.4 16.8H48V36H28.8z" /></svg>
                      <div className="stars" aria-label="5 out of 5 stars">★★★★★</div>
                      <blockquote>“{t.quote}”</blockquote>
                      <div className="av" style={{ backgroundImage: `url('${t.av}')` }} />
                    </div>
                    <figcaption>
                      <b>{t.name}</b>
                      <span>{t.meta} · {t.cat.split(" · ")[1]}</span>
                    </figcaption>
                  </figure>
                );
              })}
            </div>

            <div className="v3-testi-dots">
              {TESTIMONIALS.map((t, i) => (
                <button key={t.name} type="button" className={i === testi ? "on" : ""} onClick={() => setTesti(i)} aria-label={`Show testimonial from ${t.name}`} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
