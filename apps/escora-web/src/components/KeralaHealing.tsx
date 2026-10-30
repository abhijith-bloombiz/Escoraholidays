import React, { useEffect, useRef } from 'react';
import { ArrowRight, Flower2, Heart, Sparkles } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollAnimation';

interface HealingCard {
  id: string;
  num: string;
  pill: string;
  title: string;
  desc: string;
  image: string;
  highlights: string[];
}

const HEALING_CARDS: HealingCard[] = [
  {
    id: 'ayurveda',
    num: '01 / 04',
    pill: 'ASHTAVAIDYA HERITAGE',
    title: 'Classical Ayurveda & Panchakarma',
    desc: 'Unbroken 5,000-year lineage: pulse diagnosis (Nadi Pariksha) by Senior Vaidyas, synchronized four-hand herbal Abhyanga rituals, and warm Shirodhara.',
    image: '/images/exp_ayurveda.jpg',
    highlights: ['Doctor-Supervised', 'Custom Dosha Oils', 'Vaidya Consultation']
  },
  {
    id: 'yoga',
    num: '02 / 04',
    pill: 'MINDFUL AWAKENING & PRANAYAMA',
    title: 'Sunrise Yoga by the Waters',
    desc: 'Open-air dawn yoga pavilions overlooking tranquil backwaters, guided Vedic breathwork, somatic alignment, and restorative sunset sound meditation.',
    image: '/images/exp_yoga.jpg',
    highlights: ['Dawn Pranayama', 'Open-Air Pavilions', 'Somatic Alignment']
  },
  {
    id: 'kalaripayattu',
    num: '03 / 04',
    pill: 'ANCIENT WARRIOR DISCIPLINE',
    title: 'Kalaripayattu Martial Movement & Marma',
    desc: "Kerala's 3,000-year-old warrior discipline combining biomechanical flexibility sequences, breath mastery, and restorative therapeutic Marma Chikitsa.",
    image: '/images/retreat_3_kalaripayattu.jpg',
    highlights: ['3,000-Yr Discipline', 'Marma Pressure Points', 'Mobility Mastery']
  },
  {
    id: 'naturopathy',
    num: '04 / 04',
    pill: 'SATTVIC BOTANICAL NOURISHMENT',
    title: 'Naturopathy & Sattvic Living',
    desc: 'Farm-to-table organic nutrition harvested daily from estate herbal gardens, bespoke dosha broths, and restorative waterfront sanctuary stillness.',
    image: '/images/exp_pool_villa.jpg',
    highlights: ['Estate Herbal Gardens', 'Custom Dosha Broths', 'Restorative Sanctuary']
  }
];

export interface KeralaHealingProps {
  onOpenEnquiry?: (data?: Record<string, any>) => void;
}

