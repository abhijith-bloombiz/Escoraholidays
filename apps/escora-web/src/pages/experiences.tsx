import React, { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { Compass, Sparkles, Clock, MapPin, ArrowRight, Activity, Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EnquiryModal from '../components/EnquiryModal';
import Toast from '../components/Toast';
import HeroGradientBackground from '../components/HeroGradientBackground';
import { KERALA_EXPERIENCES, type ExperienceItem } from '../data/experiencesData';
import { useListExperiences } from '@workspace/api-client-react';
import { useScrollReveal, usePageScrollReveal } from '../hooks/useScrollAnimation';

const EXPERIENCE_CATEGORIES = [
  'All',
  'Waterways & Houseboats',
  'Tea & Highlands',
  'Wilderness & Wildlife',
  'Heritage & Sacred Arts',
  'Coastal & Adventure',
  'Wellness & Ayurveda'
] as const;

export default function ExperiencesPage() {
  usePageScrollReveal();

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [enquiryOpen, setEnquiryOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const [gridSectionRef, gridVisible] = useScrollReveal<HTMLElement>({ threshold: 0.05, reEnter: true });
  const [ctaSectionRef, ctaVisible] = useScrollReveal<HTMLElement>({ threshold: 0.15, reEnter: true });

  const { data: remoteExperiences } = useListExperiences();

  const allExperiences: ExperienceItem[] = useMemo(() => {
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

  const filteredExperiences = useMemo(() => {
    return allExperiences.filter((exp) => {
      const matchesCat = activeCategory === 'All' || exp.category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.destinations.some((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [allExperiences, activeCategory, searchQuery]);

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
            <Sparkles size={14} color="#D4A359" /> Signature Kerala Activities
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
            CURATED <span style={{ color: '#D4A359' }}>EXPERIENCES</span>
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
            Step far beyond ordinary sightseeing. From private chef houseboat twilight voyages and dawn bamboo river safaris
            to ancient Theyyam trance rituals and high-range planter tastings.
          </p>

          {/* Search Bar */}
          <div className="anim-hero-search" style={{ maxWidth: '560px', margin: '0 auto' }}>
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
                placeholder="Search experiences, activities, or wellness..."
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
            {EXPERIENCE_CATEGORIES.map((cat, idx) => {
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

      {/* Experiences Grid */}
      <section ref={gridSectionRef} style={{ padding: '4.5rem 0 6rem', flexGrow: 1 }}>
        <div className="section-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2.5rem' }}>
            <div>
              <p className="reveal-fade-up" style={{ fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B48235', fontWeight: 700 }}>
                {activeCategory === 'All' ? 'ALL BESPOKE EXPERIENCES' : `${activeCategory.toUpperCase()} COLLECTION`}
              </p>
              <h2 className="font-display reveal-fade-up stagger-1" style={{ fontSize: '2.4rem', letterSpacing: '0.04em', color: '#121316', marginTop: '0.25rem' }}>
                {filteredExperiences.length} {filteredExperiences.length === 1 ? 'Experience' : 'Experiences'} Available
              </h2>
            </div>
            <p className="reveal-fade-up stagger-2" style={{ fontSize: '0.88rem', color: '#6B7280' }}>
              Every activity can be woven into your personalized Kerala itinerary
            </p>
          </div>

          {filteredExperiences.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '6rem 2rem', backgroundColor: '#FFFFFF', borderRadius: '24px', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
              <Sparkles size={40} color="#B48235" style={{ margin: '0 auto 1.5rem', opacity: 0.6 }} />
              <h3 className="font-display" style={{ fontSize: '1.8rem', color: '#121316', marginBottom: '0.5rem' }}>
                No Experiences Found
              </h3>
              <p style={{ color: '#6B7280', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                We couldn’t find matches for "{searchQuery}". Try searching for Ayurveda, Houseboat, or Tea.
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
                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                gap: '2.5rem'
              }}
            >
              {filteredExperiences.map((exp, idx) => (
                <Link
                  key={exp.slug}
                  href={`/experiences/${exp.slug}`}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}
                >
                  <article
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
                    {/* Image Banner */}
                    <div style={{ position: 'relative', width: '100%', height: '270px', overflow: 'hidden' }}>
                      <img
                        src={exp.heroImage}
                        alt={exp.title}
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
                          background: 'linear-gradient(to top, rgba(13, 15, 19, 0.85) 0%, rgba(13, 15, 19, 0.15) 60%, transparent 100%)'
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
                          {exp.category}
                        </span>

                        <span
                          style={{
                            backgroundColor: 'rgba(180, 130, 53, 0.95)',
                            color: '#FFFFFF',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            padding: '0.35rem 0.85rem',
                            borderRadius: '9999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <Clock size={12} /> {exp.duration.split(' ')[0]} {exp.duration.split(' ')[1] || 'Activity'}
                        </span>
                      </div>

                      {/* Bottom Title on Image */}
                      <div style={{ position: 'absolute', bottom: '1rem', left: '1.25rem', right: '1.25rem' }}>
                        <h3 className="font-display" style={{ color: '#FFFFFF', fontSize: '1.75rem', letterSpacing: '0.03em', lineHeight: 1.15 }}>
                          {exp.title}
                        </h3>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <p style={{ fontSize: '0.88rem', color: '#B48235', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
                        {exp.tagline}
                      </p>

                      <p style={{ fontSize: '0.9rem', color: '#4B5563', lineHeight: 1.6, marginBottom: '1.5rem', flexGrow: 1 }}>
                        {exp.story.slice(0, 150)}...
                      </p>

                      {/* Locations Tags */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                        <span style={{ fontSize: '0.72rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '0.2rem' }}>
                          LOCATIONS:
                        </span>
                        {exp.destinations.map((d) => (
                          <span
                            key={d.slug}
                            className="anim-hover-pill"
                            style={{
                              backgroundColor: '#F3EFE8',
                              color: '#1F2937',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              padding: '0.2rem 0.65rem',
                              borderRadius: '6px'
                            }}
                          >
                            {d.name}
                          </span>
                        ))}
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
                        <span>Discover Experience</span>
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

      {/* Plan Custom Experience CTA */}
      <section ref={ctaSectionRef} style={{ backgroundColor: '#0D0F13', color: '#FFFFFF', padding: '6rem 2rem', textAlign: 'center', overflow: 'hidden' }}>
        <div className="section-wrapper" style={{ maxWidth: '780px' }}>
          <Sparkles size={28} color="#D4A359" className="reveal-pop" style={{ margin: '0 auto 1.25rem' }} />
          <h2 className="font-display reveal-fade-up stagger-1" style={{ fontSize: 'clamp(2.4rem, 4vw, 3.8rem)', color: '#FFFFFF', lineHeight: 1.1, marginBottom: '1.25rem' }}>
            HAVE A SPECIFIC EXPERIENCE IN MIND?
          </h2>
          <p className="reveal-fade-up stagger-2" style={{ color: 'rgba(255, 255, 255, 0.72)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Whether it’s a private culinary masterclass with a royal Travancore chef, sunrise hot-air ballooning,
            or an ancient martial arts initiation — we make the impossible effortless.
          </p>
          <div className="reveal-scale-up stagger-3" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/plan" className="btn-pill btn-gold anim-hover-pill" style={{ padding: '0.9rem 2.25rem', fontSize: '0.9rem' }}>
              Design a Bespoke Journey
            </Link>
            <button
              onClick={() => setEnquiryOpen(true)}
              className="btn-pill btn-white anim-hover-pill"
              style={{ padding: '0.9rem 2.25rem', fontSize: '0.9rem' }}
            >
              Inquire with Concierge
            </button>
          </div>
        </div>
      </section>

      <Footer onShowToast={(msg) => setToastMessage(msg)} onOpenEnquiry={() => setEnquiryOpen(true)} />

      <EnquiryModal
        isOpen={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        initialData={{ experience: 'Curated Kerala Activities' }}
        onShowToast={(msg) => setToastMessage(msg)}
      />

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}
