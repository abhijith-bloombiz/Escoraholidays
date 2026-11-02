import React, { useState } from 'react';
import { Link } from 'wouter';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  Send,
  CheckCircle2,
  Compass,
  MessageCircle,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  Calendar,
  Users,
  Award
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EnquiryModal from '../components/EnquiryModal';
import Toast from '../components/Toast';
import HeroGradientBackground from '../components/HeroGradientBackground';
import { ESCORA_INFO } from '../data/escoraData';
import { useScrollReveal, usePageScrollReveal } from '../hooks/useScrollAnimation';

const DURATION_CHOICES = ["4–6 Days", "7–10 Days", "11–14 Days", "15+ Days"];

const INTEREST_CHOICES = [
  "Backwaters & Houseboat",
  "Munnar Tea Highlands",
  "Ayurveda & Rejuvenation",
  "Couples & Honeymoon",
  "Rainforest & Wayanad",
  "Heritage, Spices & Arts"
];

const FAQS = [
  {
    q: "How soon can I expect a response after sending my inquiry?",
    a: "Our private Kerala curators typically review your wishes and respond within 2 to 4 business hours with an initial consultation or preliminary journey framework."
  },
  {
    q: "Are Escora itineraries completely private and customizable?",
    a: "Yes, 100%. We do not conduct group bus tours. Every journey is handcrafted specifically for you, featuring private chauffeured luxury vehicles, dedicated naturalists, and exclusive boutique villas."
  },
  {
    q: "Can you accommodate dietary needs or mobility preferences?",
    a: "Absolutely. From traditional Kerala vegetarian Sadhya and Halal preferences to wheelchair-friendly heritage retreats and gentle-paced walks, your curator tailors every detail."
  },
  {
    q: "What support do we receive while traveling on the ground in Kerala?",
    a: "You have a dedicated 24/7 personal trip concierge reachable by phone and WhatsApp, along with a vetted, English-speaking private chauffeur throughout your journey."
  }
];

