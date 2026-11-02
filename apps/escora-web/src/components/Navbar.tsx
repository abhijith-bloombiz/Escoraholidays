import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, Instagram, Facebook } from 'lucide-react';

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

export interface NavbarProps {
  onOpenEnquiry?: () => void;
}

export default function Navbar({ onOpenEnquiry }: NavbarProps) {
  const [location, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Hero section on landing page gets special spacious translucent styling; all other sections use the standard sleek compact bar
  const isHeroNavbar = location === '/' && !scrolled;

  const handleNavClick = (href: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    setIsVisible(true);
    setMobileMenuOpen(false);

    if (location === href) {
      // Already on this page -> scroll to top smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const lenis = (window as any).lenis;
      if (lenis && typeof lenis.scrollTo === 'function') {
        lenis.scrollTo(0, { immediate: false, duration: 0.8 });
      }
    } else {
      // Immediate instantaneous redirect
      setLocation(href);
      window.scrollTo(0, 0);
      const lenis = (window as any).lenis;
      if (lenis && typeof lenis.scrollTo === 'function') {
        lenis.scrollTo(0, { immediate: true });
      }
    }
  };

  // Synchronize navbar visibility and scroll state on route transition
  useEffect(() => {
    setIsVisible(true);
    setMobileMenuOpen(false);
    const y = typeof window !== 'undefined' ? window.scrollY : 0;
    setScrolled(y > 50);
  }, [location]);

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

    // Immediately evaluate scroll state on mount
    onScrollUpdate(lastScrollY, null);

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
        className={`${mobileMenuOpen ? 'mobile-drawer-open' : ''} ${isHeroNavbar ? 'is-hero-nav' : 'is-standard-nav'}`.trim()}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          transform: isVisible || mobileMenuOpen ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease, padding 0.3s ease, backdrop-filter 0.3s ease, box-shadow 0.3s ease',
          backgroundColor: isHeroNavbar ? 'transparent' : 'rgba(13, 15, 19, 0.94)',
          backgroundImage: isHeroNavbar
            ? 'linear-gradient(180deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.15) 60%, transparent 100%)'
            : 'none',
          backdropFilter: isHeroNavbar ? 'none' : 'blur(16px)',
          WebkitBackdropFilter: isHeroNavbar ? 'none' : 'blur(16px)',
          border: 'none',
          borderBottom: isHeroNavbar ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
          padding: isHeroNavbar ? '1.2rem 0' : '0.72rem 0',
          boxShadow: !isHeroNavbar && isVisible ? '0 8px 24px rgba(0, 0, 0, 0.28)' : 'none',
          willChange: 'transform'
        }}
      >
        <div className="section-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link
            href="/"
            onClick={(e) => handleNavClick('/', e)}
            style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              cursor: 'pointer'
            }}
            aria-label="ESCORA Home"
          >
            <img
              src="/images/escora-logo.png"
              alt="ESCORA"
              className="escora-nav-logo"
              style={{
                height: isHeroNavbar ? '44px' : '36px',
                width: 'auto',
                maxWidth: isHeroNavbar ? '200px' : '165px',
                objectFit: 'contain',
                display: 'block',
                filter: 'brightness(0) invert(1) drop-shadow(0 1px 3px rgba(0, 0, 0, 0.35))',
                transition: 'height 0.3s ease, max-width 0.3s ease, filter 0.3s ease'
              }}
            />
          </Link>

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
              { label: 'Home', href: '/' },
              { label: 'Destinations', href: '/destinations' },
              { label: 'Experiences', href: '/experiences' },
              { label: 'About', href: '/about' }
            ].map((item) => {
              const isCurrent = item.href !== '/' && (location === item.href || location.startsWith(item.href));
              const goldColor = '#D4A359';
              // Subtle, soft blending shadow: provides gentle definition with zero dark halo or smudge
              const activeShadow = '0 1px 3px rgba(0, 0, 0, 0.35)';
              const defaultShadow = '0 1px 3px rgba(0, 0, 0, 0.35)';
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNavClick(item.href, e)}
                  style={{
                    color: isCurrent ? goldColor : '#FFFFFF',
                    fontSize: isHeroNavbar ? '0.88rem' : '0.82rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    letterSpacing: '0.06em',
                    transition: 'all 0.25s ease',
                    textTransform: 'uppercase',
                    textShadow: isCurrent ? activeShadow : defaultShadow,
                    padding: '0.25rem 0.15rem',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = goldColor;
                    e.currentTarget.style.textShadow = activeShadow;
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) {
                      e.currentTarget.style.color = '#FFFFFF';
                      e.currentTarget.style.textShadow = defaultShadow;
                    }
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {/* Social Media Icons (Instagram, Facebook, WhatsApp) */}
            <div
              className="navbar-social-links"
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '0.85rem',
                marginRight: '0.35rem'
              }}
            >
              <a
                href="https://www.instagram.com/escora_holidays"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                style={{
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.85,
                  transition: 'color 0.2s ease, transform 0.2s ease, opacity 0.2s ease',
                  padding: '0.25rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#E4405F';
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.opacity = '0.85';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Instagram size={17} />
              </a>

              <a
                href="https://www.facebook.com/people/Escora-holidays"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                style={{
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.85,
                  transition: 'color 0.2s ease, transform 0.2s ease, opacity 0.2s ease',
                  padding: '0.25rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#1877F2';
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.opacity = '0.85';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Facebook size={17} />
              </a>

              <a
                href="https://wa.me/918157003344?text=Hello%20Escora%20Holidays%2C%20I%20would%20like%20to%20inquire%20about%20a%20bespoke%20Kerala%20holiday."
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                style={{
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.85,
                  transition: 'color 0.2s ease, transform 0.2s ease, opacity 0.2s ease',
                  padding: '0.25rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#25D366';
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.opacity = '0.85';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <WhatsAppIcon size={17} />
              </a>
            </div>

            <Link
              href="/plan"
              onClick={(e) => handleNavClick('/plan', e)}
              className="btn-pill btn-gold nav-plan-btn"
              style={{
                fontSize: isHeroNavbar ? '0.82rem' : '0.79rem',
                padding: isHeroNavbar ? '0.62rem 1.4rem' : '0.54rem 1.25rem',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Plan a Journey
            </Link>

            <Link
              href="/contact"
              onClick={(e) => handleNavClick('/contact', e)}
              className="btn-pill btn-white nav-contact-btn"
              style={{
                fontSize: isHeroNavbar ? '0.82rem' : '0.79rem',
                padding: isHeroNavbar ? '0.62rem 1.3rem' : '0.54rem 1.15rem',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              Contact
            </Link>

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
            .navbar-social-links { display: flex !important; }
          }
          @media (max-width: 899px) {
            .mobile-toggle { display: block !important; }
            .escora-nav-logo {
              filter: brightness(0) invert(1) drop-shadow(0 1px 3px rgba(0, 0, 0, 0.35)) !important;
            }
            .mobile-drawer-open .escora-nav-logo {
              filter: brightness(0) invert(1) drop-shadow(0 1px 3px rgba(0, 0, 0, 0.35)) !important;
            }
          }
          @media (max-width: 640px) {
            .nav-contact-btn { display: none !important; }
            .is-hero-nav .nav-plan-btn {
              padding: 0.52rem 0.95rem !important;
              font-size: 0.74rem !important;
            }
            .is-standard-nav .nav-plan-btn {
              padding: 0.42rem 0.8rem !important;
              font-size: 0.7rem !important;
            }
          }
          @media (max-width: 420px) {
            .is-hero-nav .escora-nav-logo {
              height: 33px !important;
              max-width: 140px !important;
            }
            .is-standard-nav .escora-nav-logo {
              height: 31px !important;
              max-width: 135px !important;
            }
            .nav-plan-btn {
              padding: 0.44rem 0.82rem !important;
              font-size: 0.71rem !important;
            }
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
            gap: '1.75rem',
            overflowY: 'auto'
          }}
        >
          {[
            { label: 'Home', href: '/' },
            { label: 'Destinations', href: '/destinations' },
            { label: 'Experiences', href: '/experiences' },
            { label: 'About Escora', href: '/about' },
            { label: 'Contact', href: '/contact' }
          ].map((item) => {
            const isCurrent = item.href !== '/' && (location === item.href || location.startsWith(item.href));
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(item.href, e)}
                className="font-display"
                style={{
                  color: isCurrent ? '#D4A359' : '#FFFFFF',
                  fontSize: '1.75rem',
                  textDecoration: 'none',
                  letterSpacing: '0.05em',
                  cursor: 'pointer'
                }}
              >
                {item.label}
              </Link>
            );
          })}

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', paddingBottom: '0.5rem' }}>
              <a
                href="https://www.instagram.com/escora_holidays"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#FFFFFF', opacity: 0.85, transition: 'color 0.2s ease, transform 0.2s ease' }}
                aria-label="Instagram"
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#E4405F';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://www.facebook.com/people/Escora-holidays"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#FFFFFF', opacity: 0.85, transition: 'color 0.2s ease, transform 0.2s ease' }}
                aria-label="Facebook"
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#1877F2';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://wa.me/918157003344"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#FFFFFF', opacity: 0.85, transition: 'color 0.2s ease, transform 0.2s ease' }}
                aria-label="WhatsApp"
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#25D366';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <WhatsAppIcon size={20} />
              </a>
            </div>
            <Link
              href="/plan"
              onClick={(e) => handleNavClick('/plan', e)}
              className="btn-pill btn-gold"
              style={{ width: '100%', padding: '0.9rem', textAlign: 'center', fontSize: '0.95rem', cursor: 'pointer' }}
            >
              Plan a Journey
            </Link>
            <a
              href="https://wa.me/918157003344"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#D4AF37', fontSize: '0.88rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
            >
              WhatsApp / Concierge: +91 8157 003 344
            </a>
          </div>
        </div>
      )}
    </>
  );
}
