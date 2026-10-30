import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Calendar, Compass, Users, ChevronDown, ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react';
import { useListDestinations } from '@workspace/api-client-react';

const HERO_VIDEOS = [
  {
    id: 'hero-video-1',
    video: '/hero/15015065_1920_1080_60fps.mp4',
    title: 'KERALA HIGHLANDS',
    subtitle: 'Misty Summits & Ancient Valleys'
  },
  {
    id: 'hero-video-2',
    video: '/hero/9154179-uhd_3840_2160_25fps.mp4',
    title: 'HERITAGE WATERWAYS',
    subtitle: 'Arabian Sea & Living Legacies'
  }
];

const HERO_SLIDES = HERO_VIDEOS;

// Temporarily hide the hero quick search bar per user request
const SHOW_HERO_SEARCH_BAR = false;

const COMPANIONS = {
  topLeft: {
    name: 'Alleppey & Vembanad',
    tag: 'BACKWATERS',
    subtitle: 'Silent Lagoons & Private Charters',
    image: '/images/tour_1_backwaters.jpg'
  },
  bottomLeft: {
    name: 'Wayanad Rainforest',
    tag: 'RAINFOREST',
    subtitle: 'Ancient Mist & Treehouse Sanctuaries',
    image: '/images/dest_1_wayanad.jpg'
  },
  topRight: {
    name: 'Fort Kochi Harbour',
    tag: 'HERITAGE',
    subtitle: 'Colonial Waterfront & Art Biennales',
    image: '/images/hero/sleeba-thomas-7FNVvI2Lezc-unsplash.jpg'
  },
  bottomRight: {
    name: 'Varkala Sea Cliffs',
    tag: 'COASTLINE',
    subtitle: 'Dramatic Ocean Vistas & Peace',
    image: '/images/dest_5_varkala.jpg'
  }
};

const EXP_CARDS = [
  {
    id: 'exp-card-2',
    tag: 'Estate Seclusion',
    duration: 'Dawn // 3 Hours',
    title: 'Dawn Tea Cupping with a Planter',
    location: 'Munnar Highlands',
    desc: 'Single-origin tastings & high-range trails in a 150-year-old colonial bungalow.',
    image: '/images/exp_tea_bungalow.jpg'
  },
  {
    id: 'exp-card-3',
    tag: 'Wilderness Reserve',
    duration: 'Full Day',
    title: 'Periyar Bamboo River Rafting',
    location: 'Periyar Reserve',
    desc: 'Silent misty waters with indigenous tribal trackers and wild elephant herds.',
    image: '/images/dest_4_rafting.jpg'
  },
  {
    id: 'exp-card-4',
    tag: 'Living Arts',
    duration: 'Masterclass',
    title: 'Kathakali Greenroom & Sacred Arts',
    location: 'Thrissur Cultural Quarters',
    desc: 'Front-row sacred makeup transformation & royal Travancore culinary feasts.',
    image: '/images/exp_kathakali.jpg'
  }
];

export interface HeroProps {
  onOpenEnquiry?: (data?: Record<string, any>) => void;
  onSelectFilter?: (data?: Record<string, any>) => void;
  onSelectDestination?: (dest: { name: string }) => void;
}

