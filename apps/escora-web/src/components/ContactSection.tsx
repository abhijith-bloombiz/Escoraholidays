import React, { useState, useEffect, useCallback } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  MessageCircle
} from 'lucide-react';
import { ESCORA_INFO } from '../data/escoraData';
import { useScrollReveal } from '../hooks/useScrollAnimation';

const DURATION_OPTIONS = ["4–6 Days", "7–10 Days", "11–14 Days", "15+ Days"];

const INTEREST_OPTIONS = [
  "Backwaters & Houseboat",
  "Tea Highlands (Munnar)",
  "Ayurveda & Wellness",
  "Couples & Honeymoon",
  "Rainforest & Wildlife",
  "Malabar Heritage & Spice"
];

export interface ContactFormData {
  fullName: string;
  email: string;
  phone: string;
  travelMonth: string;
  duration: string;
  interest: string;
  notes: string;
}

export interface ContactSectionProps {
  onShowToast?: (msg: string) => void;
  onOpenEnquiry?: (data?: Record<string, any>) => void;
}

export default function ContactSection({ onShowToast }: ContactSectionProps) {
  const [sectionRef, isVisible] = useScrollReveal<HTMLElement>({ threshold: 0.15, reEnter: true });

  // Animation phases: 'unrevealed' -> 'reversed' (revealed vice-versa) -> 'swapping' (crossing over) -> 'settled'
  const [swapPhase, setSwapPhase] = useState<'unrevealed' | 'reversed' | 'swapping' | 'settled'>('unrevealed');
  const [isDesktop, setIsDesktop] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth > 860 : true
  );

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 860);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sequence: reveal vice-versa, then animate changing positions vice-versa
  const triggerSwapAnimation = useCallback(() => {
    setSwapPhase('reversed');
    const t1 = setTimeout(() => {
      setSwapPhase('swapping');
      setTimeout(() => {
        setSwapPhase('settled');
      }, 1200);
    }, 750);
    return () => {
      clearTimeout(t1);
    };
  }, []);

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout> | undefined;
    let t2: ReturnType<typeof setTimeout> | undefined;
    if (isVisible) {
      setSwapPhase('reversed');
      t1 = setTimeout(() => {
        setSwapPhase('swapping');
        t2 = setTimeout(() => {
          setSwapPhase('settled');
        }, 1200);
      }, 750);
    } else {
      setSwapPhase('unrevealed');
    }
    return () => {
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
    };
  }, [isVisible]);

  const [formData, setFormData] = useState<ContactFormData>({
    fullName: '',
    email: '',
    phone: '',
    travelMonth: 'Winter 2026-2027 (Nov - Feb)',
    duration: '7–10 Days',
    interest: 'Backwaters & Houseboat',
    notes: ''
  });

  const [submitted, setSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone) return;

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
          specialRequests: `Duration: ${formData.duration}. Notes: ${formData.notes || ''}`.trim(),
          source: 'website_contact_section'
        })
      });
    } catch (err) {
      console.warn('Contact enquiry network note:', err);
    } finally {
      setLoading(false);
      setSubmitted(true);
      if (onShowToast) {
        onShowToast(`Thank you ${formData.fullName}! Your Kerala travel request has been received.`);
      }
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
      notes: ''
    });
    setSubmitted(false);
  };

  // Card 1 (Left: Concierge Desk)
  const getLeftCardStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      backgroundColor: '#FFFFFF',
      borderRadius: '24px',
      padding: 'clamp(1.5rem, 2.4vw, 2rem)',
      border: '1px solid rgba(0, 0, 0, 0.06)',
      position: 'relative'
    };

    if (!isDesktop) {
      return {
        ...base,
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.7s var(--ease-luxury), transform 0.7s var(--ease-luxury)'
      };
    }

    if (swapPhase === 'unrevealed') {
      return {
        ...base,
        opacity: 0,
        transform: 'translateX(calc(100% + 2rem)) translateY(24px)',
        zIndex: 3,
        pointerEvents: 'none',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)'
      };
    }

    if (swapPhase === 'reversed') {
      return {
        ...base,
        opacity: 1,
        transform: 'translateX(calc(100% + 2rem)) translateY(0)',
        zIndex: 3,
        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.07)',
        transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
      };
    }

    if (swapPhase === 'swapping') {
      return {
        ...base,
        opacity: 1,
        transform: 'translateX(0) translateY(0) scale(1.02)',
        zIndex: 3,
        boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(180, 130, 53, 0.25)',
        transition: 'transform 1.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s ease, scale 1.15s cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'transform'
      };
    }

    // 'settled'
    return {
      ...base,
      opacity: 1,
      transform: 'translate3d(0, 0, 0) scale(1)',
      zIndex: 1,
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
      transition: 'transform 0.4s ease, box-shadow 0.4s ease, scale 0.4s ease'
    };
  };

  // Card 2 (Right: Consultation Form)
  const getRightCardStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      backgroundColor: '#FFFFFF',
      borderRadius: '24px',
      padding: 'clamp(1.5rem, 2.4vw, 2rem)',
      border: '1px solid rgba(180, 130, 53, 0.25)',
      position: 'relative'
    };

    if (!isDesktop) {
      return {
        ...base,
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.05)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.7s var(--ease-luxury) 0.12s, transform 0.7s var(--ease-luxury) 0.12s'
      };
    }

    if (swapPhase === 'unrevealed') {
      return {
        ...base,
        opacity: 0,
        transform: 'translateX(calc(-100% - 2rem)) translateY(24px)',
        zIndex: 1,
        pointerEvents: 'none',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.05)'
      };
    }

    if (swapPhase === 'reversed') {
      return {
        ...base,
        opacity: 1,
        transform: 'translateX(calc(-100% - 2rem)) translateY(0)',
        zIndex: 1,
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.05)',
        transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
      };
    }

    if (swapPhase === 'swapping') {
      return {
        ...base,
        opacity: 1,
        transform: 'translateX(0) translateY(0) scale(0.985)',
        zIndex: 1,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)',
        transition: 'transform 1.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s ease, scale 1.15s cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'transform'
      };
    }

    // 'settled'
    return {
      ...base,
      opacity: 1,
      transform: 'translate3d(0, 0, 0) scale(1)',
      zIndex: 1,
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.05)',
      transition: 'transform 0.4s ease, box-shadow 0.4s ease, scale 0.4s ease'
    };
  };

  return (
    <section
      id="contact"
      ref={sectionRef}
      style={{
        backgroundColor: '#F8F6F1',
        padding: '5rem 0 6.5rem',
        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div className="section-wrapper">

        {/* Section Header */}
        <div
          style={{
            maxWidth: '820px',
            margin: '0 auto 3rem',
            textAlign: 'center',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(28px)',
            transition: 'opacity 0.8s var(--ease-luxury), transform 0.8s var(--ease-luxury)'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.65rem'
            }}
          >
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
                textTransform: 'uppercase',
                fontSize: '0.78rem',
                letterSpacing: '0.2em',
                color: '#9E6F29',
                fontWeight: 700
              }}
            >
              LET'S BEGIN
            </span>
          </div>

          <h2
            className="font-display"
            style={{
              fontSize: 'clamp(2.1rem, 4vw, 3.4rem)',
              color: '#121316',
              lineHeight: 1.05,
              letterSpacing: '0.04em',
              marginBottom: '0.75rem'
            }}
          >
            YOUR KERALA JOURNEY<br />STARTS HERE.
          </h2>

          <p
            style={{
              fontSize: 'clamp(0.95rem, 1.1vw, 1.05rem)',
              color: '#5C5850',
              lineHeight: 1.6,
              maxWidth: '600px',
              margin: '0 auto',
              fontWeight: 400
            }}
          >
            Connect directly with our local curators. Private chauffeured transfers, handpicked sanctuaries, and 24/7 on-ground care.
          </p>
        </div>

        {/* Two-Column Grid: Concierge Desk on Left, Form on Right */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? 'repeat(2, minmax(0, 1fr))' : '1fr',
            gap: '2rem',
            maxWidth: '1120px',
            margin: '0 auto',
            alignItems: 'start',
            position: 'relative'
          }}
          className="contact-layout-grid"
        >

          {/* Left Column: Escora Concierge Desk Card */}
          <div
            style={getLeftCardStyle()}
          >

            {/* Left Column Header */}
            <div style={{ marginBottom: '1.4rem' }}>
              <h3
                className="font-display"
                style={{
                  fontSize: '1.55rem',
                  color: '#121316',
                  letterSpacing: '0.03em',
                  lineHeight: 1.15,
                  marginBottom: 0
                }}
              >
                ESCORA CONCIERGE DESK
              </h3>
            </div>

            {/* Direct Contact Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', marginBottom: '1.5rem' }}>

              {/* Telephone */}
              <a
                href={`tel:${ESCORA_INFO.phone.replace(/\s+/g, '')}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateX(4px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateX(0)')}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(180, 130, 53, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#B48235',
                    flexShrink: 0
                  }}
                >
                  <Phone size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B48235', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Direct Telephone
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#121316', marginTop: '0.15rem' }}>
                    {ESCORA_INFO.phone}
                  </div>
                </div>
              </a>

              {/* Email */}
              <a
                href={`mailto:${ESCORA_INFO.email}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateX(4px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateX(0)')}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(180, 130, 53, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#B48235',
                    flexShrink: 0
                  }}
                >
                  <Mail size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B48235', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Curator Email
                  </div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 600, color: '#121316', marginTop: '0.15rem' }}>
                    {ESCORA_INFO.email}
                  </div>
                </div>
              </a>

              {/* Office Address */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(180, 130, 53, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#B48235',
                    flexShrink: 0
                  }}
                >
                  <MapPin size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B48235', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Headquarters
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#4B5563', lineHeight: 1.5, marginTop: '0.15rem' }}>
                    {ESCORA_INFO.address}
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(180, 130, 53, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#B48235',
                    flexShrink: 0
                  }}
                >
                  <Clock size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B48235', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Desk Hours
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#4B5563', lineHeight: 1.5, marginTop: '0.15rem' }}>
                    Mon – Sat: 9:00 AM – 7:00 PM IST<br />
                    <span style={{ color: '#059669', fontWeight: 600 }}>● 24/7 on-ground assistance for active travellers</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Direct WhatsApp Button */}
            <a
              href="https://wa.me/918157003344?text=Hello%20Escora%20Holidays%2C%20I%20would%20like%20to%20inquire%20about%20a%20bespoke%20Kerala%20holiday."
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                width: '100%',
                padding: '0.75rem 1.25rem',
                backgroundColor: '#121316',
                color: '#FFFFFF',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.25s ease',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#075E54';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(7, 94, 84, 0.4)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#121316';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <MessageCircle size={18} />
              <span>Chat on WhatsApp Directly</span>
            </a>

          </div>

          {/* Right Column: Luxury On-Page Consultation Form */}
          <div
            style={getRightCardStyle()}
          >
            {submitted ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1.25rem'
                }}
              >
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(180, 130, 53, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#B48235'
                  }}
                >
                  <CheckCircle2 size={36} />
                </div>

                <h3
                  className="font-display"
                  style={{
                    fontSize: '2rem',
                    color: '#121316',
                    letterSpacing: '0.04em',
                    lineHeight: 1.1
                  }}
                >
                  CONSULTATION REQUEST RECEIVED
                </h3>

                <p
                  style={{
                    fontSize: '1rem',
                    color: '#4B5563',
                    maxWidth: '480px',
                    lineHeight: 1.6
                  }}
                >
                  Thank you, <strong>{formData.fullName}</strong>. Your Kerala holiday preferences have been sent directly to our senior travel curator. We will prepare a personalized itinerary proposal within 4 business hours.
                </p>

                <button
                  onClick={handleReset}
                  className="btn-pill btn-gold"
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem 2rem',
                    fontSize: '0.9rem'
                  }}
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div style={{ marginBottom: '0.35rem' }}>
                  <h3
                    className="font-display"
                    style={{
                      fontSize: '1.55rem',
                      color: '#121316',
                      letterSpacing: '0.04em',
                      lineHeight: 1.1,
                      marginBottom: 0
                    }}
                  >
                    REQUEST A BESPOKE ITINERARY
                  </h3>
                </div>

                {/* Row 1: Full Name & Email */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#121316', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      placeholder="e.g. Julian Weiss"
                      value={formData.fullName}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '0.72rem 0.95rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        backgroundColor: '#F8F6F1',
                        fontSize: '0.88rem',
                        color: '#121316',
                        outline: 'none',
                        fontFamily: 'var(--font-body)',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#B48235')}
                      onBlur={(e) => (e.target.style.borderColor = 'rgba(0, 0, 0, 0.12)')}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#121316', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="e.g. julian@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '0.72rem 0.95rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        backgroundColor: '#F8F6F1',
                        fontSize: '0.88rem',
                        color: '#121316',
                        outline: 'none',
                        fontFamily: 'var(--font-body)',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#B48235')}
                      onBlur={(e) => (e.target.style.borderColor = 'rgba(0, 0, 0, 0.12)')}
                    />
                  </div>
                </div>

                {/* Row 2: Phone & Travel Window */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#121316', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      Phone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="e.g. +44 7911 123456"
                      value={formData.phone}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '0.72rem 0.95rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        backgroundColor: '#F8F6F1',
                        fontSize: '0.88rem',
                        color: '#121316',
                        outline: 'none',
                        fontFamily: 'var(--font-body)',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#B48235')}
                      onBlur={(e) => (e.target.style.borderColor = 'rgba(0, 0, 0, 0.12)')}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#121316', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      Estimated Travel Period
                    </label>
                    <select
                      name="travelMonth"
                      value={formData.travelMonth}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '0.72rem 0.95rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        backgroundColor: '#F8F6F1',
                        fontSize: '0.88rem',
                        color: '#121316',
                        outline: 'none',
                        fontFamily: 'var(--font-body)',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Winter 2026-2027 (Nov - Feb)">Winter Peak (Nov – Feb)</option>
                      <option value="Upcoming 1-3 Months">Within the next 1–3 months</option>
                      <option value="Summer 2027 (Mar - May)">Highland Spring (Mar – May)</option>
                      <option value="Monsoon Wellness (Jun - Aug)">Ayurveda Monsoon (Jun – Aug)</option>
                      <option value="Flexible / Just Exploring">Flexible / Exploring options</option>
                    </select>
                  </div>
                </div>

                {/* Duration Pills */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#121316', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                    Preferred Journey Duration
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {DURATION_OPTIONS.map((dur) => {
                      const isSelected = formData.duration === dur;
                      return (
                        <button
                          type="button"
                          key={dur}
                          onClick={() => setFormData((prev) => ({ ...prev, duration: dur }))}
                          style={{
                            padding: '0.38rem 0.88rem',
                            borderRadius: '9999px',
                            fontSize: '0.8rem',
                            fontWeight: isSelected ? 700 : 500,
                            backgroundColor: isSelected ? '#121316' : '#F8F6F1',
                            color: isSelected ? '#FFFFFF' : '#4B5563',
                            border: isSelected ? '1px solid #121316' : '1px solid rgba(0, 0, 0, 0.08)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {dur}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Primary Interest Dropdown */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#121316', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Primary Travel Style or Focus
                  </label>
                  <select
                    name="interest"
                    value={formData.interest}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.72rem 0.95rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(0, 0, 0, 0.12)',
                      backgroundColor: '#F8F6F1',
                      fontSize: '0.88rem',
                      color: '#121316',
                      outline: 'none',
                      fontFamily: 'var(--font-body)',
                      cursor: 'pointer'
                    }}
                  >
                    {INTEREST_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#121316', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Special Wishes, Party Size or Pacing
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="E.g. We are traveling as a couple celebrating our anniversary, seeking secluded pool villas and private tea estate walks..."
                    value={formData.notes}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.72rem 0.95rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(0, 0, 0, 0.12)',
                      backgroundColor: '#F8F6F1',
                      fontSize: '0.88rem',
                      color: '#121316',
                      outline: 'none',
                      fontFamily: 'var(--font-body)',
                      resize: 'vertical',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#B48235')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(0, 0, 0, 0.12)')}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-pill btn-gold"
                  style={{
                    padding: '0.85rem 1.75rem',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    width: '100%',
                    boxShadow: '0 6px 20px rgba(180, 130, 53, 0.35)',
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'wait' : 'pointer'
                  }}
                >
                  <span>{loading ? 'Transmitting Request...' : 'Request Bespoke Itinerary'}</span>
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}
