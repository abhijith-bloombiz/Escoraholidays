import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Compass,
  Droplets,
  Flame,
  Flower2,
  Heart,
  Leaf,
  Mountain,
  Shield,
  Sparkles,
  Sun,
  User,
  Utensils,
  Wind,
  Zap
} from 'lucide-react';


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

interface PillarItem {
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties; color?: string; strokeWidth?: number }>;
  title: string;
  subtitle?: string;
}

interface HealingCard {
  id: string;
  num: string;
  pill: string;
  title: string;
  heading: string;
  desc: string;
  mobileDesc?: string;
  subDesc?: string;
  image: string;
  highlights: string[];
  metrics: MetricItem[];
  bento: BentoData;
  pillars: PillarItem[];
}

const LotusIcon = ({ size = 20, color = '#A3722A' }: { size?: number; color?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 4.5c-1.8 3.2-2.8 6.5-2.8 9.5 0 2.2 1.2 3.8 2.8 3.8s2.8-1.6 2.8-3.8c0-3-1-6.3-2.8-9.5z" />
    <path d="M9.2 14c-2.4-1.8-4.7-.8-5.2 1.6-.4 1.8 1.4 3.4 4.4 2.8" />
    <path d="M14.8 14c2.4-1.8 4.7-.8 5.2 1.6.4 1.8-1.4 3.4-4.4 2.8" />
    <path d="M7.5 17.5c-2.8.8-4.2 2.6-3 3.8 1.8 1.8 6 .2 7.5-1.5" />
    <path d="M16.5 17.5c2.8.8 4.2 2.6 3 3.8-1.8 1.8-6 .2-7.5-1.5" />
  </svg>
);

const HEALING_CARDS: HealingCard[] = [
  {
    id: 'nature',
    num: '01 / 04',
    pill: 'NATURE RETREATS',
    title: 'Nature Retreats',
    heading: 'Find Stillness in Nature.',
    desc: "Escape into the primeval stillness of Kerala’s mist-crowned Western Ghats. Walk solitary trails through private tea estates, breathe crisp mountain air, and rest in secluded forest pavilions to rediscover the restorative art of slowing down.",
    mobileDesc: "Escape into Kerala’s mist-crowned Western Ghats. Walk solitary trails through private tea estates to rediscover the restorative joy of slowing down.",
    image: '/images/retreat_hiker_full.jpg',
    highlights: ['Doctor-Supervised', 'Custom Dosha Oils', 'Vaidya Consultation'],
    metrics: [
      { label: 'Heritage Lineage', value: '5,000+ Years' },
      { label: 'Physician Care', value: '1-on-1 Nadi Pariksha' },
      { label: 'Formulations', value: '100% Organic Botanicals' }
    ],
    bento: {
      title: 'Stillness among mountain mist',
      desc: 'Quiet highland sanctuaries nestled in ancient cardamom hills, designed for unhurried rest.',
      cluster: [
        { src: '/images/exp_treehouse.jpg', alt: 'Forest Treehouse Sanctuary' },
        { src: '/images/exp_tea_bungalow.jpg', alt: 'Cardamom Estate Heritage Bungalow' },
        { src: '/images/dest_3_munnar.jpg', alt: 'Misty Highland Sunrise Ridge' }
      ],
      features: [
        { icon: Leaf, label: 'Highlands' },
        { icon: Wind, label: 'Pure Air' },
        { icon: Heart, label: 'Stillness' }
      ]
    },
    pillars: [
      {
        icon: Mountain,
        title: 'Highland Sanctuaries',
        subtitle: 'Misty Western Ghats pavilions set among cardamom hills.'
      },
      {
        icon: Leaf,
        title: 'Forest Bathing & Trails',
        subtitle: 'Solitary walking paths through private heritage tea estates.'
      },
      {
        icon: Compass,
        title: 'Untouched Solitude',
        subtitle: 'Off-the-grid hideaways designed for quiet mountain rest.'
      }
    ]
  },
  {
    id: 'ayurveda',
    num: '02 / 04',
    pill: 'AYURVEDIC WELLNESS',
    title: 'Ayurvedic Wellness',
    heading: 'Rooted in Ancient Wisdom.',
    desc: "Discover an unbroken 5,000-year Ayurvedic heritage nurtured by Kerala’s Ashtavaidya lineage. Private pulse diagnosis with a Senior Vaidya, warm synchronized herbal therapies, and continuous Shirodhara restore your body’s natural rhythm and inner equilibrium.",
    mobileDesc: "Rooted in 5,000 years of classical Ashtavaidya lineage. Personal pulse diagnosis and warm herbal therapies restore inner equilibrium.",
    image: '/images/retreat_ayurveda_hd.jpg',
    highlights: ['Senior Vaidya Care', 'Synchronized Abhyanga', 'Warm Shirodhara'],
    metrics: [
      { label: 'Practice Lineage', value: '5,000-Year Heritage' },
      { label: 'Physician Care', value: '1-on-1 Pulse Diagnosis' },
      { label: 'Botanicals', value: '100% Organic Formulations' }
    ],
    bento: {
      title: 'Ancient wisdom, personalized care',
      desc: 'From pulse diagnosis to customized sattvic nutrition — tailored to your biological balance.',
      cluster: [
        { src: '/images/ayurveda_herbal_oils.jpg', alt: 'Botanical Herbs & Dosha Oils' },
        { src: '/images/ayurveda_kizhi_ritual.jpg', alt: 'Warm Herbal Kizhi Poultice' },
        { src: '/images/ayurveda_vaidya_care.jpg', alt: 'Ashtavaidya Nadi Pariksha Care' }
      ],
      features: [
        { icon: Flower2, label: 'Botanicals' },
        { icon: Sparkles, label: 'Shirodhara' },
        { icon: Heart, label: 'Vaidya Care' }
      ]
    },
    pillars: [
      {
        icon: LotusIcon,
        title: 'Classical Traditions',
        subtitle: 'Rooted in 5,000 years of Ashtavaidya healing heritage.'
      },
      {
        icon: User,
        title: 'Personalised Care',
        subtitle: 'One-on-one pulse diagnosis and bespoke dosha care.'
      },
      {
        icon: Sparkles,
        title: 'Restorative Therapies',
        subtitle: 'Synchronized warm herbal Abhyanga and Shirodhara rituals.'
      }
    ]
  },
  {
    id: 'mindful',
    num: '03 / 04',
    pill: 'MINDFUL LIVING',
    title: 'Mindful Living',
    heading: 'Reconnect with Your Inner Rhythm.',
    desc: "Make space for guided Vedic breathwork, lakefront yoga, and meditation in open-air dawn pavilions. As morning light touches the water, gentle somatic practices quiet mental noise and bring you into effortless harmony with the present moment.",
    mobileDesc: "Dawn meditation and somatic Vedic breathwork in open-air lakefront pavilions to calm the mind and awaken vital energy.",
    image: '/images/retreat_mindful_hd.jpg',
    highlights: ['Dawn Meditation', 'Guided Breathwork', 'Mindful Movement'],
    metrics: [
      { label: 'Practice Lineage', value: 'Vedic Hatha & Ashtanga' },
      { label: 'Dawn Awakening', value: '5:30 AM Lakefront Shala' },
      { label: 'Mindful Depth', value: 'Vedic Pranayama & Dhyana' }
    ],
    bento: {
      title: 'Prana flows with morning light',
      desc: 'Open-air pavilions bathed in amber mist, calming the nervous system with somatic breath and stillness.',
      cluster: [
        { src: '/images/exp_yoga.jpg', alt: 'Open-Air Dawn Yoga Shala' },
        { src: '/images/why_1_private_pace.jpg', alt: 'Tranquil Water Reflection' },
        { src: '/images/dest_2_vagamon.jpg', alt: 'Misty Valley Dawn Meditation' }
      ],
      features: [
        { icon: Sun, label: 'Dawn Asana' },
        { icon: Wind, label: 'Pranayama' },
        { icon: Sparkles, label: 'Meditation' }
      ]
    },
    pillars: [
      {
        icon: Sun,
        title: 'Dawn Awakening',
        subtitle: 'Open-air morning asana bathed in lakefront sunrise light.'
      },
      {
        icon: Wind,
        title: 'Guided Breathwork',
        subtitle: 'Vedic pranayama and somatic practices to calm the mind.'
      },
      {
        icon: Heart,
        title: 'Inner Stillness',
        subtitle: 'Acoustic sound meditation and deep restorative silence.'
      }
    ]
  },
  {
    id: 'restorative',
    num: '04 / 04',
    pill: 'RESTORATIVE ESCAPES',
    title: 'Restorative Escapes',
    heading: 'Time to Simply Be.',
    desc: "Step away from everyday pace into private waterfront pool villas and secluded lakeside estates. Guided by serene lagoon views, intuitive hospitality, and nourishing farm-to-table dining, immerse in peaceful surroundings designed purely for your rest.",
    mobileDesc: "Private waterfront pool villas and unhurried days nourished by organic farm-to-table dining and serene backwater views.",
    image: '/images/retreat_restorative_hd.jpg',
    highlights: ['Waterfront Solitude', 'Private Pool Villa', 'Unhurried Days'],
    metrics: [
      { label: 'Estate Harvest', value: '100% Farm-to-Table' },
      { label: 'Dosha Nutrition', value: 'Custom Sattvic Dining' },
      { label: 'Living Sanctuary', value: 'Waterfront Solitude' }
    ],
    bento: {
      title: 'Unhurried days, peaceful surroundings',
      desc: 'Private waterfront pool villas, thoughtful hospitality, and restorative stillness designed around your wellbeing.',
      cluster: [
        { src: '/images/exp_pool_villa.jpg', alt: 'Private Waterfront Pool Villa' },
        { src: '/images/tour_1_backwaters.jpg', alt: 'Candlelit Starlit Water Dining' },
        { src: '/images/exp_houseboat.jpg', alt: 'Heritage Backwater Houseboat' }
      ],
      features: [
        { icon: Leaf, label: 'Estate Herbs' },
        { icon: Utensils, label: 'Sattvic Dining' },
        { icon: Droplets, label: 'Detoxification' }
      ]
    },
    pillars: [
      {
        icon: Droplets,
        title: 'Waterfront Solitude',
        subtitle: 'Private pool villas set along peaceful backwater lagoons.'
      },
      {
        icon: Utensils,
        title: 'Sattvic Estate Dining',
        subtitle: 'Farm-to-table organic harvest tailored to your wellbeing.'
      },
      {
        icon: Shield,
        title: 'Thoughtful Hospitality',
        subtitle: 'Unhurried days shaped by intuitive care and calm stillness.'
      }
    ]
  }
];

export interface KeralaHealingProps {
  onOpenEnquiry?: (data?: Record<string, any>) => void;
}

export default function KeralaHealing({ onOpenEnquiry }: KeralaHealingProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const deckContainerRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const cardAnchorsRef = useRef<(HTMLDivElement | null)[]>([]);
  const cardImgsRef = useRef<(HTMLImageElement | null)[]>([]);
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
    if (window.innerWidth > 1040) {
      const anchor = cardAnchorsRef.current[idx];
      if (anchor) {
        const anchorRect = anchor.getBoundingClientRect();
        const targetY = window.scrollY + anchorRect.top - (idx === 0 ? 96 : 124);
        const lenis = (window as any).lenis;
        if (lenis && typeof lenis.scrollTo === 'function') {
          lenis.scrollTo(targetY, { duration: 1.2 });
        } else {
          window.scrollTo({ top: targetY, behavior: 'smooth' });
        }
      }
    } else {
      const card = cardsRef.current[idx];
      if (card) {
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
  // Dynamically tracks which card is currently displayed and updates the right & left content.
  useEffect(() => {
    let ticking = false;

    const updateCardTransforms = () => {
      ticking = false;
      const cards = cardsRef.current;
      if (!cards || cards.length === 0) return;

      if (window.innerWidth <= 1040) {
        cardImgsRef.current.forEach((img) => {
          if (img) img.style.transform = '';
        });
        cards.forEach((card) => {
          if (card) {
            card.style.transform = '';
            card.style.opacity = '';
          }
        });
        return;
      }

      // Check if section is anywhere near viewport
      const section = sectionRef.current;
      if (section) {
        const secRect = section.getBoundingClientRect();
        if (secRect.bottom < -200 || secRect.top > window.innerHeight + 200) {
          return;
        }
      }

      const deckContainer = deckContainerRef.current;
      const deckTop = deckContainer ? deckContainer.getBoundingClientRect().top : 0;

      // Helper to get real-time un-stuck top position for card i
      const getCardArrivalTop = (i: number): number => {
        const anchor = cardAnchorsRef.current[i];
        if (anchor) {
          return anchor.getBoundingClientRect().top;
        }
        // Fallback using container offset
        return deckTop + (i === 0 ? 0 : 560 + (i - 1) * 1020 + 460);
      };

      // Calculate arrival progress of incoming cards (i >= 2)
      // When card i arrives at top: 124px, p[i] = 1.
      // Hermite smoothstep easing: p * p * (3 - 2 * p)
      const p: number[] = [];
      for (let i = 2; i < cards.length; i++) {
        const card = cards[i];
        if (!card) continue;
        const cardTop = getCardArrivalTop(i);
        const rawP = Math.max(0, Math.min(1, 1 - (cardTop - 124) / 260));
        p[i] = rawP * rawP * (3 - 2 * rawP);
      }

      // Auto-stack for last card: as user scrolls past its arrival at 124px,
      // it automatically slides up to the 96px stacked position (-28px)
      const lastIdx = cards.length - 1;
      const lastCard = cards[lastIdx];
      if (lastCard) {
        const lastCardTop = getCardArrivalTop(lastIdx);
        const overscroll = 124 - lastCardTop;
        const rawLastSlide = Math.max(0, Math.min(1, (overscroll - 60) / 220));
        p[cards.length] = rawLastSlide * rawLastSlide * (3 - 2 * rawLastSlide);
      }

      const vh = window.innerHeight;

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

        // Smooth optical depth parallax for every center card image
        const img = cardImgsRef.current[k];
        if (img) {
          const anchorTop = getCardArrivalTop(k);
          const clampedP = Math.max(0, Math.min(1, (vh - anchorTop) / (vh + 560)));
          const parallaxY = (clampedP - 0.5) * -80;
          img.style.transform = `translate3d(0, ${parallaxY.toFixed(1)}px, 0)`;
        }
      });

      // Desktop: Detect which card is currently active (on top in the sticky stack)
      // Card 1 sticks at 124px; when its top reaches <= 220px, it covers over 75% of Card 0,
      // providing smooth, timely synchronization between the center image and editorial text.
      let currentActive = 0;
      for (let i = cards.length - 1; i >= 1; i--) {
        const card = cards[i];
        if (!card) continue;
        const cardTop = getCardArrivalTop(i);
        if (cardTop <= 220) {
          currentActive = i;
          break;
        }
      }

      if (currentActive !== activeCardIndexRef.current) {
        activeCardIndexRef.current = currentActive;
        setActiveCardIndex(currentActive);
      }
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateCardTransforms);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    const lenis = (window as any).lenis;
    if (lenis && typeof lenis.on === 'function') {
      lenis.on('scroll', onScroll);
    }

    updateCardTransforms();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      const activeLenis = (window as any).lenis;
      if (activeLenis && typeof activeLenis.off === 'function') {
        activeLenis.off('scroll', onScroll);
      }
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
            opacity: 1
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
              height: '560px',
              position: 'sticky',
              top: '96px',
              alignSelf: 'start'
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
                fontSize: 'clamp(0.82rem, 0.95vw, 0.88rem)',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                fontWeight: 700,
                color: '#9E6F29',
                marginBottom: '0.65rem',
                lineHeight: 1
              }}
            >
              <span>THE ART OF HEALING</span>
            </div>

            {/* Mobile-Only Retreat Selector Tabs */}
            <div
              className="healing-mobile-tabs"
              style={{
                display: 'none',
                gap: '0.45rem',
                overflowX: 'auto',
                paddingBottom: '0.35rem',
                marginBottom: '0.85rem',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none'
              }}
            >
              {HEALING_CARDS.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCardIndex(i)}
                  style={{
                    padding: '0.38rem 0.8rem',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    border: activeCardIndex === i ? '1px solid #9E6F29' : '1px solid rgba(18, 19, 22, 0.12)',
                    backgroundColor: activeCardIndex === i ? '#9E6F29' : 'rgba(255, 255, 255, 0.85)',
                    color: activeCardIndex === i ? '#FFFFFF' : '#5C5850',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                >
                  {c.title}
                </button>
              ))}
            </div>

            {/* Smooth Directional Cross-Fade Narrative Stack */}
            <div
              className="healing-narrative-stack"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                position: 'relative'
              }}
            >
              {HEALING_CARDS.map((card, idx) => {
                const isActive = activeCardIndex === idx;
                const isPast = activeCardIndex > idx;
                return (
                  <div
                    key={card.id}
                    className={`healing-narrative-item ${isActive ? 'is-active-narrative' : ''}`}
                    style={{
                      gridRow: 1,
                      gridColumn: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      opacity: isActive ? 1 : 0,
                      transform: isActive
                        ? 'translate3d(0, 0, 0)'
                        : (isPast ? 'translate3d(0, -60px, 0)' : 'translate3d(0, 60px, 0)'),
                      transition: 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.65s',
                      pointerEvents: isActive ? 'auto' : 'none',
                      visibility: isActive ? 'visible' : 'hidden',
                      willChange: 'opacity, transform'
                    }}
                  >
                    <h2
                      className="font-display healing-heading-text"
                      style={{
                        fontSize: 'clamp(2.85rem, 4.6vw, 4.4rem)',
                        color: '#121316',
                        lineHeight: 1.02,
                        letterSpacing: '0.035em',
                        textTransform: 'uppercase',
                        marginBottom: '1.15rem'
                      }}
                    >
                      {card.heading}
                    </h2>

                    {/* Desktop Full Narrative */}
                    <p
                      className="desktop-desc"
                      style={{
                        fontSize: 'clamp(0.92rem, 1vw, 1rem)',
                        color: '#5C5850',
                        lineHeight: 1.62,
                        marginBottom: '1.85rem',
                        fontWeight: 400,
                        display: '-webkit-box',
                        WebkitLineClamp: 7,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        maxHeight: 'calc(1.62em * 7)'
                      }}
                    >
                      {card.desc}
                    </p>

                    {/* Mobile Concise Narrative */}
                    <p
                      className="mobile-desc"
                      style={{
                        display: 'none',
                        fontSize: '0.88rem',
                        color: '#5C5850',
                        lineHeight: 1.5,
                        marginBottom: '1rem',
                        fontWeight: 400
                      }}
                    >
                      {card.mobileDesc || card.desc}
                    </p>

                    {/* Mobile-Only Compact Preview Image Card */}
                    <div
                      className="healing-mobile-card-img"
                      style={{
                        display: 'none',
                        position: 'relative',
                        width: '100%',
                        height: '175px',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        marginBottom: '1rem',
                        boxShadow: '0 8px 24px rgba(18, 19, 22, 0.08)'
                      }}
                    >
                      <img
                        src={card.image}
                        alt={card.title}
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
                          background: 'linear-gradient(to top, rgba(18, 19, 22, 0.6) 0%, rgba(18, 19, 22, 0) 60%)'
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '10px',
                          left: '12px',
                          right: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          color: '#FFFFFF'
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase'
                          }}
                        >
                          {card.num} · {card.pill}
                        </span>
                        <span
                          style={{
                            fontSize: '0.66rem',
                            color: '#E0C08B',
                            fontWeight: 600
                          }}
                        >
                          {card.highlights[0]}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <button
                onClick={() => handleConsultation(activeCard.title)}
                className="btn-pill btn-gold healing-plan-btn"
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
            ref={deckContainerRef}
            className="healing-deck-container"
            style={{
              position: 'relative',
              width: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {HEALING_CARDS.map((card, idx) => (
              <React.Fragment key={card.id}>
                {/* Real-time viewport anchor in normal flow to calculate arrival & active card */}
                <div
                  ref={(el) => { cardAnchorsRef.current[idx] = el; }}
                  style={{
                    position: 'relative',
                    height: '0px',
                    marginTop: idx === 0 ? '0px' : '460px',
                    pointerEvents: 'none'
                  }}
                  aria-hidden="true"
                />
                <div
                  ref={(el) => { cardsRef.current[idx] = el; }}
                  className={`healing-stack-card healing-card-${idx} ${activeCardIndex === idx ? 'is-active-card' : ''}`}
                  style={{
                    position: 'sticky',
                    top: idx === 0 ? '96px' : '124px',
                    zIndex: idx + 2,
                    marginTop: '0px',
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
                    transition: 'box-shadow 0.35s ease',
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
                  {/* Clean Edge-to-Edge Image with Optical Parallax for Every Center Card */}
                  <img
                    ref={(el) => { cardImgsRef.current[idx] = el; }}
                    src={card.image}
                    alt={card.title}
                    style={{
                      width: '100%',
                      height: '120%',
                      objectFit: 'cover',
                      display: 'block',
                      position: 'absolute',
                      top: '-10%',
                      left: 0,
                      willChange: 'transform',
                      transition: 'none'
                    }}
                    className="stack-card-img"
                  />
                </div>
              </React.Fragment>
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

          {/* Right Column: Smooth Cross-Fade Metrics & Fanned Bento Stack */}
          <div
            className="healing-col-right"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              height: '560px',
              position: 'sticky',
              top: '96px',
              alignSelf: 'start'
            }}
          >
            {HEALING_CARDS.map((card, idx) => {
              const isActive = activeCardIndex === idx;
              const isPast = activeCardIndex > idx;
              return (
                <div
                  key={card.id}
                  className={`healing-right-item ${isActive ? 'is-active-right' : ''}`}
                  style={{
                    gridRow: 1,
                    gridColumn: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    gap: '1.25rem',
                    height: '100%',
                    opacity: isActive ? 1 : 0,
                    transform: isActive
                      ? 'translate3d(0, 0, 0)'
                      : (isPast ? 'translate3d(0, -60px, 0)' : 'translate3d(0, 60px, 0)'),
                    transition: 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.65s',
                    pointerEvents: isActive ? 'auto' : 'none',
                    visibility: isActive ? 'visible' : 'hidden',
                    willChange: 'opacity, transform'
                  }}
                >
                  {/* Heritage Wellness Traditions Showcase */}
                  <div
                    className="healing-wellness-pillars"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.8rem'
                    }}
                  >
                    {card.pillars.map((item, pIdx) => {
                      const IconComponent = item.icon;
                      return (
                        <div
                          key={pIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.85rem'
                          }}
                        >
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: '#FAF5ED',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              marginTop: '2px'
                            }}
                          >
                            <IconComponent size={17} color="#A3722A" />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span
                              style={{
                                fontSize: '0.96rem',
                                fontWeight: 700,
                                fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
                                color: '#121316',
                                lineHeight: 1.25,
                                letterSpacing: '-0.01em',
                                marginBottom: '0.15rem'
                              }}
                            >
                              {item.title}
                            </span>
                            {item.subtitle && (
                              <p
                                style={{
                                  fontSize: '0.82rem',
                                  color: '#6B7280',
                                  lineHeight: 1.4,
                                  margin: 0,
                                  fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
                                  fontWeight: 400
                                }}
                              >
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Trova-Style Bento Card */}
                  <div
                    className="healing-bento-card"
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
                      cursor: 'pointer'
                    }}
                    onClick={() => handleConsultation(card.title)}
                    role="button"
                    tabIndex={isActive ? 0 : -1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleConsultation(card.title);
                      }
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '1.2rem',
                        color: '#121316',
                        fontWeight: 700,
                        marginBottom: '0.45rem',
                        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
                        letterSpacing: '-0.02em',
                        lineHeight: 1.3
                      }}
                    >
                      {card.bento.title}
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
                      {card.bento.desc}
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
                        src={card.bento.cluster[0].src}
                        alt={card.bento.cluster[0].alt}
                        className="bento-photo-left"
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
                          border: '3px solid #FFFFFF',
                          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      />
                      <img
                        src={card.bento.cluster[1].src}
                        alt={card.bento.cluster[1].alt}
                        className="bento-photo-right"
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
                          border: '3px solid #FFFFFF',
                          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      />
                      <img
                        src={card.bento.cluster[2].src}
                        alt={card.bento.cluster[2].alt}
                        className="bento-photo-center"
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
                          zIndex: 2,
                          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
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
                      {card.bento.features.map((feat, fIdx) => {
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
              );
            })}
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

          .healing-bento-card {
            transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }
          .healing-bento-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 16px 36px rgba(0, 0, 0, 0.08) !important;
          }
          .healing-bento-card:hover .bento-photo-left {
            transform: rotate(-13deg) translate3d(-3px, -2px, 0) !important;
          }
          .healing-bento-card:hover .bento-photo-right {
            transform: rotate(13deg) translate3d(3px, -2px, 0) !important;
          }
          .healing-bento-card:hover .bento-photo-center {
            transform: scale(1.04) translate3d(0, -3px, 0) !important;
          }

          .healing-stack-card {
            isolation: isolate;
            -webkit-mask-image: -webkit-radial-gradient(white, black);
            mask-image: radial-gradient(white, black);
          }

          .healing-stack-card:hover {
            box-shadow: 0 16px 36px rgba(18, 19, 22, 0.12), 0 4px 12px rgba(18, 19, 22, 0.06) !important;
          }

          .healing-stack-card .stack-card-img {
            will-change: transform;
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
          }

          .healing-stack-card:hover .stack-card-img {
            transform: scale(1.03) translate3d(0, 0, 0);
          }

          @media (max-width: 1040px) {
            .kerala-healing-section {
              --overlap-height: 0px !important;
              margin-top: 0px !important;
              min-height: auto;
              border-top-left-radius: 0px !important;
              border-top-right-radius: 0px !important;
              box-shadow: none !important;
              padding: 2.5rem 1.25rem 3rem !important;
            }
            .trova-heritage-grid {
              display: block !important;
            }
            .healing-col-left {
              position: static !important;
              height: auto !important;
            }
            .healing-narrative-stack > div {
              position: static !important;
              display: none !important;
            }
            .healing-narrative-stack > div.is-active-narrative {
              display: flex !important;
              opacity: 1 !important;
              transform: none !important;
              visibility: visible !important;
            }
            .healing-col-right {
              display: none !important;
            }
            .healing-deck-container {
              display: none !important;
            }
            .desktop-desc {
              display: none !important;
            }
            .mobile-desc {
              display: block !important;
            }
            .healing-mobile-tabs {
              display: flex !important;
            }
            .healing-mobile-card-img {
              display: block !important;
            }
            .healing-heading-text {
              font-size: clamp(1.75rem, 6.2vw, 2.15rem) !important;
              line-height: 1.05 !important;
              margin-bottom: 0.65rem !important;
            }
            .healing-plan-btn {
              padding: 0.7rem 1.5rem !important;
              font-size: 0.78rem !important;
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
