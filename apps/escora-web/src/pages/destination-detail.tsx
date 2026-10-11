import { useParams, Link } from "wouter";
import { useListDestinations } from "@workspace/api-client-react";
import Layout from "@/components/layout/Layout";
import { useSeo } from "@/hooks/useSeo";
import { findKeralaDestinationBySlug, slugify, KERALA_DESTINATIONS, DESTINATION_ITINERARY_MAP } from "@/lib/keralaDestinations";
import { itineraryTemplates } from "@/lib/itineraryTemplates";
import { formatMoney } from "@/lib/itinerary";

export default function DestinationDetail() {
  const { name } = useParams();
  const slug = (name || "").toLowerCase();

  const { data: apiDestinations, isLoading } = useListDestinations({ published: true });

  const apiMatch = apiDestinations?.find((d) => (d.slug || slugify(d.name)) === slug);
  const dest = apiMatch ?? findKeralaDestinationBySlug(slug);

  let highlights: string[] = [];
  const rawHighlights = dest && "highlights" in dest ? dest.highlights : undefined;
  if (Array.isArray(rawHighlights)) {
    highlights = rawHighlights;
  } else if (typeof rawHighlights === "string" && rawHighlights) {
    const highlightsStr: string = rawHighlights;
    try {
      const parsed = JSON.parse(highlightsStr);
      highlights = Array.isArray(parsed) ? parsed : highlightsStr.split("\n").filter(Boolean);
    } catch {
      highlights = highlightsStr.split("\n").filter(Boolean);
    }
  }

  const howToReach = dest && "howToReach" in dest ? dest.howToReach : undefined;
  const elevation = dest?.elevation;

  const seoImage = dest?.imageUrl ?? undefined;

  useSeo({
    title: dest ? `${dest.name} Travel Guide — Kerala Destination by Escora` : "Destination",
    description: dest?.shortDesc ?? "Discover Kerala's finest destinations, curated by Escora.",
    image: seoImage,
    url: dest ? `https://www.escoraholidays.com/destinations/${slug}` : "https://www.escoraholidays.com/destinations",
    jsonLd: dest ? {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      name: dest.name,
      description: dest.shortDesc,
      image: seoImage,
      url: `https://www.escoraholidays.com/destinations/${slug}`,
      containedInPlace: { "@type": "AdministrativeArea", name: `${dest.region}, Kerala` },
    } : undefined,
  });

  if (isLoading && !dest) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-12 h-12 border-t border-gold animate-spin rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!dest) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center px-6">
          <p className="font-mono text-gold text-sm tracking-[0.3em] uppercase">Not Found</p>
          <h1 className="font-serif text-4xl text-ink">Destination not found</h1>
          <Link href="/destinations" className="font-mono text-xs text-gold uppercase tracking-widest hover:underline">
            ← Back to Explore Kerala
          </Link>
        </div>
      </Layout>
    );
  }

  const planHref = `/plan?destination=${encodeURIComponent(dest.name)}`;
  const otherDestinations = KERALA_DESTINATIONS.filter((d) => d.slug !== slug).slice(0, 3);
  const heroImage = dest.imageUrl || "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=2000&q=80";

  const itineraryMatch = DESTINATION_ITINERARY_MAP[slug];
  const itineraryTemplate = itineraryMatch
    ? itineraryTemplates.find((t) => t.id === itineraryMatch.templateId)
    : undefined;
  const isMultiStop = itineraryTemplate
    ? new Set(itineraryTemplate.stays.map((s) => s.location)).size > 1
    : false;

  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[75dvh] w-full overflow-hidden flex items-end pb-16 pt-24">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt={dest.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
        </div>
        <div className="relative z-10 container mx-auto px-6 md:px-12">
          <Link
            href="/destinations"
            className="inline-flex items-center gap-2 font-mono text-[11px] text-white/60 uppercase tracking-[0.2em] hover:text-gold transition-colors mb-8"
          >
            ← Explore Kerala
          </Link>
          <p className="font-mono text-gold text-sm tracking-[0.3em] uppercase mb-4">{dest.type} · {dest.region}</p>
          <h1 className="font-serif text-5xl md:text-7xl text-white leading-[1.05] font-light max-w-3xl">
            {dest.name}
          </h1>
          {dest.shortDesc && (
            <p className="font-serif text-xl text-white/70 italic mt-4 max-w-2xl">{dest.shortDesc}</p>
          )}
        </div>
      </section>

      {/* Key facts strip */}
      <section className="py-10 bg-bg-2 border-y border-line">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex flex-wrap gap-x-12 gap-y-6 justify-center md:justify-start">
            <FactStat label="Region" value={dest.region} />
            {dest.bestSeason && <FactStat label="Best Season" value={dest.bestSeason} />}
            {(dest.nightsMin || dest.nightsMax) && (
              <FactStat
                label="Recommended Stay"
                value={dest.nightsMin && dest.nightsMax && dest.nightsMin !== dest.nightsMax
                  ? `${dest.nightsMin}–${dest.nightsMax} Nights`
                  : `${dest.nightsMin ?? dest.nightsMax} Nights`}
              />
            )}
            {elevation && <FactStat label="Elevation" value={elevation} />}
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-20 bg-bg">
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-3xl mx-auto">
            <p className="font-mono text-gold text-[11px] tracking-[0.3em] uppercase mb-4 text-center">Overview</p>
            <p className="font-sans text-ink-soft text-lg leading-relaxed text-center">
              {dest.description || dest.shortDesc}
            </p>
          </div>

          {itineraryTemplate ? (
            <div className="max-w-4xl mx-auto mt-14 border border-line rounded p-8 md:p-10">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
                <div>
                  <p className="font-mono text-gold text-[11px] tracking-[0.3em] uppercase mb-2">
                    {isMultiStop ? "Sample Multi-Destination Itinerary" : "Sample Itinerary"}
                  </p>
                  <h3 className="font-serif text-2xl md:text-3xl text-ink">{itineraryTemplate.title}</h3>
                  {isMultiStop && itineraryMatch && (
                    <p className="font-sans text-sm text-ink-soft mt-2">
                      {dest.name} features as {itineraryMatch.nightsHere} of the {itineraryTemplate.stays.reduce((sum, s) => sum + (s.nights ?? 0), 0)} nights on this route.
                    </p>
                  )}
                </div>
                {itineraryTemplate.pricing.total > 0 && (
                  <div className="text-right flex-shrink-0">
                    <p className="font-serif text-2xl text-gold-bright">{formatMoney(itineraryTemplate.pricing.total, "INR")}</p>
                    <p className="font-mono text-[10px] text-ink-mute uppercase tracking-widest mt-1">Indicative, from</p>
                  </div>
                )}
              </div>

              {itineraryTemplate.stays.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {itineraryTemplate.stays.map((stay, i) => (
                    <span
                      key={i}
                      className={`font-mono text-[10px] uppercase tracking-widest px-3 py-2 rounded-full border ${
                        stay.location === dest.name ? "border-gold text-gold bg-gold/10" : "border-line text-ink-soft"
                      }`}
                    >
                      {stay.location} · {stay.nights ?? 1}N
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-5">
                {itineraryTemplate.days.map((day) => (
                  <div key={day.day} className="flex gap-5">
                    <div className="font-mono text-gold text-xs flex-shrink-0 pt-1 w-14">Day {day.day}</div>
                    <div>
                      <h4 className="font-serif text-lg text-ink mb-1">{day.title}</h4>
                      {day.description && (
                        <p className="font-sans text-sm text-ink-soft leading-relaxed line-clamp-3">{day.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 text-center">
                <Link
                  href={planHref}
                  className="inline-block font-mono text-xs uppercase tracking-widest bg-gold text-bg px-8 py-4 hover:bg-gold/80 transition-colors"
                >
                  Plan your journey to {dest.name}
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-10 text-center">
              <Link
                href={planHref}
                className="inline-block font-mono text-xs uppercase tracking-widest bg-gold text-bg px-8 py-4 hover:bg-gold/80 transition-colors"
              >
                Plan your journey to {dest.name}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Highlights / Things to do */}
      {highlights.length > 0 && (
        <section className="py-20 bg-bg-2 border-y border-line">
          <div className="container mx-auto px-6 md:px-12">
            <div className="max-w-4xl mx-auto">
              <p className="font-mono text-gold text-[11px] tracking-[0.3em] uppercase mb-3">Things to Do</p>
              <h2 className="font-serif text-4xl md:text-5xl text-ink font-light mb-12">
                {dest.name} <em className="italic">Highlights</em>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                {highlights.map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <span className="mt-2 flex-shrink-0 w-5 h-[1px] bg-gold" />
                    <p className="font-sans text-ink-soft leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How to reach */}
      {howToReach && (
        <section className="py-16 bg-bg">
          <div className="container mx-auto px-6 md:px-12">
            <div className="max-w-3xl mx-auto border border-line rounded p-8 md:p-10">
              <p className="font-mono text-gold text-[11px] tracking-[0.3em] uppercase mb-4">How to Reach</p>
              <p className="font-sans text-ink-soft leading-relaxed">{howToReach}</p>
            </div>
          </div>
        </section>
      )}

      {/* Other destinations */}
      {otherDestinations.length > 0 && (
        <section className="py-20 bg-bg-2 border-t border-line">
          <div className="container mx-auto px-6 md:px-12">
            <p className="font-mono text-gold text-[11px] tracking-[0.3em] uppercase mb-3">Keep Exploring</p>
            <h2 className="font-serif text-4xl md:text-5xl text-ink font-light mb-12">
              More of <em className="italic">Kerala</em>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {otherDestinations.map((other) => (
                <Link
                  key={other.slug}
                  href={`/destinations/${other.slug}`}
                  className="group block"
                >
                  <div className="aspect-[4/3] overflow-hidden mb-4">
                    <img
                      src={other.imageUrl}
                      alt={other.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <p className="font-mono text-gold text-[10px] uppercase tracking-widest mb-1">{other.type}</p>
                  <h3 className="font-serif text-2xl text-ink">{other.name}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-bg border-t border-line">
        <div className="container mx-auto px-6 md:px-12 text-center">
          <p className="font-mono text-gold text-[11px] tracking-[0.3em] uppercase mb-4">Ready to begin?</p>
          <h2 className="font-serif text-4xl md:text-5xl text-ink font-light mb-6 max-w-2xl mx-auto">
            Let us compose your<br /><em className="italic">{dest.name}</em> journey
          </h2>
          <p className="font-sans text-ink-soft max-w-lg mx-auto mb-10">
            Every Escora journey is built from scratch — your dates, your pace, your companions. Tell us what you're imagining.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={planHref}
              className="font-mono text-xs uppercase tracking-widest bg-gold text-bg px-8 py-4 hover:bg-gold/80 transition-colors"
            >
              Plan a Journey
            </Link>
            <a
              href={`https://wa.me/918157003344?text=Hello%20Escora%20%E2%80%94%20I'm%20interested%20in%20visiting%20${encodeURIComponent(dest.name)}%2C%20Kerala.`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs uppercase tracking-widest border border-line text-ink-soft px-8 py-4 hover:border-gold hover:text-gold transition-colors"
            >
              WhatsApp us
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function FactStat({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="text-center md:text-left">
      <p className="font-mono text-[10px] text-gold uppercase tracking-widest mb-1">{label}</p>
      <p className="font-serif text-lg text-ink">{value}</p>
    </div>
  );
}
