import Layout from "@/components/layout/Layout";
import { Link } from "wouter";
import { useSeo } from "@/hooks/useSeo";
import { Leaf, MapPin, Users } from "lucide-react";
import midhilajPhoto from "@assets/escora/midhilaj-founder.jpg";
import alleppeyBackwaters from "@assets/escora/collections/alleppey-backwaters.jpeg";
import munnarPhoto from "@assets/escora/destinations/munnar.jpg";
import whyEscoraBg from "@assets/escora/why-escora-bg.jpeg";

export default function About() {
  useSeo({
    title: "About Escora — Boutique Kerala Travel Specialists",
    description:
      "Escora is a boutique Kerala travel agency and destination management company based in Kozhikode — crafting private, bespoke journeys for discerning travellers from the UK, Europe, and the Gulf since 2016.",
    url: "https://www.escoraholidays.com/about",
  });

  return (
    <Layout>
      <style>{`
        @media (max-width: 640px) {
          .about-page h1, .about-page h2, .about-page h3, .about-page h4, .about-page p {
            overflow-wrap: anywhere !important;
            word-break: break-word !important;
            max-width: 100% !important;
          }
        }
      `}</style>
      <div className="about-page bg-[#FAF8F5] text-[#183628]" style={{ overflowX: "hidden" }}>

        {/* 1. Hero Section */}
        <section className="relative pt-28 sm:pt-32 lg:pt-36 pb-14 sm:pb-20 overflow-hidden border-b border-[#E8EEEA]">
          {/* Right landscape backwater image fading seamlessly into warm ivory #FAF8F5 */}
          <div 
            className="absolute top-0 right-0 h-full w-full lg:w-[60%] xl:w-[56%] pointer-events-none select-none z-0 opacity-25 lg:opacity-100"
            aria-hidden="true"
          >
            <img
              src={alleppeyBackwaters}
              alt="Kerala Backwaters Houseboat"
              className="w-full h-full object-cover object-[center_right] lg:object-[75%_center]"
              style={{
                maskImage:
                  "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.7) 50%, #000 85%), linear-gradient(to top, transparent 0%, #000 15%)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.7) 50%, #000 85%), linear-gradient(to top, transparent 0%, #000 15%)",
                maskComposite: "intersect",
                WebkitMaskComposite: "source-in",
              }}
            />
            {/* Broad ivory gradient overlay for buttery smooth blending */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to right, #FAF8F5 0%, rgba(250,248,245,0.8) 22%, rgba(250,248,245,0.2) 58%, transparent 100%), linear-gradient(to top, #FAF8F5 0%, transparent 14%)",
              }}
            />
          </div>

          <div className="container mx-auto px-6 sm:px-8 max-w-7xl relative z-10">
            <div className="max-w-2xl lg:max-w-xl xl:max-w-2xl">
              <div className="mb-5">
                <p className="section-label">
                  Our Story
                </p>
              </div>
              <h1
                className="font-editorial text-3xl sm:text-5xl lg:text-[62px] text-[#183628] font-normal leading-[1.12] mb-6"
                style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
              >
                Designed for<br />
                <em className="italic font-normal">those who travel deeply</em>
              </h1>
              <p
                className="font-sans text-[#4A5D53] text-base sm:text-lg leading-relaxed max-w-xl"
                style={{ overflowWrap: "anywhere" }}
              >
                Escora is a boutique destination management studio rooted in Kerala, crafting private journeys
                for travellers who seek meaning over itineraries.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Philosophy Section — REVERSED LAYOUT (Image on Left, Text on Right) */}
        <section className="py-16 sm:py-24 overflow-hidden">
          <div className="container mx-auto px-6 sm:px-8 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Left: Philosophy landscape image (Munnar tea plantations) */}
              <div className="lg:col-span-6 reveal-up">
                <div className="aspect-[4/3] sm:aspect-[16/11] rounded-2xl overflow-hidden shadow-sm border border-[#E2EAE4]">
                  <img
                    src={munnarPhoto}
                    alt="Munnar Tea Plantations, Kerala"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Right: Philosophy heading and text */}
              <div className="lg:col-span-6 reveal-up relative">
                <div className="max-w-xl">
                  <div className="mb-5">
                    <p className="section-label">
                      Philosophy
                    </p>
                  </div>
                  <h2
                    className="font-editorial text-2xl sm:text-4xl lg:text-[42px] text-[#183628] font-normal leading-[1.18] mb-6"
                    style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
                  >
                    Slow travel. Curated access. Honest{" "}
                    <em className="italic font-normal">hospitality.</em>
                  </h2>
                  <div className="space-y-4 text-[#4A5D53] font-sans text-[15px] sm:text-base leading-relaxed">
                    <p>
                      We believe the finest journeys are not assembled from a catalogue. They are built around a conversation —
                      between you and the places you visit, between your pace and the landscape's rhythm.
                    </p>
                    <p>
                      Kerala has nine hundred kilometres of backwaters, a coastline that changes character every hour,
                      hills that hold the oldest tea estates in India, and a culture of hospitality that predates the
                      tourism industry by centuries. We are custodians of access to all of it.
                    </p>
                  </div>
                </div>

                {/* Subtle decorative vertical line with diamond node matching reference */}
                <div className="hidden xl:block absolute -right-6 top-4 bottom-4 w-[1px] bg-[#D8E2DC]">
                  <div className="absolute top-1/2 -left-[3.5px] -translate-y-1/2 w-[8px] h-[8px] rotate-45 border border-[#B58D5D] bg-[#FAF8F5]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Brand Values Section ("What guides us") */}
        <section className="bg-[#EFF4F0] border-y border-[#DCE5DF] py-16 sm:py-20 relative overflow-hidden">
          <div className="container mx-auto px-6 sm:px-8 max-w-6xl">
            <div className="mb-12">
              <p className="section-label">
                What guides us
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#D2DCD5]">
              {[
                {
                  icon: Leaf,
                  title: "Depth over breadth",
                  body: "We design itineraries that spend time in a place, not just pass through it. Every programme allows for stillness.",
                },
                {
                  icon: MapPin,
                  title: "Local first",
                  body: "Our guides, cooks, and hosts are Keralites who have spent their lives in the places they show you. There is no substitute.",
                },
                {
                  icon: Users,
                  title: "Transparent pricing",
                  body: "Every quote we send is line-itemised. You know where your money goes and who benefits from your visit.",
                },
              ].map((v, i) => {
                const IconComponent = v.icon;
                return (
                  <div
                    key={v.title}
                    className={`reveal-up ${
                      i === 0
                        ? "md:pr-8 lg:pr-10 pb-8 md:pb-0"
                        : i === 1
                        ? "md:px-8 lg:px-10 py-8 md:py-0"
                        : "md:pl-8 lg:pl-10 pt-8 md:pt-0"
                    }`}
                  >
                    <div className="text-[#293D1F] mb-4">
                      <IconComponent className="w-6 h-6 text-[#293D1F]" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-editorial text-2xl sm:text-[26px] text-[#293D1F] font-normal mb-3">
                      {v.title}
                    </h3>
                    <p className="font-sans text-[#4A5D53] text-[14px] sm:text-[14.5px] leading-relaxed">
                      {v.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. Founder Section ("The people behind the journeys") */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-6 sm:px-8 max-w-6xl">
            {/* Eyebrow & Headline */}
            <div className="reveal-up mb-10 sm:mb-12">
              <div className="mb-5">
                <p className="section-label">
                  The people behind the journeys
                </p>
              </div>
              <h2
                className="font-editorial text-4xl sm:text-5xl lg:text-[62px] text-[#293D1F] font-normal leading-[1.08] tracking-tight"
                style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
              >
                Rooted in Kerala,<br />
                <em className="italic font-normal">Built for the world.</em>
              </h2>
            </div>

            {/* Two-column layout: portrait on left, white profile card on right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch reveal-up">
              {/* Portrait on Left */}
              <div className="lg:col-span-5 relative rounded-2xl overflow-hidden shadow-sm border border-[#E2EAE4] bg-[#E8EEEA] min-h-[380px] sm:min-h-[460px]">
                <img
                  src={midhilajPhoto}
                  alt="Midhilaj — Founder & CEO, Escora"
                  className="w-full h-full object-cover object-top block"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#183628]/30 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Information Panel on Right */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-7 sm:p-10 border border-[#E2EAE4] shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[#8C7355] text-xs font-mono">-</span>
                    <p className="font-mono text-[#8C7355] text-xs uppercase tracking-[0.22em] font-medium">
                      Founder & CEO
                    </p>
                    <span className="text-[#8C7355] text-xs font-mono">-</span>
                  </div>
                  <h3 className="font-editorial text-3xl sm:text-4xl text-[#293D1F] font-normal mb-5 leading-tight">
                    Midhilaj
                  </h3>
                  <div className="space-y-4 font-sans text-[#4A5D53] text-[14.5px] sm:text-[15px] leading-relaxed">
                    <p>
                      Born and raised in Kerala, Midhilaj built his career across three continents before returning home.
                      He spent three years in Saudi Arabia and three in Dubai working in travel and tourism — learning what
                      luxury travellers from the Gulf truly expect.
                    </p>
                    <p>
                      He then earned his MBA in the United Kingdom and spent six years in London, deepening that understanding
                      from within the world's most demanding market. He returned to Kerala with one conviction: that the state's
                      finest experiences were being undersold to the world, and that the people who deserved them most were never
                      finding them. Escora is his answer to that.
                    </p>
                  </div>
                </div>

                {/* Profile Table */}
                <div className="pt-6 mt-6 border-t border-[#E8EEEA]">
                  <div className="space-y-2.5">
                    {[
                      { label: "Based in", value: "Kozhikode, Kerala" },
                      { label: "Education", value: "MBA, United Kingdom" },
                      { label: "Experience", value: "Saudi Arabia · Dubai · London · Kerala" },
                      { label: "Languages", value: "English · Malayalam · Hindi · Arabic" },
                    ].map((d) => (
                      <div
                        key={d.label}
                        className="grid grid-cols-[100px_16px_1fr] sm:grid-cols-[110px_20px_1fr] items-baseline text-[13px] sm:text-[13.5px]"
                      >
                        <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#293D1F] font-semibold">
                          {d.label}
                        </span>
                        <span className="text-[#8C7355]">:</span>
                        <span className="font-sans text-[#4A5D53]">
                          {d.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Journey Design Team */}
            <div className="mt-8 bg-white/70 rounded-2xl p-6 sm:p-8 border border-[#E2EAE4] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 reveal-up">
              <div className="flex items-center gap-5 sm:gap-6 shrink-0">
                <div className="font-editorial text-4xl sm:text-5xl text-[#293D1F] font-normal leading-none">
                  14+
                </div>
                <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#8C7355] max-w-[14ch] leading-snug">
                  Curators & specialists
                </div>
              </div>
              <div className="h-[1px] md:h-12 w-full md:w-[1px] bg-[#D2DCD5]" />
              <div className="flex-1 max-w-2xl">
                <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#8C7355] mb-1">
                  The Journey Design Team
                </div>
                <h4 className="font-editorial text-xl sm:text-2xl text-[#293D1F] font-normal mb-2">
                  Keralites. Curators. Storytellers.
                </h4>
                <p className="font-sans text-[13.5px] text-[#4A5D53] leading-relaxed">
                  A small team of English-speaking Keralites who have collectively travelled every district of the state.
                  Specialists in wellness, heritage, marine ecology, and culinary traditions — each journey is designed by
                  someone who has lived it first.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Statistics Section */}
        <section className="bg-[#EFF4F0] border-y border-[#DCE5DF] py-12 sm:py-14">
          <div className="container mx-auto px-6 sm:px-8 max-w-6xl">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#D2DCD5] text-center">
              {[
                { number: "10", label: "Years in Kerala" },
                { number: "2,400+", label: "Journeys designed" },
                { number: "14", label: "Regions of Kerala" },
                { number: "98%", label: "Return guests" },
              ].map((s, idx) => (
                <div
                  key={s.label}
                  className={`reveal-up ${
                    idx === 0
                      ? "pb-6 md:pb-0 md:pr-6"
                      : idx === 1
                      ? "pb-6 md:pb-0 md:px-6"
                      : idx === 2
                      ? "pt-6 md:pt-0 md:px-6"
                      : "pt-6 md:pt-0 md:pl-6"
                  }`}
                >
                  <div className="font-editorial text-4xl sm:text-5xl text-[#293D1F] font-normal leading-none mb-2.5">
                    {s.number}
                  </div>
                  <div className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.22em] text-[#293D1F] font-semibold">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Final CTA Section */}
        <section className="relative py-24 sm:py-32 lg:py-36 overflow-hidden text-center bg-[#FAF8F5]">
          {/* Panoramic Kerala landscape background */}
          <img
            src={whyEscoraBg}
            alt="Kerala Panorama"
            className="absolute inset-0 w-full h-full object-cover object-bottom"
          />
          {/* Smooth gradient blend into warm ivory sky at top */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, #FAF8F5 0%, rgba(250,248,245,0.92) 25%, rgba(250,248,245,0.65) 55%, rgba(250,248,245,0.15) 80%, transparent 100%)",
            }}
          />

          <div className="relative z-10 container mx-auto px-6 max-w-2xl reveal-up">
            <h2
              className="font-editorial text-4xl sm:text-5xl lg:text-[62px] text-[#293D1F] font-normal mb-5 leading-[1.08] tracking-tight"
              style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
            >
              Ready to begin?
            </h2>
            <p
              className="font-sans text-[#4A5D53] text-base sm:text-lg mb-10 leading-relaxed max-w-xl mx-auto"
              style={{ overflowWrap: "anywhere" }}
            >
              Tell us where you want to go and how you want to feel. We'll take care of the rest.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/plan"
                className="inline-flex items-center justify-center bg-[#183628] text-[#FAF8F5] font-sans text-sm font-medium px-8 py-3.5 rounded-full hover:bg-[#12281e] transition-colors shadow-sm min-w-[170px]"
              >
                Plan a Journey
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center border border-[#183628]/40 bg-[#FAF8F5]/85 backdrop-blur-xs text-[#293D1F] font-sans text-sm font-medium px-8 py-3.5 rounded-full hover:border-[#183628] hover:bg-[#FAF8F5] transition-colors shadow-sm min-w-[170px]"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}
