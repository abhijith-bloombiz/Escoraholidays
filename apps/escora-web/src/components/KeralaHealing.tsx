import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Droplets,
  Flame,
  Flower2,
  Heart,
  Leaf,
  Shield,
  Sparkles,
  Sun,
  Utensils,
  Wind,
  Zap
} from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollAnimation';

interface MetricItem {
  label: string;
  value: string;
}

interface FeatureItem {
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  label: string;
}

interface BentoClusterPhoto {
  src: string;
  alt: string;
}

interface BentoData {
  title: string;
  desc: string;
  cluster: [BentoClusterPhoto, BentoClusterPhoto, BentoClusterPhoto];
  features: FeatureItem[];
}

interface HealingCard {
  id: string;
  num: string;
  pill: string;
  title: string;
  desc: string;
  image: string;
  highlights: string[];
  metrics: MetricItem[];
  bento: BentoData;
}

const HEALING_CARDS: HealingCard[] = [
  {
    id: 'ayurveda',
    num: '01 / 04',
    pill: 'ASHTAVAIDYA HERITAGE',
    title: 'Classical Ayurveda & Panchakarma',
    desc: 'Unbroken 5,000-year lineage: pulse diagnosis (Nadi Pariksha) by Senior Vaidyas, synchronized four-hand herbal Abhyanga rituals, and warm Shirodhara.',
    image: '/images/retreat_hiker_full.jpg',
    highlights: ['Doctor-Supervised', 'Custom Dosha Oils', 'Vaidya Consultation'],
    metrics: [
      { label: 'Heritage Lineage', value: '5,000+ Years' },
      { label: 'Physician Care', value: '1-on-1 Nadi Pariksha' },
      { label: 'Formulations', value: '100% Organic Botanicals' }
    ],
    bento: {
      title: 'Every retreat, a quiet reset',
      desc: 'From pulse diagnosis to customized sattvic cuisine — tailored to your biological balance.',
      cluster: [
        { src: '/images/exp_treehouse.jpg', alt: 'Forest Sanctuary' },
        { src: '/images/retreat_3_kalaripayattu.jpg', alt: 'Somatic Movement' },
        { src: '/images/exp_ayurveda.jpg', alt: 'Ayurveda & Shirodhara' }
      ],
      features: [
        { icon: Flower2, label: 'Botanicals' },
        { icon: Sparkles, label: 'Shirodhara' },
        { icon: Heart, label: 'Pranayama' }
      ]
    }
  },
  {
    id: 'yoga',
    num: '02 / 04',
    pill: 'MINDFUL AWAKENING & PRANAYAMA',
    title: 'Sunrise Yoga by the Waters',
    desc: 'Open-air dawn yoga pavilions overlooking tranquil backwaters, guided Vedic breathwork, somatic alignment, and restorative sunset sound meditation.',
    image: '/images/exp_yoga.jpg',
    highlights: ['Dawn Pranayama', 'Open-Air Pavilions', 'Somatic Alignment'],
    metrics: [
      { label: 'Practice Lineage', value: 'Vedic Hatha & Ashtanga' },
      { label: 'Dawn Awakening', value: '5:30 AM Lakefront Shala' },
      { label: 'Mindful Depth', value: 'Vedic Pranayama & Dhyana' }
    ],
    bento: {
      title: 'Prana flows with morning light',
      desc: 'Open-air pavilions bathed in amber mist, calming the nervous system with somatic breath and stillness.',
      cluster: [
        { src: '/images/dest_5_varkala.jpg', alt: 'Coastal Cliff Sanctuary' },
        { src: '/images/tour_1_backwaters.jpg', alt: 'Backwater Reflection' },
        { src: '/images/exp_yoga.jpg', alt: 'Oceanfront Sunrise Yoga' }
      ],
      features: [
        { icon: Sun, label: 'Dawn Asana' },
        { icon: Wind, label: 'Pranayama' },
        { icon: Sparkles, label: 'Sound Bath' }
      ]
    }
  },
  {
    id: 'kalaripayattu',
    num: '03 / 04',
    pill: 'ANCIENT WARRIOR DISCIPLINE',
    title: 'Kalaripayattu Martial Movement & Marma',
    desc: "Kerala's 3,000-year-old warrior discipline combining biomechanical flexibility sequences, breath mastery, and restorative therapeutic Marma Chikitsa.",
    image: '/images/retreat_3_kalaripayattu.jpg',
    highlights: ['3,000-Yr Discipline', 'Marma Pressure Points', 'Mobility Mastery'],
    metrics: [
      { label: 'Warrior Lineage', value: '3,000-Year Discipline' },
      { label: 'Vital Therapy', value: '108 Marma Points' },
      { label: 'Master Supervision', value: 'Senior Kalari Gurukkal' }
    ],
    bento: {
      title: 'Agility, bio-mechanics & vigor',
      desc: "Kerala's ancient martial movement combined with traditional therapeutic Marma oil therapy to unlock vitality.",
      cluster: [
        { src: '/images/exp_treehouse.jpg', alt: 'Rainforest Canopy' },
        { src: '/images/tour_2_rainforest.jpg', alt: 'Forest Temple Grounds' },
        { src: '/images/retreat_3_kalaripayattu.jpg', alt: 'Kalari Martial Movement' }
      ],
      features: [
        { icon: Shield, label: 'Discipline' },
        { icon: Flame, label: 'Vital Marma' },
        { icon: Zap, label: 'Mobility' }
      ]
    }
  },
  {
    id: 'naturopathy',
    num: '04 / 04',
    pill: 'SATTVIC BOTANICAL NOURISHMENT',
    title: 'Naturopathy & Sattvic Living',
    desc: 'Farm-to-table organic nutrition harvested daily from estate herbal gardens, bespoke dosha broths, and restorative waterfront sanctuary stillness.',
    image: '/images/exp_pool_villa.jpg',
    highlights: ['Estate Herbal Gardens', 'Custom Dosha Broths', 'Restorative Sanctuary'],
    metrics: [
      { label: 'Estate Harvest', value: '100% Farm-to-Table' },
      { label: 'Dosha Nutrition', value: 'Custom Sattvic Dining' },
      { label: 'Living Sanctuary', value: 'Waterfront Solitude' }
    ],
    bento: {
      title: 'Pure nourishment from soil to soul',
      desc: 'Medicinal botanicals harvested daily from estate gardens, custom herbal broths, and quiet waterfront stillness.',
      cluster: [
        { src: '/images/exp_treehouse.jpg', alt: 'Medicinal Gardens' },
        { src: '/images/retreat_4_naturopathy.jpg', alt: 'Farm-to-Table Dining' },
        { src: '/images/exp_pool_villa.jpg', alt: 'Sanctuary Pool Villa' }
      ],
      features: [
        { icon: Leaf, label: 'Estate Herbs' },
        { icon: Utensils, label: 'Sattvic Dining' },
        { icon: Droplets, label: 'Detoxification' }
      ]
    }
  }
];

