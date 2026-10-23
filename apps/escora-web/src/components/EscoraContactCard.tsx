import React, { useState } from "react";
import { useCreateEnquiry } from "@workspace/api-client-react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  Users,
  ChevronDown,
  ArrowRight,
  Check,
} from "lucide-react";
import "./EscoraContactCard.css";

interface EscoraContactCardProps {
  id?: string;
  className?: string;
}

const COUNTRY_CODES = [
  { code: "+91", label: "India (+91)" },
  { code: "+1", label: "USA/Canada (+1)" },
  { code: "+44", label: "UK (+44)" },
  { code: "+971", label: "UAE (+971)" },
  { code: "+61", label: "Australia (+61)" },
  { code: "+65", label: "Singapore (+65)" },
  { code: "+49", label: "Germany (+49)" },
  { code: "+33", label: "France (+33)" },
];

const TRAVEL_TYPES = [
  "Select journey type",
  "Honeymoon",
  "Health & Wellness / Ayurveda",
  "Nature & Wildlife",
  "Hill Stations",
  "Backwaters & Houseboat",
  "Beaches & Coastline",
  "Functional Medicine",
  "Historical & Heritage",
  "Not sure yet — help me plan",
];

const TRAVELLER_OPTIONS = [
  "e.g. 2 adults (couple)",
  "1 adult (solo)",
  "2 adults (couple)",
  "Family with children",
  "Small group (3–5 adults)",
  "Private party (6+ guests)",
];

const BUDGET_OPTIONS = [
  "e.g. ₹5–10 lakhs",
  "Under ₹2 Lakhs",
  "₹2 – 5 Lakhs",
  "₹5 – 10 Lakhs",
  "₹10 – 15 Lakhs",
  "Above ₹15 Lakhs",
  "Custom / Flexible",
];

