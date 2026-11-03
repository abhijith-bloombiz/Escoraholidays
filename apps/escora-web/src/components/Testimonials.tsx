import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollAnimation';
import { useListTestimonials } from '@workspace/api-client-react';

export interface TestimonialItem {
  id: string;
  author: string;
  role: string;
  quote: string;
  image: string;
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: '1',
    author: 'ELEANOR V.',
    role: 'HONEYMOON, LONDON',
    quote: "They moved a sunset for us. Or it felt that way. A boat appeared on a backwater I'd been told didn't exist — and a chef I'd long admired was on it.",
    image: '/images/testimonials/photo_eleanor.jpg'
  },
  {
    id: '2',
    author: 'MARCUS T.',
    role: 'FAMILY, SAN FRANCISCO',
    quote: "Our family of seven, ages 6 to 78. The itinerary anticipated every single one of us.",
    image: '/images/testimonials/photo_marcus.jpg'
  },
  {
    id: '3',
    author: 'DR. AIKO N.',
    role: 'WELLNESS, TOKYO',
    quote: "Escora did not arrange a holiday — they arranged a recovery.",
    image: '/images/testimonials/photo_aiko.jpg'
  }
];

function renderLetterByLetter(text: string, isVisible: boolean) {
  let globalCharIndex = 0;
  const words = text.split(' ');
  return words.map((word, wordIdx) => {
    const chars = Array.from(word);
    const wordSpans = chars.map((char) => {
      const delay = isVisible ? `${(globalCharIndex * 0.007).toFixed(3)}s` : '0s';
      globalCharIndex++;
      return (
        <span
          key={`c-${wordIdx}-${char}-${globalCharIndex}`}
          style={{
            display: 'inline-block',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(4px) scale(0.94)',
            filter: isVisible ? 'blur(0)' : 'blur(1.5px)',
            transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), filter 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            transitionDelay: delay,
            willChange: 'opacity, transform, filter'
          }}
        >
          {char}
        </span>
      );
    });

    globalCharIndex++; // space

    return (
      <span key={`w-${wordIdx}`} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
        {wordSpans}
        {wordIdx < words.length - 1 ? '\u00A0' : ''}
      </span>
    );
  });
}

interface QuoteCardProps {
  item: TestimonialItem;
  safeIdx: number;
  isVisible: boolean;
  isHovered: boolean;
  testimonialsList: TestimonialItem[];
  onDotClick: (idx: number) => void;
  isExiting?: boolean;
  animateIn?: boolean;
  durationMs?: number;
}

