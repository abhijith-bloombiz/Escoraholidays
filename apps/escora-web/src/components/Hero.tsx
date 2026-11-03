import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Calendar, Compass, Users, ChevronDown, ChevronLeft, ChevronRight, ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react';
import { useListDestinations, useListHeroSlides } from '@workspace/api-client-react';
import { useListHomeExperiences } from '../hooks/useHomeExperiences';
import { useLocation } from 'wouter';

export const resolveDestinationSlug = (dest?: { slug?: string; name?: string; shortName?: string } | string | null): string => {
  if (typeof dest === 'string') {
    const s = dest.trim().toLowerCase();
    if (s.includes('fort kochi') || s.includes('kochi')) return 'fort-kochi';
    if (s.includes('munnar')) return 'munnar';
    if (s.includes('alleppey') || s.includes('alappuzha')) return 'alleppey';
    if (s.includes('wayanad')) return 'wayanad';
    if (s.includes('thekkady') || s.includes('periyar')) return 'thekkady';
    if (s.includes('varkala')) return 'varkala';
    if (s.includes('bekal')) return 'bekal';
    if (s.includes('kannur')) return 'kannur';
    if (s.includes('kumarakom')) return 'kumarakom';
    if (s.includes('kovalam')) return 'kovalam';
    return s.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'munnar';
  }
  if (dest?.slug && typeof dest.slug === 'string' && dest.slug.trim() !== '') {
    return dest.slug.trim().toLowerCase();
  }
  const n = (dest?.shortName || dest?.name || '').toLowerCase();
  if (n.includes('fort kochi') || n.includes('kochi')) return 'fort-kochi';
  if (n.includes('munnar')) return 'munnar';
  if (n.includes('alleppey') || n.includes('alappuzha')) return 'alleppey';
  if (n.includes('wayanad')) return 'wayanad';
  if (n.includes('thekkady') || n.includes('periyar')) return 'thekkady';
  if (n.includes('varkala')) return 'varkala';
  if (n.includes('bekal')) return 'bekal';
  if (n.includes('kannur')) return 'kannur';
  if (n.includes('kumarakom')) return 'kumarakom';
  if (n.includes('kovalam')) return 'kovalam';
  return n.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'munnar';
};

