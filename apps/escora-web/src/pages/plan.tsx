import { useEffect, useState } from "react";
import { useListDestinations, useCreateOrder } from "@workspace/api-client-react";
import Layout from "@/components/layout/Layout";
import { Link } from "wouter";
import { useSeo } from "@/hooks/useSeo";
import {
  Heart,
  Users,
  User,
  Leaf,
  UsersRound,
  Check,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Calendar,
  ShieldCheck,
  Minus,
  Plus,
} from "lucide-react";

type TravelStyle = "Honeymoon" | "Family" | "Solo" | "Wellness" | "Bespoke Group";

const TRAVEL_STYLES: { label: TravelStyle; desc: string; icon: any }[] = [
  {
    label: "Honeymoon",
    desc: "Intimate escapes for two, designed for meaningful moments.",
    icon: Heart,
  },
  {
    label: "Family",
    desc: "Memories across generations with comfort and ease.",
    icon: Users,
  },
  {
    label: "Solo",
    desc: "Your pace, your way with meaningful experiences.",
    icon: User,
  },
  {
    label: "Wellness",
    desc: "Ayurveda, rest and renewal in serene surroundings.",
    icon: Leaf,
  },
  {
    label: "Bespoke Group",
    desc: "Curated journeys for private groups with shared interests.",
    icon: UsersRound,
  },
];

const BUDGET_OPTIONS = [
  "Under ₹1 Lakh",
  "₹1L – ₹2L",
  "₹2L – ₹5L",
  "₹5L – ₹10L",
  "Above ₹10L",
];

interface FormData {
  travelStyle: TravelStyle | "";
  destinations: string[];
  arrivalDate: string;
  departureDate: string;
  adults: number;
  children: number;
  budgetRange: string;
  preferences: string;
  name: string;
  email: string;
  phone: string;
  marketingConsent?: boolean;
}

const EMPTY: FormData = {
  travelStyle: "",
  destinations: [],
  arrivalDate: "",
  departureDate: "",
  adults: 2,
  children: 0,
  budgetRange: "",
  preferences: "",
  name: "",
  email: "",
  phone: "",
  marketingConsent: false,
};

const TOTAL_STEPS = 5;

