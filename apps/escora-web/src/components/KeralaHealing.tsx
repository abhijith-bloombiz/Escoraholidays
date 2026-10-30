import React, { useEffect } from 'react';
import { ArrowRight, ArrowUpRight, Star, Flower2, Heart, Sparkles } from 'lucide-react';
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
    num: '01 / 03',
    pill: 'ASHTAVAIDYA HERITAGE',
    title: 'Classical Ayurveda & Panchakarma',
    desc: 'Unbroken 5,000-year lineage: pulse diagnosis (Nadi Pariksha) by Senior Vaidyas, synchronized four-hand herbal Abhyanga rituals, and warm Shirodhara.',
    image: '/images/exp_ayurveda.jpg',
    highlights: ['Doctor-Supervised', 'Custom Dosha Oils', 'Vaidya Consultation']
  },
  {
    id: 'yoga',
    num: '02 / 03',
    pill: 'MINDFUL AWAKENING & PRANAYAMA',
    title: 'Sunrise Yoga by the Waters',
    desc: 'Open-air dawn yoga pavilions overlooking tranquil backwaters, guided Vedic breathwork, somatic alignment, and restorative sunset sound meditation.',
    image: '/images/exp_yoga.jpg',
    highlights: ['Dawn Pranayama', 'Open-Air Pavilions', 'Somatic Alignment']
  },
  {
    id: 'kalaripayattu',
    num: '03 / 03',
    pill: 'ANCIENT WARRIOR DISCIPLINE',
    title: 'Kalaripayattu Martial Movement & Marma',
    desc: "Kerala's 3,000-year-old warrior discipline combining biomechanical flexibility sequences, breath mastery, and restorative therapeutic Marma Chikitsa.",
    image: '/images/retreat_3_kalaripayattu.jpg',
    highlights: ['3,000-Yr Discipline', 'Marma Pressure Points', 'Mobility Mastery']
  }
];

export interface KeralaHealingProps {
  onOpenEnquiry?: (data?: Record<string, any>) => void;
}

export default function KeralaHealing({ onOpenEnquiry }: KeralaHealingProps) {
  const [sectionRef, isVisible] = useScrollReveal<HTMLElement>({ threshold: 0.1, reEnter: true });

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

            <div style={{ marginBottom: '2.5rem' }}>
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
                <span>Consult a Senior Vaidya</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Traveler Proof Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {['photo-1534528741775-53994a69daeb', 'photo-1507003211169-0a1dd7228f2d', 'photo-1517841905240-472988babdf9'].map((img, idx) => (
                  <img
                    key={idx}
                    src={`https://images.unsplash.com/${img}?auto=format&fit=crop&w=80&h=80&q=80`}
                    alt="Guest avatar"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: '2px solid #F8F6F1',
                      marginLeft: idx === 0 ? 0 : '-10px',
                      objectFit: 'cover'
                    }}
                  />
                ))}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#121316',
                    color: '#D4A359',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: '-10px',
                    border: '2px solid #F8F6F1'
                  }}
                >
                  5★
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginBottom: '0.15rem' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} fill="#B48235" color="#B48235" />
                  ))}
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#121316', marginLeft: '0.35rem' }}>4.9/5</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#6B7280', fontWeight: 500 }}>
                  Doctor-Supervised • 100% Curative
                </div>
              </div>
            </div>

          </div>

          {/* Center Column: Card Deck */}
          <div
            className="healing-deck-container"
            style={{
              position: 'relative',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: '450px'
            }}
          >
            {HEALING_CARDS.map((card, idx) => (
              <div
                key={card.id}
                className={`healing-stack-card healing-card-${idx}`}
                style={{
                  position: 'sticky',
                  top: idx === 0 ? '96px' : '124px',
                  zIndex: idx + 2,
                  marginBottom: idx === HEALING_CARDS.length - 1 ? '0px' : '420px',
                  height: '540px',
                  borderRadius: '28px',
                  overflow: 'hidden',
                  boxShadow: '0 24px 60px rgba(0, 0, 0, 0.32), 0 6px 20px rgba(0, 0, 0, 0.16)',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  backgroundColor: '#121316',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.35s ease, border-color 0.35s ease'
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
                {/* Background Image */}
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

                {/* Top Frosted Index Tab (Peeking when stacked behind next cards) */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '52px',
                    padding: '0.85rem 1.4rem',
                    background: 'linear-gradient(180deg, rgba(18, 19, 22, 0.88) 0%, rgba(18, 19, 22, 0.5) 75%, transparent 100%)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    zIndex: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: '#D4A359',
                        boxShadow: '0 0 8px #D4A359'
                      }}
                    />
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        color: '#FFFFFF',
                        textTransform: 'uppercase'
                      }}
                    >
                      {card.num}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      color: '#D4A359',
                      textTransform: 'uppercase'
                    }}
                  >
                    {card.pill}
                  </span>
                </div>

                {/* Bottom Shadow Gradient */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(18,19,22,0.15) 0%, rgba(18,19,22,0) 35%, rgba(18,19,22,0.45) 55%, rgba(18,19,22,0.94) 100%)',
                    zIndex: 1
                  }}
                />

                {/* Bottom Card Content */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '1.75rem',
                    left: '1.6rem',
                    right: '1.6rem',
                    zIndex: 2,
                    color: '#FFFFFF'
                  }}
                >
                  {/* Highlight Feature Pills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                    {card.highlights.map((h, hIdx) => (
                      <span
                        key={hIdx}
                        style={{
                          fontSize: '0.66rem',
                          fontWeight: 600,
                          letterSpacing: '0.04em',
                          padding: '0.2rem 0.65rem',
                          borderRadius: '999px',
                          backgroundColor: 'rgba(255, 255, 255, 0.14)',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.18)',
                          color: '#FFFFFF'
                        }}
                      >
                        {h}
                      </span>
                    ))}
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontSize: 'clamp(1.2rem, 1.4vw, 1.45rem)',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600,
                      lineHeight: 1.15,
                      letterSpacing: '0.015em',
                      margin: '0 0 0.45rem',
                      color: '#FFFFFF',
                      textTransform: 'uppercase'
                    }}
                  >
                    {card.title}
                  </h3>

                  {/* Caption */}
                  <p
                    style={{
                      fontSize: '0.82rem',
                      color: 'rgba(255, 255, 255, 0.82)',
                      lineHeight: 1.45,
                      margin: '0 0 0.85rem',
                      fontWeight: 400
                    }}
                  >
                    {card.desc}
                  </p>

                  {/* Bottom Action Pill */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: '#D4A359',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase'
                    }}
                    className="card-cta-link"
                  >
                    <span>Reserve Retreat Consultation</span>
                    <ArrowUpRight size={13} />
                  </div>
                </div>
              </div>
            ))}
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
                  src="/images/exp_pool_villa.jpg"
                  alt="Herbal Garden"
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
            box-shadow: 0 32px 75px rgba(0, 0, 0, 0.35), 0 8px 25px rgba(0, 0, 0, 0.15) !important;
            border-color: rgba(212, 163, 89, 0.5) !important;
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
              margin-bottom: 120px !important;
            }
          }
        `}</style>

      </div>
    </section>
  );
}
