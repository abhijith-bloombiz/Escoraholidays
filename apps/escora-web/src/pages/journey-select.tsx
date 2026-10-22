import { Link } from "wouter";
import Layout from "@/components/layout/Layout";
import { useSeo } from "@/hooks/useSeo";
import { Sparkles, Compass, ArrowRight, CheckCircle2 } from "lucide-react";

export default function JourneySelectPage() {
  useSeo({
    title: "Choose Your Journey — Plan Your Kerala Holiday | Escora",
    description:
      "Two ways to plan your bespoke Kerala holiday with Escora. Build a personalized itinerary instantly with AI, or handcraft your journey details step-by-step.",
    url: "https://www.escoraholidays.com/plan-a-journey",
  });

  return (
    <Layout>
      <div className="min-h-[85vh] bg-[#FAF8F5] flex flex-col justify-start sm:justify-center relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
        {/* Soft decorative background tint */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 select-none"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse at 50% 20%, rgba(232, 240, 234, 0.7) 0%, rgba(250, 248, 245, 0) 70%)",
          }}
        />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl relative z-10">
          {/* Centered Introduction */}
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 md:mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F0EA] text-[#193F2D] text-xs font-mono tracking-wider uppercase mb-5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#758B78]" />
              Plan a Journey
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#193F2D] font-normal leading-[1.18] tracking-tight mb-4">
              Choose Your Journey
            </h1>
            <p className="font-sans text-[#5A7360] text-base sm:text-lg leading-relaxed">
              Two ways to plan. One unforgettable Kerala experience.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto items-stretch">
            {/* Option 1: AI Trip Planner */}
            <Link
              href="/trip-planner"
              className="group flex flex-col justify-between bg-white border border-[#D5DED7] rounded-2xl p-7 sm:p-9 md:p-10 transition-all duration-300 hover:border-[#193F2D] hover:shadow-[0_12px_32px_rgba(25,63,45,0.08)] hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#193F2D] focus-visible:ring-offset-2"
              aria-label="AI Trip Planner — Build a personalized Kerala itinerary with AI"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-[#E8F0EA] flex items-center justify-center text-[#193F2D] transition-colors duration-300 group-hover:bg-[#193F2D] group-hover:text-white">
                    <Sparkles className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FAF8F5] text-[#5A7360] border border-[#E2E8E4]">
                    Instant Proposal
                  </span>
                </div>

                <h2 className="font-serif text-2xl sm:text-[1.75rem] text-[#193F2D] font-normal leading-tight mb-3">
                  AI Trip Planner
                </h2>

                <p className="font-sans text-[#5A7360] text-sm sm:text-base leading-relaxed mb-6">
                  Build a personalized Kerala itinerary with AI.
                </p>

                <ul className="space-y-2.5 mb-8 text-xs sm:text-sm text-[#465E4E]">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#758B78] shrink-0" />
                    <span>Instant personalized route recommendations</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#758B78] shrink-0" />
                    <span>Curated stays, daily pacing &amp; local activities</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#758B78] shrink-0" />
                    <span>Real-time budget estimation in multiple currencies</span>
                  </li>
                </ul>
              </div>

              <div className="pt-5 border-t border-[#EEF2EF] flex items-center justify-between">
                <span className="font-sans text-sm font-semibold text-[#193F2D] group-hover:underline">
                  Start with AI Planner
                </span>
                <div className="w-9 h-9 rounded-full bg-[#FAF8F5] border border-[#D5DED7] flex items-center justify-center text-[#193F2D] transition-all duration-300 group-hover:bg-[#193F2D] group-hover:border-[#193F2D] group-hover:text-white group-hover:translate-x-1">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Option 2: Custom Trip Planner */}
            <Link
              href="/plan"
              className="group flex flex-col justify-between bg-white border border-[#D5DED7] rounded-2xl p-7 sm:p-9 md:p-10 transition-all duration-300 hover:border-[#193F2D] hover:shadow-[0_12px_32px_rgba(25,63,45,0.08)] hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#193F2D] focus-visible:ring-offset-2"
              aria-label="Custom Trip Planner — Choose your trip details and build your journey yourself"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-[#E8F0EA] flex items-center justify-center text-[#193F2D] transition-colors duration-300 group-hover:bg-[#193F2D] group-hover:text-white">
                    <Compass className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FAF8F5] text-[#5A7360] border border-[#E2E8E4]">
                    5-Step Form
                  </span>
                </div>

                <h2 className="font-serif text-2xl sm:text-[1.75rem] text-[#193F2D] font-normal leading-tight mb-3">
                  Custom Trip Planner
                </h2>

                <p className="font-sans text-[#5A7360] text-sm sm:text-base leading-relaxed mb-6">
                  Choose your trip details and build your journey yourself.
                </p>

                <ul className="space-y-2.5 mb-8 text-xs sm:text-sm text-[#465E4E]">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#758B78] shrink-0" />
                    <span>Select your preferred travel style &amp; destinations</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#758B78] shrink-0" />
                    <span>Set exact travel dates, party size &amp; budget range</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#758B78] shrink-0" />
                    <span>Hand-reviewed proposal by our Kerala specialists</span>
                  </li>
                </ul>
              </div>

              <div className="pt-5 border-t border-[#EEF2EF] flex items-center justify-between">
                <span className="font-sans text-sm font-semibold text-[#193F2D] group-hover:underline">
                  Start Custom Plan
                </span>
                <div className="w-9 h-9 rounded-full bg-[#FAF8F5] border border-[#D5DED7] flex items-center justify-center text-[#193F2D] transition-all duration-300 group-hover:bg-[#193F2D] group-hover:border-[#193F2D] group-hover:text-white group-hover:translate-x-1">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </div>

          {/* Bottom Helpful Contact Note */}
          <div className="mt-14 sm:mt-16 text-center text-xs sm:text-sm text-[#758B78]">
            <span>Need personal guidance before planning? </span>
            <Link
              href="/contact"
              className="text-[#193F2D] font-semibold underline underline-offset-4 hover:text-[#2d6148] transition-colors"
            >
              Speak with an Escora specialist
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