export default function PlanPage() {
  useSeo({
    title: "Plan Your Private Kerala Holiday — Custom Itinerary Builder | Escora",
    description: "Start planning your bespoke Kerala holiday with Escora. Tell us your travel dates, group size, and interests — honeymoon, Ayurveda retreat, family trip, or luxury getaway — and we'll craft your perfect itinerary.",
    url: "https://www.escoraholidays.com/plan",
  });

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const { data: destinations } = useListDestinations({ published: true });
  const createOrder = useCreateOrder();

  useEffect(() => {
    const preselected = new URLSearchParams(window.location.search).get("destination");
    if (preselected) {
      setForm((f) => (f.destinations.includes(preselected) ? f : { ...f, destinations: [...f.destinations, preselected] }));
    }

    try {
      const storedPlan = sessionStorage.getItem("escora_ai_trip_plan");
      if (storedPlan) {
        const parsed = JSON.parse(storedPlan);
        setForm((f) => {
          const nextDestinations = parsed.destinations && parsed.destinations.length > 0
            ? Array.from(new Set([...f.destinations, ...parsed.destinations]))
            : f.destinations;
          return {
            ...f,
            destinations: nextDestinations,
            travelStyle: (parsed.style as TravelStyle) || f.travelStyle,
            preferences: parsed.notes ? `${parsed.notes}\n\n${f.preferences}`.trim() : f.preferences,
          };
        });
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  function next() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleDestination(name: string) {
    setForm((f) => ({
      ...f,
      destinations: f.destinations.includes(name)
        ? f.destinations.filter((d) => d !== name)
        : [...f.destinations, name],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.phone) {
      setError("Please fill in all contact details.");
      return;
    }

    // Collect browser-side tracking metadata
    const searchParams = new URLSearchParams(window.location.search);
    const trackingData = {
      referrerUrl: document.referrer || undefined,
      landingPage: window.location.href,
      utmSource: searchParams.get("utm_source") || undefined,
      utmMedium: searchParams.get("utm_medium") || undefined,
      utmCampaign: searchParams.get("utm_campaign") || undefined,
      browserLanguage: navigator.language || undefined,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || undefined,
    };

    createOrder.mutate(
      {
        data: {
          guestName: form.name,
          guestEmail: form.email,
          guestPhone: form.phone,
          travelStyle: form.travelStyle || undefined,
          destinations: form.destinations.length ? form.destinations.join(", ") : undefined,
          travelDate: form.arrivalDate || undefined,
          departureDate: form.departureDate || undefined,
          guestCount: (form.adults + form.children) || undefined,
          budgetRange: form.budgetRange || undefined,
          specialRequests: form.preferences || undefined,
          marketingConsent: form.marketingConsent,
          ...trackingData,
        } as any,
      },
      {
        onSuccess: () => setSubmitted(true),
        onError: () => setError("Something went wrong. Please try again."),
      }
    );
  }

  if (submitted) return <SuccessScreen name={form.name} />;

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAF8F5] text-[#293D1F] pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* AI Trip Planner Bridge Card */}
          <div className="bg-[#F3F7F4] border border-[#DCE6E0] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
            <div className="space-y-0.5">
              <div className="font-serif text-sm sm:text-base font-semibold text-[#183628] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#183628]" />
                <span>Looking for an instant AI-designed itinerary?</span>
              </div>
              <p className="text-xs text-[#56664C] leading-relaxed">
                Curate a bespoke day-by-day slow-luxury passage in seconds, grounded in our verified catalog.
              </p>
            </div>
            <Link
              href="/trip-planner"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#183628] hover:bg-[#255239] text-white text-xs font-mono uppercase tracking-wider font-medium transition-all shrink-0 shadow-xs"
            >
              <span>AI Trip Planner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Main White Form Container */}
          <div className="bg-white rounded-3xl border border-[#CCD7D2]/80 p-6 sm:p-10 lg:p-12 shadow-2xs">
            {/* Step Header Indicator with 5-segment Progress Bar */}
            <ProgressIndicator step={step} total={TOTAL_STEPS} />

            {/* Step 1 — Travel Style */}
            {step === 1 && (
              <div className="animate-in fade-in duration-300">
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#183628] leading-[1.15] mb-2">
                  How would you like <br />
                  <span className="italic font-normal">to travel?</span>
                </h1>
                <p className="text-sm text-[#56664C] leading-relaxed mb-8">
                  This helps us shape the tone and pace of your journey.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {TRAVEL_STYLES.map((s) => {
                    const isSelected = form.travelStyle === s.label;
                    const IconComponent = s.icon;
                    return (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, travelStyle: s.label }))}
                        className={`p-5 rounded-2xl border text-left transition-all relative flex flex-col justify-between min-h-[140px] group ${
                          isSelected
                            ? "border-2 border-[#183628] bg-[#F4F7F5] ring-1 ring-[#183628] shadow-2xs"
                            : "border border-[#DCE6E0] bg-white hover:border-[#183628]/40 hover:bg-[#FAF8F5]"
                        }`}
                      >
                        {/* Top row: Icon and checkmark */}
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                            isSelected ? "bg-[#183628] text-white" : "bg-[#EFF4F0] text-[#183628]"
                          }`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-[#183628] text-white flex items-center justify-center text-[10px] shadow-xs">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="space-y-1">
                          <div className="font-serif text-lg font-medium text-[#183628]">
                            {s.label}
                          </div>
                          <p className="text-xs text-[#56664C] leading-relaxed pr-8">
                            {s.desc}
                          </p>
                        </div>

                        {/* Bottom right arrow button */}
                        <div className={`absolute bottom-4 right-4 w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                          isSelected
                            ? "border-[#183628] text-[#183628] bg-white"
                            : "border-[#DCE6E0] text-[#788A63] bg-white group-hover:border-[#183628]/40 group-hover:text-[#183628]"
                        }`}>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                <StepActions
                  onNext={next}
                  nextDisabled={!form.travelStyle}
                  showBack={false}
                />
              </div>
            )}

            {/* Step 2 — Destinations */}
            {step === 2 && (
              <div className="animate-in fade-in duration-300">
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#183628] leading-[1.15] mb-2">
                  Where do you want <br />
                  <span className="italic font-normal">to go?</span>
                </h1>
                <p className="text-sm text-[#56664C] leading-relaxed mb-8">
                  Select one or more — we&apos;ll weave them into a seamless journey.
                </p>

                <div className="flex flex-wrap gap-2.5 mb-6">
                  {destinations && destinations.length > 0
                    ? destinations.map((d) => {
                        const isSelected = form.destinations.includes(d.name);
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => toggleDestination(d.name)}
                            className={`px-4 py-2.5 rounded-full text-xs sm:text-sm transition-all flex items-center gap-2 ${
                              isSelected
                                ? "bg-[#183628] text-white border-2 border-[#183628] font-medium shadow-2xs"
                                : "bg-white border border-[#DCE6E0] text-[#293D1F] hover:bg-[#FAF8F5] hover:border-[#183628]/40"
                            }`}
                          >
                            <span>{d.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </button>
                        );
                      })
                    : ["Alleppey", "Munnar", "Fort Kochi", "Thekkady", "Kovalam", "Wayanad", "Varkala", "Kumarakom"].map((name) => {
                        const isSelected = form.destinations.includes(name);
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => toggleDestination(name)}
                            className={`px-4 py-2.5 rounded-full text-xs sm:text-sm transition-all flex items-center gap-2 ${
                              isSelected
                                ? "bg-[#183628] text-white border-2 border-[#183628] font-medium shadow-2xs"
                                : "bg-white border border-[#DCE6E0] text-[#293D1F] hover:bg-[#FAF8F5] hover:border-[#183628]/40"
                            }`}
                          >
                            <span>{name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </button>
                        );
                      })
                  }
                </div>

                {form.destinations.length > 0 && (
                  <div className="p-3 bg-[#F4F7F5] rounded-xl border border-[#DCE6E0] text-xs font-mono text-[#183628] mb-8">
                    <span className="font-semibold">{form.destinations.length} selected:</span>{" "}
                    {form.destinations.join(" · ")}
                  </div>
                )}

                <StepActions onNext={next} onBack={back} nextLabel="Continue" />
              </div>
            )}

            {/* Step 3 — Trip Details */}
            {step === 3 && (
              <div className="animate-in fade-in duration-300">
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#183628] leading-[1.15] mb-2">
                  Tell us about <br />
                  <span className="italic font-normal">your trip.</span>
                </h1>
                <p className="text-sm text-[#56664C] leading-relaxed mb-8">
                  Approximate dates and group size help us plan the right experiences.
                </p>

                {/* Arrival & Departure */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#183628] font-semibold mb-2">
                      Arrival Date
                    </label>
                    <input
                      type="date"
                      value={form.arrivalDate}
                      onChange={(e) => setForm((f) => ({ ...f, arrivalDate: e.target.value }))}
                      className="w-full bg-[#FAF8F5] border border-[#DCE6E0] rounded-xl px-4 py-3 text-sm text-[#183628] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#183628] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#183628] font-semibold mb-2">
                      Departure Date
                    </label>
                    <input
                      type="date"
                      value={form.departureDate}
                      onChange={(e) => setForm((f) => ({ ...f, departureDate: e.target.value }))}
                      min={form.arrivalDate || undefined}
                      className="w-full bg-[#FAF8F5] border border-[#DCE6E0] rounded-xl px-4 py-3 text-sm text-[#183628] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#183628] transition-all"
                    />
                  </div>
                </div>

                {/* Adults & Children Counter */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#FAF8F5] border border-[#DCE6E0] rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-[#183628]">Adults</div>
                      <div className="text-[11px] text-[#788A63]">Ages 12 and above</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, adults: Math.max(1, f.adults - 1) }))}
                        className="w-8 h-8 rounded-full bg-white border border-[#DCE6E0] flex items-center justify-center font-bold text-[#183628] hover:bg-[#EFF4F0]"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-serif text-lg font-medium text-[#183628]">
                        {form.adults}
                      </span>
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, adults: f.adults + 1 }))}
                        className="w-8 h-8 rounded-full bg-white border border-[#DCE6E0] flex items-center justify-center font-bold text-[#183628] hover:bg-[#EFF4F0]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#FAF8F5] border border-[#DCE6E0] rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-[#183628]">Children</div>
                      <div className="text-[11px] text-[#788A63]">Under 12 years</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, children: Math.max(0, f.children - 1) }))}
                        className="w-8 h-8 rounded-full bg-white border border-[#DCE6E0] flex items-center justify-center font-bold text-[#183628] hover:bg-[#EFF4F0]"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-serif text-lg font-medium text-[#183628]">
                        {form.children}
                      </span>
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, children: f.children + 1 }))}
                        className="w-8 h-8 rounded-full bg-white border border-[#DCE6E0] flex items-center justify-center font-bold text-[#183628] hover:bg-[#EFF4F0]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Approximate Budget Per Person */}
                <div className="space-y-3 mb-8">
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#183628] font-semibold">
                    Approximate Budget Per Person
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {BUDGET_OPTIONS.map((b) => {
                      const isSelected = form.budgetRange === b;
                      return (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, budgetRange: b }))}
                          className={`px-4 py-2.5 rounded-full text-xs font-mono transition-all ${
                            isSelected
                              ? "bg-[#183628] text-white border-2 border-[#183628] font-semibold shadow-2xs"
                              : "bg-white border border-[#DCE6E0] text-[#293D1F] hover:bg-[#FAF8F5]"
                          }`}
                        >
                          {b}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <StepActions onNext={next} onBack={back} />
              </div>
            )}

            {/* Step 4 — Preferences */}
            {step === 4 && (
              <div className="animate-in fade-in duration-300">
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#183628] leading-[1.15] mb-2">
                  Anything we <br />
                  <span className="italic font-normal">should know?</span>
                </h1>
                <p className="text-sm text-[#56664C] leading-relaxed mb-8">
                  Special occasions, dietary requirements, accommodation preferences, pace of travel — tell us everything.
                </p>

                <div className="space-y-2 mb-8">
                  <textarea
                    value={form.preferences}
                    onChange={(e) => setForm((f) => ({ ...f, preferences: e.target.value }))}
                    placeholder="E.g. celebrating our anniversary, prefer heritage stays, vegetarian, leisurely pace with no early mornings…"
                    rows={6}
                    className="w-full bg-[#FAF8F5] border border-[#DCE6E0] rounded-2xl p-4 text-sm text-[#293D1F] placeholder:text-[#788A63] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#183628] transition-all resize-none leading-relaxed"
                  />
                </div>

                <StepActions onNext={next} onBack={back} nextLabel="Almost there" />
              </div>
            )}

            {/* Step 5 — Contact */}
            {step === 5 && (
              <form onSubmit={handleSubmit} className="animate-in fade-in duration-300">
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#183628] leading-[1.15] mb-2">
                  How can we <br />
                  <span className="italic font-normal">reach you?</span>
                </h1>
                <p className="text-sm text-[#56664C] leading-relaxed mb-8">
                  A journey designer will be in touch within 24 hours.
                </p>

                <div className="space-y-4 mb-8">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#183628] font-semibold mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Your name"
                      className="w-full bg-[#FAF8F5] border border-[#DCE6E0] rounded-xl px-4 py-3 text-sm text-[#293D1F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#183628] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#183628] font-semibold mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="you@example.com"
                      className="w-full bg-[#FAF8F5] border border-[#DCE6E0] rounded-xl px-4 py-3 text-sm text-[#293D1F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#183628] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#183628] font-semibold mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                      className="w-full bg-[#FAF8F5] border border-[#DCE6E0] rounded-xl px-4 py-3 text-sm text-[#293D1F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#183628] transition-all"
                    />
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl border border-[#DCE6E0] bg-[#FAF8F5]/80">
                    <input
                      id="plan-marketing-consent"
                      type="checkbox"
                      checked={Boolean(form.marketingConsent)}
                      onChange={(e) => setForm((f) => ({ ...f, marketingConsent: e.target.checked }))}
                      className="mt-1 h-4 w-4 rounded border-[#DCE6E0] text-[#183628] focus:ring-[#183628] accent-[#183628] cursor-pointer shrink-0"
                    />
                    <label
                      htmlFor="plan-marketing-consent"
                      className="text-xs text-[#56664C] leading-relaxed cursor-pointer select-none"
                    >
                      I'd like to receive occasional travel inspiration, destination guides, and special offers from Escora Holidays by email. I can unsubscribe at any time.
                    </label>
                  </div>
                </div>

                {/* Summary Snapshot Card */}
                <div className="bg-[#FAF8F5] border border-[#DCE6E0] rounded-2xl p-5 sm:p-6 space-y-3 mb-8">
                  <div className="text-xs font-mono uppercase tracking-wider font-semibold text-[#183628] flex items-center gap-1.5 pb-2 border-b border-[#DCE6E0]/60">
                    <ShieldCheck className="w-4 h-4 text-[#183628]" />
                    <span>Your Itinerary Summary</span>
                  </div>
                  <SummaryRow label="Travel style" value={form.travelStyle || "—"} />
                  <SummaryRow label="Destinations" value={form.destinations.length ? form.destinations.join(", ") : "—"} />
                  <SummaryRow
                    label="Dates"
                    value={form.arrivalDate && form.departureDate ? `${form.arrivalDate} → ${form.departureDate}` : form.arrivalDate || "—"}
                  />
                  <SummaryRow
                    label="Travellers"
                    value={`${form.adults} adult${form.adults !== 1 ? "s" : ""}${form.children ? `, ${form.children} child${form.children !== 1 ? "ren" : ""}` : ""}`}
                  />
                  <SummaryRow label="Budget" value={form.budgetRange || "—"} />
                </div>

                {error && (
                  <p className="text-xs text-red-600 mb-4">{error}</p>
                )}

                <div className="pt-6 border-t border-[#E2EAE4] flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={back}
                    className="px-6 py-3 rounded-full border border-[#CCD7D2] text-[#293D1F] hover:bg-[#F3F7F4] text-sm font-medium flex items-center gap-2 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={createOrder.isPending}
                    className="px-8 py-3.5 rounded-full bg-[#183628] hover:bg-[#255239] text-white font-medium text-sm flex items-center gap-2 transition-all shadow-sm disabled:opacity-60"
                  >
                    <span>{createOrder.isPending ? "Sending…" : "Send Enquiry"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-[#788A63] mt-4 text-center">
                  We&apos;ll never share your details. By submitting you agree to our{" "}
                  <Link href="/privacy-policy" className="text-[#183628] underline underline-offset-2">
                    privacy policy
                  </Link>.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function ProgressIndicator({ step, total = 5 }: { step: number; total?: number }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <span className="text-xs font-mono uppercase tracking-widest font-semibold text-[#56664C]">
        STEP {step} OF {total}
      </span>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }, (_, i) => i + 1).map((s) => {
          const isActive = s === step;
          const isCompleted = s < step;
          return (
            <div
              key={s}
              className={`h-1 w-8 sm:w-10 rounded-full transition-all duration-300 ${
                isActive
                  ? "bg-[#183628]"
                  : isCompleted
                  ? "bg-[#56664C]"
                  : "bg-[#DCE6E0]"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

function StepActions({
  onNext,
  onBack,
  nextDisabled = false,
  nextLabel = "Continue",
  showBack = true,
}: {
  onNext: () => void;
  onBack?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  showBack?: boolean;
}) {
  return (
    <div className="pt-8 border-t border-[#E2EAE4] flex items-center justify-between gap-4 mt-8">
      {showBack && onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 rounded-full border border-[#CCD7D2] text-[#293D1F] hover:bg-[#F3F7F4] text-sm font-medium flex items-center gap-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      ) : (
        <div />
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className={`px-8 py-3.5 rounded-full font-medium text-sm flex items-center gap-2 transition-all shadow-sm ${
          nextDisabled
            ? "bg-[#DCE6E0] text-[#788A63] cursor-not-allowed"
            : "bg-[#183628] hover:bg-[#255239] text-white"
        }`}
      >
        <span>{nextLabel}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline py-1.5 border-b border-[#DCE6E0]/60 last:border-b-0 text-xs">
      <span className="font-mono text-[11px] uppercase tracking-wider text-[#788A63]">{label}</span>
      <span className="font-medium text-[#183628] max-w-[65%] text-right">{value}</span>
    </div>
  );
}

function SuccessScreen({ name }: { name: string }) {
  return (
    <Layout>
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6 text-[#293D1F]">
        <div className="bg-white rounded-3xl border border-[#DCE6E0] p-8 sm:p-12 text-center max-w-lg mx-auto shadow-2xs space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#EFF4F0] flex items-center justify-center text-[#183628] mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#183628]">
            Your journey begins, {name.split(" ")[0]}.
          </h1>
          <p className="text-xs sm:text-sm text-[#56664C] leading-relaxed">
            We&apos;ve received your itinerary. A journey designer will be in touch within 24 hours to start crafting your experience.
          </p>
          <div className="pt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#183628] hover:bg-[#255239] text-white text-xs sm:text-sm font-medium transition-all shadow-sm"
            >
              <span>Return Home</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