const HERO_VIDEOS = [
  {
    id: 'hero-slide-1',
    video: '/hero/15015065_1920_1080_60fps.mp4',
    title: 'KERALA HIGHLANDS',
    subtitle: 'Misty Summits & Ancient Valleys',
    eyebrow: "GOD'S OWN COUNTRY",
    headingLine1: 'A WORLD WAITING',
    headingLine2: 'TO BE DISCOVERED',
    duration: 8
  },
  {
    id: 'hero-slide-2',
    video: '/hero/9154179-uhd_3840_2160_25fps.mp4',
    title: 'HERITAGE WATERWAYS',
    subtitle: 'Arabian Sea & Living Legacies',
    eyebrow: "GOD'S OWN COUNTRY",
    headingLine1: 'DISCOVER MORE,',
    headingLine2: 'TRAVEL FURTHER.',
    duration: 8
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
  onSelectDestination?: (dest: { name: string; slug?: string }) => void;
}

export default function Hero({ onOpenEnquiry, onSelectFilter, onSelectDestination }: HeroProps) {
  const [, setLocation] = useLocation();
  const containerRef = useRef<HTMLElement | null>(null);
  const expVideoRef = useRef<HTMLVideoElement | null>(null);
  const heroVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDesktop, setIsDesktop] = useState(true);

  // Live CMS Destinations and Hero Slides from Admin Panel
  const { data: remoteDestinations } = useListDestinations();
  const { data: remoteHeroSlides } = useListHeroSlides();

  const heroSlides = useMemo(() => {
    if (!remoteHeroSlides || remoteHeroSlides.length === 0) return HERO_VIDEOS;
    const publishedSlides = remoteHeroSlides.filter((s) => s.published !== false);
    const activeList = publishedSlides.length > 0 ? publishedSlides : remoteHeroSlides;
    const sortedList = [...activeList].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id
    );
    return sortedList.map((s, idx) => ({
      id: `hero-slide-${s.id}`,
      video: s.videoUrl || HERO_VIDEOS[idx % HERO_VIDEOS.length]?.video || HERO_VIDEOS[0].video,
      title: s.headingLine1 || `Slide ${idx + 1}`,
      subtitle: s.headingLine2 || '',
      eyebrow: s.eyebrow || "GOD'S OWN COUNTRY",
      headingLine1: s.headingLine1 || '',
      headingLine2: s.headingLine2 || '',
      duration: Number(s.duration) > 0 ? Number(s.duration) : 8,
      ctaText: s.ctaText || 'Plan a Journey',
      ctaLink: s.ctaLink || '/plan',
    }));
  }, [remoteHeroSlides]);

  // Live CMS Experience Cards for Phase 4 (Center card = slot 1, companions = slots 2, 3, 4)
  const { data: remoteHomeCards } = useListHomeExperiences();

  const homeCard1 = useMemo(() => {
    const card = remoteHomeCards?.find((c) => c.slot === 1) || remoteHomeCards?.[0];
    return {
      title: card?.title || 'Kayaking',
      desc: card?.desc || 'Glide through silent lagoons and tranquil backwaters on a private kayak.',
      location: card?.location || 'Alleppey Waters',
      videoUrl: card?.videoUrl || '/Experience-section/12881094-hd_1920_1080_30fps.mp4',
      posterUrl: card?.posterUrl || '/images/exp_houseboat.jpg',
      slug: (card as any)?.slug || card?.experienceSlug || 'private-houseboat-charter',
    };
  }, [remoteHomeCards]);

  const companionCards = useMemo(() => {
    const defaults = [
      {
        id: 'exp-card-2',
        slot: 2,
        tag: 'Estate Seclusion',
        duration: 'Dawn // 3 Hours',
        title: 'Dawn Tea Cupping with a Planter',
        location: 'Munnar Highlands',
        desc: 'Single-origin tastings & high-range trails in a 150-year-old colonial bungalow.',
        image: '/images/exp_tea_bungalow.jpg',
        videoUrl: '/hero/15015065_1920_1080_60fps.mp4',
        slug: 'tea-planter-bungalow',
      },
      {
        id: 'exp-card-3',
        slot: 3,
        tag: 'Wilderness Reserve',
        duration: 'Full Day',
        title: 'Periyar Bamboo River Rafting',
        location: 'Periyar Reserve',
        desc: 'Silent misty waters with indigenous tribal trackers and wild elephant herds.',
        image: '/images/dest_4_rafting.jpg',
        videoUrl: '/hero/9154179-uhd_3840_2160_25fps.mp4',
        slug: 'periyar-bamboo-rafting',
      },
      {
        id: 'exp-card-4',
        slot: 4,
        tag: 'Living Arts',
        duration: 'Masterclass',
        title: 'Kathakali Greenroom & Sacred Arts',
        location: 'Thrissur Cultural Quarters',
        desc: 'Front-row sacred makeup transformation & royal Travancore culinary feasts.',
        image: '/images/exp_kathakali.jpg',
        videoUrl: '/hero/15015065_1920_1080_60fps.mp4',
        slug: 'theyyam-sacred-fire',
      }
    ];

    if (!remoteHomeCards || remoteHomeCards.length === 0) return defaults;

    return [2, 3, 4].map((slotNum, idx) => {
      const def = defaults[idx];
      const found = remoteHomeCards.find((c) => c.slot === slotNum) || remoteHomeCards[idx + 1];
      if (!found) return def;
      return {
        id: `exp-card-${slotNum}`,
        slot: slotNum,
        tag: found.tag || def.tag,
        duration: found.duration || def.duration,
        title: found.title || def.title,
        location: found.location || def.location,
        desc: found.desc || def.desc,
        image: found.posterUrl || def.image,
        videoUrl: found.videoUrl || def.videoUrl,
        slug: (found as any).slug || found.experienceSlug || def.slug,
      };
    });
  }, [remoteHomeCards]);

  // Form states for the quick filter bar
  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState('');
  const [experience, setExperience] = useState('');
  const [guests, setGuests] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadedSlides, setLoadedSlides] = useState<number[]>([0]);
  const [isPlaying, setIsPlaying] = useState(true);

  // Bento 3D Stage Carousel active offset/index state
  const [bentoSlideIndex, setBentoSlideIndex] = useState(0);

  // Fallback destination pool matching Escora luxury portfolio
  const fallbackDestPool = useMemo(() => [
    {
      id: -1,
      name: 'Munnar Highlands',
      shortName: 'Munnar',
      slug: 'munnar',
      type: 'HIGHLANDS & ESTATES',
      shortDesc: 'Endless emerald tea estates rolling across the Western Ghats at 1,600 m above sea level.',
      description: 'Endless emerald tea estates rolling across the Western Ghats at 1,600 m above sea level.',
      imageUrl: '/images/dest_3_munnar.jpg'
    },
    {
      id: -2,
      name: 'Alleppey',
      shortName: 'Alleppey',
      slug: 'alleppey',
      type: 'BACKWATER LAGOONS',
      shortDesc: "The 'Venice of the East' — kettuvallam houseboats drifting through Kuttanad's below-sea-level paddy fields.",
      description: "The 'Venice of the East' — kettuvallam houseboats drifting through Kuttanad's below-sea-level paddy fields.",
      imageUrl: '/images/dest_alleppey.jpg'
    },
    {
      id: -3,
      name: 'Bekal',
      shortName: 'Bekal',
      slug: 'bekal',
      type: 'HERITAGE SEA STRONGHOLD',
      shortDesc: "Kerala's largest fort — a 17th-century laterite stronghold above unspoiled northern beaches.",
      description: "Kerala's largest fort — a 17th-century laterite stronghold above unspoiled northern beaches.",
      imageUrl: '/images/dest_bekal.jpg'
    },
    {
      id: -4,
      name: 'Fort Kochi',
      shortName: 'Fort Kochi',
      slug: 'fort-kochi',
      type: 'SPICE PORT & BIENNALE',
      shortDesc: 'Historic spice port with colonial architecture and Chinese fishing nets.',
      description: 'Historic spice port with colonial architecture and Chinese fishing nets.',
      imageUrl: '/images/dest_fort_kochi.jpg'
    },
    {
      id: -5,
      name: 'Kannur',
      shortName: 'Kannur',
      slug: 'kannur',
      type: 'MYSTIC THEYYAM RITUAL',
      shortDesc: "Malabar's untouristed coast — Muzhappilangad's drive-in beach, Thalassery's forts, and the ritual fire of Theyyam.",
      description: "Malabar's untouristed coast — Muzhappilangad's drive-in beach, Thalassery's forts, and the ritual fire of Theyyam.",
      imageUrl: '/images/dest_kannur.jpg'
    },
    {
      id: -6,
      name: 'Varkala',
      shortName: 'Varkala',
      slug: 'varkala',
      type: 'RED CLIFF SANCTUARY',
      shortDesc: 'Dramatic red laterite cliffs meeting the Arabian Sea, yoga shalas and ocean sunsets.',
      description: 'Dramatic red laterite cliffs meeting the Arabian Sea, yoga shalas and ocean sunsets.',
      imageUrl: '/images/dest_5_varkala.jpg'
    },
    {
      id: -7,
      name: 'Wayanad',
      shortName: 'Wayanad',
      slug: 'wayanad',
      type: 'MISTY CLOUD FORESTS',
      shortDesc: 'Prehistoric caves, rolling tea & coffee plantations, waterfalls and treehouse sanctuaries.',
      description: 'Prehistoric caves, rolling tea & coffee plantations, waterfalls and treehouse sanctuaries.',
      imageUrl: '/images/dest_1_wayanad.jpg'
    },
    {
      id: -8,
      name: 'Kumarakom',
      shortName: 'Kumarakom',
      slug: 'kumarakom',
      type: 'BIRD SANCTUARY & LAGOONS',
      shortDesc: 'Quiet mangrove canals on the eastern shore of Vembanad Lake, luxury lakeside retreats.',
      description: 'Quiet mangrove canals on the eastern shore of Vembanad Lake, luxury lakeside retreats.',
      imageUrl: '/images/dest_kumarakom.jpg'
    }
  ], []);

  // Ordered full list of destinations from CMS or fallback
  const allDestinationsList = useMemo(() => {
    if (remoteDestinations && remoteDestinations.length > 0) {
      const published = remoteDestinations.filter((d) => d.published);
      const pool = published.length > 0 ? published : remoteDestinations;
      // Ensure Munnar is first in initial rotation for signature opening
      const munnar = pool.find((d) => d.name.toLowerCase().includes('munnar'));
      if (munnar) {
        return [munnar, ...pool.filter((d) => d.id !== munnar.id)];
      }
      return pool;
    }
    return fallbackDestPool;
  }, [remoteDestinations, fallbackDestPool]);

  const formatDestCard = (item: any) => {
    const target = item || fallbackDestPool[0];
    const hasHighlands = (target.name || '').toLowerCase().includes('highland');
    const isMunnar = (target.name || '').toLowerCase().includes('munnar');
    const displayName = isMunnar && !hasHighlands ? `${target.name} Highlands` : target.name;

    return {
      id: target.id,
      name: displayName,
      shortName: target.shortName || target.name,
      slug: target.slug || resolveDestinationSlug(target),
      tag: (target.type || 'SANCTUARY').toUpperCase(),
      coordinates: formatDestinationCoordinates(target, target.name),
      subtitle: target.shortDesc || target.description || '',
      image: resolveDestinationImage(target, '/images/dest_3_munnar.jpg')
    };
  };

  // 5-Slot Interactive Layout State:
  // Slot 0: Top-Left, Slot 1: Bottom-Left, Slot 2: Center Hero, Slot 3: Top-Right, Slot 4: Bottom-Right
  const [customSlots, setCustomSlots] = useState<number[] | null>(null);

  const defaultSlotAssignments = useMemo(() => {
    const len = allDestinationsList.length;
    if (len === 0) return [1, 2, 0, 3, 4];
    const cIdx = ((bentoSlideIndex % len) + len) % len;
    return [
      (cIdx + 1) % len, // Slot 0: Top-Left
      (cIdx + 2) % len, // Slot 1: Bottom-Left
      cIdx,             // Slot 2: Center Hero
      (cIdx + 3) % len, // Slot 3: Top-Right
      (cIdx + 4) % len  // Slot 4: Bottom-Right
    ];
  }, [allDestinationsList, bentoSlideIndex]);

  const activeSlots = customSlots || defaultSlotAssignments;

  const slot0Dest = useMemo(() => formatDestCard(allDestinationsList[activeSlots[0]]), [allDestinationsList, activeSlots]);
  const slot1Dest = useMemo(() => formatDestCard(allDestinationsList[activeSlots[1]]), [allDestinationsList, activeSlots]);
  const centerDestination = useMemo(() => formatDestCard(allDestinationsList[activeSlots[2]]), [allDestinationsList, activeSlots]);
  const slot3Dest = useMemo(() => formatDestCard(allDestinationsList[activeSlots[3]]), [allDestinationsList, activeSlots]);
  const slot4Dest = useMemo(() => formatDestCard(allDestinationsList[activeSlots[4]]), [allDestinationsList, activeSlots]);

  const liveCompanions = useMemo(() => ({
    topLeft: slot0Dest,
    bottomLeft: slot1Dest,
    topRight: slot3Dest,
    bottomRight: slot4Dest
  }), [slot0Dest, slot1Dest, slot3Dest, slot4Dest]);

  const slotDests: Record<number, ReturnType<typeof formatDestCard>> = useMemo(() => ({
    0: slot0Dest,
    1: slot1Dest,
    2: centerDestination,
    3: slot3Dest,
    4: slot4Dest
  }), [slot0Dest, slot1Dest, centerDestination, slot3Dest, slot4Dest]);

  // DOM node references for luxury morphing animation
  const stageRef = useRef<HTMLDivElement | null>(null);
  const slot0Ref = useRef<HTMLDivElement | null>(null);
  const slot1Ref = useRef<HTMLDivElement | null>(null);
  const slot2Ref = useRef<HTMLDivElement | null>(null);
  const slot3Ref = useRef<HTMLDivElement | null>(null);
  const slot4Ref = useRef<HTMLDivElement | null>(null);

  const isSwappingRef = useRef(false);

  interface MorphCardState {
    slotIdx: 0 | 1 | 3 | 4;
    promotedDest: ReturnType<typeof formatDestCard>;
    demotedDest: ReturnType<typeof formatDestCard>;
    sidePos: { left: number; top: number; width: number; height: number };
    centerPos: { left: number; top: number; width: number; height: number };
    isAnimating: boolean;
  }

  const [morphState, setMorphState] = useState<MorphCardState | null>(null);

  // Promote any side card to Center Hero with confirmed luxury morph transition (650ms, cubic-bezier(0.22, 1, 0.36, 1))
  const handlePromoteSlot = (slotIdx: 0 | 1 | 3 | 4) => {
    if (isSwappingRef.current) return;

    const stageEl = stageRef.current;
    const slotEls: Record<number, HTMLDivElement | null> = {
      0: slot0Ref.current,
      1: slot1Ref.current,
      2: slot2Ref.current,
      3: slot3Ref.current,
      4: slot4Ref.current
    };

    const centerEl = slotEls[2];
    const sideEl = slotEls[slotIdx];

    if (!stageEl || !centerEl || !sideEl) {
      setCustomSlots((prev) => {
        const current = prev || defaultSlotAssignments;
        const next = [...current];
        const prevCenter = next[2];
        next[2] = next[slotIdx];
        next[slotIdx] = prevCenter;
        return next;
      });
      return;
    }

    isSwappingRef.current = true;

    const stageRect = stageEl.getBoundingClientRect();
    const sideRect = sideEl.getBoundingClientRect();
    const centerRect = centerEl.getBoundingClientRect();

    const sidePos = {
      left: sideRect.left - stageRect.left,
      top: sideRect.top - stageRect.top,
      width: sideRect.width,
      height: sideRect.height
    };

    const centerPos = {
      left: centerRect.left - stageRect.left,
      top: centerRect.top - stageRect.top,
      width: centerRect.width,
      height: centerRect.height
    };

    const promoted = slotDests[slotIdx];
    const demoted = slotDests[2];

    setMorphState({
      slotIdx,
      promotedDest: promoted,
      demotedDest: demoted,
      sidePos,
      centerPos,
      isAnimating: false
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setMorphState((prev) => (prev ? { ...prev, isAnimating: true } : null));
      });
    });

    setTimeout(() => {
      setCustomSlots((prev) => {
        const current = prev || defaultSlotAssignments;
        const next = [...current];
        const prevCenter = next[2];
        next[2] = next[slotIdx];
        next[slotIdx] = prevCenter;
        return next;
      });
      setMorphState(null);
      isSwappingRef.current = false;
    }, 660);
  };

  const handlePrevDestination = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCustomSlots(null);
    setBentoSlideIndex((prev) => (prev - 1 + allDestinationsList.length) % allDestinationsList.length);
  };

  const handleNextDestination = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCustomSlots(null);
    setBentoSlideIndex((prev) => (prev + 1) % allDestinationsList.length);
  };

  const mobileDestinations = useMemo(() => {
    if (remoteDestinations && remoteDestinations.length > 0) {
      const published = remoteDestinations.filter((d) => d.published);
      const items = published.length > 0 ? published : remoteDestinations;
      return items.map((d) => ({
        name: d.name,
        slug: d.slug || resolveDestinationSlug(d),
        image: resolveDestinationImage(d, '/images/dest_1_wayanad.jpg'),
        tag: (d.type || 'SANCTUARY').toUpperCase(),
      }));
    }
    return [
      { name: 'Munnar Highlands', slug: 'munnar', image: '/images/dest_3_munnar.jpg', tag: 'HIGHLANDS' },
      { name: 'Bekal Fortress', slug: 'bekal', image: '/images/dest_bekal.jpg', tag: 'NORTH COAST' },
      { name: 'Fort Kochi Heritage', slug: 'fort-kochi', image: '/images/dest_fort_kochi.jpg', tag: 'HERITAGE' },
      { name: 'Kannur Ritual Fire', slug: 'kannur', image: '/images/dest_kannur.jpg', tag: 'MYSTIC TRADITIONS' },
      { name: 'Varkala Sea Cliffs', slug: 'varkala', image: '/images/dest_5_varkala.jpg', tag: 'COASTLINE' },
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
  // Track scroll visibility gates as booleans to avoid thrashing video playback on every scroll frame
  const isHeroVisible = scrollProgress < 0.35;
  const isExpVisible = scrollProgress >= 0.30 && scrollProgress <= 1.05;

  // Synchronize active hero video playback on slide change or play/pause toggle
  const prevSlideRef = useRef<number | null>(null);
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const isSlideChanged = prevSlideRef.current !== null && prevSlideRef.current !== currentSlide;
    prevSlideRef.current = currentSlide;

    // Ensure active slide is registered as loaded
    setLoadedSlides((prev) => (prev.includes(currentSlide) ? prev : [...prev, currentSlide]));

    heroVideoRefs.current.forEach((videoEl, idx) => {
      if (!videoEl) return;
      if (idx === currentSlide) {
        if (isPlaying && isHeroVisible) {
          if (isSlideChanged) {
            videoEl.currentTime = 0;
          }
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
  }, [currentSlide, isPlaying, isHeroVisible]);

  // Smart video decode management: pause out-of-view videos to liberate GPU/CPU resources
  useEffect(() => {
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
  }, [isHeroVisible, isExpVisible, currentSlide, isPlaying]);

  // Hero video carousel loop (uses configured duration per slide, default 8s)
  useEffect(() => {
    if (!isPlaying || !heroSlides.length) return;
    const currentDurationSec =
      heroSlides[currentSlide]?.duration && heroSlides[currentSlide]?.duration > 0
        ? heroSlides[currentSlide].duration
        : 8;

    // Preload next slide 3s before transition to ensure instant seamless crossfade without network contention
    const preloadDelay = Math.max(1000, (currentDurationSec - 3) * 1000);
    const preloadTimer = setTimeout(() => {
      const nextSlide = (currentSlide + 1) % heroSlides.length;
      setLoadedSlides((prev) => (prev.includes(nextSlide) ? prev : [...prev, nextSlide]));
    }, preloadDelay);

    const timer = setTimeout(() => {
      setCurrentSlide((curr) => {
        const next = (curr + 1) % heroSlides.length;
        setLoadedSlides((prev) => (prev.includes(next) ? prev : [...prev, next]));
        return next;
      });
    }, currentDurationSec * 1000);

    return () => {
      clearTimeout(preloadTimer);
      clearTimeout(timer);
    };
  }, [isPlaying, currentSlide, heroSlides]);

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

  const handleCardClick = (dest: { name?: string; shortName?: string; slug?: string } | string) => {
    const slug = resolveDestinationSlug(dest);
    if ((window as any).lenis) {
      (window as any).lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
    setLocation(`/destinations/${slug}`);
    if (onSelectDestination) {
      const name = typeof dest === 'string' ? dest : (dest.name || dest.shortName || '');
      onSelectDestination({ name, slug });
    }
  };

  const handleExpCardClick = (title: string, location: string, slug?: string) => {
    if (slug) {
      if ((window as any).lenis) {
        (window as any).lenis.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo(0, 0);
      }
      setLocation(`/experiences/${slug}`);
      return;
    }
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

  // Balanced slide trajectories matching even-sized cards
  const leftCardSlideX = (1 - bentoEase) * -240;
  const rightCardSlideX = (1 - bentoEase) * 240;
  const leftCard1SlideX = leftCardSlideX;
  const leftCard1SlideY = 0;
  const leftCard2SlideX = leftCardSlideX;
  const rightCard4SlideX = rightCardSlideX;
  const rightCard5SlideX = rightCardSlideX;
  const rightCard5SlideY = 0;
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

  // Keyboard arrow slider controls (when Stage 2 amphitheater is in active view)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sideCardsOpacity < 0.6 || expandRaw >= 0.15 || !isDesktop) return;
      if (e.key === 'ArrowLeft') {
        handlePrevDestination();
      } else if (e.key === 'ArrowRight') {
        handleNextDestination();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sideCardsOpacity, expandRaw, isDesktop, allDestinationsList.length]);

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
        ? `calc(100vw - (100vw - ${munnarWidth}) * ${shrinkEase})`
        : munnarWidth;

  const centerCardHeight = phase4Raw > 0
    ? `calc(100vh - (100vh - ${expCardHeight}) * ${phase4Ease})`
    : phase3Raw > 0
      ? `calc(${munnarFeaturedHeight} + (100vh - ${munnarFeaturedHeight}) * ${expandEase})`
      : shrinkEase < 1
        ? `calc(100vh - (100vh - ${munnarFeaturedHeight}) * ${shrinkEase})`
        : munnarFeaturedHeight;

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
        backgroundColor: '#EAEFF3',
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
          backgroundColor: '#EAEFF3',
          backgroundImage: 'radial-gradient(ellipse 95% 75% at 50% 42%, #F5F7FA 0%, #E9EDF2 55%, #DFE4EA 100%)',
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
                    {heroSlides[currentSlide]?.eyebrow || "GOD'S OWN COUNTRY"}
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
                    {heroSlides.map((slide, idx) => {
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
                            {slide.headingLine1}
                            {slide.headingLine2 ? (
                              <>
                                {' '}
                                <br />
                                {slide.headingLine2}
                              </>
                            ) : null}
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
                  maxHeight: `calc(190px * ${rearrangeEase} * ${1 - headingExitEase})`,
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

                {/* Short Description */}
                <p
                  style={{
                    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
                    fontSize: 'clamp(0.9rem, 1.05vw, 1.05rem)',
                    lineHeight: 1.5,
                    color: '#4B5563',
                    maxWidth: '680px',
                    margin: '0.75rem auto 0',
                    fontWeight: 400
                  }}
                >
                  Handpicked sanctuaries across God’s Own Country—from private backwater lagoons to highland tea estates, crafted for seamless luxury exploration.
                </p>
              </div>

              {/* The 3 Columns Grid Row — Concept 3 3D Amphitheater */}
              <div
                ref={stageRef}
                className="bento-stage-grid bento-theater-stage"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: phase4Raw > 0 ? '0px' : gridGap,
                  position: 'relative'
                }}
              >
                {/* Arrow Slider: Left Edge / Horizontal Start, Vertical Center of Card Layout */}
                <button
                  type="button"
                  onClick={handlePrevDestination}
                  aria-label="Previous destination"
                  className="bento-slider-arrow bento-slider-arrow-prev"
                  style={{
                    position: 'absolute',
                    left: 'max(16px, calc(50% - (clamp(280px, 23.5vw, 360px) + clamp(360px, 30vw, 450px) / 2 + clamp(16px, 1.8vw, 24px) + 68px)))',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 35,
                    width: 'clamp(46px, 3.4vw, 54px)',
                    height: 'clamp(46px, 3.4vw, 54px)',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.94)',
                    color: '#121316',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.10), 0 2px 6px rgba(0, 0, 0, 0.04)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    outline: 'none',
                    opacity: (sideCardsOpacity > 0.35 && expandRaw < 0.15) ? Math.min(1, (sideCardsOpacity - 0.3) / 0.5) : 0,
                    pointerEvents: (sideCardsOpacity > 0.6 && expandRaw < 0.15) ? 'auto' : 'none',
                    transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.25s ease, border-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease'
                  }}
                >
                  <ChevronLeft size={22} strokeWidth={2.4} />
                </button>

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
                    transform: 'none',
                    transition: 'none',
                    zIndex: 2
                  }}
                >
                  {/* Card 1: Top-Left (Slot 0) */}
                  <div
                    ref={slot0Ref}
                    onClick={() => handlePromoteSlot(0)}
                    className="bento-companion-card bento-theater-card"
                    style={{
                      width: '100%',
                      height: card2x2Height,
                      position: 'relative',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: 'none',
                      boxShadow: card3dShadow,
                      backgroundColor: '#121316',
                      transform: `translateX(${leftCardSlideX}px) scale(${0.92 + 0.08 * bentoEase})`,
                      transition: 'none',
                      visibility: morphState?.slotIdx === 0 ? 'hidden' : 'visible'
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

                  {/* Card 2: Bottom-Left (Slot 1) */}
                  <div
                    ref={slot1Ref}
                    onClick={() => handlePromoteSlot(1)}
                    className="bento-companion-card bento-theater-card"
                    style={{
                      width: '100%',
                      height: card2x2Height,
                      position: 'relative',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: 'none',
                      boxShadow: card3dShadow,
                      backgroundColor: '#121316',
                      alignSelf: 'stretch',
                      transform: `translateX(${leftCardSlideX}px) scale(${0.92 + 0.08 * bentoEase})`,
                      transition: 'none',
                      visibility: morphState?.slotIdx === 1 ? 'hidden' : 'visible'
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
                </div>

                {/* ---------------------------------------------------- */}
                {/* COLUMN 2: CENTER SHRINKING HERO CARD (FEATURED MUNNAR -> FULLSCREEN EXPERIENCES) */}
                {/* ---------------------------------------------------- */}
                <div
                  ref={slot2Ref}
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
                    border: 'none',
                    visibility: morphState !== null ? 'hidden' : 'visible'
                  }}
                  onClick={() => {
                    if (phase1Progress > 0.4 && phase3Raw < 0.15) {
                      handleCardClick(centerDestination);
                    } else if (phase4Raw > 0.6) {
                      handleExpCardClick(homeCard1.title, homeCard1.location, homeCard1.slug);
                    }
                  }}
                  className="bento-center-card"
                >
                  {/* Layer 1: Opening Hero Video Carousel (Cinematic 4K/HD Videos from public/hero) */}
                  {heroSlides.map((slide, idx) => {
                    const isActive = idx === currentSlide;
                    const isLoaded = loadedSlides.includes(idx);
                    const heroVideoOpacity = isActive
                      ? Math.max(0, (1 - destImageEase) * (1 - expandRaw * 1.5))
                      : 0;
                    return (
                      <div
                        key={idx}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          opacity: heroVideoOpacity,
                          transform: isActive ? 'scale(1.02) translateZ(0)' : 'scale(1.0) translateZ(0)',
                          transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), transform 8s cubic-bezier(0.16, 1, 0.3, 1)',
                          zIndex: 2,
                          overflow: 'hidden',
                          pointerEvents: 'none',
                          backgroundColor: '#0B1410',
                          willChange: 'opacity, transform',
                          backfaceVisibility: 'hidden'
                        }}
                      >
                        {isLoaded && (
                          <video
                            ref={(el) => { heroVideoRefs.current[idx] = el; }}
                            src={slide.video}
                            autoPlay={isActive}
                            muted
                            loop
                            playsInline
                            preload={isActive ? 'auto' : 'metadata'}
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
                              pointerEvents: 'none',
                              backgroundColor: '#0B1410',
                              transform: 'translateZ(0)',
                              backfaceVisibility: 'hidden'
                            }}
                          />
                        )}
                      </div>
                    );
                  })}

                  {/* Layer 2: Dedicated Destination Card Image (Crossfades in as hero card shrinks into bento) */}
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
                      pointerEvents: 'none'
                    }}
                  />

                  {/* Layer 3: Flagship Experience Video Layer (Smoothly fades in as center card expands in Phase 3) */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: Math.min(1, expandRaw * 1.8),
                      transform: `scale(${1.08 - 0.08 * expandEase}) translateZ(0)`,
                      zIndex: 3,
                      pointerEvents: 'none',
                      overflow: 'hidden',
                      willChange: 'opacity, transform',
                      backfaceVisibility: 'hidden'
                    }}
                  >
                    {scrollProgress >= 0.15 && (
                      <video
                        ref={expVideoRef}
                        key={homeCard1.videoUrl}
                        src={homeCard1.videoUrl}
                        loop
                        muted
                        playsInline
                        preload={scrollProgress >= 0.3 ? 'auto' : 'metadata'}
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
                          pointerEvents: 'none',
                          transform: 'translateZ(0)',
                          backfaceVisibility: 'hidden'
                        }}
                      />
                    )}
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

                  {/* Floating Top Badge Icon on Center Card */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '1.25rem',
                      left: '1.25rem',
                      right: '1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      zIndex: 5,
                      pointerEvents: 'none',
                      opacity: Math.max(0, centerLabelOpacity * (1 - expandRaw * 3.5)),
                      transition: 'opacity 0.3s ease'
                    }}
                  >
                    <span
                      style={{
                        padding: '0.35rem 0.85rem',
                        borderRadius: '999px',
                        backgroundColor: 'rgba(0, 0, 0, 0.45)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        color: '#FFFFFF',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        border: '1px solid rgba(255, 255, 255, 0.22)',
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}
                    >
                      <span>{centerDestination.tag}</span>
                    </span>
                  </div>

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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick(centerDestination);
                        }}
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
                          color: '#FFFFFF',
                          cursor: 'pointer',
                          pointerEvents: 'auto',
                          transition: 'background-color 0.25s ease, transform 0.25s ease'
                        }}
                        className="hover:scale-105 active:scale-95"
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
                        {homeCard1.title}
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.82)', margin: 0, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {homeCard1.desc}
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
                    transform: 'none',
                    transition: 'none',
                    zIndex: 2
                  }}
                >
                  {/* Card 4: Top-Right (Slot 3) */}
                  <div
                    ref={slot3Ref}
                    onClick={() => handlePromoteSlot(3)}
                    className="bento-companion-card bento-theater-card"
                    style={{
                      width: '100%',
                      height: card2x2Height,
                      position: 'relative',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: 'none',
                      boxShadow: card3dShadow,
                      backgroundColor: '#121316',
                      alignSelf: 'stretch',
                      transform: `translateX(${rightCardSlideX}px) scale(${0.92 + 0.08 * bentoEase})`,
                      transition: 'none',
                      visibility: morphState?.slotIdx === 3 ? 'hidden' : 'visible'
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

                  {/* Card 5: Bottom-Right (Slot 4) */}
                  <div
                    ref={slot4Ref}
                    onClick={() => handlePromoteSlot(4)}
                    className="bento-companion-card bento-theater-card"
                    style={{
                      width: '100%',
                      height: card2x2Height,
                      position: 'relative',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: 'none',
                      boxShadow: card3dShadow,
                      backgroundColor: '#121316',
                      transform: `translateX(${rightCardSlideX}px) scale(${0.92 + 0.08 * bentoEase})`,
                      transition: 'none',
                      visibility: morphState?.slotIdx === 4 ? 'hidden' : 'visible'
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

                {/* Arrow Slider: Right Edge / Horizontal End, Vertical Center of Card Layout */}
                <button
                  type="button"
                  onClick={handleNextDestination}
                  aria-label="Next destination"
                  className="bento-slider-arrow bento-slider-arrow-next"
                  style={{
                    position: 'absolute',
                    right: 'max(16px, calc(50% - (clamp(280px, 23.5vw, 360px) + clamp(360px, 30vw, 450px) / 2 + clamp(16px, 1.8vw, 24px) + 68px)))',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 35,
                    width: 'clamp(46px, 3.4vw, 54px)',
                    height: 'clamp(46px, 3.4vw, 54px)',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.94)',
                    color: '#121316',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.10), 0 2px 6px rgba(0, 0, 0, 0.04)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    outline: 'none',
                    opacity: (sideCardsOpacity > 0.35 && expandRaw < 0.15) ? Math.min(1, (sideCardsOpacity - 0.3) / 0.5) : 0,
                    pointerEvents: (sideCardsOpacity > 0.6 && expandRaw < 0.15) ? 'auto' : 'none',
                    transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.25s ease, border-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease'
                  }}
                >
                  <ChevronRight size={22} strokeWidth={2.4} />
                </button>

                {/* ---------------------------------------------------- */}
                {/* Interactive Morphing Grid Transition Layer (Side Card <-> Center Hero) */}
                {/* ---------------------------------------------------- */}
                {morphState && (
                  <>
                    {/* Morph Card 1: Promoted Destination (Side Slot -> Center Hero) */}
                    <div
                      style={{
                        position: 'absolute',
                        left: morphState.isAnimating ? `${morphState.centerPos.left}px` : `${morphState.sidePos.left}px`,
                        top: morphState.isAnimating ? `${morphState.centerPos.top}px` : `${morphState.sidePos.top}px`,
                        width: morphState.isAnimating ? `${morphState.centerPos.width}px` : `${morphState.sidePos.width}px`,
                        height: morphState.isAnimating ? `${morphState.centerPos.height}px` : `${morphState.sidePos.height}px`,
                        transition: 'left 650ms cubic-bezier(0.22, 1, 0.36, 1), top 650ms cubic-bezier(0.22, 1, 0.36, 1), width 650ms cubic-bezier(0.22, 1, 0.36, 1), height 650ms cubic-bezier(0.22, 1, 0.36, 1)',
                        zIndex: 60,
                        borderRadius: '14px',
                        overflow: 'hidden',
                        boxShadow: card3dShadow,
                        backgroundColor: '#0B1410',
                        pointerEvents: 'none'
                      }}
                    >
                      <img
                        src={morphState.promotedDest.image}
                        alt={morphState.promotedDest.name}
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
                          background: 'linear-gradient(180deg, rgba(11, 20, 16, 0.15) 0%, rgba(11, 20, 16, 0.12) 35%, rgba(11, 20, 16, 0.18) 65%, rgba(11, 20, 16, 0.65) 100%)',
                          pointerEvents: 'none'
                        }}
                      />

                      {/* Floating Top Badge (Sparkles + Tag + FEATURED) */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '1.25rem',
                          left: '1.25rem',
                          right: '1.25rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          zIndex: 5,
                          opacity: morphState.isAnimating ? 1 : 0,
                          transform: morphState.isAnimating ? 'translateY(0px)' : 'translateY(-10px)',
                          transition: 'opacity 450ms cubic-bezier(0.22, 1, 0.36, 1) 180ms, transform 450ms cubic-bezier(0.22, 1, 0.36, 1) 180ms',
                          pointerEvents: 'none'
                        }}
                      >
                        <span
                          style={{
                            padding: '0.35rem 0.85rem',
                            borderRadius: '999px',
                            backgroundColor: 'rgba(0, 0, 0, 0.45)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            color: '#FFFFFF',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                            border: '1px solid rgba(255, 255, 255, 0.22)',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}
                        >
                          <span>{morphState.promotedDest.tag}</span>
                        </span>
                      </div>

                      {/* Promoted Center Details (Serif Title, Subtitle, and Explore CTA Button) */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: '2rem 1.75rem',
                          color: '#FFFFFF',
                          zIndex: 4,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          gap: '0.35rem',
                          opacity: morphState.isAnimating ? 1 : 0,
                          transform: morphState.isAnimating ? 'translateY(0px)' : 'translateY(16px)',
                          transition: 'opacity 450ms cubic-bezier(0.22, 1, 0.36, 1) 180ms, transform 450ms cubic-bezier(0.22, 1, 0.36, 1) 180ms',
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
                          {morphState.promotedDest.name}
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
                          {morphState.promotedDest.subtitle}
                        </p>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCardClick(morphState.promotedDest);
                            }}
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
                              color: '#FFFFFF',
                              cursor: 'pointer',
                              pointerEvents: 'auto'
                            }}
                          >
                            Explore {morphState.promotedDest.shortName} <ArrowUpRight size={14} />
                          </span>
                      </div>

                      {/* Side Compact Details (Fades out quickly) */}
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
                          zIndex: 3,
                          opacity: morphState.isAnimating ? 0 : 1,
                          transform: morphState.isAnimating ? 'translateY(10px)' : 'translateY(0px)',
                          transition: 'opacity 180ms ease, transform 180ms ease',
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
                          {morphState.promotedDest.name}
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
                          {morphState.promotedDest.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Morph Card 2: Demoted Destination (Center Hero -> Vacated Side Slot) */}
                    <div
                      style={{
                        position: 'absolute',
                        left: morphState.isAnimating ? `${morphState.sidePos.left}px` : `${morphState.centerPos.left}px`,
                        top: morphState.isAnimating ? `${morphState.sidePos.top}px` : `${morphState.centerPos.top}px`,
                        width: morphState.isAnimating ? `${morphState.sidePos.width}px` : `${morphState.centerPos.width}px`,
                        height: morphState.isAnimating ? `${morphState.sidePos.height}px` : `${morphState.centerPos.height}px`,
                        transition: 'left 650ms cubic-bezier(0.22, 1, 0.36, 1), top 650ms cubic-bezier(0.22, 1, 0.36, 1), width 650ms cubic-bezier(0.22, 1, 0.36, 1), height 650ms cubic-bezier(0.22, 1, 0.36, 1)',
                        zIndex: 55,
                        borderRadius: '14px',
                        overflow: 'hidden',
                        boxShadow: card3dShadow,
                        backgroundColor: '#0B1410',
                        pointerEvents: 'none'
                      }}
                    >
                      <img
                        src={morphState.demotedDest.image}
                        alt={morphState.demotedDest.name}
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
                          background: 'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.28) 40%, rgba(18,19,22,0.92) 100%)',
                          pointerEvents: 'none'
                        }}
                      />

                      {/* Center Details Fade Out */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: '2rem 1.75rem',
                          color: '#FFFFFF',
                          zIndex: 4,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          gap: '0.35rem',
                          opacity: morphState.isAnimating ? 0 : 1,
                          transform: morphState.isAnimating ? 'translateY(14px)' : 'translateY(0px)',
                          transition: 'opacity 200ms ease, transform 200ms ease',
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
                          {morphState.demotedDest.name}
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
                          {morphState.demotedDest.subtitle}
                        </p>
                      </div>

                      {/* Side Compact Details Fade In */}
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
                          zIndex: 3,
                          opacity: morphState.isAnimating ? 1 : 0,
                          transform: morphState.isAnimating ? 'translateY(0px)' : 'translateY(-10px)',
                          transition: 'opacity 400ms cubic-bezier(0.22, 1, 0.36, 1) 200ms, transform 400ms cubic-bezier(0.22, 1, 0.36, 1) 200ms',
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
                          {morphState.demotedDest.name}
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
                          {morphState.demotedDest.subtitle}
                        </p>
                      </div>
                    </div>
                  </>
                )}

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
                    {companionCards.map((card, idx) => {
                      const slotMultiplier = -0.5 + idx;
                      return (
                        <div
                          key={card.id}
                          onClick={() => handleExpCardClick(card.title, card.location, card.slug)}
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
                          {card.videoUrl && scrollProgress >= 0.65 ? (
                            <video
                              key={card.videoUrl}
                              src={card.videoUrl}
                              autoPlay
                              loop
                              muted
                              playsInline
                              disableRemotePlayback
                              controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
                              data-video-popout="false"
                              tabIndex={-1}
                              aria-hidden="true"
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none', transform: 'translateZ(0)' }}
                            />
                          ) : (
                            <img
                              src={card.image}
                              alt={card.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                          )}
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
                              if ((window as any).lenis) {
                                (window as any).lenis.scrollTo(0, { immediate: true });
                              } else {
                                window.scrollTo(0, 0);
                              }
                              setLocation('/experiences');
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
                            EXPLORE ALL ACTIVITIES <ArrowRight size={15} />
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
              {heroSlides.map((slide, idx) => {
                const isActive = idx === currentSlide;
                const isLoaded = loadedSlides.includes(idx);
                return (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: isActive ? 1 : 0,
                      transition: 'opacity 1.2s ease',
                      backgroundColor: '#121316'
                    }}
                  >
                    {isLoaded && (
                      <video
                        src={slide.video}
                        autoPlay={isActive}
                        loop
                        muted
                        playsInline
                        preload={isActive ? 'auto' : 'metadata'}
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
                          pointerEvents: 'none',
                          backgroundColor: '#121316',
                          transform: 'translateZ(0)'
                        }}
                      />
                    )}
                  </div>
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
                  {heroSlides[currentSlide]?.eyebrow || "GOD'S OWN COUNTRY"}
                </span>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    width: '100%',
                    position: 'relative'
                  }}
                >
                  {heroSlides.map((slide, idx) => {
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
                    fontSize: 'clamp(1.85rem, 6.5vw, 2.35rem)',
                    margin: 0,
                    color: '#121316',
                    lineHeight: 1.02,
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase'
                  }}
                >
                  Where Every Landscape Tells a Story
                </h3>
                <p
                  style={{
                    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
                    fontSize: '0.88rem',
                    lineHeight: 1.5,
                    color: '#4B5563',
                    margin: '0.65rem 0 0',
                    fontWeight: 400
                  }}
                >
                  Handpicked sanctuaries across God’s Own Country—from private backwater lagoons to highland tea estates, crafted for seamless luxury exploration.
                </p>
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
                    onClick={() => handleCardClick(item)}
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
                    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.35)',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleExpCardClick(homeCard1.title, homeCard1.location, homeCard1.slug)}
                >
                  <div style={{ height: '220px', position: 'relative', overflow: 'hidden' }}>
                    <video
                      key={homeCard1.videoUrl}
                      src={homeCard1.videoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="none"
                      disablePictureInPicture
                      disableRemotePlayback
                      controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
                      data-video-popout="false"
                      tabIndex={-1}
                      aria-hidden="true"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none', transform: 'translateZ(0)' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(11,20,16,0.95) 100%)' }} />
                  </div>
                  <div style={{ padding: '1.35rem', color: '#FFFFFF', marginTop: '-35px', position: 'relative', zIndex: 2, textAlign: 'center' }}>
                    <h4 className="font-display" style={{ fontSize: '1.25rem', margin: '0 0 0.35rem 0', color: '#FFFFFF' }}>{homeCard1.title}</h4>
                    <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.82)', lineHeight: 1.45, margin: 0 }}>
                      {homeCard1.desc}
                    </p>
                  </div>
                </div>

                {/* Cards 2, 3, 4 */}
                {companionCards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => handleExpCardClick(card.title, card.location, card.slug)}
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
                      {card.videoUrl ? (
                        <video
                          key={card.videoUrl}
                          src={card.videoUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="none"
                          disableRemotePlayback
                          controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
                          data-video-popout="false"
                          tabIndex={-1}
                          aria-hidden="true"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none', transform: 'translateZ(0)' }}
                        />
                      ) : (
                        <img src={card.image} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      )}
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
          perspective: none;
        }

        .bento-theater-wing-left,
        .bento-theater-wing-right {
          transform: none !important;
        }

        .bento-theater-card {
          border: none !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04), 0 8px 16px -2px rgba(0, 0, 0, 0.08), 0 20px 36px -6px rgba(0, 0, 0, 0.16), 0 36px 64px -12px rgba(0, 0, 0, 0.14) !important;
          transition: box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
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
