import React, { useState } from 'react';
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
        padding: '5rem 0',
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
                  textTransform: 'uppercase',
                  fontSize: '0.78rem',
                  letterSpacing: '0.2em',
                  color: '#9E6F29',
                  fontWeight: 700
                }}
              >
                CURATED DISPATCH
              </span>
            </div>

            {/* Headline */}
            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(2.4rem, 4.4vw, 3.8rem)',
                color: '#121316',
                lineHeight: 1.05,
                letterSpacing: '0.04em',
                marginBottom: '1rem'
              }}
            >
              THE ESCORA JOURNAL &amp;<br />SEASONAL INSPIRATION
            </h2>

            {/* Short Quality Description */}
            <p
              style={{
                fontSize: 'clamp(1rem, 1.15vw, 1.1rem)',
                lineHeight: 1.6,
                color: '#374151',
                maxWidth: '460px',
                marginBottom: '1.75rem',
                fontWeight: 400
              }}
            >
              Handpicked seasonal itineraries, private retreat openings, and quiet insider discoveries across Kerala — delivered once a month directly to your inbox.
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
              style={{
                position: 'absolute',
                left: '4%',
                top: '50%',
                width: '275px',
                height: '345px',
                borderRadius: '24px',
                overflow: 'hidden',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(-54%) rotate(-12deg) scale(1)' : 'translateY(-54%) rotate(0deg) scale(0.85) translateX(-25px)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.16)',
                transition: 'transform 0.9s var(--ease-luxury) 0.15s, opacity 0.8s var(--ease-luxury) 0.15s, box-shadow 0.4s ease',
                zIndex: 1
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-54%) rotate(-7deg) scale(1.04)';
                e.currentTarget.style.zIndex = '10';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(-54%) rotate(-12deg) scale(1)';
                e.currentTarget.style.zIndex = '1';
              }}
            >
              <img
                src={LIMITED_OFFERS_IMAGES.tiltedLeft}
                alt="Munnar emerald tea highlands, Kerala"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Card 2: Tilted Right (Back Right) - Vertically Centered */}
            <div
              style={{
                position: 'absolute',
                right: '4%',
                top: '50%',
                width: '255px',
                height: '320px',
                borderRadius: '24px',
                overflow: 'hidden',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(-58%) rotate(18deg) scale(1)' : 'translateY(-58%) rotate(0deg) scale(0.85) translateX(25px)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.16)',
                transition: 'transform 0.9s var(--ease-luxury) 0.28s, opacity 0.8s var(--ease-luxury) 0.28s, box-shadow 0.4s ease',
                zIndex: 2
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-58%) rotate(12deg) scale(1.04)';
                e.currentTarget.style.zIndex = '10';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(-58%) rotate(18deg) scale(1)';
                e.currentTarget.style.zIndex = '2';
              }}
            >
              <img
                src={LIMITED_OFFERS_IMAGES.tiltedRight}
                alt="Varkala coastal red cliffs, Kerala"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Card 3: Upright in Front (Center-Right) - Vertically Centered */}
            <div
              style={{
                position: 'absolute',
                right: '16%',
                top: '50%',
                width: '265px',
                height: '340px',
                borderRadius: '24px',
                overflow: 'hidden',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(-44%) rotate(0deg) scale(1)' : 'translateY(-44%) rotate(0deg) scale(0.85) translateY(35px)',
                boxShadow: '0 24px 50px rgba(0, 0, 0, 0.22)',
                transition: 'transform 0.9s var(--ease-luxury) 0.4s, opacity 0.8s var(--ease-luxury) 0.4s, box-shadow 0.4s ease',
                zIndex: 4
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-44%) scale(1.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(-44%) scale(1)';
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

      <style>{`
        @media (max-width: 600px) {
          .offers-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
          .offers-collage-container {
            height: 380px !important;
          }
          .offers-collage-container div {
            width: 200px !important;
            height: 250px !important;
          }
        }
      `}</style>
    </section>
  );
}
