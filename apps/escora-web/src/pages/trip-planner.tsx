import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import Layout from "@/components/layout/Layout";
import { useSeo } from "@/hooks/useSeo";
import {
  useGenerateTripPlan,
  type TripPlanInput,
  type TripItinerary,
} from "@workspace/api-client-react";
import {
  Sparkles,
  Compass,
  Calendar,
  MapPin,
  Users,
  Coins,
  Clock,
  ArrowRight,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Share2,
  Printer,
  ChevronRight,
  Sun,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const DURATION_PRESETS = [4, 7, 10, 14];

const SEASONS = [
  { label: "Winter Peak", range: "Oct – Mar", desc: "Pleasant, clear skies, ideal for hill walks & lagoons" },
  { label: "Monsoon & Ayurveda", range: "Jun – Aug", desc: "Verdant green landscapes, traditional rejuvenation" },
  { label: "Summer Mist", range: "Mar – May", desc: "Quiet backwaters, cool mountain breezes in high ranges" },
];

const START_HUBS = [
  { code: "Kochi", name: "Cochin International Airport (COK)", desc: "Central gateway to heritage, hills & lagoons" },
  { code: "Trivandrum", name: "Trivandrum Airport (TRV)", desc: "Southern gateway, closest to Kovalam & Varkala" },
  { code: "Calicut", name: "Calicut Airport (CCJ)", desc: "Northern gateway to Wayanad & Malabar coast" },
  { code: "Flexible", name: "Flexible / No Preference", desc: "Escora will determine the most logical hub" },
];

const TRAVELER_TYPES = [
  { label: "Couple / Pair", desc: "Secluded, romantic slow luxury" },
  { label: "Solo Traveler", desc: "Contemplative, personalized pace" },
  { label: "Family with Children", desc: "Gentle pacing, nature & heritage" },
  { label: "Friends / Small Group", desc: "Private estates & shared discoveries" },
];

const BUDGET_TIERS = [
  {
    tier: "Conscious Explorer",
    indicative: "Under ₹1.5L / ~$1,800",
    desc: "Boutique eco-lodges, private car & chauffeur, authentic Kerala hospitality",
  },
  {
    tier: "Signature Slow-Luxury",
    indicative: "₹1.5L – ₹3.5L / ~$2,000 – $4,000",
    desc: "Heritage plantation bungalows, private lake cruise, curated artisan dining",
  },
  {
    tier: "Ultra-Luxury Sanctuaries",
    indicative: "₹3.5L – ₹6.5L+ / ~$4,500+",
    desc: "Private pool villas, bespoke ayurvedic physicians, dedicated naturalist guides",
  },
];

const INTERESTS = [
  { id: "tea-hills", label: "Tea Hills & Mist", icon: "🌱", desc: "High-range colonial estates & mountain trails" },
  { id: "backwaters", label: "Backwaters & Canals", icon: "🛶", desc: "Private slow-cruises & quiet village lagoons" },
  { id: "heritage", label: "Colonial & Spice Heritage", icon: "🏛️", desc: "Ancient spice trading ports & Portuguese quays" },
  { id: "beaches", label: "Quiet Coastal Beaches", icon: "🌊", desc: "Arabian Sea cliffs, golden sands & surf" },
  { id: "wellness", label: "Ayurveda & Healing", icon: "✦", desc: "Panchakarma therapies, herbal diet & yoga" },
  { id: "wildlife", label: "Rainforests & Wildlife", icon: "🐅", desc: "Periyar tiger reserve & Western Ghats bio-reserves" },
  { id: "culture", label: "Living Arts & Kathakali", icon: "🎭", desc: "Temple rituals, classical arts & local culinary craft" },
];

const PACING_OPTIONS = [
  {
    pace: "Slow & Unhurried",
    desc: "2 to 3 nights in each sanctuary. Minimal road transfers, deep stillness.",
  },
  {
    pace: "Balanced Discovery",
    desc: "Combines 2–3 distinct regions with comfortable daylight transit.",
  },
  {
    pace: "Deep Wellness Immersion",
    desc: "Anchored primarily at one dedicated Ayurvedic sanctuary with gentle day excursions.",
  },
];

const LOADING_STEPS = [
  "Consulting verified Escora sanctuary catalog...",
  "Balancing road transit times through the Western Ghats...",
  "Curating unhurried mornings and private backwater sunset cruises...",
  "Synthesizing indicative slow-luxury budget guidance...",
  "Polishing your bespoke Kerala voyage...",
];

export default function TripPlannerPage() {
  useSeo({
    title: "AI Trip Planner — Bespoke Slow-Luxury Kerala Itinerary Designer | Escora",
    description: "Design an unhurried, tailor-made Kerala travel itinerary in seconds. Grounded strictly in verified Escora sanctuaries, tea plantations, and tranquil backwaters.",
    url: "https://www.escoraholidays.com/trip-planner",
  });

  const [, setLocation] = useLocation();

  // Form state
  const [durationDays, setDurationDays] = useState(7);
  const [seasonOrDates, setSeasonOrDates] = useState(SEASONS[0].label);
  const [customDates, setCustomDates] = useState("");
  const [startLocation, setStartLocation] = useState(START_HUBS[0].code);
  const [travelersCount, setTravelersCount] = useState(2);
  const [travelerType, setTravelerType] = useState(TRAVELER_TYPES[0].label);
  const [budgetTier, setBudgetTier] = useState(BUDGET_TIERS[1].tier);
  const [currency, setCurrency] = useState("INR");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "tea-hills",
    "backwaters",
    "heritage",
  ]);
  const [pace, setPace] = useState(PACING_OPTIONS[0].pace);
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Result state
  const [itinerary, setItinerary] = useState<TripItinerary | null>(null);
  const [refinementSuggestions, setRefinementSuggestions] = useState<string[]>([]);
  const [refinementInput, setRefinementInput] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Loading animation state
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  const itineraryRef = useRef<HTMLDivElement>(null);

  const planMutation = useGenerateTripPlan();

  // Cycle loading step messages during pending query
  useEffect(() => {
    let interval: any;
    if (planMutation.isPending) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [planMutation.isPending]);

  function toggleInterest(id: string) {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function handleGenerateItinerary(e?: React.FormEvent) {
    if (e) e.preventDefault();

    const payload: TripPlanInput = {
      durationDays,
      seasonOrDates: customDates.trim() || seasonOrDates,
      startLocation,
      travelersCount,
      travelerType,
      budgetTier,
      currency,
      interests: selectedInterests.length > 0 ? selectedInterests : ["tea-hills", "backwaters"],
      pace,
      additionalNotes: additionalNotes.trim() || undefined,
    };

    planMutation.mutate(
      { data: payload },
      {
        onSuccess: (data) => {
          setItinerary(data.itinerary);
          setRefinementSuggestions(data.refinementSuggestions || []);
          setTimeout(() => {
            itineraryRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 200);
        },
      }
    );
  }

  function handleRefineItinerary(promptText: string) {
    if (!promptText.trim() || !itinerary || planMutation.isPending) return;

    setRefinementInput("");

    const payload: TripPlanInput = {
      durationDays: itinerary.durationDays || durationDays,
      seasonOrDates: customDates.trim() || seasonOrDates,
      startLocation,
      travelersCount,
      travelerType,
      budgetTier,
      currency,
      interests: selectedInterests,
      pace,
      additionalNotes: additionalNotes.trim() || undefined,
      refinementPrompt: promptText.trim(),
      currentItinerary: itinerary as any,
    };

    planMutation.mutate(
      { data: payload },
      {
        onSuccess: (data) => {
          setItinerary(data.itinerary);
          setRefinementSuggestions(data.refinementSuggestions || []);
          setTimeout(() => {
            itineraryRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 200);
        },
      }
    );
  }

  function handleContinueToHumanDesigner() {
    if (!itinerary) return;

    // Package itinerary summary to prefill standard enquiry flow
    const destinationsList = itinerary.verifiedDestinations?.map((d) => d.name) || itinerary.routeSequence || [];
    const notesSummary = `AI Trip Plan Reference: "${itinerary.title}"\nRoute: ${itinerary.routeSequence?.join(" → ")}\nDuration: ${itinerary.durationDays} Days / ${itinerary.durationNights} Nights\nPace: ${itinerary.pace}\nEstimated Budget Guidance: ${itinerary.budgetGuidance}`;

    try {
      sessionStorage.setItem("escora_ai_trip_plan", JSON.stringify({
        title: itinerary.title,
        duration: itinerary.durationDays,
        destinations: destinationsList,
        budget: budgetTier,
        style: travelerType,
        notes: notesSummary,
      }));
    } catch {
      // Ignore storage errors
    }

    const firstDest = destinationsList[0] || "Munnar";
    setLocation(`/plan?destination=${encodeURIComponent(firstDest)}&from=trip-planner`);
  }

  function handleShareWhatsApp() {
    if (!itinerary) return;
    const text = encodeURIComponent(
      `Hello Escora Team, I designed a bespoke voyage on your AI Trip Planner:\n\n*${itinerary.title}*\nRoute: ${itinerary.routeSequence?.join(" → ")}\nDuration: ${itinerary.durationDays} Days\n\nI would love to speak with a travel designer to personalize and book this itinerary.`
    );
    window.open(`https://api.whatsapp.com/send/?phone=918157003344&text=${text}`, "_blank");
  }

  function handleCopySummary() {
    if (!itinerary) return;
    const summary = `${itinerary.title}\n${itinerary.tagline}\n\nRoute: ${itinerary.routeSequence.join(" → ")}\nDuration: ${itinerary.durationDays} Days / ${itinerary.durationNights} Nights\n\n${itinerary.overview}\n\nPlan generated via Escora AI Trip Planner: https://www.escoraholidays.com/trip-planner`;
    navigator.clipboard.writeText(summary);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  return (
    <Layout>
      <div className="bg-[#FAF8F5] min-h-screen text-[#293D1F]">
        {/* Hero Section */}
        <section className="relative pt-28 pb-16 px-4 sm:px-6 lg:px-8 border-b border-[#CCD7D2]/60 overflow-hidden bg-gradient-to-b from-[#F2F6F3] to-[#FAF8F5]">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A3F2C]/10 border border-[#1A3F2C]/20 text-[#1A3F2C] text-xs font-mono uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5 text-[#c59a58]" />
              <span>Grounded Slow-Luxury Engine</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#1A3F2C] leading-tight">
              Tailor Your Slow Voyage <br />
              <span className="italic font-normal text-[#c59a58]">Across God&apos;s Own Country</span>
            </h1>

            <p className="text-sm sm:text-base text-[#56664C] max-w-2xl mx-auto leading-relaxed">
              An intelligent, catalog-grounded itinerary designer rooted exclusively in Escora&apos;s verified Kerala sanctuaries, colonial heritage ports, and private backwater lagoons.
            </p>

            <div className="flex items-center justify-center gap-6 pt-2 text-[11px] font-mono text-[#788A63]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#1A3F2C]" />
                100% Verified Published Catalog
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#1A3F2C]" />
                Realistic Western Ghats Pacing
              </span>
              <span className="flex items-center gap-1.5 hidden sm:flex">
                <Coins className="h-3.5 w-3.5 text-[#1A3F2C]" />
                Honest Indicative Guidance
              </span>
            </div>
          </div>
        </section>

        {/* Main Content Area */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Step 1: Input Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#CCD7D2]/70 shadow-sm space-y-10">
            <form onSubmit={handleGenerateItinerary} className="space-y-10">
              {/* Duration & Presets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#1A3F2C] font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#c59a58]" />
                    <span>1. Trip Duration</span>
                  </label>
                  <span className="text-xs font-serif font-medium text-[#1A3F2C]">
                    {durationDays} Days / {Math.max(1, durationDays - 1)} Nights
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {DURATION_PRESETS.map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setDurationDays(days)}
                      className={`p-3 rounded-xl border text-xs font-medium transition-all ${
                        durationDays === days
                          ? "bg-[#1A3F2C] text-white border-[#1A3F2C] shadow-2xs"
                          : "bg-white text-[#293D1F] border-[#CCD7D2]/80 hover:bg-[#F3F7F4]"
                      }`}
                    >
                      <span className="block text-sm font-semibold">{days} Days</span>
                      <span className="text-[10px] opacity-75">{days - 1} Nights</span>
                    </button>
                  ))}

                  {/* Custom duration counter */}
                  <div className="flex items-center justify-between border border-[#CCD7D2]/80 rounded-xl px-3 bg-[#FAF8F5]">
                    <button
                      type="button"
                      onClick={() => setDurationDays((d) => Math.max(2, d - 1))}
                      className="text-base font-bold text-[#1A3F2C] hover:opacity-70 p-1"
                      aria-label="Decrease days"
                    >
                      −
                    </button>
                    <span className="text-xs font-semibold">{durationDays}d</span>
                    <button
                      type="button"
                      onClick={() => setDurationDays((d) => Math.min(30, d + 1))}
                      className="text-base font-bold text-[#1A3F2C] hover:opacity-70 p-1"
                      aria-label="Increase days"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Season & Starting Point */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#1A3F2C] font-semibold flex items-center gap-2">
                    <Sun className="h-4 w-4 text-[#c59a58]" />
                    <span>2. Season or Preferred Timing</span>
                  </label>
                  <div className="space-y-2">
                    {SEASONS.map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => {
                          setSeasonOrDates(s.label);
                          setCustomDates("");
                        }}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                          seasonOrDates === s.label && !customDates
                            ? "bg-[#1A3F2C] text-white border-[#1A3F2C]"
                            : "bg-white border-[#CCD7D2]/80 text-[#293D1F] hover:bg-[#F3F7F4]"
                        }`}
                      >
                        <div className="flex justify-between items-center font-medium">
                          <span>{s.label}</span>
                          <span className="text-[10px] font-mono opacity-80">{s.range}</span>
                        </div>
                        <p className={`text-[11px] mt-0.5 ${seasonOrDates === s.label && !customDates ? "text-white/80" : "text-[#56664C]"}`}>
                          {s.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#1A3F2C] font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#c59a58]" />
                    <span>3. Starting Hub / Arrival Gateway</span>
                  </label>
                  <div className="space-y-2">
                    {START_HUBS.map((hub) => (
                      <button
                        key={hub.code}
                        type="button"
                        onClick={() => setStartLocation(hub.code)}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                          startLocation === hub.code
                            ? "bg-[#1A3F2C] text-white border-[#1A3F2C]"
                            : "bg-white border-[#CCD7D2]/80 text-[#293D1F] hover:bg-[#F3F7F4]"
                        }`}
                      >
                        <div className="font-medium">{hub.name}</div>
                        <p className={`text-[11px] mt-0.5 ${startLocation === hub.code ? "text-white/80" : "text-[#56664C]"}`}>
                          {hub.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Travelers & Travel Style */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono uppercase tracking-wider text-[#1A3F2C] font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#c59a58]" />
                      <span>4. Travelers & Party</span>
                    </label>
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <span>{travelersCount} Traveler{travelersCount > 1 ? "s" : ""}</span>
                      <div className="inline-flex border border-[#CCD7D2] rounded-lg bg-[#FAF8F5] px-2 py-0.5">
                        <button
                          type="button"
                          onClick={() => setTravelersCount((c) => Math.max(1, c - 1))}
                          className="px-1 font-bold text-[#1A3F2C]"
                        >
                          −
                        </button>
                        <button
                          type="button"
                          onClick={() => setTravelersCount((c) => Math.min(20, c + 1))}
                          className="px-1 font-bold text-[#1A3F2C]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {TRAVELER_TYPES.map((t) => (
                      <button
                        key={t.label}
                        type="button"
                        onClick={() => setTravelerType(t.label)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                          travelerType === t.label
                            ? "bg-[#1A3F2C] text-white border-[#1A3F2C]"
                            : "bg-white border-[#CCD7D2]/80 text-[#293D1F] hover:bg-[#F3F7F4]"
                        }`}
                      >
                        <span className="font-semibold block">{t.label}</span>
                        <span className={`text-[10px] block mt-0.5 truncate ${travelerType === t.label ? "text-white/80" : "text-[#56664C]"}`}>
                          {t.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#1A3F2C] font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#c59a58]" />
                    <span>5. Preferred Pacing</span>
                  </label>
                  <div className="space-y-2">
                    {PACING_OPTIONS.map((p) => (
                      <button
                        key={p.pace}
                        type="button"
                        onClick={() => setPace(p.pace)}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                          pace === p.pace
                            ? "bg-[#1A3F2C] text-white border-[#1A3F2C]"
                            : "bg-white border-[#CCD7D2]/80 text-[#293D1F] hover:bg-[#F3F7F4]"
                        }`}
                      >
                        <div className="font-medium">{p.pace}</div>
                        <p className={`text-[11px] mt-0.5 ${pace === p.pace ? "text-white/80" : "text-[#56664C]"}`}>
                          {p.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interests (Multi-select) */}
              <div className="space-y-3">
                <label className="text-xs font-mono uppercase tracking-wider text-[#1A3F2C] font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Compass className="h-4 w-4 text-[#c59a58]" />
                    <span>6. Core Travel Interests</span>
                  </span>
                  <span className="text-[11px] font-normal text-[#56664C] lowercase font-sans">
                    (select any you gravitate towards)
                  </span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {INTERESTS.map((int) => {
                    const isSelected = selectedInterests.includes(int.id);
                    return (
                      <button
                        key={int.id}
                        type="button"
                        onClick={() => toggleInterest(int.id)}
                        className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? "bg-[#F3F7F4] border-[#1A3F2C] text-[#1A3F2C] ring-1 ring-[#1A3F2C]"
                            : "bg-white border-[#CCD7D2]/80 text-[#56664C] hover:bg-[#FAF8F5]"
                        }`}
                      >
                        <span className="text-lg shrink-0 mt-0.5">{int.icon}</span>
                        <div>
                          <div className="font-semibold flex items-center gap-1.5 text-xs text-[#1A3F2C]">
                            <span>{int.label}</span>
                            {isSelected && <Check className="h-3 w-3 text-[#1A3F2C]" />}
                          </div>
                          <p className="text-[10px] text-[#56664C] mt-0.5">{int.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Budget Tier & Currency */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#1A3F2C] font-semibold flex items-center gap-2">
                    <Coins className="h-4 w-4 text-[#c59a58]" />
                    <span>7. Indicative Budget Tier</span>
                  </label>
                  <div className="flex items-center gap-1 text-[11px] font-mono">
                    {["INR", "USD", "EUR", "GBP"].map((curr) => (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => setCurrency(curr)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          currency === curr
                            ? "bg-[#1A3F2C] text-white"
                            : "bg-[#FAF8F5] text-[#56664C] hover:bg-[#CCD7D2]/40"
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {BUDGET_TIERS.map((b) => (
                    <button
                      key={b.tier}
                      type="button"
                      onClick={() => setBudgetTier(b.tier)}
                      className={`p-3.5 rounded-xl border text-left text-xs transition-all ${
                        budgetTier === b.tier
                          ? "bg-[#1A3F2C] text-white border-[#1A3F2C] shadow-2xs"
                          : "bg-white border-[#CCD7D2]/80 text-[#293D1F] hover:bg-[#F3F7F4]"
                      }`}
                    >
                      <div className="font-semibold text-xs">{b.tier}</div>
                      <div className={`text-[11px] font-mono mt-0.5 ${budgetTier === b.tier ? "text-[#e6ca92]" : "text-[#c59a58]"}`}>
                        {b.indicative}
                      </div>
                      <p className={`text-[10px] mt-1.5 leading-relaxed ${budgetTier === b.tier ? "text-white/80" : "text-[#56664C]"}`}>
                        {b.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Requests / Additional Notes */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-[#1A3F2C] font-semibold block">
                  8. Special Requests & Preferences (Optional)
                </label>
                <textarea
                  rows={2}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="e.g., We celebrate our 10th anniversary; prefer private heritage villas, vegetarian cuisine, and zero early morning transfers..."
                  className="w-full rounded-xl border border-[#CCD7D2] p-3 text-xs bg-[#FAF8F5] text-[#293D1F] placeholder:text-[#788A63] focus:outline-none focus:ring-1 focus:ring-[#1A3F2C] focus:bg-white transition-all resize-none"
                  maxLength={1000}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-[11px] text-[#788A63] flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#1A3F2C]" />
                  <span>No payment required. Free slow-luxury plan generation.</span>
                </div>

                <Button
                  type="submit"
                  disabled={planMutation.isPending}
                  className="w-full sm:w-auto px-8 py-6 rounded-xl bg-[#1A3F2C] text-white hover:bg-[#255239] transition-all font-medium text-sm flex items-center justify-center gap-2 shadow-sm"
                  data-testid="button-generate-trip-plan"
                >
                  <Sparkles className="h-4 w-4 text-[#c59a58]" />
                  <span>{planMutation.isPending ? "Crafting Itinerary..." : "Design Bespoke Itinerary"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>

          {/* Loading Overlay / Progress Card */}
          {planMutation.isPending && (
            <div className="mt-8 p-10 rounded-3xl bg-white border border-[#CCD7D2] text-center space-y-4 shadow-sm animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-full bg-[#F3F7F4] border border-[#c59a58]/40 flex items-center justify-center mx-auto text-[#c59a58] animate-pulse">
                <Compass className="h-7 w-7 animate-spin [animation-duration:8s]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-semibold text-[#1A3F2C]">
                  Curating Your Slow-Luxury Passage
                </h3>
                <p className="text-xs text-[#56664C] italic font-mono transition-all duration-300">
                  {LOADING_STEPS[loadingStepIndex]}
                </p>
              </div>
              <div className="max-w-xs mx-auto h-1.5 bg-[#F3F7F4] rounded-full overflow-hidden">
                <div className="h-full bg-[#1A3F2C] rounded-full animate-progress" />
              </div>
            </div>
          )}

          {/* Error Message */}
          {planMutation.isError && (
            <div className="mt-8 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                <AlertCircle className="h-5 w-5" />
                <span>Notice</span>
              </div>
              <p className="text-xs text-[#56664C] leading-relaxed">
                {(planMutation.error as any)?.error ||
                  "The trip planning service encountered a temporary provider issue. Please retry with your preferences."}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerateItinerary()}
                className="text-xs border-[#1A3F2C]/30 text-[#1A3F2C] hover:bg-[#1A3F2C] hover:text-white"
              >
                <RefreshCw className="h-3 w-3 mr-1" /> Retry Generation
              </Button>
            </div>
          )}

          {/* Step 2: Generated Itinerary View */}
          {itinerary && (
            <div ref={itineraryRef} className="mt-12 space-y-10 animate-in fade-in duration-500">
              {/* Itinerary Header Card */}
              <div className="bg-[#1A3F2C] text-white rounded-3xl p-6 sm:p-10 space-y-6 shadow-md border border-[#293D1F]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#c59a58]/20 text-[#e6ca92] border-0 text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5">
                      Bespoke Itinerary
                    </Badge>
                    <span className="text-xs text-white/70 font-mono">
                      {itinerary.durationDays} Days / {itinerary.durationNights} Nights
                    </span>
                  </div>

                  {/* Actions: Copy & Print */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopySummary}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white transition-colors flex items-center gap-1.5"
                      title="Copy itinerary summary"
                    >
                      {copiedLink ? <Check className="h-3.5 w-3.5 text-[#e6ca92]" /> : <Share2 className="h-3.5 w-3.5" />}
                      <span className="hidden sm:inline">{copiedLink ? "Copied" : "Copy"}</span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white transition-colors flex items-center gap-1.5"
                      title="Print or save as PDF"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Print</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h2 className="font-serif text-2xl sm:text-4xl font-semibold tracking-tight text-white leading-tight">
                    {itinerary.title}
                  </h2>
                  <p className="font-serif italic text-[#e6ca92] text-sm sm:text-base leading-relaxed">
                    &ldquo;{itinerary.tagline}&rdquo;
                  </p>
                  <p className="text-xs sm:text-sm text-white/80 leading-relaxed pt-2 max-w-3xl whitespace-pre-line">
                    {itinerary.overview}
                  </p>
                </div>

                {/* Route Ribbon */}
                <div className="pt-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#e6ca92] block mb-2">
                    Curated Route Sequence:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {itinerary.routeSequence.map((stop, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-white font-medium">
                          {stop}
                        </span>
                        {idx < itinerary.routeSequence.length - 1 && (
                          <ChevronRight className="h-3.5 w-3.5 text-[#c59a58]" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Spec Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-white/60 block uppercase">Pace</span>
                    <span className="font-medium text-white">{itinerary.pace}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-white/60 block uppercase">Ideal Timing</span>
                    <span className="font-medium text-white">{itinerary.idealSeason}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-mono text-white/60 block uppercase">Indicative Budget</span>
                    <span className="font-medium text-[#e6ca92] line-clamp-1">{budgetTier}</span>
                  </div>
                </div>
              </div>

              {/* Realistic Assessment Advisory (if present) */}
              {itinerary.realisticAssessment && (
                <div className="p-5 rounded-2xl bg-[#F3F7F4] border border-[#CCD7D2] space-y-1.5">
                  <div className="flex items-center gap-2 text-[#1A3F2C] text-xs font-semibold font-mono uppercase tracking-wider">
                    <ShieldCheck className="h-4 w-4 text-[#c59a58]" />
                    <span>Slow-Luxury Feasibility & Transit Assessment</span>
                  </div>
                  <p className="text-xs text-[#56664C] leading-relaxed">
                    {itinerary.realisticAssessment}
                  </p>
                </div>
              )}

              {/* Day-by-Day Timeline Arc */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#1A3F2C]">
                    Day-by-Day Journey Arc
                  </h3>
                  <span className="text-xs font-mono text-[#788A63]">
                    {itinerary.days.length} Daily Chapters
                  </span>
                </div>

                <div className="space-y-4">
                  {itinerary.days.map((day) => (
                    <div
                      key={day.day}
                      className="bg-white rounded-2xl p-5 sm:p-6 border border-[#CCD7D2]/80 shadow-2xs space-y-4 transition-all hover:border-[#1A3F2C]/30"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#CCD7D2]/40 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-full bg-[#1A3F2C] text-white flex items-center justify-center font-mono text-xs font-bold shrink-0">
                            {day.day}
                          </span>
                          <div>
                            <h4 className="font-serif font-semibold text-sm sm:text-base text-[#1A3F2C]">
                              {day.title}
                            </h4>
                            {day.theme && (
                              <span className="text-[11px] text-[#788A63] font-mono">
                                Theme: {day.theme}
                              </span>
                            )}
                          </div>
                        </div>

                        {day.destinationSlug && (
                          <Link
                            href={`/destinations/${day.destinationSlug}`}
                            className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#F3F7F4] border border-[#CCD7D2] text-[#1A3F2C] hover:bg-[#1A3F2C] hover:text-white transition-colors"
                          >
                            <span>{day.destination}</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </Link>
                        )}
                      </div>

                      {/* 3 Activities Blocks */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#CCD7D2]/50 space-y-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#788A63] font-semibold block">
                            🌅 Morning Rhythm
                          </span>
                          <p className="text-[#293D1F] leading-relaxed">{day.morningActivity}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#CCD7D2]/50 space-y-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#788A63] font-semibold block">
                            ☀️ Afternoon Discovery
                          </span>
                          <p className="text-[#293D1F] leading-relaxed">{day.afternoonActivity}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#CCD7D2]/50 space-y-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#788A63] font-semibold block">
                            🌙 Evening Serenity
                          </span>
                          <p className="text-[#293D1F] leading-relaxed">{day.eveningActivity}</p>
                        </div>
                      </div>

                      {/* Stay & Travel Note */}
                      <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs border-t border-[#CCD7D2]/30 text-[#56664C]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] uppercase text-[#788A63]">Sanctuary:</span>
                          <span className="font-medium text-[#1A3F2C]">{day.stayRecommendation}</span>
                        </div>
                        {day.travelNote && (
                          <div className="text-[11px] font-mono text-[#788A63] italic">
                            🚗 {day.travelNote}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Catalog Offerings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Verified Destinations */}
                <div className="bg-white rounded-2xl p-6 border border-[#CCD7D2]/80 space-y-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#1A3F2C] font-semibold block">
                    Verified Escora Destinations
                  </span>
                  <div className="space-y-2">
                    {itinerary.verifiedDestinations?.map((dest, i) => (
                      <Link
                        key={i}
                        href={dest.url}
                        className="block p-3 rounded-xl border border-[#CCD7D2]/60 hover:border-[#1A3F2C] hover:bg-[#F3F7F4] transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-semibold text-xs text-[#1A3F2C] group-hover:text-[#c59a58]">
                            {dest.name}
                          </span>
                          <ExternalLink className="h-3 w-3 text-[#788A63] group-hover:text-[#1A3F2C]" />
                        </div>
                        <p className="text-[11px] text-[#56664C] mt-1 line-clamp-1">
                          {dest.highlightsOrRoute}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Verified Curated Journeys */}
                <div className="bg-white rounded-2xl p-6 border border-[#CCD7D2]/80 space-y-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#1A3F2C] font-semibold block">
                    Related Escora Curated Journeys
                  </span>
                  <div className="space-y-2">
                    {itinerary.verifiedJourneys?.map((pkg, i) => (
                      <Link
                        key={i}
                        href={pkg.url}
                        className="block p-3 rounded-xl border border-[#CCD7D2]/60 hover:border-[#1A3F2C] hover:bg-[#F3F7F4] transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-semibold text-xs text-[#1A3F2C] group-hover:text-[#c59a58]">
                            {pkg.name}
                          </span>
                          <ExternalLink className="h-3 w-3 text-[#788A63] group-hover:text-[#1A3F2C]" />
                        </div>
                        <p className="text-[11px] text-[#56664C] mt-1 line-clamp-1 font-mono">
                          Route: {pkg.highlightsOrRoute}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Indicative Budget Guidance Box */}
              <div className="p-6 rounded-2xl bg-white border border-[#CCD7D2]/80 space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[#1A3F2C] font-semibold block">
                  Indicative Budget & Transparent Guidance
                </span>
                <p className="text-xs text-[#56664C] leading-relaxed">
                  {itinerary.budgetGuidance}
                </p>
                <p className="text-[11px] text-[#788A63] italic pt-1 border-t border-[#CCD7D2]/40 font-mono">
                  {itinerary.catalogueNotice}
                </p>
              </div>

              {/* Practical Slow-Travel Tips */}
              {itinerary.practicalAdvice && itinerary.practicalAdvice.length > 0 && (
                <div className="p-6 rounded-2xl bg-[#F3F7F4] border border-[#CCD7D2]/80 space-y-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#1A3F2C] font-semibold block">
                    Sensory & Practical Travel Notes
                  </span>
                  <ul className="space-y-2 text-xs text-[#293D1F]">
                    {itinerary.practicalAdvice.map((advice, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#c59a58] font-bold">✦</span>
                        <span>{advice}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Refinement Section (Iterative Prompting) */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#CCD7D2] shadow-sm space-y-4">
                <div className="space-y-1">
                  <h4 className="font-serif font-semibold text-base text-[#1A3F2C] flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 text-[#c59a58]" />
                    <span>Refine & Personalize This Itinerary</span>
                  </h4>
                  <p className="text-xs text-[#56664C]">
                    Want more unhurried days, specific Ayurvedic healing, or a different balance of sea and tea hills? Request a bespoke refinement:
                  </p>
                </div>

                {/* 1-Click Refinement Suggestions */}
                {refinementSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {refinementSuggestions.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleRefineItinerary(sug)}
                        disabled={planMutation.isPending}
                        className="text-xs px-3 py-1.5 rounded-full border border-[#CCD7D2] bg-[#FAF8F5] hover:bg-[#1A3F2C] hover:text-white hover:border-[#1A3F2C] text-[#293D1F] transition-all flex items-center gap-1.5"
                      >
                        <Sparkles className="h-3 w-3 text-[#c59a58]" />
                        <span>{sug}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Freeform Refinement Prompt */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={refinementInput}
                    onChange={(e) => setRefinementInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRefineItinerary(refinementInput)}
                    placeholder="e.g., Make the pace slower with 3 nights in Munnar and less driving..."
                    className="flex-1 rounded-xl border border-[#CCD7D2] px-3.5 py-2.5 text-xs bg-[#FAF8F5] text-[#293D1F] focus:outline-none focus:ring-1 focus:ring-[#1A3F2C] focus:bg-white transition-all"
                    disabled={planMutation.isPending}
                  />
                  <Button
                    onClick={() => handleRefineItinerary(refinementInput)}
                    disabled={!refinementInput.trim() || planMutation.isPending}
                    className="rounded-xl bg-[#1A3F2C] text-white hover:bg-[#255239] text-xs px-4"
                  >
                    Refine
                  </Button>
                </div>
              </div>

              {/* Connect to Existing Escora Flows CTA */}
              <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#1A3F2C] to-[#122B1E] text-white text-center space-y-4 shadow-lg">
                <div className="w-12 h-12 rounded-full bg-white/10 border border-[#c59a58]/40 flex items-center justify-center mx-auto text-[#c59a58]">
                  <Compass className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-semibold">
                  Bring This Voyage to Life
                </h3>
                <p className="text-xs sm:text-sm text-white/80 max-w-xl mx-auto leading-relaxed">
                  Every Escora journey is personally adapted by human travel designers. Continue with this draft plan to our bespoke enquiry flow, where we reserve private boutique sanctuaries, arrange chauffeur allocations, and tailor inclusions to your preferences.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                  <Button
                    onClick={handleContinueToHumanDesigner}
                    className="w-full sm:w-auto px-8 py-6 rounded-xl bg-[#c59a58] hover:bg-[#b58c4c] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md transition-all"
                    data-testid="button-continue-to-plan"
                  >
                    <span>Handcraft With an Escora Travel Designer</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleShareWhatsApp}
                    className="w-full sm:w-auto px-6 py-6 rounded-xl border-white/20 text-white hover:bg-white/10 text-xs flex items-center justify-center gap-2"
                  >
                    <span>Speak on WhatsApp</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <p className="text-[10px] font-mono text-white/60 pt-2">
                  No automated bookings or upfront commitment. Strictly private review with your designer.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
