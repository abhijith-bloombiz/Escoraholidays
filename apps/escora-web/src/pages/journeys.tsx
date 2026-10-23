import Layout from "@/components/layout/Layout";
import { useListPackages, useListDestinations } from "@workspace/api-client-react";
import { useState, useMemo } from "react";
import { useSeo } from "@/hooks/useSeo";
import { Link } from "wouter";
import journeysHero from "@assets/escora/destinations/kovalam-clean.jpg";
import whyEscoraBg from "@assets/escora/why-escora-bg.jpeg";
import alleppeyBackwaters from "@assets/escora/collections/alleppey-backwaters.jpeg";
import munnarTeaEstate from "@assets/escora/collections/munnar-tea-estate.jpeg";
import fortKochiSunset from "@assets/escora/destinations/fort-kochi.jpg";
import wayanadForestStay from "@assets/escora/collections/wayanad-forest-stay.jpeg";

const CATEGORIES = ["All", "Honeymoon", "Family", "Adventure", "Wellness", "Culture"];

const DURATION_FILTERS = [
  { label: "All Durations", min: 0, max: Infinity },
  { label: "Short (1–4 nights)", min: 1, max: 4 },
  { label: "Medium (5–7 nights)", min: 5, max: 7 },
  { label: "Long (8+ nights)", min: 8, max: Infinity },
];

const MOCK_PACKAGES = [
  {
    id: 1,
    name: "The Malabar Escape",
    durationNights: 5,
    route: "Fort Kochi → Munnar → Alleppey",
    category: "Honeymoon",
    priceFrom: 150000,
    heroImageUrl: alleppeyBackwaters,
    slug: "malabar-escape",
    shortDesc: "A private five-night journey through Fort Kochi's heritage lanes, Munnar's tea estates and Alleppey's houseboat backwaters.",
    description: "Begin in the candlelit lanes of Fort Kochi, where colonial history and contemporary art collide. Ascend through rubber estates to the cool air of Munnar's tea country. End aboard your private kettuvallam houseboat, drifting Alleppey's labyrinthine canals as the sun sets over the paddy fields.",
  },
  {
    id: 2,
    name: "Cardamom Hills Retreat",
    durationNights: 4,
    route: "Munnar → Thekkady",
    category: "Wellness",
    priceFrom: 120000,
    heroImageUrl: munnarTeaEstate,
    slug: "cardamom-hills",
    shortDesc: "Four nights of deep restoration among Munnar's cardamom groves and Thekkady's jungle edge — yoga, Ayurveda and spice-estate walks.",
    description: "Four nights of deep restoration among Munnar's cardamom groves and Thekkady's jungle edge — yoga, Ayurveda and spice-estate walks.",
  },
  {
    id: 3,
    name: "Spice Coast Odyssey",
    durationNights: 7,
    route: "Fort Kochi → Marari → Kumarakom",
    category: "Culture",
    priceFrom: 220000,
    heroImageUrl: fortKochiSunset,
    slug: "spice-coast",
    shortDesc: "Seven nights tracing the ancient Arab, Portuguese and Dutch spice trade routes along Kerala's coast and lagoons.",
    description: "Seven nights tracing the ancient Arab, Portuguese and Dutch spice trade routes along Kerala's coast and lagoons.",
  },
  {
    id: 4,
    name: "Wayanad Wilds",
    durationNights: 3,
    route: "Calicut → Wayanad",
    category: "Adventure",
    priceFrom: 90000,
    heroImageUrl: wayanadForestStay,
    slug: "wayanad-wilds",
    shortDesc: "Three nights deep in Wayanad's tribal heartland — jungle treks, hidden waterfalls and an Adivasi cultural encounter.",
    description: "Three nights deep in Wayanad's tribal heartland — jungle treks, hidden waterfalls and an Adivasi cultural encounter.",
  },
];