export interface KeralaHealingProps {
  onOpenEnquiry?: (data?: Record<string, any>) => void;
}

export default function KeralaHealing({ onOpenEnquiry }: KeralaHealingProps) {
  const [sectionRef, isVisible] = useScrollReveal<HTMLElement>({ threshold: 0.1, reEnter: true });
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const activeCardIndexRef = useRef(0);

  const activeCard = HEALING_CARDS[activeCardIndex] || HEALING_CARDS[0];

  const handleConsultation = (experienceTitle?: string) => {
    if (onOpenEnquiry) {
      onOpenEnquiry({
        experience: experienceTitle || activeCard.title || 'Ayurveda & Healing Retreat',
        destination: 'Thrissur & Kovalam Sanctuaries',
        interest: 'Ayurveda & Classical Healing'
      });
    }
  };

  const handleCardSelect = (idx: number) => {
    setActiveCardIndex(idx);
    activeCardIndexRef.current = idx;
    const card = cardsRef.current[idx];
    if (card) {
      if (window.innerWidth > 1040) {
        const rect = card.getBoundingClientRect();
        const targetY = window.scrollY + rect.top - (idx === 0 ? 96 : 124);
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      } else {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Full-Screen Stacking Transition:
  // Smoothly overlaps the previous section full-screen on desktop
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

  // 2-Card Cycling Stacking Animation & Active Card Detection:
  // Keeps at most 2 cards in the tiered stack at any time during desktop scroll.
  // Dynamically tracks which card is currently displayed and updates the right column content.
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

        // Determine active card on mobile (card closest to upper 45% of viewport)
        const targetLine = window.innerHeight * 0.45;
        let closestDist = Infinity;
        let closestIdx = 0;
        cards.forEach((card, idx) => {
          if (!card) return;
          const rect = card.getBoundingClientRect();
          const cardCenter = rect.top + rect.height / 2;
          const dist = Math.abs(cardCenter - targetLine);
          if (dist < closestDist) {
            closestDist = dist;
            closestIdx = idx;
          }
        });

        if (closestIdx !== activeCardIndexRef.current) {
          activeCardIndexRef.current = closestIdx;
          setActiveCardIndex(closestIdx);
        }
        return;
      }

      // Calculate arrival progress of incoming cards (i >= 2)
      // When card i arrives at top: 124px, p[i] = 1.
      // Hermite smoothstep easing: p * p * (3 - 2 * p)
      const p: number[] = [];
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

      // Desktop: Detect which card is currently active (on top in the sticky stack)
      // Card 0 is active by default. When incoming card i approaches sticky position (<= 180px),
      // it covers card i-1 and becomes active.
      let currentActive = 0;
      for (let i = cards.length - 1; i >= 1; i--) {
        const card = cards[i];
        if (!card) continue;
        const rect = card.getBoundingClientRect();
        if (rect.top <= 180) {
          currentActive = i;
          break;
        }
      }

      if (currentActive !== activeCardIndexRef.current) {
        activeCardIndexRef.current = currentActive;
        setActiveCardIndex(currentActive);
      }
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
                fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
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
                onClick={() => handleConsultation(activeCard.title)}
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

          {/* Center Column: Card Deck with Clean Reference Shape & Image */}
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
                className={`healing-stack-card healing-card-${idx} ${activeCardIndex === idx ? 'is-active-card' : ''}`}
                style={{
                  position: 'sticky',
                  top: idx === 0 ? '96px' : '124px',
                  zIndex: idx + 2,
                  marginTop: idx === 0 ? '0px' : '460px',
                  marginBottom: '0px',
                  height: '560px',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: activeCardIndex === idx
                    ? '0 16px 36px rgba(18, 19, 22, 0.12), 0 4px 12px rgba(18, 19, 22, 0.05)'
                    : '0 10px 24px rgba(18, 19, 22, 0.07), 0 2px 6px rgba(18, 19, 22, 0.03)',
                  border: 'none',
                  backgroundColor: '#121316',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.35s ease, transform 0.35s ease',
                  willChange: 'transform, opacity'
                }}
                onClick={() => {
                  if (activeCardIndex !== idx) {
                    handleCardSelect(idx);
                  } else {
                    handleConsultation(card.title);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={card.title}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleConsultation(card.title);
                  }
                }}
              >
                {/* Clean Edge-to-Edge Image (Exact Shape & Reference Image) */}
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
              </div>
            ))}

            {/* Hold Spacer to keep full card stack pinned & aligned before scrolling away */}
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

          {/* Right Column: Dynamic Metrics Table & Fanned Photo Bento Card */}
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
            {/* Minimalist Metrics Table with Hairline Dividers (Changes dynamically) */}
            <div
              key={`metrics-${activeCardIndex}`}
              className="healing-dynamic-content"
              style={{
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {activeCard.metrics.map((m, mIdx) => (
                <div
                  key={mIdx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.15rem 0',
                    borderBottom: '1px solid rgba(18, 19, 22, 0.1)'
                  }}
                >
                  <span style={{ fontSize: '0.92rem', color: '#6B7280', fontWeight: 500 }}>
                    {m.label}
                  </span>
                  <span
                    style={{
                      fontSize: '1.05rem',
                      color: '#121316',
                      fontWeight: 700,
                      fontFamily: 'var(--font-display)',
                      textTransform: 'uppercase'
                    }}
                  >
                    {m.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Trova-Style Bento Card (Changes dynamically) */}
            <div
              key={`bento-${activeCardIndex}`}
              className="healing-dynamic-content"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                padding: '1.75rem',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}
              onClick={() => handleConsultation(activeCard.title)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleConsultation(activeCard.title);
                }
              }}
            >
              <h3
                style={{
                  fontSize: '1.25rem',
                  color: '#121316',
                  fontWeight: 700,
                  marginBottom: '0.4rem',
                  fontFamily: 'var(--font-display)',
                  textTransform: 'uppercase'
                }}
              >
                {activeCard.bento.title}
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
                {activeCard.bento.desc}
              </p>

              {/* Fanned 3-Photo Cluster */}
              <div
                style={{
                  position: 'relative',
                  width: '260px',
                  height: '140px',
                  marginBottom: '1.25rem'
                }}
              >
                <img
                  src={activeCard.bento.cluster[0].src}
                  alt={activeCard.bento.cluster[0].alt}
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
                  src={activeCard.bento.cluster[1].src}
                  alt={activeCard.bento.cluster[1].alt}
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
                  src={activeCard.bento.cluster[2].src}
                  alt={activeCard.bento.cluster[2].alt}
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
                {activeCard.bento.features.map((feat, fIdx) => {
                  const IconComp = feat.icon;
                  return (
                    <div
                      key={fIdx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}
                    >
                      <IconComp size={18} />
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#6B7280' }}>
                        {feat.label}
                      </span>
                    </div>
                  );
                })}
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

          @keyframes healingContentFadeIn {
            0% {
              opacity: 0.35;
              transform: translateY(6px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .healing-dynamic-content {
            animation: healingContentFadeIn 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }

          .healing-stack-card:hover {
            box-shadow: 0 16px 36px rgba(18, 19, 22, 0.12), 0 4px 12px rgba(18, 19, 22, 0.06) !important;
          }

          .healing-stack-card:hover .stack-card-img {
            transform: scale(1.03);
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
              height: 480px !important;
              border-radius: 20px !important;
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