function QuoteCard({
  item,
  safeIdx,
  isVisible,
  isHovered,
  testimonialsList,
  onDotClick,
  isExiting,
  animateIn,
  durationMs = 8000
}: QuoteCardProps) {
  let cardAnimation = 'none';
  if (isExiting) {
    cardAnimation = 'fadePreviousCard 0.85s var(--ease-luxury) forwards';
  } else if (animateIn) {
    cardAnimation = 'slideInFromLeftScreen 0.95s cubic-bezier(0.16, 1, 0.3, 1) forwards';
  }

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        padding: 'clamp(1.5rem, 2.2vw, 2.2rem) clamp(1.75rem, 2.6vw, 2.75rem)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: 'clamp(270px, 32vh, 310px)',
        width: '100%',
        boxSizing: 'border-box',
        ...(isExiting
          ? {
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              zIndex: 1,
              animation: cardAnimation
            }
          : {
              position: 'relative',
              zIndex: 2,
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.96)',
              transition: animateIn ? 'none' : 'opacity 0.85s var(--ease-luxury), transform 0.85s var(--ease-luxury)',
              transitionDelay: isVisible ? '0.14s' : '0s',
              animation: cardAnimation
            })
      }}
    >
      {/* Top row: Author Info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '0.85rem',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          paddingBottom: '0.65rem'
        }}
      >
        <div>
          <h3
            className="font-display"
            style={{
              fontSize: '1.4rem',
              color: '#121316',
              letterSpacing: '0.04em',
              lineHeight: 1.1,
              margin: 0
            }}
          >
            {item.author}
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#9CA3AF', margin: '0.2rem 0 0 0' }}>
            {item.role}
          </p>
        </div>
      </div>

      {/* Large Quote with letter-by-letter handwriting ink animation */}
      <blockquote
        style={{
          fontSize: 'clamp(1.06rem, 1.3vw, 1.25rem)',
          fontWeight: 400,
          color: '#121316',
          lineHeight: 1.5,
          fontFamily: 'var(--font-body)',
          fontStyle: 'normal',
          margin: 0
        }}
      >
        {renderLetterByLetter(item.quote, isVisible)}
      </blockquote>

      {/* Pagination dots indicator with animated duration progress bar */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          marginTop: '1rem'
        }}
      >
        {testimonialsList.map((_, idx) => {
          const isActive = idx === safeIdx;
          const durationSeconds = (durationMs || 8000) / 1000;
          return (
            <button
              key={idx}
              onClick={() => onDotClick(idx)}
              style={{
                width: isActive ? '32px' : '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: '#D1D5DB',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'width 0.35s var(--ease-luxury)'
              }}
              title={`Slide ${idx + 1} of ${testimonialsList.length} (${durationSeconds}s)`}
              aria-label={`Go to slide ${idx + 1}`}
            >
              {isActive && (
                <span
                  key={`fill-${safeIdx}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#121316',
                    borderRadius: '4px',
                    transformOrigin: 'left center',
                    animation: `testimonialProgressBar ${durationSeconds}s linear forwards`,
                    animationPlayState: isHovered ? 'paused' : 'running'
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Testimonials() {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [sectionRef, isVisible] = useScrollReveal<HTMLElement>({ threshold: 0.12, reEnter: true });

  const { data: remoteTestimonials } = useListTestimonials();

  const testimonialsList: TestimonialItem[] = useMemo(() => {
    if (remoteTestimonials && remoteTestimonials.length > 0) {
      const published = remoteTestimonials.filter((t) => t.published);
      if (published.length > 0) {
        return published.map((t, idx) => {
          const roleParts = [];
          if (t.category) roleParts.push(t.category.trim());
          if (t.location) roleParts.push(t.location.trim());
          const formattedRole = roleParts.length > 0 ? roleParts.join(', ') : 'Verified Guest';

          return {
            id: String(t.id),
            author: (t.name || 'GUEST').toUpperCase(),
            role: formattedRole,
            quote: (t.quote || '').replace(/<[^>]*>/g, '').trim(),
            image: t.photoUrl || t.avatarUrl || TESTIMONIALS[idx % TESTIMONIALS.length]?.image || '/images/testimonial_emily.jpg',
          };
        });
      }
    }
    return TESTIMONIALS;
  }, [remoteTestimonials]);

  const DURATION_MS = 8000;
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(DURATION_MS);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Automatically advance testimonial cards every 8 seconds, pausing/resuming smoothly on hover
  useEffect(() => {
    if (testimonialsList.length <= 1) return;

    if (isHovered) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
      return;
    }

    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      setActiveIdx((prev) => (prev + 1) % testimonialsList.length);
      remainingTimeRef.current = DURATION_MS;
    }, remainingTimeRef.current);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isHovered, activeIdx, testimonialsList.length]);

  const handlePrev = () => {
    remainingTimeRef.current = DURATION_MS;
    setActiveIdx((prev) => (prev === 0 ? testimonialsList.length - 1 : prev - 1));
  };

  const handleNext = () => {
    remainingTimeRef.current = DURATION_MS;
    setActiveIdx((prev) => (prev === testimonialsList.length - 1 ? 0 : prev + 1));
  };

  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [exitingIdx, setExitingIdx] = useState<number | null>(null);
  const [hasAnimated, setHasAnimated] = useState<boolean>(false);

  useEffect(() => {
    if (activeIdx !== currentIdx) {
      setExitingIdx(currentIdx);
      setCurrentIdx(activeIdx);
      setHasAnimated(true);
    }
  }, [activeIdx, currentIdx]);

  useEffect(() => {
    if (exitingIdx === null) return;
    const timer = setTimeout(() => {
      setExitingIdx(null);
    }, 980);
    return () => clearTimeout(timer);
  }, [exitingIdx]);

  const safeCurrentIdx = currentIdx >= testimonialsList.length ? 0 : currentIdx;
  const currentItem = testimonialsList[safeCurrentIdx];

  const safeExitingIdx = exitingIdx !== null && exitingIdx < testimonialsList.length ? exitingIdx : null;
  const exitingItem = safeExitingIdx !== null ? testimonialsList[safeExitingIdx] : null;

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      style={{
        backgroundColor: '#F8F6F1',
        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '4.5rem 0 3.5rem',
        boxSizing: 'border-box'
      }}
    >
      <div
        className="section-wrapper"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%'
        }}
      >
        {/* Section Heading + Navigation Arrows */}
        <div
          className="testimonials-header-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginBottom: '1.75rem',
            position: 'relative'
          }}
        >
          <div>
            <span
              className="section-eyebrow"
              style={{
                color: '#B48235',
                fontSize: '0.8rem',
                letterSpacing: '0.18em',
                fontWeight: 700,
                display: 'block',
                marginBottom: '0.45rem'
              }}
            >
              VOICES OF ESCORA
            </span>

            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(2.1rem, 3.8vw, 3.2rem)',
                color: '#121316',
                lineHeight: 1.05,
                letterSpacing: '0.04em',
                marginBottom: '0.35rem'
              }}
            >
              WHAT OUR TRAVELERS SAY
            </h2>

            <p
              style={{
                fontSize: 'clamp(0.9rem, 1.05vw, 1rem)',
                color: '#5C5850',
                lineHeight: 1.45,
                margin: 0
              }}
            >
              Firsthand accounts from international travelers who explored Kerala with ESCORA.
            </p>
          </div>

          {/* Square Navigation Arrows aligned vertically with the heading area */}
          <div
            className="testimonials-nav-arrows"
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center'
            }}
          >
            <button
              onClick={handlePrev}
              className="nav-arrow-btn light"
              aria-label="Previous Testimonial"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="nav-arrow-btn dark"
              aria-label="Next Testimonial"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Testimonial Two-Column Panel: 70% Left Quote Card, 30% Right Photo Card */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 3fr)',
            gap: '1.75rem',
            alignItems: 'stretch',
            width: '100%'
          }}
          className="testimonial-grid"
        >
          {/* Left: White Card with Author info and Large Quote */}
          <div
            className="testimonial-quote-col"
            style={{
              position: 'relative',
              width: '100%',
              minHeight: 'clamp(270px, 32vh, 310px)'
            }}
          >
            {/* Exiting Quote Card (fades out smoothly) */}
            {safeExitingIdx !== null && exitingItem && (
              <QuoteCard
                key={`exiting-quote-${safeExitingIdx}`}
                item={exitingItem}
                safeIdx={safeExitingIdx}
                isVisible={isVisible}
                isHovered={isHovered}
                testimonialsList={testimonialsList}
                onDotClick={(idx) => {
                  remainingTimeRef.current = DURATION_MS;
                  setActiveIdx(idx);
                }}
                isExiting={true}
                durationMs={DURATION_MS}
              />
            )}

            {/* Current Quote Card (slides in from left once and stays stably mounted with zero reload) */}
            <QuoteCard
              key={`current-quote-${safeCurrentIdx}`}
              item={currentItem}
              safeIdx={safeCurrentIdx}
              isVisible={isVisible}
              isHovered={isHovered}
              testimonialsList={testimonialsList}
              onDotClick={(idx) => {
                remainingTimeRef.current = DURATION_MS;
                setActiveIdx(idx);
              }}
              animateIn={hasAnimated}
              durationMs={DURATION_MS}
            />
          </div>

          {/* Right: Portrait Image (30% Card) matching height with Left Card */}
          <div
            className="testimonial-photo-col"
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              minHeight: 'clamp(270px, 32vh, 310px)'
            }}
          >
            {/* Exiting Photo Card (fades out) */}
            {safeExitingIdx !== null && exitingItem && (
              <div
                key={`exiting-photo-${safeExitingIdx}`}
                className="testimonial-photo-card"
                style={{
                  borderRadius: '24px',
                  overflow: 'hidden',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.1)',
                  minHeight: 'clamp(270px, 32vh, 310px)',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 1,
                  animation: 'fadePreviousCard 0.85s var(--ease-luxury) forwards'
                }}
              >
                <img
                  src={exitingItem.image}
                  alt={exitingItem.author}
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (!target.dataset.fallbackApplied) {
                      target.dataset.fallbackApplied = 'true';
                      target.src = '/images/testimonials/photo_eleanor.jpg';
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              </div>
            )}

            {/* Current Photo Card (slides in from right once and stays stably mounted with zero reload) */}
            <div
              key={`current-photo-${safeCurrentIdx}`}
              className="testimonial-photo-card"
              style={{
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.1)',
                minHeight: 'clamp(270px, 32vh, 310px)',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 2,
                opacity: isVisible ? 1 : 0,
                transform: hasAnimated ? 'none' : isVisible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.96)',
                transition: hasAnimated ? 'none' : 'opacity 0.85s var(--ease-luxury), transform 0.85s var(--ease-luxury)',
                transitionDelay: hasAnimated ? '0s' : isVisible ? '0.28s' : '0s',
                animation: hasAnimated ? 'slideInFromRightScreen 0.95s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'none'
              }}
            >
              <img
                src={currentItem.image}
                alt={currentItem.author}
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (!target.dataset.fallbackApplied) {
                    target.dataset.fallbackApplied = 'true';
                    target.src = '/images/testimonials/photo_eleanor.jpg';
                  }
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            </div>
          </div>

        </div>

      </div>

      <style>{`
        @keyframes fadePreviousCard {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.95);
          }
        }

        @keyframes slideInFromLeftScreen {
          0% {
            opacity: 0;
            transform: translateX(-100vw);
          }
          15% {
            opacity: 1;
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInFromRightScreen {
          0% {
            opacity: 0;
            transform: translateX(100vw);
          }
          15% {
            opacity: 1;
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes testimonialProgressBar {
          0% {
            transform: scaleX(0);
          }
          100% {
            transform: scaleX(1);
          }
        }

        @keyframes inkWrite {
          0% {
            opacity: 0;
            transform: translateY(4px) scale(0.94);
            filter: blur(1.5px);
          }
          50% {
            opacity: 0.85;
            filter: blur(0.3px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes fadeUpSoft {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 900px) {
          #testimonials {
            min-height: auto !important;
            height: auto !important;
            padding: 2.25rem 0 1.5rem !important;
          }
          .testimonial-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
          .testimonial-grid > div:first-child {
            min-height: auto !important;
            height: auto !important;
          }
          .testimonial-photo-card {
            display: none !important;
          }
        }

        @media (max-width: 768px) {
          .testimonials-header-row {
            flex-direction: column !important;
            align-items: center !important;
            gap: 1.25rem !important;
            margin-bottom: 1.5rem !important;
          }
          .testimonials-nav-arrows {
            position: static !important;
            top: auto !important;
            transform: none !important;
            padding-bottom: 0 !important;
          }
        }
      `}</style>
    </section>
  );
}
