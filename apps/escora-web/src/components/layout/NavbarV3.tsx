import { Link, useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import escoraWordmark from "@assets/escora/escora-wordmark.png";
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
  { href: "/destinations", label: "Explore Kerala" },
  { href: "/journal", label: "Journal" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

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
    closeTimer.current = setTimeout(() => setCollectionsOpen(false), 150);
  }

  const isActive = (href: string) => (href === "/" ? location === "/" : location.startsWith(href));

  return (
    <>
      <nav className={`v3-nav${overHero ? " is-over-hero" : ""}${scrolled ? " is-scrolled" : ""}`}>
        <Link href="/" className="v3-nav-brand" aria-label="Escora — Home">
          <img src={overHero ? escoraWordmark : escoraMark} alt="Escora" />
        </Link>

        <div className="v3-nav-links nav-links-row">
          <Link href="/" className={`v3-nav-link${isActive("/") ? " active" : ""}`}>Home</Link>

          <div className="v3-nav-dd" onMouseEnter={openCollections} onMouseLeave={scheduleCloseCollections}>
            <Link
              href="/collections/honeymoon"
              className={`v3-nav-link${location.startsWith("/collections") ? " active" : ""}`}
              aria-haspopup="true"
              aria-expanded={collectionsOpen}
            >
              Collections
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: collectionsOpen ? "rotate(180deg)" : "none", transition: "transform .25s" }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </Link>
            <div className={`v3-nav-panel${collectionsOpen ? " open" : ""}`}>
              {COLLECTIONS.map((c) => (
                <Link key={c.slug} href={`/collections/${c.slug}`} className={location === `/collections/${c.slug}` ? "active" : ""}>
                  {c.label}
                </Link>
              ))}
            </div>
          </div>

          {LINKS_AFTER.map((l) => (
            <Link key={l.href} href={l.href} className={`v3-nav-link${isActive(l.href) ? " active" : ""}`}>{l.label}</Link>
          ))}
        </div>

        <div className="v3-nav-right nav-right-desktop">
          <a href="tel:+918157003344" className="v3-nav-phone nav-phone">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
            </svg>
            +91 8157 003 344
          </a>
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
