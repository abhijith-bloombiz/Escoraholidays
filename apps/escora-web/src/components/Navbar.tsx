import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export interface NavbarProps {
  onOpenEnquiry?: () => void;
}

export default function Navbar({ onOpenEnquiry }: NavbarProps) {
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    let lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    let ticking = false;

    const onScrollUpdate = (currentY: number, dir: number | null) => {
      // 1. Frosted glass background threshold
      setScrolled(currentY > 50);

      // 2. If mobile drawer is open, keep navbar visible
      if (mobileMenuOpen) {
        setIsVisible(true);
        lastScrollY = currentY;
        return;
      }

      // 3. At the very top of the page, always keep visible
      if (currentY <= 60) {
        setIsVisible(true);
        lastScrollY = currentY;
        return;
      }

      // 4. Direction-based autohide
      // When direction is provided directly by Lenis (1 = down, -1 = up)
      if (typeof dir === 'number' && dir !== 0) {
        if (dir > 0 && currentY > 80) {
          setIsVisible(false);
        } else if (dir < 0) {
          setIsVisible(true);
        }
        lastScrollY = currentY;
        return;
      }

      // 5. Delta fallback based on position change
      const delta = currentY - lastScrollY;
      if (Math.abs(delta) >= 6) {
        if (delta > 0 && currentY > 80) {
          setIsVisible(false);
        } else if (delta < 0) {
          setIsVisible(true);
        }
        lastScrollY = currentY;
      }
    };

    // Lenis smooth scroll listener
    let unbindLenis: (() => void) | null = null;
    const bindLenis = () => {
      const lenis = (window as any).lenis;
      if (lenis && typeof lenis.on === 'function') {
        const lenisHandler = (e: any) => {
          const y = typeof e?.scroll === 'number' ? e.scroll : window.scrollY;
          const dir = typeof e?.direction === 'number' ? e.direction : (e?.velocity ? Math.sign(e.velocity) : null);
          onScrollUpdate(y, dir);
        };
        lenis.on('scroll', lenisHandler);
        unbindLenis = () => {
          const activeLenis = (window as any).lenis;
          if (activeLenis && typeof activeLenis.off === 'function') {
            activeLenis.off('scroll', lenisHandler);
          }
        };
        return true;
      }
      return false;
    };

    const hasLenis = bindLenis();

    // Native scroll listener with requestAnimationFrame debounce
    const nativeHandler = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        onScrollUpdate(window.scrollY, null);
        ticking = false;
      });
    };

    window.addEventListener('scroll', nativeHandler, { passive: true });

    // Poll in case Lenis mounted asynchronously in App.jsx
    let pollId: ReturnType<typeof setInterval> | null = null;
    if (!hasLenis) {
      pollId = setInterval(() => {
        if (bindLenis()) {
          if (pollId) clearInterval(pollId);
        }
      }, 100);
    }

    return () => {
      window.removeEventListener('scroll', nativeHandler);
      if (unbindLenis) unbindLenis();
      if (pollId) clearInterval(pollId);
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          transform: isVisible || mobileMenuOpen ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease, padding 0.3s ease, backdrop-filter 0.3s ease, box-shadow 0.3s ease',
          backgroundColor: scrolled ? 'rgba(13, 15, 19, 0.94)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
          border: 'none',
          borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
          padding: scrolled ? '0.85rem 0' : '1.35rem 0',
          boxShadow: scrolled && isVisible ? '0 10px 30px rgba(0, 0, 0, 0.28)' : 'none',
          willChange: 'transform'
        }}
      >
        <div className="section-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <a
            href="#"
            onClick={() => setIsVisible(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none'
            }}
            aria-label="ESCORA Home"
          >
            <img
              src="/images/escora-logo.png"
              alt="ESCORA"
              style={{
                height: scrolled ? '42px' : '48px',
                width: 'auto',
                maxWidth: '220px',
                objectFit: 'contain',
                display: 'block',
                filter: 'brightness(0) invert(1) drop-shadow(0 2px 10px rgba(0, 0, 0, 0.6))',
                transition: 'height 0.3s ease'
              }}
            />
          </a>

          {/* Desktop Navigation Links */}
          <nav
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '2.4rem'
            }}
            className="desktop-nav"
          >
            {[
              { label: 'Destinations', href: '#destinations' },
              { label: 'Experiences', href: '#experiences' },
              { label: 'The Standard', href: '#why-escora' },
              { label: 'Healing', href: '#retreat' },
              { label: 'Stories', href: '#testimonials' },
              { label: 'Journal', href: '#newsletter' }
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setIsVisible(true)}
                style={{
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  letterSpacing: '0.06em',
                  transition: 'all 0.2s ease',
                  textTransform: 'uppercase',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 1px 3px rgba(0, 0, 0, 0.95)',
                  padding: '0.25rem 0.15rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#D4A359';
                  e.currentTarget.style.textShadow = '0 0 12px rgba(212, 163, 89, 0.6), 0 2px 8px rgba(0, 0, 0, 0.8)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.textShadow = '0 2px 8px rgba(0, 0, 0, 0.8), 0 1px 3px rgba(0, 0, 0, 0.95)';
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right Action Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={onOpenEnquiry}
              className="btn-pill btn-white"
              style={{
                fontSize: '0.85rem',
                padding: '0.65rem 1.6rem',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontWeight: 700
              }}
            >
              Contact
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-toggle"
              style={{
                display: 'none',
                background: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                padding: '0.4rem'
              }}
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        <style>{`
          @media (min-width: 900px) {
            .desktop-nav { display: flex !important; }
            .desktop-phone { display: flex !important; }
          }
          @media (max-width: 899px) {
            .mobile-toggle { display: block !important; }
          }
        `}</style>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99,
            backgroundColor: '#0D0F13',
            display: 'flex',
            flexDirection: 'column',
            padding: '6rem 2rem 2rem',
            gap: '1.75rem'
          }}
        >
          {[
            { label: 'Destinations', href: '#destinations' },
            { label: 'Experiences', href: '#experiences' },
            { label: 'The Standard', href: '#why-escora' },
            { label: 'Healing', href: '#retreat' },
            { label: 'Stories', href: '#testimonials' },
            { label: 'Journal', href: '#newsletter' }
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="font-display"
              style={{
                color: '#FFFFFF',
                fontSize: '1.75rem',
                textDecoration: 'none',
                letterSpacing: '0.05em'
              }}
            >
              {item.label}
            </a>
          ))}

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <a
              href="https://wa.me/918157003344"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#D4AF37', fontSize: '0.88rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              WhatsApp / Concierge: +91 8157 003 344
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenEnquiry) onOpenEnquiry();
              }}
              className="btn-pill btn-gold"
              style={{ width: '100%', padding: '0.9rem' }}
            >
              Plan a Journey
            </button>
          </div>
        </div>
      )}
    </>
  );
}
