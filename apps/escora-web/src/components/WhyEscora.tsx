import React, { useEffect, useRef } from 'react';
import { useScrollReveal } from '../hooks/useScrollAnimation';
import { Compass, Sparkles, Clock, ShieldCheck, ArrowUpRight, type LucideIcon } from 'lucide-react';

export interface PhilosophyConfig {
  cardHeight: number;
  staggerRatio: number;
  animDistance: number;
  bottomClearance: number;
  leveledPause: number;
}

// =========================================================================
// 🎛️ MANUAL ANIMATION & LAYOUT CONTROLS
// Edit these values to directly customize the cascading effect and scroll:
// =========================================================================
export const PHILOSOPHY_CONFIG: PhilosophyConfig = {
  // 1. Uniform height of each card in pixels
  cardHeight: 290,

  // 2. Vertical offset ratio between consecutive cards (relative to cardHeight):
  //    0.5  = starts at exactly half the height of the previous card
  //    0.35 = moderately pronounced staircase
  //    0.25 = subtle staircase
  staggerRatio: 0.4,

  // 3. Scroll distance in pixels required for cards to level out into a flat row:
  //    Larger (e.g., 700) = slower, smoother leveling animation
  //    Smaller (e.g., 400) = faster, snappier leveling animation
  animDistance: 580,

  // 4. Clearance margin (in px) from bottom of viewport before sticky locking
  bottomClearance: 15,

  // 5. Brief hold distance (in px) once cards level before full-screen overlap begins
  leveledPause: 120,
};

export interface CorePillar {
  icon: LucideIcon;
  title: string;
  desc: string;
  dots: boolean[];
}

const CORE_PILLARS: CorePillar[] = [
  {
    icon: Compass,
    title: "100% Private Departures",
    desc: "Every journey is exclusively chartered for your party. Never a tour group, never a shared vehicle.",
    dots: [false, false, false, true]
  },
  {
    icon: Sparkles,
    title: "Personally Vetted Sanctuaries",
    desc: "From 150-year-old colonial planter bungalows to private backwater pool villas, verified for stillness.",
    dots: [false, false, true, true]
  },
  {
    icon: Clock,
    title: "24/7 On-Ground Concierge",
    desc: "Direct 1-on-1 WhatsApp contact with your personal local curator from airport arrival to departure.",
    dots: [false, true, true, true]
  },
  {
    icon: ShieldCheck,
    title: "Executive Hill Chauffeurs",
    desc: "Whisper-quiet premium fleet steered by seasoned hill-road captains who know every scenic overlook.",
    dots: [true, true, true, true]
  }
];

export interface WhyEscoraProps {
  onOpenEnquiry?: (data?: Record<string, any>) => void;
}

