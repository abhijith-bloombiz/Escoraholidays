import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Calendar, Compass, Users, ChevronDown, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useListDestinations } from '@workspace/api-client-react';

const HERO_VIDEOS = [
  {
    id: 'hero-video-1',
    video: '/hero/15015065_1920_1080_60fps.mp4',
    title: 'KERALA HIGHLANDS',
    subtitle: 'Misty Summits & Ancient Valleys',
    eyebrow: "GOD'S OWN COUNTRY",
    headingLine1: 'A WORLD WAITING',
    headingLine2: 'TO BE DISCOVERED'
  },
  {
    id: 'hero-video-2',
    video: '/hero/9154179-uhd_3840_2160_25fps.mp4',
    title: 'HERITAGE WATERWAYS',
    subtitle: 'Arabian Sea & Living Legacies',
    eyebrow: "GOD'S OWN COUNTRY",
    headingLine1: 'DISCOVER MORE,',
    headingLine2: 'TRAVEL FURTHER.'
  }
];

const HERO_SLIDES = HERO_VIDEOS;

// Temporarily hide the hero quick search bar per user request
const SHOW_HERO_SEARCH_BAR = false;

const COMPANIONS = {
  topLeft: {
    name: 'Bekal',
    tag: 'HERITAGE SEA STRONGHOLD',
    coordinates: '12.39°N 75.03°E',
    subtitle: "Kerala's largest fort — a 17th-century laterite stronghold above unspoiled northern beaches.",
    image: '/images/dest_bekal.jpg'
  },
  bottomLeft: {
    name: 'Fort Kochi',
    tag: 'SPICE PORT & BIENNALE',
    coordinates: '9.96°N 76.24°E',
    subtitle: 'Historic spice port with colonial architecture and Chinese fishing nets.',
    image: '/images/dest_fort_kochi.jpg'
  },
  topRight: {
    name: 'Kannur',
    tag: 'MYSTIC THEYYAM RITUAL',
    coordinates: '11.87°N 75.37°E',
    subtitle: "Malabar's untouristed coast — Muzhappilangad's drive-in beach, Thalassery's forts, and the ritual fire of Theyyam.",
    image: '/images/dest_kannur.jpg'
  },
  bottomRight: {
    name: 'Varkala',
    tag: 'RED CLIFF SANCTUARY',
    coordinates: '8.73°N 76.71°E',
    subtitle: 'Dramatic red laterite cliffs meeting the Arabian Sea, yoga shalas and ocean sunsets.',
    image: '/images/dest_5_varkala.jpg'
  }
};

const formatDestinationCoordinates = (
  dest?: { latitude?: number | null; longitude?: number | null; name?: string } | null,
  fallbackName?: string
): string => {
  if (
    dest &&
    typeof dest.latitude === 'number' &&
    typeof dest.longitude === 'number' &&
    (dest.latitude !== 0 || dest.longitude !== 0)
  ) {
    const latDir = dest.latitude >= 0 ? 'N' : 'S';
    const lonDir = dest.longitude >= 0 ? 'E' : 'W';
    return `${Math.abs(dest.latitude).toFixed(2)}°${latDir} ${Math.abs(dest.longitude).toFixed(2)}°${lonDir}`;
  }
  const n = (dest?.name || fallbackName || '').toLowerCase();
  if (n.includes('bekal')) return '12.39°N 75.03°E';
  if (n.includes('kochi')) return '9.97°N 76.24°E';
  if (n.includes('kannur')) return '11.87°N 75.37°E';
  if (n.includes('varkala')) return '8.74°N 76.72°E';
  if (n.includes('kovalam')) return '8.40°N 76.98°E';
  if (n.includes('munnar')) return '10.09°N 77.06°E';
  if (n.includes('alleppey') || n.includes('alappuzha')) return '9.49°N 76.33°E';
  if (n.includes('wayanad')) return '11.68°N 76.13°E';
  if (n.includes('kumarakom')) return '9.62°N 76.43°E';
  if (n.includes('thekkady')) return '9.60°N 77.16°E';
  return '9.93°N 76.26°E';
};

