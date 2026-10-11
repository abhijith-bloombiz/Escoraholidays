import { Link } from "wouter";
import escoraLogo from "@assets/escora/escora-logo-white.png";

/* Same content as the live Footer — only the typography and palette change
   for V3 (Deep Forest Green ground, sage accents, Manrope throughout). */

const SOCIAL_LINKS = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/escora-holidays/about/",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.114 20.452H3.558V9h3.556v11.452z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/escora_holidays",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/people/Escora-holidays",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13.5 21v-7.5h2.5l.4-3H13.5V8.5c0-.87.24-1.46 1.49-1.46h1.6V4.36C16.3 4.25 15.3 4.2 14.2 4.2c-2.3 0-3.86 1.4-3.86 3.98V10.5H7.8v3h2.54V21h3.16z" />
      </svg>
    ),
  },
];

const TRAVEL_TYPES = [
  { label: "Honeymoon", slug: "honeymoon" },
  { label: "Health & Wellness", slug: "health-wellness" },
  { label: "Nature & Wildlife", slug: "nature-wildlife" },
  { label: "Hill Stations", slug: "hill-stations" },
  { label: "Backwaters", slug: "backwaters" },
  { label: "Beaches", slug: "beaches" },
  { label: "Functional Medicine", slug: "functional-medicine" },
  { label: "Historical & Heritage", slug: "historical-heritage" },
];

const RETREATS = ["Ayurveda & Panchakarma", "Yoga & Meditation", "Kalaripayattu", "Naturopathy & Healthcare"];

export default function FooterV3() {
  return (
    <footer className="v3-footer footer2">
      <div className="v3-footer-wrap">
        <div className="v3-footer-grid">
          <div className="v3-footer-brand">
            <img src={escoraLogo} alt="Escora — Explore · Experience · Escape" />
            <p>A destination management studio composing private journeys through Kerala for the world's most discerning travellers. Est. Kozhikode, 2016.</p>
            <div className="v3-footer-social">
              {SOCIAL_LINKS.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
          <div className="v3-footer-col">
            <h5>Travel Types</h5>
            <ul>
              {TRAVEL_TYPES.map((t) => (
                <li key={t.slug}><Link href={`/collections/${t.slug}`}>{t.label}</Link></li>
              ))}
            </ul>
          </div>
          <div className="v3-footer-col">
            <h5>Escora Retreat</h5>
            <ul>
              {RETREATS.map((r) => (
                <li key={r}><a href="/#retreat">{r}</a></li>
              ))}
            </ul>
          </div>
          <div className="v3-footer-col">
            <h5>Contact</h5>
            <ul>
              <li><a href="tel:+918157003344">+91 8157 003 344</a></li>
              <li><a href="mailto:hello@escoraholidays.com">hello@escoraholidays.com</a></li>
              <li><Link href="/about">Kozhikode, Kerala 673014</Link></li>
              <li><Link href="/journal">The Journal</Link></li>
              <li><Link href="/about">About Escora</Link></li>
            </ul>
          </div>
        </div>
        <div className="v3-footer-bottom">
          <span>© 2026 Escora · Private Journeys · Kerala, India</span>
          <Link href="/privacy-policy">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
}