export default function Hero({ onOpenEnquiry, onSelectFilter, onSelectDestination }: HeroProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const expVideoRef = useRef<HTMLVideoElement | null>(null);
  const heroVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDesktop, setIsDesktop] = useState(true);
  const [isRearranged, setIsRearranged] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Live CMS Destinations from Admin Panel
  const { data: remoteDestinations } = useListDestinations();

  // Form states for the quick filter bar
  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState('');
  const [experience, setExperience] = useState('');
  const [guests, setGuests] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const liveCompanions = useMemo(() => {
    if (!remoteDestinations || remoteDestinations.length < 4) {
      return COMPANIONS;
    }
    const published = remoteDestinations.filter((d) => d.published);
    const items = published.length >= 4 ? published : remoteDestinations;
    return {
      topLeft: {
        name: items[0]?.name || COMPANIONS.topLeft.name,
        tag: (items[0]?.type || COMPANIONS.topLeft.tag).toUpperCase(),
        subtitle: items[0]?.shortDesc || COMPANIONS.topLeft.subtitle,
        image: items[0]?.imageUrl || COMPANIONS.topLeft.image,
      },
      bottomLeft: {
        name: items[1]?.name || COMPANIONS.bottomLeft.name,
        tag: (items[1]?.type || COMPANIONS.bottomLeft.tag).toUpperCase(),
        subtitle: items[1]?.shortDesc || COMPANIONS.bottomLeft.subtitle,
        image: items[1]?.imageUrl || COMPANIONS.bottomLeft.image,
      },
      topRight: {
        name: items[2]?.name || COMPANIONS.topRight.name,
        tag: (items[2]?.type || COMPANIONS.topRight.tag).toUpperCase(),
        subtitle: items[2]?.shortDesc || COMPANIONS.topRight.subtitle,
        image: items[2]?.imageUrl || COMPANIONS.topRight.image,
      },
      bottomRight: {
        name: items[3]?.name || COMPANIONS.bottomRight.name,
        tag: (items[3]?.type || COMPANIONS.bottomRight.tag).toUpperCase(),
        subtitle: items[3]?.shortDesc || COMPANIONS.bottomRight.subtitle,
        image: items[3]?.imageUrl || COMPANIONS.bottomRight.image,
      },
    };
  }, [remoteDestinations]);

  const centerDestinationImage = useMemo(() => {
    if (remoteDestinations && remoteDestinations.length > 0) {
      const munnar = remoteDestinations.find((d) => d.name.toLowerCase().includes('munnar'));
      if (munnar?.imageUrl) return munnar.imageUrl;
    }
    return '/images/dest_3_munnar.jpg';
  }, [remoteDestinations]);

  const mobileDestinations = useMemo(() => {
    if (remoteDestinations && remoteDestinations.length > 0) {
      const published = remoteDestinations.filter((d) => d.published);
      const items = published.length > 0 ? published : remoteDestinations;
      return items.map((d) => ({
        name: d.name,
        image: d.imageUrl || '/images/dest_1_wayanad.jpg',
        tag: (d.type || 'SANCTUARY').toUpperCase(),
      }));
    }
    return [
      { name: 'Munnar Highlands', image: '/images/dest_3_munnar.jpg', tag: 'HIGHLANDS' },
      { name: 'Alleppey Backwaters', image: '/images/tour_1_backwaters.jpg', tag: 'BACKWATERS' },
      { name: 'Wayanad Rainforest', image: '/images/dest_1_wayanad.jpg', tag: 'RAINFOREST' },
      { name: 'Fort Kochi Heritage', image: '/images/hero/sleeba-thomas-7FNVvI2Lezc-unsplash.jpg', tag: 'HERITAGE' },
      { name: 'Varkala Sea Cliffs', image: '/images/dest_5_varkala.jpg', tag: 'COASTLINE' },
    ];
  }, [remoteDestinations]);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(typeof window !== 'undefined' ? window.innerWidth >= 900 : true);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Ensure experience video plays smoothly
  useEffect(() => {
    if (expVideoRef.current) {
      expVideoRef.current.play().catch(() => {});
    }
  }, []);

  // Synchronize active hero video playback on slide change or play/pause toggle
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    heroVideoRefs.current.forEach((videoEl, idx) => {
      if (!videoEl) return;
      if (idx === currentSlide) {
        if (isPlaying) {
          videoEl.currentTime = 0;
          videoEl.play().catch(() => {});
        } else {
          videoEl.pause();
        }
      } else {
        // Smoothly pause previous video after crossfade transition
        const timer = setTimeout(() => {
          if (videoEl && idx !== currentSlide) {
            videoEl.pause();
          }
        }, 1200);
        timers.push(timer);
      }
    });
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [currentSlide, isPlaying]);

  // Hero video carousel loop (continuously repeats through the 2 hero videos)
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((curr) => (curr + 1) % HERO_VIDEOS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Synchronized scroll listener
  useEffect(() => {
    let rafId: number | null = null;

    const updateScroll = () => {
      if (!containerRef.current || !isDesktop) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollDistance = rect.height - window.innerHeight;
      if (scrollDistance > 0) {
        const rawProgress = -rect.top / scrollDistance;
        const clamped = Math.min(1, Math.max(0, rawProgress));
        setScrollProgress(clamped);
      }
    };

    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        updateScroll();
        rafId = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    const lenis = (window as any).lenis;
    if (lenis) {
      lenis.on('scroll', handleScroll);
    }
    updateScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (lenis) {
        lenis.off('scroll', handleScroll);
      }
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isDesktop]);

  const handleQuickSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const filterData = {
      destination: destination || 'All Kerala',
      dates: dates || 'Flexible Dates',
      experience: experience || 'Curated Highlights',
      guests: guests || '2 Guests'
    };
    if (onSelectFilter) onSelectFilter(filterData);
    if (onOpenEnquiry) onOpenEnquiry(filterData);
  };

  const handleCardClick = (destName: string) => {
    if (onSelectDestination) onSelectDestination({ name: destName });
    if (onOpenEnquiry) onOpenEnquiry({ destination: destName });
  };

  const handleExpCardClick = (title: string, location: string) => {
    if (onOpenEnquiry) {
      onOpenEnquiry({
        experience: title,
        destination: location,
        interest: `Signature Experience: ${title}`
      });
    }
  };

  // Phase 1 scroll progress (0 -> 1): happens during first 26% of total scroll distance
  const phase1Progress = Math.min(1, Math.max(0, scrollProgress / 0.26));

  // Auto-animate rearrangement when Phase 1 completes, with smooth reversal when scrolled back up
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (phase1Progress >= 0.96) {
      if (!isRearranged) {
        setIsRearranged(true);
        setIsTransitioning(true);
        timer = setTimeout(() => setIsTransitioning(false), 900);
      }
    } else if (phase1Progress < 0.88) {
      if (isRearranged) {
        setIsRearranged(false);
        setIsTransitioning(true);
        timer = setTimeout(() => setIsTransitioning(false), 900);
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [phase1Progress, isRearranged]);

  // Interpolated progress calculations
  // Phase 1 (0 -> 0.55): Hero shrinks into center card
  const shrinkRaw = Math.min(1, phase1Progress / 0.55);
  const shrinkEase = shrinkRaw < 0.5
    ? 2 * shrinkRaw * shrinkRaw
    : 1 - Math.pow(-2 * shrinkRaw + 2, 2) / 2;

  // Smooth crossfade between Opening Hero Media and Destination Sanctuary Card Media:
  // Starts after the shrink begins (~0.10) and finishes as the card settles into the bento grid (~0.70)
  const destImageRaw = Math.min(1, Math.max(0, (shrinkRaw - 0.10) / 0.60));
  const destImageEase = destImageRaw < 0.5
    ? 2 * destImageRaw * destImageRaw
    : 1 - Math.pow(-2 * destImageRaw + 2, 2) / 2;

  // Hero text and search bar fade out during first 35% of Phase 1
  const heroTextOpacity = Math.max(0, 1 - phase1Progress * 2.8);
  const heroTextSlide = phase1Progress * 75; // px
  const searchBarOpacity = Math.max(0, 1 - phase1Progress * 3.5);
  const searchBarSlide = phase1Progress * 40;

  // Phase 2 (0.35 -> 1.0 of Phase 1): Companion Bento cards slide into Lightship staggered positions
  const bentoRaw = Math.min(1, Math.max(0, (phase1Progress - 0.35) / 0.65));
  const bentoEase = bentoRaw < 0.5
    ? 2 * bentoRaw * bentoRaw
    : 1 - Math.pow(-2 * bentoRaw + 2, 2) / 2;

  // Staggered slide trajectories matching the shape cards
  const leftCard1SlideX = (1 - bentoEase) * -240;
  const leftCard1SlideY = (1 - bentoEase) * -50;
  const leftCard2SlideX = (1 - bentoEase) * -190;
  const rightCard4SlideX = (1 - bentoEase) * 190;
  const rightCard5SlideX = (1 - bentoEase) * 240;
  const rightCard5SlideY = (1 - bentoEase) * 50;
  const bentoCardOpacity = bentoEase;

  // Center card label fade in as bento docks
  const centerLabelOpacity = Math.min(1, Math.max(0, (phase1Progress - 0.6) / 0.35));

  // Phase 3 scroll progress (0 -> 1): Center card expands to Fullscreen Experience Video (scroll 0.40 -> 0.68)
  const phase3Raw = Math.min(1, Math.max(0, (scrollProgress - 0.40) / 0.28));

  // Destination heading glides up and fades out during first 22% of Phase 3
  const headingExitRaw = Math.min(1, phase3Raw / 0.22);
  const headingExitEase = headingExitRaw < 0.5 ? 2 * headingExitRaw * headingExitRaw : 1 - Math.pow(-2 * headingExitRaw + 2, 2) / 2;

  // Center card expands to 100vw x 100vh between 0.0 and 0.72 of Phase 3
  // Leaving 0.72 to 1.0 as a steady resting fullscreen experience hero!
  const expandRaw = Math.min(1, phase3Raw / 0.72);
  const expandEase = expandRaw < 0.5 ? 2 * expandRaw * expandRaw : 1 - Math.pow(-2 * expandRaw + 2, 2) / 2;

  // Experience section info reveals as card reaches full width (between 0.65 and 0.95 of expandRaw)
  const expInfoProgress = Math.min(1, Math.max(0, (expandRaw - 0.65) / 0.30));
  const expInfoEase = expInfoProgress < 0.5 ? 2 * expInfoProgress * expInfoProgress : 1 - Math.pow(-2 * expInfoProgress + 2, 2) / 2;

  // Phase 4 scroll progress (0 -> 1): Heading moves to top + Video card transforms alongside 3 other cards (scroll 0.68 -> 1.00)
  const phase4Raw = Math.min(1, Math.max(0, (scrollProgress - 0.68) / 0.30));
  const phase4Ease = phase4Raw < 0.5 ? 2 * phase4Raw * phase4Raw : 1 - Math.pow(-2 * phase4Raw + 2, 2) / 2;

  // Heading moves smoothly to the top during Phase 4 transition
  const headingMoveRaw = Math.min(1, phase4Raw / 0.85);
  const headingMoveEase = headingMoveRaw < 0.5
    ? 2 * headingMoveRaw * headingMoveRaw
    : 1 - Math.pow(-2 * headingMoveRaw + 2, 2) / 2;

  // Side destination cards fade out completely once center card expands
  const sideCardsOpacity = phase4Raw > 0
    ? 0
    : bentoCardOpacity * Math.max(0, 1 - Math.max(0, expandRaw - 0.85) / 0.15);

  // Stage 2 Layout & Animation Constants (Symmetrical 3-Column: Left 2 cards, Center Munnar, Right 2 cards)
  const rearrangeTransition = 'transform 0.85s cubic-bezier(0.16, 1, 0.3, 1), width 0.85s cubic-bezier(0.16, 1, 0.3, 1), height 0.85s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.85s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.7s ease';
  const colWidth = 'clamp(280px, 23.5vw, 360px)';
  const munnarWidth = 'clamp(360px, 30vw, 450px)';
  const gridGap = 'clamp(16px, 1.8vw, 24px)';
  const card2x2Height = 'clamp(225px, 29.5vh, 275px)';
  const munnarFeaturedHeight = `calc(2 * ${card2x2Height} + clamp(14px, 1.8vh, 18px))`;

  // Stage 4 (4 Experience Cards Grid Constants)
  const expCardWidth = 'clamp(240px, 21.5vw, 315px)';
  const expCardHeight = 'clamp(355px, 48vh, 440px)';
  const expCardGap = 'clamp(14px, 1.5vw, 22px)';
  const expCardOffsetY = 'clamp(54px, 8.5vh, 80px)';

  // Center card interpolated width & height during Phase 3 Fullscreen Expansion & Phase 4 Card Metamorphosis
  const centerCardWidth = phase4Raw > 0
    ? `calc(100vw - (100vw - ${expCardWidth}) * ${phase4Ease})`
    : phase3Raw > 0
      ? `calc(${munnarWidth} + (100vw - ${munnarWidth}) * ${expandEase})`
      : isRearranged
        ? munnarWidth
        : `calc(100vw - (100vw - clamp(350px, 29vw, 440px)) * ${shrinkEase})`;

  const centerCardHeight = phase4Raw > 0
    ? `calc(100vh - (100vh - ${expCardHeight}) * ${phase4Ease})`
    : phase3Raw > 0
      ? `calc(${munnarFeaturedHeight} + (100vh - ${munnarFeaturedHeight}) * ${expandEase})`
      : isRearranged
        ? munnarFeaturedHeight
        : `calc(100vh - (100vh - clamp(620px, 80vh, 850px)) * ${shrinkEase})`;

  const centerCardTransform = phase4Raw > 0
    ? `translate(calc(-1.5 * (${expCardWidth} + ${expCardGap}) * ${phase4Ease}), calc(${expCardOffsetY} * ${phase4Ease}))`
    : 'translateX(0px)';

  const centerBorderRadius = phase4Raw > 0
    ? phase4Ease * 22
    : phase3Raw > 0
      ? (1 - expandEase) * 22
      : isRearranged
        ? 22
        : shrinkEase * 28; // 0px to 28px

  const centerShadow = phase4Raw > 0
    ? 0.35 * phase4Ease
    : phase3Raw > 0
      ? (1 - expandEase) * 0.22
      : shrinkEase * 0.22;

  return (
    <section
      id="hero"
      ref={containerRef}
      style={{
        position: 'relative',
        backgroundColor: (phase3Raw > 0.82 || phase4Raw > 0) ? '#0B1410' : '#FFFFFF',
        transition: 'background-color 0.4s ease',
        height: isDesktop ? '580vh' : 'auto',
        minHeight: '100vh',
        width: '100%'
      }}
    >
      {/* Anchor for nav #destinations jump link */}
      <span
        id="destinations"
        style={{
          position: 'absolute',
          top: isDesktop ? '150vh' : '650px',
          pointerEvents: 'none'
        }}
      />

      {/* Anchor for nav #experiences jump link */}
      <span
        id="experiences"
        style={{
          position: 'absolute',
          top: isDesktop ? '390vh' : '1080px',
          pointerEvents: 'none'
        }}
      />

      {/* Sticky Viewport Stage (Desktop) */}
      <div
        style={{
          position: isDesktop ? 'sticky' : 'relative',
          top: 0,
          height: isDesktop ? '100vh' : 'auto',
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: phase3Raw > 0.82 ? '#0B1410' : '#FFFFFF',
          transition: 'background-color 0.4s ease',
          padding: isDesktop ? '0' : '5.5rem 1.25rem 4rem'
        }}
      >

        {/* ======================================================== */}
        {/* DESKTOP LIGHTSHIP SCROLL-DRIVEN HERO & BENTO SHOWCASE    */}
        {/* ======================================================== */}
        {isDesktop ? (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            {/* Centered Discover More, Travel Further Typography */}
            {heroTextOpacity > 0.01 && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 8,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1.5rem 1.5rem 0',
                  margin: '0 auto'
                }}
              >
                <div
                  style={{
                    opacity: heroTextOpacity,
                    transform: `translateY(-${heroTextSlide * 0.7}px)`,
                    textAlign: 'center',
                    maxWidth: '1100px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      textTransform: 'uppercase',
                      fontSize: 'clamp(0.78rem, 0.9vw, 0.88rem)',
                      letterSpacing: '0.24em',
                      color: '#D4AF37',
                      fontWeight: 700,
                      marginBottom: '1rem',
                      textShadow: '0 2px 10px rgba(0, 0, 0, 0.85)'
                    }}
                  >
                    GOD'S OWN COUNTRY
                  </span>

                  <h1
                    className="font-display"
                    style={{
                      fontSize: 'clamp(3.8rem, 7.5vw, 6.8rem)',
                      color: '#FFFFFF',
                      lineHeight: 0.92,
                      letterSpacing: '0.03em',
                      textTransform: 'uppercase',
                      margin: 0,
                      textShadow: '0 6px 30px rgba(0, 0, 0, 0.7), 0 2px 8px rgba(0, 0, 0, 0.85)'
                    }}
                  >
                    DISCOVER MORE, <br />
                    TRAVEL FURTHER.
                  </h1>
                </div>
              </div>
            )}

            {/* Floating Plan A Journey Quick Bar (Initial Screen) - Temporarily hidden per user request */}
            {SHOW_HERO_SEARCH_BAR && searchBarOpacity > 0.01 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '3.75rem',
                  left: '50%',
                  transform: `translate(-50%, ${searchBarSlide}px)`,
                  zIndex: 10,
                  opacity: searchBarOpacity,
                  pointerEvents: searchBarOpacity > 0.3 ? 'auto' : 'none',
                  width: '92%',
                  maxWidth: '920px'
                }}
              >
                <form
                  onSubmit={handleQuickSearch}
                  className="hero-journey-bar"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.94)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.9)',
                    borderRadius: '9999px',
                    padding: '0.42rem 0.5rem 0.42rem 1.25rem',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.32), 0 2px 8px rgba(0, 0, 0, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  {/* Field 1: Destinations */}
                  <div className="hero-filter-cell" style={{ flex: 1.15 }}>
                    <select
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="hero-native-overlay-select"
                      aria-label="Destinations"
                    >
                      <option value="" disabled hidden>Destinations</option>
                      <option value="All Destinations">All Destinations</option>
                      {remoteDestinations && remoteDestinations.length > 0 ? (
                        remoteDestinations.filter(d => d.published).map(d => (
                          <option key={d.id} value={d.name}>{d.name} {d.region ? `(${d.region})` : ''}</option>
                        ))
                      ) : (
                        <>
                          <option value="Munnar Tea Highlands">Munnar Tea Highlands</option>
                          <option value="Alleppey Backwaters">Alleppey Backwaters</option>
                          <option value="Wayanad Rainforest">Wayanad Rainforest</option>
                          <option value="Fort Kochi Heritage">Fort Kochi Heritage</option>
                          <option value="Varkala Sea Cliffs">Varkala Sea Cliffs</option>
                        </>
                      )}
                    </select>
                    <MapPin size={14} color="#B48235" style={{ flexShrink: 0 }} />
                    <span className="hero-filter-label">{destination || 'DESTINATIONS'}</span>
                    <ChevronDown size={12} color="rgba(18, 19, 22, 0.45)" style={{ flexShrink: 0 }} />
                  </div>

                  <div className="hero-filter-divider" />

                  {/* Field 2: Dates */}
                  <div className="hero-filter-cell" style={{ flex: 1.1 }}>
                    <select
                      value={dates}
                      onChange={(e) => setDates(e.target.value)}
                      className="hero-native-overlay-select"
                      aria-label="Travel Date"
                    >
                      <option value="" disabled hidden>Travel Date</option>
                      <option value="Flexible Dates">Flexible Dates</option>
                      <option value="Nov - Mar 2026">Nov - Mar (Winter Peak)</option>
                      <option value="Apr - Jun 2026">Apr - Jun (Summer)</option>
                      <option value="Monsoon Healing">Monsoon Healing (Jul-Aug)</option>
                    </select>
                    <Calendar size={14} color="#B48235" style={{ flexShrink: 0 }} />
                    <span className="hero-filter-label">{dates || 'TRAVEL DATE'}</span>
                    <ChevronDown size={12} color="rgba(18, 19, 22, 0.45)" style={{ flexShrink: 0 }} />
                  </div>

                  <div className="hero-filter-divider" />

                  {/* Field 3: Style */}
                  <div className="hero-filter-cell" style={{ flex: 1.1 }}>
                    <select
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="hero-native-overlay-select"
                      aria-label="Experience"
                    >
                      <option value="" disabled hidden>Experience</option>
                      <option value="Curated Highlights">Curated Highlights</option>
                      <option value="Backwaters & Hills">Backwaters & Hills</option>
                      <option value="Ayurveda Wellness">Ayurveda Wellness</option>
                      <option value="Colonial Stays">Colonial Planter Stays</option>
                    </select>
                    <Compass size={14} color="#B48235" style={{ flexShrink: 0 }} />
                    <span className="hero-filter-label">{experience || 'EXPERIENCE'}</span>
                    <ChevronDown size={12} color="rgba(18, 19, 22, 0.45)" style={{ flexShrink: 0 }} />
                  </div>

                  <div className="hero-filter-divider" />

                  {/* Field 4: Guests */}
                  <div className="hero-filter-cell" style={{ flex: 0.9 }}>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      className="hero-native-overlay-select"
                      aria-label="Guests"
                    >
                      <option value="" disabled hidden>Guests</option>
                      <option value="2 Guests">2 Guests (Couple)</option>
                      <option value="1 Solo Guest">1 Solo Guest</option>
                      <option value="3-5 Family">3-5 Guests (Family)</option>
                      <option value="6+ Group">6+ Guests (Private Charter)</option>
                    </select>
                    <Users size={14} color="#B48235" style={{ flexShrink: 0 }} />
                    <span className="hero-filter-label">{guests || 'GUESTS'}</span>
                    <ChevronDown size={12} color="rgba(18, 19, 22, 0.45)" style={{ flexShrink: 0 }} />
                  </div>

                  {/* Search Button */}
                  <button
                    type="submit"
                    className="btn-pill btn-gold shimmer-sweep hero-filter-btn"
                  >
                    <span>Plan a Journey</span>
                    <ArrowRight size={14} />
                  </button>
                </form>

                {/* Bottom "Scroll to explore" Hint */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginTop: '1.2rem',
                    color: 'rgba(255, 255, 255, 0.85)',
                    fontSize: '0.74rem',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    textShadow: '0 2px 6px rgba(0,0,0,0.6)'
                  }}
                >
                  <span>Scroll to explore Kerala</span>
                  <ChevronDown size={14} className="bounce-subtle" />
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* THE DESTINATION STAGE (STAGE 1: BENTO -> STAGE 2: FEATURED GRID -> STAGE 3: EXPERIENCES EXPANSION) */}
            {/* ======================================================== */}
            <div
              style={{
                width: '100%',
                maxWidth: '100vw',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                position: 'relative',
                zIndex: 6
              }}
            >
              {/* Destination Section Heading (Reveals smoothly in Stage 2, fades out in Stage 3) */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '1440px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  padding: '0 1.5rem',
                  opacity: Math.max(0, (isRearranged ? 1 : 0) * (1 - headingExitEase * 1.5)),
                  transform: phase3Raw > 0
                    ? `translateY(${-headingExitEase * 45}px)`
                    : (isRearranged ? 'translateY(0)' : 'translateY(-22px)'),
                  maxHeight: isRearranged ? `calc(135px * ${1 - headingExitEase})` : '0px',
                  marginBottom: isRearranged ? `calc(clamp(12px, 1.6vh, 20px) * ${1 - headingExitEase})` : '0px',
                  overflow: 'hidden',
                  pointerEvents: (isRearranged && headingExitEase < 0.2) ? 'auto' : 'none',
                  transition: phase3Raw > 0
                    ? 'none'
                    : 'opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1), transform 0.75s cubic-bezier(0.16, 1, 0.3, 1), max-height 0.75s cubic-bezier(0.16, 1, 0.3, 1), margin-bottom 0.75s cubic-bezier(0.16, 1, 0.3, 1)',
                  zIndex: 10
                }}
              >
                {/* Eyebrow Badge */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.35rem 0.95rem',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(180, 130, 53, 0.09)',
                    border: '1px solid rgba(180, 130, 53, 0.28)',
                    marginBottom: '0.45rem'
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#B48235',
                      display: 'inline-block'
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: '#9E6F29'
                    }}
                  >
                    KERALA SANCTUARIES
                  </span>
                </div>

                {/* Section Title */}
                <h2
                  className="font-display"
                  style={{
                    fontSize: 'clamp(1.95rem, 2.7vw, 2.65rem)',
                    color: '#121316',
                    lineHeight: 1.15,
                    letterSpacing: '0.02em',
                    fontWeight: 400,
                    margin: '0 0 0.35rem 0'
                  }}
                >
                  Sanctuaries of{' '}
                  <span
                    style={{
                      fontStyle: 'italic',
                      color: '#9E6F29',
                      fontFamily: 'var(--font-serif)',
                      fontWeight: 400
                    }}
                  >
                    Timeless Calm
                  </span>
                </h2>

                {/* Subtitle */}
                <p
                  style={{
                    fontSize: 'clamp(0.85rem, 0.95vw, 0.92rem)',
                    color: '#5A626A',
                    lineHeight: 1.5,
                    margin: 0,
                    maxWidth: '620px'
                  }}
                >
                  Five iconic landscapes crafted for stillness • 100% private bespoke departures.
                </p>
              </div>

              {/* The 3 Columns Grid Row */}
              <div
                className="bento-stage-grid"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: phase4Raw > 0 ? '0px' : gridGap,
                  position: 'relative'
                }}
              >
                {/* ---------------------------------------------------- */}
                {/* COLUMN 1: LEFT COMPANIONS (Alleppey Wide & Wayanad Narrow) */}
                {/* ---------------------------------------------------- */}
                <div
                  style={{
                    width: colWidth,
                    display: phase4Raw > 0 ? 'none' : 'flex',
                    flexDirection: 'column',
                    alignItems: isRearranged ? 'stretch' : 'flex-end',
                    gap: isRearranged ? 'clamp(14px, 1.8vh, 18px)' : 'clamp(14px, 1.8vh, 20px)',
                    opacity: sideCardsOpacity,
                    pointerEvents: (bentoCardOpacity > 0.4 && expandRaw < 0.2) ? 'auto' : 'none',
                    flexShrink: 0,
                    alignSelf: 'center',
                    transform: 'translateX(0px)',
                    transition: (phase3Raw === 0 && (isRearranged || isTransitioning)) ? rearrangeTransition : 'none',
                    zIndex: 2
                  }}
                >
                  {/* Card 1: Alleppey Backwaters */}
                  <div
                    onClick={() => handleCardClick(liveCompanions.topLeft.name)}
                    className="bento-companion-card"
                    style={{
                      width: '100%',
                      height: isRearranged ? card2x2Height : 'clamp(220px, 28vh, 300px)',
                      position: 'relative',
                      borderRadius: isRearranged ? 'clamp(18px, 1.6vw, 22px)' : 'clamp(22px, 2vw, 28px)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)',
                      backgroundColor: '#121316',
                      transform: isRearranged
                        ? 'scale(1)'
                        : `translateX(${leftCard1SlideX}px) translateY(${leftCard1SlideY}px) scale(${0.92 + 0.08 * bentoEase})`,
                      transition: (phase3Raw === 0 && (isRearranged || isTransitioning)) ? rearrangeTransition : 'none',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <img
                      src={liveCompanions.topLeft.image}
                      alt={liveCompanions.topLeft.name}
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
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.86) 100%)'
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '1.3rem 1.45rem',
                        color: '#FFFFFF'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.66rem',
                          letterSpacing: '0.18em',
                          color: '#D4AF37',
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}
                      >
                        {liveCompanions.topLeft.tag}
                      </span>
                      <h3
                        className="font-display"
                        style={{
                          fontSize: 'clamp(1.18rem, 1.35vw, 1.32rem)',
                          margin: '0.2rem 0',
                          color: '#FFFFFF',
                          lineHeight: 1.15
                        }}
                      >
                        {liveCompanions.topLeft.name}
                      </h3>
                      <p
                        style={{
                          fontSize: 'clamp(0.72rem, 0.8vw, 0.78rem)',
                          color: 'rgba(255, 255, 255, 0.82)',
                          margin: 0
                        }}
                      >
                        {liveCompanions.topLeft.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Wayanad Rainforest */}
                  <div
                    onClick={() => handleCardClick(liveCompanions.bottomLeft.name)}
                    className="bento-companion-card"
                    style={{
                      width: isRearranged ? '100%' : 'clamp(240px, 21vw, 330px)',
                      height: isRearranged ? card2x2Height : 'clamp(195px, 25vh, 265px)',
                      position: 'relative',
                      borderRadius: isRearranged ? 'clamp(18px, 1.6vw, 22px)' : 'clamp(18px, 1.6vw, 24px)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)',
                      backgroundColor: '#121316',
                      alignSelf: isRearranged ? 'stretch' : 'flex-end',
                      transform: isRearranged
                        ? 'scale(1)'
                        : `translateX(${leftCard2SlideX}px) scale(${0.92 + 0.08 * bentoEase})`,
                      transition: (phase3Raw === 0 && (isRearranged || isTransitioning)) ? rearrangeTransition : 'none',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <img
                      src={liveCompanions.bottomLeft.image}
                      alt={liveCompanions.bottomLeft.name}
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
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.86) 100%)'
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '1.3rem 1.45rem',
                        color: '#FFFFFF'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.66rem',
                          letterSpacing: '0.18em',
                          color: '#D4AF37',
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}
                      >
                        {liveCompanions.bottomLeft.tag}
                      </span>
                      <h3
                        className="font-display"
                        style={{
                          fontSize: 'clamp(1.18rem, 1.35vw, 1.32rem)',
                          margin: '0.2rem 0',
                          color: '#FFFFFF',
                          lineHeight: 1.15
                        }}
                      >
                        {liveCompanions.bottomLeft.name}
                      </h3>
                      <p
                        style={{
                          fontSize: 'clamp(0.72rem, 0.8vw, 0.78rem)',
                          color: 'rgba(255, 255, 255, 0.82)',
                          margin: 0
                        }}
                      >
                        {liveCompanions.bottomLeft.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Invisible Balance Spacer */}
                  <div
                    style={{
                      height: isRearranged ? '0px' : 'clamp(180px, 22vh, 230px)',
                      visibility: 'hidden',
                      pointerEvents: 'none',
                      overflow: 'hidden',
                      transition: (phase3Raw === 0 && (isRearranged || isTransitioning)) ? 'height 0.85s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'
                    }}
                    aria-hidden="true"
                  />
                </div>

                {/* ---------------------------------------------------- */}
                {/* COLUMN 2: CENTER SHRINKING HERO CARD (FEATURED MUNNAR -> FULLSCREEN EXPERIENCES) */}
                {/* ---------------------------------------------------- */}
                <div
                  style={{
                    position: 'relative',
                    width: centerCardWidth,
                    height: centerCardHeight,
                    borderRadius: `${centerBorderRadius}px`,
                    boxShadow: `0 24px 60px rgba(0, 0, 0, ${centerShadow})`,
                    overflow: 'hidden',
                    zIndex: phase4Raw > 0 ? 6 : 5,
                    backgroundColor: '#0B1410',
                    cursor: (phase1Progress > 0.4 && phase3Raw < 0.15) ? 'pointer' : (phase4Raw > 0.6 ? 'pointer' : 'default'),
                    flexShrink: 0,
                    alignSelf: 'center',
                    transform: centerCardTransform,
                    transition: (phase3Raw === 0 && (isRearranged || isTransitioning)) ? rearrangeTransition : 'none',
                    border: phase4Raw > 0.1 ? '1px solid rgba(255, 255, 255, 0.14)' : (phase3Raw > 0.05 ? 'none' : (shrinkEase > 0.3 ? '1px solid rgba(0, 0, 0, 0.08)' : 'none'))
                  }}
                  onClick={() => {
                    if (phase1Progress > 0.4 && phase3Raw < 0.15) {
                      handleCardClick('Munnar Tea Highlands');
                    } else if (phase4Raw > 0.6) {
                      handleExpCardClick('Private Chef Twilight Cruise', 'Alleppey Waters');
                    }
                  }}
                  className="bento-center-card"
                >
                  {/* Layer 1: Opening Hero Video Carousel (Cinematic 4K/HD Videos from public/hero) */}
                  {HERO_VIDEOS.map((slide, idx) => {
                    const isActive = idx === currentSlide;
                    const heroVideoOpacity = isActive
                      ? Math.max(0, (1 - destImageEase) * (1 - expandRaw * 1.5))
                      : 0;
                    return (
                      <div
                        key={slide.id}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          opacity: heroVideoOpacity,
                          transform: isActive ? 'scale(1.02)' : 'scale(1.0)',
                          transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), transform 8s cubic-bezier(0.16, 1, 0.3, 1)',
                          zIndex: 1,
                          overflow: 'hidden',
                          pointerEvents: 'none',
                          backgroundColor: '#0B1410'
                        }}
                      >
                        <video
                          ref={(el) => { heroVideoRefs.current[idx] = el; }}
                          autoPlay
                          muted
                          playsInline
                          preload="auto"
                          onEnded={() => {
                            if (idx === currentSlide && isPlaying) {
                              setCurrentSlide((curr) => (curr + 1) % HERO_VIDEOS.length);
                            }
                          }}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                            backgroundColor: '#0B1410'
                          }}
                        >
                          <source src={slide.video} type="video/mp4" />
                        </video>
                      </div>
                    );
                  })}

                  {/* Layer 2: Dedicated Destination Card Image (Munnar Tea Highlands - Crossfades in as hero card shrinks into bento) */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `url('${centerDestinationImage}')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center 48%',
                      opacity: destImageEase > 0.01 ? Math.min(1, destImageEase * 1.25) * Math.max(0, 1 - expandRaw * 1.5) : 0,
                      display: destImageEase > 0.01 ? 'block' : 'none',
                      transform: `scale(${1.06 - 0.06 * destImageEase})`,
                      zIndex: 2,
                      transition: 'background-image 0.5s ease',
                      pointerEvents: 'none'
                    }}
                  />

                  {/* Layer 3: Flagship Experience Video Layer (Smoothly fades in as center card expands in Phase 3) */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: Math.min(1, expandRaw * 1.8),
                      transform: `scale(${1.08 - 0.08 * expandEase})`,
                      zIndex: 3,
                      pointerEvents: 'none',
                      overflow: 'hidden'
                    }}
                  >
                    <video
                      ref={expVideoRef}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    >
                      <source src="/Experience-section/12881094-hd_1920_1080_30fps.mp4" type="video/mp4" />
                    </video>
                  </div>

                  {/* Luxury Ambient & Vignette Overlays */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `linear-gradient(180deg, rgba(11, 20, 16, ${0.25 + 0.45 * expInfoEase}) 0%, rgba(11, 20, 16, ${0.15 + 0.25 * expInfoEase}) 35%, rgba(11, 20, 16, ${0.2 + 0.45 * expInfoEase}) 65%, rgba(11, 20, 16, ${0.65 + 0.3 * expInfoEase}) 100%)`,
                      zIndex: 4,
                      pointerEvents: 'none'
                    }}
                  />



                  {/* Center Card Destination Details (Fades in when docked, fades out on expansion) */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '2rem 1.75rem',
                      color: '#FFFFFF',
                      zIndex: 4,
                      opacity: Math.max(0, centerLabelOpacity * (1 - expandRaw * 3.5)),
                      transform: `translateY(${expandEase * 25}px)`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                      pointerEvents: (centerLabelOpacity > 0.4 && expandRaw < 0.1) ? 'auto' : 'none'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.72rem',
                        letterSpacing: '0.2em',
                        color: '#D4AF37',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}
                    >
                      CENTRAL HIGHLANDS • 1,600M
                    </span>
                    <h3
                      className="font-display"
                      style={{
                        fontSize: 'clamp(1.45rem, 1.8vw, 1.75rem)',
                        margin: 0,
                        color: '#FFFFFF',
                        lineHeight: 1.1
                      }}
                    >
                      Munnar Tea Highlands
                    </h3>
                    <p
                      style={{
                        fontSize: 'clamp(0.8rem, 0.9vw, 0.86rem)',
                        color: 'rgba(255, 255, 255, 0.82)',
                        margin: 0,
                        lineHeight: 1.45
                      }}
                    >
                      Misty summits, 150-year-old planter estates, and golden sunrise tea trails.
                    </p>
                    <div style={{ marginTop: '0.5rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          padding: '0.45rem 1.1rem',
                          borderRadius: '999px',
                          backgroundColor: 'rgba(255, 255, 255, 0.16)',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: '#FFFFFF'
                        }}
                      >
                        Explore Munnar <ArrowUpRight size={14} />
                      </span>
                    </div>
                  </div>

                  {/* Card 1 Experience Details: Private Chef Twilight Cruise (Fades in during Phase 4) */}
                  {phase4Raw > 0.05 && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '1.6rem 1.4rem',
                        color: '#FFFFFF',
                        zIndex: 8,
                        opacity: phase4Ease,
                        transform: `translateY(${(1 - phase4Ease) * 20}px)`,
                        background: 'linear-gradient(180deg, transparent 0%, rgba(11,20,16,0.92) 80%)',
                        pointerEvents: phase4Raw > 0.6 ? 'auto' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.68rem', letterSpacing: '0.18em', color: '#D4AF37', fontWeight: 700, textTransform: 'uppercase' }}>
                          EXCLUSIVE CHARTER
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.65)' }}>4 Hours</span>
                      </div>
                      <h3 className="font-display" style={{ fontSize: 'clamp(1.15rem, 1.3vw, 1.3rem)', color: '#FFFFFF', margin: '0 0 0.3rem 0', lineHeight: 1.2 }}>
                        Private Chef Twilight Cruise
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.78)', margin: '0 0 0.8rem 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        Drift along silent lagoons aboard a handcrafted Kettuvallam with your personal chef.
                      </p>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.4rem 0.95rem',
                          borderRadius: '999px',
                          backgroundColor: 'rgba(212, 175, 55, 0.18)',
                          border: '1px solid rgba(212, 175, 55, 0.45)',
                          color: '#E6C665',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase'
                        }}
                      >
                        Curate Experience <ArrowUpRight size={13} />
                      </span>
                    </div>
                  )}
                </div>

                {/* ---------------------------------------------------- */}
                {/* COLUMN 3: RIGHT COMPANIONS (Fort Kochi Narrow & Varkala Wide) */}
                {/* ---------------------------------------------------- */}
                <div
                  style={{
                    width: colWidth,
                    display: phase4Raw > 0 ? 'none' : 'flex',
                    flexDirection: 'column',
                    alignItems: isRearranged ? 'stretch' : 'flex-start',
                    gap: isRearranged ? 'clamp(14px, 1.8vh, 18px)' : 'clamp(14px, 1.8vh, 20px)',
                    opacity: sideCardsOpacity,
                    pointerEvents: (bentoCardOpacity > 0.4 && expandRaw < 0.2) ? 'auto' : 'none',
                    flexShrink: 0,
                    alignSelf: 'center',
                    transform: 'translateX(0px)',
                    transition: (phase3Raw === 0 && (isRearranged || isTransitioning)) ? rearrangeTransition : 'none',
                    zIndex: 2
                  }}
                >
                  {/* Invisible Top Balance Spacer */}
                  <div
                    style={{
                      height: isRearranged ? '0px' : 'clamp(180px, 22vh, 230px)',
                      visibility: 'hidden',
                      pointerEvents: 'none',
                      overflow: 'hidden',
                      transition: (phase3Raw === 0 && (isRearranged || isTransitioning)) ? 'height 0.85s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'
                    }}
                    aria-hidden="true"
                  />

                  {/* Card 4: Fort Kochi Harbour (Compact Indented Card) */}
                  <div
                    onClick={() => handleCardClick(liveCompanions.topRight.name)}
                    className="bento-companion-card"
                    style={{
                      width: isRearranged ? '100%' : 'clamp(240px, 21vw, 330px)',
                      height: isRearranged ? card2x2Height : 'clamp(195px, 25vh, 265px)',
                      position: 'relative',
                      borderRadius: isRearranged ? 'clamp(18px, 1.6vw, 22px)' : 'clamp(18px, 1.6vw, 24px)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)',
                      backgroundColor: '#121316',
                      alignSelf: isRearranged ? 'stretch' : 'flex-start',
                      transform: isRearranged
                        ? 'scale(1)'
                        : `translateX(${rightCard4SlideX}px) scale(${0.92 + 0.08 * bentoEase})`,
                      transition: (phase3Raw === 0 && (isRearranged || isTransitioning)) ? rearrangeTransition : 'none',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <img
                      src={liveCompanions.topRight.image}
                      alt={liveCompanions.topRight.name}
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
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.86) 100%)'
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '1.3rem 1.45rem',
                        color: '#FFFFFF'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.66rem',
                          letterSpacing: '0.18em',
                          color: '#D4AF37',
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}
                      >
                        {liveCompanions.topRight.tag}
                      </span>
                      <h3
                        className="font-display"
                        style={{
                          fontSize: 'clamp(1.18rem, 1.35vw, 1.32rem)',
                          margin: '0.2rem 0',
                          color: '#FFFFFF',
                          lineHeight: 1.15
                        }}
                      >
                        {liveCompanions.topRight.name}
                      </h3>
                      <p
                        style={{
                          fontSize: 'clamp(0.72rem, 0.8vw, 0.78rem)',
                          color: 'rgba(255, 255, 255, 0.82)',
                          margin: 0
                        }}
                      >
                        {liveCompanions.topRight.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Card 5: Varkala Sea Cliffs (Wide Landscape Card) */}
                  <div
                    onClick={() => handleCardClick(liveCompanions.bottomRight.name)}
                    className="bento-companion-card"
                    style={{
                      width: '100%',
                      height: isRearranged ? card2x2Height : 'clamp(220px, 28vh, 300px)',
                      position: 'relative',
                      borderRadius: isRearranged ? 'clamp(18px, 1.6vw, 22px)' : 'clamp(22px, 2vw, 28px)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)',
                      backgroundColor: '#121316',
                      transform: isRearranged
                        ? 'scale(1)'
                        : `translateX(${rightCard5SlideX}px) translateY(${rightCard5SlideY}px) scale(${0.92 + 0.08 * bentoEase})`,
                      transition: (phase3Raw === 0 && (isRearranged || isTransitioning)) ? rearrangeTransition : 'none',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <img
                      src={liveCompanions.bottomRight.image}
                      alt={liveCompanions.bottomRight.name}
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
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.86) 100%)'
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '1.3rem 1.45rem',
                        color: '#FFFFFF'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.66rem',
                          letterSpacing: '0.18em',
                          color: '#D4AF37',
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}
                      >
                        {liveCompanions.bottomRight.tag}
                      </span>
                      <h3
                        className="font-display"
                        style={{
                          fontSize: 'clamp(1.18rem, 1.35vw, 1.32rem)',
                          margin: '0.2rem 0',
                          color: '#FFFFFF',
                          lineHeight: 1.15
                        }}
                      >
                        {liveCompanions.bottomRight.name}
                      </h3>
                      <p
                        style={{
                          fontSize: 'clamp(0.72rem, 0.8vw, 0.78rem)',
                          color: 'rgba(255, 255, 255, 0.82)',
                          margin: 0
                        }}
                      >
                        {liveCompanions.bottomRight.subtitle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* Phase 4: Companion Experience Cards (Cards 2, 3, and 4) */}
                {/* ---------------------------------------------------- */}
                {phase4Raw > 0.01 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 5,
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {EXP_CARDS.map((card, idx) => {
                      const slotMultiplier = -0.5 + idx;
                      return (
                        <div
                          key={card.id}
                          onClick={() => handleExpCardClick(card.title, card.location)}
                          style={{
                            position: 'absolute',
                            width: expCardWidth,
                            height: expCardHeight,
                            borderRadius: '22px',
                            overflow: 'hidden',
                            boxShadow: `0 24px 60px rgba(0, 0, 0, ${0.35 * phase4Ease})`,
                            border: '1px solid rgba(255, 255, 255, 0.14)',
                            backgroundColor: '#0B1410',
                            transform: `translate(calc(${slotMultiplier} * (${expCardWidth} + ${expCardGap})), calc(${expCardOffsetY} + ${(1 - phase4Ease) * 55}px)) scale(${0.94 + 0.06 * phase4Ease})`,
                            opacity: phase4Ease,
                            pointerEvents: phase4Raw > 0.6 ? 'auto' : 'none',
                            cursor: 'pointer',
                            transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
                          }}
                          className="exp-showcase-card"
                        >
                          <img
                            src={card.image}
                            alt={card.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 45%, rgba(11,20,16,0.92) 100%)' }} />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.6rem 1.4rem', color: '#FFFFFF', zIndex: 2 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                              <span style={{ fontSize: '0.68rem', letterSpacing: '0.18em', color: '#D4AF37', fontWeight: 700, textTransform: 'uppercase' }}>
                                {card.tag}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.65)' }}>{card.duration}</span>
                            </div>
                            <h3 className="font-display" style={{ fontSize: 'clamp(1.15rem, 1.3vw, 1.3rem)', color: '#FFFFFF', margin: '0 0 0.3rem 0', lineHeight: 1.2 }}>
                              {card.title}
                            </h3>
                            <p style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.78)', margin: '0 0 0.8rem 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {card.desc}
                            </p>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.4rem 0.95rem',
                                borderRadius: '999px',
                                backgroundColor: 'rgba(212, 175, 55, 0.18)',
                                border: '1px solid rgba(212, 175, 55, 0.45)',
                                color: '#E6C665',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase'
                              }}
                            >
                              Curate Experience <ArrowUpRight size={13} />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ======================================================== */}
                {/* EXPERIENCE SECTION HERO & HEADING (Unified, Non-Overlapping) */}
                {/* ======================================================== */}
                {(expandRaw > 0.60 || phase4Raw > 0) && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: phase4Raw > 0
                        ? `translate(-50%, calc(-50% - ${(headingMoveEase * 28).toFixed(2)}vh))`
                        : 'translate(-50%, -50%)',
                      width: '100%',
                      maxWidth: '1200px',
                      padding: '0 1.5rem',
                      zIndex: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      opacity: expInfoEase,
                      pointerEvents: phase4Raw > 0.2 ? 'none' : (expInfoEase > 0.5 ? 'auto' : 'none')
                    }}
                  >
                    {/* Eyebrow Badge */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.55rem',
                        padding: phase4Raw > 0 ? '0.36rem 1.05rem' : '0.42rem 1.25rem',
                        borderRadius: '999px',
                        backgroundColor: 'rgba(212, 175, 55, 0.16)',
                        border: '1px solid rgba(212, 175, 55, 0.45)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        marginBottom: phase4Raw > 0 ? '0.65rem' : '1.35rem',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                        transition: 'padding 0.3s ease, margin 0.3s ease'
                      }}
                    >
                      <Sparkles size={phase4Raw > 0 ? 13 : 14} color="#D4AF37" />
                      <span
                        style={{
                          fontSize: phase4Raw > 0 ? '0.70rem' : '0.74rem',
                          fontWeight: 700,
                          letterSpacing: '0.24em',
                          textTransform: 'uppercase',
                          color: '#E6C665',
                          transition: 'font-size 0.3s ease'
                        }}
                      >
                        BREATHTAKING EXPERIENCES
                      </span>
                    </div>

                    {/* Grand Experience Headline */}
                    <h2
                      className="font-display"
                      style={{
                        fontSize: phase4Raw > 0
                          ? 'clamp(1.75rem, 2.35vw, 2.3rem)'
                          : 'clamp(2.4rem, 4.6vw, 4.2rem)',
                        color: '#FFFFFF',
                        lineHeight: 1.1,
                        letterSpacing: '0.02em',
                        fontWeight: 400,
                        margin: phase4Raw > 0
                          ? '0 0 clamp(0.35rem, 0.6vh, 0.55rem) 0'
                          : '0 0 1.2rem 0',
                        textShadow: '0 4px 28px rgba(0, 0, 0, 0.75)',
                        transition: 'font-size 0.35s ease, margin 0.35s ease'
                      }}
                    >
                      Moments Beyond{' '}
                      <span
                        style={{
                          fontStyle: 'italic',
                          color: '#E6C665',
                          fontFamily: 'var(--font-serif)'
                        }}
                      >
                        The Guidebooks
                      </span>
                    </h2>

                    {/* Editorial Subtitle */}
                    <p
                      style={{
                        fontSize: phase4Raw > 0 ? 'clamp(0.82rem, 0.88vw, 0.92rem)' : 'clamp(0.95rem, 1.15vw, 1.12rem)',
                        color: 'rgba(255, 255, 255, 0.82)',
                        lineHeight: 1.45,
                        margin: 0,
                        maxWidth: phase4Raw > 0 ? '620px' : '720px',
                        textShadow: '0 2px 12px rgba(0, 0, 0, 0.7)',
                        transition: 'font-size 0.35s ease, max-width 0.35s ease'
                      }}
                    >
                      Exclusive private charters, dawn tea cuppings in colonial bungalows, and sacred ritual arts accessible only through Escora's private local network.
                    </p>

                    {/* Phase 3 Action Block (Chip, CTA Button, Scroll Indicator) */}
                    {phase4Raw < 0.28 && (
                      <div
                        style={{
                          opacity: Math.max(0, 1 - phase4Raw * 4),
                          maxHeight: phase4Raw > 0 ? `${Math.max(0, (1 - phase4Raw * 4) * 240)}px` : 'auto',
                          overflow: 'hidden',
                          marginTop: phase4Raw > 0 ? `${Math.max(0, (1 - phase4Raw * 4) * 1.6)}rem` : '1.6rem',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          pointerEvents: (phase4Raw < 0.05 && expInfoEase > 0.5) ? 'auto' : 'none',
                          transition: 'opacity 0.2s ease'
                        }}
                      >
                        {/* Highlight Chip */}
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.5rem 1.35rem',
                            borderRadius: '999px',
                            backgroundColor: 'rgba(18, 19, 22, 0.72)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255, 255, 255, 0.22)',
                            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)'
                          }}
                        >
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              backgroundColor: '#D4AF37',
                              boxShadow: '0 0 10px #D4AF37',
                              display: 'inline-block'
                            }}
                          />
                          <span
                            style={{
                              fontSize: '0.76rem',
                              letterSpacing: '0.12em',
                              textTransform: 'uppercase',
                              color: '#FFFFFF',
                              fontWeight: 600
                            }}
                          >
                            Private Chef Twilight Cruise • Alleppey Waters
                          </span>
                        </div>

                        {/* CTA Button */}
                        <div style={{ marginTop: '1.4rem' }}>
                          <button
                            type="button"
                            onClick={() => {
                              if (onOpenEnquiry) {
                                onOpenEnquiry({
                                  experience: 'Private Chef Twilight Cruise',
                                  destination: 'Alleppey Waters',
                                  interest: 'Signature Experience: Private Chef Twilight Cruise'
                                });
                              }
                            }}
                            className="btn-pill btn-gold"
                            style={{
                              padding: '0.85rem 2.2rem',
                              fontSize: '0.86rem',
                              letterSpacing: '0.08em',
                              fontWeight: 700,
                              boxShadow: '0 12px 30px rgba(180, 130, 53, 0.45)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.6rem',
                              cursor: 'pointer'
                            }}
                          >
                            Curate Private Experience <ArrowRight size={15} />
                          </button>
                        </div>

                        {/* Scroll Indicator */}
                        <div
                          style={{
                            marginTop: '2.4rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: 'rgba(255, 255, 255, 0.82)',
                            fontSize: '0.72rem',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            fontWeight: 600,
                            textShadow: '0 2px 8px rgba(0, 0, 0, 0.7)'
                          }}
                        >
                          <span>Scroll to explore signature experiences</span>
                          <ChevronDown size={14} className="bounce-subtle" color="#D4AF37" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '580px', margin: '0 auto' }}>
            {/* Mobile Hero Visual Banner */}
            <div
              style={{
                position: 'relative',
                height: '420px',
                borderRadius: '24px',
                overflow: 'hidden',
                backgroundColor: '#121316',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.25)',
                marginBottom: '1.5rem'
              }}
            >
              {HERO_VIDEOS.map((slide, idx) => {
                const isActive = idx === currentSlide;
                return (
                  <video
                    key={slide.id}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      opacity: isActive ? 1 : 0,
                      transition: 'opacity 1.2s ease',
                      backgroundColor: '#0B1410'
                    }}
                  >
                    <source src={slide.video} type="video/mp4" />
                  </video>
                );
              })}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 100%)'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '1.5rem',
                  left: '1.5rem',
                  right: '1.5rem',
                  color: '#FFFFFF'
                }}
              >
                <span style={{ fontSize: '0.72rem', letterSpacing: '0.22em', color: '#D4AF37', fontWeight: 700, textTransform: 'uppercase' }}>
                  GOD'S OWN COUNTRY
                </span>
                <h1 className="font-display" style={{ fontSize: '2.4rem', margin: '0.35rem 0 0', color: '#FFFFFF', lineHeight: 0.95, textTransform: 'uppercase' }}>
                  DISCOVER MORE, <br />
                  TRAVEL FURTHER.
                </h1>
              </div>
            </div>

            {/* Mobile Filter Search Box - Temporarily hidden per user request */}
            {SHOW_HERO_SEARCH_BAR && (
              <form
                onSubmit={handleQuickSearch}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '1.25rem',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  marginBottom: '2rem'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="hero-filter-cell" style={{ background: '#F8F6F1', borderRadius: '12px', padding: '0.65rem' }}>
                    <select value={destination} onChange={(e) => setDestination(e.target.value)} className="hero-native-overlay-select">
                      <option value="" disabled hidden>Destinations</option>
                      <option value="All Destinations">All Destinations</option>
                      {remoteDestinations && remoteDestinations.length > 0 ? (
                        remoteDestinations.filter(d => d.published).map(d => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))
                      ) : (
                        <>
                          <option value="Munnar">Munnar Highlands</option>
                          <option value="Alleppey">Alleppey Backwaters</option>
                          <option value="Wayanad">Wayanad Rainforest</option>
                          <option value="Fort Kochi">Fort Kochi Heritage</option>
                          <option value="Varkala">Varkala Sea Cliffs</option>
                        </>
                      )}
                    </select>
                    <MapPin size={13} color="#B48235" />
                    <span className="hero-filter-label" style={{ fontSize: '0.74rem' }}>{destination || 'DESTINATIONS'}</span>
                  </div>

                  <div className="hero-filter-cell" style={{ background: '#F8F6F1', borderRadius: '12px', padding: '0.65rem' }}>
                    <select value={dates} onChange={(e) => setDates(e.target.value)} className="hero-native-overlay-select">
                      <option value="" disabled hidden>Travel Dates</option>
                      <option value="Flexible">Flexible Dates</option>
                      <option value="Nov-Mar">Nov - Mar</option>
                      <option value="Apr-Jun">Apr - Jun</option>
                    </select>
                    <Calendar size={13} color="#B48235" />
                    <span className="hero-filter-label" style={{ fontSize: '0.74rem' }}>{dates || 'DATES'}</span>
                  </div>
                </div>

                <button type="submit" className="btn-pill btn-gold" style={{ width: '100%', padding: '0.85rem' }}>
                  Search Journey
                </button>
              </form>
            )}

            {/* Mobile Destination Cards Carousel */}
            <div>
              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 className="font-display" style={{ fontSize: '1.4rem', margin: 0, color: '#121316' }}>
                  Top Kerala Destinations
                </h3>
                <span style={{ fontSize: '0.74rem', color: '#9E6F29', fontWeight: 700, letterSpacing: '0.1em' }}>
                  {mobileDestinations.length} SANCTUARIES
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  overflowX: 'auto',
                  paddingBottom: '1rem',
                  scrollSnapType: 'x mandatory'
                }}
                className="no-scrollbar"
              >
                {mobileDestinations.map((item) => (
                  <div
                    key={item.name}
                    onClick={() => handleCardClick(item.name)}
                    style={{
                      flex: '0 0 240px',
                      height: '320px',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      position: 'relative',
                      scrollSnapAlign: 'start',
                      backgroundColor: '#121316',
                      cursor: 'pointer'
                    }}
                  >
                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.85) 100%)' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.25rem', color: '#FFFFFF' }}>
                      <span style={{ fontSize: '0.65rem', color: '#D4AF37', fontWeight: 700, letterSpacing: '0.15em' }}>{item.tag}</span>
                      <h4 className="font-display" style={{ fontSize: '1.2rem', margin: '0.2rem 0', color: '#FFFFFF' }}>{item.name}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Experience Showcase */}
            <div
              id="experiences-mobile"
              style={{
                marginTop: '3.5rem'
              }}
            >
              {/* Top Heading: Eyebrow, Heading, Description */}
              <div style={{ textAlign: 'center', marginBottom: '1.6rem' }}>
                <span style={{ fontSize: '0.68rem', letterSpacing: '0.2em', color: '#D4AF37', fontWeight: 700, textTransform: 'uppercase', display: 'inline-block', marginBottom: '0.4rem' }}>
                  BREATHTAKING EXPERIENCES
                </span>
                <h3 className="font-display" style={{ fontSize: '1.75rem', margin: '0 0 0.5rem 0', color: '#FFFFFF', lineHeight: 1.15 }}>
                  Moments Beyond <span style={{ fontStyle: 'italic', color: '#E6C665' }}>The Guidebooks</span>
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.5, margin: '0 auto', maxWidth: '420px' }}>
                  Exclusive private charters, dawn tea cuppings in colonial bungalows, and sacred ritual arts accessible only through Escora.
                </p>
              </div>

              {/* 4 Experience Cards Stack on Mobile */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Card 1: Video Card */}
                <div
                  style={{
                    position: 'relative',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    backgroundColor: '#0B1410',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.35)'
                  }}
                >
                  <div style={{ height: '220px', position: 'relative', overflow: 'hidden' }}>
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    >
                      <source src="/Experience-section/12881094-hd_1920_1080_30fps.mp4" type="video/mp4" />
                    </video>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(11,20,16,0.95) 100%)' }} />
                  </div>
                  <div style={{ padding: '1.35rem', color: '#FFFFFF', marginTop: '-35px', position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.66rem', letterSpacing: '0.18em', color: '#D4AF37', fontWeight: 700, textTransform: 'uppercase' }}>
                        EXCLUSIVE CHARTER
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.65)' }}>4 Hours</span>
                    </div>
                    <h4 className="font-display" style={{ fontSize: '1.25rem', margin: '0.2rem 0', color: '#FFFFFF' }}>Private Chef Twilight Cruise</h4>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.45, margin: '0 0 1rem 0' }}>
                      Drift along silent lagoons aboard a handcrafted Kettuvallam with your personal chef.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleExpCardClick('Private Chef Twilight Cruise', 'Alleppey Waters')}
                      className="btn-pill btn-gold"
                      style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.82rem' }}
                    >
                      Curate Experience <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Cards 2, 3, 4 */}
                {EXP_CARDS.map((card) => (
                  <div
                    key={card.id}
                    style={{
                      position: 'relative',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      backgroundColor: '#0B1410',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.35)'
                    }}
                  >
                    <div style={{ height: '200px', position: 'relative', overflow: 'hidden' }}>
                      <img src={card.image} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(11,20,16,0.95) 100%)' }} />
                    </div>
                    <div style={{ padding: '1.35rem', color: '#FFFFFF', marginTop: '-35px', position: 'relative', zIndex: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.66rem', letterSpacing: '0.18em', color: '#D4AF37', fontWeight: 700, textTransform: 'uppercase' }}>
                          {card.tag}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.65)' }}>{card.duration}</span>
                      </div>
                      <h4 className="font-display" style={{ fontSize: '1.25rem', margin: '0.2rem 0', color: '#FFFFFF' }}>{card.title}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.45, margin: '0 0 1rem 0' }}>
                        {card.desc}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleExpCardClick(card.title, card.location)}
                        className="btn-pill btn-gold"
                        style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.82rem' }}
                      >
                        Curate Experience <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      <style>{`
        .hero-filter-cell {
          position: relative;
          display: flex;
          align-items: center;
          justifyContent: center;
          gap: 0.45rem;
          border-radius: 9999px;
          padding: 0.45rem 0.65rem;
          transition: background 0.22s ease;
          cursor: pointer;
          white-space: nowrap;
          min-width: 0;
        }

        .hero-filter-cell:hover {
          background: rgba(180, 130, 53, 0.08);
        }

        .hero-native-overlay-select {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          z-index: 3;
          -webkit-appearance: none;
          appearance: none;
        }

        .hero-native-overlay-select option {
          background-color: #FFFFFF;
          color: #121316;
          padding: 10px;
          font-size: 0.88rem;
          font-weight: 500;
        }

        .hero-filter-label {
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: #121316;
          text-transform: uppercase;
          white-space: nowrap;
          pointer-events: none;
        }

        .hero-filter-divider {
          width: 1px;
          height: 20px;
          background: rgba(18, 19, 22, 0.12);
          flex-shrink: 0;
        }

        .hero-filter-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.74rem 1.45rem;
          font-size: 0.8rem;
          letter-spacing: 0.06em;
          font-weight: 700;
          text-transform: uppercase;
          border-radius: 9999px;
          flex-shrink: 0;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .bento-companion-card {
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
          transition: box-shadow 0.4s ease, border-color 0.3s ease;
        }

        .bento-companion-card:hover {
          box-shadow: 0 24px 50px rgba(0, 0, 0, 0.22), 0 0 20px rgba(212, 175, 55, 0.25) !important;
          border-color: rgba(212, 175, 55, 0.45) !important;
        }

        .bento-companion-card:hover img {
          transform: scale(1.06);
        }

        .bento-center-card {
          transition: box-shadow 0.4s ease, border-color 0.3s ease;
        }

        .bento-center-card:hover {
          box-shadow: 0 30px 70px rgba(0, 0, 0, 0.28), 0 0 24px rgba(212, 175, 55, 0.25) !important;
          border-color: rgba(212, 175, 55, 0.45) !important;
        }

        .bento-center-card:hover img {
          transform: scale(1.04);
        }

        .exp-showcase-card {
          transition: box-shadow 0.4s ease, border-color 0.3s ease, transform 0.3s ease;
        }

        .exp-showcase-card:hover {
          box-shadow: 0 32px 75px rgba(0, 0, 0, 0.55), 0 0 24px rgba(212, 175, 55, 0.22) !important;
          border-color: rgba(212, 175, 55, 0.55) !important;
        }

        .exp-showcase-card:hover img {
          transform: scale(1.05);
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes bounceSubtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }

        .bounce-subtle {
          animation: bounceSubtle 1.8s infinite ease-in-out;
        }
      `}</style>
    </section>
  );
}
