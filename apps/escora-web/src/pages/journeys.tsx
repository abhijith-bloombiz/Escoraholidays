import Layout from "@/components/layout/Layout";
import { useListPackages, useListDestinations } from "@workspace/api-client-react";
import { useState, useMemo } from "react";
import { useSeo } from "@/hooks/useSeo";
import { Link } from "wouter";
import journeysHero from "@assets/escora/destinations/kovalam-clean.jpg";
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
  if (pkg.slug && PACKAGE_IMAGES[pkg.slug]) {
    // If the image is empty or the known broken unsplash URLs, use the verified local asset
    if (
      !pkg.heroImageUrl ||
      pkg.heroImageUrl.includes("photo-1556470478-98bd74cfc940") ||
      pkg.heroImageUrl.includes("photo-1623864703759-4509539ab8ee")
    ) {
      return PACKAGE_IMAGES[pkg.slug];
    }
    // High-resolution authentic local collections asset takes priority
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
      {/* 1. Page Hero */}
      <section className="relative w-full overflow-hidden pt-28 pb-10 sm:pt-32 sm:pb-12 lg:pt-36 lg:pb-14 bg-[#FAF8F5]">
        {/* Right landscape coastal sunset image fading softly into warm ivory */}
        <div 
          className="absolute top-0 right-0 h-full w-full lg:w-[60%] xl:w-[56%] pointer-events-none select-none z-0 opacity-25 lg:opacity-100"
          aria-hidden="true"
        >
          <img 
            src={journeysHero} 
            alt="Kerala Coastal Journeys" 
            className="w-full h-full object-cover object-[center_right] lg:object-[80%_center]"
            style={{
              maskImage:
                "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.7) 48%, #000 80%), linear-gradient(to top, transparent 0%, #000 18%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.7) 48%, #000 80%), linear-gradient(to top, transparent 0%, #000 18%)",
              maskComposite: "intersect",
              WebkitMaskComposite: "source-in",
            }}
          />
          {/* Soft horizontal warm ivory gradient overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, #FAF8F5 0%, rgba(250,248,245,0.85) 20%, rgba(250,248,245,0.2) 55%, transparent 100%), linear-gradient(to top, #FAF8F5 0%, transparent 20%)",
            }}
          />
        </div>
        
        <div className="relative z-10 container mx-auto px-6 md:px-12 max-w-7xl">
          <div className="max-w-2xl lg:max-w-xl xl:max-w-2xl">
            <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
              <span className="text-[#8C7355] text-xs">✦</span>
              <p className="text-[#8C7355] text-[11px] sm:text-xs font-mono tracking-[0.28em] uppercase font-medium">
                ITINERARIES
              </p>
              <span className="w-8 h-[1px] bg-[#8C7355]/40 inline-block" />
            </div>
            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-[62px] text-[#183628] leading-[1.08] font-normal tracking-tight mb-3 sm:mb-4">
              Immaculate <em className="italic font-light">Journeys</em>
            </h1>
            <p className="font-sans text-[#4A5D53] text-sm sm:text-base leading-relaxed max-w-xl">
              Thoughtfully crafted paths through Kerala's most extraordinary landscapes and heritage homes.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Filter Panel */}
      <section className="bg-[#FAF8F5] pb-8 sm:pb-10">
        <div className="container mx-auto px-6 md:px-12">
          <div className="bg-[#EFF4F0] rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 max-w-4xl mx-auto border border-[#E2EAE4] shadow-xs">
            {/* Row 1: Category chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
              {CATEGORIES.map(cat => {
                const isSelected = activeFilter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveFilter(cat)}
                    className={`font-sans text-xs tracking-wide px-4 sm:px-5 py-2 rounded-full transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-[#183628] text-white font-medium shadow-xs"
                        : "bg-white/90 hover:bg-white text-[#38483D] border border-[#D5DFD8] hover:border-[#B58D5D]"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Row 2: Secondary dropdowns */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-3 sm:mt-3.5 pt-1">
              <select
                value={durationIdx}
                onChange={e => setDurationIdx(Number(e.target.value))}
                className="bg-white/95 border border-[#D5DFD8] text-[#38483D] font-sans text-xs rounded-full px-4 py-2 focus:outline-none focus:border-[#183628] shadow-xs cursor-pointer hover:border-[#B58D5D] transition-colors"
              >
                {DURATION_FILTERS.map((f, i) => (
                  <option key={f.label} value={i} className="bg-white text-ink">
                    {f.label}
                  </option>
                ))}
              </select>

              {destinationNames.length > 0 && (
                <select
                  value={destFilter}
                  onChange={e => setDestFilter(e.target.value)}
                  className="bg-white/95 border border-[#D5DFD8] text-[#38483D] font-sans text-xs rounded-full px-4 py-2 focus:outline-none focus:border-[#183628] shadow-xs cursor-pointer hover:border-[#B58D5D] transition-colors"
                >
                  <option value="All" className="bg-white text-ink">All Destinations</option>
                  {destinationNames.map(d => (
                    <option key={d} value={d} className="bg-white text-ink">
                      {d}
                    </option>
                  ))}
                </select>
              )}

              {(durationIdx > 0 || destFilter !== "All") && (
                <button
                  onClick={() => { setDurationIdx(0); setDestFilter("All"); }}
                  className="font-sans text-xs uppercase tracking-wider text-[#B58D5D] border border-[#B58D5D] rounded-full px-4 py-1.5 hover:bg-[#B58D5D] hover:text-white transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Packages Grid */}
      <section className="bg-[#FAF8F5] pb-20 md:pb-24">
        <div className="container mx-auto px-6 md:px-12 max-w-6xl">
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
                    className="group relative block overflow-hidden rounded-2xl border border-black/5 bg-[#183628] shadow-sm hover:shadow-xl transition-all duration-500 aspect-[16/10.5] sm:aspect-[16/10]"
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
                      <h3 className="font-editorial text-3xl sm:text-[2.25rem] font-normal tracking-tight leading-none text-white drop-shadow-sm mb-2 group-hover:text-white/95 transition-colors">
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
              <p className="font-editorial text-2xl text-[#183628] font-normal">No journeys found for this category.</p>
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
    </Layout>
  );
}