const PACKAGE_IMAGES: Record<string, string> = {
  "malabar-escape": alleppeyBackwaters,
  "cardamom-hills": munnarTeaEstate,
  "spice-coast": fortKochiSunset,
  "wayanad-wilds": wayanadForestStay,
};

function resolvePackageImage(pkg: { slug?: string; heroImageUrl?: string | null }): string {
  if (
    pkg.heroImageUrl &&
    !pkg.heroImageUrl.includes("photo-1556470478-98bd74cfc940") &&
    !pkg.heroImageUrl.includes("photo-1623864703759-4509539ab8ee")
  ) {
    return pkg.heroImageUrl;
  }
  if (pkg.slug && PACKAGE_IMAGES[pkg.slug]) {
    return PACKAGE_IMAGES[pkg.slug];
  }
  return pkg.heroImageUrl || fortKochiSunset;
}

export default function Journeys() {
  useSeo({
    title: "Kerala Holiday Packages — Luxury Private Itineraries",
    description: "Browse Escora's luxury Kerala tour packages — honeymoon trips, Ayurveda wellness retreats, backwater houseboat holidays, wildlife safaris, and heritage journeys. Bespoke itineraries from 3 to 14 nights.",
    url: "https://www.escoraholidays.com/journeys",
  });

  const [activeFilter, setActiveFilter] = useState("All");
  const [durationIdx, setDurationIdx] = useState(0);
  const [destFilter, setDestFilter] = useState("All");

  const queryParams = activeFilter !== "All" ? { category: activeFilter, published: true } : { published: true };
  const { data: apiPackages, isLoading } = useListPackages(queryParams);
  const { data: apiDestinations } = useListDestinations({ published: true });

  const allPackages = apiPackages && apiPackages.length > 0 ? apiPackages :
    (activeFilter === "All" ? MOCK_PACKAGES : MOCK_PACKAGES.filter(p => p.category === activeFilter));

  const packages = useMemo(() => {
    const dur = DURATION_FILTERS[durationIdx];
    return allPackages.filter(p => {
      const nights = p.durationNights ?? 0;
      if (nights < dur.min || nights > dur.max) return false;
      if (destFilter !== "All" && p.route && !p.route.toLowerCase().includes(destFilter.toLowerCase())) return false;
      return true;
    });
  }, [allPackages, durationIdx, destFilter]);

  const destinationNames = apiDestinations?.map(d => d.name) ?? [];

  return (
    <Layout>
      <div className="dest-page">
        {/* ── Page Hero (Matching Explore Kerala layout & decoration image) ── */}
        <section className="dest-hero-section">
          <div
            className="dest-hero-bg"
            style={{ backgroundImage: `url(${whyEscoraBg})` }}
            aria-hidden="true"
          />
          <div className="dest-hero-gradient" aria-hidden="true" />

          <div className="dest-wrap">
            <div className="dest-hero-content">
              <h1 className="dest-hero-title">
                Immaculate<br />
                <em>Journeys</em>
              </h1>
              <p className="dest-hero-desc">
                Thoughtfully crafted paths through Kerala&apos;s most extraordinary landscapes and heritage homes.
              </p>
            </div>
          </div>
        </section>

        {/* ── Category & Duration Filters (Matching Explore Kerala chips style) ── */}
        <section className="dest-filters-section">
          <div className="dest-wrap">
            <div className="dest-chips" role="tablist" aria-label="Journey Categories">
              {CATEGORIES.map((cat) => {
                const isActive = activeFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveFilter(cat)}
                    className={`dest-chip ${isActive ? "is-active" : ""}`}
                    aria-pressed={isActive}
                    role="tab"
                  >
                    {cat}
                  </button>
                );
              })}

              {/* Duration Filter Dropdown in matching chip style */}
              <select
                value={durationIdx}
                onChange={(e) => setDurationIdx(Number(e.target.value))}
                className="dest-chip cursor-pointer bg-white"
                aria-label="Filter by duration"
              >
                {DURATION_FILTERS.map((f, i) => (
                  <option key={f.label} value={i}>
                    {f.label}
                  </option>
                ))}
              </select>

              {/* Destination Filter Dropdown in matching chip style */}
              {destinationNames.length > 0 && (
                <select
                  value={destFilter}
                  onChange={(e) => setDestFilter(e.target.value)}
                  className="dest-chip cursor-pointer bg-white"
                  aria-label="Filter by destination"
                >
                  <option value="All">All Destinations</option>
                  {destinationNames.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              )}

              {(durationIdx > 0 || destFilter !== "All") && (
                <button
                  type="button"
                  onClick={() => { setDurationIdx(0); setDestFilter("All"); }}
                  className="dest-chip border-[#8C7355] text-[#8C7355] hover:bg-[#8C7355] hover:text-white"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 3. Packages Grid */}
        <section className="bg-[#FAF8F5] pb-20 md:pb-24 pt-2">
          <div className="dest-wrap">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-10 h-10 border-2 border-[#183628] border-t-transparent animate-spin rounded-full"></div>
            </div>
          ) : packages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {packages.map((pkg, i) => {
                const cardImg = resolvePackageImage(pkg);
                const desc = pkg.shortDesc || pkg.description;

                return (
                  <Link 
                    key={pkg.id} 
                    href={`/journeys/${pkg.id}`}
                    className="group relative block overflow-hidden rounded-2xl border border-black/5 bg-[#183628] shadow-sm hover:shadow-xl transition-all duration-500 min-h-[250px] sm:min-h-0 aspect-[16/11] sm:aspect-[16/10]"
                  >
                    {/* Edge to edge background image */}
                    <img 
                      src={cardImg} 
                      alt={pkg.name} 
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = fortKochiSunset;
                      }}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />

                    {/* Dark forest green gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09170F]/95 via-[#09170F]/55 to-transparent transition-opacity duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-transparent opacity-70" />

                    {/* Top-left number indicator & category label */}
                    <div className="absolute top-5 left-6 text-[11px] font-mono tracking-[0.25em] text-[#E5C388]/90 flex items-center gap-2 select-none z-10">
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      <span className="w-5 h-[1px] bg-[#E5C388]/60 inline-block" />
                      {pkg.category && (
                        <span className="uppercase text-[10px] tracking-[0.2em] text-[#E5C388]/90">
                          {pkg.category}
                        </span>
                      )}
                    </div>

                    {/* Card bottom content */}
                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7 md:p-8 flex flex-col justify-end text-white z-10">
                      <h3 className="font-editorial text-2xl sm:text-3xl md:text-[2.25rem] font-normal tracking-tight leading-none text-white drop-shadow-sm mb-2 group-hover:text-white/95 transition-colors">
                        {pkg.name}
                      </h3>

                      <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] font-medium text-white/80 mb-2 flex items-center flex-wrap gap-x-2">
                        <span>{pkg.durationNights} Nights</span>
                        {pkg.route && (
                          <>
                            <span className="text-[#E5C388]/60 select-none">•</span>
                            <span className="truncate">{pkg.route}</span>
                          </>
                        )}
                      </p>

                      {desc && (
                        <p className="text-white/80 text-xs sm:text-sm leading-relaxed max-w-md line-clamp-2 mt-0.5">
                          {desc}
                        </p>
                      )}

                      <div className="mt-4 pt-1">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#E5C388] group-hover:text-white transition-colors duration-300">
                          EXPLORE <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#EFF4F0] rounded-2xl max-w-xl mx-auto border border-[#E2EAE4] p-8">
              <p className="font-editorial text-2xl text-[#293D1F] font-normal">No journeys found for this category.</p>
              <button 
                onClick={() => { setActiveFilter("All"); setDurationIdx(0); setDestFilter("All"); }}
                className="mt-6 font-sans text-xs uppercase tracking-widest text-white bg-[#183628] hover:bg-[#26533A] px-6 py-2.5 rounded-full transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>
      </div>
    </Layout>
  );
}
