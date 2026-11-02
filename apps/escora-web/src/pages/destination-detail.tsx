import React, { useState, useEffect } from 'react';
import { Link, useRoute } from 'wouter';
import {
  MapPin,
  Calendar,
  Compass,
  ArrowRight,
  Plane,
  Train,
  Check,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Share2,
  Clock,
  ShieldCheck,
  Hotel
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EnquiryModal from '../components/EnquiryModal';
import Toast from '../components/Toast';
import HeroGradientBackground from '../components/HeroGradientBackground';
import { getDestinationBySlug, KERALA_DESTINATIONS, type DestinationDetail } from '../data/destinationsData';
import { usePageScrollReveal } from '../hooks/useScrollAnimation';
import { useListDestinations } from '@workspace/api-client-react';

export interface DestinationDetailPageProps {
  slug?: string;
}

export default function DestinationDetailPage({ slug: propSlug }: DestinationDetailPageProps) {
  usePageScrollReveal();

  const [, params] = useRoute('/destinations/:slug');
  const slug = propSlug || params?.slug || '';

  const { data: remoteDestinations } = useListDestinations();

  const destination = React.useMemo(() => {
    if (remoteDestinations && remoteDestinations.length > 0) {
      const cmsMatch = remoteDestinations.find(
        (d) => d.slug.toLowerCase() === slug.toLowerCase()
      );
      if (cmsMatch) {
        const existing = getDestinationBySlug(slug);
        const parsedHighlights = (() => {
          if (!cmsMatch.highlights) return existing?.highlights || [];
          try {
            const arr = JSON.parse(cmsMatch.highlights);
            return Array.isArray(arr) ? arr : [cmsMatch.highlights];
          } catch {
            return cmsMatch.highlights.split('\n').filter(Boolean);
          }
        })();

        const coordsStr =
          typeof cmsMatch.latitude === 'number' && typeof cmsMatch.longitude === 'number'
            ? `${cmsMatch.latitude.toFixed(4)}°N ${cmsMatch.longitude.toFixed(4)}°E`
            : existing?.coordinates || '10.0889°N 77.0595°E';

        return {
          slug: cmsMatch.slug,
          name: cmsMatch.name,
          region: cmsMatch.region,
          type: (cmsMatch.type as any) || existing?.type || 'Highlands',
          shortDesc: cmsMatch.shortDesc || existing?.shortDesc || cmsMatch.description || '',
          description: cmsMatch.description || existing?.description || cmsMatch.shortDesc || '',
          coordinates: coordsStr,
          elevation: cmsMatch.elevation || existing?.elevation,
          bestSeason: cmsMatch.bestSeason || existing?.bestSeason || 'Year-round',
          nightsMin: typeof cmsMatch.nightsMin === 'number' ? cmsMatch.nightsMin : (existing?.nightsMin ?? 2),
          nightsMax: typeof cmsMatch.nightsMax === 'number' ? cmsMatch.nightsMax : (existing?.nightsMax ?? 4),
          imageUrl: cmsMatch.imageUrl || existing?.imageUrl || '/images/dest_3_munnar.jpg',
          gallery: existing?.gallery || (cmsMatch.imageUrl ? [cmsMatch.imageUrl] : ['/images/dest_3_munnar.jpg']),
          highlights: parsedHighlights.length > 0 ? parsedHighlights : (existing?.highlights || []),
          howToReach:
            cmsMatch.howToReach ||
            existing?.howToReach ||
            'Accessible via scenic road transfers and nearby Kerala rail/airport hubs.',
          sampleItinerary: existing?.sampleItinerary,
          curatedStays: existing?.curatedStays,
        };
      }
    }
    return getDestinationBySlug(slug);
  }, [remoteDestinations, slug]);

  const [enquiryOpen, setEnquiryOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number>(0);

  // Scroll to top when slug changes
  useEffect(() => {
    const lenis = (window as any).lenis;
    if (lenis && typeof lenis.scrollTo === 'function') {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
    setActiveGalleryIndex(0);
  }, [slug]);

  if (!destination) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F8F6F1', display: 'flex', flexDirection: 'column' }}>
        <Navbar onOpenEnquiry={() => setEnquiryOpen(true)} />
        <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 2rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '520px' }}>
            <Compass size={48} color="#B48235" style={{ margin: '0 auto 1.5rem', opacity: 0.8 }} />
            <h1 className="font-display" style={{ fontSize: '2.5rem', color: '#121316', marginBottom: '1rem' }}>
              SANCTUARY NOT FOUND
            </h1>
            <p style={{ color: '#6B7280', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              We could not find the Kerala destination you were looking for. Explore our full collection of curated sanctuaries.
            </p>
            <Link href="/destinations" className="btn-pill btn-gold">
              View All Destinations
            </Link>
          </div>
        </div>
        <Footer onShowToast={(msg) => setToastMessage(msg)} />
      </div>
    );
  }

  const otherDestinations = KERALA_DESTINATIONS.filter((d) => d.slug !== destination.slug).slice(0, 3);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setToastMessage('Destination link copied to clipboard!');
    }
  };

  return (
    <div className="anim-page-fade-in" style={{ minHeight: '100vh', backgroundColor: '#F8F6F1', color: '#121316', display: 'flex', flexDirection: 'column' }}>
      <Navbar onOpenEnquiry={() => setEnquiryOpen(true)} />

      {/* Hero Header */}
      <section
        style={{
          position: 'relative',
          minHeight: '72vh',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '10rem 2rem 5rem',
          backgroundColor: '#0D0F13',
          color: '#FFFFFF',
          overflow: 'hidden'
        }}
      >
        {/* Background Image with Dark Vignette */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <img
            src={destination.gallery[activeGalleryIndex] || destination.imageUrl}
            alt={`${destination.name}, Kerala`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              filter: 'brightness(0.72)',
              transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(13, 15, 19, 0.95) 0%, rgba(13, 15, 19, 0.45) 50%, rgba(13, 15, 19, 0.75) 100%)'
            }}
          />
          <HeroGradientBackground hasImage opacity={0.65} />
        </div>

        <div className="section-wrapper" style={{ position: 'relative', zIndex: 3, width: '100%' }}>
          {/* Breadcrumbs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.82rem',
              color: 'rgba(255, 255, 255, 0.65)',
              marginBottom: '1.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}
          >
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
              Home
            </Link>
            <ChevronRight size={13} color="#D4A359" />
            <Link href="/destinations" style={{ color: 'inherit', textDecoration: 'none' }}>
              Destinations
            </Link>
            <ChevronRight size={13} color="#D4A359" />
            <span style={{ color: '#D4A359', fontWeight: 600 }}>{destination.name}</span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: '2rem'
            }}
          >
            <div style={{ maxWidth: '820px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <span
                  className="anim-hero-badge"
                  style={{
                    backgroundColor: 'rgba(180, 130, 53, 0.95)',
                    color: '#FFFFFF',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    padding: '0.35rem 1rem',
                    borderRadius: '9999px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
                  }}
                >
                  {destination.type}
                </span>

                <span
                  className="anim-hero-badge"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(8px)',
                    color: '#D4A359',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    padding: '0.35rem 1rem',
                    borderRadius: '9999px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
                  }}
                >
                  <MapPin size={12} color="#D4A359" /> {destination.coordinates}
                </span>
              </div>

              <h1
                className="font-display anim-hero-title"
                style={{
                  fontSize: 'clamp(3rem, 7vw, 5.5rem)',
                  letterSpacing: '0.04em',
                  lineHeight: 1.02,
                  marginBottom: '1rem',
                  color: '#FFFFFF'
                }}
              >
                {destination.name.toUpperCase()}
              </h1>

              <p
                className="anim-hero-desc"
                style={{
                  fontSize: 'clamp(1.05rem, 1.35vw, 1.25rem)',
                  color: 'rgba(255, 255, 255, 0.82)',
                  lineHeight: 1.6,
                  maxWidth: '700px'
                }}
              >
                {destination.shortDesc}
              </p>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
              <Link
                href={`/plan?destination=${encodeURIComponent(destination.name)}`}
                className="btn-pill btn-gold anim-hover-pill"
                style={{ padding: '0.9rem 2.2rem', fontSize: '0.92rem' }}
              >
                Plan a Journey to {destination.name}
              </Link>
              <button
                onClick={handleShare}
                className="btn-pill anim-hover-pill"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '0.9rem 1.4rem'
                }}
                title="Share this destination"
              >
                <Share2 size={16} /> Share
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Fast Facts Bar */}
      <section
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          padding: '1.75rem 0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div className="section-wrapper">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.5rem',
              alignItems: 'center'
            }}
          >
            <div className="luxury-stat-card reveal-card stagger-1" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem', borderRadius: '16px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#F8F6F1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#B48235',
                  flexShrink: 0
                }}
              >
                <Calendar size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', display: 'block' }}>
                  Best Season
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#121316' }}>{destination.bestSeason}</span>
              </div>
            </div>

            <div className="luxury-stat-card reveal-card stagger-2" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem', borderRadius: '16px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#F8F6F1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#B48235',
                  flexShrink: 0
                }}
              >
                <Clock size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', display: 'block' }}>
                  Recommended Duration
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#121316' }}>
                  {destination.nightsMin} to {destination.nightsMax} Nights
                </span>
              </div>
            </div>

            <div className="luxury-stat-card reveal-card stagger-3" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem', borderRadius: '16px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#F8F6F1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#B48235',
                  flexShrink: 0
                }}
              >
                <Compass size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', display: 'block' }}>
                  Altitude / Terrain
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#121316' }}>{destination.elevation || 'Sea Level'}</span>
              </div>
            </div>

            <div className="luxury-stat-card reveal-card stagger-4" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem', borderRadius: '16px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#F8F6F1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#B48235',
                  flexShrink: 0
                }}
              >
                <Plane size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', display: 'block' }}>
                  Transfers
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#121316' }}>Private Chauffeur Escort</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Story & Gallery */}
      <section style={{ padding: '5rem 0' }}>
        <div className="section-wrapper">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '4rem',
              alignItems: 'start'
            }}
          >
            {/* Left: In-depth Story */}
            <div className="reveal-fade-left">
              <p style={{ color: '#B48235', fontSize: '0.8rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                THE ESSENCE
              </p>
              <h2 className="font-display" style={{ fontSize: '2.6rem', color: '#121316', lineHeight: 1.1, marginBottom: '1.75rem' }}>
                DISCOVER {destination.name.toUpperCase()}
              </h2>
              <div style={{ fontSize: '1.05rem', color: '#374151', lineHeight: 1.85, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <p>{destination.description}</p>
                <p>
                  Every Escora itinerary to {destination.name} is composed around private pace, personal chauffeur logistics,
                  and handpicked sanctuaries that preserve the unhurried spirit of authentic Kerala.
                </p>
              </div>

              {/* How to Reach Card */}
              <div
                className="luxury-interactive-card reveal-card stagger-2"
                style={{
                  marginTop: '2.5rem',
                  padding: '1.75rem',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '18px',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#B48235', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                  <Plane size={16} /> How to Reach
                </div>
                <p style={{ fontSize: '0.92rem', color: '#4B5563', lineHeight: 1.6 }}>{destination.howToReach}</p>
              </div>
            </div>

            {/* Right: Gallery & Photography */}
            <div className="reveal-fade-right">
              <div className="luxury-interactive-card" style={{ borderRadius: '24px', overflow: 'hidden', height: '420px', boxShadow: '0 16px 40px rgba(0, 0, 0, 0.12)', marginBottom: '1.25rem' }}>
                <img
                  src={destination.gallery[activeGalleryIndex] || destination.imageUrl}
                  alt={`${destination.name} View`}
                  className="card-zoom-img"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Thumbnails */}
              <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {destination.gallery.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveGalleryIndex(idx)}
                    className="anim-hover-pill"
                    style={{
                      width: '84px',
                      height: '64px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: activeGalleryIndex === idx ? '2px solid #B48235' : '2px solid transparent',
                      padding: 0,
                      cursor: 'pointer',
                      flexShrink: 0,
                      opacity: activeGalleryIndex === idx ? 1 : 0.65,
                      boxShadow: activeGalleryIndex === idx ? '0 0 0 2px rgba(180, 130, 53, 0.4)' : 'none'
                    }}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights & Things to Experience */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '5rem 0', borderTop: '1px solid rgba(0, 0, 0, 0.06)', borderBottom: '1px solid rgba(0, 0, 0, 0.06)' }}>
        <div className="section-wrapper">
          <div className="reveal-fade-up" style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3.5rem' }}>
            <p style={{ color: '#B48235', fontSize: '0.8rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
              UNFORGETTABLE MOMENTS
            </p>
            <h2 className="font-display" style={{ fontSize: '2.6rem', color: '#121316', lineHeight: 1.1 }}>
              {destination.name.toUpperCase()} HIGHLIGHTS
            </h2>
            <p style={{ color: '#6B7280', fontSize: '1rem', marginTop: '0.75rem' }}>
              Handpicked encounters curated exclusively by our Keralite journey designers.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.75rem'
            }}
          >
            {destination.highlights.map((item, idx) => (
              <div
                key={idx}
                className={`luxury-interactive-card reveal-card stagger-${(idx % 4) + 1}`}
                style={{
                  backgroundColor: '#F8F6F1',
                  padding: '1.75rem',
                  borderRadius: '18px',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  display: 'flex',
                  gap: '1.25rem',
                  alignItems: 'flex-start'
                }}
              >
                <div
                  className="anim-check-pop"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#B48235',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(180, 130, 53, 0.3)'
                  }}
                >
                  {idx + 1}
                </div>
                <p style={{ fontSize: '0.96rem', color: '#1F2937', lineHeight: 1.6, fontWeight: 500 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Itinerary Breakdown */}
      {destination.sampleItinerary && (
        <section style={{ padding: '5.5rem 0' }}>
          <div className="section-wrapper">
            <div style={{ maxWidth: '880px', margin: '0 auto' }}>
              <div className="reveal-fade-up" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                <span
                  className="anim-hero-badge"
                  style={{
                    backgroundColor: 'rgba(180, 130, 53, 0.12)',
                    color: '#B48235',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    padding: '0.4rem 1.1rem',
                    borderRadius: '9999px',
                    display: 'inline-block',
                    marginBottom: '0.75rem'
                  }}
                >
                  {destination.sampleItinerary.totalNights} Sample Route
                </span>
                <h2 className="font-display" style={{ fontSize: '2.5rem', color: '#121316', lineHeight: 1.1 }}>
                  {destination.sampleItinerary.title.toUpperCase()}
                </h2>
                <p style={{ color: '#6B7280', fontSize: '0.95rem', marginTop: '0.5rem' }}>
                  A preview of how we weave {destination.name} into a seamless luxury holiday.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', position: 'relative' }}>
                {destination.sampleItinerary.days.map((day) => (
                  <div
                    key={day.day}
                    className={`luxury-interactive-card reveal-card stagger-${(day.day % 4) + 1}`}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '20px',
                      padding: '2rem 2.25rem',
                      border: '1px solid rgba(0, 0, 0, 0.07)',
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.03)',
                      display: 'flex',
                      gap: '1.75rem',
                      alignItems: 'baseline'
                    }}
                  >
                    <div style={{ flexShrink: 0, textAlign: 'center' }}>
                      <span className="font-display" style={{ fontSize: '2rem', color: '#B48235', display: 'block', lineHeight: 1 }}>
                        0{day.day}
                      </span>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#9CA3AF', letterSpacing: '0.1em' }}>
                        DAY
                      </span>
                    </div>
                    <div>
                      <h4 className="font-display" style={{ fontSize: '1.4rem', color: '#121316', marginBottom: '0.4rem', letterSpacing: '0.02em' }}>
                        {day.title}
                      </h4>
                      <p style={{ color: '#4B5563', fontSize: '0.95rem', lineHeight: 1.65 }}>{day.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Handpicked Luxury Stays */}
      {destination.curatedStays && destination.curatedStays.length > 0 && (
        <section style={{ backgroundColor: '#0D0F13', color: '#FFFFFF', padding: '5.5rem 0' }}>
          <div className="section-wrapper">
            <div className="reveal-fade-up" style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3.5rem' }}>
              <p style={{ color: '#D4A359', fontSize: '0.8rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                ACCOMMODATION EXCELLENCE
              </p>
              <h2 className="font-display" style={{ fontSize: '2.6rem', color: '#FFFFFF', lineHeight: 1.1 }}>
                HANDPICKED LUXURY SANCTUARIES
              </h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.72)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
                We inspect every property in person to guarantee exceptional privacy, heritage integrity, and service.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem'
              }}
            >
              {destination.curatedStays.map((stay, idx) => (
                <div
                  key={idx}
                  className={`luxury-interactive-card reveal-card stagger-${(idx % 3) + 1}`}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#D4A359', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                      <Hotel size={14} /> {stay.type}
                    </div>
                    <h3 className="font-display" style={{ fontSize: '1.6rem', color: '#FFFFFF', marginBottom: '0.75rem' }}>
                      {stay.name}
                    </h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                      {stay.note}
                    </p>
                  </div>
                  <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#D4A359', fontSize: '0.8rem', fontWeight: 600 }}>
                    <ShieldCheck size={14} /> Escora Vetted Sanctuary
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Plan Journey Banner */}
      <section
        style={{
          padding: '6rem 2rem',
          backgroundColor: '#F8F6F1',
          textAlign: 'center'
        }}
      >
        <div className="section-wrapper" style={{ maxWidth: '780px' }}>
          <Sparkles size={28} color="#B48235" className="reveal-pop" style={{ margin: '0 auto 1.25rem' }} />
          <h2 className="font-display reveal-fade-up stagger-1" style={{ fontSize: 'clamp(2.4rem, 4vw, 3.8rem)', color: '#121316', lineHeight: 1.1, marginBottom: '1.25rem' }}>
            READY TO COMPOSE YOUR {destination.name.toUpperCase()} JOURNEY?
          </h2>
          <p className="reveal-fade-up stagger-2" style={{ color: '#4B5563', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Whether you desire a serene 3-day escape or an expansive multi-destination journey across Kerala,
            our personal concierge team will build your custom itinerary from scratch.
          </p>
          <div className="reveal-scale-up stagger-3" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href={`/plan?destination=${encodeURIComponent(destination.name)}`}
              className="btn-pill btn-gold anim-hover-pill"
              style={{ padding: '0.9rem 2.4rem', fontSize: '0.95rem' }}
            >
              Start Planning This Journey
            </Link>
            <a
              href={`https://wa.me/918157003344?text=${encodeURIComponent(
                `Hello Escora, I would like to consult with a travel designer regarding a private journey to ${destination.name}, Kerala.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pill btn-black anim-hover-pill"
              style={{ padding: '0.9rem 2.4rem', fontSize: '0.95rem' }}
            >
              WhatsApp Concierge
            </a>
          </div>
        </div>
      </section>

      {/* Keep Exploring Other Destinations */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '5rem 0', borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
        <div className="section-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2.5rem' }}>
            <div>
              <p style={{ color: '#B48235', fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700 }}>
                KEEP EXPLORING
              </p>
              <h2 className="font-display" style={{ fontSize: '2.2rem', color: '#121316', marginTop: '0.25rem' }}>
                MORE OF KERALA
              </h2>
            </div>
            <Link href="/destinations" className="anim-hover-pill" style={{ color: '#B48235', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              View All <ArrowRight size={15} />
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem'
            }}
          >
            {otherDestinations.map((other, idx) => (
              <Link
                key={other.slug}
                href={`/destinations/${other.slug}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  className={`luxury-interactive-card reveal-card stagger-${idx + 1}`}
                  style={{
                    borderRadius: '20px',
                    overflow: 'hidden',
                    backgroundColor: '#F8F6F1',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <div style={{ height: '200px', overflow: 'hidden' }}>
                    <img src={other.imageUrl} alt={other.name} className="card-zoom-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '1.25rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#B48235', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {other.type}
                    </span>
                    <h3 className="font-display" style={{ fontSize: '1.5rem', color: '#121316', margin: '0.2rem 0 0.5rem' }}>
                      {other.name}
                    </h3>
                    <p style={{ color: '#6B7280', fontSize: '0.85rem', lineHeight: 1.5 }}>
                      {other.shortDesc.slice(0, 100)}...
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer onShowToast={(msg) => setToastMessage(msg)} onOpenEnquiry={() => setEnquiryOpen(true)} />

      <EnquiryModal
        isOpen={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        initialData={{ destination: destination.name }}
        onShowToast={(msg) => setToastMessage(msg)}
      />

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}
