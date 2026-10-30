import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { DESTINATIONS, type Destination } from '../data/escoraData';
import { useScrollReveal } from '../hooks/useScrollAnimation';

export interface DestinationDiscoveryProps {
  onOpenEnquiry?: (data?: Record<string, any>) => void;
  onSelectDestination?: (dest: Destination) => void;
}

export default function DestinationDiscovery({ onOpenEnquiry, onSelectDestination }: DestinationDiscoveryProps) {
  const [sectionRef, isVisible] = useScrollReveal<HTMLElement>({ threshold: 0.1, reEnter: true });
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 20);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 20);

    // Calculate approximate active card index
    const cardWidth = 320;
    const idx = Math.min(DESTINATIONS.length - 1, Math.max(0, Math.round(scrollLeft / cardWidth)));
    setActiveIndex(idx);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();
    return () => el.removeEventListener('scroll', checkScroll);
  }, []);

  const scrollBy = (offset: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleCardClick = (dest: Destination) => {
    if (onSelectDestination) onSelectDestination(dest);
    if (onOpenEnquiry) onOpenEnquiry({ destination: dest.name });
  };

  return (
    <section
      id="destinations"
      ref={sectionRef}
      style={{
        backgroundColor: '#FFFFFF',
        padding: '6.5rem 0 7.5rem',
        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div className="section-wrapper">

        {/* Armenia Travel Style Header: Left Title + Right Navigation Arrows */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '2rem',
            marginBottom: '3.5rem',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.8s var(--ease-luxury), transform 0.8s var(--ease-luxury)'
          }}
        >
          {/* Left Title Block */}
          <div style={{ maxWidth: '640px' }}>
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
                  textTransform: 'uppercase',
                  fontSize: '0.76rem',
                  letterSpacing: '0.2em',
                  color: '#9E6F29',
                  fontWeight: 700
                }}
              >
                TOP DESTINATIONS
              </span>
            </div>

            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
                color: '#121316',
                lineHeight: 1.1,
                letterSpacing: '0.02em',
                marginBottom: '0.85rem'
              }}
            >
              Don't Miss Kerala's Iconic Landscapes
            </h2>

            <p
              style={{
                fontSize: 'clamp(0.95rem, 1.1vw, 1.05rem)',
                color: '#5C5850',
                lineHeight: 1.6,
                margin: 0
              }}
            >
              From mist-shrouded tea summits and ancient rainforests to silent backwater lagoons and golden cliff shores.
            </p>
          </div>

          {/* Right Navigation Arrows (Armenia Travel Rounded Square Controls) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            <div
              style={{
                fontSize: '0.85rem',
                color: '#8A857A',
                fontWeight: 600,
                letterSpacing: '0.1em',
                paddingRight: '0.5rem'
              }}
            >
              <span style={{ color: '#121316', fontWeight: 700 }}>0{activeIndex + 1}</span> / 0{DESTINATIONS.length}
            </div>

            <button
              onClick={() => scrollBy(-360)}
              disabled={!canScrollLeft}
              aria-label="Previous destination"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                backgroundColor: canScrollLeft ? '#FFFFFF' : '#F5F5F5',
                color: canScrollLeft ? '#121316' : '#C0BCB5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: canScrollLeft ? 'pointer' : 'default',
                transition: 'all 0.25s ease'
              }}
              onMouseEnter={(e) => {
                if (canScrollLeft) {
                  e.currentTarget.style.backgroundColor = '#121316';
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.borderColor = '#121316';
                }
              }}
              onMouseLeave={(e) => {
                if (canScrollLeft) {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.color = '#121316';
                  e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)';
                }
              }}
            >
              <ChevronLeft size={20} />
            </button>

            <button
              onClick={() => scrollBy(360)}
              disabled={!canScrollRight}
              aria-label="Next destination"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                backgroundColor: canScrollRight ? '#FFFFFF' : '#F5F5F5',
                color: canScrollRight ? '#121316' : '#C0BCB5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: canScrollRight ? 'pointer' : 'default',
                transition: 'all 0.25s ease'
              }}
              onMouseEnter={(e) => {
                if (canScrollRight) {
                  e.currentTarget.style.backgroundColor = '#121316';
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.borderColor = '#121316';
                }
              }}
              onMouseLeave={(e) => {
                if (canScrollRight) {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.color = '#121316';
                  e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)';
                }
              }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Armenia Travel Style Horizontal Track with Vertical 3:4 Cards */}
        <div
          ref={scrollContainerRef}
          style={{
            display: 'flex',
            gap: '1.5rem',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            paddingBottom: '1.5rem',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
          className="no-scrollbar"
        >
          {DESTINATIONS.map((dest) => (
            <div
              key={dest.id}
              onClick={() => handleCardClick(dest)}
              style={{
                flex: '0 0 clamp(280px, 26vw, 340px)',
                height: '480px',
                borderRadius: '20px',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                scrollSnapAlign: 'start',
                backgroundColor: '#121316',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
                transition: 'transform 0.4s var(--ease-luxury), box-shadow 0.4s var(--ease-luxury)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.14)';
                const img = e.currentTarget.querySelector('img');
                if (img) img.style.transform = 'scale(1.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.08)';
                const img = e.currentTarget.querySelector('img');
                if (img) img.style.transform = 'scale(1)';
              }}
            >
              {/* Photo Background */}
              <img
                src={dest.image}
                alt={dest.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  transition: 'transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />

              {/* Gradient Scrim Vignette */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.85) 85%, rgba(0,0,0,0.95) 100%)',
                  pointerEvents: 'none'
                }}
              />

              {/* Floating Top Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  left: '1.25rem',
                  right: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span
                  style={{
                    padding: '0.35rem 0.8rem',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(0, 0, 0, 0.45)',
                    backdropFilter: 'blur(8px)',
                    color: '#FFFFFF',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  {dest.terrain.split('•')[0]}
                </span>

                <span
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(212, 175, 55, 0.9)',
                    color: '#0E1412',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em'
                  }}
                >
                  ★ {dest.rating}
                </span>
              </div>

              {/* Anchored Bottom Text Content */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '2rem 1.6rem 1.8rem',
                  color: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem'
                }}
              >
                <span
                  style={{
                    fontSize: '0.74rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: '#D4AF37',
                    fontWeight: 700
                  }}
                >
                  {dest.country}
                </span>

                <h3
                  className="font-display"
                  style={{
                    fontSize: '1.55rem',
                    lineHeight: 1.15,
                    color: '#FFFFFF',
                    margin: 0
                  }}
                >
                  {dest.name}
                </h3>

                <p
                  style={{
                    fontSize: '0.84rem',
                    color: 'rgba(255, 255, 255, 0.78)',
                    lineHeight: 1.45,
                    margin: '0.3rem 0 0.8rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {dest.desc}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#FFFFFF'
                  }}
                >
                  <span style={{ color: 'rgba(255, 255, 255, 0.75)' }}>{dest.season}</span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      color: '#D4AF37'
                    }}
                  >
                    Explore <ArrowUpRight size={15} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
