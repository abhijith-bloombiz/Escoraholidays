import { useState } from "react";
import { Link } from "wouter";
import Layout from "@/components/layout/Layout";
import { useListDestinations } from "@workspace/api-client-react";
import { useSeo } from "@/hooks/useSeo";
import { MapPin, ArrowRight } from "lucide-react";
import { KERALA_DESTINATIONS, slugify } from "@/lib/keralaDestinations";
import { DESTINATION_PHOTOS } from "@/lib/destinationPhotos";
import whyEscoraBg from "@assets/escora/why-escora-bg.jpeg";
import ctaHouseboat from "@assets/escora/collections/alleppey-lagoon-houseboat.jpeg";
import "./destinations-v3.css";

const CATEGORIES = [
  "All",
  "Backwaters",
  "Hills",
  "Forest",
  "Heritage",
  "Wildlife",
  "Wellness",
  "Coastal",
  "Spice",
];

const FALLBACK_IMG = "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80";

export default function DestinationsV3() {
  useSeo({
    title: "Curated Destinations — Kerala | Escora",
    description:
      "From misty tea gardens to serene backwaters and offbeat hidden gems, discover the varied landscapes that make Kerala God's Own Country. Bespoke private tours by Escora.",
    url: "https://www.escoraholidays.com/destinations",
  });

  const [activeFilter, setActiveFilter] = useState("All");

  const queryParams = activeFilter !== "All" ? { type: activeFilter, published: true } : { published: true };
  const { data: apiDestinations, isLoading } = useListDestinations(queryParams);

  const rawDestinations = apiDestinations && apiDestinations.length > 0
    ? apiDestinations
    : KERALA_DESTINATIONS;

  const destinations = activeFilter === "All"
    ? rawDestinations
    : rawDestinations.filter(
        (d) => d.type.toLowerCase() === activeFilter.toLowerCase()
      );

  return (
    <Layout>
      <div className="dest-page">
        {/* ── Page Hero ── */}
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
                Curated<br />
                <em>Destinations</em>
              </h1>
              <p className="dest-hero-desc">
                From misty tea gardens to serene backwaters, discover the varied landscapes that make Kerala God&apos;s Own Country.
              </p>
            </div>
          </div>
        </section>

        {/* ── Category Filters ── */}
        <section className="dest-filters-section">
          <div className="dest-wrap">
            <div className="dest-chips" role="tablist" aria-label="Destination Categories">
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
            </div>
          </div>
        </section>

        {/* ── Destination Cards Grid ── */}
        <section className="dest-grid-section">
          <div className="dest-wrap">
            {isLoading ? (
              <div className="dest-empty-state">
                <p>Loading destinations...</p>
              </div>
            ) : destinations.length > 0 ? (
              <div className="dest-grid">
                {destinations.map((dest) => {
                  const slug = dest.slug || slugify(dest.name);
                  const img = dest.imageUrl || DESTINATION_PHOTOS[slug] || FALLBACK_IMG;
                  return (
                    <Link
                      key={dest.id}
                      href={`/destinations/${slug}`}
                      className="dest-card group"
                      aria-label={`Explore ${dest.name}, Kerala`}
                    >
                      <div className="dest-card-media">
                        <img
                          src={img}
                          alt={`${dest.name}, Kerala`}
                          loading="lazy"
                          decoding="async"
                          className="dest-card-img"
                        />
                        <div className="dest-card-scrim-top" />
                        <div className="dest-card-scrim-bottom" />
                      </div>

                      <div className="dest-card-header">
                        <div className="dest-card-title-row">
                          <MapPin className="dest-card-pin" strokeWidth={2} />
                          <h2 className="dest-card-name">{dest.name}</h2>
                        </div>
                        <span className="dest-card-category">{dest.type}</span>
                      </div>

                      <div className="dest-card-arrow-wrap">
                        <div className="dest-card-arrow">
                          <ArrowRight className="dest-card-arrow-icon" strokeWidth={2.2} />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="dest-empty-state">
                <p>No destinations found in this category.</p>
                <button
                  type="button"
                  onClick={() => setActiveFilter("All")}
                  className="dest-empty-btn"
                >
                  View All Destinations
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── Ready to Explore CTA ── */}
        <section className="dest-cta-section">
          <div className="dest-wrap">
            <div className="dest-cta-card">
              <div
                className="dest-cta-bg-image"
                style={{ backgroundImage: `url(${ctaHouseboat})` }}
                aria-hidden="true"
              />
              <div className="dest-cta-bg-gradient" aria-hidden="true" />

              <div className="dest-cta-content">
                <div className="dest-cta-eyebrow">
                  <span>READY TO EXPLORE</span>
                  <span className="dest-cta-eyebrow-line" />
                </div>
                <h2 className="dest-cta-title">
                  Every place, woven into<br />
                  <em>your journey</em>
                </h2>
                <p className="dest-cta-desc">
                  Pick your preferences, and we&apos;ll design a personalized itinerary around your dates, your pace and your travel style.
                </p>
                <Link href="/plan" className="dest-cta-btn">
                  <span>Plan Your Journey</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