const resolveDestinationImage = (
  dest?: { name?: string; imageUrl?: string | null } | null,
  fallback: string = '/images/dest_3_munnar.jpg'
): string => {
  if (dest?.imageUrl && typeof dest.imageUrl === 'string' && dest.imageUrl.trim() !== '') {
    return dest.imageUrl.trim();
  }
  const n = (dest?.name || '').toLowerCase();
  if (n.includes('bekal')) return '/images/dest_bekal.jpg';
  if (n.includes('kochi')) return '/images/dest_fort_kochi.jpg';
  if (n.includes('kannur')) return '/images/dest_kannur.jpg';
  if (n.includes('varkala')) return '/images/dest_5_varkala.jpg';
  if (n.includes('kovalam')) return '/images/dest_kovalam.jpg';
  if (n.includes('kumarakom')) return '/images/dest_kumarakom.jpg';
  if (n.includes('munnar')) return '/images/dest_3_munnar.jpg';
  if (n.includes('wayanad')) return '/images/dest_1_wayanad.jpg';
  return fallback;
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

  // Live CMS Destinations from Admin Panel
  const { data: remoteDestinations } = useListDestinations();

  // Form states for the quick filter bar
  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState('');
  const [experience, setExperience] = useState('');
  const [guests, setGuests] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // 1. Center Flagship Destination from Admin Panel
  const centerDestination = useMemo(() => {
    if (!remoteDestinations || remoteDestinations.length === 0) {
      return {
        id: -1,
        name: 'Munnar Tea Highlands',
        shortName: 'Munnar',
        tag: 'HIGHLANDS & ESTATES',
        coordinates: '10.09°N 77.06°E',
        subtitle: 'Misty summits, 150-year-old planter estates, and golden sunrise tea trails.',
        image: '/images/dest_3_munnar.jpg'
      };
    }
    const published = remoteDestinations.filter((d) => d.published);
    const pool = published.length > 0 ? published : remoteDestinations;
    // Prefer Munnar if present for the iconic highland transition
    const munnar = pool.find((d) => d.name.toLowerCase().includes('munnar'));
    const featured = munnar || pool[0];

    const hasHighlands = featured.name.toLowerCase().includes('highland');
    const displayName = hasHighlands ? featured.name : `${featured.name} Highlands`;

    return {
      id: featured.id,
      name: displayName,
      shortName: featured.name,
      tag: (featured.type || 'HIGHLANDS').toUpperCase(),
      coordinates: formatDestinationCoordinates(featured, featured.name),
      subtitle: featured.shortDesc || featured.description || 'Misty summits, 150-year-old planter estates, and golden sunrise tea trails.',
      image: resolveDestinationImage(featured, '/images/dest_3_munnar.jpg')
    };
  }, [remoteDestinations]);

  // 2. The 4 Companion Wing Destinations from Admin Panel (excluding the center card)
  const liveCompanions = useMemo(() => {
    if (!remoteDestinations || remoteDestinations.length === 0) {
      return COMPANIONS;
    }
    const published = remoteDestinations.filter((d) => d.published);
    const pool = published.length > 0 ? published : remoteDestinations;

    // Exclude the destination chosen for the center card to ensure 0 duplicates
    const companions = pool.filter((d) => d.id !== centerDestination.id);
    const items = companions.length >= 4 ? companions : pool;

    const fallbackSlots = [
      COMPANIONS.topLeft,
      COMPANIONS.bottomLeft,
      COMPANIONS.topRight,
      COMPANIONS.bottomRight
    ];

    const getSlot = (idx: number, fallback: typeof COMPANIONS.topLeft) => {
      const item = items[idx];
      if (!item) return fallback;
      return {
        name: item.name,
        tag: (item.type || fallback.tag).toUpperCase(),
        coordinates: formatDestinationCoordinates(item, item.name),
        subtitle: item.shortDesc || item.description || fallback.subtitle,
        image: resolveDestinationImage(item, fallback.image)
      };
    };

    return {
      topLeft: getSlot(0, fallbackSlots[0]),
      bottomLeft: getSlot(1, fallbackSlots[1]),
      topRight: getSlot(2, fallbackSlots[2]),
      bottomRight: getSlot(3, fallbackSlots[3])
    };
  }, [remoteDestinations, centerDestination]);

  const mobileDestinations = useMemo(() => {
    if (remoteDestinations && remoteDestinations.length > 0) {
      const published = remoteDestinations.filter((d) => d.published);
      const items = published.length > 0 ? published : remoteDestinations;
      return items.map((d) => ({
        name: d.name,
        image: resolveDestinationImage(d, '/images/dest_1_wayanad.jpg'),
        tag: (d.type || 'SANCTUARY').toUpperCase(),
      }));
    }
    return [
      { name: 'Munnar Highlands', image: '/images/dest_3_munnar.jpg', tag: 'HIGHLANDS' },
      { name: 'Bekal Fortress', image: '/images/dest_bekal.jpg', tag: 'NORTH COAST' },
      { name: 'Fort Kochi Heritage', image: '/images/dest_fort_kochi.jpg', tag: 'HERITAGE' },
      { name: 'Kannur Ritual Fire', image: '/images/dest_kannur.jpg', tag: 'MYSTIC TRADITIONS' },
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

  // Synchronize active hero video playback on slide change or play/pause toggle
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    heroVideoRefs.current.forEach((videoEl, idx) => {
      if (!videoEl) return;
      if (idx === currentSlide) {
        if (isPlaying && scrollProgress < 0.35) {
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
  }, [currentSlide, isPlaying, scrollProgress]);

  // Smart video decode management: pause out-of-view videos to liberate GPU/CPU resources
  useEffect(() => {
    const isHeroVisible = scrollProgress < 0.35;
    const isExpVisible = scrollProgress >= 0.30 && scrollProgress <= 1.05;

    // 1. Hero videos management
    const currentHeroVideo = heroVideoRefs.current[currentSlide];
    if (isHeroVisible && isPlaying) {
      if (currentHeroVideo && currentHeroVideo.paused) {
        currentHeroVideo.play().catch(() => {});
      }
    } else {
      heroVideoRefs.current.forEach((v) => {
        if (v && !v.paused) v.pause();
      });
    }

    // 2. Experience video management
    if (expVideoRef.current) {
      if (isExpVisible) {
        if (expVideoRef.current.paused) {
          expVideoRef.current.play().catch(() => {});
        }
      } else {
        if (!expVideoRef.current.paused) {
          expVideoRef.current.pause();
        }
      }
    }
  }, [scrollProgress, currentSlide, isPlaying]);

  // Hero video carousel loop (continuously repeats through the 2 hero videos)
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((curr) => (curr + 1) % HERO_VIDEOS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // High-performance synchronized scroll listener with zero layout thrashing
  useEffect(() => {
    if (!isDesktop) return;

    let rafId: number | null = null;
    let lastProgress = -1;
    let cachedDistance = 0;

    const measure = () => {
      if (!containerRef.current) return;
      cachedDistance = containerRef.current.offsetHeight - window.innerHeight;
    };
    measure();
    window.addEventListener('resize', measure, { passive: true });

    const updateScroll = (currentY?: number) => {
      if (cachedDistance <= 0) return;
      const y = typeof currentY === 'number' ? currentY : window.scrollY;
      const raw = y / cachedDistance;
      const clamped = Math.min(1, Math.max(0, raw));

      // Threshold check to avoid re-rendering Hero component tree on micro subpixel noise
      if (
        Math.abs(clamped - lastProgress) >= 0.0008 ||
        (clamped === 0 && lastProgress !== 0) ||
        (clamped === 1 && lastProgress !== 1)
      ) {
        lastProgress = clamped;
        setScrollProgress(clamped);
      }
    };

    const handleScroll = (e?: any) => {
      const scrollY = typeof e?.scroll === 'number' ? e.scroll : window.scrollY;
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        updateScroll(scrollY);
        rafId = null;
      });
    };

    const lenis = (window as any).lenis;
    if (lenis && typeof lenis.on === 'function') {
      lenis.on('scroll', handleScroll);
    } else {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    updateScroll(window.scrollY);

    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', handleScroll);
      if (lenis && typeof lenis.off === 'function') {
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

  // Phase 1 scroll progress (0 -> 1): happens during first 20% of total scroll distance
  const phase1Progress = Math.min(1, Math.max(0, scrollProgress / 0.20));

  // Interpolated progress calculations
  // Phase 1 (0 -> 0.60): Hero shrinks into center card (0 -> 0.12 of scrollProgress)
  const shrinkRaw = Math.min(1, phase1Progress / 0.60);
  const shrinkEase = shrinkRaw < 0.5
    ? 2 * shrinkRaw * shrinkRaw
    : 1 - Math.pow(-2 * shrinkRaw + 2, 2) / 2;

  // Smooth crossfade between Opening Hero Media and Destination Sanctuary Card Media:
  // Starts after the shrink begins (~0.10) and finishes as the card settles into the bento grid (~0.70)
  const destImageRaw = Math.min(1, Math.max(0, (shrinkRaw - 0.10) / 0.60));
  const destImageEase = destImageRaw < 0.5
    ? 2 * destImageRaw * destImageRaw
    : 1 - Math.pow(-2 * destImageRaw + 2, 2) / 2;

  // Continuous smooth Hero text fade: only fades in when scrolling back up after the hero screen almost completely appears (shrinkRaw <= 0.12, >97% expanded)
  const heroFadeRaw = Math.min(1, Math.max(0, shrinkRaw / 0.12));
  const heroFadeEase = heroFadeRaw < 0.5
    ? 2 * heroFadeRaw * heroFadeRaw
    : 1 - Math.pow(-2 * heroFadeRaw + 2, 2) / 2;
  const heroTextOpacity = Math.max(0, 1 - heroFadeEase);
  const heroTextSlide = heroFadeEase * 45; // gentle 45px upward glide
  const searchBarOpacity = Math.max(0, 1 - Math.min(1, shrinkRaw / 0.12));
  const searchBarSlide = Math.min(1, shrinkRaw / 0.12) * 35;

  // Phase 2 (0.35 -> 1.0 of Phase 1): Companion Bento cards slide into Lightship staggered positions (0.07 -> 0.20 of scrollProgress)
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

  // Purely scroll-controlled Stage 3 Bento Rearrangement (0.20 -> 0.28 of scrollProgress)
  // Leaves 0.28 -> 0.34 as a stable resting dwell zone where the completed bento grid sits settled
  const rearrangeRaw = Math.min(1, Math.max(0, (scrollProgress - 0.20) / 0.08));
  const rearrangeEase = rearrangeRaw < 0.5
    ? 2 * rearrangeRaw * rearrangeRaw
    : 1 - Math.pow(-2 * rearrangeRaw + 2, 2) / 2;

  // Phase 3 scroll progress (0 -> 1): Center card expands to Fullscreen Experience Video (scroll 0.34 -> 0.56)
  const phase3Raw = Math.min(1, Math.max(0, (scrollProgress - 0.34) / 0.22));

  // Destination heading glides up and fades out during first 20% of Phase 3
  const headingExitRaw = Math.min(1, phase3Raw / 0.20);
  const headingExitEase = headingExitRaw < 0.5 ? 2 * headingExitRaw * headingExitRaw : 1 - Math.pow(-2 * headingExitRaw + 2, 2) / 2;

  // Center card expands to 100vw x 100vh between 0.0 and 0.70 of Phase 3
  // Leaving 0.70 to 1.0 as a steady resting fullscreen experience hero!
  const expandRaw = Math.min(1, phase3Raw / 0.70);
  const expandEase = expandRaw < 0.5 ? 2 * expandRaw * expandRaw : 1 - Math.pow(-2 * expandRaw + 2, 2) / 2;

  // Experience section info reveals as card reaches full width (between 0.65 and 0.95 of expandRaw)
  const expInfoProgress = Math.min(1, Math.max(0, (expandRaw - 0.65) / 0.30));
  const expInfoEase = expInfoProgress < 0.5 ? 2 * expInfoProgress * expInfoProgress : 1 - Math.pow(-2 * expInfoProgress + 2, 2) / 2;

  // Phase 4 scroll progress (0 -> 1): Fullscreen video card shrinks into Card 1 while 3 companion cards fade in (scroll 0.56 -> 0.74)
  // Leaves 0.74 to 1.00 as a generous resting dwell buffer (~150vh) where the 4 cards stay docked in place before page unpins and scrolls!
  const phase4Raw = Math.min(1, Math.max(0, (scrollProgress - 0.56) / 0.18));
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
  const colWidth = 'clamp(280px, 23.5vw, 360px)';
  const munnarWidth = 'clamp(360px, 30vw, 450px)';
  const gridGap = 'clamp(16px, 1.8vw, 24px)';
  const card2x2Height = 'clamp(225px, 29.5vh, 275px)';
  const munnarFeaturedHeight = `calc(2 * ${card2x2Height} + clamp(14px, 1.8vh, 18px))`;
  const card3dShadow = '0 2px 4px rgba(0, 0, 0, 0.04), 0 8px 16px -2px rgba(0, 0, 0, 0.08), 0 20px 36px -6px rgba(0, 0, 0, 0.16), 0 36px 64px -12px rgba(0, 0, 0, 0.14)';

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
      : shrinkEase < 1
        ? `calc(100vw - (100vw - clamp(350px, 29vw, 440px)) * ${shrinkEase})`
        : (rearrangeEase >= 1 ? munnarWidth : `calc(clamp(350px, 29vw, 440px) * ${1 - rearrangeEase} + ${munnarWidth} * ${rearrangeEase})`);

  const centerCardHeight = phase4Raw > 0
    ? `calc(100vh - (100vh - ${expCardHeight}) * ${phase4Ease})`
    : phase3Raw > 0
      ? `calc(${munnarFeaturedHeight} + (100vh - ${munnarFeaturedHeight}) * ${expandEase})`
      : shrinkEase < 1
        ? `calc(100vh - (100vh - clamp(620px, 80vh, 850px)) * ${shrinkEase})`
        : (rearrangeEase >= 1 ? munnarFeaturedHeight : `calc(clamp(620px, 80vh, 850px) * ${1 - rearrangeEase} + ${munnarFeaturedHeight} * ${rearrangeEase})`);

  const centerCardTransform = phase4Raw > 0
    ? `translate(calc(-1.5 * (${expCardWidth} + ${expCardGap}) * ${phase4Ease}), calc(${expCardOffsetY} * ${phase4Ease}))`
    : 'translateX(0px)';

  const centerBorderRadius = phase4Raw > 0
    ? phase4Ease * 20
    : phase3Raw > 0
      ? (1 - expandEase) * 14
      : shrinkEase * 14; // 0px to 14px smooth curve

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
        backgroundColor: '#FFFFFF',
        height: isDesktop ? '680vh' : 'auto',
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
          top: isDesktop ? '350vh' : '1080px',
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
          backgroundColor: '#FFFFFF',
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
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  {/* Stable Anchored Eyebrow - Eliminates blinking between slides */}
                  <span
                    style={{
                      display: 'inline-block',
                      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
                      textTransform: 'uppercase',
                      fontSize: 'clamp(0.85rem, 1.1vw, 1rem)',
                      letterSpacing: '0.24em',
                      color: '#D4AF37',
                      fontWeight: 700,
                      marginBottom: '1.2rem',
                      textShadow: '0 2px 12px rgba(0, 0, 0, 0.85)'
                    }}
                  >
                    GOD'S OWN COUNTRY
                  </span>

                  {/* Heading Crossfade Stack with Soft Gaussian Mist Dissolve */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr',
                      justifyItems: 'center',
                      width: '100%',
                      position: 'relative'
                    }}
                  >
                    {HERO_VIDEOS.map((slide, idx) => {
                      const isActive = idx === currentSlide;
                      return (
                        <div
                          key={slide.id}
                          style={{
                            gridArea: '1 / 1',
                            opacity: isActive ? 1 : 0,
                            transform: isActive
                              ? 'translate3d(0, 0px, 0) scale(1)'
                              : 'translate3d(0, -10px, 0) scale(0.985)',
                            transition: isActive
                              ? 'opacity 1.4s cubic-bezier(0.16, 1, 0.3, 1), transform 1.5s cubic-bezier(0.16, 1, 0.3, 1)'
                              : 'opacity 0.9s cubic-bezier(0.4, 0, 0.7, 1), transform 1.0s cubic-bezier(0.4, 0, 0.7, 1)',
                            pointerEvents: isActive ? 'auto' : 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            width: '100%',
                            willChange: 'opacity, transform'
                          }}
                        >
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
                            {slide.headingLine1} <br />
                            {slide.headingLine2}
                          </h1>
                        </div>
                      );
                    })}
                  </div>
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
                  opacity: Math.max(0, rearrangeEase * (1 - headingExitEase * 1.5)),
                  transform: phase3Raw > 0
                    ? `translateY(${-headingExitEase * 45}px)`
                    : `translateY(${(1 - rearrangeEase) * -22}px)`,
                  maxHeight: `calc(130px * ${rearrangeEase} * ${1 - headingExitEase})`,
                  marginBottom: `calc(clamp(16px, 2.2vh, 26px) * ${rearrangeEase} * ${1 - headingExitEase})`,
                  overflow: 'hidden',
                  pointerEvents: (rearrangeEase > 0.8 && headingExitEase < 0.2) ? 'auto' : 'none',
                  transition: 'none',
                  zIndex: 10
                }}
              >
                {/* Eyebrow */}
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
                    fontSize: 'clamp(0.82rem, 0.95vw, 0.88rem)',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    color: '#9E6F29',
                    marginBottom: '0.65rem',
                    display: 'inline-block',
                    lineHeight: 1
                  }}
                >
                  DISCOVER KERALA
                </span>

                {/* Main Heading */}
                <h2
                  className="font-display"
                  style={{
                    fontSize: 'clamp(2.85rem, 4.6vw, 4.4rem)',
                    color: '#121316',
                    lineHeight: 1.02,
                    letterSpacing: '0.035em',
                    textTransform: 'uppercase',
                    margin: 0
                  }}
                >
                  Where Every Landscape Tells a Story
                </h2>
              </div>

              {/* The 3 Columns Grid Row — Concept 3 3D Amphitheater */}
              <div
                className="bento-stage-grid bento-theater-stage"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: phase4Raw > 0 ? '0px' : gridGap,
                  position: 'relative',
                  perspective: '1400px'
                }}
              >
                {/* ---------------------------------------------------- */}
                {/* COLUMN 1: LEFT COMPANIONS (3D Inward Amphitheater Wing) */}
                {/* ---------------------------------------------------- */}
                <div
                  className="bento-col-left bento-theater-wing-left"
                  style={{
                    width: colWidth,
                    display: phase4Raw > 0 ? 'none' : 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: 'clamp(14px, 1.8vh, 18px)',
                    opacity: sideCardsOpacity,
                    pointerEvents: (bentoCardOpacity > 0.4 && expandRaw < 0.2) ? 'auto' : 'none',
                    flexShrink: 0,
                    alignSelf: 'center',
                    transform: `perspective(1200px) rotateY(${rearrangeEase * 4.5}deg)`,
                    transformOrigin: 'right center',
                    transition: 'none',
                    zIndex: 2
                  }}
                >
                  {/* Card 1: Bekal Fortress (Top-Left) */}
                  <div
                    onClick={() => handleCardClick(liveCompanions.topLeft.name)}
                    className="bento-companion-card bento-theater-card"
                    style={{
                      width: '100%',
                      height: rearrangeEase >= 1
                        ? card2x2Height
                        : (rearrangeEase <= 0 ? 'clamp(220px, 28vh, 300px)' : `calc(clamp(220px, 28vh, 300px) * ${1 - rearrangeEase} + ${card2x2Height} * ${rearrangeEase})`),
                      position: 'relative',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: 'none',
                      boxShadow: card3dShadow,
                      backgroundColor: '#121316',
                      transform: `translateX(${leftCard1SlideX}px) translateY(${leftCard1SlideY}px) scale(${0.92 + 0.08 * bentoEase})`,
                      transition: 'none'
                    }}
                  >
                    <img
                      src={liveCompanions.topLeft.image}
                      alt={liveCompanions.topLeft.name}
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (!target.dataset.fallbackApplied) {
                          target.dataset.fallbackApplied = 'true';
                          target.src = '/images/dest_fort_kochi.jpg';
                        }
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                      className="bento-companion-img"
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.28) 40%, rgba(18,19,22,0.92) 100%)',
                        pointerEvents: 'none'
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '1.25rem 1.4rem',
                        color: '#FFFFFF',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.2rem',
                        zIndex: 2,
                        pointerEvents: 'none'
                      }}
                    >
                      <h3
                        className="font-display"
                        style={{
                          fontSize: 'clamp(1.18rem, 1.35vw, 1.35rem)',
                          margin: 0,
                          color: '#FFFFFF',
                          lineHeight: 1.15,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        {liveCompanions.topLeft.name}
                      </h3>
                      <p
                        style={{
                          fontSize: 'clamp(0.72rem, 0.8vw, 0.78rem)',
                          color: 'rgba(255, 255, 255, 0.85)',
                          margin: '0.25rem 0 0 0',
                          lineHeight: 1.42,
                          maxWidth: '280px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {liveCompanions.topLeft.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Fort Kochi Spice Port (Bottom-Left) */}
                  <div
                    onClick={() => handleCardClick(liveCompanions.bottomLeft.name)}
                    className="bento-companion-card bento-theater-card"
                    style={{
                      width: rearrangeEase >= 1
                        ? '100%'
                        : (rearrangeEase <= 0 ? 'clamp(240px, 21vw, 330px)' : `calc(clamp(240px, 21vw, 330px) * ${1 - rearrangeEase} + 100% * ${rearrangeEase})`),
                      height: rearrangeEase >= 1
                        ? card2x2Height
                        : (rearrangeEase <= 0 ? 'clamp(195px, 25vh, 265px)' : `calc(clamp(195px, 25vh, 265px) * ${1 - rearrangeEase} + ${card2x2Height} * ${rearrangeEase})`),
                      position: 'relative',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: 'none',
                      boxShadow: card3dShadow,
                      backgroundColor: '#121316',
                      alignSelf: rearrangeEase >= 1 ? 'stretch' : 'flex-end',
                      transform: `translateX(${leftCard2SlideX}px) scale(${0.92 + 0.08 * bentoEase})`,
                      transition: 'none'
                    }}
                  >
                    <img
                      src={liveCompanions.bottomLeft.image}
                      alt={liveCompanions.bottomLeft.name}
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (!target.dataset.fallbackApplied) {
                          target.dataset.fallbackApplied = 'true';
                          target.src = '/images/dest_kannur.jpg';
                        }
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                      className="bento-companion-img"
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.28) 40%, rgba(18,19,22,0.92) 100%)',
                        pointerEvents: 'none'
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '1.25rem 1.4rem',
                        color: '#FFFFFF',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.2rem',
                        zIndex: 2,
                        pointerEvents: 'none'
                      }}
                    >
                      <h3
                        className="font-display"
                        style={{
                          fontSize: 'clamp(1.18rem, 1.35vw, 1.35rem)',
                          margin: 0,
                          color: '#FFFFFF',
                          lineHeight: 1.15,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        {liveCompanions.bottomLeft.name}
                      </h3>
                      <p
                        style={{
                          fontSize: 'clamp(0.72rem, 0.8vw, 0.78rem)',
                          color: 'rgba(255, 255, 255, 0.85)',
                          margin: '0.25rem 0 0 0',
                          lineHeight: 1.42,
                          maxWidth: '280px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {liveCompanions.bottomLeft.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Invisible Balance Spacer */}
                  <div
                    style={{
                      height: `calc((1 - ${rearrangeEase}) * clamp(180px, 22vh, 230px))`,
                      visibility: rearrangeEase >= 1 ? 'hidden' : 'visible',
                      pointerEvents: 'none',
                      overflow: 'hidden',
                      transition: 'none'
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
                    boxShadow: card3dShadow,
                    overflow: 'hidden',
                    zIndex: phase4Raw > 0 ? 6 : 5,
                    backgroundColor: '#0B1410',
                    cursor: (phase1Progress > 0.4 && phase3Raw < 0.15) ? 'pointer' : (phase4Raw > 0.6 ? 'pointer' : 'default'),
                    flexShrink: 0,
                    alignSelf: 'center',
                    transform: centerCardTransform,
                    transition: 'none',
                    border: 'none'
                  }}
                  onClick={() => {
                    if (phase1Progress > 0.4 && phase3Raw < 0.15) {
                      handleCardClick(centerDestination.shortName || centerDestination.name);
                    } else if (phase4Raw > 0.6) {
                      handleExpCardClick('Kayaking', 'Alleppey Waters');
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
                          disablePictureInPicture
                          disableRemotePlayback
                          controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
                          data-video-popout="false"
                          tabIndex={-1}
                          aria-hidden="true"
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
                            pointerEvents: 'none',
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
                      backgroundImage: `url('${centerDestination.image}')`,
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
                      disablePictureInPicture
                      disableRemotePlayback
                      controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
                      data-video-popout="false"
                      tabIndex={-1}
                      aria-hidden="true"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        pointerEvents: 'none'
                      }}
                    >
                      <source src="/Experience-section/12881094-hd_1920_1080_30fps.mp4" type="video/mp4" />
                    </video>
                  </div>

                  {/* Luxury Ambient & Vignette Overlays - Lightened for vibrant video clarity */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `linear-gradient(180deg, rgba(11, 20, 16, ${0.15 - 0.05 * expandEase}) 0%, rgba(11, 20, 16, ${0.08 + 0.04 * expandEase}) 35%, rgba(11, 20, 16, 0.14) 65%, rgba(11, 20, 16, ${0.62 - 0.44 * expandEase}) 100%)`,
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
                      alignItems: 'center',
                      textAlign: 'center',
                      gap: '0.35rem',
                      pointerEvents: 'none'
                    }}
                  >
                    <h3
                      className="font-display"
                      style={{
                        fontSize: 'clamp(1.45rem, 1.8vw, 1.75rem)',
                        margin: 0,
                        color: '#FFFFFF',
                        lineHeight: 1.1,
                        textTransform: 'uppercase',
                        letterSpacing: '0.035em'
                      }}
                    >
                      {centerDestination.name}
                    </h3>
                    <p
                      style={{
                        fontSize: 'clamp(0.8rem, 0.9vw, 0.86rem)',
                        color: 'rgba(255, 255, 255, 0.85)',
                        margin: '0.2rem 0 0 0',
                        lineHeight: 1.45,
                        maxWidth: '340px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {centerDestination.subtitle}
                    </p>
                    <div style={{ marginTop: '0.4rem', display: 'flex', justifyContent: 'center' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          padding: '0.45rem 1.15rem',
                          borderRadius: '999px',
                          backgroundColor: 'rgba(255, 255, 255, 0.16)',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255, 255, 255, 0.35)',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: '#FFFFFF'
                        }}
                      >
                        Explore {centerDestination.shortName} <ArrowUpRight size={14} />
                      </span>
                    </div>
                  </div>

                  {/* Card 1 Experience Details: Kayaking (Fades in during Phase 4) */}
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
                        pointerEvents: 'none',
                        textAlign: 'center'
                      }}
                    >
                      <h3 className="font-display" style={{ fontSize: 'clamp(1.18rem, 1.35vw, 1.35rem)', color: '#FFFFFF', margin: '0 0 0.35rem 0', lineHeight: 1.2 }}>
                        Kayaking
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.82)', margin: 0, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        Glide through silent lagoons and tranquil backwaters on a private kayak.
                      </p>
                    </div>
                  )}
                </div>

                {/* ---------------------------------------------------- */}
                {/* COLUMN 3: RIGHT COMPANIONS (3D Inward Amphitheater Wing) */}
                {/* ---------------------------------------------------- */}
                <div
                  className="bento-col-right bento-theater-wing-right"
                  style={{
                    width: colWidth,
                    display: phase4Raw > 0 ? 'none' : 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: 'clamp(14px, 1.8vh, 18px)',
                    opacity: sideCardsOpacity,
                    pointerEvents: (bentoCardOpacity > 0.4 && expandRaw < 0.2) ? 'auto' : 'none',
                    flexShrink: 0,
                    alignSelf: 'center',
                    transform: `perspective(1200px) rotateY(${-rearrangeEase * 4.5}deg)`,
                    transformOrigin: 'left center',
                    transition: 'none',
                    zIndex: 2
                  }}
                >
                  {/* Invisible Top Balance Spacer */}
                  <div
                    style={{
                      height: `calc((1 - ${rearrangeEase}) * clamp(180px, 22vh, 230px))`,
                      visibility: rearrangeEase >= 1 ? 'hidden' : 'visible',
                      pointerEvents: 'none',
                      overflow: 'hidden',
                      transition: 'none'
                    }}
                    aria-hidden="true"
                  />

                  {/* Card 4: Kannur Ritual Fire (Top-Right) */}
                  <div
                    onClick={() => handleCardClick(liveCompanions.topRight.name)}
                    className="bento-companion-card bento-theater-card"
                    style={{
                      width: rearrangeEase >= 1
                        ? '100%'
                        : (rearrangeEase <= 0 ? 'clamp(240px, 21vw, 330px)' : `calc(clamp(240px, 21vw, 330px) * ${1 - rearrangeEase} + 100% * ${rearrangeEase})`),
                      height: rearrangeEase >= 1
                        ? card2x2Height
                        : (rearrangeEase <= 0 ? 'clamp(195px, 25vh, 265px)' : `calc(clamp(195px, 25vh, 265px) * ${1 - rearrangeEase} + ${card2x2Height} * ${rearrangeEase})`),
                      position: 'relative',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: 'none',
                      boxShadow: card3dShadow,
                      backgroundColor: '#121316',
                      alignSelf: rearrangeEase >= 1 ? 'stretch' : 'flex-start',
                      transform: `translateX(${rightCard4SlideX}px) scale(${0.92 + 0.08 * bentoEase})`,
                      transition: 'none'
                    }}
                  >
                    <img
                      src={liveCompanions.topRight.image}
                      alt={liveCompanions.topRight.name}
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (!target.dataset.fallbackApplied) {
                          target.dataset.fallbackApplied = 'true';
                          target.src = '/images/dest_kovalam.jpg';
                        }
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                      className="bento-companion-img"
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.28) 40%, rgba(18,19,22,0.92) 100%)',
                        pointerEvents: 'none'
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '1.25rem 1.4rem',
                        color: '#FFFFFF',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.2rem',
                        zIndex: 2,
                        pointerEvents: 'none'
                      }}
                    >
                      <h3
                        className="font-display"
                        style={{
                          fontSize: 'clamp(1.18rem, 1.35vw, 1.35rem)',
                          margin: 0,
                          color: '#FFFFFF',
                          lineHeight: 1.15,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        {liveCompanions.topRight.name}
                      </h3>
                      <p
                        style={{
                          fontSize: 'clamp(0.72rem, 0.8vw, 0.78rem)',
                          color: 'rgba(255, 255, 255, 0.85)',
                          margin: '0.25rem 0 0 0',
                          lineHeight: 1.42,
                          maxWidth: '280px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {liveCompanions.topRight.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Card 5: Varkala Sea Cliffs (Bottom-Right) */}
                  <div
                    onClick={() => handleCardClick(liveCompanions.bottomRight.name)}
                    className="bento-companion-card bento-theater-card"
                    style={{
                      width: '100%',
                      height: rearrangeEase >= 1
                        ? card2x2Height
                        : (rearrangeEase <= 0 ? 'clamp(220px, 28vh, 300px)' : `calc(clamp(220px, 28vh, 300px) * ${1 - rearrangeEase} + ${card2x2Height} * ${rearrangeEase})`),
                      position: 'relative',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: 'none',
                      boxShadow: card3dShadow,
                      backgroundColor: '#121316',
                      transform: `translateX(${rightCard5SlideX}px) translateY(${rightCard5SlideY}px) scale(${0.92 + 0.08 * bentoEase})`,
                      transition: 'none'
                    }}
                  >
                    <img
                      src={liveCompanions.bottomRight.image}
                      alt={liveCompanions.bottomRight.name}
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (!target.dataset.fallbackApplied) {
                          target.dataset.fallbackApplied = 'true';
                          target.src = '/images/dest_5_varkala.jpg';
                        }
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                      className="bento-companion-img"
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.28) 40%, rgba(18,19,22,0.92) 100%)',
                        pointerEvents: 'none'
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '1.25rem 1.4rem',
                        color: '#FFFFFF',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.2rem',
                        zIndex: 2,
                        pointerEvents: 'none'
                      }}
                    >
                      <h3
                        className="font-display"
                        style={{
                          fontSize: 'clamp(1.18rem, 1.35vw, 1.35rem)',
                          margin: 0,
                          color: '#FFFFFF',
                          lineHeight: 1.15,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        {liveCompanions.bottomRight.name}
                      </h3>
                      <p
                        style={{
                          fontSize: 'clamp(0.72rem, 0.8vw, 0.78rem)',
                          color: 'rgba(255, 255, 255, 0.85)',
                          margin: '0.25rem 0 0 0',
                          lineHeight: 1.42,
                          maxWidth: '280px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
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
                            borderRadius: `${centerBorderRadius}px`,
                            overflow: 'hidden',
                            boxShadow: `0 24px 60px rgba(0, 0, 0, ${0.35 * phase4Ease})`,
                            border: 'none',
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
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 45%, rgba(11,20,16,0.92) 100%)', pointerEvents: 'none' }} />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.6rem 1.4rem', color: '#FFFFFF', zIndex: 2, textAlign: 'center', pointerEvents: 'none' }}>
                            <h3 className="font-display" style={{ fontSize: 'clamp(1.18rem, 1.35vw, 1.35rem)', color: '#FFFFFF', margin: '0 0 0.35rem 0', lineHeight: 1.2 }}>
                              {card.title}
                            </h3>
                            <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.82)', margin: 0, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {card.desc}
                            </p>
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
                        ? `translate(-50%, calc(-50% - ${(headingMoveEase * 29).toFixed(2)}vh))`
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
                    {/* Eyebrow - Sized and styled matching Discover Kerala */}
                    <span
                      style={{
                        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
                        fontSize: 'clamp(0.82rem, 0.95vw, 0.88rem)',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        color: phase4Raw > 0 ? '#9E6F29' : '#E6C665',
                        marginBottom: '0.65rem',
                        display: 'inline-block',
                        lineHeight: 1,
                        textShadow: phase4Raw > 0 ? 'none' : '0 2px 14px rgba(0, 0, 0, 0.75)',
                        transition: 'color 0.4s ease, text-shadow 0.4s ease'
                      }}
                    >
                      BREATHTAKING EXPERIENCES
                    </span>

                    {/* Grand Experience Headline - Sized matching Discover Kerala */}
                    <h2
                      className="font-display"
                      style={{
                        fontSize: 'clamp(2.85rem, 4.6vw, 4.4rem)',
                        color: phase4Raw > 0 ? '#121316' : '#FFFFFF',
                        lineHeight: 1.02,
                        letterSpacing: '0.035em',
                        textTransform: 'uppercase',
                        margin: phase4Raw > 0 ? 0 : '0 0 1.2rem 0',
                        textShadow: phase4Raw > 0 ? 'none' : '0 4px 28px rgba(0, 0, 0, 0.75)',
                        transition: 'color 0.4s ease, text-shadow 0.4s ease, margin 0.35s ease'
                      }}
                    >
                      MOMENTS BEYOND{' '}
                      <span style={{ color: phase4Raw > 0 ? '#121316' : '#E6C665', transition: 'color 0.4s ease' }}>
                        THE GUIDEBOOKS
                      </span>
                    </h2>

                    {/* Editorial Subtitle - Visible in Phase 3, removed when scrolling and reaching Phase 4 */}
                    {phase4Raw < 0.28 && (
                      <p
                        style={{
                          opacity: Math.max(0, 1 - phase4Raw * 4),
                          maxHeight: phase4Raw > 0 ? `${Math.max(0, (1 - phase4Raw * 4) * 80)}px` : 'auto',
                          overflow: 'hidden',
                          marginTop: phase4Raw > 0 ? `${Math.max(0, (1 - phase4Raw * 4) * 0.8)}rem` : '0.8rem',
                          marginBottom: 0,
                          fontSize: 'clamp(0.95rem, 1.15vw, 1.12rem)',
                          color: 'rgba(255, 255, 255, 0.82)',
                          lineHeight: 1.45,
                          maxWidth: '720px',
                          textShadow: '0 2px 12px rgba(0, 0, 0, 0.7)',
                          transition: 'opacity 0.2s ease'
                        }}
                      >
                        Exclusive private charters, dawn tea cuppings in colonial bungalows, and sacred ritual arts accessible only through Escora's private local network.
                      </p>
                    )}

                    {/* Phase 3 Action Block (CTA Button) - Fades out before Phase 4 starts */}
                    {phase4Raw < 0.28 && (
                      <div
                        style={{
                          opacity: Math.max(0, 1 - phase4Raw * 4),
                          maxHeight: phase4Raw > 0 ? `${Math.max(0, (1 - phase4Raw * 4) * 120)}px` : 'auto',
                          overflow: 'hidden',
                          marginTop: phase4Raw > 0 ? `${Math.max(0, (1 - phase4Raw * 4) * 1.8)}rem` : '1.8rem',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          pointerEvents: (phase4Raw < 0.05 && expInfoEase > 0.5) ? 'auto' : 'none',
                          transition: 'opacity 0.2s ease'
                        }}
                      >
                        {/* CTA Button */}
                        <div>
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
                    disablePictureInPicture
                    disableRemotePlayback
                    controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
                    data-video-popout="false"
                    tabIndex={-1}
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      pointerEvents: 'none',
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
                <span
                  style={{
                    display: 'inline-block',
                    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
                    fontSize: 'clamp(0.82rem, 2.5vw, 0.92rem)',
                    letterSpacing: '0.22em',
                    color: '#D4AF37',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    marginBottom: '0.35rem'
                  }}
                >
                  GOD'S OWN COUNTRY
                </span>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    width: '100%',
                    position: 'relative'
                  }}
                >
                  {HERO_VIDEOS.map((slide, idx) => {
                    const isActive = idx === currentSlide;
                    return (
                      <div
                        key={slide.id}
                        style={{
                          gridArea: '1 / 1',
                          opacity: isActive ? 1 : 0,
                          transform: isActive
                            ? 'translate3d(0, 0px, 0) scale(1)'
                            : 'translate3d(0, -6px, 0) scale(0.985)',
                          transition: isActive
                            ? 'opacity 1.4s cubic-bezier(0.16, 1, 0.3, 1), transform 1.5s cubic-bezier(0.16, 1, 0.3, 1)'
                            : 'opacity 0.9s cubic-bezier(0.4, 0, 0.7, 1), transform 1.0s cubic-bezier(0.4, 0, 0.7, 1)',
                          pointerEvents: isActive ? 'auto' : 'none',
                          width: '100%',
                          willChange: 'opacity, transform'
                        }}
                      >
                        <h1
                          className="font-display"
                          style={{
                            fontSize: '2.4rem',
                            margin: '0.15rem 0 0',
                            color: '#FFFFFF',
                            lineHeight: 0.95,
                            textTransform: 'uppercase'
                          }}
                        >
                          {slide.headingLine1} <br />
                          {slide.headingLine2}
                        </h1>
                      </div>
                    );
                  })}
                </div>
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
              <div style={{ marginBottom: '1.35rem', textAlign: 'left' }}>
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
                    fontSize: '0.8rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    color: '#9E6F29',
                    display: 'block',
                    marginBottom: '0.55rem',
                    lineHeight: 1
                  }}
                >
                  DISCOVER KERALA
                </span>
                <h3
                  className="font-display"
                  style={{
                    fontSize: 'clamp(2.2rem, 7.5vw, 2.75rem)',
                    margin: 0,
                    color: '#121316',
                    lineHeight: 1.02,
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase'
                  }}
                >
                  Where Every Landscape Tells a Story
                </h3>
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
                      borderRadius: '12px',
                      overflow: 'hidden',
                      position: 'relative',
                      scrollSnapAlign: 'start',
                      backgroundColor: '#121316',
                      cursor: 'pointer',
                      border: 'none',
                      boxShadow: card3dShadow
                    }}
                  >
                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.85) 100%)' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.25rem', color: '#FFFFFF', textAlign: 'center' }}>
                      <h4 className="font-display" style={{ fontSize: '1.2rem', margin: 0, color: '#FFFFFF' }}>{item.name}</h4>
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
              {/* Top Heading: Eyebrow, Heading */}
              <div style={{ textAlign: 'center', marginBottom: '1.6rem' }}>
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
                    fontSize: '0.8rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    color: '#9E6F29',
                    display: 'block',
                    marginBottom: '0.55rem',
                    lineHeight: 1
                  }}
                >
                  BREATHTAKING EXPERIENCES
                </span>
                <h3
                  className="font-display"
                  style={{
                    fontSize: 'clamp(2.2rem, 7.5vw, 2.75rem)',
                    margin: 0,
                    color: '#121316',
                    lineHeight: 1.02,
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase'
                  }}
                >
                  MOMENTS BEYOND THE GUIDEBOOKS
                </h3>
              </div>

              {/* 4 Experience Cards Stack on Mobile */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Card 1: Video Card */}
                <div
                  style={{
                    position: 'relative',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#0B1410',
                    border: 'none',
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
                      disablePictureInPicture
                      disableRemotePlayback
                      controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
                      data-video-popout="false"
                      tabIndex={-1}
                      aria-hidden="true"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
                    >
                      <source src="/Experience-section/12881094-hd_1920_1080_30fps.mp4" type="video/mp4" />
                    </video>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(11,20,16,0.95) 100%)' }} />
                  </div>
                  <div style={{ padding: '1.35rem', color: '#FFFFFF', marginTop: '-35px', position: 'relative', zIndex: 2, textAlign: 'center' }}>
                    <h4 className="font-display" style={{ fontSize: '1.25rem', margin: '0 0 0.35rem 0', color: '#FFFFFF' }}>Kayaking</h4>
                    <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.82)', lineHeight: 1.45, margin: 0 }}>
                      Glide through silent lagoons and tranquil backwaters on a private kayak.
                    </p>
                  </div>
                </div>

                {/* Cards 2, 3, 4 */}
                {EXP_CARDS.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => handleExpCardClick(card.title, card.location)}
                    style={{
                      position: 'relative',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      backgroundColor: '#0B1410',
                      border: 'none',
                      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.35)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ height: '200px', position: 'relative', overflow: 'hidden' }}>
                      <img src={card.image} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(11,20,16,0.95) 100%)' }} />
                    </div>
                    <div style={{ padding: '1.35rem', color: '#FFFFFF', marginTop: '-35px', position: 'relative', zIndex: 2, textAlign: 'center' }}>
                      <h4 className="font-display" style={{ fontSize: '1.25rem', margin: '0 0 0.35rem 0', color: '#FFFFFF' }}>{card.title}</h4>
                      <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.82)', lineHeight: 1.45, margin: 0 }}>
                        {card.desc}
                      </p>
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

        .bento-theater-stage {
          perspective: 1400px;
        }

        .bento-theater-wing-left,
        .bento-theater-wing-right {
          transform-style: preserve-3d;
        }

        .bento-theater-card {
          border: none !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04), 0 8px 16px -2px rgba(0, 0, 0, 0.08), 0 20px 36px -6px rgba(0, 0, 0, 0.16), 0 36px 64px -12px rgba(0, 0, 0, 0.14) !important;
          transition: box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
          transform-style: preserve-3d;
          -webkit-transform-style: preserve-3d;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          will-change: transform;
          -webkit-mask-image: -webkit-radial-gradient(white, black);
          mask-image: radial-gradient(white, black);
          isolation: isolate;
        }

        /* Elevate shadow on hover with stable geometry to eliminate shaking and cursor jitter */
        .bento-theater-card:hover {
          border: none !important;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05), 0 16px 36px -4px rgba(0, 0, 0, 0.18), 0 32px 64px -6px rgba(0, 0, 0, 0.22) !important;
        }

        .bento-companion-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.65s cubic-bezier(0.16, 1, 0.3, 1) !important;
          will-change: transform;
          transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .bento-theater-card:hover .bento-companion-img {
          transform: scale(1.045) translate3d(0, 0, 0) !important;
        }

        .bento-center-card {
          border: none !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04), 0 8px 16px -2px rgba(0, 0, 0, 0.08), 0 20px 36px -6px rgba(0, 0, 0, 0.16), 0 36px 64px -12px rgba(0, 0, 0, 0.14) !important;
          transition: box-shadow 0.4s ease !important;
          transform-style: preserve-3d;
          -webkit-transform-style: preserve-3d;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          will-change: transform, width, height;
          -webkit-mask-image: -webkit-radial-gradient(white, black);
          mask-image: radial-gradient(white, black);
          isolation: isolate;
        }

        .bento-center-card:hover {
          border: none !important;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05), 0 18px 40px -4px rgba(0, 0, 0, 0.20), 0 36px 68px -8px rgba(0, 0, 0, 0.22) !important;
        }

        .bento-center-card video,
        .bento-center-card img {
          will-change: transform;
          transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .exp-showcase-card {
          border: none !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04), 0 8px 16px -2px rgba(0, 0, 0, 0.08), 0 20px 36px -6px rgba(0, 0, 0, 0.16), 0 36px 64px -12px rgba(0, 0, 0, 0.14) !important;
          transition: box-shadow 0.4s ease !important;
          transform-style: preserve-3d;
          -webkit-transform-style: preserve-3d;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          will-change: transform;
          -webkit-mask-image: -webkit-radial-gradient(white, black);
          mask-image: radial-gradient(white, black);
          isolation: isolate;
        }

        .exp-showcase-card:hover {
          border: none !important;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05), 0 18px 40px -4px rgba(0, 0, 0, 0.20), 0 36px 68px -8px rgba(0, 0, 0, 0.22) !important;
        }

        .exp-showcase-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.65s cubic-bezier(0.16, 1, 0.3, 1) !important;
          will-change: transform;
          transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .exp-showcase-card:hover img {
          transform: scale(1.045) translate3d(0, 0, 0) !important;
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
