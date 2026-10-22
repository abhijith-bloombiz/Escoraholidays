import { useState } from "react";
import { Link } from "wouter";
import escoraLogoLight from "@assets/escora/escora-logo-light.png";
import emeraldPalmCanopy from "@assets/escora/Emerald Engraved Palm Canopy.png";

export default function FooterV3() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterState, setNewsletterState] = useState<"idle" | "loading" | "success" | "duplicate" | "error">("idle");
  const [newsletterMsg, setNewsletterMsg] = useState("");

  async function handleNewsletterSubmit(e: React.FormEvent) {
    e.preventDefault();
    const email = newsletterEmail.trim();
    if (!email || !email.includes("@") || !email.includes(".")) {
      setNewsletterState("error");
      setNewsletterMsg("Please enter a valid email address.");
      return;
    }
    setNewsletterState("loading");
    setNewsletterMsg("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.alreadySubscribed) {
          setNewsletterState("duplicate");
          setNewsletterMsg("You are already subscribed to the Escora newsletter!");
        } else {
          setNewsletterState("success");
          setNewsletterMsg(data.message || "Thank you for subscribing! Check your inbox for travel inspiration.");
          setNewsletterEmail("");
        }
      } else {
        setNewsletterState("error");
        setNewsletterMsg(data.error || "Failed to subscribe. Please try again.");
      }
    } catch {
      setNewsletterState("error");
      setNewsletterMsg("Unable to connect. Please try again later.");
    }
  }

  return (
    <footer className="cinematic-footer" aria-label="Site Footer">
      {/* Background Emerald Engraved Palm Canopy */}
      <div className="cinematic-footer-bg-wrap" aria-hidden="true">
        <div
          className="cinematic-footer-bg-img"
          style={{ backgroundImage: `url(${emeraldPalmCanopy})` }}
        />
        <div className="cinematic-footer-bg-mask" />
      </div>

      <div className="cinematic-footer-container">
        <div className="cinematic-footer-split">
          {/* ── Left Section: Brand & Persona ── */}
          <div className="cinematic-footer-brand">
            <Link href="/" className="cinematic-footer-brand-link" aria-label="Escora Holidays Home">
              <img
                src={escoraLogoLight}
                alt="Escora Holidays"
                className="cinematic-footer-brand-img"
                loading="lazy"
              />
            </Link>

            <h3 className="cinematic-footer-tagline">
              <em>Kerala,</em> <span>your way.</span>
            </h3>

            <p className="cinematic-footer-desc">
              Slow journeys. Deeper stories.<br />
              A more meaningful Kerala.
            </p>

            {/* ── Email send field ── */}
            <div className="cinematic-footer-newsletter" style={{ marginTop: "22px", maxWidth: "340px" }}>
              {newsletterState === "success" ? (
                <div role="status" aria-live="polite" style={{ background: "rgba(36, 84, 61, 0.5)", border: "1px solid #24543D", borderRadius: "8px", padding: "10px 14px", color: "#A3D9B8", fontSize: "12px", lineHeight: "1.4" }}>
                  ✓ {newsletterMsg}
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="cinematic-footer-newsletter-form" noValidate>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      type="email"
                      id="footer-newsletter-email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Your email address"
                      aria-label="Email address for newsletter"
                      disabled={newsletterState === "loading"}
                      style={{
                        flex: 1,
                        background: "rgba(255, 255, 255, 0.08)",
                        border: "1px solid rgba(229, 221, 208, 0.25)",
                        borderRadius: "9999px",
                        padding: "8px 14px",
                        fontSize: "12px",
                        color: "#fff",
                        outline: "none",
                      }}
                    />
                    <button
                      type="submit"
                      id="footer-newsletter-submit-btn"
                      disabled={newsletterState === "loading"}
                      style={{
                        background: "#c59a58",
                        color: "#0c2016",
                        border: "none",
                        borderRadius: "9999px",
                        padding: "8px 16px",
                        fontSize: "10.5px",
                        fontWeight: 600,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: "opacity 0.2s ease",
                      }}
                    >
                      {newsletterState === "loading" ? "..." : "Subscribe"}
                    </button>
                  </div>
                  {newsletterState === "duplicate" && (
                    <p role="status" aria-live="polite" style={{ color: "#cbab6e", fontSize: "11px", margin: "6px 0 0 4px" }}>
                      ℹ {newsletterMsg}
                    </p>
                  )}
                  {newsletterState === "error" && (
                    <p role="alert" aria-live="polite" style={{ color: "#f87171", fontSize: "11px", margin: "6px 0 0 4px" }}>
                      ⚠ {newsletterMsg}
                    </p>
                  )}
                </form>
              )}
            </div>

            <div>
              <Link href="/plan-a-journey" className="cinematic-footer-plan-btn">
                <span>PLAN A JOURNEY</span>
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="cinematic-footer-social-row">
              <a
                href="https://www.instagram.com/escora_holidays"
                target="_blank"
                rel="noopener noreferrer"
                className="cinematic-footer-social-btn"
                aria-label="Escora on Instagram"
                title="Instagram"
              >
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>

              <a
                href="https://www.facebook.com/people/Escora-holidays"
                target="_blank"
                rel="noopener noreferrer"
                className="cinematic-footer-social-btn"
                aria-label="Escora on Facebook"
                title="Facebook"
              >
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>

              <a
                href="https://www.youtube.com/@escoraholidays"
                target="_blank"
                rel="noopener noreferrer"
                className="cinematic-footer-social-btn"
                aria-label="Escora on YouTube"
                title="YouTube"
              >
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#0c2016" />
                </svg>
              </a>

              <a
                href="https://www.linkedin.com/company/escora-holidays/about/"
                target="_blank"
                rel="noopener noreferrer"
                className="cinematic-footer-social-btn"
                aria-label="Escora on LinkedIn"
                title="LinkedIn"
              >
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>
          </div>

          {/* ── Right Section: Navigation, Quote & Legal ── */}
          <div className="cinematic-footer-nav-panel">
            <div className="cinematic-footer-nav-grid">
              {/* EXPLORE */}
              <div className="cinematic-footer-nav-col">
                <h5>EXPLORE</h5>
                <ul>
                  <li><Link href="/" className="cinematic-footer-nav-link">Home</Link></li>
                  <li><Link href="/trip-planner" className="cinematic-footer-nav-link">AI Trip Planner</Link></li>
                  <li><Link href="/destinations" className="cinematic-footer-nav-link">Explore Kerala</Link></li>
                  <li><Link href="/journeys" className="cinematic-footer-nav-link">Our Collections</Link></li>
                  <li><Link href="/journeys" className="cinematic-footer-nav-link">Signature Journeys</Link></li>
                  <li><Link href="/destinations" className="cinematic-footer-nav-link">Destinations</Link></li>
                  <li><a href="/#categories" className="cinematic-footer-nav-link">Travel Experiences</a></li>
                </ul>
              </div>

              {/* DISCOVER */}
              <div className="cinematic-footer-nav-col">
                <h5>DISCOVER</h5>
                <ul>
                  <li><Link href="/about" className="cinematic-footer-nav-link">The Escora Way</Link></li>
                  <li><Link href="/about" className="cinematic-footer-nav-link">The Escora Difference</Link></li>
                  <li><a href="/#how-it-works" className="cinematic-footer-nav-link">How It Works</a></li>
                  <li><Link href="/journal" className="cinematic-footer-nav-link">The Journal</Link></li>
                  <li><Link href="/journal" className="cinematic-footer-nav-link">Travel Guide</Link></li>
                  <li><a href="/#contact" className="cinematic-footer-nav-link">FAQs</a></li>
                </ul>
              </div>

              {/* CONTACT */}
              <div className="cinematic-footer-nav-col">
                <h5>CONTACT</h5>
                <ul>
                  <li>
                    <a href="tel:+918157003344" className="cinematic-footer-nav-link">
                      +91 8157 003 344
                    </a>
                  </li>
                  <li>
                    <a href="mailto:hello@escoraholidays.com" className="cinematic-footer-nav-link">
                      hello@escoraholidays.com
                    </a>
                  </li>
                  <li>
                    <Link href="/about" className="cinematic-footer-nav-link">
                      Kozhikode, Kerala 673014
                    </Link>
                  </li>
                  <li>
                    <Link href="/journal" className="cinematic-footer-nav-link">
                      The Journal
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="cinematic-footer-nav-link">
                      About Escora
                    </Link>
                  </li>
                </ul>
              </div>
            </div>



            <div className="cinematic-footer-divider" />

            <div className="cinematic-footer-legal-row">
              <p className="cinematic-footer-copy">© 2026 Escora. All rights reserved.</p>
              <div className="cinematic-footer-legal-links">
                <Link href="/privacy-policy">Privacy Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
