import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import Layout from "@/components/layout/Layout";
import { useSeo } from "@/hooks/useSeo";
import {
  useGenerateTripPlan,
  useListDestinations,
  useGetCurrencyRates,
  getGetCurrencyRatesQueryKey,
  type TripPlanInput,
  type TripItinerary,
  type CurrencyRatesResponse,
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
  ArrowLeft,
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
  Search,
  Star,
  X,
  Heart,
  Leaf,
  Minus,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DESTINATION_PHOTOS } from "@/lib/destinationPhotos";

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
  { label: "Couple / Pair", desc: "Secluded, romantic slow luxury", icon: Heart },
  { label: "Solo Traveler", desc: "Contemplative, personalized pace", icon: Compass },
  { label: "Family with Children", desc: "Gentle pacing, nature & heritage", icon: Users },
  { label: "Friends / Small Group", desc: "Private estates & shared discoveries", icon: Users },
];

const JOURNEY_TYPES = [
  {
    id: "honeymoon",
    label: "Honeymoon & Romance",
    desc: "Intimate pool villas, candlelit backwater cruises, and secluded hill mist.",
    icon: "🕯️",
  },
  {
    id: "family",
    label: "Family Expedition",
    desc: "Child-friendly pacing, wildlife sanctuaries, living spice estates, and calm waters.",
    icon: "🌿",
  },
  {
    id: "heritage",
    label: "Slow Heritage & Culture",
    desc: "Ancient spice trading ports, Kathakali rituals, and Dutch-colonial quarters.",
    icon: "🏛️",
  },
  {
    id: "wilderness",
    label: "Wilderness & Mist Hills",
    desc: "High-range tea plantations, misty Western Ghats trails, and bio-reserves.",
    icon: "⛰️",
  },
  {
    id: "wellness",
    label: "Ayurveda & Healing",
    desc: "Authentic Panchakarma therapies, herbal diet, daily yoga, and deep stillness.",
    icon: "✦",
  },
  {
    id: "coastal",
    label: "Coastal & Beach",
    desc: "Arabian Sea clifftop sunsets, tranquil golden sands, and fresh coastal cuisine.",
    icon: "🌊",
  },
];

export type SupportedCurrency = "INR" | "USD" | "EUR" | "GBP" | "AED";

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = ["INR", "USD", "EUR", "GBP", "AED"];

