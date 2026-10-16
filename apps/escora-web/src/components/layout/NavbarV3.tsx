import { Link, useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import escoraLogoDark from "@assets/escora/escora-logo-dark.png";
import escoraMark from "@assets/escora/escora-logo-mark.png";

const COLLECTIONS = [
  { label: "Honeymoon", slug: "honeymoon" },
  { label: "Health & Wellness", slug: "health-wellness" },
  { label: "Nature & Wildlife", slug: "nature-wildlife" },
  { label: "Hill Stations", slug: "hill-stations" },
  { label: "Backwaters", slug: "backwaters" },
  { label: "Beaches", slug: "beaches" },
  { label: "Functional Medicine", slug: "functional-medicine" },
  { label: "Historical & Heritage", slug: "historical-heritage" },
];

const LINKS_AFTER = [
  { href: "/trip-planner", label: "Trip Planner" },
  { href: "/journeys", label: "Journeys" },
  { href: "/destinations", label: "Explore Kerala" },
  { href: "/journal", label: "Journal" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function WaveText({ text }: { text: string }) {
  const [isWaving, setIsWaving] = useState(false);
  const spanRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;
    const parent = el.closest<HTMLElement>(".v3-nav-link, .v3-nav-panel a");
    if (!parent) return;

    const onEnter = () => {
      setIsWaving((currentlyWaving) => {
        if (!currentlyWaving) {
          if (timerRef.current) clearTimeout(timerRef.current);
          const totalDuration = 480 + text.length * 40 + 60;
          timerRef.current = setTimeout(() => {
            setIsWaving(false);
          }, totalDuration);
          return true;
        }
        return currentlyWaving;
      });
    };

    parent.addEventListener("mouseenter", onEnter);
    return () => {
      parent.removeEventListener("mouseenter", onEnter);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text]);

  return (
    <span
      ref={spanRef}
      className={`v3-wave-text${isWaving ? " is-waving" : ""}`}
      aria-label={text}
    >
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="v3-wave-char"
          style={{ "--char-idx": i } as React.CSSProperties}
          aria-hidden="true"
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

/* Same links as the live Navbar, restyled for the V3 palette. Sits
   transparent over the Home hero photo, and turns into a light pill once
   the page scrolls (or straight away on inner pages, which open on a light
   background where white text would disappear). */
export default function NavbarV3() {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [scrollVisible, setScrollVisible] = useState(true);
  const [hoverVisible, setHoverVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [mobileCollectionsOpen, setMobileCollectionsOpen] = useState(false);

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOverNavbar = useRef(false);
  const isOverTrigger = useRef(false);
  const isScrollVisibleRef = useRef(true);
  const lastScrollY = useRef(0);
  const lastTouchTime = useRef(0);
  const lastScrollDownTime = useRef(0);
  const isTouchInteraction = useRef(
    typeof window !== "undefined"
      ? window.matchMedia("(pointer: coarse) and (hover: none)").matches
      : false
  );

  const overHero = location === "/" && !scrolled && !menuOpen;
  const isVisible = menuOpen || collectionsOpen || scrollVisible || hoverVisible;

  // Determine if the user is currently viewing the hero section or top of the page
  const isInHero = () => {
    const currentScrollY = Math.max(0, window.scrollY || document.documentElement.scrollTop);
    // Always considered hero when at or near the top of the page
    if (currentScrollY <= 120) return true;

    // Check if a dedicated hero element exists and is still in the top viewport area
    const heroEl = document.querySelector(
      '.hero-editorial, .hero2, .v3dest-hero, .page-hero-top, [data-hero], section[class*="hero"], header[class*="hero"]'
    );
    if (heroEl) {
      const rect = heroEl.getBoundingClientRect();
      return rect.bottom > 80;
    }

    return false;
  };

  const clearScrollStopTimer = () => {
    if (scrollStopTimer.current) {
      clearTimeout(scrollStopTimer.current);
      scrollStopTimer.current = null;
    }
  };

  const updateScrollVisible = (val: boolean) => {
    isScrollVisibleRef.current = val;
    setScrollVisible(val);
  };

  const handleTriggerEnter = () => {
    if (isTouchInteraction.current) return;
    if (Date.now() - lastScrollDownTime.current < 400 && !isOverNavbar.current) return;
    isOverTrigger.current = true;
    setHoverVisible(true);
  };

  const handleTriggerLeave = (e: React.MouseEvent) => {
    isOverTrigger.current = false;
    const related = e.relatedTarget as HTMLElement | null;
    if (related && related.closest(".v3-nav")) {
      isOverNavbar.current = true;
      return;
    }
    const navEl = document.querySelector(".v3-nav");
    if (navEl) {
      const rect = navEl.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        isOverNavbar.current = true;
        return;
      }
    }
    // Left both activation zone and navbar -> hide immediately without delay
    if (!isOverNavbar.current && !collectionsOpen && !menuOpen && !isInHero()) {
      setHoverVisible(false);
      updateScrollVisible(false);
    }
  };

  const handleNavEnter = () => {
    if (isTouchInteraction.current) return;
    isOverNavbar.current = true;
    setHoverVisible(true);
  };

  const handleNavLeave = (e: React.MouseEvent) => {
    isOverNavbar.current = false;
    const related = e.relatedTarget as HTMLElement | null;
    if (related && related.closest(".v3-nav-trigger-zone")) {
      isOverTrigger.current = true;
      return;
    }
    if (e.clientY <= 18) {
      isOverTrigger.current = true;
      return;
    }
    // Left both activation zone and navbar -> hide immediately without delay
    if (!isOverTrigger.current && !collectionsOpen && !menuOpen && !isInHero()) {
      setHoverVisible(false);
      updateScrollVisible(false);
    }
  };

  useEffect(() => {
    let ticking = false;
    const SCROLL_THRESHOLD = 120;
    const DELTA_MIN = 8;

    const handleScroll = () => {
      const currentScrollY = Math.max(0, window.scrollY || document.documentElement.scrollTop);
      setScrolled(currentScrollY > 60);

      // Keep navbar visible if mobile menu or dropdown is open
      if (menuOpen || collectionsOpen) {
        updateScrollVisible(true);
        clearScrollStopTimer();
        lastScrollY.current = currentScrollY;
        ticking = false;
        return;
      }

      // Always visible in the hero section or at the top of the page
      if (currentScrollY <= SCROLL_THRESHOLD || isInHero()) {
        updateScrollVisible(true);
        clearScrollStopTimer();
        lastScrollY.current = currentScrollY;
        ticking = false;
        return;
      }

      const diff = currentScrollY - lastScrollY.current;

      // Prevent micro-flickering by requiring a minimum scroll movement
      if (Math.abs(diff) > DELTA_MIN) {
        if (diff > 0) {
          // Scrolling down beyond hero -> hide immediately even if cursor is near top
          lastScrollDownTime.current = Date.now();
          clearScrollStopTimer();
          if (!isOverNavbar.current) {
            isOverTrigger.current = false;
            updateScrollVisible(false);
            setHoverVisible(false);
          } else {
            // Keep visible only while actively hovering over the navbar itself
            updateScrollVisible(false);
          }
        } else {
          // Scrolling up beyond hero -> reveal immediately
          updateScrollVisible(true);
          clearScrollStopTimer();
          scrollStopTimer.current = setTimeout(() => {
            if (!isInHero() && !isOverNavbar.current && !isOverTrigger.current && !menuOpen && !collectionsOpen) {
              updateScrollVisible(false);
              setHoverVisible(false);
            }
          }, 1500);
        }
        lastScrollY.current = currentScrollY;
      } else if (diff < 0 && isScrollVisibleRef.current) {
        // While upward scrolling continues, refresh stop timer
        clearScrollStopTimer();
        scrollStopTimer.current = setTimeout(() => {
          if (!isInHero() && !isOverNavbar.current && !isOverTrigger.current && !menuOpen && !collectionsOpen) {
            updateScrollVisible(false);
            setHoverVisible(false);
          }
        }, 1500);
      }

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(handleScroll);
        ticking = true;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Ignore if recent touch event occurred
      if (Date.now() - lastTouchTime.current < 800 && isTouchInteraction.current) {
        return;
      }

      // If device supports hover, ensure desktop mode is active
      if (window.matchMedia("(hover: hover)").matches) {
        isTouchInteraction.current = false;
      }

      if (isTouchInteraction.current) return;

      // Do not re-trigger trigger zone while actively scrolling down
      if (Date.now() - lastScrollDownTime.current < 400 && !isOverNavbar.current) {
        return;
      }

      // Small activation zone along the top edge of the viewport (<= 18px)
      if (e.clientY <= 18) {
        isOverTrigger.current = true;
        setHoverVisible(true);
      } else if (isOverTrigger.current && !isOverNavbar.current) {
        // Cursor moved out of activation zone into page
        isOverTrigger.current = false;
        if (!collectionsOpen && !menuOpen && !isInHero()) {
          setHoverVisible(false);
          updateScrollVisible(false);
        }
      }
    };

    const onTouchStart = () => {
      isTouchInteraction.current = true;
      lastTouchTime.current = Date.now();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        isTouchInteraction.current = true;
        lastTouchTime.current = Date.now();
      } else if (e.pointerType === "mouse") {
        isTouchInteraction.current = false;
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("pointerdown", onPointerDown);
      clearScrollStopTimer();
    };
  }, [menuOpen, collectionsOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setCollectionsOpen(false);
    setMobileCollectionsOpen(false);
    updateScrollVisible(true);
    setHoverVisible(false);
    isOverNavbar.current = false;
    isOverTrigger.current = false;
    lastScrollY.current = 0;
    clearScrollStopTimer();
  }, [location]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    clearScrollStopTimer();
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  function openCollections() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setCollectionsOpen(true);
    setHoverVisible(true);
  }
  function scheduleCloseCollections() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setCollectionsOpen(false), 150);
  }

  const isActive = (href: string) => (href === "/" ? location === "/" : location.startsWith(href));

  return (
    <>
      <div
        className="v3-nav-trigger-zone"
        aria-hidden="true"
        onMouseEnter={handleTriggerEnter}
        onMouseLeave={handleTriggerLeave}
      />

      <nav
        className={`v3-nav${overHero ? " is-over-hero" : ""}${scrolled ? " is-scrolled" : ""}${!isVisible ? " is-hidden" : ""}`}
        onMouseEnter={handleNavEnter}
        onMouseLeave={handleNavLeave}
      >
        <Link href="/" className="v3-nav-brand" aria-label="Escora — Home">
          <img src={escoraLogoDark} alt="Escora" />
        </Link>

        <div className="v3-nav-links nav-links-row">
          <Link href="/" className={`v3-nav-link${isActive("/") ? " active" : ""}`}>
            <WaveText text="Home" />
          </Link>

          <div className="v3-nav-dd" onMouseEnter={openCollections} onMouseLeave={scheduleCloseCollections}>
            <Link
              href="/collections/honeymoon"
              className={`v3-nav-link${location.startsWith("/collections") ? " active" : ""}`}
              aria-haspopup="true"
              aria-expanded={collectionsOpen}
            >
              <WaveText text="Collections" />
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: collectionsOpen ? "rotate(180deg)" : "none", transition: "transform .3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </Link>
            <div className={`v3-nav-panel${collectionsOpen ? " open" : ""}`}>
              <div className="v3-nav-panel-inner">
                <div className="v3-nav-panel-grid">
                  {COLLECTIONS.map((c) => (
                    <Link key={c.slug} href={`/collections/${c.slug}`} className={location === `/collections/${c.slug}` ? "active" : ""}>
                      <WaveText text={c.label} />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {LINKS_AFTER.map((l) => (
            <Link key={l.href} href={l.href} className={`v3-nav-link${isActive(l.href) ? " active" : ""}`}>
              <WaveText text={l.label} />
            </Link>
          ))}
        </div>

        <div className="v3-nav-right nav-right-desktop">
          <Link href="/plan" className="v3-nav-cta">Plan a Journey</Link>
        </div>

        {/* Phones use the bottom tab bar instead of the burger menu. */}
        <Link href="/plan" className="v3-nav-cta v3-nav-cta-phone">Plan a Journey</Link>

        <button
          className="v3-nav-burger nav-hamburger"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <span style={{ transform: menuOpen ? "translateY(6.5px) rotate(45deg)" : "none" }} />
          <span style={{ opacity: menuOpen ? 0 : 1 }} />
          <span style={{ transform: menuOpen ? "translateY(-6.5px) rotate(-45deg)" : "none" }} />
        </button>
      </nav>

      <div className={`v3-mobile-menu${menuOpen ? " open" : ""}`}>
        <Link href="/" className={isActive("/") ? "active" : ""}>Home</Link>
        <button type="button" onClick={() => setMobileCollectionsOpen((v) => !v)} className={location.startsWith("/collections") ? "active" : ""}>
          Collections
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: mobileCollectionsOpen ? "rotate(180deg)" : "none", transition: "transform .25s" }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <div className="v3-mobile-sub" style={{ maxHeight: mobileCollectionsOpen ? 480 : 0 }}>
          {COLLECTIONS.map((c) => (
            <Link key={c.slug} href={`/collections/${c.slug}`}>{c.label}</Link>
          ))}
        </div>
        {LINKS_AFTER.map((l) => (
          <Link key={l.href} href={l.href} className={isActive(l.href) ? "active" : ""}>{l.label}</Link>
        ))}
        <Link href="/plan" className="v3-mobile-cta">Plan a Journey</Link>
        <a href="tel:+918157003344" className="v3-mobile-phone">+91 8157 003 344</a>
      </div>
    </>
  );
}