export default function WhyEscora({ onOpenEnquiry }: WhyEscoraProps) {
  const [sectionRef, isVisible] = useScrollReveal<HTMLElement>({
    threshold: 0.01,
    rootMargin: '120px 0px 120px 0px',
    reEnter: false
  });

  const trackRef = useRef<HTMLDivElement | null>(null);
  const stickyWrapperRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const { cardHeight, staggerRatio, animDistance, bottomClearance, leveledPause } = PHILOSOPHY_CONFIG;

  // Scroll Trigger Animation:
  // 1. Natural scroll until Card 4 reaches complete visibility in the screen.
  // 2. The first screen locks sticky in place.
  // 3. During sticky hold, cards 1 to 4 animate to even horizontal alignment.
  // 4. Once leveled, sticky releases and page resumes natural scroll to next section.
  useEffect(() => {
    let rafId: number | null = null;
    let isTicking = false;

    let currentSTEP = Math.round(cardHeight * staggerRatio);
    let currentMaxStagger = currentSTEP * 3;

    let currentStickyTop = 72;

    const computeLayout = () => {
      const trackEl = trackRef.current;
      const stickyEl = stickyWrapperRef.current;
      const headerEl = headerRef.current;
      const gridEl = gridRef.current;

      if (!trackEl || !stickyEl || !gridEl) return;

      const width = window.innerWidth;
      const vh = window.innerHeight;

      // Mobile & Tablet (< 1025px): Natural non-sticky grid layout
      if (width < 1025) {
        trackEl.style.height = 'auto';
        stickyEl.style.position = 'relative';
        stickyEl.style.top = '0px';
        gridEl.style.setProperty('--step-0', '0px');
        gridEl.style.setProperty('--step-1', '0px');
        gridEl.style.setProperty('--step-2', '0px');
        gridEl.style.setProperty('--step-3', '0px');
        gridEl.style.setProperty('--grid-pad-bottom', '0px');
        if (contentRef.current) {
          contentRef.current.style.transform = 'none';
          contentRef.current.style.opacity = '1';
        }
        return;
      }

      // Responsive step calculation from config
      currentSTEP = width >= 1200 
        ? Math.round(cardHeight * staggerRatio) 
        : Math.round(cardHeight * (staggerRatio * 0.92));
      currentMaxStagger = currentSTEP * 3;

      // Desktop: Calculate exact geometry so Card 4 is 100% visible before sticky locks
      const navbar = 72;
      const headerHeight = headerEl ? headerEl.offsetHeight : 135;
      const gridTop = 10 + headerHeight + 16;
      const card4BottomRelative = gridTop + cardHeight + currentMaxStagger;

      // Card 4 must be fully visible (bottom <= vh - bottomClearance) when sticky locks
      const neededForCard4 = (vh - bottomClearance) - card4BottomRelative;
      const idealTop = Math.max(navbar, (vh - (card4BottomRelative + 15)) / 2);
      currentStickyTop = Math.round(Math.min(neededForCard4, idealTop));

      // Apply sticky styles
      stickyEl.style.position = 'sticky';
      stickyEl.style.top = `${currentStickyTop}px`;

      // Full-screen stacking track height:
      // Distance from sticky top to viewport bottom (vh - currentStickyTop) +
      // leveling animation (animDistance) + brief hold (leveledPause) +
      // full viewport height (vh) for "The Art of Healing" to slide all the way up and completely overlap full screen
      const pauseDist = PHILOSOPHY_CONFIG.leveledPause || 120;
      trackEl.style.height = `${Math.round((vh - currentStickyTop) + animDistance + pauseDist + vh)}px`;
    };

    const updateScrollAnimation = () => {
      const trackEl = trackRef.current;
      const gridEl = gridRef.current;

      if (!trackEl || !gridEl) {
        isTicking = false;
        return;
      }

      const width = window.innerWidth;
      if (width < 1025) {
        isTicking = false;
        return;
      }

      const trackRect = trackEl.getBoundingClientRect();

      // BEFORE Card 4 reaches full visibility in the viewport:
      // Keep cards in their complete resting staircase formation.
      if (trackRect.top > currentStickyTop) {
        gridEl.style.setProperty('--step-0', '0px');
        gridEl.style.setProperty('--step-1', `${currentSTEP * 1}px`);
        gridEl.style.setProperty('--step-2', `${currentSTEP * 2}px`);
        gridEl.style.setProperty('--step-3', `${currentSTEP * 3}px`);
        gridEl.style.setProperty('--grid-pad-bottom', `${currentMaxStagger}px`);
        if (contentRef.current) {
          contentRef.current.style.transform = 'none';
          contentRef.current.style.opacity = '1';
        }
        isTicking = false;
        return;
      }

      // AFTER reaching Card 4 full visibility:
      // The screen is sticky! Animate cards 1 to 4 to even positions while pinned.
      const scrollPastSticky = currentStickyTop - trackRect.top;
      const progress = Math.min(1, Math.max(0, scrollPastSticky / animDistance));

      const shift = progress * currentMaxStagger;
      const step0 = 0;
      const step1 = Math.max(0, Math.round(currentSTEP * 1 - shift));
      const step2 = Math.max(0, Math.round(currentSTEP * 2 - shift));
      const step3 = Math.max(0, Math.round(currentSTEP * 3 - shift));
      const padBottom = Math.max(0, Math.round((1 - progress) * currentMaxStagger));

      gridEl.style.setProperty('--step-0', `${step0}px`);
      gridEl.style.setProperty('--step-1', `${step1}px`);
      gridEl.style.setProperty('--step-2', `${step2}px`);
      gridEl.style.setProperty('--step-3', `${step3}px`);
      gridEl.style.setProperty('--grid-pad-bottom', `${padBottom}px`);

      // Micro-depth transition: as "The Art of Healing" sweeps upward full-screen over this section,
      // gently recede the underlying section with subtle scale and dimming
      const pauseDist = PHILOSOPHY_CONFIG.leveledPause || 120;
      const vh = window.innerHeight;
      const overlapStart = animDistance + pauseDist;
      const overlapProgress = Math.min(1, Math.max(0, (scrollPastSticky - overlapStart) / (vh * 0.95)));

      if (contentRef.current) {
        const scale = (1 - 0.045 * overlapProgress).toFixed(4);
        const opacity = (1 - 0.25 * overlapProgress).toFixed(4);
        contentRef.current.style.transform = `scale(${scale})`;
        contentRef.current.style.opacity = `${opacity}`;
        contentRef.current.style.transformOrigin = 'center center';
      }

      isTicking = false;
    };

    const onScroll = () => {
      if (!isTicking) {
        isTicking = true;
        rafId = requestAnimationFrame(updateScrollAnimation);
      }
    };

    const onResize = () => {
      computeLayout();
      updateScrollAnimation();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    // Sync with Lenis smooth scroll engine
    const lenis = (window as any).lenis;
    if (lenis && typeof lenis.on === 'function') {
      lenis.on('scroll', onScroll);
    }

    // Initial layout & frame computation
    computeLayout();
    updateScrollAnimation();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      const activeLenis = (window as any).lenis;
      if (activeLenis && typeof activeLenis.off === 'function') activeLenis.off('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [cardHeight, staggerRatio, animDistance, bottomClearance, leveledPause]);

  return (
    <section
      id="why-escora"
      ref={sectionRef}
      className="why-escora-section"
      style={{
        backgroundColor: '#EDEFF2',
        borderTop: '1px solid rgba(0, 0, 0, 0.06)',
        position: 'relative',
        zIndex: 1,
        padding: '0'
      }}
    >
      {/* Outer Scroll Track for Desktop Sticky Hold */}
      <div
        ref={trackRef}
        className="why-escora-track"
        style={{
          position: 'relative',
          width: '100%'
        }}
      >
        {/* Sticky Container - Pins in view once Card 4 is fully visible */}
        <div
          ref={stickyWrapperRef}
          className="why-escora-sticky"
          style={{
            width: '100%',
            willChange: 'transform'
          }}
        >
          <div
            ref={contentRef}
            className="section-wrapper"
            style={{
              paddingTop: '0.75rem',
              paddingBottom: 'clamp(2rem, 4vw, 3.5rem)',
              willChange: 'transform, opacity',
              transition: 'transform 0.08s linear, opacity 0.08s linear'
            }}
          >
            {/* Editorial Statement Header */}
            <div
              ref={headerRef}
              style={{
                maxWidth: '860px',
                margin: '0 auto 1.25rem',
                textAlign: 'center',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(22px)',
                transition: 'opacity 0.8s var(--ease-luxury), transform 0.8s var(--ease-luxury)'
              }}
            >
              {/* Eyebrow Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  padding: '0.24rem 0.9rem',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(1, 29, 63, 0.05)',
                  border: '1px solid rgba(1, 29, 63, 0.12)',
                  marginBottom: '0.5rem'
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#011D3F'
                  }}
                />
                <span
                  style={{
                    textTransform: 'uppercase',
                    fontSize: '0.68rem',
                    letterSpacing: '0.2em',
                    color: '#011D3F',
                    fontWeight: 700
                  }}
                >
                  THE ESCORA PHILOSOPHY
                </span>
              </div>

              {/* Main Headline */}
              <h2
                className="font-display"
                style={{
                  fontSize: 'clamp(1.9rem, 2.9vw, 3.2rem)',
                  color: '#011D3F',
                  lineHeight: 1.08,
                  letterSpacing: '0.015em',
                  fontWeight: 400,
                  margin: '0 0 0.5rem',
                  textTransform: 'uppercase'
                }}
              >
                WE MAKE BESPOKE KERALA <br className="hidden-mobile" />
                <span
                  style={{
                    fontStyle: 'italic',
                    color: '#9E6F29',
                    textTransform: 'none',
                    fontFamily: 'var(--font-serif)'
                  }}
                >
                  Travel Effortless.
                </span>
              </h2>

              {/* Shortened Section Description */}
              <p
                style={{
                  fontSize: 'clamp(0.86rem, 1vw, 0.98rem)',
                  color: '#55606E',
                  lineHeight: 1.5,
                  maxWidth: '580px',
                  margin: '0 auto',
                  fontWeight: 400
                }}
              >
                Zero cookie-cutter routes. 100% private departures, handpicked sanctuaries, and 24/7 personal concierge care across Kerala.
              </p>
            </div>

            {/* 4 Cascading / Stepped Cards Layout */}
            <div
              ref={gridRef}
              className="cascading-cards-grid"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.85s var(--ease-luxury) 0.15s, transform 0.85s var(--ease-luxury) 0.15s'
              }}
            >
              {CORE_PILLARS.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className={`cascading-column cascading-step-${idx}`}
                  >
                    <div
                      className="cascading-card"
                      onClick={() => {
                        if (onOpenEnquiry) onOpenEnquiry({ experience: card.title });
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          if (onOpenEnquiry) onOpenEnquiry({ experience: card.title });
                        }
                      }}
                    >
                      {/* Top Row: Pillar Icon + 4 Progress Dots */}
                      <div className="card-top-row">
                        <div className="card-icon-wrap">
                          <Icon size={18} strokeWidth={1.8} />
                        </div>

                        {/* 4 Indicator Dots */}
                        <div className="card-dots">
                          {card.dots.map((isDark, dotIdx) => (
                            <span
                              key={dotIdx}
                              className={`card-dot ${isDark ? 'dot-dark' : 'dot-light'}`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Bottom Area: Title + Description + Subtle Action Indicator */}
                      <div className="card-bottom-content">
                        <h3 className="card-title font-serif">
                          {card.title}
                        </h3>
                        <p className="card-desc">
                          {card.desc}
                        </p>

                        <div className="card-footer-cta">
                          <span>Explore Pillar</span>
                          <ArrowUpRight size={14} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Scoped CSS for Dynamic Sticky Staircase Scroll Animation */}
      <style>{`
        .cascading-cards-grid {
          --card-height: ${cardHeight}px;
          --step-0: 0px;
          --step-1: ${Math.round(cardHeight * staggerRatio)}px;
          --step-2: ${Math.round(cardHeight * staggerRatio * 2)}px;
          --step-3: ${Math.round(cardHeight * staggerRatio * 3)}px;
          --grid-pad-bottom: ${Math.round(cardHeight * staggerRatio * 3)}px;

          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.45rem;
          align-items: start;
          padding-bottom: var(--grid-pad-bottom, ${Math.round(cardHeight * staggerRatio * 3)}px);
          position: relative;
          width: 100%;
        }

        .cascading-column {
          will-change: transform;
          transition: transform 0.06s linear;
          height: var(--card-height, ${cardHeight}px);
          display: flex;
          flex-direction: column;
        }

        /* Desktop Descending Staircase Offsets linked to Scroll */
        @media (min-width: 1025px) {
          .cascading-step-0 {
            transform: translate3d(0, var(--step-0, 0px), 0);
          }
          .cascading-step-1 {
            transform: translate3d(0, var(--step-1, ${Math.round(cardHeight * staggerRatio)}px), 0);
          }
          .cascading-step-2 {
            transform: translate3d(0, var(--step-2, ${Math.round(cardHeight * staggerRatio * 2)}px), 0);
          }
          .cascading-step-3 {
            transform: translate3d(0, var(--step-3, ${Math.round(cardHeight * staggerRatio * 3)}px), 0);
          }
        }

        /* Tablet 2-Column Grid */
        @media (max-width: 1024px) and (min-width: 768px) {
          .cascading-cards-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.35rem;
            padding-bottom: 0px !important;
          }
          .cascading-column {
            height: 310px;
            transform: none !important;
          }
        }

        /* Mobile Single-Column Stack */
        @media (max-width: 767px) {
          .cascading-cards-grid {
            grid-template-columns: 1fr;
            gap: 1.15rem;
            padding-bottom: 0px !important;
          }
          .cascading-column {
            height: auto !important;
            transform: none !important;
          }
        }

        /* Card Styling - Identical Even Dimensions */
        .cascading-card {
          background-color: #FFFFFF;
          border-radius: 20px;
          border: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
          width: 100%;
          height: var(--card-height, ${cardHeight}px);
          box-sizing: border-box;
          padding: 1.45rem 1.4rem 1.4rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          cursor: pointer;
          position: relative;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 0.35s ease;
        }

        @media (max-width: 1024px) and (min-width: 768px) {
          .cascading-card {
            height: 335px;
          }
        }

        @media (max-width: 767px) {
          .cascading-card {
            height: auto;
            min-height: 310px;
          }
        }

        .cascading-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 45px -8px rgba(1, 29, 63, 0.12), 0 4px 12px rgba(0, 0, 0, 0.04);
          border-color: rgba(1, 29, 63, 0.18);
        }

        .cascading-card:focus-visible {
          outline: 2px solid #011D3F;
          outline-offset: 3px;
        }

        /* Top Row */
        .card-top-row {
          height: 36px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: auto;
        }

        .card-icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background-color: rgba(1, 29, 63, 0.05);
          border: 1px solid rgba(1, 29, 63, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #011D3F;
          transition: transform 0.35s ease, background-color 0.35s ease, color 0.35s ease;
        }

        .cascading-card:hover .card-icon-wrap {
          background-color: #011D3F;
          color: #FFFFFF;
          transform: scale(1.05);
        }

        /* Progress Dots */
        .card-dots {
          height: 36px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .card-dot {
          width: 6.5px;
          height: 6.5px;
          border-radius: 50%;
          display: inline-block;
          transition: transform 0.3s ease, background-color 0.3s ease;
        }

        .dot-dark {
          background-color: #011D3F;
        }

        .dot-light {
          background-color: #D5DAE2;
        }

        .cascading-card:hover .dot-dark {
          transform: scale(1.15);
        }

        /* Bottom Content */
        .card-bottom-content {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }

        .card-title {
          font-size: clamp(1.08rem, 1.25vw, 1.24rem);
          font-weight: 700;
          color: #011D3F;
          line-height: 1.22;
          letter-spacing: -0.01em;
          min-height: 2.85rem;
          display: flex;
          align-items: flex-start;
          margin: 0 0 0.45rem;
        }

        .card-desc {
          font-size: 0.84rem;
          color: #55606E;
          line-height: 1.48;
          min-height: 3.6rem;
          margin: 0;
          font-weight: 400;
          font-family: var(--font-body);
        }

        /* Card Footer CTA */
        .card-footer-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          margin-top: 0.65rem;
          font-size: 0.76rem;
          font-weight: 600;
          color: #9E6F29;
          letter-spacing: 0.02em;
          opacity: 0;
          transform: translateY(6px);
          transition: opacity 0.35s ease, transform 0.35s ease;
        }

        .cascading-card:hover .card-footer-cta {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </section>
  );
}