export const CURRENCY_CONFIGS: Record<SupportedCurrency, CurrencyConfig> = {
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee" },
  USD: { code: "USD", symbol: "$", name: "US Dollar" },
  EUR: { code: "EUR", symbol: "€", name: "Euro" },
  GBP: { code: "GBP", symbol: "£", name: "British Pound" },
  AED: { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
};

// Conservative reference fallback rates when live rates are initializing
export const DEFAULT_FALLBACK_RATES: Record<SupportedCurrency, number> = {
  INR: 1.0,
  USD: 0.01055,
  EUR: 0.00941,
  GBP: 0.00788,
  AED: 0.01055 * 3.6725,
};

export interface BudgetTier {
  tier: string;
  minInr: number;
  maxInr: number;
  isPlus?: boolean;
  indicative: string;
  desc: string;
}

export const BUDGET_TIERS: BudgetTier[] = [
  {
    tier: "Conscious Explorer",
    minInr: 0,
    maxInr: 150000,
    indicative: "Under ₹1.5L / ~$1,800",
    desc: "Boutique eco-lodges, private car & chauffeur, authentic Kerala hospitality",
  },
  {
    tier: "Signature Slow-Luxury",
    minInr: 150000,
    maxInr: 350000,
    indicative: "₹1.5L – ₹3.5L / ~$2,000 – $4,000",
    desc: "Heritage plantation bungalows, private lake cruise, curated artisan dining",
  },
  {
    tier: "Ultra-Luxury Sanctuaries",
    minInr: 350000,
    maxInr: 650000,
    isPlus: true,
    indicative: "₹3.5L – ₹6.5L+ / ~$4,500+",
    desc: "Private pool villas, bespoke ayurvedic physicians, dedicated naturalist guides",
  },
];

export function formatCurrencyAmount(
  inrAmount: number,
  currency: SupportedCurrency,
  dynamicRates?: Record<SupportedCurrency, number>
): string {
  if (currency === "INR") {
    const lakhs = inrAmount / 100000;
    return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)}L`;
  }

  const rate = dynamicRates?.[currency] || DEFAULT_FALLBACK_RATES[currency] || 1;
  const rawConverted = inrAmount * rate;

  let rounded: number;
  if (rawConverted >= 10000) {
    rounded = Math.round(rawConverted / 100) * 100;
  } else if (rawConverted >= 2000) {
    rounded = Math.round(rawConverted / 50) * 50;
  } else if (rawConverted >= 500) {
    rounded = Math.round(rawConverted / 10) * 10;
  } else {
    rounded = Math.round(rawConverted / 5) * 5;
  }

  const formattedNum = rounded.toLocaleString("en-US");
  if (currency === "AED") {
    return `د.إ ${formattedNum}`;
  }
  const symbol = CURRENCY_CONFIGS[currency]?.symbol || "";
  return `${symbol}${formattedNum}`;
}

export function getBudgetTierDisplay(
  b: BudgetTier,
  currency: string,
  dynamicRates?: Record<SupportedCurrency, number>
): string {
  const curr = (SUPPORTED_CURRENCIES.includes(currency as SupportedCurrency)
    ? currency
    : "INR") as SupportedCurrency;

  const inrMin = b.minInr > 0 ? `₹${(b.minInr / 100000).toFixed(1)}L` : "";
  const inrMax = `₹${(b.maxInr / 100000).toFixed(1)}L${b.isPlus ? "+" : ""}`;
  const inrRange = b.minInr === 0 ? `Under ${inrMax}` : `${inrMin} – ${inrMax}`;

  if (curr === "INR") {
    const usdMax = formatCurrencyAmount(b.maxInr, "USD", dynamicRates);
    let usdPart: string;
    if (b.minInr === 0) {
      usdPart = `~${usdMax}`;
    } else {
      const usdMin = formatCurrencyAmount(b.minInr, "USD", dynamicRates);
      usdPart = b.isPlus ? `~${usdMin} – ${usdMax}+` : `~${usdMin} – ${usdMax}`;
    }
    return `${inrRange} / ${usdPart}`;
  }

  // Selected currency is foreign (USD, EUR, GBP, AED)
  const currMax = `${formatCurrencyAmount(b.maxInr, curr, dynamicRates)}${b.isPlus ? "+" : ""}`;
  let currRange: string;
  if (b.minInr === 0) {
    currRange = `Under ${currMax}`;
  } else {
    const currMin = formatCurrencyAmount(b.minInr, curr, dynamicRates);
    currRange = `${currMin} – ${currMax}`;
  }

  // Reference in INR: ensure "Under" is not duplicated as "Under Under"
  const refPart = b.minInr === 0 ? `~${inrMax}` : `~${inrRange}`;
  return `${currRange} / ${refPart}`;
}

export function getDynamicBudgetGuidance(
  itinerary: TripItinerary | null,
  targetCurrency: string,
  dynamicRates?: Record<SupportedCurrency, number>
): string {
  if (!itinerary) return "";
  const curr = (SUPPORTED_CURRENCIES.includes(targetCurrency as SupportedCurrency)
    ? targetCurrency
    : "INR") as SupportedCurrency;

  const budget = itinerary.budget;
  if (!budget) {
    return itinerary.budgetGuidance;
  }

  const { minInr, maxInr, isPlus } = budget.canonicalInr;
  const rate = dynamicRates?.[curr] || (budget.rateSnapshot?.rate && curr === budget.currency ? budget.rateSnapshot.rate : (DEFAULT_FALLBACK_RATES[curr] || 1));
  const minConverted = minInr * rate;
  const maxConverted = maxInr * rate;

  const inrMinFormatted = minInr === 0 ? "" : formatCurrencyAmount(minInr, "INR");
  const inrMaxFormatted = `${formatCurrencyAmount(maxInr, "INR")}${isPlus ? "+" : ""}`;
  const inrRangeFormatted = minInr === 0 ? `Under ${inrMaxFormatted}` : `${inrMinFormatted} – ${inrMaxFormatted}`;

  const durationLabel = `${itinerary.durationDays} days`;
  const inclusions = "Covers private chauffeur-driven vehicle, curated boutique stays, daily artisanal breakfast, and signature slow-travel experiences.";

  if (curr === "INR") {
    const minDisp = minInr === 0 ? "Up to" : `₹${minInr.toLocaleString("en-IN")} –`;
    const maxDisp = `₹${maxInr.toLocaleString("en-IN")}${isPlus ? "+" : ""}`;
    return `Indicative slow-luxury estimate: ${minDisp} ${maxDisp} (${durationLabel}). ${inclusions}`;
  }

  const minDisp = minInr === 0 ? "Up to" : `${formatCurrencyAmount(minConverted, curr, dynamicRates)} –`;
  const maxDisp = `${formatCurrencyAmount(maxConverted, curr, dynamicRates)}${isPlus ? "+" : ""}`;
  return `Indicative slow-luxury estimate: ${minDisp} ${maxDisp} (~${inrRangeFormatted}) (${durationLabel}). ${inclusions}`;
}

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

const FALLBACK_DESTINATIONS = [
  { id: "munnar", name: "Munnar", slug: "munnar", region: "Tea Hills & Mist" },
  { id: "alleppey", name: "Alleppey", slug: "alleppey", region: "Backwaters & Canals" },
  { id: "fort-kochi", name: "Fort Kochi", slug: "fort-kochi", region: "Colonial & Spice Heritage" },
  { id: "thekkady", name: "Thekkady", slug: "thekkady", region: "Periyar Tiger Reserve" },
  { id: "kovalam", name: "Kovalam", slug: "kovalam", region: "Quiet Coastal Beaches" },
  { id: "wayanad", name: "Wayanad", slug: "wayanad", region: "Rainforests & Mist" },
  { id: "kumarakom", name: "Kumarakom", slug: "kumarakom", region: "Vembanad Lake Sanctuary" },
  { id: "varkala", name: "Varkala", slug: "varkala", region: "Red Cliffs & Mineral Springs" },
  { id: "bekal", name: "Bekal", slug: "bekal", region: "Historic Fort & Secluded Shores" },
  { id: "kannur", name: "Kannur", slug: "kannur", region: "Theyyam & Heritage Coast" },
];

const STEPS = [
  {
    step: 1,
    title: "Trip Details",
    subtitle: "When & how long",
    badge: "TRIP DETAILS",
    hint: "Let's start with the basics",
  },
  {
    step: 2,
    title: "Travellers",
    subtitle: "Who's travelling",
    badge: "TRAVELLERS & PARTY",
    hint: "Tailoring space & rhythm",
  },
  {
    step: 3,
    title: "Journey Type",
    subtitle: "What kind of trip",
    badge: "JOURNEY SPIRIT",
    hint: "Setting the overall tone",
  },
  {
    step: 4,
    title: "Destinations",
    subtitle: "Where to go",
    badge: "CURATED DESTINATIONS",
    hint: "Verified Escora sanctuaries",
  },
  {
    step: 5,
    title: "Experiences",
    subtitle: "What to explore",
    badge: "EXPERIENCES & RHYTHMS",
    hint: "Multi-select supported",
  },
  {
    step: 6,
    title: "Travel Pace",
    subtitle: "How you like to travel",
    badge: "TRAVEL PACE",
    hint: "Unhurried Western Ghats transit",
  },
  {
    step: 7,
    title: "Budget",
    subtitle: "Your comfort range",
    badge: "BUDGET & COMFORT",
    hint: "Transparent indicative pricing",
  },
  {
    step: 8,
    title: "Special Requests",
    subtitle: "Any preferences",
    badge: "FINAL PREFERENCES",
    hint: "Review & bespoke generation",
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

  // Multi-step navigation state
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Trip Details state
  const [dateMode, setDateMode] = useState<"fixed" | "flexible" | "unsure">("fixed");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [durationDays, setDurationDays] = useState(7);
  const [seasonOrDates, setSeasonOrDates] = useState(SEASONS[0].label);
  const [customDates, setCustomDates] = useState("");

  // Step 2: Travellers state
  const [travelersCount, setTravelersCount] = useState(2);
  const [travelerType, setTravelerType] = useState(TRAVELER_TYPES[0].label);
  const [adultsCount, setAdultsCount] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);

  // Step 3: Journey Type state
  const [journeyType, setJourneyType] = useState(JOURNEY_TYPES[0].label);

  // Step 4: Destinations & Starting Gateway state
  const [startLocation, setStartLocation] = useState(START_HUBS[0].code);
  const [destinationMode, setDestinationMode] = useState<"choose" | "recommend" | "both">("choose");
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(["Munnar", "Alleppey"]);
  const [mustVisitDestinations, setMustVisitDestinations] = useState<string[]>(["Munnar"]);
  const [destinationSearch, setDestinationSearch] = useState("");

  // Step 5: Experiences state
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "tea-hills",
    "backwaters",
    "heritage",
  ]);

  // Step 6: Travel Pace state
  const [pace, setPace] = useState(PACING_OPTIONS[0].pace);

  // Step 7: Budget state
  const [budgetTier, setBudgetTier] = useState(BUDGET_TIERS[1].tier);
  const [currency, setCurrency] = useState("INR");

  const { data: currencyRatesData } = useGetCurrencyRates({
    query: {
      queryKey: getGetCurrencyRatesQueryKey(),
      staleTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  });
  const dynamicRates = currencyRatesData?.rates as Record<SupportedCurrency, number> | undefined;

  // Step 8: Special Requests state
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Result state
  const [itinerary, setItinerary] = useState<TripItinerary | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Composition animation state
  const [compositionStage, setCompositionStage] = useState<"idle" | "composing" | "ready">("idle");
  const composedTripTitleRef = useRef<string | null>(null);

  useEffect(() => {
    if (!itinerary) {
      setCompositionStage("idle");
      return;
    }

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setCompositionStage("ready");
      composedTripTitleRef.current = itinerary.title;
      return;
    }

    if (composedTripTitleRef.current === itinerary.title) {
      setCompositionStage("ready");
      return;
    }

    setCompositionStage("composing");
    const timer = setTimeout(() => {
      setCompositionStage("ready");
      composedTripTitleRef.current = itinerary.title;
    }, 1600);

    return () => clearTimeout(timer);
  }, [itinerary]);

  function handleScrollToForm() {
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Loading animation state
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  const itineraryRef = useRef<HTMLDivElement>(null);
  const formTopRef = useRef<HTMLDivElement>(null);

  const planMutation = useGenerateTripPlan();
  const { data: publishedDestinations } = useListDestinations({ published: true });

  const catalogDestinations =
    publishedDestinations && publishedDestinations.length > 0
      ? publishedDestinations
      : FALLBACK_DESTINATIONS;

  // Keep duration and dates consistent
  useEffect(() => {
    if (dateMode === "fixed" && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        if (diffDays >= 2 && diffDays <= 30) {
          setDurationDays(diffDays);
        }
        // Auto-detect season based on start month
        const month = start.getMonth() + 1;
        if (month >= 10 || month <= 2) {
          setSeasonOrDates("Winter Peak");
        } else if (month >= 6 && month <= 8) {
          setSeasonOrDates("Monsoon & Ayurveda");
        } else {
          setSeasonOrDates("Summer Mist");
        }
      }
    }
  }, [startDate, endDate, dateMode]);

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

  function selectDuration(days: number) {
    const bounded = Math.max(2, Math.min(30, days));
    setDurationDays(bounded);
    if (dateMode === "fixed" && startDate) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) {
        const end = new Date(start);
        end.setDate(start.getDate() + (bounded - 1));
        setEndDate(end.toISOString().split("T")[0]);
      }
    }
  }

  function toggleInterest(id: string) {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function toggleDestination(destName: string) {
    setSelectedDestinations((prev) => {
      if (prev.includes(destName)) {
        setMustVisitDestinations((m) => m.filter((d) => d !== destName));
        return prev.filter((d) => d !== destName);
      } else {
        return [...prev, destName];
      }
    });
  }

  function toggleMustVisit(e: React.MouseEvent, destName: string) {
    e.stopPropagation();
    setMustVisitDestinations((prev) =>
      prev.includes(destName) ? prev.filter((d) => d !== destName) : [...prev, destName]
    );
    if (!selectedDestinations.includes(destName)) {
      setSelectedDestinations((prev) => [...prev, destName]);
    }
  }

  function goToNextStep() {
    if (currentStep < 8) {
      setCurrentStep((s) => s + 1);
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function goToPrevStep() {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handleStepClick(targetStep: number) {
    setCurrentStep(targetStep);
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleGenerateItinerary(e?: React.FormEvent) {
    if (e) e.preventDefault();

    let formattedDates = seasonOrDates;
    if (dateMode === "fixed" && startDate && endDate) {
      formattedDates = `Fixed dates: ${startDate} to ${endDate}`;
    } else if (dateMode === "unsure") {
      formattedDates = "Flexible dates / Suggest best season";
    } else if (customDates.trim()) {
      formattedDates = customDates.trim();
    }

    const notesParts: string[] = [];
    if (journeyType) {
      notesParts.push(`Journey Spirit: ${journeyType}`);
    }
    if (destinationMode === "recommend") {
      notesParts.push("Destinations: Please recommend optimal sequence");
    } else if (selectedDestinations.length > 0) {
      const mustVisits = selectedDestinations.filter((d) => mustVisitDestinations.includes(d));
      if (mustVisits.length > 0) {
        notesParts.push(`Must-visit destinations: ${mustVisits.join(", ")}`);
      }
      const otherDests = selectedDestinations.filter((d) => !mustVisitDestinations.includes(d));
      if (otherDests.length > 0) {
        notesParts.push(`Additional preferred destinations: ${otherDests.join(", ")}`);
      }
      notesParts.push(`Destination Mode: ${destinationMode === "both" ? "Curated mix" : "Selected places"}`);
    }
    if (travelerType.includes("Family") && childrenCount > 0) {
      notesParts.push(`Party Breakdown: ${adultsCount} Adults, ${childrenCount} Children`);
    }
    if (additionalNotes.trim()) {
      notesParts.push(`Special Requests: ${additionalNotes.trim()}`);
    }

    const payload: TripPlanInput = {
      durationDays,
      seasonOrDates: formattedDates,
      startLocation,
      travelersCount,
      travelerType,
      budgetTier,
      currency,
      interests: selectedInterests.length > 0 ? selectedInterests : ["tea-hills", "backwaters"],
      pace,
      additionalNotes: notesParts.length > 0 ? notesParts.join(" | ") : undefined,
    };

    planMutation.mutate(
      { data: payload },
      {
        onSuccess: (data) => {
          setItinerary(data.itinerary);
          setTimeout(() => {
            itineraryRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 200);
        },
      }
    );
  }

  function handleContinueToHumanDesigner() {
    if (!itinerary) return;

    const destinationsList = itinerary.verifiedDestinations?.map((d) => d.name) || itinerary.routeSequence || [];
    const currentGuidance = getDynamicBudgetGuidance(itinerary, currency, dynamicRates);
    const selectedTierObj = BUDGET_TIERS.find((b) => b.tier === budgetTier) || BUDGET_TIERS[1];
    const budgetDisplay = getBudgetTierDisplay(selectedTierObj, currency, dynamicRates);

    const notesSummary = `AI Trip Plan Reference: "${itinerary.title}"\nRoute: ${itinerary.routeSequence?.join(" → ")}\nDuration: ${itinerary.durationDays} Days / ${itinerary.durationNights} Nights\nPace: ${itinerary.pace}\nCurrency: ${currency}\nEstimated Budget Guidance: ${currentGuidance}`;

    try {
      sessionStorage.setItem("escora_ai_trip_plan", JSON.stringify({
        title: itinerary.title,
        duration: itinerary.durationDays,
        destinations: destinationsList,
        budget: budgetTier,
        budgetRange: budgetDisplay,
        currency,
        style: travelerType,
        notes: notesSummary,
      }));
    } catch {
      // Ignore storage errors
    }

    const firstDest = destinationsList[0] || "Munnar";
    setLocation(`/plan?destination=${encodeURIComponent(firstDest)}&from=trip-planner&currency=${currency}&budget=${encodeURIComponent(budgetTier)}`);
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

  const activeStepMeta = STEPS[currentStep - 1] || STEPS[0];
  const isComposing = compositionStage === "composing";

  return (
    <Layout>
      <div className="bg-[#FAF8F5] min-h-screen text-[#293D1F]">
        {/* Hero Section — Preserved exactly */}
        <section className="relative pt-28 pb-16 px-4 sm:px-6 lg:px-8 border-b border-[#D5DED7]/60 overflow-hidden bg-gradient-to-b from-[#F2F6F3] to-[#FAF8F5]">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#193F2D]/10 border border-[#193F2D]/20 text-[#193F2D] text-xs font-mono uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5 text-[#758B78]" />
              <span>Grounded Slow-Luxury Engine</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#193F2D] leading-tight">
              Tailor Your Slow Voyage <br />
              <span className="italic font-normal text-[#758B78]">Across God&apos;s Own Country</span>
            </h1>

            <p className="text-sm sm:text-base text-[#56664C] max-w-2xl mx-auto leading-relaxed">
              An intelligent, catalog-grounded itinerary designer rooted exclusively in Escora&apos;s verified Kerala sanctuaries, colonial heritage ports, and private backwater lagoons.
            </p>

            <div className="flex items-center justify-center gap-6 pt-2 text-[11px] font-mono text-[#788A63]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#193F2D]" />
                100% Verified Published Catalog
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#193F2D]" />
                Realistic Western Ghats Pacing
              </span>
              <span className="flex items-center gap-1.5 hidden sm:flex">
                <Coins className="h-3.5 w-3.5 text-[#193F2D]" />
                Honest Indicative Guidance
              </span>
            </div>
          </div>
        </section>

        {/* Multi-Step Form Section — Two-Panel Layout */}
        <section ref={formTopRef} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <form onSubmit={handleGenerateItinerary}>
            {/* Mobile / Tablet Compact Step Header (< lg) */}
            <div className="lg:hidden mb-6 bg-white rounded-2xl p-4 border border-[#D5DED7] shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-semibold text-[#193F2D]">
                  Step {currentStep} of 8: <span className="font-sans font-medium text-[#293D1F]">{activeStepMeta.title}</span>
                </span>
                <span className="text-[11px] font-mono text-[#56664C]">
                  {Math.round((currentStep / 8) * 100)}% Completed
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#E2EAE4] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#193F2D] rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 8) * 100}%` }}
                />
              </div>
              {/* Mobile horizontal pill navigation */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
                {STEPS.map((s) => {
                  const isActive = s.step === currentStep;
                  const isCompleted = s.step < currentStep;
                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => handleStepClick(s.step)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0 transition-all ${
                        isActive
                          ? "bg-[#193F2D] text-white"
                          : isCompleted
                          ? "bg-[#E8F0EA] text-[#193F2D] border border-[#D5DED7]"
                          : "bg-white text-[#788A63] border border-[#D5DED7]/60"
                      }`}
                    >
                      {s.step}. {s.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop Two-Panel Layout */}
            <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-10">
              {/* Left Panel: Step Navigation (hidden on mobile, visible on desktop) */}
              <aside className="hidden lg:block w-72 shrink-0 bg-transparent py-2">
                <div className="sticky top-28 space-y-8">
                  {/* Vertical Step Navigator */}
                  <div className="relative pl-1">
                    {/* Continuous vertical connector line */}
                    <div className="absolute left-[17px] top-4 bottom-6 w-[1.5px] bg-[#D5DED7] -z-0" />

                    <div className="space-y-6 relative z-10">
                      {STEPS.map((s) => {
                        const isActive = s.step === currentStep;
                        const isCompleted = s.step < currentStep;
                        const isUpcoming = s.step > currentStep;

                        return (
                          <div
                            key={s.step}
                            onClick={() => (isCompleted || isActive) && handleStepClick(s.step)}
                            className={`flex items-start gap-3.5 group text-left transition-all ${
                              isCompleted || isActive ? "cursor-pointer" : "cursor-default"
                            }`}
                          >
                            {/* Numbered Indicator Circle */}
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-semibold shrink-0 transition-all ${
                                isActive
                                  ? "bg-[#193F2D] text-white shadow-xs ring-4 ring-[#193F2D]/15"
                                  : isCompleted
                                  ? "bg-[#E8F0EA] text-[#193F2D] border border-[#193F2D]/30 group-hover:bg-[#D5DED7]"
                                  : "bg-white text-[#758B78] border border-[#D5DED7]"
                              }`}
                            >
                              {isCompleted ? (
                                <Check className="h-3.5 w-3.5 text-[#193F2D]" />
                              ) : (
                                s.step
                              )}
                            </div>

                            {/* Step Labels */}
                            <div className="pt-0.5">
                              <div
                                className={`text-sm font-semibold transition-colors ${
                                  isActive
                                    ? "text-[#193F2D]"
                                    : isCompleted
                                    ? "text-[#293D1F] group-hover:text-[#193F2D]"
                                    : "text-[#758B78]"
                                }`}
                              >
                                {s.title}
                              </div>
                              <div
                                className={`text-xs mt-0.5 ${
                                  isActive
                                    ? "text-[#56664C]"
                                    : isCompleted
                                    ? "text-[#788A63]"
                                    : "text-[#A0B0A5]"
                                }`}
                              >
                                {s.subtitle}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sidebar Bottom Progress & Subtle Illustration */}
                  <div className="pt-4 border-t border-[#D5DED7]/70">
                    <div className="flex items-center justify-between text-xs font-mono text-[#56664C] mb-2">
                      <span className="font-semibold text-[#193F2D]">Step {currentStep} of 8</span>
                      <span>{Math.round((currentStep / 8) * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#E2EAE4] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#193F2D] rounded-full transition-all duration-300"
                        style={{ width: `${(currentStep / 8) * 100}%` }}
                      />
                    </div>

                    {/* Subtle aesthetic watermarked hills illustration */}
                    <div className="mt-6 flex justify-end pr-2 opacity-60">
                      <svg
                        className="w-24 h-10 text-[#193F2D]/25"
                        viewBox="0 0 100 40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.2"
                      >
                        <path d="M0 35 Q 25 12 50 30 T 100 20" />
                        <path d="M15 38 Q 45 20 75 35 T 100 32" />
                        <path d="M70 22 C 72 15 78 15 80 22" />
                        <path d="M85 24 C 86 18 90 18 92 24" />
                      </svg>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Right Panel: Active Step Content Card */}
              <main className="flex-1 w-full bg-white rounded-3xl border border-[#D5DED7] p-6 sm:p-10 shadow-2xs min-h-[580px] flex flex-col justify-between">
                <div>
                  {/* Step Top Header */}
                  <div className="border-b border-[#D5DED7]/60 pb-6 mb-8">
                    <div className="flex items-center justify-between text-xs text-[#56664C] mb-2">
                      <span className="font-mono uppercase tracking-widest text-[11px] font-semibold text-[#193F2D] flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#193F2D]" />
                        <span>{activeStepMeta.badge}</span>
                      </span>
                      <span className="text-[11px] font-mono text-[#788A63] flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-[#788A63]" />
                        <span>{activeStepMeta.hint}</span>
                      </span>
                    </div>

                    <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#193F2D] tracking-tight">
                      {currentStep === 1 && "When are you travelling?"}
                      {currentStep === 2 && "Who is travelling with you?"}
                      {currentStep === 3 && "What kind of journey are you envisioning?"}
                      {currentStep === 4 && "Where would you like to travel?"}
                      {currentStep === 5 && "What would you like to explore?"}
                      {currentStep === 6 && "How would you like to pace your journey?"}
                      {currentStep === 7 && "What is your comfort range?"}
                      {currentStep === 8 && "Any special requests or celebrations?"}
                    </h2>

                    <p className="text-xs sm:text-sm text-[#56664C] leading-relaxed mt-1.5 max-w-2xl">
                      {currentStep === 1 && "Choose your travel dates or just a duration — we'll suggest the best time based on the season."}
                      {currentStep === 2 && "Specify your travel party so we can tailor sanctuary accommodations and room configurations."}
                      {currentStep === 3 && "Select the primary spirit of your Kerala passage to guide our curator engine."}
                      {currentStep === 4 && "Choose from Escora's verified sanctuaries or let our algorithm sequence the optimal route."}
                      {currentStep === 5 && "Select any experiences and rhythms you gravitate towards during your journey."}
                      {currentStep === 6 && "Kerala's geography is best savoured unhurriedly. Choose a transit tempo that suits your travel style."}
                      {currentStep === 7 && "Indicative slow-luxury guidance including private chauffeur, heritage boutique stays, and curated activities."}
                      {currentStep === 8 && "Tell us about any dietary preferences, anniversaries, mobility needs, or specific wishes."}
                    </p>
                  </div>

                  {/* STEP 1: Trip Details */}
                  {currentStep === 1 && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      {/* Date Mode 3-Card Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <button
                          type="button"
                          onClick={() => setDateMode("fixed")}
                          className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                            dateMode === "fixed"
                              ? "bg-[#E8F0EA] border-[#193F2D] ring-1 ring-[#193F2D] shadow-2xs"
                              : "bg-white border-[#D5DED7] hover:bg-[#FAF8F5] hover:border-[#193F2D]/40"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-8 h-8 rounded-lg bg-[#E8F0EA] flex items-center justify-center text-[#193F2D]">
                              <Calendar className="h-4 w-4" />
                            </div>
                            {dateMode === "fixed" && (
                              <span className="w-4 h-4 rounded-full bg-[#193F2D] text-white flex items-center justify-center text-[10px]">
                                <Check className="h-2.5 w-2.5" />
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[#193F2D]">Fixed Dates</div>
                            <div className="text-xs text-[#56664C] mt-0.5">I know my travel dates</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDateMode("flexible")}
                          className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                            dateMode === "flexible"
                              ? "bg-[#E8F0EA] border-[#193F2D] ring-1 ring-[#193F2D] shadow-2xs"
                              : "bg-white border-[#D5DED7] hover:bg-[#FAF8F5] hover:border-[#193F2D]/40"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-8 h-8 rounded-lg bg-[#E8F0EA] flex items-center justify-center text-[#193F2D]">
                              <Calendar className="h-4 w-4" />
                            </div>
                            {dateMode === "flexible" && (
                              <span className="w-4 h-4 rounded-full bg-[#193F2D] text-white flex items-center justify-center text-[10px]">
                                <Check className="h-2.5 w-2.5" />
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[#193F2D]">Flexible Dates</div>
                            <div className="text-xs text-[#56664C] mt-0.5">Show me the best time</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDateMode("unsure")}
                          className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                            dateMode === "unsure"
                              ? "bg-[#E8F0EA] border-[#193F2D] ring-1 ring-[#193F2D] shadow-2xs"
                              : "bg-white border-[#D5DED7] hover:bg-[#FAF8F5] hover:border-[#193F2D]/40"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-8 h-8 rounded-lg bg-[#E8F0EA] flex items-center justify-center text-[#193F2D]">
                              <Calendar className="h-4 w-4" />
                            </div>
                            {dateMode === "unsure" && (
                              <span className="w-4 h-4 rounded-full bg-[#193F2D] text-white flex items-center justify-center text-[10px]">
                                <Check className="h-2.5 w-2.5" />
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[#193F2D]">I&apos;m not sure yet</div>
                            <div className="text-xs text-[#56664C] mt-0.5">Just choose a duration</div>
                          </div>
                        </button>
                      </div>

                      {/* Date Controls Container */}
                      {dateMode === "fixed" && (
                        <div className="bg-[#FAF8F5] border border-[#D5DED7] rounded-2xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-[#193F2D] mb-1.5">
                              Start Date
                            </label>
                            <div className="relative">
                              <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-white border border-[#D5DED7] rounded-xl px-3.5 py-2.5 text-xs text-[#293D1F] focus:outline-none focus:ring-1 focus:ring-[#193F2D] focus:border-[#193F2D] transition-all"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#193F2D] mb-1.5">
                              End Date
                            </label>
                            <div className="relative">
                              <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate || undefined}
                                className="w-full bg-white border border-[#D5DED7] rounded-xl px-3.5 py-2.5 text-xs text-[#293D1F] focus:outline-none focus:ring-1 focus:ring-[#193F2D] focus:border-[#193F2D] transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {dateMode === "flexible" && (
                        <div className="bg-[#FAF8F5] border border-[#D5DED7] rounded-2xl p-4 sm:p-5 space-y-3">
                          <label className="block text-xs font-semibold text-[#193F2D]">
                            Preferred Season or Window
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {SEASONS.map((s) => (
                              <button
                                key={s.label}
                                type="button"
                                onClick={() => {
                                  setSeasonOrDates(s.label);
                                  setCustomDates("");
                                }}
                                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                                  seasonOrDates === s.label && !customDates
                                    ? "bg-[#193F2D] text-white border-[#193F2D]"
                                    : "bg-white border-[#D5DED7] text-[#293D1F] hover:bg-[#E8F0EA]"
                                }`}
                              >
                                <div className="font-semibold">{s.label}</div>
                                <div className={`text-[10px] font-mono mt-0.5 ${seasonOrDates === s.label && !customDates ? "text-white/80" : "text-[#788A63]"}`}>
                                  {s.range}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {dateMode === "unsure" && (
                        <div className="bg-[#FAF8F5] border border-[#D5DED7] rounded-2xl p-4 sm:p-5 flex items-center gap-3 text-xs text-[#56664C]">
                          <div className="w-8 h-8 rounded-lg bg-[#E8F0EA] flex items-center justify-center text-[#193F2D] shrink-0">
                            <Sparkles className="h-4 w-4" />
                          </div>
                          <p>
                            No fixed dates needed! Pick a duration below, and our curation engine will suggest the most pleasant timing for your chosen journey style.
                          </p>
                        </div>
                      )}

                      {/* Subtle "OR" Divider */}
                      <div className="relative my-6">
                        <div className="border-t border-[#E2EAE4]" />
                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-[11px] font-mono text-[#788A63] tracking-widest uppercase">
                          OR
                        </span>
                      </div>

                      {/* Question 2: How long would you like to travel? */}
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-semibold text-[#193F2D]">
                            How long would you like to travel?
                          </label>
                          <span className="text-xs font-mono font-medium text-[#193F2D]">
                            {durationDays} Days / {Math.max(1, durationDays - 1)} Nights
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          {DURATION_PRESETS.map((days) => {
                            const isSelected = durationDays === days;
                            return (
                              <button
                                key={days}
                                type="button"
                                onClick={() => selectDuration(days)}
                                className={`p-3.5 rounded-2xl border text-center transition-all relative flex flex-col justify-center items-center ${
                                  isSelected
                                    ? "bg-[#193F2D] text-white border-[#193F2D] shadow-2xs"
                                    : "bg-white text-[#293D1F] border-[#D5DED7] hover:bg-[#FAF8F5]"
                                }`}
                              >
                                {isSelected && (
                                  <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white text-[#193F2D] flex items-center justify-center text-[10px]">
                                    <Check className="h-2.5 w-2.5" />
                                  </span>
                                )}
                                <span className="block text-sm font-semibold">{days} Days</span>
                                <span className={`text-[10px] block mt-0.5 ${isSelected ? "text-white/80" : "text-[#788A63]"}`}>
                                  {days - 1} Nights
                                </span>
                              </button>
                            );
                          })}

                          {/* Custom duration counter */}
                          <div className="border border-[#D5DED7] rounded-2xl p-3 bg-white flex flex-col justify-between items-center text-center">
                            <span className="text-xs font-semibold text-[#193F2D]">Custom</span>
                            <div className="flex items-center justify-center gap-2 mt-1">
                              <button
                                type="button"
                                onClick={() => selectDuration(durationDays - 1)}
                                className="w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#D5DED7] flex items-center justify-center text-xs font-bold text-[#193F2D] hover:bg-[#E8F0EA]"
                                aria-label="Decrease days"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-xs font-mono font-semibold text-[#193F2D] w-6 text-center">
                                {durationDays}d
                              </span>
                              <button
                                type="button"
                                onClick={() => selectDuration(durationDays + 1)}
                                className="w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#D5DED7] flex items-center justify-center text-xs font-bold text-[#193F2D] hover:bg-[#E8F0EA]"
                                aria-label="Increase days"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Tip Banner matching reference */}
                      <div className="bg-[#E8F0EA]/60 border border-[#D5DED7] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 mt-6">
                        <img
                          src={DESTINATION_PHOTOS.munnar}
                          alt="Munnar Tea Hills"
                          className="w-full sm:w-28 h-20 rounded-xl object-cover shrink-0 border border-[#D5DED7]/50 shadow-2xs"
                        />
                        <div className="space-y-1 text-center sm:text-left">
                          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs sm:text-sm font-semibold text-[#193F2D]">
                            <Leaf className="h-4 w-4 text-[#193F2D]" />
                            <span>Not sure about the exact dates?</span>
                          </div>
                          <p className="text-xs text-[#56664C] leading-relaxed">
                            That&apos;s completely fine. Choose a duration and we&apos;ll suggest the best time to travel based on the season, weather and local experiences.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Travellers */}
                  {currentStep === 2 && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <div className="space-y-3">
                        <label className="text-xs font-mono uppercase tracking-wider text-[#193F2D] font-semibold block">
                          Travel Party Type
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {TRAVELER_TYPES.map((t) => {
                            const isSelected = travelerType === t.label;
                            const IconComponent = t.icon;
                            return (
                              <button
                                key={t.label}
                                type="button"
                                onClick={() => setTravelerType(t.label)}
                                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                                  isSelected
                                    ? "bg-[#E8F0EA] border-[#193F2D] ring-1 ring-[#193F2D] shadow-2xs"
                                    : "bg-white border-[#D5DED7] hover:bg-[#FAF8F5]"
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  isSelected ? "bg-[#193F2D] text-white" : "bg-[#E8F0EA] text-[#193F2D]"
                                }`}>
                                  <IconComponent className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-xs text-[#193F2D] flex items-center justify-between">
                                    <span>{t.label}</span>
                                    {isSelected && <Check className="h-3.5 w-3.5 text-[#193F2D]" />}
                                  </div>
                                  <p className="text-[11px] text-[#56664C] mt-1">{t.desc}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Number of Travellers Counter */}
                      <div className="bg-[#FAF8F5] border border-[#D5DED7] rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-semibold text-[#193F2D]">Total Travellers</div>
                            <div className="text-[11px] text-[#788A63]">Accommodated across private suites or villas</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setTravelersCount((c) => Math.max(1, c - 1))}
                              className="w-8 h-8 rounded-full bg-white border border-[#D5DED7] flex items-center justify-center font-bold text-[#193F2D] hover:bg-[#E8F0EA]"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center font-mono font-semibold text-sm text-[#193F2D]">
                              {travelersCount}
                            </span>
                            <button
                              type="button"
                              onClick={() => setTravelersCount((c) => Math.min(20, c + 1))}
                              className="w-8 h-8 rounded-full bg-white border border-[#D5DED7] flex items-center justify-center font-bold text-[#193F2D] hover:bg-[#E8F0EA]"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Optional Adult / Child Details */}
                        {travelerType.includes("Family") && (
                          <div className="pt-4 border-t border-[#D5DED7]/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#D5DED7]/60">
                              <div>
                                <span className="text-xs font-semibold text-[#193F2D] block">Adults (12+)</span>
                                <span className="text-[10px] text-[#788A63]">Primary guests</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setAdultsCount((a) => Math.max(1, a - 1))}
                                  className="w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#D5DED7] flex items-center justify-center text-xs text-[#193F2D]"
                                >
                                  -
                                </button>
                                <span className="font-mono text-xs font-semibold text-[#193F2D] w-4 text-center">
                                  {adultsCount}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setAdultsCount((a) => Math.min(10, a + 1))}
                                  className="w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#D5DED7] flex items-center justify-center text-xs text-[#193F2D]"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#D5DED7]/60">
                              <div>
                                <span className="text-xs font-semibold text-[#193F2D] block">Children (0–11)</span>
                                <span className="text-[10px] text-[#788A63]">Extra beds or interconnecting rooms</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setChildrenCount((c) => Math.max(0, c - 1))}
                                  className="w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#D5DED7] flex items-center justify-center text-xs text-[#193F2D]"
                                >
                                  -
                                </button>
                                <span className="font-mono text-xs font-semibold text-[#193F2D] w-4 text-center">
                                  {childrenCount}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setChildrenCount((c) => Math.min(10, c + 1))}
                                  className="w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#D5DED7] flex items-center justify-center text-xs text-[#193F2D]"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Journey Type */}
                  {currentStep === 3 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {JOURNEY_TYPES.map((jt) => {
                          const isSelected = journeyType === jt.label;
                          return (
                            <button
                              key={jt.id}
                              type="button"
                              onClick={() => setJourneyType(jt.label)}
                              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                                isSelected
                                  ? "bg-[#E8F0EA] border-[#193F2D] ring-1 ring-[#193F2D] shadow-2xs"
                                  : "bg-white border-[#D5DED7] hover:bg-[#FAF8F5]"
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xl">{jt.icon}</span>
                                  {isSelected && (
                                    <span className="w-4 h-4 rounded-full bg-[#193F2D] text-white flex items-center justify-center text-[10px]">
                                      <Check className="h-2.5 w-2.5" />
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs font-semibold text-[#193F2D]">{jt.label}</div>
                                <p className="text-[11px] text-[#56664C] mt-1.5 leading-relaxed">{jt.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* STEP 4: Destinations & Starting Hub */}
                  {currentStep === 4 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      {/* Starting Gateway / Hub */}
                      <div className="space-y-2.5">
                        <label className="text-xs font-mono uppercase tracking-wider text-[#193F2D] font-semibold flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-[#193F2D]" />
                          <span>Starting Hub / Arrival Gateway</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                          {START_HUBS.map((hub) => (
                            <button
                              key={hub.code}
                              type="button"
                              onClick={() => setStartLocation(hub.code)}
                              className={`p-3 rounded-xl border text-left text-xs transition-all ${
                                startLocation === hub.code
                                  ? "bg-[#193F2D] text-white border-[#193F2D]"
                                  : "bg-white border-[#D5DED7] text-[#293D1F] hover:bg-[#FAF8F5]"
                              }`}
                            >
                              <div className="font-semibold text-xs truncate">{hub.name.split("(")[0]}</div>
                              <span className={`text-[10px] font-mono block mt-0.5 ${
                                startLocation === hub.code ? "text-white/80" : "text-[#788A63]"
                              }`}>
                                {hub.code === "Flexible" ? "Escora Curated" : hub.code}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Mode selector */}
                      <div className="space-y-2.5 pt-2">
                        <label className="text-xs font-mono uppercase tracking-wider text-[#193F2D] font-semibold block">
                          Destination Selection Mode
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {[
                            { id: "choose", label: "I'll choose", desc: "Select specific places" },
                            { id: "recommend", label: "Recommend for me", desc: "Optimal algorithm route" },
                            { id: "both", label: "A mix of both", desc: "Must-visits + bridge" },
                          ].map((mode) => (
                            <button
                              key={mode.id}
                              type="button"
                              onClick={() => setDestinationMode(mode.id as any)}
                              className={`p-3 rounded-xl border text-left text-xs transition-all ${
                                destinationMode === mode.id
                                  ? "bg-[#E8F0EA] border-[#193F2D] ring-1 ring-[#193F2D] text-[#193F2D]"
                                  : "bg-white border-[#D5DED7] text-[#56664C] hover:bg-[#FAF8F5]"
                              }`}
                            >
                              <div className="font-semibold">{mode.label}</div>
                              <div className="text-[10px] text-[#788A63] mt-0.5">{mode.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Destination Catalog Grid (when choose or both) */}
                      {destinationMode !== "recommend" ? (
                        <div className="space-y-3 pt-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <label className="text-xs font-mono uppercase tracking-wider text-[#193F2D] font-semibold">
                              Select from Verified Escora Catalog
                            </label>
                            {/* Search input */}
                            <div className="relative w-full sm:w-64">
                              <Search className="h-3.5 w-3.5 text-[#788A63] absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={destinationSearch}
                                onChange={(e) => setDestinationSearch(e.target.value)}
                                placeholder="Search destinations..."
                                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#D5DED7] text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#193F2D]"
                              />
                            </div>
                          </div>

                          {/* Selected destinations chips */}
                          {selectedDestinations.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-[#FAF8F5] rounded-xl border border-[#D5DED7]/60">
                              <span className="text-[11px] font-mono text-[#56664C] mr-1">Selected:</span>
                              {selectedDestinations.map((name) => {
                                const isMust = mustVisitDestinations.includes(name);
                                return (
                                  <span
                                    key={name}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#D5DED7] text-xs text-[#193F2D] font-medium"
                                  >
                                    {isMust && <Star className="h-3 w-3 fill-[#193F2D] text-[#193F2D]" />}
                                    <span>{name}</span>
                                    <button
                                      type="button"
                                      onClick={() => toggleDestination(name)}
                                      className="hover:text-red-600 ml-0.5"
                                      aria-label={`Remove ${name}`}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {/* Destination Cards */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1">
                            {catalogDestinations
                              .filter((d: any) =>
                                d.name.toLowerCase().includes(destinationSearch.toLowerCase()) ||
                                (d.region && d.region.toLowerCase().includes(destinationSearch.toLowerCase()))
                              )
                              .map((dest: any) => {
                                const isSelected = selectedDestinations.includes(dest.name);
                                const isMust = mustVisitDestinations.includes(dest.name);
                                const slug = dest.slug || dest.name.toLowerCase().replace(/\s+/g, "-");
                                const photo = DESTINATION_PHOTOS[slug] || DESTINATION_PHOTOS[dest.name.toLowerCase()];

                                return (
                                  <div
                                    key={dest.name}
                                    onClick={() => toggleDestination(dest.name)}
                                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                                      isSelected
                                        ? "bg-[#E8F0EA] border-[#193F2D] ring-1 ring-[#193F2D]"
                                        : "bg-white border-[#D5DED7] hover:border-[#193F2D]/40 hover:bg-[#FAF8F5]"
                                    }`}
                                  >
                                    {photo ? (
                                      <img
                                        src={photo}
                                        alt={dest.name}
                                        className="w-10 h-10 rounded-lg object-cover shrink-0 border border-[#D5DED7]/40"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-lg bg-[#E8F0EA] flex items-center justify-center text-[#193F2D] text-xs font-serif font-bold shrink-0">
                                        {dest.name[0]}
                                      </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-xs text-[#193F2D] truncate flex items-center justify-between">
                                        <span className="truncate">{dest.name}</span>
                                      </div>
                                      <span className="text-[10px] text-[#788A63] truncate block">
                                        {dest.region || "Kerala Sanctuary"}
                                      </span>
                                    </div>

                                    {isSelected && (
                                      <button
                                        type="button"
                                        onClick={(e) => toggleMustVisit(e, dest.name)}
                                        className="p-1 text-[#788A63] hover:text-[#193F2D]"
                                        title={isMust ? "Must-Visit destination" : "Mark as Must-Visit"}
                                      >
                                        <Star
                                          className={`h-3.5 w-3.5 ${
                                            isMust ? "fill-[#193F2D] text-[#193F2D]" : "text-[#D5DED7]"
                                          }`}
                                        />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#D5DED7] space-y-2">
                          <div className="text-xs font-semibold text-[#193F2D] flex items-center gap-1.5">
                            <Compass className="h-4 w-4 text-[#193F2D]" />
                            <span>Algorithmic Route Curation</span>
                          </div>
                          <p className="text-xs text-[#56664C] leading-relaxed">
                            Escora&apos;s slow-travel engine will calculate realistic Western Ghats driving corridors and handpick 2–4 complementary sanctuaries tailored specifically to your {durationDays}-day timeline and {journeyType} preferences.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 5: Experiences (Interests) */}
                  {currentStep === 5 && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {INTERESTS.map((int) => {
                          const isSelected = selectedInterests.includes(int.id);
                          return (
                            <button
                              key={int.id}
                              type="button"
                              onClick={() => toggleInterest(int.id)}
                              className={`p-3.5 rounded-2xl border text-left text-xs transition-all flex items-start gap-3 ${
                                isSelected
                                  ? "bg-[#E8F0EA] border-[#193F2D] ring-1 ring-[#193F2D] shadow-2xs"
                                  : "bg-white border-[#D5DED7] text-[#56664C] hover:bg-[#FAF8F5]"
                              }`}
                            >
                              <span className="text-xl shrink-0 mt-0.5">{int.icon}</span>
                              <div className="flex-1">
                                <div className="font-semibold flex items-center justify-between text-xs text-[#193F2D]">
                                  <span>{int.label}</span>
                                  {isSelected && <Check className="h-3.5 w-3.5 text-[#193F2D]" />}
                                </div>
                                <p className="text-[11px] text-[#56664C] mt-1 leading-relaxed">{int.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* STEP 6: Travel Pace */}
                  {currentStep === 6 && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="space-y-3">
                        {PACING_OPTIONS.map((p) => {
                          const isSelected = pace === p.pace;
                          return (
                            <button
                              key={p.pace}
                              type="button"
                              onClick={() => setPace(p.pace)}
                              className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                                isSelected
                                  ? "bg-[#E8F0EA] border-[#193F2D] ring-1 ring-[#193F2D] shadow-2xs"
                                  : "bg-white border-[#D5DED7] hover:bg-[#FAF8F5]"
                              }`}
                            >
                              <div>
                                <div className="font-semibold text-xs sm:text-sm text-[#193F2D]">{p.pace}</div>
                                <p className="text-xs text-[#56664C] mt-1 leading-relaxed">{p.desc}</p>
                              </div>
                              {isSelected && (
                                <span className="w-5 h-5 rounded-full bg-[#193F2D] text-white flex items-center justify-center shrink-0 text-xs">
                                  <Check className="h-3 w-3" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* STEP 7: Budget */}
                  {currentStep === 7 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      {/* Currency selector */}
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-mono uppercase tracking-wider text-[#193F2D] font-semibold">
                          Preferred Currency
                        </label>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono">
                          {SUPPORTED_CURRENCIES.map((curr) => {
                            const isCurrSelected = currency === curr;
                            return (
                              <button
                                key={curr}
                                type="button"
                                onClick={() => setCurrency(curr)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                                  isCurrSelected
                                    ? "bg-[#193F2D] text-white shadow-xs"
                                    : "bg-white text-[#56664C] border border-[#D5DED7] hover:bg-[#E8F0EA] hover:text-[#193F2D]"
                                }`}
                                data-testid={`currency-${curr}`}
                              >
                                {curr}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Transparent Exchange Rate Caption (Requirement 7) */}
                      {currencyRatesData && (
                        <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#D5DED7]/70 text-[11px] font-mono text-[#56664C] flex flex-wrap items-center justify-between gap-2">
                          <span>
                            Indicative reference exchange rates · Reference date:{" "}
                            <span className="font-semibold text-[#193F2D]">{currencyRatesData.referenceDate}</span>{" "}
                            ({currencyRatesData.status === "live" ? "Live ECB reference" : currencyRatesData.status === "cached" ? "Daily cached reference" : "Indicative reference"}). Final pricing is confirmed with your dedicated Escora travel designer.
                          </span>
                          <a
                            href="https://frankfurter.dev"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#758B78] hover:text-[#193F2D] underline inline-flex items-center gap-1 shrink-0"
                          >
                            <span>ECB via Frankfurter</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </div>
                      )}

                      {/* Budget Tiers */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                        {BUDGET_TIERS.map((b) => {
                          const isSelected = budgetTier === b.tier;
                          return (
                            <button
                              key={b.tier}
                              type="button"
                              onClick={() => setBudgetTier(b.tier)}
                              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                                isSelected
                                  ? "bg-[#193F2D] text-white border-[#193F2D] shadow-2xs"
                                  : "bg-white border-[#D5DED7] text-[#293D1F] hover:bg-[#E8F0EA]/40"
                              }`}
                            >
                              <div>
                                <div className="font-semibold text-xs sm:text-sm">{b.tier}</div>
                                <div className={`text-xs font-mono mt-1 ${isSelected ? "text-[#E8F0EA] font-semibold" : "text-[#193F2D] font-semibold"}`}>
                                  {getBudgetTierDisplay(b, currency, dynamicRates)}
                                </div>
                                <p className={`text-[11px] mt-2 leading-relaxed ${isSelected ? "text-white/85" : "text-[#56664C]"}`}>
                                  {b.desc}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* STEP 8: Special Requests & Review */}
                  {currentStep === 8 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-wider text-[#193F2D] font-semibold block">
                          Special Requests & Notes (Optional)
                        </label>
                        <textarea
                          rows={3}
                          value={additionalNotes}
                          onChange={(e) => setAdditionalNotes(e.target.value)}
                          placeholder="e.g., We celebrate our 10th anniversary; prefer private heritage villas, vegetarian cuisine, and zero early morning transfers..."
                          className="w-full rounded-2xl border border-[#D5DED7] p-4 text-xs bg-[#FAF8F5] text-[#293D1F] placeholder:text-[#788A63] focus:outline-none focus:ring-1 focus:ring-[#193F2D] focus:bg-white transition-all resize-none"
                          maxLength={1000}
                        />
                      </div>

                      {/* Summary Review Card */}
                      <div className="bg-[#FAF8F5] border border-[#D5DED7] rounded-2xl p-5 space-y-3">
                        <div className="text-xs font-mono uppercase tracking-wider font-semibold text-[#193F2D]">
                          Journey Summary Snapshot
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-[10px] font-mono text-[#788A63] block uppercase">Duration</span>
                            <span className="font-semibold text-[#193F2D]">{durationDays} Days / {durationDays - 1} Nights</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-[#788A63] block uppercase">Dates / Season</span>
                            <span className="font-semibold text-[#193F2D]">
                              {dateMode === "fixed" && startDate && endDate
                                ? `${startDate} to ${endDate}`
                                : dateMode === "unsure"
                                ? "Flexible / Season guidance"
                                : seasonOrDates}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-[#788A63] block uppercase">Travellers</span>
                            <span className="font-semibold text-[#193F2D]">{travelersCount} ({travelerType})</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-[#788A63] block uppercase">Journey Spirit</span>
                            <span className="font-semibold text-[#193F2D]">{journeyType}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-[#788A63] block uppercase">Destinations</span>
                            <span className="font-semibold text-[#193F2D] truncate block">
                              {destinationMode === "recommend"
                                ? "Escora Curated Route"
                                : selectedDestinations.length > 0
                                ? selectedDestinations.join(", ")
                                : "Flexible"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-[#788A63] block uppercase">Budget Tier</span>
                            <span className="font-semibold text-[#193F2D] block truncate">{budgetTier} ({currency})</span>
                            <span className="text-[10px] font-mono text-[#56664C] block truncate">
                              {getBudgetTierDisplay(BUDGET_TIERS.find((b) => b.tier === budgetTier) || BUDGET_TIERS[1], currency, dynamicRates)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#788A63] pt-1">
                        <ShieldCheck className="h-4 w-4 text-[#193F2D]" />
                        <span>100% verified Escora catalog data. Instant bespoke slow-luxury generation.</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Navigation Row */}
                <div className="pt-8 border-t border-[#E2EAE4] flex items-center justify-between gap-4 mt-8">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={goToPrevStep}
                      className="px-5 py-2.5 rounded-full border border-[#D5DED7] text-[#293D1F] hover:bg-[#E8F0EA] text-xs sm:text-sm font-medium flex items-center gap-2 transition-all"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  {currentStep < 8 ? (
                    <button
                      type="button"
                      onClick={goToNextStep}
                      className="px-7 py-3 rounded-full bg-[#193F2D] hover:bg-[#255239] text-white text-xs sm:text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
                    >
                      <span>Continue to {STEPS[currentStep].title}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={planMutation.isPending}
                      className="px-8 py-3.5 rounded-full bg-[#193F2D] hover:bg-[#255239] text-white text-xs sm:text-sm font-medium flex items-center gap-2 shadow-sm transition-all"
                      data-testid="button-generate-trip-plan"
                    >
                      <Sparkles className="h-4 w-4 text-[#E8F0EA]" />
                      <span>{planMutation.isPending ? "Crafting Itinerary..." : "Design Bespoke Itinerary"}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </main>
            </div>
          </form>

          {/* Loading Overlay / Progress Card */}
          {planMutation.isPending && (
            <div className="mt-8 p-10 rounded-3xl bg-white border border-[#D5DED7] text-center space-y-4 shadow-sm animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-full bg-[#E8F0EA] border border-[#758B78]/40 flex items-center justify-center mx-auto text-[#193F2D] animate-pulse">
                <Compass className="h-7 w-7 animate-spin [animation-duration:8s]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-semibold text-[#193F2D]">
                  Curating Your Slow-Luxury Passage
                </h3>
                <p className="text-xs text-[#56664C] italic font-mono transition-all duration-300">
                  {LOADING_STEPS[loadingStepIndex]}
                </p>
              </div>
              <div className="max-w-xs mx-auto h-1.5 bg-[#E8F0EA] rounded-full overflow-hidden">
                <div className="h-full bg-[#193F2D] rounded-full animate-progress" />
              </div>
            </div>
          )}

          {/* Error Message */}
          {planMutation.isError && (
            <div className="mt-8 p-6 rounded-2xl bg-[#E8F0EA] border border-[#D5DED7] space-y-3">
              <div className="flex items-center gap-2 text-[#193F2D] font-semibold text-sm">
                <AlertCircle className="h-5 w-5 text-[#193F2D]" />
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
                className="text-xs border-[#193F2D]/30 text-[#193F2D] hover:bg-[#193F2D] hover:text-white"
              >
                <RefreshCw className="h-3 w-3 mr-1" /> Retry Generation
              </Button>
            </div>
          )}

          {/* Generated Itinerary View — Unified Editorial Travel Proposal */}
          {itinerary && (
            <div
              ref={itineraryRef}
              className="mt-12 max-w-4xl mx-auto bg-white rounded-3xl border border-[#D5DED7] shadow-sm overflow-hidden text-[#293D1F]"
            >
              {/* Embedded CSS for AI Composition Animation & Print Styles */}
              <style>{`
                @keyframes titleStrokeDraw {
                  0% { stroke-dashoffset: 180; }
                  100% { stroke-dashoffset: 0; }
                }
                @keyframes clipRevealText {
                  0% { clip-path: inset(0 100% 0 0); opacity: 0.15; }
                  100% { clip-path: inset(0 0 0 0); opacity: 1; }
                }
                @keyframes editorialFadeUp {
                  0% { opacity: 0; transform: translateY(10px); }
                  100% { opacity: 1; transform: translateY(0); }
                }
                .animate-stroke-draw {
                  stroke-dasharray: 180;
                  stroke-dashoffset: 0;
                  animation: titleStrokeDraw 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-clip-title {
                  animation: clipRevealText 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-editorial-fade {
                  animation: editorialFadeUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) both;
                }
                @media (prefers-reduced-motion: reduce) {
                  .animate-stroke-draw,
                  .animate-clip-title,
                  .animate-editorial-fade {
                    animation: none !important;
                    opacity: 1 !important;
                    clip-path: none !important;
                    transform: none !important;
                    stroke-dashoffset: 0 !important;
                  }
                }
                @media print {
                  .no-print { display: none !important; }
                  .print-break-inside-avoid { break-inside: avoid; }
                  body { background: white !important; }
                }
              `}</style>

              {/* A. Trip Introduction & Header */}
              <div className="p-6 sm:p-10 space-y-6">
                {/* Folio Meta Row & Document Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D5DED7]/70 pb-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#758B78] font-semibold">
                      Bespoke Voyage Proposal
                    </span>
                    <span className="text-xs text-[#56664C] font-mono">
                      • {itinerary.durationDays} Days / {itinerary.durationNights} Nights
                    </span>
                    {/* Composition Status Indicator */}
                    {compositionStage === "composing" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F0EA] text-[#193F2D] text-[11px] font-mono font-medium animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#193F2D]" />
                        Composing your journey...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F0EA] text-[#193F2D] text-[11px] font-mono font-medium">
                        <Sparkles className="h-3 w-3 text-[#758B78]" />
                        Your journey is ready
                      </span>
                    )}
                  </div>

                  {/* Actions: Copy, Print, Modify */}
                  <div className="flex items-center gap-2 no-print">
                    <button
                      type="button"
                      onClick={handleCopySummary}
                      className="px-3 py-1.5 rounded-lg border border-[#D5DED7] hover:bg-[#FAF8F5] text-xs text-[#193F2D] transition-colors flex items-center gap-1.5 font-medium"
                      title="Copy itinerary summary"
                    >
                      {copiedLink ? <Check className="h-3.5 w-3.5 text-[#193F2D]" /> : <Share2 className="h-3.5 w-3.5 text-[#758B78]" />}
                      <span className="hidden sm:inline">{copiedLink ? "Copied" : "Copy"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3 py-1.5 rounded-lg border border-[#D5DED7] hover:bg-[#FAF8F5] text-xs text-[#193F2D] transition-colors flex items-center gap-1.5 font-medium"
                      title="Print or save as PDF"
                    >
                      <Printer className="h-3.5 w-3.5 text-[#758B78]" />
                      <span className="hidden sm:inline">Print</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleScrollToForm}
                      className="px-3 py-1.5 rounded-lg border border-[#D5DED7] hover:bg-[#FAF8F5] text-xs text-[#758B78] hover:text-[#193F2D] transition-colors flex items-center gap-1.5 font-medium"
                      title="Adjust preferences"
                    >
                      <RotateCcw className="h-3 w-3 text-[#758B78]" />
                      <span className="hidden sm:inline">Modify</span>
                    </button>
                  </div>
                </div>

                {/* Editorial Title & Overview */}
                <div className="space-y-3 pt-1">
                  <div className="relative inline-block">
                    <h2
                      className={`font-serif text-2xl sm:text-4xl lg:text-[2.6rem] font-medium text-[#193F2D] leading-[1.2] tracking-tight ${
                        isComposing ? "animate-clip-title" : ""
                      }`}
                    >
                      {itinerary.title}
                    </h2>
                    {/* AI composition SVG stroke underline accent */}
                    <div className="pt-2">
                      <svg
                        className={`h-2.5 w-40 text-[#758B78] ${
                          isComposing ? "animate-stroke-draw" : ""
                        }`}
                        viewBox="0 0 160 10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      >
                        <path d="M2 8 C 45 2, 95 10, 158 4" />
                      </svg>
                    </div>
                  </div>

                  <p
                    className={`font-serif italic text-[#56664C] text-base sm:text-lg leading-relaxed ${
                      isComposing ? "animate-editorial-fade [animation-delay:200ms]" : ""
                    }`}
                  >
                    &ldquo;{itinerary.tagline}&rdquo;
                  </p>

                  <p
                    className={`text-xs sm:text-sm text-[#56664C] leading-relaxed max-w-3xl whitespace-pre-line pt-1 ${
                      isComposing ? "animate-editorial-fade [animation-delay:300ms]" : ""
                    }`}
                  >
                    {itinerary.overview}
                  </p>
                </div>

                {/* Route Sequence Ribbon */}
                <div
                  className={`pt-1 ${
                    isComposing ? "animate-editorial-fade [animation-delay:400ms]" : ""
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#758B78] font-semibold block mb-2">
                    Curated Route Sequence:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {itinerary.routeSequence.map((stop, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="px-3.5 py-1 rounded-full bg-[#FAF8F5] border border-[#D5DED7] text-xs font-medium text-[#193F2D]">
                          {stop}
                        </span>
                        {idx < itinerary.routeSequence.length - 1 && (
                          <ChevronRight className="h-3.5 w-3.5 text-[#758B78]" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Metadata Spec Strip */}
                <div
                  className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#FAF8F5] border border-[#D5DED7]/70 text-xs ${
                    isComposing ? "animate-editorial-fade [animation-delay:480ms]" : ""
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#758B78] block">
                      Duration
                    </span>
                    <span className="font-semibold text-[#193F2D]">
                      {itinerary.durationDays} Days / {itinerary.durationNights} Nights
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#758B78] block">
                      Pacing
                    </span>
                    <span className="font-semibold text-[#193F2D]">{itinerary.pace}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#758B78] block">
                      Ideal Season
                    </span>
                    <span className="font-semibold text-[#193F2D]">{itinerary.idealSeason}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#758B78] block">
                        Comfort Range
                      </span>
                      {/* Currency switcher buttons */}
                      <div className="flex items-center gap-0.5 no-print">
                        {SUPPORTED_CURRENCIES.map((curr) => (
                          <button
                            key={curr}
                            type="button"
                            onClick={() => setCurrency(curr)}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-semibold transition-all ${
                              currency === curr
                                ? "bg-[#193F2D] text-white shadow-2xs"
                                : "bg-white text-[#56664C] border border-[#D5DED7] hover:bg-[#E8F0EA] hover:text-[#193F2D]"
                            }`}
                            data-testid={`itinerary-currency-${curr}`}
                            title={`Display amounts in ${curr}`}
                          >
                            {curr}
                          </button>
                        ))}
                      </div>
                    </div>
                    <span className="font-semibold text-[#193F2D] block">
                      {budgetTier}
                    </span>
                    <span className="text-[11px] font-mono font-medium text-[#193F2D] block truncate">
                      {getBudgetTierDisplay(BUDGET_TIERS.find((b) => b.tier === budgetTier) || BUDGET_TIERS[1], currency, dynamicRates)}
                    </span>
                  </div>
                </div>

                {/* Realistic Assessment Advisory (if present) */}
                {itinerary.realisticAssessment && (
                  <div
                    className={`p-4 rounded-2xl bg-[#E8F0EA]/70 border border-[#D5DED7] space-y-1.5 ${
                      isComposing ? "animate-editorial-fade [animation-delay:550ms]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[#193F2D] text-xs font-semibold font-mono uppercase tracking-wider">
                      <ShieldCheck className="h-4 w-4 text-[#758B78]" />
                      <span>Slow-Luxury Feasibility & Transit Assessment</span>
                    </div>
                    <p className="text-xs text-[#56664C] leading-relaxed">
                      {itinerary.realisticAssessment}
                    </p>
                  </div>
                )}
              </div>

              {/* B. Day-by-Day Journey Arc — Continuous Timeline */}
              <div className="border-t border-[#D5DED7]/70 p-6 sm:p-10 space-y-8 bg-[#FAF8F5]/30">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#758B78] font-semibold block">
                      Curated Chronicle
                    </span>
                    <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#193F2D] mt-0.5">
                      Day-by-Day Journey Arc
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-[#56664C] bg-[#E8F0EA] px-3 py-1 rounded-full border border-[#D5DED7]">
                    {itinerary.days.length} Daily Chapters
                  </span>
                </div>

                {/* Continuous Timeline */}
                <div className="relative pl-7 sm:pl-9">
                  {/* Subtle vertical connector line */}
                  <div className="absolute left-[13px] sm:left-[17px] top-4 bottom-8 w-[1.5px] bg-[#D5DED7]" />

                  <div className="space-y-8 relative z-10">
                    {itinerary.days.map((day, idx) => (
                      <div
                        key={day.day}
                        className={`relative group ${
                          isComposing ? "animate-editorial-fade" : ""
                        }`}
                        style={
                          isComposing
                            ? { animationDelay: `${Math.min(1300, 600 + idx * 100)}ms` }
                            : undefined
                        }
                      >
                        {/* Timeline Marker Circle */}
                        <div className="absolute -left-7 sm:-left-9 top-0.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#193F2D] text-white flex items-center justify-center font-mono text-xs font-bold ring-4 ring-white shadow-2xs">
                          {day.day}
                        </div>

                        {/* Day Content Container */}
                        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#D5DED7] shadow-2xs space-y-4 transition-all hover:border-[#193F2D]/30">
                          {/* Day Header */}
                          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#D5DED7]/50 pb-3">
                            <div className="flex flex-wrap items-baseline gap-2">
                              <h4 className="font-serif font-medium text-base sm:text-lg text-[#193F2D]">
                                {day.title}
                              </h4>
                              {day.theme && (
                                <span className="text-xs font-mono text-[#758B78] italic">
                                  — {day.theme}
                                </span>
                              )}
                            </div>

                            {day.destinationSlug ? (
                              <Link
                                href={`/destinations/${day.destinationSlug}`}
                                className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#E8F0EA] border border-[#D5DED7] text-[#193F2D] hover:bg-[#193F2D] hover:text-white transition-colors"
                              >
                                <span>{day.destination}</span>
                                <ExternalLink className="h-2.5 w-2.5" />
                              </Link>
                            ) : (
                              <span className="text-xs font-mono text-[#56664C] bg-[#FAF8F5] border border-[#D5DED7] px-2.5 py-0.5 rounded-full">
                                {day.destination}
                              </span>
                            )}
                          </div>

                          {/* 3 Activities Blocks */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#D5DED7]/60 space-y-1">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-[#758B78] font-semibold flex items-center gap-1">
                                <span>🌅</span> Morning Rhythm
                              </span>
                              <p className="text-[#293D1F] leading-relaxed">{day.morningActivity}</p>
                            </div>
                            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#D5DED7]/60 space-y-1">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-[#758B78] font-semibold flex items-center gap-1">
                                <span>☀️</span> Afternoon Discovery
                              </span>
                              <p className="text-[#293D1F] leading-relaxed">{day.afternoonActivity}</p>
                            </div>
                            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#D5DED7]/60 space-y-1">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-[#758B78] font-semibold flex items-center gap-1">
                                <span>🌙</span> Evening Serenity
                              </span>
                              <p className="text-[#293D1F] leading-relaxed">{day.eveningActivity}</p>
                            </div>
                          </div>

                          {/* Stay & Travel Note */}
                          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs border-t border-[#D5DED7]/50 text-[#56664C]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] uppercase tracking-wider text-[#758B78] font-semibold">
                                Sanctuary:
                              </span>
                              <span className="font-medium text-[#193F2D]">{day.stayRecommendation}</span>
                            </div>
                            {day.travelNote && (
                              <div className="text-[11px] font-mono text-[#788A63] italic flex items-center gap-1">
                                <span>🚗</span>
                                <span>{day.travelNote}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Closing Action Area: Handcraft with Escora Travel Designer */}
              <div className="border-t border-[#D5DED7]/70 p-6 sm:p-10 space-y-8 bg-white no-print">

                {/* Designer Handcraft Closing Area */}
                <div className="p-6 sm:p-8 rounded-2xl bg-[#E8F0EA]/60 border border-[#D5DED7] text-center space-y-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#D5DED7] flex items-center justify-center mx-auto text-[#193F2D]">
                    <Compass className="h-5 w-5" />
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#193F2D]">
                    Bring This Voyage to Life
                  </h3>
                  <p className="text-xs sm:text-sm text-[#56664C] max-w-xl mx-auto leading-relaxed">
                    Every Escora journey is personally adapted by human travel designers. Continue with this draft plan to our bespoke enquiry flow, where we reserve private boutique sanctuaries, arrange chauffeur allocations, and tailor inclusions to your preferences.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <Button
                      onClick={handleContinueToHumanDesigner}
                      className="w-full sm:w-auto px-7 py-5 rounded-xl bg-[#193F2D] hover:bg-[#255239] text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all"
                      data-testid="button-continue-to-plan"
                    >
                      <span>Handcraft With an Escora Travel Designer</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleShareWhatsApp}
                      className="w-full sm:w-auto px-6 py-5 rounded-xl border-[#193F2D]/30 bg-white text-[#193F2D] hover:bg-[#193F2D] hover:text-white text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <span>Speak on WhatsApp</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleScrollToForm}
                      className="text-xs font-mono text-[#788A63] hover:text-[#193F2D] underline underline-offset-4 transition-colors"
                    >
                      ← Return to planner to adjust preferences
                    </button>
                  </div>

                  <p className="text-[10px] font-mono text-[#788A63] pt-1">
                    No automated bookings or upfront commitment. Strictly private review with your designer.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
