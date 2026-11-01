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

        {/* Header Row: Heading parallel to Navigation Arrows */}
        <div
          className="testimonials-header-row"
          style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'clamp(1.75rem, 3vh, 2.5rem)',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(32px)',
            transition: 'opacity 0.8s var(--ease-luxury), transform 0.8s var(--ease-luxury)'
          }}
        >
          {/* Centered Heading Block */}
          <div
            style={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              maxWidth: '680px'
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.45rem'
              }}
            >
              <span
                style={{
                  fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
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
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: 'clamp(1.85rem, 2.6vw, 2.5rem) clamp(2rem, 3vw, 3rem)',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: 'clamp(320px, 38vh, 370px)',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.96)',
              transition: 'opacity 0.85s var(--ease-luxury), transform 0.85s var(--ease-luxury)',
              transitionDelay: isVisible ? '0.14s' : '0s'
            }}
          >
            {/* Top row: Author Info */}
            <div
              key={`author-${activeIdx}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '0.95rem',
                borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                paddingBottom: '0.75rem',
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
                    lineHeight: 1.1,
                    margin: 0
                  }}
                >
                  {item.author}
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#9CA3AF', margin: '0.25rem 0 0 0' }}>
                  {item.role}
                </p>
              </div>
            </div>

            {/* Large Quote with letter-by-letter handwriting ink animation */}
            <blockquote
              key={`quote-${activeIdx}`}
              style={{
                fontSize: 'clamp(1.1rem, 1.35vw, 1.28rem)',
                fontWeight: 400,
                color: '#121316',
                lineHeight: 1.55,
                fontFamily: 'var(--font-body)',
                fontStyle: 'normal',
                margin: 0
              }}
            >
              {renderLetterByLetter(item.quote, isVisible)}
            </blockquote>

            {/* Pagination dots indicator */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '1.25rem' }}>
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

          {/* Right: Portrait Image (30% Card) matching height with Left Card */}
          <div
            className="testimonial-photo-card"
            style={{
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.1)',
              minHeight: 'clamp(320px, 38vh, 370px)',
              position: 'relative',
              width: '100%',
              height: '100%',
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
                position: 'absolute',
                top: 0,
                left: 0,
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
