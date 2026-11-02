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

  // Cursor follow & Spotlight refs & states
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isCardHovered, setIsCardHovered] = useState<boolean>(false);
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);

  const mouseRef = useRef<{ x: number; y: number }>({ x: 300, y: 300 });
  const posRef = useRef<{ x: number; y: number }>({ x: 300, y: 300 });
  const cursorDotRef = useRef<HTMLDivElement | null>(null);
  const cursorRingRef = useRef<HTMLDivElement | null>(null);

  // Fluid physics-based cursor interpolation via direct DOM updates
  useEffect(() => {
    let animId: number;
    const loop = () => {
      // Lerp ring position
      posRef.current.x += (mouseRef.current.x - posRef.current.x) * 0.16;
      posRef.current.y += (mouseRef.current.y - posRef.current.y) * 0.16;

      if (cursorRingRef.current) {
        cursorRingRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate3d(${mouseRef.current.x}px, ${mouseRef.current.y}px, 0) translate(-50%, -50%)`;
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const updatePointer = (clientX: number, clientY: number) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    mouseRef.current = { x, y };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    updatePointer(e.clientX, e.clientY);
    if (!isHovered) setIsHovered(true);
  };

  const handlePointerEnter = (e: React.PointerEvent<HTMLElement>) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouseRef.current = { x, y };
    posRef.current = { x, y };
    setIsHovered(true);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    setIsCardHovered(false);
    setIsMouseDown(false);
  };

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
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={() => setIsMouseDown(true)}
      onPointerUp={() => setIsMouseDown(false)}
      style={{
        backgroundColor: '#EAEFF3',
        backgroundImage: 'radial-gradient(ellipse 95% 75% at 50% 42%, #F5F7FA 0%, #E9EDF2 55%, #DFE4EA 100%)',
        padding: '6.5rem 0 7.5rem',
        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
        position: 'relative'
      }}
    >

      {/* Interactive Cursor Follower - Smooth Outer Ring / Card Badge */}
      <div
        ref={cursorRingRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 40,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease, width 0.35s cubic-bezier(0.16, 1, 0.3, 1), height 0.35s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease',
          width: isCardHovered ? '88px' : (isMouseDown ? '36px' : '46px'),
          height: isCardHovered ? '88px' : (isMouseDown ? '36px' : '46px'),
          borderRadius: '50%',
          backgroundColor: isCardHovered ? 'rgba(18, 19, 22, 0.94)' : 'rgba(212, 163, 89, 0.18)',
          border: isCardHovered ? '2px solid #D4AF37' : '2px solid rgba(180, 130, 53, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: isCardHovered
            ? '0 14px 35px rgba(0, 0, 0, 0.4), 0 0 25px rgba(212, 163, 89, 0.5)'
            : '0 4px 18px rgba(180, 130, 53, 0.35), 0 0 10px rgba(212, 163, 89, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF'
        }}
      >
        {isCardHovered && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              animation: 'scaleInSoft 0.22s var(--ease-luxury)'
            }}
          >
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#FFFFFF',
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
              }}
            >
              EXPLORE
            </span>
            <ArrowUpRight size={15} color="#D4AF37" />
          </div>
        )}
      </div>

      {/* Interactive Cursor Follower - Instant Inner Pointer Dot */}
      <div
        ref={cursorDotRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 41,
          opacity: isHovered && !isCardHovered ? 1 : 0,
          transition: 'opacity 0.2s ease',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#B48235',
          boxShadow: '0 0 10px #D4AF37, 0 0 4px #FFFFFF'
        }}
      />

      <div className="section-wrapper" style={{ position: 'relative', zIndex: 2 }}>

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
                  fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  fontSize: 'clamp(0.82rem, 0.95vw, 0.88rem)',
                  letterSpacing: '0.2em',
                  color: '#9E6F29',
                  lineHeight: 1
                }}
              >
                DISCOVER KERALA
              </span>
            </div>

            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(2.35rem, 3.75vw, 3.5rem)',
                color: '#121316',
                lineHeight: 1.02,
                letterSpacing: '0.035em',
                textTransform: 'uppercase',
                margin: 0
              }}
            >
              Where Every Landscape Tells a Story
            </h2>
            <p
              style={{
                fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
                fontSize: 'clamp(0.9rem, 1.05vw, 1.05rem)',
                lineHeight: 1.5,
                color: '#4B5563',
                maxWidth: '640px',
                margin: '0.75rem 0 0',
                fontWeight: 400
              }}
            >
              Handpicked sanctuaries across God’s Own Country—from private backwater lagoons to highland tea estates, crafted for seamless luxury exploration.
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
        <div style={{ position: 'relative', width: '100%' }}>
          {/* Arrow Slider: Left Edge, Vertical Center */}
          <button
            type="button"
            onClick={() => scrollBy(-360)}
            disabled={!canScrollLeft}
            aria-label="Previous destination"
            className="bento-slider-arrow bento-slider-arrow-prev"
            style={{
              position: 'absolute',
              left: '-22px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 25,
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: canScrollLeft ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
              color: canScrollLeft ? '#121316' : '#C0BCB5',
              border: '1px solid rgba(0, 0, 0, 0.10)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: canScrollLeft ? 'pointer' : 'default',
              transition: 'all 0.25s ease'
            }}
          >
            <ChevronLeft size={20} />
          </button>

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
                borderRadius: '8px',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                scrollSnapAlign: 'start',
                backgroundColor: '#121316',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
                transition: 'box-shadow 0.4s var(--ease-luxury)',
                isolation: 'isolate'
              }}
              onMouseEnter={(e) => {
                setIsCardHovered(true);
                e.currentTarget.style.boxShadow = '0 20px 48px rgba(0, 0, 0, 0.24)';
                const img = e.currentTarget.querySelector('img');
                if (img) img.style.transform = 'scale(1.07)';
              }}
              onMouseLeave={(e) => {
                setIsCardHovered(false);
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
                  transition: 'transform 0.75s cubic-bezier(0.16, 1, 0.3, 1)',
                  pointerEvents: 'none',
                  willChange: 'transform',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
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
                  alignItems: 'center',
                  textAlign: 'center',
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

          {/* Arrow Slider: Right Edge, Vertical Center */}
          <button
            type="button"
            onClick={() => scrollBy(360)}
            disabled={!canScrollRight}
            aria-label="Next destination"
            className="bento-slider-arrow bento-slider-arrow-next"
            style={{
              position: 'absolute',
              right: '-22px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 25,
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: canScrollRight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
              color: canScrollRight ? '#121316' : '#C0BCB5',
              border: '1px solid rgba(0, 0, 0, 0.10)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: canScrollRight ? 'pointer' : 'default',
              transition: 'all 0.25s ease'
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

      </div>

      <style>{`
        @keyframes scaleInSoft {
          from { opacity: 0; transform: scale(0.65); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </section>
  );
}
