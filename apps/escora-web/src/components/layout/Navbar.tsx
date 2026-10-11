import { Link, useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import escoraWordmark from "@assets/escora/escora-wordmark.png";
import escoraLogoDark from "@assets/escora/escora-logo-dark.png";

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

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [mobileCollectionsOpen, setMobileCollectionsOpen] = useState(false);
  const [location] = useLocation();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openCollections() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setCollectionsOpen(true);
  }
  function scheduleCloseCollections() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setCollectionsOpen(false), 150);
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); setCollectionsOpen(false); setMobileCollectionsOpen(false); }, [location]);

  // Clean up any pending close timer on unmount
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const navLinksBefore = [
    { href: "/", label: "Home" },
  ];
  const navLinksAfter = [
    { href: "/destinations", label: "Explore Kerala" },
    { href: "/journal", label: "Journal" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];
  const navLinks = [...navLinksBefore, ...navLinksAfter];

  function handleAnchorClick(href: string) {
    return (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!href.startsWith("/#")) return;
      e.preventDefault();
      setMenuOpen(false);
      setTimeout(() => {
        document.getElementById(href.slice(2))?.scrollIntoView({ behavior: "smooth" });
      }, menuOpen ? 300 : 0);
    };
  }

  const isHome = location === "/";

  return (
    <>
      <nav
        style={
          isHome
            ? {
                position: "fixed",
                top: scrolled ? 12 : 18,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                padding: scrolled ? "8px 14px 8px 24px" : "12px clamp(20px, 4vw, 56px)",
                width: scrolled ? "min(1240px, calc(100vw - 32px))" : "min(1400px, 100vw)",
                background: scrolled ? "rgba(253, 250, 243, 0.95)" : "transparent",
                backdropFilter: scrolled ? "blur(20px)" : "none",
                WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
                border: scrolled ? "1px solid rgba(220, 214, 200, 0.7)" : "none",
                borderRadius: scrolled ? 999 : 0,
                boxShadow: scrolled ? "0 10px 30px rgba(0,0,0,0.06)" : "none",
                transition: "top 0.4s cubic-bezier(0.16,1,0.3,1), background 0.4s, border 0.4s, box-shadow 0.4s",
              }
            : {
                position: "fixed",
                top: scrolled ? 12 : 18,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 200,
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 8px 8px 22px",
                width: "min(1080px, calc(100vw - 32px))",
                background: scrolled ? "rgba(13, 10, 7, 0.92)" : "rgba(21, 16, 11, 0.62)",
                backdropFilter: "blur(26px) saturate(150%)",
                WebkitBackdropFilter: "blur(26px) saturate(150%)",
                border: `1px solid ${scrolled ? "rgba(232, 220, 196, 0.14)" : "rgba(232, 220, 196, 0.1)"}`,
                borderRadius: 999,
                boxShadow: "0 1px 0 rgba(232,220,196,0.06) inset, 0 14px 40px rgba(0,0,0,0.45)",
                transition: "top 0.45s cubic-bezier(0.16,1,0.3,1), background 0.45s, border-color 0.45s",
              }
        }
      >
        {/* Brand */}
        <Link href="/" style={{ display: "flex", alignItems: "center", marginRight: isHome ? 0 : "auto" }}>
          <img
            src={isHome && !menuOpen ? escoraLogoDark : escoraWordmark}
            alt="Escora"
            style={{
              height: isHome ? (scrolled ? 28 : 34) : (scrolled ? 26 : 30),
              width: "auto",
              display: "block",
              transition: "height 0.3s cubic-bezier(0.16,1,0.3,1)",
            }}
          />
        </Link>

        {/* Nav links — hidden on mobile */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isHome ? 22 : 2,
            fontFamily: "var(--f-body)",
            fontSize: isHome ? 12.5 : 13.5,
            fontWeight: isHome ? 500 : 400,
            letterSpacing: isHome ? "0.08em" : "normal",
            textTransform: isHome ? "uppercase" : "none",
          }}
          className="nav-links-row"
        >
          {navLinksBefore.map((link) => {
            const isActive = location === link.href || (link.href === "/" && location === "/");
            const isHomeActive = isHome && (link.href === "/" || location === "/");
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={handleAnchorClick(link.href)}
                style={{
                  position: "relative",
                  color: isHome ? (isHomeActive ? "#18221c" : "#323c34") : (isActive ? "var(--gold)" : "var(--ink-soft)"),
                  borderBottom: isHomeActive ? "2px solid #c59b27" : "2px solid transparent",
                  padding: isHome ? "6px 4px 4px 4px" : "9px 16px",
                  borderRadius: isHome ? 0 : 999,
                  fontWeight: isHomeActive ? 600 : (isHome ? 500 : 400),
                  background: "transparent",
                  transition: "color 0.3s, border-color 0.3s",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  if (!isHome) {
                    el.style.color = "var(--ink)";
                    el.style.background = "rgba(232, 220, 196, 0.07)";
                  }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  if (!isHome) {
                    el.style.color = isActive ? "var(--gold)" : "var(--ink-soft)";
                    el.style.background = "transparent";
                  }
                }}
              >
                {link.label}
              </a>
            );
          })}

          {/* Collections dropdown */}
          <div
            style={{ position: "relative" }}
            onMouseEnter={openCollections}
            onMouseLeave={scheduleCloseCollections}
          >
            <a
              href="/collections/honeymoon"
              aria-haspopup="true"
              aria-expanded={collectionsOpen}
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                color: isHome ? "#323c34" : (location.startsWith("/collections") ? "var(--gold)" : "var(--ink-soft)"),
                padding: isHome ? "6px 4px 4px 4px" : "9px 16px",
                borderRadius: isHome ? 0 : 999,
                background: (!isHome && collectionsOpen) ? "rgba(232, 220, 196, 0.07)" : "transparent",
                transition: "color 0.3s, background 0.3s",
                textDecoration: "none",
                whiteSpace: "nowrap",
                fontWeight: isHome ? 500 : 400,
              }}
              onMouseEnter={(e) => {
                if (!isHome) (e.currentTarget as HTMLElement).style.color = "var(--ink)";
              }}
              onMouseLeave={(e) => {
                if (!isHome) (e.currentTarget as HTMLElement).style.color = location.startsWith("/collections") ? "var(--gold)" : "var(--ink-soft)";
              }}
            >
              Collections
              <svg
                width="9" height="9" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: collectionsOpen ? "rotate(180deg)" : "none", transition: "transform 0.25s" }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </a>

            {/* Dropdown panel */}
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 10px)",
                left: "50%",
                transform: collectionsOpen ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(-6px)",
                opacity: collectionsOpen ? 1 : 0,
                pointerEvents: collectionsOpen ? "auto" : "none",
                transition: "opacity 0.22s cubic-bezier(0.16,1,0.3,1), transform 0.22s cubic-bezier(0.16,1,0.3,1)",
                background: isHome ? "#ffffff" : "rgba(13, 10, 7, 0.97)",
                backdropFilter: "blur(26px) saturate(150%)",
                WebkitBackdropFilter: "blur(26px) saturate(150%)",
                border: isHome ? "1px solid rgba(220, 214, 200, 0.85)" : "1px solid rgba(232, 220, 196, 0.14)",
                borderRadius: 18,
                padding: 10,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
                width: 400,
                boxShadow: isHome ? "0 18px 45px rgba(0,0,0,0.12)" : "0 14px 40px rgba(0,0,0,0.45)",
              }}
            >
              {COLLECTIONS.map((c) => (
                <a
                  key={c.slug}
                  href={`/collections/${c.slug}`}
                  style={{
                    display: "block",
                    padding: "10px 14px",
                    borderRadius: 12,
                    fontFamily: "var(--f-body)",
                    fontSize: 13,
                    color: location === `/collections/${c.slug}` ? "var(--gold)" : (isHome ? "#18221c" : "var(--ink-soft)"),
                    background: "transparent",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    transition: "color 0.2s, background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.color = "var(--gold)";
                    el.style.background = isHome ? "#faf7f0" : "rgba(232, 220, 196, 0.07)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.color = location === `/collections/${c.slug}` ? "var(--gold)" : (isHome ? "#18221c" : "var(--ink-soft)");
                    el.style.background = "transparent";
                  }}
                >
                  {c.label}
                </a>
              ))}
            </div>
          </div>

          {navLinksAfter.map((link) => {
            const isActive = location === link.href || (link.href === "/" && location === "/");
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={handleAnchorClick(link.href)}
                style={{
                  position: "relative",
                  color: isHome ? "#323c34" : (isActive ? "var(--gold)" : "var(--ink-soft)"),
                  borderBottom: isHome && isActive ? "2px solid #c59b27" : "2px solid transparent",
                  padding: isHome ? "6px 4px 4px 4px" : "9px 16px",
                  borderRadius: isHome ? 0 : 999,
                  background: "transparent",
                  transition: "color 0.3s, background 0.3s",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  if (!isHome) {
                    el.style.color = "var(--ink)";
                    el.style.background = "rgba(232, 220, 196, 0.07)";
                  }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  if (!isHome) {
                    el.style.color = isActive ? "var(--gold)" : "var(--ink-soft)";
                    el.style.background = "transparent";
                  }
                }}
              >
                {link.label}
              </a>
            );
          })}
        </div>

        {/* Right side — desktop & mobile */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }} className="nav-right-desktop">
          {!isHome && (
            <a
              href="tel:+918157003344"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontFamily: "var(--f-body)",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.01em",
                color: "var(--gold-bright)",
                whiteSpace: "nowrap",
                textDecoration: "none",
                transition: "opacity 0.3s",
              }}
              className="nav-phone"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.8"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
              </svg>
              +91 8157 003 344
            </a>
          )}

          <a
            href="/plan"
            style={{
              background: isHome ? "#141f17" : "var(--gold)",
              color: isHome ? "#ffffff" : "var(--bg)",
              border: `1px solid ${isHome ? "#141f17" : "var(--gold)"}`,
              padding: isHome ? "10px 22px" : "9px 18px",
              borderRadius: 999,
              fontFamily: "var(--f-body)",
              fontSize: 12.5,
              fontWeight: 600,
              letterSpacing: "0.03em",
              whiteSpace: "nowrap",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              transition: "background 0.3s, transform 0.3s, border-color 0.3s",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              if (isHome) {
                el.style.background = "#c59b27";
                el.style.borderColor = "#c59b27";
              } else {
                el.style.background = "var(--gold-bright)";
              }
              el.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = isHome ? "#141f17" : "var(--gold)";
              el.style.borderColor = isHome ? "#141f17" : "var(--gold)";
              el.style.transform = "translateY(0)";
            }}
          >
            <span>Plan a Journey</span>
            <span style={{ fontSize: 14, transform: "translateX(1px)" }}>→</span>
          </a>

          {/* Hamburger menu button — shown only on mobile/tablet */}
          <button
            type="button"
            className="nav-hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            style={{
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              width: 38,
              height: 38,
              gap: 4.5,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
              borderRadius: 999,
            }}
          >
            <span style={{
              display: "block", width: 20, height: 1.8,
              background: menuOpen ? "#f6efe4" : (isHome ? "#18221c" : "var(--ink-soft)"),
              borderRadius: 2,
              transform: menuOpen ? "translateY(6.3px) rotate(45deg)" : "none",
              transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1), background 0.3s",
            }} />
            <span style={{
              display: "block", width: 20, height: 1.8,
              background: menuOpen ? "#f6efe4" : (isHome ? "#18221c" : "var(--ink-soft)"),
              borderRadius: 2,
              opacity: menuOpen ? 0 : 1,
              transition: "opacity 0.2s, background 0.3s",
            }} />
            <span style={{
              display: "block", width: 20, height: 1.8,
              background: menuOpen ? "#f6efe4" : (isHome ? "#18221c" : "var(--ink-soft)"),
              borderRadius: 2,
              transform: menuOpen ? "translateY(-6.3px) rotate(-45deg)" : "none",
              transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1), background 0.3s",
            }} />
          </button>
        </div>

        <style>{`
          .nav-hamburger {
            display: none !important;
          }
          @media (max-width: 920px) {
            .nav-links-row { display: none !important; }
            .nav-phone { display: none !important; }
            .nav-right-desktop a { display: none !important; }
            .nav-hamburger { display: flex !important; }
          }
        `}</style>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className="mobile-menu-overlay"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 199,
          background: "rgba(10, 8, 5, 0.97)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 4,
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? "auto" : "none",
          transition: "opacity 0.3s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {navLinksBefore.map((link, i) => {
          const isActive = location === link.href || (link.href === "/" && location === "/");
          return (
            <a
              key={link.href}
              href={link.href}
              onClick={handleAnchorClick(link.href)}
              style={{
                color: isActive ? "var(--gold)" : "var(--ink-soft)",
                fontFamily: "var(--f-body)",
                fontSize: 28,
                fontWeight: 400,
                letterSpacing: "0.02em",
                textDecoration: "none",
                padding: "14px 32px",
                borderRadius: 12,
                transition: "color 0.2s, background 0.2s, transform 0.3s",
                transform: menuOpen ? "translateY(0)" : "translateY(20px)",
                transitionDelay: menuOpen ? `${i * 40}ms` : "0ms",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--gold)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = isActive ? "var(--gold)" : "var(--ink-soft)";
              }}
            >
              {link.label}
            </a>
          );
        })}

        {/* Collections — expandable */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transform: menuOpen ? "translateY(0)" : "translateY(20px)",
            transition: "transform 0.3s",
            transitionDelay: menuOpen ? `${navLinksBefore.length * 40}ms` : "0ms",
          }}
        >
          <button
            onClick={() => setMobileCollectionsOpen((v) => !v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: location.startsWith("/collections") ? "var(--gold)" : "var(--ink-soft)",
              fontFamily: "var(--f-body)",
              fontSize: 28,
              fontWeight: 400,
              letterSpacing: "0.02em",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "14px 32px",
              borderRadius: 12,
              transition: "color 0.2s, background 0.2s",
            }}
          >
            Collections
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: mobileCollectionsOpen ? "rotate(180deg)" : "none", transition: "transform 0.25s" }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <div
            style={{
              maxHeight: mobileCollectionsOpen ? 480 : 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              transition: "max-height 0.35s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            {COLLECTIONS.map((c) => (
              <a
                key={c.slug}
                href={`/collections/${c.slug}`}
                onClick={() => setMenuOpen(false)}
                style={{
                  color: location === `/collections/${c.slug}` ? "var(--gold)" : "var(--ink-mute)",
                  fontFamily: "var(--f-body)",
                  fontSize: 17,
                  fontWeight: 400,
                  textDecoration: "none",
                  padding: "10px 32px",
                }}
              >
                {c.label}
              </a>
            ))}
          </div>
        </div>

        {navLinksAfter.map((link, i) => {
          const isActive = location === link.href || (link.href === "/" && location === "/");
          const delayIndex = navLinksBefore.length + 1 + i;
          return (
            <a
              key={link.href}
              href={link.href}
              onClick={handleAnchorClick(link.href)}
              style={{
                color: isActive ? "var(--gold)" : "var(--ink-soft)",
                fontFamily: "var(--f-body)",
                fontSize: 28,
                fontWeight: 400,
                letterSpacing: "0.02em",
                textDecoration: "none",
                padding: "14px 32px",
                borderRadius: 12,
                transition: "color 0.2s, background 0.2s, transform 0.3s",
                transform: menuOpen ? "translateY(0)" : "translateY(20px)",
                transitionDelay: menuOpen ? `${delayIndex * 40}ms` : "0ms",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--gold)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = isActive ? "var(--gold)" : "var(--ink-soft)";
              }}
            >
              {link.label}
            </a>
          );
        })}

        <a
          href="/plan"
          onClick={() => setMenuOpen(false)}
          style={{
            marginTop: 24,
            background: "var(--gold)",
            color: "var(--bg)",
            padding: "14px 36px",
            borderRadius: 999,
            fontFamily: "var(--f-body)",
            fontSize: 15,
            fontWeight: 500,
            textDecoration: "none",
            transform: menuOpen ? "translateY(0)" : "translateY(20px)",
            transition: "transform 0.3s",
            transitionDelay: menuOpen ? `${(navLinks.length + 1) * 40}ms` : "0ms",
          }}
        >
          Plan a Journey
        </a>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          marginTop: 28,
          transform: menuOpen ? "translateY(0)" : "translateY(20px)",
          transition: "transform 0.3s",
          transitionDelay: menuOpen ? `${(navLinks.length + 2) * 40}ms` : "0ms",
        }}>
          <a
            href="https://www.instagram.com/escora_holidays"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow us on Instagram"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: 999,
              border: "1px solid rgba(232, 220, 196, 0.22)",
              color: "var(--ink-soft)",
              flexShrink: 0,
            }}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 9.837a3.836 3.836 0 1 1 0-7.673 3.836 3.836 0 0 1 0 7.673zm6.406-11.845a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />
            </svg>
          </a>
          <a
            href="https://www.facebook.com/people/Escora-holidays"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow us on Facebook"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: 999,
              border: "1px solid rgba(232, 220, 196, 0.22)",
              color: "var(--ink-soft)",
              flexShrink: 0,
            }}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 12.061C22 6.505 17.523 2 12 2S2 6.505 2 12.061c0 5.023 3.657 9.184 8.438 9.939v-7.03H7.898v-2.909h2.54V9.845c0-2.522 1.492-3.915 3.777-3.915 1.094 0 2.238.197 2.238.197v2.459h-1.26c-1.243 0-1.63.78-1.63 1.578v1.898h2.773l-.443 2.909h-2.33V22c4.78-.755 8.437-4.916 8.437-9.939z" />
            </svg>
          </a>
        </div>

        <p style={{
          marginTop: 12,
          fontFamily: "var(--f-mono)",
          fontSize: 11,
          letterSpacing: "0.12em",
          color: "rgba(232,220,196,0.3)",
          transform: menuOpen ? "translateY(0)" : "translateY(20px)",
          transition: "transform 0.3s",
          transitionDelay: menuOpen ? `${(navLinks.length + 3) * 40}ms` : "0ms",
        }}>
          +91 8157 003 344
        </p>
      </div>
    </>
  );
}
