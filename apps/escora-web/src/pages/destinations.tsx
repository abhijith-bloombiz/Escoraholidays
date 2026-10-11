import Layout from "@/components/layout/Layout";
import { useListDestinations } from "@workspace/api-client-react";
import { useState } from "react";
import { Link } from "wouter";
import { useSeo } from "@/hooks/useSeo";
import { KERALA_DESTINATIONS, slugify, DESTINATION_BADGES } from "@/lib/keralaDestinations";

const CATEGORIES = ["All", "Backwaters", "Hills", "Forest", "Heritage", "Wildlife", "Wellness", "Coastal", "Spice"];

const MOCK_DESTINATIONS = KERALA_DESTINATIONS.map((d) => ({ ...d, season: d.bestSeason }));

export default function Destinations() {
  useSeo({
    title: "Kerala Destinations — Alleppey, Munnar, Fort Kochi, Wayanad & More",
    description: "Discover Kerala's finest destinations — Alleppey backwaters, Munnar tea estates, Fort Kochi heritage, Wayanad jungle, Thekkady wildlife, Varkala beaches, and Kozhikode Malabar coast. Private tours by Escora.",
    url: "https://www.escoraholidays.com/destinations",
  });

  const [activeFilter, setActiveFilter] = useState("All");

  const queryParams = activeFilter !== "All" ? { type: activeFilter, published: true } : { published: true };
  const { data: apiDestinations, isLoading } = useListDestinations(queryParams);

  const destinations = apiDestinations && apiDestinations.length > 0 ? apiDestinations : 
    (activeFilter === "All" ? MOCK_DESTINATIONS : MOCK_DESTINATIONS.filter(d => d.type === activeFilter));

  return (
    <Layout>
      {/* Page Hero */}
      <section className="relative h-[60dvh] w-full overflow-hidden flex items-center justify-center pt-24 bg-bg">
        <div className="absolute inset-0 z-0 opacity-40">
          <img 
            src="https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=2000&q=80" 
            alt="Kerala Map" 
            className="w-full h-full object-cover grayscale mix-blend-overlay"
          />
        </div>
        
        <div className="relative z-10 container mx-auto px-6 text-center reveal-up">
          <p className="font-mono text-gold text-sm tracking-[0.3em] uppercase mb-6 block">Explore Kerala</p>
          <h1 className="font-serif text-5xl md:text-7xl text-ink leading-[1.1] font-light max-w-4xl mx-auto mb-8">
            Curated <em className="text-gold italic">Destinations</em>
          </h1>
          <p className="font-sans text-ink-soft max-w-2xl mx-auto leading-relaxed">
            From misty tea gardens to emerald backwaters and clifftop shores, discover the varied landscapes that make Kerala God's Own Country.
          </p>
        </div>
      </section>

      {/* Filter Chips */}
      <section className="py-8 bg-bg-2 border-y border-line sticky top-[80px] z-40 backdrop-blur-md bg-bg-2/90">
        <div className="container mx-auto px-6 md:px-12 overflow-x-auto no-scrollbar">
          <div className="flex gap-4 md:justify-center min-w-max">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`font-mono text-xs uppercase tracking-widest px-6 py-3 rounded transition-colors ${
                  activeFilter === cat 
                    ? "bg-gold text-bg" 
                    : "border border-line text-ink-soft hover:border-gold hover:text-gold"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations Grid */}
      <section className="py-24 bg-bg">
        <div className="container mx-auto px-6 md:px-12">
          {isLoading ? (
            <div className="flex justify-center items-center py-32">
              <div className="w-12 h-12 border-t border-gold animate-spin rounded-full"></div>
            </div>
          ) : destinations.length > 0 ? (
            <div className="explore-grid">
              {destinations.map((dest, i) => {
                const slug = dest.slug || slugify(dest.name);
                const nightsMin = dest.nightsMin;
                const nightsMax = "nightsMax" in dest ? dest.nightsMax : undefined;
                const nightsLabel = nightsMin && nightsMax && nightsMin !== nightsMax
                  ? `${nightsMin}–${nightsMax} Nights`
                  : nightsMin
                  ? `${nightsMin}+ Nights`
                  : null;
                const region = "region" in dest ? dest.region : undefined;
                const desc = dest.shortDesc || (dest as { description?: string }).description
                  || `Discover the beauty and serenity of ${dest.name}, a perfect getaway for your soul.`;
                const badge = DESTINATION_BADGES[slug];

                if (badge) {
                  return (
                    <Link
                      key={dest.id}
                      href={`/destinations/${slug}`}
                      id={dest.id.toString()}
                      className="explore-card explore-card-badge reveal-up"
                      aria-label={`Explore ${dest.name}, Kerala`}
                    >
                      <img src={badge} alt={`${dest.name} — Escora Holidays`} className="badge-img" />
                      <div className="badge-scrim" />
                      <div className="top-row">
                        <span className="type-badge">{dest.type}</span>
                        {nightsLabel && <span className="fact-pill">{nightsLabel}</span>}
                      </div>
                      <div className="badge-caption">
                        {region && <span className="region">{region}</span>}
                        <span className="view-more">View More <span className="arr" /></span>
                      </div>
                    </Link>
                  );
                }

                return (
                  <Link
                    key={dest.id}
                    href={`/destinations/${slug}`}
                    id={dest.id.toString()}
                    className="explore-card reveal-up"
                    aria-label={`Explore ${dest.name}, Kerala`}
                  >
                    <div className="bg-img" style={{ backgroundImage: `url('${dest.imageUrl || "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?auto=format&fit=crop&w=800&q=80"}')` }} />
                    <div className="scrim" />
                    <div className="top-row">
                      <span className="type-badge">{dest.type}</span>
                      {nightsLabel && <span className="fact-pill">{nightsLabel}</span>}
                    </div>
                    <div className="content">
                      {region && <div className="region">{region}</div>}
                      <div className="c-name">{dest.name}</div>
                      <p className="c-desc">{desc}</p>
                      <div className="c-cta">Discover {dest.name} <span className="arr" /></div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-32 reveal-up">
              <p className="font-serif text-2xl text-ink-soft">No destinations found for this category.</p>
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

      {/* Plan your Journey CTA */}
      <section className="py-24 bg-bg-2 border-t border-line">
        <div className="container mx-auto px-6 md:px-12 text-center">
          <p className="font-mono text-gold text-[11px] tracking-[0.3em] uppercase mb-4">Ready to begin?</p>
          <h2 className="font-serif text-4xl md:text-5xl text-ink font-light mb-6 max-w-2xl mx-auto">
            Every place, woven into <em className="italic">your</em> journey
          </h2>
          <p className="font-sans text-ink-soft max-w-lg mx-auto mb-10">
            Pick one destination or several — we'll design a private itinerary around your dates, your pace and your companions.
          </p>
          <Link
            href="/plan"
            className="inline-block font-mono text-xs uppercase tracking-widest bg-gold text-bg px-8 py-4 hover:bg-gold/80 transition-colors"
          >
            Plan Your Journey
          </Link>
        </div>
      </section>
    </Layout>
  );
}