export default function EscoraContactCard({ id = "contact", className = "" }: EscoraContactCardProps) {
  const [form, setForm] = useState({
    name: "",
    countryCode: "+91",
    phone: "",
    email: "",
    type: "",
    dates: "",
    pax: "2 adults (couple)",
    budget: "",
    marketingConsent: false,
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const createEnquiry = useCreateEnquiry();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) {
      setError("Please fill in your name, phone, and email.");
      return;
    }
    setError("");

    const fullPhone = `${form.countryCode} ${form.phone.trim()}`;
    const message = [
      `Travel Type: ${form.type && form.type !== "Select journey type" ? form.type : "Not specified"}`,
      `Approximate Dates: ${form.dates || "Not specified"}`,
      `Travellers: ${form.pax || "Not specified"}`,
      `Budget: ${form.budget && form.budget !== "e.g. ₹5–10 lakhs" ? form.budget : "Not specified"}`,
    ].join("\n");

    createEnquiry.mutate(
      {
        data: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: fullPhone,
          message,
          marketingConsent: form.marketingConsent,
        } as any,
      },
      {
        onSuccess: () => setSubmitted(true),
        onError: () =>
          setError("Something went wrong. Please try again or connect directly with us on WhatsApp."),
      }
    );
  }

  function getWhatsAppUrl() {
    const lines = [
      "Hello Escora — I'd like to plan a Kerala journey.",
      form.name ? `Name: ${form.name}` : "",
      form.phone ? `Phone: ${form.countryCode} ${form.phone}` : "",
      form.type && form.type !== "Select journey type" ? `Journey Type: ${form.type}` : "",
      form.dates ? `Dates: ${form.dates}` : "",
      form.pax ? `Travellers: ${form.pax}` : "",
      form.budget && form.budget !== "e.g. ₹5–10 lakhs" ? `Budget: ${form.budget}` : "",
    ].filter(Boolean);

    return `https://wa.me/918157003344?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  return (
    <section className={`escora-enquiry-section ${className}`} id={id} aria-label="Begin Your Journey">
      <div className="escora-enquiry-container">
        <div className="escora-two-column-layout">
          {/* ─── Left Column: Journey Introduction & Contact Details ─── */}
          <div className="escora-intro-col">
            <span className="escora-intro-eyebrow">BEGIN YOUR JOURNEY</span>

            <h2 className="escora-intro-heading">
              Start with a<br />
              blank <em className="escora-intro-accent">canvas.</em>
            </h2>

            <p className="escora-intro-desc">
              Tell us the kind of journey you have in mind. A Kerala curator will write back within 24 hours with three options — yours to refine, reject or rearrange.
            </p>

            <div className="escora-contact-details">
              {/* WhatsApp Row */}
              <div className="escora-contact-detail-row">
                <div className="escora-contact-icon-badge" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="escora-contact-wa-svg">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c.01 4.54-3.68 8.23-8.22 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.55.12.17 1.74 2.65 4.21 3.72.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.07-.11-.23-.17-.48-.29z" />
                  </svg>
                </div>
                <div className="escora-contact-info-block">
                  <span className="escora-contact-label">WHATSAPP</span>
                  <a
                    href="https://wa.me/918157003344"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="escora-contact-link"
                  >
                    +91 8157 003 344
                  </a>
                </div>
              </div>

              {/* Email Row */}
              <div className="escora-contact-detail-row">
                <div className="escora-contact-icon-badge" aria-hidden="true">
                  <Mail size={16} strokeWidth={2} />
                </div>
                <div className="escora-contact-info-block">
                  <span className="escora-contact-label">EMAIL</span>
                  <a href="mailto:hello@escoraholidays.com" className="escora-contact-link">
                    hello@escoraholidays.com
                  </a>
                </div>
              </div>

              {/* Office Row */}
              <div className="escora-contact-detail-row">
                <div className="escora-contact-icon-badge" aria-hidden="true">
                  <MapPin size={16} strokeWidth={2} />
                </div>
                <div className="escora-contact-info-block">
                  <span className="escora-contact-label">OFFICE</span>
                  <span className="escora-contact-text-val">
                    1st Floor, Landmark Maple Business Tower, Kozhikode, Kerala 673014
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Right Column: Existing Enquiry Form ─── */}
          <div className="escora-form-col">
            <div className="escora-enquiry-card">
              <div className="escora-card-form-wrap">
            {submitted ? (
              <div className="escora-success-view">
                <div className="escora-success-icon-badge">
                  <Check size={28} strokeWidth={2.4} />
                </div>
                <h3 className="escora-success-title">Enquiry Received</h3>
                <p className="escora-success-desc">
                  Thank you, {form.name || "Traveller"}. A Kerala journey curator will review your details
                  and write back within 24 hours. For an immediate response, message us on WhatsApp.
                </p>
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="escora-submit-btn"
                  style={{ textDecoration: "none" }}
                >
                  <span>Chat on WhatsApp</span>
                  <ArrowRight size={16} strokeWidth={2.2} />
                  <img
                    src="/assets/enquiry/botanical-leaves.png"
                    alt=""
                    className="escora-btn-leaf-img"
                    aria-hidden="true"
                  />
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                {/* Header */}
                <span className="escora-card-eyebrow">SEND AN ENQUIRY</span>

                <h2 className="escora-card-heading">
                  <span className="escora-heading-line1">Let's Plan Your</span>
                  <span className="escora-heading-line2-wrap">
                    <span className="escora-heading-line2">Kerala Journey</span>
                    {/* 3rd image on heading right side */}
                    <img
                      src="/assets/enquiry/gold-palm-tree.png"
                      alt=""
                      className="escora-heading-palm-img"
                      aria-hidden="true"
                    />
                  </span>
                </h2>

                <p className="escora-card-subtitle">
                  Share a few details and we'll plan your personalized Kerala journey.
                </p>

                {/* Form Fields Grid */}
                <div className="escora-form-grid">
                  {/* Field 1: YOUR NAME */}
                  <div className="escora-form-field">
                    <label className="escora-field-label" htmlFor="escora-name">
                      YOUR NAME
                    </label>
                    <div className="escora-input-pill">
                      <span className="escora-pill-icon" aria-hidden="true">
                        <User size={18} strokeWidth={1.8} />
                      </span>
                      <input
                        id="escora-name"
                        type="text"
                        required
                        placeholder="Priya / James..."
                        className="escora-text-input"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Field 2: PHONE / WHATSAPP */}
                  <div className="escora-form-field">
                    <label className="escora-field-label" htmlFor="escora-phone">
                      PHONE / WHATSAPP
                    </label>
                    <div className="escora-input-pill">
                      <span className="escora-pill-icon" aria-hidden="true">
                        <Phone size={18} strokeWidth={1.8} />
                      </span>
                      <div className="escora-phone-wrap">
                        <select
                          className="escora-phone-prefix-select"
                          value={form.countryCode}
                          onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
                          aria-label="Country calling code"
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code}
                            </option>
                          ))}
                        </select>
                        <span className="escora-phone-prefix-arrow" aria-hidden="true">
                          ▾
                        </span>
                        <div className="escora-phone-divider" aria-hidden="true" />
                        <input
                          id="escora-phone"
                          type="tel"
                          required
                          placeholder="Enter your phone number"
                          className="escora-text-input"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Field 3: EMAIL */}
                  <div className="escora-form-field">
                    <label className="escora-field-label" htmlFor="escora-email">
                      EMAIL
                    </label>
                    <div className="escora-input-pill">
                      <span className="escora-pill-icon" aria-hidden="true">
                        <Mail size={18} strokeWidth={1.8} />
                      </span>
                      <input
                        id="escora-email"
                        type="email"
                        required
                        placeholder="you@email.com"
                        className="escora-text-input"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Field 4: TRAVEL TYPE */}
                  <div className="escora-form-field">
                    <label className="escora-field-label" htmlFor="escora-type">
                      TRAVEL TYPE
                    </label>
                    <div className="escora-input-pill">
                      <span className="escora-pill-icon" aria-hidden="true">
                        <Briefcase size={18} strokeWidth={1.8} />
                      </span>
                      <select
                        id="escora-type"
                        className="escora-select-input"
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                      >
                        {TRAVEL_TYPES.map((t, idx) => (
                          <option key={idx} value={idx === 0 ? "" : t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <span className="escora-select-chevron" aria-hidden="true">
                        <ChevronDown size={16} strokeWidth={2} />
                      </span>
                    </div>
                  </div>

                  {/* Field 5: APPROXIMATE DATES */}
                  <div className="escora-form-field">
                    <label className="escora-field-label" htmlFor="escora-dates">
                      APPROXIMATE DATES
                    </label>
                    <div className="escora-input-pill">
                      <span className="escora-pill-icon" aria-hidden="true">
                        <Calendar size={18} strokeWidth={1.8} />
                      </span>
                      <input
                        id="escora-dates"
                        type="text"
                        placeholder="e.g. Nov 2026, 7 nights"
                        className="escora-text-input"
                        value={form.dates}
                        onChange={(e) => setForm({ ...form, dates: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Field 6: NUMBER OF TRAVELLERS */}
                  <div className="escora-form-field">
                    <label className="escora-field-label" htmlFor="escora-pax">
                      NUMBER OF TRAVELLERS
                    </label>
                    <div className="escora-input-pill">
                      <span className="escora-pill-icon" aria-hidden="true">
                        <Users size={18} strokeWidth={1.8} />
                      </span>
                      <select
                        id="escora-pax"
                        className="escora-select-input"
                        value={form.pax}
                        onChange={(e) => setForm({ ...form, pax: e.target.value })}
                      >
                        {TRAVELLER_OPTIONS.map((opt, idx) => (
                          <option key={idx} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <span className="escora-select-chevron" aria-hidden="true">
                        <ChevronDown size={16} strokeWidth={2} />
                      </span>
                    </div>
                  </div>

                  {/* Field 7: BUDGET ( ₹ INR, APPROX. ) — Full Width */}
                  <div className="escora-form-field full-width">
                    <label className="escora-field-label" htmlFor="escora-budget">
                      BUDGET ( ₹ INR, APPROX. )
                    </label>
                    <div className="escora-input-pill">
                      <span className="escora-pill-icon rupee-symbol" aria-hidden="true">
                        ₹
                      </span>
                      <select
                        id="escora-budget"
                        className="escora-select-input"
                        value={form.budget}
                        onChange={(e) => setForm({ ...form, budget: e.target.value })}
                      >
                        {BUDGET_OPTIONS.map((b, idx) => (
                          <option key={idx} value={idx === 0 ? "" : b}>
                            {b}
                          </option>
                        ))}
                      </select>
                      <span className="escora-select-chevron" aria-hidden="true">
                        <ChevronDown size={16} strokeWidth={2} />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Consent Checkbox */}
                <div className="escora-consent-row">
                  <input
                    type="checkbox"
                    id="escora-marketing-consent"
                    className="escora-custom-checkbox"
                    checked={form.marketingConsent}
                    onChange={(e) => setForm({ ...form, marketingConsent: e.target.checked })}
                  />
                  <label htmlFor="escora-marketing-consent" className="escora-consent-label">
                    I'd like to receive occasional travel inspiration, destination guides, and special offers
                    from Escora Holidays by email. I can unsubscribe at any time.
                  </label>
                </div>

                {error && <p className="escora-form-error">{error}</p>}

                {/* Action Buttons Row */}
                <div className="escora-buttons-row">
                  {/* Primary Submit Button with Leaf Illustration */}
                  <button
                    type="submit"
                    className="escora-submit-btn"
                    disabled={createEnquiry.isPending}
                  >
                    <span>{createEnquiry.isPending ? "SENDING..." : "SEND ENQUIRY"}</span>
                    <ArrowRight size={16} strokeWidth={2.4} />
                    {/* Last image for button right side */}
                    <img
                      src="/assets/enquiry/botanical-leaves.png"
                      alt=""
                      className="escora-btn-leaf-img"
                      aria-hidden="true"
                    />
                  </button>

                  {/* Secondary WhatsApp Pill Button */}
                  <a
                    href={getWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="escora-wa-btn"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="escora-wa-icon-svg"
                      aria-hidden="true"
                    >
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c.01 4.54-3.68 8.23-8.22 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.55.12.17 1.74 2.65 4.21 3.72.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.07-.11-.23-.17-.48-.29z" />
                    </svg>
                    <span>WHATSAPP US</span>
                    <ArrowRight size={16} strokeWidth={2.4} />
                  </a>
                </div>
              </form>
            )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
