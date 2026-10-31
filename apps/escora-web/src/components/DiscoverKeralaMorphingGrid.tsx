import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Sparkles, ChevronLeft, ChevronRight, Compass } from 'lucide-react';

export interface KeralaDestinationItem {
  id: string;
  name: string;
  shortName?: string;
  tag: string;
  terrain?: string;
  subtitle: string;
  image: string;
  rating?: string;
  season?: string;
}

export interface DiscoverKeralaMorphingGridProps {
  destinations?: KeralaDestinationItem[];
  onExploreDestination?: (dest: KeralaDestinationItem) => void;
  className?: string;
}

// 5 Curated regional landscapes of Kerala with high-fidelity visuals
export const DEFAULT_KERALA_DESTINATIONS: KeralaDestinationItem[] = [
  {
    id: 'wayanad',
    name: 'Wayanad Rainforest',
    shortName: 'Wayanad',
    tag: 'Evergreen Canopy • 900m',
    terrain: 'Ancient Mist & Biodiversity',
    subtitle: 'Ancient mist-clad Chembra peaks, prehistoric Edakkal rock caves, and private eco-luxury treehouse sanctuaries hidden in evergreen canopies.',
    image: '/images/dest_1_wayanad.jpg',
    rating: '4.8',
    season: 'Sep – May'
  },
  {
    id: 'alleppey',
    name: 'Alleppey & Vembanad',
    shortName: 'Alleppey',
    tag: 'Silent Lagoons • Sea Level',
    terrain: 'Lakeside Stillness & Palm Canals',
    subtitle: 'A labyrinth of palm-fringed canals, private chef dining on handcrafted wooden Kettuvallams, and starlit nights drifting over silent waters.',
    image: '/images/tour_1_backwaters.jpg',
    rating: '4.9',
    season: 'Nov – Feb'
  },
  {
    id: 'munnar',
    name: 'Munnar Tea Highlands',
    shortName: 'Munnar',
    tag: 'Highland Tea Slopes • 1,600m',
    terrain: 'Misty Summits & Colonial Soul',
    subtitle: 'Dramatic mist-shrouded peaks, century-old British planter estates, cool mountain winds, and golden sunrise tea trails.',
    image: '/images/dest_3_munnar.jpg',
    rating: '4.9',
    season: 'Oct – Mar'
  },
  {
    id: 'thekkady',
    name: 'Periyar & Thekkady',
    shortName: 'Thekkady',
    tag: 'Cardamom Hills • 1,000m',
    terrain: 'Wilderness & Spice Sanctuaries',
    subtitle: 'Silent bamboo river rafting deep inside tiger reserves, wild elephant herds along lake shores, and aromatic private cardamom estates.',
    image: '/images/dest_4_rafting.jpg',
    rating: '4.8',
    season: 'Oct – Apr'
  },
  {
    id: 'varkala',
    name: 'Varkala & Marari Shores',
    shortName: 'Varkala',
    tag: 'Laterite Sea Cliffs • Coastline',
    terrain: 'Dramatic Ocean Vistas & Peace',
    subtitle: 'Dramatic red laterite sea cliffs overlooking turquoise surf, sacred mineral springs, private coconut grove pool villas, and silent sunset walks.',
    image: '/images/dest_5_varkala.jpg',
    rating: '4.9',
    season: 'Nov – Mar'
  }
];

// Luxury quintic easing curve as requested
const LUXURY_EASE = [0.22, 1, 0.36, 1] as const;
const TRANSITION_DURATION = 0.65;

// Desktop Grid Placement classes for the 5 fixed geometric positions:
// Slot 0: Left Column Top
// Slot 1: Left Column Bottom
// Slot 2: Center Column Hero (Spans 2 rows)
// Slot 3: Right Column Top
// Slot 4: Right Column Bottom
const DESKTOP_SLOT_CLASSES: Record<number, string> = {
  0: 'lg:col-start-1 lg:row-start-1',
  1: 'lg:col-start-1 lg:row-start-2',
  2: 'lg:col-start-2 lg:row-start-1 lg:row-span-2',
  3: 'lg:col-start-3 lg:row-start-1',
  4: 'lg:col-start-3 lg:row-start-2'
};

