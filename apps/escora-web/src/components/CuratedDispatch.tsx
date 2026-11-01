import React, { useState, useEffect, useRef } from 'react';
import { LIMITED_OFFERS_IMAGES } from '../data/escoraData';
import { CheckCircle2 } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollAnimation';

export interface CuratedDispatchProps {
  onShowToast?: (msg: string) => void;
}

export default function CuratedDispatch({ onShowToast }: CuratedDispatchProps) {
  const [email, setEmail] = useState<string>('');
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const [sectionRef, isVisible] = useScrollReveal<HTMLElement>({ threshold: 0.12, reEnter: true });

  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let rafId: number | null = null;

    const updateParallax = () => {
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const windowH = window.innerHeight;

      // Only update when section is near or inside the viewport
      if (rect.bottom < -120 || rect.top > windowH + 120) return;

      const sectionCenter = rect.top + rect.height * 0.5;
      const viewportCenter = windowH * 0.5;
      const distFromCenter = sectionCenter - viewportCenter;

      // Multi-layer depth parallax scroll offsets
      const y1 = distFromCenter * 0.08;
      const y2 = distFromCenter * -0.06;
      const y3 = distFromCenter * 0.15;

      if (card1Ref.current) {
        card1Ref.current.style.transform = `translate3d(0, ${y1.toFixed(2)}px, 0)`;
      }
      if (card2Ref.current) {
        card2Ref.current.style.transform = `translate3d(0, ${y2.toFixed(2)}px, 0)`;
      }
      if (card3Ref.current) {
        card3Ref.current.style.transform = `translate3d(0, ${y3.toFixed(2)}px, 0)`;
      }
    };

    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        updateParallax();
        rafId = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    const lenis = (window as any).lenis;
    if (lenis && typeof lenis.on === 'function') {
      lenis.on('scroll', handleScroll);
    }

    updateParallax();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      const activeLenis = (window as any).lenis;
      if (activeLenis && typeof activeLenis.off === 'function') {
        activeLenis.off('scroll', handleScroll);
      }
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [sectionRef]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    try {
      await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
    } catch (err) {
      console.warn('Newsletter subscribe network note:', err);
    }
    setSubscribed(true);
    if (onShowToast) {
      onShowToast('Thank you for subscribing to ESCORA Kerala travel inspiration!');
    }
    setTimeout(() => {
      setEmail('');
      setSubscribed(false);
    }, 4000);
  };

  return (
    <section
      id="newsletter"
      ref={sectionRef}
      style={{
        backgroundColor: '#F8F6F1',
        padding: '3.5rem 0 4.5rem',
        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <span id="offers" style={{ position: 'absolute', top: '-80px' }} />
      <div className="section-wrapper">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
            alignItems: 'center',
            gap: '4rem'
          }}
          className="offers-grid"
        >

          {/* Left Column: Typographic Offer & Newsletter */}
          <div
            style={{
              maxWidth: '540px',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0)' : 'translateX(-40px)',
              transition: 'opacity 0.85s var(--ease-luxury), transform 0.85s var(--ease-luxury)'
            }}
          >


            {/* Gold Luxury Eyebrow Tag */}
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
                  fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
                  textTransform: 'uppercase',
                  fontSize: '0.78rem',
                  letterSpacing: '0.2em',
                  color: '#9E6F29',
                  fontWeight: 700
                }}
              >
                THE ESCORA JOURNAL
              </span>
            </div>

            {/* Headline */}
            <h2
              className="font-display curated-dispatch-title"
              style={{
                fontSize: 'clamp(2.4rem, 4.4vw, 3.8rem)',
                color: '#121316',
                lineHeight: 1.05,
                letterSpacing: '0.04em',
                marginBottom: '1rem'
              }}
            >
              STORIES, SEASONS<br />&amp; DISCOVERIES.
            </h2>

            {/* Short Quality Description */}
            <p
              className="curated-dispatch-desc"
              style={{
                fontSize: 'clamp(1rem, 1.15vw, 1.1rem)',
                lineHeight: 1.6,
                color: '#374151',
                maxWidth: '460px',
                marginBottom: '1.75rem',
                fontWeight: 400
              }}
            >
              Discover Kerala beyond the familiar. Explore seasonal travel inspiration, remarkable places, and thoughtful insights to help you imagine your next journey.
            </p>

            {/* Pill-shaped subscription field */}
            <form
              onSubmit={handleSubmit}
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: '9999px',
                padding: '0.4rem 0.4rem 0.4rem 1.4rem',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                maxWidth: '460px'
              }}
            >
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  flexGrow: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.95rem',
                  color: '#121316',
                  backgroundColor: 'transparent',
                  fontFamily: 'var(--font-body)'
                }}
              />
              <button
                type="submit"
                className="btn-pill btn-black"
                style={{
                  padding: '0.75rem 1.6rem',
                  fontSize: '0.875rem',
                  whiteSpace: 'nowrap'
                }}
              >
                {subscribed ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={16} color="#10B981" /> Subscribed
                  </span>
                ) : (
                  'Subscribe'
                )}
              </button>
            </form>

            <p style={{ fontSize: '0.85rem', color: '#4B5563', marginTop: '0.85rem', paddingLeft: '0.75rem', fontWeight: 500 }}>
              Delivered monthly. No spam, ever. Unsubscribe with one click.
            </p>
          </div>

          {/* Right Column: Overlapping Tilted Photographic Collage (Centered Vertically) */}
          <div
            style={{
              position: 'relative',
              height: '520px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            className="offers-collage-container"
          >
            {/* Card 1: Tilted Left (Back Left) - Vertically Centered */}
            <div
              ref={card1Ref}
              className="dispatch-parallax-wrap"
              style={{
                position: 'absolute',
                left: '4%',
                top: '50%',
                width: '275px',
                height: '345px',
                zIndex: 1,
                willChange: 'transform'
              }}
            >
              <div
                className="dispatch-card"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(-54%) rotate(-12deg) scale(1)' : 'translateY(-54%) rotate(0deg) scale(0.85) translateX(-25px)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.16)',
                  transition: 'transform 0.9s var(--ease-luxury) 0.15s, opacity 0.8s var(--ease-luxury) 0.15s, box-shadow 0.4s ease'
                }}
              >
                <img
                  src={LIMITED_OFFERS_IMAGES.tiltedLeft}
                  alt="Munnar emerald tea highlands, Kerala"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </div>

            {/* Card 2: Tilted Right (Back Right) - Vertically Centered */}
            <div
              ref={card2Ref}
              className="dispatch-parallax-wrap"
              style={{
                position: 'absolute',
                right: '4%',
                top: '50%',
                width: '255px',
                height: '320px',
                zIndex: 2,
                willChange: 'transform'
              }}
            >
              <div
                className="dispatch-card"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(-58%) rotate(18deg) scale(1)' : 'translateY(-58%) rotate(0deg) scale(0.85) translateX(25px)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.16)',
                  transition: 'transform 0.9s var(--ease-luxury) 0.28s, opacity 0.8s var(--ease-luxury) 0.28s, box-shadow 0.4s ease'
                }}
              >
                <img
                  src={LIMITED_OFFERS_IMAGES.tiltedRight}
                  alt="Varkala coastal red cliffs, Kerala"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </div>

            {/* Card 3: Upright in Front (Center-Right) - Vertically Centered */}
            <div
              ref={card3Ref}
              className="dispatch-parallax-wrap"
              style={{
                position: 'absolute',
                right: '16%',
                top: '50%',
                width: '265px',
                height: '340px',
                zIndex: 4,
                willChange: 'transform'
              }}
            >
              <div
                className="dispatch-card"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(-44%) rotate(0deg) scale(1)' : 'translateY(-44%) rotate(0deg) scale(0.85) translateY(35px)',
                  boxShadow: '0 24px 50px rgba(0, 0, 0, 0.22)',
                  transition: 'transform 0.9s var(--ease-luxury) 0.4s, opacity 0.8s var(--ease-luxury) 0.4s, box-shadow 0.4s ease'
                }}
              >
                <img
                  src={LIMITED_OFFERS_IMAGES.centerFront}
                  alt="Luxury private Alleppey houseboat, Kerala"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </div>

          </div>

        </div>
      </div>

      <style>{`
        .dispatch-parallax-wrap {
          will-change: transform;
        }
        .dispatch-parallax-wrap:hover {
          z-index: 15 !important;
        }
        .dispatch-card {
          isolation: isolate;
          -webkit-mask-image: -webkit-radial-gradient(white, black);
          mask-image: radial-gradient(white, black);
          cursor: pointer;
        }
        .dispatch-card:hover {
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.26) !important;
          z-index: 10 !important;
        }
        .dispatch-card img {
          transition: transform 0.65s cubic-bezier(0.16, 1, 0.3, 1) !important;
          will-change: transform;
          transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          pointer-events: none;
        }
        .dispatch-card:hover img {
          transform: scale(1.06) translate3d(0, 0, 0) !important;
        }
        @media (max-width: 900px) {
          #newsletter {
            padding: 1.5rem 0 2rem !important;
          }
          .offers-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
          .curated-dispatch-title {
            font-size: clamp(1.85rem, 6.5vw, 2.35rem) !important;
            line-height: 1.05 !important;
            margin-bottom: 0.75rem !important;
          }
          .curated-dispatch-desc {
            font-size: 0.92rem !important;
            line-height: 1.5 !important;
            margin-bottom: 1.25rem !important;
          }
          .offers-collage-container {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}