export default function KeralaHealing({ onOpenEnquiry }: KeralaHealingProps) {
  const [sectionRef, isVisible] = useScrollReveal<HTMLElement>({ threshold: 0.1, reEnter: true });
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const handleConsultation = (experienceTitle?: string) => {
    if (onOpenEnquiry) {
      onOpenEnquiry({
        experience: experienceTitle || 'Ayurveda & Healing Retreat',
        destination: 'Thrissur & Kovalam Sanctuaries',
        interest: 'Ayurveda & Classical Healing'
      });
    }
  };

  // Full-Screen Stacking Transition:
  // As the user scrolls, this section smoothly slides upward and completely overlaps
  // the previous "The Escora Philosophy" section full-screen.
  useEffect(() => {
    const updateOverlap = () => {
      const sectionEl = sectionRef.current;
      if (!sectionEl) return;

      const width = window.innerWidth;
      const vh = window.innerHeight;

      if (width >= 1025) {
        sectionEl.style.setProperty('--overlap-height', `${vh}px`);
      } else {
        sectionEl.style.setProperty('--overlap-height', '70px');
      }
    };

    window.addEventListener('resize', updateOverlap, { passive: true });
    updateOverlap();

    return () => {
      window.removeEventListener('resize', updateOverlap);
    };
  }, [sectionRef]);

  // 2-Card Cycling Stacking Animation:
  // Keeps at most 2 cards in the tiered stack at any time during desktop scroll.
  // When card i arrives, card i-2 fades out smoothly, and card i-1 slides up to slot 1 (-28px).
  useEffect(() => {
    let ticking = false;

    const updateCardTransforms = () => {
      ticking = false;
      const cards = cardsRef.current;
      if (!cards || cards.length === 0) return;

      if (window.innerWidth <= 1040) {
        cards.forEach((card) => {
          if (card) {
            card.style.transform = '';
            card.style.opacity = '';
          }
        });
        return;
      }

      // Calculate arrival progress of incoming cards (i >= 2)
      // When card i arrives at top: 124px, p[i] = 1.
      // Hermite smoothstep easing: p * p * (3 - 2 * p)
      const p = [];
      for (let i = 2; i < cards.length; i++) {
        const card = cards[i];
        if (!card) continue;
        const rect = card.getBoundingClientRect();
        const rawP = Math.max(0, Math.min(1, 1 - (rect.top - 124) / 260));
        p[i] = rawP * rawP * (3 - 2 * rawP);
      }

      cards.forEach((card, k) => {
        if (!card) return;
        if (k === 0) {
          // Card 0: fades out smoothly and drifts upward slightly as Card 2 arrives
          const p2 = p[2] || 0;
          card.style.opacity = (1 - p2).toString();
          card.style.transform = 'translateY(' + (-14 * p2) + 'px)';
        } else {
          // Card k:
          // Slides up from 124px to 96px (-28px) when Card k+1 arrives
          // Fades out smoothly when Card k+2 arrives
          const slideUp = p[k + 1] || 0;
          const fadeOut = p[k + 2] || 0;
          card.style.opacity = (1 - fadeOut).toString();
          card.style.transform = 'translateY(' + (-28 * slideUp - 14 * fadeOut) + 'px)';
        }
      });
    };

    const onScrollOrResize = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateCardTransforms);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    updateCardTransforms();

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, []);


  return (
    <section
      id="healing"
      ref={sectionRef}
      className="kerala-healing-section"
      style={{
        backgroundColor: '#F8F6F1',
        padding: 'clamp(6rem, 8.5vw, 8.5rem) 0 7.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.85)',
        position: 'relative',
        zIndex: 10,
        overflow: 'visible'
      }}
    >
      <div className="section-wrapper">

        {/* Trova Travel 3-Column Editorial Heritage Showcase */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 1.05fr) minmax(360px, 1fr) minmax(320px, 1.05fr)',
            gap: 'clamp(2rem, 3.5vw, 3.5rem)',
            alignItems: 'start',
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.8s var(--ease-luxury)'
          }}
          className="trova-heritage-grid"
        >

          {/* Left Column: Editorial Narrative & Trust Proof */}
          <div
            className="healing-col-left"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              position: 'sticky',
              top: '105px',
              alignSelf: 'start'
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.8rem',
                color: '#9E6F29',
                letterSpacing: '0.14em',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: '1rem'
              }}
            >
              <span>› THE ART OF HEALING</span>
            </div>

            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(2.3rem, 3.8vw, 3.4rem)',
                color: '#121316',
                lineHeight: 1.05,
                letterSpacing: '0.02em',
                marginBottom: '1.25rem'
              }}
            >
              Uncover the Ancient Science of Restorative Stillness
            </h2>

            <p
              style={{
                fontSize: '1rem',
                color: '#5C5850',
                lineHeight: 1.65,
                marginBottom: '2rem',
                fontWeight: 400
              }}
            >
              Kerala is the unbroken birthplace of classical Ayurveda. Every ESCORA retreat begins with an unhurried 1-on-1 pulse diagnosis (<em>Nadi Pariksha</em>) with a Senior Vaidya, followed by synchronized four-hand Abhyanga oil therapies, warm herbal Shirodhara, and customized sattvic estate nutrition.
            </p>

            <div>
              <button
                onClick={() => handleConsultation()}
                className="btn-pill btn-gold"
                style={{
                  padding: '0.8rem 1.85rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>Plan a Journey</span>
                <ArrowRight size={14} />
              </button>
            </div>

          </div>

          {/* Center Column: Card Deck */}
          <div
            className="healing-deck-container"
            style={{
              position: 'relative',
              width: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {HEALING_CARDS.map((card, idx) => (
              <div
                key={card.id}
                ref={(el) => { cardsRef.current[idx] = el; }}
                className={`healing-stack-card healing-card-${idx}`}
                style={{
                  position: 'sticky',
                  top: idx === 0 ? '96px' : '124px',
                  zIndex: idx + 2,
                  marginTop: idx === 0 ? '0px' : '460px',
                  marginBottom: '0px',
                  height: '540px',
                  borderRadius: '28px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 28px rgba(18, 19, 22, 0.08), 0 2px 8px rgba(18, 19, 22, 0.04)',
                  border: 'none',
                  backgroundColor: '#121316',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.35s ease',
                  willChange: 'transform, opacity'
                }}
                onClick={() => handleConsultation(card.title)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleConsultation(card.title);
                  }
                }}
              >
                {/* Background Image (Clean edge-to-edge without dark overlays) */}
                <img
                  src={card.image}
                  alt={card.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  className="stack-card-img"
                />

                {/* Title at Bottom with Generous Border Space */}
                <div
                  style={{
                    position: 'absolute',
                    left: '1.75rem',
                    right: '1.75rem',
                    bottom: '2.25rem',
                    zIndex: 2,
                    textAlign: 'center',
                    pointerEvents: 'none'
                  }}
                >
                  <h3
                    style={{
                      fontSize: 'clamp(1.4rem, 2vw, 1.95rem)',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      lineHeight: 1.15,
                      letterSpacing: '0.035em',
                      margin: 0,
                      color: '#FFFFFF',
                      textTransform: 'uppercase',
                      textShadow: '0 2px 10px rgba(0, 0, 0, 0.95), 0 4px 22px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 0, 0, 0.6)'
                    }}
                  >
                    {card.title}
                  </h3>
                </div>
              </div>
            ))}

            {/* Hold Spacer to keep full 3-card stack pinned & aligned before scrolling away */}
            <div
              className="healing-deck-spacer"
              style={{
                height: '900px',
                width: '100%',
                pointerEvents: 'none'
              }}
              aria-hidden="true"
            />
          </div>

          {/* Right Column: Trova Specs Table & Fanned Photo Bento Card */}
          <div
            className="healing-col-right"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.75rem',
              position: 'sticky',
              top: '105px',
              alignSelf: 'start'
            }}
          >
            {/* Minimalist Metrics Table with Hairline Dividers */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.15rem 0',
                  borderBottom: '1px solid rgba(18, 19, 22, 0.1)'
                }}
              >
                <span style={{ fontSize: '0.92rem', color: '#6B7280', fontWeight: 500 }}>Heritage Lineage</span>
                <span style={{ fontSize: '1.05rem', color: '#121316', fontWeight: 700, fontFamily: 'var(--font-display)' }}>5,000+ Years</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.15rem 0',
                  borderBottom: '1px solid rgba(18, 19, 22, 0.1)'
                }}
              >
                <span style={{ fontSize: '0.92rem', color: '#6B7280', fontWeight: 500 }}>Physician Care</span>
                <span style={{ fontSize: '1.05rem', color: '#121316', fontWeight: 700, fontFamily: 'var(--font-display)' }}>1-on-1 Nadi Pariksha</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.15rem 0',
                  borderBottom: '1px solid rgba(18, 19, 22, 0.1)'
                }}
              >
                <span style={{ fontSize: '0.92rem', color: '#6B7280', fontWeight: 500 }}>Formulations</span>
                <span style={{ fontSize: '1.05rem', color: '#121316', fontWeight: 700, fontFamily: 'var(--font-display)' }}>100% Organic Botanicals</span>
              </div>
            </div>

            {/* Trova-Style "Every retreat, a new story" Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                padding: '1.75rem',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <h3
                style={{
                  fontSize: '1.25rem',
                  color: '#121316',
                  fontWeight: 700,
                  marginBottom: '0.4rem',
                  fontFamily: 'var(--font-display)'
                }}
              >
                Every retreat, a quiet reset
              </h3>

              <p
                style={{
                  fontSize: '0.85rem',
                  color: '#6B7280',
                  lineHeight: 1.5,
                  maxWidth: '300px',
                  marginBottom: '1.5rem'
                }}
              >
                From pulse diagnosis to customized sattvic cuisine — tailored to your biological balance.
              </p>

              {/* Fanned 3-Photo Cluster (Trova Style) */}
              <div
                style={{
                  position: 'relative',
                  width: '260px',
                  height: '140px',
                  marginBottom: '1.25rem'
                }}
              >
                <img
                  src="/images/exp_treehouse.jpg"
                  alt="Forest Sanctuary"
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '15px',
                    width: '100px',
                    height: '110px',
                    borderRadius: '14px',
                    objectFit: 'cover',
                    transform: 'rotate(-10deg)',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                    border: '3px solid #FFFFFF'
                  }}
                />
                <img
                  src="/images/retreat_3_kalaripayattu.jpg"
                  alt="Somatic Movement"
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '15px',
                    width: '100px',
                    height: '110px',
                    borderRadius: '14px',
                    objectFit: 'cover',
                    transform: 'rotate(10deg)',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                    border: '3px solid #FFFFFF'
                  }}
                />
                <img
                  src="/images/exp_yoga.jpg"
                  alt="Oceanfront Yoga"
                  style={{
                    position: 'absolute',
                    left: '75px',
                    top: '0px',
                    width: '110px',
                    height: '125px',
                    borderRadius: '16px',
                    objectFit: 'cover',
                    boxShadow: '0 12px 25px rgba(0,0,0,0.2)',
                    border: '3px solid #FFFFFF',
                    zIndex: 2
                  }}
                />
              </div>

              {/* 3 Minimal Icons at Base */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1.75rem',
                  color: '#9E6F29'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                  <Flower2 size={18} />
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#6B7280' }}>Botanicals</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                  <Sparkles size={18} />
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#6B7280' }}>Shirodhara</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                  <Heart size={18} />
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#6B7280' }}>Pranayama</span>
                </div>
              </div>

            </div>

          </div>

        </div>

        <style>{`
          .kerala-healing-section {
            --overlap-height: 100vh;
            margin-top: calc(-1 * var(--overlap-height, 100vh));
            position: relative;
            z-index: 10;
            min-height: 100vh;
            border-top-left-radius: clamp(32px, 5vw, 48px);
            border-top-right-radius: clamp(32px, 5vw, 48px);
            box-shadow: 0 -30px 80px rgba(1, 29, 63, 0.14), 0 -8px 24px rgba(0, 0, 0, 0.05);
          }

          .healing-stack-card:hover {
            box-shadow: 0 16px 36px rgba(18, 19, 22, 0.12), 0 4px 12px rgba(18, 19, 22, 0.06) !important;
          }

          .healing-stack-card:hover .stack-card-img {
            transform: scale(1.04);
          }

          @media (max-width: 1040px) {
            .kerala-healing-section {
              --overlap-height: 70px;
              margin-top: -70px;
              min-height: auto;
              border-top-left-radius: clamp(24px, 5vw, 36px);
              border-top-right-radius: clamp(24px, 5vw, 36px);
              box-shadow: 0 -16px 40px rgba(1, 29, 63, 0.08), 0 -3px 12px rgba(0, 0, 0, 0.03);
            }
            .trova-heritage-grid {
              grid-template-columns: 1fr !important;
            }
            .healing-col-left, .healing-col-right {
              position: static !important;
            }
            .healing-stack-card {
              height: 440px !important;
              margin-top: 24px !important;
              margin-bottom: 0px !important;
              opacity: 1 !important;
              transform: none !important;
            }
            .healing-deck-spacer {
              display: none !important;
            }
          }
        `}</style>

      </div>
    </section>
  );
}
