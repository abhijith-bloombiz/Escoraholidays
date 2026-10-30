import React, { useState } from 'react';
import { MapPin, ArrowRight, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { TRAVEL_BY_TYPE, type TravelCategoryItem } from '../data/escoraData';
import { useScrollReveal } from '../hooks/useScrollAnimation';

const CATEGORY_TABS = [
  { id: 'all', label: 'All Journeys' },
  { id: 'backwaters', label: 'Backwaters & Lagoons' },
  { id: 'highlands', label: 'Highlands & Tea' },
  { id: 'wellness', label: 'Ayurveda & Healing' },
  { id: 'honeymoon', label: 'Couples & Seclusion' }
];

export interface CuratedJourneysProps {
  onOpenItinerary: (journey: TravelCategoryItem) => void;
  onOpenEnquiry?: (data?: Record<string, any>) => void;
}

export default function CuratedJourneys({ onOpenItinerary, onOpenEnquiry }: CuratedJourneysProps) {
  const [sectionRef, isVisible] = useScrollReveal<HTMLElement>({ threshold: 0.1, reEnter: true });
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredJourneys = activeCategory === 'all'
    ? TRAVEL_BY_TYPE
    : TRAVEL_BY_TYPE.filter((j) => j.category === activeCategory);

  const [activeJourneyId, setActiveJourneyId] = useState<string>(filteredJourneys[0]?.id || 'backwaters');

  // Keep activeJourney synced if category changes
  const currentJourney = filteredJourneys.find(j => j.id === activeJourneyId) || filteredJourneys[0] || TRAVEL_BY_TYPE[0];

  const handleCustomize = (journey: TravelCategoryItem) => {
    if (onOpenEnquiry) {
      onOpenEnquiry({
        destination: journey.dest,
        experience: journey.title,
        duration: journey.days
      });
    }
  };

  return (
    <section
      id="travel-by-type"
      ref={sectionRef}
      style={{
        backgroundColor: '#F8F6F1',
        padding: '6.5rem 0 7.5rem',
        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <span id="curated-journeys" style={{ position: 'absolute', top: '-80px' }} />
      <div className="section-wrapper">

        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: '3rem',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.8s var(--ease-luxury), transform 0.8s var(--ease-luxury)'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem'
            }}
          >
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
                textTransform: 'uppercase',
                fontSize: '0.76rem',
                letterSpacing: '0.2em',
                color: '#9E6F29',
                fontWeight: 700
              }}
            >
              TURNKEY BESPOKE EXPEDITIONS
            </span>
          </div>

          <h2
            className="font-display"
            style={{
              fontSize: 'clamp(2.2rem, 4vw, 3.5rem)',
              color: '#121316',
              lineHeight: 1.1,
              letterSpacing: '0.02em',
              marginBottom: '0.85rem'
            }}
          >
            Signature Bespoke Journeys
          </h2>

          <p
            style={{
              fontSize: 'clamp(0.95rem, 1.1vw, 1.05rem)',
              color: '#5C5850',
              lineHeight: 1.6,
              maxWidth: '640px',
              margin: '0 auto 2rem',
              fontWeight: 400
            }}
          >
            Turnkey multi-day Kerala routes curated with private executive chauffeurs, vetted 5-star sanctuaries, and 24/7 on-ground care.
          </p>

          {/* Trova-Style Minimalist Filter Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '0.6rem',
              padding: '0.4rem',
              backgroundColor: '#ECE8E1',
              borderRadius: '999px',
              maxWidth: '100%'
            }}
          >
            {CATEGORY_TABS.map((tab) => {
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveCategory(tab.id);
                    const matching = tab.id === 'all'
                      ? TRAVEL_BY_TYPE
                      : TRAVEL_BY_TYPE.filter((j) => j.category === tab.id);
                    if (matching.length > 0) setActiveJourneyId(matching[0].id);
                  }}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '999px',
                    border: 'none',
                    backgroundColor: isActive ? '#121316' : 'transparent',
                    color: isActive ? '#FFFFFF' : '#5C5850',
                    fontSize: '0.82rem',
                    fontWeight: isActive ? 600 : 500,
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grand Flagship Itinerary Feature Box (Trova & Flyward Inspired) */}
        {currentJourney && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.06)',
              overflow: 'hidden',
              marginBottom: '3rem',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 0.8s var(--ease-luxury) 0.15s, transform 0.8s var(--ease-luxury) 0.15s'
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(320px, 1.15fr) minmax(340px, 1fr)',
                gap: 'clamp(2rem, 3.5vw, 3.5rem)',
                padding: 'clamp(2rem, 3.5vw, 3rem)'
              }}
              className="flagship-journey-grid"
            >
              {/* Left Column: Visual & Overview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div
                  style={{
                    position: 'relative',
                    borderRadius: '18px',
                    overflow: 'hidden',
                    height: '360px',
                    backgroundColor: '#121316'
                  }}
                >
                  <img
                    src={currentJourney.image}
                    alt={currentJourney.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)',
                      pointerEvents: 'none'
                    }}
                  />
                  {/* Floating Badges */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '1.25rem',
                      left: '1.25rem',
                      display: 'flex',
                      gap: '0.6rem',
                      flexWrap: 'wrap'
                    }}
                  >
                    <span
                      style={{
                        padding: '0.4rem 0.9rem',
                        borderRadius: '999px',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(8px)',
                        color: '#FFFFFF',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    >
                      {currentJourney.days}
                    </span>
                    <span
                      style={{
                        padding: '0.4rem 0.9rem',
                        borderRadius: '999px',
                        backgroundColor: 'rgba(212, 175, 55, 0.9)',
                        color: '#0E1412',
                        fontSize: '0.74rem',
                        fontWeight: 700
                      }}
                    >
                      {currentJourney.pace}
                    </span>
                  </div>

                  {/* Bottom Route Bar */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '1.25rem',
                      left: '1.25rem',
                      right: '1.25rem',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      fontSize: '0.82rem',
                      fontWeight: 600
                    }}
                  >
                    <MapPin size={16} color="#D4AF37" />
                    <span>{currentJourney.route}</span>
                  </div>
                </div>

                <div>
                  <h3
                    className="font-display"
                    style={{
                      fontSize: 'clamp(1.6rem, 2.2vw, 2.1rem)',
                      color: '#121316',
                      lineHeight: 1.15,
                      margin: '0 0 0.75rem'
                    }}
                  >
                    {currentJourney.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.94rem',
                      color: '#5C5850',
                      lineHeight: 1.6,
                      margin: 0
                    }}
                  >
                    {currentJourney.desc}
                  </p>
                </div>

                {/* Call to Actions */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <button
                    onClick={() => onOpenItinerary(currentJourney)}
                    style={{
                      padding: '0.85rem 1.6rem',
                      borderRadius: '999px',
                      backgroundColor: '#121316',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#9E6F29';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#121316';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    View Day-by-Day Itinerary <ArrowUpRight size={16} />
                  </button>

                  <button
                    onClick={() => handleCustomize(currentJourney)}
                    style={{
                      padding: '0.85rem 1.6rem',
                      borderRadius: '999px',
                      backgroundColor: 'transparent',
                      color: '#121316',
                      border: '1px solid rgba(0, 0, 0, 0.2)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#121316';
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.2)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Inquire About This Route
                  </button>
                </div>
              </div>

              {/* Right Column: Day-by-Day Route Milestones Timeline */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  backgroundColor: '#FBF9F5',
                  padding: '2rem',
                  borderRadius: '18px',
                  border: '1px solid rgba(0, 0, 0, 0.05)'
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.74rem',
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      color: '#9E6F29',
                      fontWeight: 700,
                      marginBottom: '1.25rem'
                    }}
                  >
                    DAY-BY-DAY HIGHLIGHTS
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {currentJourney.itinerary?.map((step, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          gap: '1rem',
                          alignItems: 'flex-start'
                        }}
                      >
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(158, 111, 41, 0.12)',
                            color: '#9E6F29',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            flexShrink: 0,
                            marginTop: '0.15rem'
                          }}
                        >
                          0{idx + 1}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#121316' }}>
                            <span style={{ color: '#9E6F29', marginRight: '0.4rem' }}>{step.day}:</span>
                            {step.title}
                          </div>
                          <p style={{ fontSize: '0.84rem', color: '#656056', lineHeight: 1.5, margin: 0 }}>
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inclusions Pill Bar */}
                <div
                  style={{
                    marginTop: '2rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <span style={{ fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8A857A', fontWeight: 700 }}>
                    INCLUDED IN THIS JOURNEY
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {["Private Dedicated Chauffeur", "Handpicked 5-Star Sanctuaries", "Daily Breakfast & Starlit Meals", "24/7 Concierge WhatsApp"].map((inc, i) => (
                      <span
                        key={i}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.74rem',
                          color: '#4A463E',
                          backgroundColor: '#FFFFFF',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '999px',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          fontWeight: 500
                        }}
                      >
                        <CheckCircle2 size={13} color="#9E6F29" /> {inc}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Alternative Journeys Quick Row (Horizontal Selector) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s var(--ease-luxury) 0.3s, transform 0.8s var(--ease-luxury) 0.3s'
          }}
        >
          {filteredJourneys
            .filter(j => j.id !== currentJourney?.id)
            .slice(0, 3)
            .map((journey) => (
              <div
                key={journey.id}
                onClick={() => setActiveJourneyId(journey.id)}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  border: '1px solid rgba(0, 0, 0, 0.07)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.07)';
                  e.currentTarget.style.borderColor = 'rgba(158, 111, 41, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.03)';
                  e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.07)';
                }}
              >
                <img
                  src={journey.image}
                  alt={journey.title}
                  style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '12px',
                    objectFit: 'cover',
                    flexShrink: 0
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9E6F29', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {journey.days}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#8A857A' }}>
                      {journey.dest.split(' ')[0]}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#121316', margin: 0, lineHeight: 1.3 }}>
                    {journey.title}
                  </h4>
                  <span style={{ fontSize: '0.76rem', color: '#9E6F29', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    Select Route <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            ))}
        </div>

      </div>
    </section>
  );
}
