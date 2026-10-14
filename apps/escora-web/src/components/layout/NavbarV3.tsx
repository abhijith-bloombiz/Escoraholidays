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
  const [menuOpen, setMenuOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [mobileCollectionsOpen, setMobileCollectionsOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const overHero = location === "/" && !scrolled && !menuOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); setCollectionsOpen(false); setMobileCollectionsOpen(false); }, [location]);
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  function openCollections() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setCollectionsOpen(true);
  }
  function scheduleCloseCollections() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setCollectionsOpen(false), 60);
  }

  const isActive = (href: string) => (href === "/" ? location === "/" : location.startsWith(href));

  return (
    <>
      <nav className={`v3-nav${overHero ? " is-over-hero" : ""}${scrolled ? " is-scrolled" : ""}`}>
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
