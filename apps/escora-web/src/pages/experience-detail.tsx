import React, { useState, useEffect } from 'react';
import { Link, useRoute } from 'wouter';
import {
  Sparkles,
  Clock,
  Compass,
  MapPin,
  CheckCircle2,
  Calendar,
  Share2,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  Info
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EnquiryModal from '../components/EnquiryModal';
import Toast from '../components/Toast';
import HeroGradientBackground from '../components/HeroGradientBackground';
import { getExperienceBySlug, KERALA_EXPERIENCES, type ExperienceItem } from '../data/experiencesData';
import { useListExperiences } from '@workspace/api-client-react';
import { usePageScrollReveal } from '../hooks/useScrollAnimation';

export interface ExperienceDetailPageProps {
  slug?: string;
}

export default function ExperienceDetailPage({ slug: propSlug }: ExperienceDetailPageProps) {
  usePageScrollReveal();

  const [, params] = useRoute('/experiences/:slug');
  const slug = propSlug || params?.slug || '';

  const { data: remoteExperiences } = useListExperiences();

  const allExperiences: ExperienceItem[] = React.useMemo(() => {
    if (remoteExperiences && remoteExperiences.length > 0) {
      return remoteExperiences.map((exp) => ({
        slug: exp.slug,
        title: exp.title,
        category: exp.category as any,
        tagline: exp.tagline || '',
        duration: exp.duration || 'Self-Paced',
        intensity: (exp.intensity as any) || 'Gentle & Relaxed',
        bestTime: exp.bestTime || 'Year-Round',
        vibe: exp.vibe || 'Curated & Unhurried',
        heroImage: exp.heroImage || '/images/exp_houseboat.jpg',
        gallery: Array.isArray(exp.gallery) && exp.gallery.length > 0 ? exp.gallery : (exp.heroImage ? [exp.heroImage] : ['/images/exp_houseboat.jpg']),
        story: exp.story || '',
        highlights: Array.isArray(exp.highlights) ? exp.highlights : [],
        inclusions: Array.isArray(exp.inclusions) ? exp.inclusions : [],
        destinations: Array.isArray(exp.destinations) ? exp.destinations : [],
        conciergeTip: exp.conciergeTip || '',
      }));
    }
    return KERALA_EXPERIENCES;
  }, [remoteExperiences]);

  const experience: ExperienceItem | undefined = React.useMemo(() => {
    const match = allExperiences.find((e) => e.slug.toLowerCase() === slug.toLowerCase());
    return match || getExperienceBySlug(slug);
  }, [allExperiences, slug]);

  const [enquiryOpen, setEnquiryOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number>(0);

  useEffect(() => {
    const lenis = (window as any).lenis;
    if (lenis && typeof lenis.scrollTo === 'function') {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
    setActiveGalleryIndex(0);
  }, [slug]);

  if (!experience) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F8F6F1', display: 'flex', flexDirection: 'column' }}>
        <Navbar onOpenEnquiry={() => setEnquiryOpen(true)} />
        <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 2rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '520px' }}>
            <Sparkles size={48} color="#B48235" style={{ margin: '0 auto 1.5rem', opacity: 0.8 }} />
            <h1 className="font-display" style={{ fontSize: '2.5rem', color: '#121316', marginBottom: '1rem' }}>
              EXPERIENCE NOT FOUND
            </h1>
            <p style={{ color: '#6B7280', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              We could not locate this activity. Discover our full collection of signature Kerala experiences.
            </p>
            <Link href="/experiences" className="btn-pill btn-gold">
              Explore All Experiences
            </Link>
          </div>
        </div>
        <Footer onShowToast={(msg) => setToastMessage(msg)} />
      </div>
    );
  }

  const otherExperiences = allExperiences.filter((e) => e.slug !== experience.slug).slice(0, 3);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setToastMessage('Experience link copied to clipboard!');
    }
  };

  return (
    <div className="anim-page-fade-in" style={{ minHeight: '100vh', backgroundColor: '#F8F6F1', color: '#121316', display: 'flex', flexDirection: 'column' }}>
      <Navbar onOpenEnquiry={() => setEnquiryOpen(true)} />

      {/* Hero Header */}
      <section
        style={{
          position: 'relative',
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '10rem 2rem 5rem',
          backgroundColor: '#0D0F13',
          color: '#FFFFFF',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <img
            src={experience.gallery[activeGalleryIndex] || experience.heroImage}
            alt={experience.title}
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
              background: 'linear-gradient(to top, rgba(13, 15, 19, 0.95) 0%, rgba(13, 15, 19, 0.4) 50%, rgba(13, 15, 19, 0.75) 100%)'
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
            <Link href="/experiences" style={{ color: 'inherit', textDecoration: 'none' }}>
              Experiences
            </Link>
            <ChevronRight size={13} color="#D4A359" />
            <span style={{ color: '#D4A359', fontWeight: 600 }}>{experience.title}</span>
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
                  {experience.category}
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
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
                  }}
                >
                  {experience.intensity}
                </span>
              </div>

              <h1
                className="font-display anim-hero-title"
                style={{
                  fontSize: 'clamp(2.75rem, 6vw, 4.75rem)',
                  letterSpacing: '0.03em',
                  lineHeight: 1.05,
                  marginBottom: '1rem',
                  color: '#FFFFFF'
                }}
              >
                {experience.title.toUpperCase()}
              </h1>

              <p
                className="anim-hero-desc"
                style={{
                  fontSize: 'clamp(1.05rem, 1.35vw, 1.25rem)',
                  color: 'rgba(255, 255, 255, 0.85)',
                  lineHeight: 1.6,
                  maxWidth: '720px'
                }}
              >
                {experience.tagline}
              </p>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
              <Link
                href={`/plan?experience=${encodeURIComponent(experience.title)}`}
                className="btn-pill btn-gold anim-hover-pill"
                style={{ padding: '0.9rem 2.2rem', fontSize: '0.92rem' }}
              >
                Incorporate in My Journey
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
                title="Share this experience"
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
            <div className="luxury-stat-card reveal-card stagger-1" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1.15rem', borderRadius: '16px', backgroundColor: '#FAF8F5' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#B48235',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}
              >
                <Clock size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', display: 'block' }}>
                  Duration
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#121316' }}>{experience.duration}</span>
              </div>
            </div>

            <div className="luxury-stat-card reveal-card stagger-2" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1.15rem', borderRadius: '16px', backgroundColor: '#FAF8F5' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#B48235',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}
              >
                <Calendar size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', display: 'block' }}>
                  Optimal Season
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#121316' }}>{experience.bestTime}</span>
              </div>
            </div>

            <div className="luxury-stat-card reveal-card stagger-3" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1.15rem', borderRadius: '16px', backgroundColor: '#FAF8F5' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#B48235',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}
              >
                <Sparkles size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', display: 'block' }}>
                  Atmosphere
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#121316' }}>{experience.vibe}</span>
              </div>
            </div>

            <div className="luxury-stat-card reveal-card stagger-4" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1.15rem', borderRadius: '16px', backgroundColor: '#FAF8F5' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#B48235',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}
              >
                <MapPin size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', display: 'block' }}>
                  Kerala Regions
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#121316' }}>
                  {experience.destinations.map((d) => d.name).join(', ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Story & Photography */}
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
            {/* Story */}
            <div className="reveal-fade-left">
              <p style={{ color: '#B48235', fontSize: '0.8rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                EXPERIENTIAL NARRATIVE
              </p>
              <h2 className="font-display reveal-fade-up stagger-1" style={{ fontSize: '2.6rem', color: '#121316', lineHeight: 1.1, marginBottom: '1.75rem' }}>
                THE UNFORGETTABLE JOURNEY
              </h2>
              <p className="reveal-fade-up stagger-2" style={{ fontSize: '1.05rem', color: '#374151', lineHeight: 1.85, marginBottom: '2rem' }}>
                {experience.story}
              </p>

              {/* Concierge Tip Box */}
              <div
                className="luxury-interactive-card reveal-card stagger-2"
                style={{
                  padding: '1.75rem',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '18px',
                  border: '1px solid rgba(180, 130, 53, 0.25)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#B48235', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                  <Info size={16} /> Concierge Insider Note
                </div>
                <p style={{ fontSize: '0.92rem', color: '#4B5563', lineHeight: 1.65 }}>
                  {experience.conciergeTip}
                </p>
              </div>
            </div>

            {/* Gallery */}
            <div className="reveal-fade-right">
              <div className="luxury-interactive-card" style={{ borderRadius: '24px', overflow: 'hidden', height: '420px', boxShadow: '0 16px 40px rgba(0, 0, 0, 0.12)', marginBottom: '1.25rem' }}>
                <img
                  className="card-zoom-img"
                  src={experience.gallery[activeGalleryIndex] || experience.heroImage}
                  alt={experience.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.5s ease' }}
                />
              </div>

              {/* Thumbnails */}
              <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {experience.gallery.map((img, idx) => (
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
                      transition: 'all 0.25s ease'
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

      {/* Highlights & Inclusions Grid */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '5.5rem 0', borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
        <div className="section-wrapper">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '4rem'
            }}
          >
            {/* Highlights */}
            <div className="reveal-fade-left">
              <p style={{ color: '#B48235', fontSize: '0.8rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                WHAT TO EXPECT
              </p>
              <h3 className="font-display reveal-fade-up stagger-1" style={{ fontSize: '2.4rem', color: '#121316', marginBottom: '1.75rem' }}>
                EXPERIENCE HIGHLIGHTS
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {experience.highlights.map((item, idx) => (
                  <div key={idx} className={`reveal-card stagger-${(idx % 4) + 1}`} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div
                      className="anim-check-pop"
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(180, 130, 53, 0.15)',
                        color: '#B48235',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px'
                      }}
                    >
                      <Sparkles size={13} />
                    </div>
                    <p style={{ fontSize: '0.96rem', color: '#374151', lineHeight: 1.6 }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Inclusions */}
            <div className="reveal-fade-right">
              <p style={{ color: '#B48235', fontSize: '0.8rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                THE ESCORA STANDARD
              </p>
              <h3 className="font-display reveal-fade-up stagger-1" style={{ fontSize: '2.4rem', color: '#121316', marginBottom: '1.75rem' }}>
                EVERY DETAIL INCLUDED
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {experience.inclusions.map((item, idx) => (
                  <div key={idx} className={`reveal-card stagger-${(idx % 4) + 1}`} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div
                      className="anim-check-pop"
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: '#121316',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px'
                      }}
                    >
                      <CheckCircle2 size={14} color="#D4A359" />
                    </div>
                    <p style={{ fontSize: '0.96rem', color: '#374151', lineHeight: 1.6, fontWeight: 500 }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Where this Happens (Linked Destinations) */}
      <section style={{ padding: '5rem 0', backgroundColor: '#0D0F13', color: '#FFFFFF' }}>
        <div className="section-wrapper">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3rem' }}>
            <p className="reveal-fade-up" style={{ color: '#D4A359', fontSize: '0.8rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
              REGIONAL GEOGRAPHY
            </p>
            <h2 className="font-display reveal-fade-up stagger-1" style={{ fontSize: '2.5rem', color: '#FFFFFF' }}>
              DESTINATIONS FOR THIS EXPERIENCE
            </h2>
            <p className="reveal-fade-up stagger-2" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
              Discover the Kerala sanctuaries where this signature activity can be experienced at its highest standard.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            {experience.destinations.map((dest, idx) => (
              <Link
                key={dest.slug}
                href={`/destinations/${dest.slug}`}
                className={`luxury-interactive-card card-arrow-hover reveal-card stagger-${(idx % 4) + 1}`}
                style={{
                  textDecoration: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '1.25rem 2rem',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  color: '#FFFFFF',
                  transition: 'all 0.25s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(180, 130, 53, 0.2)';
                  e.currentTarget.style.borderColor = '#D4A359';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                }}
              >
                <MapPin size={20} color="#D4A359" />
                <span className="font-display" style={{ fontSize: '1.5rem', letterSpacing: '0.04em' }}>
                  {dest.name}
                </span>
                <ArrowRight size={16} color="#D4A359" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Plan Journey Banner */}
      <section style={{ padding: '6rem 2rem', backgroundColor: '#F8F6F1', textAlign: 'center' }}>
        <div className="section-wrapper" style={{ maxWidth: '780px' }}>
          <Sparkles size={28} color="#B48235" className="reveal-pop" style={{ margin: '0 auto 1.25rem' }} />
          <h2 className="font-display reveal-fade-up stagger-1" style={{ fontSize: 'clamp(2.4rem, 4vw, 3.8rem)', color: '#121316', lineHeight: 1.1, marginBottom: '1.25rem' }}>
            EXPERIENCE THIS IN YOUR KERALA HOLIDAY
          </h2>
          <p className="reveal-fade-up stagger-2" style={{ color: '#4B5563', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Tell our personal journey designers that you want {experience.title} included in your itinerary.
            We will arrange all private permits, personal specialists, and transfers.
          </p>
          <div className="reveal-scale-up stagger-3" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href={`/plan?experience=${encodeURIComponent(experience.title)}`}
              className="btn-pill btn-gold anim-hover-pill"
              style={{ padding: '0.9rem 2.4rem', fontSize: '0.95rem' }}
            >
              Incorporate in My Itinerary
            </Link>
            <a
              href={`https://wa.me/918157003344?text=${encodeURIComponent(
                `Hello Escora, I am interested in experiencing "${experience.title}" on my upcoming Kerala journey.`
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

      {/* Keep Exploring Other Experiences */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '5rem 0', borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
        <div className="section-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2.5rem' }}>
            <div>
              <p className="reveal-fade-up" style={{ color: '#B48235', fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700 }}>
                MORE SIGNATURE ACTIVITIES
              </p>
              <h2 className="font-display reveal-fade-up stagger-1" style={{ fontSize: '2.2rem', color: '#121316', marginTop: '0.25rem' }}>
                CURATED EXPERIENCES
              </h2>
            </div>
            <Link href="/experiences" className="anim-hover-pill" style={{ color: '#B48235', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
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
            {otherExperiences.map((other, idx) => (
              <Link
                key={other.slug}
                href={`/experiences/${other.slug}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  className={`luxury-interactive-card card-arrow-hover reveal-card stagger-${(idx % 4) + 1}`}
                  style={{
                    borderRadius: '20px',
                    overflow: 'hidden',
                    backgroundColor: '#F8F6F1',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <div style={{ height: '200px', overflow: 'hidden' }}>
                    <img className="card-zoom-img" src={other.heroImage} alt={other.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '1.25rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#B48235', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {other.category}
                    </span>
                    <h3 className="font-display" style={{ fontSize: '1.45rem', color: '#121316', margin: '0.2rem 0 0.5rem' }}>
                      {other.title}
                    </h3>
                    <p style={{ color: '#6B7280', fontSize: '0.85rem', lineHeight: 1.5 }}>
                      {other.tagline}
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
        initialData={{ experience: experience.title }}
        onShowToast={(msg) => setToastMessage(msg)}
      />

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}
