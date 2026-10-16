import { Link } from "wouter";
import escoraLogoLight from "@assets/escora/escora-logo-light.png";

export default function FooterV3() {
  return (
    <footer className="cinematic-footer" aria-label="Site Footer">
      {/* Background Aerial Beach Image & Fade Overlay */}
      <div className="cinematic-footer-bg-wrap" aria-hidden="true">
        <div className="cinematic-footer-bg-img" />
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

            <div>
              <Link href="/plan" className="cinematic-footer-plan-btn">
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
                  <li><a href="/#the-escora-way" className="cinematic-footer-nav-link">The Escora Way</a></li>
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

            {/* Bottom Quote & Palm Illustration */}
            <div className="cinematic-footer-quote-wrap">
              <p className="cinematic-footer-quote">
                “Different journeys. A deeper Kerala.”
              </p>

              <svg
                className="cinematic-footer-palm-svg"
                viewBox="0 0 100 130"
                fill="none"
                stroke="#c59a58"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 125 C25 115 50 125 95 125" strokeWidth="1.2" />
                <path d="M15 125 C35 118 60 120 85 125" strokeWidth="0.9" opacity="0.7" />

                <path d="M52 122 C51 95 50 65 52 38" strokeWidth="2.2" />
                <path d="M50.5 110 L53.5 110" strokeWidth="1.4" />
                <path d="M50.5 98 L53.5 98" strokeWidth="1.4" />
                <path d="M50.2 86 L53.2 86" strokeWidth="1.4" />
                <path d="M50.2 74 L53.2 74" strokeWidth="1.4" />
                <path d="M50.5 62 L53.5 62" strokeWidth="1.4" />
                <path d="M51 50 L53.5 50" strokeWidth="1.4" />

                <path d="M52 38 C52 20 52 10 52 5" strokeWidth="1.5" />
                <path d="M52 18 C46 14 43 9 44 6" strokeWidth="1.1" />
                <path d="M52 18 C58 14 61 9 60 6" strokeWidth="1.1" />
                <path d="M52 26 C45 22 40 18 42 14" strokeWidth="1.1" />
                <path d="M52 26 C59 22 64 18 62 14" strokeWidth="1.1" />

                <path d="M52 38 C42 28 25 22 10 26" strokeWidth="1.4" />
                <path d="M38 29 C32 23 26 21 24 20" strokeWidth="1.1" />
                <path d="M30 27 C24 23 18 24 16 25" strokeWidth="1.1" />
                <path d="M52 38 C38 34 22 38 12 50" strokeWidth="1.4" />
                <path d="M40 37 C32 38 24 43 20 48" strokeWidth="1.1" />
                <path d="M52 38 C44 45 32 55 22 68" strokeWidth="1.4" />
                <path d="M42 47 C34 54 28 62 26 66" strokeWidth="1.1" />

                <path d="M52 38 C62 28 79 22 94 26" strokeWidth="1.4" />
                <path d="M66 29 C72 23 78 21 80 20" strokeWidth="1.1" />
                <path d="M74 27 C80 23 86 24 88 25" strokeWidth="1.1" />
                <path d="M52 38 C66 34 82 38 92 50" strokeWidth="1.4" />
                <path d="M64 37 C72 38 80 43 84 48" strokeWidth="1.1" />
                <path d="M52 38 C60 45 72 55 82 68" strokeWidth="1.4" />
                <path d="M62 47 C70 54 76 62 78 66" strokeWidth="1.1" />

                <path d="M52 38 C46 48 38 56 30 62" strokeWidth="1.2" />
                <path d="M52 38 C58 48 66 56 74 62" strokeWidth="1.2" />
              </svg>
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
