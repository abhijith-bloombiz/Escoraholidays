import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TESTIMONIALS, type TestimonialItem } from '../data/escoraData';
import { useScrollReveal } from '../hooks/useScrollAnimation';
import { useListTestimonials } from '@workspace/api-client-react';

// Renders review text with sequential letter-by-letter handwriting ink animation
function renderLetterByLetter(text: string, isVisible: boolean) {
  const words = text.split(' ');
  let charIndex = 0;

  return words.map((word, wIdx) => {
    const letters = word.split('').map((char, cIdx) => {
      const delay = charIndex * 0.014;
      charIndex++;
      return (
        <span
          key={`c-${cIdx}`}
          style={{
            display: 'inline-block',
            opacity: 0,
            animation: isVisible ? `inkWrite 0.32s cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}s forwards` : 'none',
            willChange: 'opacity, transform, filter'
          }}
        >
          {char}
        </span>
      );
    });

    const spaceDelay = charIndex * 0.014;
    charIndex++;

    return (
      <span key={`w-${wIdx}`} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
        {letters}
        {wIdx < words.length - 1 && (
          <span
            key={`s-${wIdx}`}
            style={{
              display: 'inline-block',
              width: '0.34em',
              opacity: 0,
              animation: isVisible ? `inkWrite 0.32s cubic-bezier(0.2, 0.8, 0.2, 1) ${spaceDelay}s forwards` : 'none'
            }}
          >
            {' '}
          </span>
        )}
      </span>
    );
  });
}

export default function Testimonials() {
  const [activeIdx, setActiveIdx] = useState<number>(0);
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

  const handlePrev = () => {
    setActiveIdx((prev) => (prev === 0 ? testimonialsList.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIdx((prev) => (prev === testimonialsList.length - 1 ? 0 : prev + 1));
  };

  const safeIdx = activeIdx >= testimonialsList.length ? 0 : activeIdx;
  const item = testimonialsList[safeIdx];

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      style={{
        backgroundColor: '#F8F6F1',
        padding: '5rem 0 7rem',
        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
        overflow: 'hidden'
      }}
    >
      <div className="section-wrapper">

        {/* Header Row: Heading parallel to Navigation Arrows */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
            marginBottom: '2rem',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(32px)',
            transition: 'opacity 0.8s var(--ease-luxury), transform 0.8s var(--ease-luxury)'
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.65rem'
              }}
            >
              <span
                style={{
                  textTransform: 'uppercase',
                  fontSize: '0.78rem',
                  letterSpacing: '0.2em',
                  color: '#9E6F29',
                  fontWeight: 700
                }}
              >
                GUEST VOICES
              </span>
            </div>

            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(2.1rem, 4vw, 3.4rem)',
                color: '#121316',
                lineHeight: 1.05,
                letterSpacing: '0.04em',
                marginBottom: '0.5rem'
              }}
            >
              WHAT OUR TRAVELERS SAY
            </h2>

            <p
              style={{
                fontSize: 'clamp(0.95rem, 1.1vw, 1.05rem)',
                color: '#5C5850',
                lineHeight: 1.5,
                margin: 0
              }}
            >
              Firsthand accounts from international travelers who explored Kerala with ESCORA.
            </p>
          </div>

          {/* Square Navigation Arrows */}
          <div style={{ display: 'flex', gap: '0.75rem', paddingBottom: '0.25rem' }}>
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
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 3fr)',
            gap: '2rem',
            alignItems: 'stretch'
          }}
          className="testimonial-grid"
        >
          {/* Left: White Card with Author info and Large Quote */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: 'clamp(1.75rem, 2.5vw, 2.5rem)',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '280px',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.96)',
              transition: 'opacity 0.85s var(--ease-luxury), transform 0.85s var(--ease-luxury)',
              transitionDelay: isVisible ? '0.14s' : '0s'
            }}
          >
            {/* Top row: Author Info (social acronyms PIN, IN, X, FB removed) */}
            <div
              key={`author-${activeIdx}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '1.5rem',
                borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                paddingBottom: '1rem',
                animation: 'fadeUpSoft 0.45s var(--ease-luxury)'
              }}
            >
              <div>
                <h3
                  className="font-display"
                  style={{
                    fontSize: '1.45rem',
                    color: '#121316',
                    letterSpacing: '0.04em',
                    lineHeight: 1.1
                  }}
                >
                  {item.author}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
                  {item.role}
                </p>
              </div>
            </div>

            {/* Large Quote with letter-by-letter handwriting ink animation */}
            <blockquote
              key={`quote-${activeIdx}`}
              style={{
                fontSize: 'clamp(1.15rem, 1.8vw, 1.45rem)',
                fontWeight: 400,
                color: '#121316',
                lineHeight: 1.45,
                fontFamily: 'var(--font-serif)',
                fontStyle: 'normal'
              }}
            >
              {renderLetterByLetter(item.quote, isVisible)}
            </blockquote>

            {/* Pagination dots indicator */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
              {testimonialsList.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIdx(idx)}
                  style={{
                    width: idx === safeIdx ? '28px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor: idx === safeIdx ? '#121316' : '#D1D5DB',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.35s var(--ease-luxury)'
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right: Portrait Image (30% Card) */}
          <div
            style={{
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.1)',
              minHeight: '280px',
              position: 'relative',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.96)',
              transition: 'opacity 0.85s var(--ease-luxury), transform 0.85s var(--ease-luxury)',
              transitionDelay: isVisible ? '0.28s' : '0s'
            }}
          >
            <img
              key={`img-${activeIdx}`}
              src={item.image}
              alt={item.author}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                animation: 'fadeUpSoft 0.6s var(--ease-luxury)'
              }}
            />
          </div>

        </div>

      </div>

      <style>{`
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
          .testimonial-grid {
            grid-template-columns: 1fr !important;
          }
          .testimonial-grid > div:last-child {
            min-height: 240px !important;
            max-height: 340px !important;
          }
        }
      `}</style>
    </section>
  );
}