export default function DiscoverKeralaMorphingGrid({
  destinations = DEFAULT_KERALA_DESTINATIONS,
  onExploreDestination,
  className = ''
}: DiscoverKeralaMorphingGridProps) {
  // Ordered array of 5 cards representing the 5 slots:
  // [0: Left-Top, 1: Left-Bottom, 2: Center-Hero, 3: Right-Top, 4: Right-Bottom]
  const [cards, setCards] = useState<KeralaDestinationItem[]>(() => {
    if (destinations && destinations.length >= 5) {
      return destinations.slice(0, 5);
    }
    return DEFAULT_KERALA_DESTINATIONS;
  });

  // Morphing Swap Handler:
  // Clicking any side card swaps it into the Center Hero position (Index 2),
  // while the previous Center Hero moves into the clicked card's vacated slot.
  const handleSlotClick = (slotIndex: number) => {
    if (slotIndex === 2) {
      // Center card clicked -> trigger exploration callback
      onExploreDestination?.(cards[2]);
      return;
    }

    setCards((prev) => {
      const next = [...prev];
      const previousHero = next[2];
      next[2] = next[slotIndex];
      next[slotIndex] = previousHero;
      return next;
    });
  };

  return (
    <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 select-none ${className}`}>
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-14">
        <div>
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#9E6F29]" />
            <span className="font-sans text-xs tracking-[0.2em] font-bold text-[#9E6F29] uppercase">
              Discover Kerala
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#121316] uppercase tracking-wide leading-[1.08] font-normal">
            Where Every Landscape <br className="hidden sm:inline" />
            Tells a Story
          </h2>
        </div>

        {/* Counter & Status */}
        <div className="flex items-center gap-3 text-xs tracking-widest text-[#8A857A] font-semibold uppercase">
          <span className="text-[#121316] font-bold text-sm">
            {cards[2].shortName || cards[2].name.split(' ')[0]}
          </span>
          <span className="text-[#C0BCB5]">•</span>
          <span>Featured Sanctuary</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP 3-COLUMN 2-1-2 GEOMETRY (Preserved & Fixed Grid Structure >= 1024px) */}
      {/* ========================================================================= */}
      <div className="hidden lg:grid grid-cols-[1fr_1.38fr_1fr] grid-rows-2 gap-4 xl:gap-5 h-[540px]">
        {cards.map((card, index) => {
          const isCenter = index === 2;
          const slotClass = DESKTOP_SLOT_CLASSES[index] || '';

          return (
            <motion.div
              key={card.id}
              layout
              transition={{
                layout: {
                  duration: TRANSITION_DURATION,
                  ease: LUXURY_EASE
                }
              }}
              onClick={() => handleSlotClick(index)}
              className={`group relative rounded-2xl overflow-hidden cursor-pointer bg-[#0B1410] shadow-md transition-shadow duration-300 hover:shadow-xl ${slotClass}`}
              style={{
                willChange: 'transform',
                zIndex: isCenter ? 20 : 10
              }}
            >
              {/* Background Photographic Image with Smooth Scale */}
              <div className="absolute inset-0 w-full h-full overflow-hidden">
                <img
                  src={card.image}
                  alt={card.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  style={{
                    willChange: 'transform'
                  }}
                />
              </div>

              {/* Dynamic Vignette Overlays: Richer and deeper for center hero */}
              <div
                className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${
                  isCenter
                    ? 'bg-gradient-to-t from-[#0B1410]/95 via-[#0B1410]/40 to-black/25'
                    : 'bg-gradient-to-t from-black/90 via-black/35 to-black/15 group-hover:from-black/95'
                }`}
              />

              {/* ---------------------------------------------------- */}
              {/* CENTER HERO CARD CONTENT (Smooth Cross-fade in/out) */}
              {/* ---------------------------------------------------- */}
              <motion.div
                initial={false}
                animate={{
                  opacity: isCenter ? 1 : 0,
                  pointerEvents: isCenter ? 'auto' : 'none',
                  scale: isCenter ? 1 : 0.98
                }}
                transition={{
                  duration: 0.45,
                  delay: isCenter ? 0.15 : 0,
                  ease: LUXURY_EASE
                }}
                className="absolute inset-0 p-7 lg:p-8 flex flex-col justify-between"
              >
                {/* Top Badge Row */}
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold tracking-wider uppercase shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{card.tag}</span>
                  </div>

                  {card.rating && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-400/90 text-[#0B1410] text-[11px] font-bold tracking-tight shadow-sm">
                      ★ {card.rating}
                    </span>
                  )}
                </div>

                {/* Bottom Editorial Block & Exploration CTA */}
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-amber-300/90 block mb-1">
                      {card.terrain || 'Signature Landscape'}
                    </span>
                    <h3 className="font-serif text-2xl lg:text-3xl xl:text-4xl text-white font-normal uppercase tracking-wide leading-tight drop-shadow-md">
                      {card.name}
                    </h3>
                  </div>

                  <p className="text-white/80 text-xs lg:text-sm font-sans line-clamp-2 max-w-md leading-relaxed drop-shadow">
                    {card.subtitle}
                  </p>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onExploreDestination?.(card);
                      }}
                      className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white text-xs font-bold tracking-widest uppercase transition-all duration-300 shadow-lg hover:scale-105 active:scale-95 group/btn cursor-pointer"
                    >
                      <span>EXPLORE {card.shortName || card.name.split(' ')[0]}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* ---------------------------------------------------- */}
              {/* SIDE LANDSCAPE CARD CONTENT (Compact, Clean, Subtle) */}
              {/* ---------------------------------------------------- */}
              <motion.div
                initial={false}
                animate={{
                  opacity: isCenter ? 0 : 1,
                  pointerEvents: isCenter ? 'none' : 'auto'
                }}
                transition={{
                  duration: 0.35,
                  delay: isCenter ? 0 : 0.15,
                  ease: LUXURY_EASE
                }}
                className="absolute inset-0 p-5 flex flex-col justify-between"
              >
                {/* Compact Top Category Badge */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-white/90 text-[10px] font-medium tracking-wider uppercase">
                    <Compass className="w-3 h-3 text-white/70" />
                    <span className="truncate max-w-[140px]">{card.tag.split('•')[0]}</span>
                  </span>

                  <span className="text-[10px] text-amber-300/80 font-medium tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Promote ↗
                  </span>
                </div>

                {/* Bottom Compact Title & Subtitle */}
                <div>
                  <h4 className="font-serif text-lg text-white font-normal uppercase tracking-wide leading-snug line-clamp-1 drop-shadow">
                    {card.name}
                  </h4>
                  <p className="text-white/70 text-xs font-sans line-clamp-1 mt-0.5">
                    {card.subtitle}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TABLET & MOBILE RESPONSIVE LAYOUT (< 1024px)                               */}
      {/* Featured Hero Card on top + Interactive Swipeable Carousel Rail below     */}
      {/* ========================================================================= */}
      <div className="lg:hidden flex flex-col gap-5">
        {/* Active Promoted Center Hero Card */}
        <motion.div
          key={`mobile-hero-${cards[2].id}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: LUXURY_EASE }}
          className="relative w-full h-[380px] sm:h-[440px] rounded-2xl overflow-hidden bg-[#0B1410] shadow-xl"
          onClick={() => onExploreDestination?.(cards[2])}
        >
          <img
            src={cards[2].image}
            alt={cards[2].name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1410]/95 via-[#0B1410]/40 to-black/25" />

          <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{cards[2].tag}</span>
              </span>
              {cards[2].rating && (
                <span className="px-2.5 py-1 rounded-full bg-amber-400/90 text-[#0B1410] text-[11px] font-bold">
                  ★ {cards[2].rating}
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-amber-300/90 block mb-1">
                  {cards[2].terrain || 'Featured Sanctuary'}
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl text-white uppercase tracking-wide leading-tight">
                  {cards[2].name}
                </h3>
              </div>

              <p className="text-white/80 text-xs sm:text-sm font-sans line-clamp-2">
                {cards[2].subtitle}
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExploreDestination?.(cards[2]);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white text-xs font-bold tracking-widest uppercase shadow-md cursor-pointer"
                >
                  <span>EXPLORE {cards[2].shortName || cards[2].name.split(' ')[0]}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Swipeable Carousel Thumbnails for Side Cards */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold tracking-wider uppercase text-[#8A857A]">
              Tap Any Sanctuary to Swap
            </span>
            <span className="text-[11px] font-mono text-[#9E6F29]">
              05 Destinations
            </span>
          </div>

          <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
            {cards.map((card, idx) => {
              const isCenter = idx === 2;
              return (
                <button
                  type="button"
                  key={`thumb-${card.id}`}
                  onClick={() => handleSlotClick(idx)}
                  className={`flex-shrink-0 snap-start text-left w-[200px] h-[130px] rounded-xl overflow-hidden relative border-2 transition-all duration-300 cursor-pointer ${
                    isCenter
                      ? 'border-amber-400 ring-2 ring-amber-400/30 opacity-100 scale-[1.02]'
                      : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={card.image}
                    alt={card.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute inset-0 p-3 flex flex-col justify-between">
                    <span className="text-[9px] font-semibold text-white/90 uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-xs self-start">
                      {isCenter ? 'Active Hero' : 'Tap to swap'}
                    </span>
                    <span className="font-serif text-sm text-white font-medium uppercase tracking-wide truncate">
                      {card.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