export default function ContactPage() {
  usePageScrollReveal();

  const [enquiryOpen, setEnquiryOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const [formRef, formVisible] = useScrollReveal<HTMLElement>({ threshold: 0, rootMargin: '250px 0px', reEnter: true });
  const [faqRef, faqVisible] = useScrollReveal<HTMLElement>({ threshold: 0, rootMargin: '250px 0px', reEnter: true });

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    travelMonth: 'Winter 2026-2027 (Nov - Feb)',
    duration: '7–10 Days',
    interest: 'Backwaters & Houseboat',
    guests: '2 Adults',
    notes: ''
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone) {
      setToastMessage('Please fill in your name, email, and phone number.');
      return;
    }

    setLoading(true);
    try {
      await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          travelStyle: formData.interest,
          travelDate: formData.travelMonth,
          specialRequests: `Duration: ${formData.duration} | Guests: ${formData.guests} | Notes: ${formData.notes || ''}`.trim(),
          source: 'contact_page'
        })
      });
    } catch (err) {
      console.warn('Contact inquiry request note:', err);
    } finally {
      setLoading(false);
      setSubmitted(true);
      setToastMessage(`Thank you ${formData.fullName}! Your Kerala journey inquiry has been received.`);
    }
  };

  const handleReset = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      travelMonth: 'Winter 2026-2027 (Nov - Feb)',
      duration: '7–10 Days',
      interest: 'Backwaters & Houseboat',
      guests: '2 Adults',
      notes: ''
    });
    setSubmitted(false);
  };

  return (
    <div className="anim-page-fade-in" style={{ minHeight: '100vh', backgroundColor: '#F8F6F1', color: '#121316', display: 'flex', flexDirection: 'column' }}>
      <Navbar onOpenEnquiry={() => setEnquiryOpen(true)} />

      {/* Hero Section with Luxury Animated Gradient */}
      <section
        style={{
          position: 'relative',
          padding: '11rem 2rem 6.5rem',
          backgroundColor: '#0D0F13',
          color: '#FFFFFF',
          textAlign: 'center',
          overflow: 'hidden'
        }}
      >
        <HeroGradientBackground />

        <div className="section-wrapper" style={{ maxWidth: '960px', position: 'relative', zIndex: 2 }}>
          {/* Eyebrow Badge */}
          <div
            className="anim-hero-badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '0.45rem 1.2rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#D4A359',
              fontWeight: 600,
              marginBottom: '1.6rem',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
            }}
          >
            <Compass size={14} color="#D4A359" /> Bespoke Concierge &amp; Atelier
          </div>

          <h1
            className="font-display anim-hero-title"
            style={{
              fontSize: 'clamp(2.5rem, 5.5vw, 4.2rem)',
              lineHeight: 1.05,
              marginBottom: '1.25rem',
              letterSpacing: '0.04em'
            }}
          >
            CONNECT WITH OUR KERALA CURATORS
          </h1>

          <p
            className="anim-hero-desc"
            style={{
              fontSize: 'clamp(1rem, 1.25vw, 1.15rem)',
              color: 'rgba(255, 255, 255, 0.78)',
              lineHeight: 1.7,
              maxWidth: '740px',
              margin: '0 auto 2.5rem'
            }}
          >
            Whether envisioning a tranquil Alleppey backwater voyage, a misty tea sanctuary in Munnar, or an authentic Ayurvedic rejuvenation, our private curators are here to orchestrate every nuance.
          </p>

          {/* Quick Contact Highlight Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              maxWidth: '920px',
              margin: '0 auto'
            }}
          >
            <a
              href="tel:+918157003344"
              className="luxury-interactive-card reveal-card stagger-1"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '1.1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                textDecoration: 'none',
                color: '#FFFFFF',
                transition: 'all 0.3s ease'
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(212, 163, 89, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Phone size={19} color="#D4A359" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.72rem', color: '#D4A359', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Direct Voice</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '2px', letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>+91 8157 003 344</div>
              </div>
            </a>

            <a
              href="https://wa.me/918157003344?text=Hello%20Escora%20Holidays%2C%20I%20would%20like%20to%20inquire%20about%20a%20bespoke%20Kerala%20holiday."
              target="_blank"
              rel="noopener noreferrer"
              className="luxury-interactive-card reveal-card stagger-2"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '1.1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                textDecoration: 'none',
                color: '#FFFFFF',
                transition: 'all 0.3s ease'
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(37, 211, 102, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <MessageCircle size={19} color="#25D366" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.72rem', color: '#25D366', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>WhatsApp Concierge</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '2px' }}>Instant Chat 24/7</div>
              </div>
            </a>

            <a
              href="mailto:admin@escoraholidays.com"
              className="luxury-interactive-card reveal-card stagger-3"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '1.1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                textDecoration: 'none',
                color: '#FFFFFF',
                transition: 'all 0.3s ease'
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(212, 163, 89, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Mail size={19} color="#D4A359" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.72rem', color: '#D4A359', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Official Email</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '2px', wordBreak: 'break-all' }}>admin@escoraholidays.com</div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Main Interactive Contact Atelier & Form Section */}
      <section
        ref={formRef}
        style={{
          padding: '6rem 0',
          backgroundColor: '#F8F6F1',
          position: 'relative'
        }}
      >
        <div className="section-wrapper">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '3.5rem',
              alignItems: 'start'
            }}
          >
            {/* Left Column: Interactive Contact Form */}
            <div
              className="reveal-card"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                padding: 'clamp(2rem, 3.5vw, 3rem)',
                border: '1px solid rgba(0, 0, 0, 0.07)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.06)'
              }}
            >
              <div className="reveal-fade-up" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#B48235', fontSize: '0.82rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                <Sparkles size={16} /> Direct Inquiry Dossier
              </div>

              <h2
                className="font-display reveal-fade-up stagger-1"
                style={{
                  fontSize: 'clamp(2rem, 3vw, 2.5rem)',
                  color: '#121316',
                  lineHeight: 1.1,
                  marginBottom: '1rem'
                }}
              >
                CRAFT YOUR BESPOKE RETREAT
              </h2>

              <p className="reveal-fade-up stagger-2" style={{ color: '#4B5563', fontSize: '0.96rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                Share your journey dates, desires, and travel party. We will shape an exclusive, personalized Kerala itinerary with pricing and handpicked estates.
              </p>

              {submitted ? (
                <div
                  style={{
                    backgroundColor: '#F3EFE8',
                    border: '1px solid rgba(180, 130, 53, 0.3)',
                    borderRadius: '20px',
                    padding: '2.5rem 2rem',
                    textAlign: 'center'
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(37, 211, 102, 0.18)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.25rem'
                    }}
                  >
                    <CheckCircle2 size={36} color="#25D366" />
                  </div>

                  <h3 className="font-display" style={{ fontSize: '1.8rem', color: '#121316', marginBottom: '0.75rem' }}>
                    INQUIRY RECEIVED WITH PLEASURE
                  </h3>

                  <p style={{ color: '#4B5563', fontSize: '0.98rem', lineHeight: 1.65, maxWidth: '480px', margin: '0 auto 1.5rem' }}>
                    Thank you, <strong>{formData.fullName}</strong>. Your Kerala expedition dossier has been logged. Our lead curator will review your preferences and connect via phone or WhatsApp.
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
                    <a
                      href="https://wa.me/918157003344"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-pill"
                      style={{
                        backgroundColor: '#25D366',
                        color: '#FFFFFF',
                        textDecoration: 'none',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        padding: '0.75rem 1.6rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <MessageCircle size={16} /> Fast-Track on WhatsApp
                    </a>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="btn-pill btn-white"
                      style={{
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        padding: '0.75rem 1.5rem',
                        border: '1px solid #D1D5DB'
                      }}
                    >
                      Send Another Inquiry
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
                  {/* Full Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#374151', marginBottom: '0.45rem' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      placeholder="e.g. Dr. Julian Weiss"
                      value={formData.fullName}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '0.85rem 1.1rem',
                        borderRadius: '12px',
                        border: '1px solid #D1D5DB',
                        backgroundColor: '#FAFAF9',
                        fontSize: '0.95rem',
                        color: '#121316',
                        outline: 'none',
                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#B48235';
                        e.target.style.boxShadow = '0 0 0 3px rgba(180, 130, 53, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#D1D5DB';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  {/* Email & Phone Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#374151', marginBottom: '0.45rem' }}>
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="julian@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '0.85rem 1.1rem',
                          borderRadius: '12px',
                          border: '1px solid #D1D5DB',
                          backgroundColor: '#FAFAF9',
                          fontSize: '0.95rem',
                          color: '#121316',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#374151', marginBottom: '0.45rem' }}>
                        Phone / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="+1 (555) 000-0000"
                        value={formData.phone}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '0.85rem 1.1rem',
                          borderRadius: '12px',
                          border: '1px solid #D1D5DB',
                          backgroundColor: '#FAFAF9',
                          fontSize: '0.95rem',
                          color: '#121316',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Travel Season & Preferred Duration */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#374151', marginBottom: '0.45rem' }}>
                        Travel Window
                      </label>
                      <select
                        name="travelMonth"
                        value={formData.travelMonth}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '0.85rem 1.1rem',
                          borderRadius: '12px',
                          border: '1px solid #D1D5DB',
                          backgroundColor: '#FAFAF9',
                          fontSize: '0.92rem',
                          color: '#121316',
                          outline: 'none'
                        }}
                      >
                        <option value="Winter 2026-2027 (Nov - Feb)">Winter 2026–2027 (Nov – Feb)</option>
                        <option value="Spring 2027 (Mar - May)">Spring 2027 (Mar – May)</option>
                        <option value="Monsoon Healing 2027 (Jun - Aug)">Monsoon Healing 2027 (Jun – Aug)</option>
                        <option value="Autumn 2027 (Sep - Oct)">Autumn 2027 (Sep – Oct)</option>
                        <option value="Flexible / Dates Pending">Flexible / Undecided</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#374151', marginBottom: '0.45rem' }}>
                        Ideal Duration
                      </label>
                      <select
                        name="duration"
                        value={formData.duration}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '0.85rem 1.1rem',
                          borderRadius: '12px',
                          border: '1px solid #D1D5DB',
                          backgroundColor: '#FAFAF9',
                          fontSize: '0.92rem',
                          color: '#121316',
                          outline: 'none'
                        }}
                      >
                        {DURATION_CHOICES.map((dur) => (
                          <option key={dur} value={dur}>{dur}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Travel Interest & Guests */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#374151', marginBottom: '0.45rem' }}>
                        Primary Interest
                      </label>
                      <select
                        name="interest"
                        value={formData.interest}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '0.85rem 1.1rem',
                          borderRadius: '12px',
                          border: '1px solid #D1D5DB',
                          backgroundColor: '#FAFAF9',
                          fontSize: '0.92rem',
                          color: '#121316',
                          outline: 'none'
                        }}
                      >
                        {INTEREST_CHOICES.map((int) => (
                          <option key={int} value={int}>{int}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#374151', marginBottom: '0.45rem' }}>
                        Travel Party
                      </label>
                      <input
                        type="text"
                        name="guests"
                        placeholder="e.g. 2 Adults, 1 Child"
                        value={formData.guests}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '0.85rem 1.1rem',
                          borderRadius: '12px',
                          border: '1px solid #D1D5DB',
                          backgroundColor: '#FAFAF9',
                          fontSize: '0.95rem',
                          color: '#121316',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Special Requests / Notes */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#374151', marginBottom: '0.45rem' }}>
                      Special Wishes, Preferred Pace or Questions
                    </label>
                    <textarea
                      name="notes"
                      rows={4}
                      placeholder="Share any special celebrations, preferred style of accommodation (colonial planter bungalows, private pool villas, heritage kettuvallam), or dietary preferences..."
                      value={formData.notes}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '0.85rem 1.1rem',
                        borderRadius: '12px',
                        border: '1px solid #D1D5DB',
                        backgroundColor: '#FAFAF9',
                        fontSize: '0.95rem',
                        color: '#121316',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-pill btn-gold"
                    style={{
                      width: '100%',
                      padding: '1rem',
                      fontSize: '0.92rem',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.6rem',
                      marginTop: '0.5rem',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    <Send size={16} /> {loading ? 'Transmitting to Curator...' : 'Request Bespoke Proposal'}
                  </button>

                  <p style={{ fontSize: '0.78rem', color: '#6B7280', textAlign: 'center', margin: 0 }}>
                    <ShieldCheck size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px', color: '#B48235' }} />
                    Zero spam guaranteed. Your personal information is kept strictly confidential.
                  </p>
                </form>
              )}
            </div>

            {/* Right Column: Atelier Details, Direct Channels & Guarantee */}
            <div
              className="reveal-fade-right"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem'
              }}
            >
              {/* Private Atelier Office Card */}
              <div
                className="luxury-interactive-card reveal-card stagger-1"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '24px',
                  padding: '2.5rem',
                  border: '1px solid rgba(0, 0, 0, 0.07)',
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#B48235', fontSize: '0.8rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.6rem' }}>
                  <MapPin size={15} /> Private Atelier &amp; Head Office
                </div>

                <h3 className="font-display" style={{ fontSize: '1.9rem', color: '#121316', marginBottom: '1rem' }}>
                  ESCORA HOLIDAYS PVT. LTD.
                </h3>

                <p style={{ color: '#4B5563', fontSize: '0.96rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                  {ESCORA_INFO.address}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', borderTop: '1px solid #F3EFE8', paddingTop: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#374151', fontSize: '0.92rem' }}>
                    <Clock size={16} color="#B48235" />
                    <span><strong>Concierge Hours:</strong> Monday – Saturday, 9:00 AM – 7:30 PM IST</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#374151', fontSize: '0.92rem' }}>
                    <ShieldCheck size={16} color="#B48235" />
                    <span><strong>Active Travelers:</strong> 24/7 dedicated on-ground concierge support</span>
                  </div>
                </div>
              </div>

              {/* Direct Concierge WhatsApp Banner */}
              <div
                className="luxury-interactive-card reveal-card stagger-2"
                style={{
                  backgroundColor: '#0D0F13',
                  color: '#FFFFFF',
                  borderRadius: '24px',
                  padding: '2.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                  border: '1px solid rgba(212, 163, 89, 0.25)'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-30%',
                    right: '-20%',
                    width: '240px',
                    height: '240px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(212, 163, 89, 0.22) 0%, transparent 70%)',
                    pointerEvents: 'none'
                  }}
                />

                <span style={{ fontSize: '0.76rem', color: '#D4A359', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                  INSTANT COMMUNICATION
                </span>

                <h3 className="font-display" style={{ fontSize: '1.9rem', color: '#FFFFFF', marginBottom: '0.85rem' }}>
                  SPEAK DIRECTLY WITH A CURATOR
                </h3>

                <p style={{ color: 'rgba(255, 255, 255, 0.78)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '1.75rem' }}>
                  Prefer chatting immediately? Message our senior concierge team directly on WhatsApp with your prospective dates and party size for real-time assistance.
                </p>

                <a
                  href="https://wa.me/918157003344?text=Hello%20Escora%20Holidays%2C%20I%20would%20like%20to%20inquire%20about%20a%20bespoke%20Kerala%20holiday."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-pill"
                  style={{
                    backgroundColor: '#25D366',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    padding: '0.85rem 1.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    letterSpacing: '0.04em'
                  }}
                >
                  <MessageCircle size={18} /> Chat on WhatsApp Now
                </a>
              </div>

              {/* The Escora Distinction Pillars */}
              <div
                className="reveal-card stagger-2"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '24px',
                  padding: '2.2rem',
                  border: '1px solid rgba(0, 0, 0, 0.07)'
                }}
              >
                <h4 className="font-display" style={{ fontSize: '1.35rem', color: '#121316', marginBottom: '1.25rem' }}>
                  THE ESCORA COMMITMENT
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { title: "Completely Bespoke", desc: "Every route is crafted from scratch based on your rhythm and desires." },
                    { title: "Privately Chauffeured", desc: "Pristine luxury fleet with discreet, master chauffeurs across Kerala." },
                    { title: "Handpicked Stays", desc: "Heritage plantations, private backwater kettuvallams, and eco-luxury retreats." },
                    { title: "Round-the-Clock Concierge", desc: "A direct personal line to your Kerala curator throughout your stay." }
                  ].map((pillar, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(180, 130, 53, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}
                      >
                        <CheckCircle2 size={15} color="#B48235" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#121316' }}>{pillar.title}</div>
                        <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '2px', lineHeight: 1.45 }}>{pillar.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section
        ref={faqRef}
        style={{
          padding: '5rem 0 7rem',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #ECE7DE'
        }}
      >
        <div className="section-wrapper" style={{ maxWidth: '960px' }}>
          <div className="reveal-fade-up" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="reveal-fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#B48235', fontSize: '0.8rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
              <HelpCircle size={15} /> Travel Planning Clarity
            </div>
            <h2 className="font-display reveal-fade-up stagger-1" style={{ fontSize: 'clamp(2.2rem, 3.5vw, 3rem)', color: '#121316' }}>
              FREQUENTLY ASKED QUESTIONS
            </h2>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className={`luxury-interactive-card reveal-card stagger-${(idx % 4) + 1}`}
                style={{
                  backgroundColor: '#F8F6F1',
                  borderRadius: '16px',
                  padding: '1.75rem 2rem',
                  border: '1px solid rgba(0, 0, 0, 0.06)'
                }}
              >
                <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: '#121316', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#B48235' }}>0{idx + 1}.</span> {faq.q}
                </h3>
                <p style={{ color: '#4B5563', fontSize: '0.94rem', lineHeight: 1.7, margin: 0 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '3.5rem', textAlign: 'center' }}>
            <Link
              href="/plan"
              className="btn-pill btn-gold"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.88rem',
                fontWeight: 700,
                padding: '0.85rem 1.8rem',
                letterSpacing: '0.04em'
              }}
            >
              Explore Interactive Itinerary Atelier <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <Footer onOpenEnquiry={() => setEnquiryOpen(true)} onShowToast={(msg) => setToastMessage(msg)} />

      {/* Global Enquiry Modal & Toast for notifications */}
      <EnquiryModal
        isOpen={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        onShowToast={(msg) => setToastMessage(msg)}
      />

      <Toast
        message={toastMessage}
        onClose={() => setToastMessage('')}
      />
    </div>
  );
}
