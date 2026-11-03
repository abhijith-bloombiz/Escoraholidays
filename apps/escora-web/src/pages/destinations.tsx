import React, { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { MapPin, Compass, Mountain, Clock, Search, ArrowRight, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EnquiryModal from '../components/EnquiryModal';
import Toast from '../components/Toast';
import HeroGradientBackground from '../components/HeroGradientBackground';
import { DISTRICT_DETAILS } from '../data/districtDetails';
import '../components/Kerala3DMapSection.css';
import { KERALA_DESTINATIONS, type DestinationDetail } from '../data/destinationsData';
import { useScrollReveal, usePageScrollReveal } from '../hooks/useScrollAnimation';
import { useListDestinations } from '@workspace/api-client-react';
import { resolveDistrictName } from '../components/Kerala3DMapCanvas';

const Kerala3DMapCanvas = React.lazy(() => import('../components/Kerala3DMapCanvas'));

const CATEGORIES = ['All', 'Highlands', 'Backwaters', 'Coastal', 'Forest & Wildlife', 'Heritage'] as const;

export default function DestinationsPage() {
  usePageScrollReveal();

  const { data: remoteDestinations } = useListDestinations();

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [enquiryOpen, setEnquiryOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>('Idukki');
  const [activeDestSlug, setActiveDestSlug] = useState<string>('munnar');

  const [mapSectionRef, mapVisible] = useScrollReveal<HTMLElement>({ threshold: 0.05, reEnter: false });
  const [gridSectionRef, gridVisible] = useScrollReveal<HTMLElement>({ threshold: 0.05, reEnter: false });

  // Merge CMS destinations dynamically with static seeds
  const allDestinations = useMemo<DestinationDetail[]>(() => {
    if (!remoteDestinations || remoteDestinations.length === 0) {
      return KERALA_DESTINATIONS;
    }

    const publishedPool = remoteDestinations.filter((d) => d.published !== false).sort((a, b) => ((a as any).sortOrder || 0) - ((b as any).sortOrder || 0));
    const cmsList: DestinationDetail[] = publishedPool.map((d) => {
      const existing = KERALA_DESTINATIONS.find(
        (k) =>
          k.slug.toLowerCase() === d.slug.toLowerCase() ||
          k.name.toLowerCase() === d.name.toLowerCase()
      );

      const parsedHighlights = (() => {
        if (!d.highlights) return existing?.highlights || [];
        try {
          const arr = JSON.parse(d.highlights);
          return Array.isArray(arr) ? arr : [d.highlights];
        } catch {
          return d.highlights.split('\n').filter(Boolean);
        }
      })();

      const coordsStr =
        typeof d.latitude === 'number' && typeof d.longitude === 'number'
          ? `${d.latitude.toFixed(4)}°N ${d.longitude.toFixed(4)}°E`
          : existing?.coordinates || '10.0889°N 77.0595°E';

      return {
        slug: d.slug,
        name: d.name,
        region: d.region,
        type: (d.type as any) || existing?.type || 'Highlands',
        shortDesc: d.shortDesc || existing?.shortDesc || d.description || '',
        description: d.description || existing?.description || d.shortDesc || '',
        coordinates: coordsStr,
        elevation: d.elevation || existing?.elevation,
        bestSeason: d.bestSeason || existing?.bestSeason || 'Year-round',
        nightsMin: typeof d.nightsMin === 'number' ? d.nightsMin : (existing?.nightsMin ?? 2),
        nightsMax: typeof d.nightsMax === 'number' ? d.nightsMax : (existing?.nightsMax ?? 4),
        imageUrl: d.imageUrl || existing?.imageUrl || '/images/dest_3_munnar.jpg',
        gallery: existing?.gallery || (d.imageUrl ? [d.imageUrl] : ['/images/dest_3_munnar.jpg']),
        highlights: parsedHighlights.length > 0 ? parsedHighlights : (existing?.highlights || []),
        howToReach:
          d.howToReach ||
          existing?.howToReach ||
          'Accessible via scenic road transfers and nearby Kerala rail/airport hubs.',
        featured: Boolean(d.featured),
        latitude: typeof d.latitude === 'number' ? d.latitude : undefined,
        longitude: typeof d.longitude === 'number' ? d.longitude : undefined,
        sampleItinerary: existing?.sampleItinerary,
        curatedStays: existing?.curatedStays,
      };
    });

    const cmsSlugs = new Set(cmsList.map((c) => c.slug.toLowerCase()));
    const extraStatic = KERALA_DESTINATIONS.filter((k) => !cmsSlugs.has(k.slug.toLowerCase()));
    return [...cmsList, ...extraStatic];
  }, [remoteDestinations]);

  const spotlightDest = useMemo(() => {
    return (
      allDestinations.find((d) => d.slug.toLowerCase() === activeDestSlug.toLowerCase()) ||
      allDestinations[0]
    );
  }, [allDestinations, activeDestSlug]);

  const handleSelectDistrict = (districtName: string, associatedDestId?: string) => {
    setSelectedDistrict(districtName);
    if (associatedDestId) {
      const match = allDestinations.find(
        (d) =>
          d.slug.toLowerCase() === associatedDestId.toLowerCase() ||
          d.slug.toLowerCase().includes(associatedDestId.toLowerCase())
      );
      if (match) {
        setActiveDestSlug(match.slug);
        return;
      }
    }
    const districtMatch = allDestinations.find((d) =>
      d.region.toLowerCase().includes(districtName.toLowerCase())
    );
    if (districtMatch) {
      setActiveDestSlug(districtMatch.slug);
    }
  };

  const handleSelectPill = (dest: DestinationDetail) => {
    setActiveDestSlug(dest.slug);
    const districtEntry = Object.entries(DISTRICT_DETAILS).find(
      ([_, v]) => v.associatedDestId === dest.slug
    );
    if (districtEntry) {
      setSelectedDistrict(districtEntry[0]);
    } else {
      setSelectedDistrict(resolveDistrictName(dest.region));
    }
  };

  const handleJumpToGrid = (slug: string, type: string) => {
    if (activeCategory !== 'All' && activeCategory !== type) {
      setActiveCategory('All');
    }
    setTimeout(() => {
      const el = document.getElementById(`destination-${slug}`);
      if (el) {
        const lenis = (window as any).lenis;
        if (lenis && typeof lenis.scrollTo === 'function') {
          lenis.scrollTo(el, { offset: -90, duration: 1.1 });
        } else {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        el.style.transition = 'box-shadow 0.4s ease';
        el.style.boxShadow = '0 0 0 4px #D4A359, 0 20px 45px rgba(212, 163, 89, 0.35)';
        setTimeout(() => {
          el.style.boxShadow = '';
        }, 2400);
      }
    }, 100);
  };

  const filteredDestinations = useMemo(() => {
    return allDestinations.filter((dest) => {
      const matchesCategory =
        activeCategory === 'All' || dest.type.toLowerCase() === activeCategory.toLowerCase();
      const matchesSearch =
        searchQuery.trim() === '' ||
        dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dest.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dest.shortDesc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allDestinations, activeCategory, searchQuery]);

  return (
    <div className="anim-page-fade-in" style={{ minHeight: '100vh', backgroundColor: '#F8F6F1', color: '#121316', display: 'flex', flexDirection: 'column' }}>
      <Navbar onOpenEnquiry={() => setEnquiryOpen(true)} />

      {/* Hero Section */}
      <section
        style={{
          position: 'relative',
          padding: '10rem 2rem 5rem',
          backgroundColor: '#0D0F13',
          color: '#FFFFFF',
          overflow: 'hidden'
        }}
      >
        <HeroGradientBackground />

        <div className="section-wrapper" style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '980px' }}>
          <div
            className="anim-hero-badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '0.4rem 1.1rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#D4A359',
              fontWeight: 600,
              marginBottom: '1.5rem',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
            }}
          >
            <Compass size={14} color="#D4A359" /> Curated Kerala Geography
          </div>

          <h1
            className="font-display anim-hero-title"
            style={{
              fontSize: 'clamp(2.75rem, 6vw, 4.75rem)',
              letterSpacing: '0.04em',
              lineHeight: 1.05,
              marginBottom: '1.5rem',
              color: '#FFFFFF',
              fontWeight: 500
            }}
          >
            SANCTUARIES &amp; <span style={{ color: '#D4A359' }}>LANDSCAPES</span>
          </h1>

          <p
            className="anim-hero-desc"
            style={{
              fontSize: 'clamp(1rem, 1.25vw, 1.2rem)',
              color: 'rgba(255, 255, 255, 0.72)',
              lineHeight: 1.7,
              maxWidth: '720px',
              margin: '0 auto 2.5rem'
            }}
          >
            From the cloud-capped tea estates of the Western Ghats to silent backwater lagoons and
            sacred Malabar temple shores. Explore the diverse terroirs of God’s Own Country.
          </p>

          {/* Search Bar */}
          <div
            className="anim-hero-search"
            style={{
              maxWidth: '560px',
              margin: '0 auto',
              position: 'relative'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.07)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '9999px',
                padding: '0.45rem 0.5rem 0.45rem 1.4rem',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
                transition: 'box-shadow 0.3s ease, border-color 0.3s ease'
              }}
            >
              <Search size={18} color="#D4A359" style={{ marginRight: '0.75rem', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search by destination, region, or landscape..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flexGrow: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#FFFFFF',
                  fontSize: '0.95rem',
                  fontFamily: 'var(--font-body)'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.5)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    padding: '0.4rem 0.8rem'
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Regional Geography & Terroirs Showcase ── */}
      <section ref={mapSectionRef} className="kerala-3d-map-section reveal-fade-up">
        <div className="section-wrapper">
          <div className="kerala-3d-map-header">
            <div className="kerala-3d-map-eyebrow anim-hero-badge reveal-fade-up">
              <Compass size={14} color="#9E6F29" /> Regional Geography &amp; Terroirs
            </div>
            <h2 className="font-display kerala-3d-map-title reveal-fade-up stagger-1">
              EXPLORE KERALA BY REGION
            </h2>
            <p className="kerala-3d-map-subtitle reveal-fade-up stagger-2">
              From mist-cloaked tea summits to silent backwater lagoons — explore Kerala's diverse terroirs and curated havens.
            </p>
          </div>

          <div className="kerala-3d-map-grid">
            {/* Kerala Map Canvas */}
            <div className="kerala-3d-canvas-box">
              <div className="kerala-3d-map-wrap">
                <React.Suspense
                  fallback={
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        minHeight: '350px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#0D0F13',
                        borderRadius: '20px'
                      }}
                    >
                      <div style={{ color: '#D4A359', fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                        Loading Interactive Terroirs...
                      </div>
                    </div>
                  }
                >
                  <Kerala3DMapCanvas
                    selectedDistrict={selectedDistrict}
                    activeDestId={activeDestSlug}
                    onSelectDistrict={handleSelectDistrict}
                    destinations={allDestinations}
                  />
                </React.Suspense>
              </div>
            </div>

            {/* Curated Spotlight Card */}
            <div className="kerala-3d-spotlight-box">
              {spotlightDest && (
                <div className="kerala-3d-spotlight-card">
                  <div className="kerala-3d-spotlight-image-wrap">
                    <img
                      src={spotlightDest.imageUrl}
                      alt={spotlightDest.name}
                      className="kerala-3d-spotlight-img card-zoom-img"
                    />
                    <div className="kerala-3d-spotlight-image-scrim" />

                    {/* Text content placed over image */}
                    <div className="kerala-3d-spotlight-overlay-content">
                      <div className="kerala-3d-spotlight-title-row">
                        <h3 className="font-display kerala-3d-spotlight-name">
                          {spotlightDest.name}
                        </h3>
                        <span className="kerala-3d-spotlight-region">
                          {spotlightDest.region}
                        </span>
                      </div>

                      <p className="kerala-3d-spotlight-desc">
                        {spotlightDest.shortDesc}
                      </p>

                      <div className="kerala-3d-spotlight-actions">
                        <Link
                          href={`/destinations/${spotlightDest.slug}`}
                          className="kerala-3d-btn-primary anim-hover-pill"
                        >
                          <span>Explore Sanctuary Details</span>
                          <ArrowRight size={16} className="card-arrow-hover" />
                        </Link>
                        <button
                          type="button"
                          className="kerala-3d-btn-secondary anim-hover-pill"
                          onClick={() => handleJumpToGrid(spotlightDest.slug, spotlightDest.type)}
                        >
                          <MapPin size={15} color="#D4A359" />
                          <span>Jump to Collection</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Filter Chips Bar */}
      <section
        style={{
          position: 'relative',
          zIndex: 10,
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          padding: '1rem 0',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)'
        }}
      >
        <div className="section-wrapper" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ display: 'flex', gap: '0.75rem', minWidth: 'max-content', padding: '0.2rem 0' }}>
            {CATEGORIES.map((cat, idx) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`anim-hover-pill reveal-pop stagger-${(idx % 6) + 1}`}
                  style={{
                    backgroundColor: active ? '#121316' : '#F3EFE8',
                    color: active ? '#FFFFFF' : '#121316',
                    border: active ? '1px solid #121316' : '1px solid transparent',
                    padding: '0.55rem 1.4rem',
                    borderRadius: '9999px',
                    fontSize: '0.82rem',
                    fontWeight: active ? 700 : 500,
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                    boxShadow: active ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Destinations Grid */}
      <section ref={gridSectionRef} style={{ padding: '4.5rem 0 6rem', flexGrow: 1 }}>
        <div className="section-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2.5rem' }}>
            <div>
              <p className="reveal-fade-up" style={{ fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B48235', fontWeight: 700 }}>
                {activeCategory === 'All' ? 'ALL REGIONAL SANCTUARIES' : `${activeCategory.toUpperCase()} COLLECTION`}
              </p>
              <h2 className="font-display reveal-fade-up stagger-1" style={{ fontSize: '2.4rem', letterSpacing: '0.04em', color: '#121316', marginTop: '0.25rem' }}>
                {filteredDestinations.length} {filteredDestinations.length === 1 ? 'Destination' : 'Destinations'} Curated
              </h2>
            </div>
            <p className="reveal-fade-up stagger-2" style={{ fontSize: '0.88rem', color: '#6B7280' }}>
              Click any destination for in-depth itineraries, seasonal guides &amp; luxury stays
            </p>
          </div>

          {filteredDestinations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '6rem 2rem', backgroundColor: '#FFFFFF', borderRadius: '24px', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
              <Compass size={40} color="#B48235" style={{ margin: '0 auto 1.5rem', opacity: 0.6 }} />
              <h3 className="font-display" style={{ fontSize: '1.8rem', color: '#121316', marginBottom: '0.5rem' }}>
                No Destinations Found
              </h3>
              <p style={{ color: '#6B7280', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                We couldn’t find matches for "{searchQuery}". Try searching for Munnar, Backwaters, or Wayanad.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All');
                }}
                className="btn-pill btn-gold anim-hover-pill"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: '2.25rem'
              }}
            >
              {filteredDestinations.map((dest, idx) => (
                <Link
                  key={dest.slug}
                  href={`/destinations/${dest.slug}`}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}
                >
                  <article
                    id={`destination-${dest.slug}`}
                    className={`portal-card luxury-interactive-card reveal-card stagger-${(idx % 3) + 1}`}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '24px',
                      overflow: 'hidden',
                      border: '1px solid rgba(0, 0, 0, 0.07)',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%'
                    }}
                  >
                    {/* Image Container */}
                    <div style={{ position: 'relative', width: '100%', height: '260px', overflow: 'hidden' }}>
                      <img
                        src={dest.imageUrl}
                        alt={`${dest.name}, Kerala`}
                        className="card-zoom-img"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to top, rgba(13, 15, 19, 0.75) 0%, rgba(13, 15, 19, 0.1) 60%, transparent 100%)'
                        }}
                      />

                      {/* Top Badges */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '1rem',
                          left: '1rem',
                          right: '1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span
                          style={{
                            backgroundColor: 'rgba(13, 15, 19, 0.85)',
                            backdropFilter: 'blur(8px)',
                            color: '#FFFFFF',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            padding: '0.35rem 0.85rem',
                            borderRadius: '9999px',
                            border: '1px solid rgba(255, 255, 255, 0.15)'
                          }}
                        >
                          {dest.type}
                        </span>

                        <span
                          style={{
                            backgroundColor: 'rgba(180, 130, 53, 0.95)',
                            color: '#FFFFFF',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            padding: '0.35rem 0.85rem',
                            borderRadius: '9999px'
                          }}
                        >
                          {dest.nightsMin}–{dest.nightsMax} Nights
                        </span>
                      </div>

                      {/* Bottom Image Overlay Labels */}
                      <div style={{ position: 'absolute', bottom: '1rem', left: '1.25rem', right: '1.25rem' }}>
                        <p style={{ color: '#D4A359', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                          {dest.region}
                        </p>
                        <h3 className="font-display" style={{ color: '#FFFFFF', fontSize: '1.9rem', letterSpacing: '0.04em', lineHeight: 1.1 }}>
                          {dest.name}
                        </h3>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <p style={{ fontSize: '0.9rem', color: '#4B5563', lineHeight: 1.6, marginBottom: '1.5rem', flexGrow: 1 }}>
                        {dest.shortDesc}
                      </p>

                      {/* Fact Bar */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: '0.75rem',
                          padding: '0.85rem',
                          backgroundColor: '#F8F6F1',
                          borderRadius: '12px',
                          marginBottom: '1.25rem',
                          fontSize: '0.78rem'
                        }}
                      >
                        <div>
                          <span style={{ color: '#9CA3AF', display: 'block', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.06em' }}>
                            Best Season
                          </span>
                          <span style={{ color: '#1F2937', fontWeight: 600 }}>{dest.bestSeason}</span>
                        </div>
                        <div>
                          <span style={{ color: '#9CA3AF', display: 'block', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.06em' }}>
                            Altitude
                          </span>
                          <span style={{ color: '#1F2937', fontWeight: 600 }}>{dest.elevation || 'Sea Level'}</span>
                        </div>
                      </div>

                      {/* Action Link */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          color: '#B48235',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                          paddingTop: '1rem'
                        }}
                      >
                        <span>Explore Sanctuary</span>
                        <ArrowRight size={16} className="card-arrow-hover" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Plan Journey Banner */}
      <section
        style={{
          backgroundColor: '#0D0F13',
          color: '#FFFFFF',
          padding: '6rem 2rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div className="section-wrapper" style={{ textAlign: 'center', maxWidth: '780px', position: 'relative', zIndex: 2 }}>
          <Sparkles size={28} color="#D4A359" className="reveal-pop" style={{ margin: '0 auto 1.25rem' }} />
          <p className="reveal-fade-up stagger-1" style={{ color: '#D4A359', fontSize: '0.82rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.75rem' }}>
            BESPOKE ITINERARIES
          </p>
          <h2 className="font-display reveal-fade-up stagger-2" style={{ fontSize: 'clamp(2.4rem, 4vw, 3.8rem)', letterSpacing: '0.04em', lineHeight: 1.1, marginBottom: '1.25rem' }}>
            CAN’T DECIDE ON A SINGLE SANCTUARY?
          </h2>
          <p className="reveal-fade-up stagger-3" style={{ color: 'rgba(255, 255, 255, 0.72)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Most guests combine misty Munnar hills, silent Alleppey waterways, and sacred Malabar shores into one seamless private journey.
            Tell our concierge team your dreams and let us compose your custom Kerala route.
          </p>
          <div className="reveal-scale-up stagger-4" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/plan" className="btn-pill btn-gold anim-hover-pill" style={{ padding: '0.9rem 2.25rem', fontSize: '0.9rem' }}>
              Plan a Custom Journey
            </Link>
            <button
              onClick={() => setEnquiryOpen(true)}
              className="btn-pill btn-white anim-hover-pill"
              style={{ padding: '0.9rem 2.25rem', fontSize: '0.9rem' }}
            >
              Consult a Travel Designer
            </button>
          </div>
        </div>
      </section>

      <Footer onShowToast={(msg) => setToastMessage(msg)} onOpenEnquiry={() => setEnquiryOpen(true)} />

      <EnquiryModal
        isOpen={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        initialData={{ destination: 'Multiple Kerala Destinations' }}
        onShowToast={(msg) => setToastMessage(msg)}
      />

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}
