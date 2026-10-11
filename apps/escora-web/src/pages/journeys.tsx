import Layout from "@/components/layout/Layout";
import { useListPackages, useListDestinations } from "@workspace/api-client-react";
import { useState, useMemo } from "react";
import { useSeo } from "@/hooks/useSeo";
import { Link } from "wouter";

const CATEGORIES = ["All", "Honeymoon", "Family", "Adventure", "Wellness", "Culture"];

const DURATION_FILTERS = [
  { label: "All Durations", min: 0, max: Infinity },
  { label: "Short (1–4 nights)", min: 1, max: 4 },
  { label: "Medium (5–7 nights)", min: 5, max: 7 },
  { label: "Long (8+ nights)", min: 8, max: Infinity },
];


const MOCK_PACKAGES = [
  { id: 1, name: "The Malabar Escape", durationNights: 5, route: "Fort Kochi → Munnar → Alleppey", category: "Honeymoon", priceFrom: 150000, heroImageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80", slug: "malabar-escape" },
  { id: 2, name: "Cardamom Hills Retreat", durationNights: 4, route: "Munnar → Thekkady", category: "Wellness", priceFrom: 120000, heroImageUrl: "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?auto=format&fit=crop&w=800&q=80", slug: "cardamom-hills" },
  { id: 3, name: "Spice Coast Odyssey", durationNights: 7, route: "Fort Kochi → Marari → Kumarakom", category: "Culture", priceFrom: 220000, heroImageUrl: "https://images.unsplash.com/photo-1556470478-98bd74cfc940?auto=format&fit=crop&w=800&q=80", slug: "spice-coast" },
  { id: 4, name: "Wayanad Wilds", durationNights: 3, route: "Calicut → Wayanad", category: "Adventure", priceFrom: 90000, heroImageUrl: "https://images.unsplash.com/photo-1623864703759-4509539ab8ee?auto=format&fit=crop&w=800&q=80", slug: "wayanad-wilds" },
];

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
      {/* Page Hero */}
      <section className="relative h-[60dvh] w-full overflow-hidden flex items-center justify-center pt-24 bg-bg">
        <div className="absolute inset-0 z-0 ken-burns opacity-60">
          <img 
            src="https://images.unsplash.com/photo-1593693397690-362cb9666c6b?auto=format&fit=crop&w=2000&q=80" 
            alt="Kerala Journeys" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-bg/60 mix-blend-multiply" />
        </div>
        
        <div className="relative z-10 container mx-auto px-6 text-center reveal-up">
          <p className="font-mono text-gold text-sm tracking-[0.3em] uppercase mb-6 block">Itineraries</p>
          <h1 className="font-serif text-5xl md:text-7xl text-ink leading-[1.1] font-light max-w-4xl mx-auto mb-8">
            Immaculate <em className="text-gold italic">Journeys</em>
          </h1>
          <p className="font-sans text-ink-soft max-w-2xl mx-auto leading-relaxed">
            Thoughtfully crafted paths through Kerala's most extraordinary landscapes and heritage homes.
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="py-6 bg-bg-2 border-y border-line sticky top-[80px] z-40 backdrop-blur-md bg-bg-2/90">
        <div className="container mx-auto px-6 md:px-12 space-y-3">
          {/* Category chips */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar md:justify-center min-w-max mx-auto">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`font-mono text-xs uppercase tracking-widest px-5 py-2.5 rounded transition-colors ${
                  activeFilter === cat
                    ? "bg-gold text-bg"
                    : "border border-line text-ink-soft hover:border-gold hover:text-gold"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {/* Secondary filters */}
          <div className="flex flex-wrap gap-2 md:justify-center">
            <select
              value={durationIdx}
              onChange={e => setDurationIdx(Number(e.target.value))}
              className="bg-transparent border border-line text-ink-soft font-mono text-[10px] uppercase tracking-widest px-4 py-2 focus:outline-none focus:border-gold cursor-pointer"
            >
              {DURATION_FILTERS.map((f, i) => <option key={f.label} value={i}>{f.label}</option>)}
            </select>
            {destinationNames.length > 0 && (
              <select
                value={destFilter}
                onChange={e => setDestFilter(e.target.value)}
                className="bg-transparent border border-line text-ink-soft font-mono text-[10px] uppercase tracking-widest px-4 py-2 focus:outline-none focus:border-gold cursor-pointer"
              >
                <option value="All">All Destinations</option>
                {destinationNames.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
            {(durationIdx > 0 || destFilter !== "All") && (
              <button
                onClick={() => { setDurationIdx(0); setDestFilter("All"); }}
                className="font-mono text-[10px] uppercase tracking-widest text-gold border border-gold px-4 py-2 hover:bg-gold hover:text-bg transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Packages Grid */}
      <section className="py-24 bg-bg">
        <div className="container mx-auto px-6 md:px-12">
          {isLoading ? (
            <div className="flex justify-center items-center py-32">
              <div className="w-12 h-12 border-t border-gold animate-spin rounded-full"></div>
            </div>
          ) : packages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {packages.map((pkg, i) => (
                <Link 
                  key={pkg.id} 
                  href={`/journeys/${pkg.id}`}
                  className="group block reveal-up"
                  style={{ transitionDelay: `${(i % 2) * 0.2}s` }}
                >
                  <div className="aspect-[4/3] w-full overflow-hidden relative mb-6">
                    <img 
                      src={pkg.heroImageUrl || "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80"} 
                      alt={pkg.name} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute top-6 left-6 flex gap-2">
                      <span className="bg-bg/80 backdrop-blur text-gold font-mono text-[10px] uppercase tracking-widest px-3 py-1">
                        {pkg.category}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-serif text-3xl text-ink group-hover:text-gold transition-colors">{pkg.name}</h3>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-widest text-ink-mute mb-4">
                      <span>{pkg.durationNights} Nights</span>
                      <span className="w-1 h-1 rounded-full bg-line" />
                      <span className="truncate">{pkg.route}</span>
                    </div>
                    
                    {/* @ts-ignore */}
                    <p className="font-sans text-ink-soft line-clamp-2">{pkg.shortDesc || pkg.description}</p>
                    
                    <div className="mt-6 flex items-center gap-3 text-gold font-mono text-xs uppercase tracking-widest">
                      <span>Explore</span>
                      <span className="w-8 h-[1px] bg-gold group-hover:w-12 transition-all" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 reveal-up">
              <p className="font-serif text-2xl text-ink-soft">No journeys found for this category.</p>
              <button 
                onClick={() => setActiveFilter("All")}
                className="mt-8 font-mono text-xs text-gold uppercase tracking-widest hover:text-gold-bright transition-colors"
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
