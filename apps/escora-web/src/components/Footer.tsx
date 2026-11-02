import React, { useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, CheckCircle2, Phone, Mail, MapPin, Instagram, Facebook, Linkedin, Building2, ShieldCheck, CreditCard } from 'lucide-react';
import { ESCORA_INFO, ESCORA_BANK_DETAILS } from '../data/escoraData';
import { useScrollReveal } from '../hooks/useScrollAnimation';

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ display: 'block' }}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export interface FooterProps {
  onShowToast?: (msg: string) => void;
  onOpenEnquiry?: () => void;
}

export default function Footer({ onShowToast }: FooterProps) {
  const [email, setEmail] = useState<string>('');
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const [footerRef, isVisible] = useScrollReveal<HTMLElement>({ threshold: 0.08, reEnter: true });

  const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubscribed(true);
    if (onShowToast) {
      onShowToast('Thank you for subscribing to ESCORA Holidays updates!');
    }
    setTimeout(() => {
      setEmail('');
      setSubscribed(false);
    }, 4000);
  };

  return (
    <footer
      ref={footerRef}
      style={{
        position: 'relative',
        marginTop: '-4px',
        borderTop: 'none',
        background: 'linear-gradient(to bottom, #F8F6F1 0%, #F8F6F1 4%, #18334E 16%, #0D0F13 32%, #0D0F13 100%)',
        padding: '4.5rem 0 3.5rem',
        overflow: 'hidden',
        color: '#FFFFFF'
      }}
    >
      {/* Mountain Landscape Background with progressive mask */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
          overflow: 'hidden'
        }}
      >
        <img
          src="/images/hero/5-idukky_upscaled.png"
          alt="Panoramic Kerala Western Ghats Mountain Horizon"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center bottom',
            opacity: isVisible ? 0.24 : 0,
            transform: isVisible ? 'scale(1)' : 'scale(1.06)',
            transition: 'opacity 1.2s var(--ease-luxury), transform 1.6s var(--ease-luxury)',
            filter: 'contrast(1.15) brightness(0.9)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, transparent 8%, rgba(0, 0, 0, 0.2) 16%, rgba(0, 0, 0, 0.7) 28%, black 50%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, transparent 8%, rgba(0, 0, 0, 0.2) 16%, rgba(0, 0, 0, 0.7) 28%, black 50%)'
          }}
        />

        {/* Top Vignette: Perfect seamless mist blend into preceding cream section */}
        <div
          className="footer-top-vignette"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '175px',
            background: 'linear-gradient(to bottom, #F8F6F1 0%, #F8F6F1 12%, rgba(248, 246, 241, 0.8) 32%, rgba(248, 246, 241, 0.35) 60%, rgba(248, 246, 241, 0.08) 85%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 2
          }}
        />

        {/* Bottom Vignette: Deep grounding into base dark color */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '180px',
            background: 'linear-gradient(to bottom, transparent, #0D0F13 100%)',
            pointerEvents: 'none',
            zIndex: 2
          }}
        />
      </div>

      <div className="section-wrapper" style={{ position: 'relative', zIndex: 3 }}>

        {/* Floating Translucent Information Panel */}
        <div
          style={{
            background: 'rgba(28, 30, 36, 0.82)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '28px',
            padding: 'clamp(2rem, 4vw, 3.5rem)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.97)',
            transition: 'opacity 0.9s var(--ease-luxury), transform 0.9s var(--ease-luxury)'
          }}
        >
          {/* Main Content Grid: Left brand/newsletter + Right 3 columns */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(520px, 1.75fr) minmax(300px, 1.25fr)',
              gap: '3.5rem',
              marginBottom: '3.5rem'
            }}
            className="footer-top-grid"
          >
            {/* Left: Brand logo & Newsletter pill */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.75rem',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
                transition: 'opacity 0.85s var(--ease-luxury), transform 0.85s var(--ease-luxury)',
                transitionDelay: isVisible ? '0.12s' : '0s'
              }}
            >

              {/* Brand Logo */}
              <a href="#" style={{ display: 'inline-block', textDecoration: 'none' }} aria-label="ESCORA Home">
                <img
                  src="/images/escora-logo.png"
                  alt="ESCORA"
                  style={{
                    height: '42px',
                    width: 'auto',
                    maxWidth: '210px',
                    filter: 'brightness(0) invert(1) drop-shadow(0 2px 8px rgba(0, 0, 0, 0.35))',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              </a>

              <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.6 }}>
                God's Own Country. Where every journey feels like home. Bespoke Kerala itineraries curated with authentic local devotion.
              </p>

              {/* Newsletter pill input with gold arrow button */}
              <form
                onSubmit={handleSubscribe}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '9999px',
                  padding: '0.35rem 0.35rem 0.35rem 1.25rem',
                  maxWidth: '360px',
                  position: 'relative'
                }}
              >
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    flexGrow: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-body)'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: '#B48235',
                    color: '#FFFFFF',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#9E6F29')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#B48235')}
                  aria-label="Subscribe"
                >
                  {subscribed ? <CheckCircle2 size={16} color="#FFFFFF" /> : <ArrowRight size={16} />}
                </button>
              </form>

              {/* Contact & Bank Wire direct lines (Side-by-side, line by line, no box) */}
              <div
                className="footer-contact-bank-row"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '2.5rem',
                  fontSize: '0.8rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginTop: '0.25rem'
                }}
              >
                {/* Left: Contact direct lines */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <a href="tel:+918157003344" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.45rem', whiteSpace: 'nowrap' }}>
                    <Phone size={13} color="#B48235" /> <span style={{ letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums' }}>+91 8157 003 344</span>
                  </a>
                  <a href="mailto:admin@escoraholidays.com" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Mail size={13} color="#B48235" /> admin@escoraholidays.com
                  </a>
                  <span style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', lineHeight: 1.4, maxWidth: '280px' }}>
                    <MapPin size={13} color="#B48235" style={{ flexShrink: 0, marginTop: '2px' }} />
                    1st Floor, Landmark Maple Business Tower, Kozhikode, Kerala 673014
                  </span>
                </div>

                {/* Opposite side: Bank wire direct lines */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', whiteSpace: 'nowrap' }}>
                    <ShieldCheck size={13} color="#B48235" /> {ESCORA_BANK_DETAILS.accountName}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', whiteSpace: 'nowrap' }}>
                    <CreditCard size={13} color="#B48235" /> <span style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em' }}>{ESCORA_BANK_DETAILS.accountNumber}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', whiteSpace: 'nowrap' }}>
                    <CheckCircle2 size={13} color="#B48235" /> IFSC Code: {ESCORA_BANK_DETAILS.ifscCode}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', whiteSpace: 'nowrap' }}>
                    <Building2 size={13} color="#B48235" /> Branch Name: {ESCORA_BANK_DETAILS.branch}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: 3 Columns of Links (EXPLORE, COMPANY, SUPPORT) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '2rem'
              }}
              className="footer-links-grid"
            >
              {/* Column 1: EXPLORE */}
              <div
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
                  transition: 'opacity 0.85s var(--ease-luxury), transform 0.85s var(--ease-luxury)',
                  transitionDelay: isVisible ? '0.2s' : '0s'
                }}
              >
                <h4
                  className="font-display"
                  style={{
                    fontSize: '0.95rem',
                    letterSpacing: '0.12em',
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginBottom: '1.25rem',
                    textTransform: 'uppercase'
                  }}
                >
                  EXPLORE
                </h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { label: 'DESTINATIONS', href: '/destinations' },
                    { label: 'EXPERIENCES', href: '/experiences' },
                    { label: 'PLAN A JOURNEY', href: '/plan' },
                    { label: 'AYURVEDIC HEALING', href: '/experiences/ayurveda-wellness' }
                  ].map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="font-display"
                        style={{
                          color: '#FFFFFF',
                          fontSize: '0.95rem',
                          letterSpacing: '0.04em',
                          textDecoration: 'none',
                          transition: 'color 0.2s ease',
                          display: 'inline-block'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#B48235')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 2: COMPANY */}
              <div
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
                  transition: 'opacity 0.85s var(--ease-luxury), transform 0.85s var(--ease-luxury)',
                  transitionDelay: isVisible ? '0.3s' : '0s'
                }}
              >
                <h4
                  className="font-display"
                  style={{
                    fontSize: '0.95rem',
                    letterSpacing: '0.12em',
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginBottom: '1.25rem',
                    textTransform: 'uppercase'
                  }}
                >
                  COMPANY
                </h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { label: 'ABOUT ESCORA', href: '/about' },
                    { label: 'THE STANDARD', href: '/#why-escora' },
                    { label: 'HOW IT WORKS', href: '/#how-it-works' },
                    { label: 'TRAVELLER STORIES', href: '/#testimonials' }
                  ].map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="font-display"
                        style={{
                          color: '#FFFFFF',
                          fontSize: '0.95rem',
                          letterSpacing: '0.04em',
                          textDecoration: 'none',
                          transition: 'color 0.2s ease',
                          display: 'inline-block'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#B48235')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 3: SUPPORT */}
              <div
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
                  transition: 'opacity 0.85s var(--ease-luxury), transform 0.85s var(--ease-luxury)',
                  transitionDelay: isVisible ? '0.4s' : '0s'
                }}
              >
                <h4
                  className="font-display"
                  style={{
                    fontSize: '0.95rem',
                    letterSpacing: '0.12em',
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginBottom: '1.25rem',
                    textTransform: 'uppercase'
                  }}
                >
                  SUPPORT
                </h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {['FAQ', 'TRAVEL GUIDE', 'TERMS & CONDITIONS', 'PRIVACY POLICY', 'CANCELLATION POLICY'].map((link) => (
                    <li key={link}>
                      <a
                        href="#hero"
                        className="font-display"
                        style={{
                          color: '#FFFFFF',
                          fontSize: '0.95rem',
                          letterSpacing: '0.04em',
                          textDecoration: 'none',
                          transition: 'color 0.2s ease',
                          display: 'inline-block'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#B48235')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>

                    {/* Bottom Bar: Copyright & Socials */}
          <div
            style={{
              paddingTop: '2rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              fontSize: '0.8rem',
              color: 'rgba(255, 255, 255, 0.55)'
            }}
          >
            <div>
              Copyright & design by @ESCORA Holidays - 2026. All rights reserved.
            </div>

            {/* Official Social Links (Instagram, Facebook, LinkedIn, WhatsApp) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <a
                href="https://www.instagram.com/escora_holidays"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                style={{
                  color: 'rgba(255, 255, 255, 0.65)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s ease, transform 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#E4405F';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://www.facebook.com/people/Escora-holidays"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                style={{
                  color: 'rgba(255, 255, 255, 0.65)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s ease, transform 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#1877F2';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://www.linkedin.com/company/escora-holidays/about/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                style={{
                  color: 'rgba(255, 255, 255, 0.65)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s ease, transform 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#0A66C2';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Linkedin size={18} />
              </a>
              <a
                href="https://wa.me/918157003344"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                style={{
                  color: 'rgba(255, 255, 255, 0.65)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s ease, transform 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#25D366';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <WhatsAppIcon size={18} />
              </a>
            </div>
          </div>

        </div>

      </div>

      {/* Full-width Infinite Running Text Marquee */}
      <div
        aria-hidden="true"
        style={{
          marginTop: '3.5rem',
          width: '100%',
          overflow: 'hidden',
          userSelect: 'none',
          pointerEvents: 'none',
          position: 'relative',
          zIndex: 3,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 1s var(--ease-luxury), transform 1s var(--ease-luxury)',
          transitionDelay: isVisible ? '0.2s' : '0s'
        }}
      >
        <div className="footer-marquee-track">
          <div className="footer-marquee-group">
            <span className="font-display footer-marquee-text">
              DISCOVER ✈ VOYAGE ✈ UNWIND ✈ DISCOVER ✈ VOYAGE ✈ UNWIND ✈&nbsp;
            </span>
          </div>
          <div className="footer-marquee-group" aria-hidden="true">
            <span className="font-display footer-marquee-text">
              DISCOVER ✈ VOYAGE ✈ UNWIND ✈ DISCOVER ✈ VOYAGE ✈ UNWIND ✈&nbsp;
            </span>
          </div>
        </div>
      </div>

      <style>{`
        .footer-marquee-track {
          display: flex;
          width: max-content;
          animation: footerMarquee 36s linear infinite;
          will-change: transform;
        }
        .footer-marquee-group {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }
        .footer-marquee-text {
          font-size: clamp(3.2rem, 9vw, 8.5rem);
          color: rgba(255, 255, 255, 0.08);
          letter-spacing: 0.12em;
          font-weight: 800;
          white-space: nowrap;
          display: inline-block;
          line-height: 1;
        }
        @keyframes footerMarquee {
          0% {
            transform: translate3d(-50%, 0, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }
        @media (max-width: 900px) {
          footer {
            padding: 1.5rem 0 3rem !important;
          }
          .footer-top-vignette {
            height: 90px !important;
          }
          .footer-top-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
          .footer-contact-bank-row {
            flex-direction: column !important;
            gap: 1.5rem !important;
          }
          .footer-links-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 500px) {
          .footer-links-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
