import { useEffect, useState } from "react";
import { Link } from "wouter";
import Layout from "@/components/layout/Layout";
import { useListDestinations } from "@workspace/api-client-react";
import { useSeo } from "@/hooks/useSeo";
import { useToast } from "@/hooks/use-toast";
import { KERALA_DESTINATIONS, slugify } from "@/lib/keralaDestinations";
import { DESTINATION_PHOTOS } from "@/lib/destinationPhotos";
import "./destinations-v3.css";

const CATEGORIES = ["All", "Backwaters", "Hills", "Forest", "Heritage", "Wildlife", "Wellness", "Coastal", "Spice"];
const FALLBACK_IMG = "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80";
const SAVED_KEY = "escora-saved-destinations";

function readSaved(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* V3 Destinations — same content and filters as the live page, laid out as
   the client's masonry pattern: in each run of seven, the outer columns hold
   two tall tiles and the middle column three shorter ones. */
export default function DestinationsV3() {
  useSeo({
    title: "Kerala Destinations — Alleppey, Munnar, Fort Kochi, Wayanad & More",
    description: "Discover Kerala's finest destinations — Alleppey backwaters, Munnar tea estates, Fort Kochi heritage, Wayanad jungle, Thekkady wildlife, Varkala beaches, and Kozhikode Malabar coast. Private tours by Escora.",
    url: "https://www.escoraholidays.com/destinations",
  });
  const { toast } = useToast();

  const [activeFilter, setActiveFilter] = useState("All");
  const [saved, setSaved] = useState<string[]>(readSaved);

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
    } catch {
      /* storage unavailable — hearts just won't persist */
    }
  }, [saved]);

  const queryParams = activeFilter !== "All" ? { type: activeFilter, published: true } : { published: true };
  const { data: apiDestinations, isLoading } = useListDestinations(queryParams);

  const destinations = apiDestinations && apiDestinations.length > 0
    ? apiDestinations
    : activeFilter === "All" ? KERALA_DESTINATIONS : KERALA_DESTINATIONS.filter((d) => d.type === activeFilter);

  async function share(name: string, slug: string) {
    const url = `${window.location.origin}/destinations/${slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${name}, Kerala — Escora`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: `${name} — ready to share.` });
    } catch {
      /* user dismissed the share sheet, or clipboard is blocked */
    }
  }

  function toggleSaved(slug: string) {
    setSaved((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug]));
  }

  return (
    <Layout>
      <div className="v3dest">
        {/* Page hero */}
        <section className="v3dest-hero">
          <div className="v3dest-wrap">
            <span className="v3dest-eyebrow reveal-up">Explore Kerala</span>
            <h1 className="reveal-up">Curated <em>Destinations</em></h1>
            <p className="reveal-up">
              From misty tea gardens to emerald backwaters and clifftop shores, discover the varied landscapes that make Kerala God's Own Country.
            </p>
          </div>
        </section>

        {/* Filter chips */}
        <div className="v3dest-filters">
          <div className="v3dest-wrap">
            <div className="chips">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveFilter(cat)}
                  className={activeFilter === cat ? "on" : ""}
                  aria-pressed={activeFilter === cat}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Masonry gallery */}
        <section className="v3dest-gallery">
          <div className="v3dest-wrap">
            {isLoading ? (
              <div className="v3dest-loading"><span /></div>
            ) : destinations.length > 0 ? (
              <div className="v3-masonry">
                {destinations.map((dest) => {
                  const slug = dest.slug || slugify(dest.name);
                  const region = "region" in dest ? dest.region : undefined;
                  const img = DESTINATION_PHOTOS[slug] || dest.imageUrl || FALLBACK_IMG;
                  const isSaved = saved.includes(slug);
                  return (
                    <div key={dest.id} className="v3-tile">
                      <img src={img} alt="" loading="lazy" />
                      <div className="scrim" />
                      <div className="caption">
                        <h2>{dest.name}</h2>
                        <span>{[region, dest.type].filter(Boolean).join(" · ")}</span>
                      </div>
                      {/* Stretched link covers the tile; the action buttons sit above it
                          as siblings, since buttons can't be nested inside a link. */}
                      <Link href={`/destinations/${slug}`} className="v3-tile-link" aria-label={`Explore ${dest.name}, Kerala`} />
                      <div className="actions">
                        <button type="button" onClick={() => share(dest.name, slug)} aria-label={`Share ${dest.name}`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                        </button>
                        <button
                          type="button"
                          className={isSaved ? "saved" : ""}
                          onClick={() => toggleSaved(slug)}
                          aria-label={isSaved ? `Remove ${dest.name} from saved` : `Save ${dest.name}`}
                          aria-pressed={isSaved}
                        >
                          <svg viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="v3dest-empty">
                <p>No destinations found for this category.</p>
                <button type="button" onClick={() => setActiveFilter("All")}>Clear filters</button>
              </div>
            )}
          </div>
        </section>

        {/* Plan CTA */}
        <section className="v3dest-cta">
          <div className="v3dest-wrap">
            <span className="v3dest-eyebrow">Ready to begin?</span>
            <h2>Every place, woven into <em>your</em> journey</h2>
            <p>Pick one destination or several — we'll design a private itinerary around your dates, your pace and your companions.</p>
            <Link href="/plan" className="v3dest-btn">Plan Your Journey</Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}
