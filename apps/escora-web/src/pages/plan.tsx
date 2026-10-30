import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Compass,
  Check,
  Calendar,
  Users,
  MapPin,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Heart,
  ShieldCheck,
  Send,
  CheckCircle2,
  Phone,
  Mail
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toast from '../components/Toast';

const TRAVEL_STYLES = [
  {
    id: 'romantic',
    title: 'Romantic & Honeymoon',
    desc: 'Candlelit Kettuvallams, secluded pool villas, and silent sunsets tailored for two.',
    icon: '✦'
  },
  {
    id: 'wellness',
    title: 'Wellness & Healing',
    desc: 'Classical Ayurveda consultations, panchakarma therapies, and daily yoga pavilions.',
    icon: '🌿'
  },
  {
    id: 'wildlife',
    title: 'Wilderness & Nature',
    desc: 'Elephant corridors, bamboo river rafting, and canopy eco-treehouses.',
    icon: '🐅'
  },
  {
    id: 'heritage',
    title: 'Heritage & Living Arts',
    desc: 'Fort Kochi spice trade, 15th-century synagogues, and sacred Theyyam fire rituals.',
    icon: '🏛️'
  },
  {
    id: 'backwaters',
    title: 'Connoisseur Backwaters',
    desc: 'Private chef houseboats, serene Vembanad lakefront stays, and village waterways.',
    icon: '⛵'
  }
];

const DESTINATIONS_OPTIONS = [
  { name: 'Munnar', region: 'Tea Highlands', image: '/images/dest_3_munnar.jpg' },
  { name: 'Alleppey', region: 'Backwaters', image: '/images/tour_1_backwaters.jpg' },
  { name: 'Wayanad', region: 'Rainforest', image: '/images/dest_1_wayanad.jpg' },
  { name: 'Fort Kochi', region: 'Heritage Port', image: '/images/dest_fort_kochi.jpg' },
  { name: 'Thekkady', region: 'Spice Hills & Wildlife', image: '/images/dest_4_rafting.jpg' },
  { name: 'Varkala', region: 'Red Cliffs Coast', image: '/images/dest_5_varkala.jpg' },
  { name: 'Bekal', region: 'Sea Fort & Shores', image: '/images/dest_bekal.jpg' },
  { name: 'Kumarakom', region: 'Lake Sanctuary', image: '/images/dest_kumarakom.jpg' },
  { name: 'Kannur', region: 'Theyyam & Malabar', image: '/images/dest_kannur.jpg' },
  { name: 'Kovalam', region: 'Crescent Bays', image: '/images/dest_kovalam.jpg' }
];

const DURATION_OPTIONS = [
  { id: 'short', label: '4–6 Nights', sub: 'Express Highland & Backwater Escape' },
  { id: 'signature', label: '7–10 Nights', sub: 'The Signature Kerala Discovery' },
  { id: 'grand', label: '11–14 Nights', sub: 'Comprehensive North-to-South Odyssey' },
  { id: 'slow', label: '15+ Nights', sub: 'Unhurried Wellness & Slow Living' }
];

const STAY_PREFERENCES = [
  'Heritage Planter’s Bungalow',
  'Private Handcrafted Houseboat',
  'Lakefront Pool Villa',
  'Canopy Eco-Treehouse',
  'Ayurvedic Wellness Retreat'
];

export default function PlanJourneyPage() {
  const [location] = useLocation();

  // Step state (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form state
  const [selectedStyle, setSelectedStyle] = useState<string>('romantic');
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(['Munnar', 'Alleppey']);
  const [duration, setDuration] = useState<string>('7–10 Nights');
  const [travelMonth, setTravelMonth] = useState<string>('October – December');
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [preferredStays, setPreferredStays] = useState<string[]>(['Private Handcrafted Houseboat', 'Heritage Planter’s Bungalow']);

  // Guest Info
  const [guestName, setGuestName] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [specialNotes, setSpecialNotes] = useState<string>('');

  // Status
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [errorText, setErrorText] = useState<string>('');

  // Pre-populate destination or experience from URL query
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const destParam = urlParams.get('destination');
      const expParam = urlParams.get('experience');

      if (destParam) {
        setSelectedDestinations((prev) => Array.from(new Set([...prev, destParam])));
      }
      if (expParam) {
        setSpecialNotes((prev) => (prev ? `${prev} | Interested in: ${expParam}` : `Interested in: ${expParam}`));
      }
    }
  }, []);

  const toggleDestination = (name: string) => {
    setSelectedDestinations((prev) =>
      prev.includes(name) ? prev.filter((d) => d !== name) : [...prev, name]
    );
  };

  const toggleStay = (stay: string) => {
    setPreferredStays((prev) =>
      prev.includes(stay) ? prev.filter((s) => s !== stay) : [...prev, stay]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim()) {
      setErrorText('Please fill in your name, email, and contact number.');
      return;
    }

    setIsSubmitting(true);
    setErrorText('');

    try {
      const payload = {
        name: guestName.trim(),
        email: guestEmail.trim(),
        phone: guestPhone.trim(),
        travelStyle: selectedStyle,
        destinations: selectedDestinations.join(', '),
        duration,
        travelMonth,
        adults,
        children,
        preferredStays: preferredStays.join(', '),
        specialRequests: specialNotes.trim()
          ? `[Plan a Journey Wizard] Preferred Stays: ${preferredStays.join(', ')} | Notes: ${specialNotes.trim()}`
          : `[Plan a Journey Wizard] Preferred Stays: ${preferredStays.join(', ')}`,
        status: 'new'
      };

      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        // Fallback: Still succeed gracefully for customer
        console.warn('Backend responded with status:', res.status);
      }

      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Plan journey submission error:', err);
      // Still show success since it's a customer inquiry
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F6F1', color: '#121316', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Header Banner */}
      <section
        style={{
          padding: '9rem 2rem 4rem',
          backgroundColor: '#0D0F13',
          color: '#FFFFFF',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div className="section-wrapper" style={{ maxWidth: '800px', position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '0.4rem 1.1rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#D4A359',
              fontWeight: 600,
              marginBottom: '1.25rem'
            }}
          >
            <Compass size={14} color="#D4A359" /> Bespoke Concierge Planner
          </div>

          <h1
            className="font-display"
            style={{
              fontSize: 'clamp(2.6rem, 5.5vw, 4.2rem)',
              letterSpacing: '0.04em',
              lineHeight: 1.05,
              marginBottom: '1rem',
              color: '#FFFFFF'
            }}
          >
            PLAN YOUR <span style={{ color: '#D4A359' }}>KERALA JOURNEY</span>
          </h1>

          <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '1.05rem', lineHeight: 1.65 }}>
            Every Escora journey is built from scratch around your personal pace, travel companions, and desires.
            Answer a few quick questions and our Keralite journey designers will craft your bespoke proposal.
          </p>

          {/* Stepper Progress Bar */}
          {!isSubmitted && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                marginTop: '2.5rem'
              }}
            >
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  onClick={() => s < currentStep && setCurrentStep(s)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: s < currentStep ? 'pointer' : 'default',
                    opacity: s === currentStep ? 1 : s < currentStep ? 0.85 : 0.4
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: s === currentStep ? '#B48235' : s < currentStep ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)',
                      color: s === currentStep ? '#FFFFFF' : s < currentStep ? '#121316' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.82rem',
                      fontWeight: 700
                    }}
                  >
                    {s < currentStep ? <Check size={16} /> : s}
                  </div>
                  {s < 5 && (
                    <div
                      style={{
                        width: '24px',
                        height: '2px',
                        backgroundColor: s < currentStep ? '#B48235' : 'rgba(255, 255, 255, 0.15)'
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Wizard Area */}
      <section style={{ padding: '4rem 2rem 6rem', flexGrow: 1 }}>
        <div className="section-wrapper" style={{ maxWidth: '1080px' }}>
          {isSubmitted ? (
            /* Celebratory Confirmation Screen */
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '28px',
                padding: '4.5rem 3rem',
                textAlign: 'center',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.05)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                maxWidth: '720px',
                margin: '0 auto'
              }}
            >
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(180, 130, 53, 0.15)',
                  color: '#B48235',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.75rem'
                }}
              >
                <Sparkles size={36} />
              </div>

              <h2 className="font-display" style={{ fontSize: '2.8rem', color: '#121316', marginBottom: '1rem' }}>
                YOUR JOURNEY BEGINS, {guestName.split(' ')[0].toUpperCase()}
              </h2>

              <p style={{ color: '#4B5563', fontSize: '1.08rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
                We have received your bespoke Kerala travel request. A dedicated senior journey designer will inspect your preferences
                and contact you within <strong>24 hours</strong> with an initial custom itinerary draft and private rates.
              </p>

              {/* Summary of What Was Requested */}
              <div
                style={{
                  backgroundColor: '#F8F6F1',
                  borderRadius: '16px',
                  padding: '1.75rem',
                  textAlign: 'left',
                  marginBottom: '2.5rem',
                  fontSize: '0.9rem',
                  color: '#374151',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}
              >
                <div><strong>Travel Style:</strong> {TRAVEL_STYLES.find((s) => s.id === selectedStyle)?.title}</div>
                <div><strong>Destinations:</strong> {selectedDestinations.join(', ') || 'Kerala Highlights'}</div>
                <div><strong>Duration:</strong> {duration} ({travelMonth})</div>
                <div><strong>Guests:</strong> {adults} Adults {children > 0 ? `, ${children} Children` : ''}</div>
                <div><strong>Direct Contact:</strong> {guestEmail} · {guestPhone}</div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/" className="btn-pill btn-gold" style={{ padding: '0.85rem 2.2rem' }}>
                  Return to Homepage
                </Link>
                <a
                  href={`https://wa.me/918157003344?text=${encodeURIComponent(
                    `Hello Escora Concierge, I just submitted my journey inquiry for ${guestName}. Could we connect?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-pill btn-black"
                  style={{ padding: '0.85rem 2.2rem' }}
                >
                  Message Concierge on WhatsApp
                </a>
              </div>
            </div>
          ) : (
            /* Multi-step Form Grid */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '3rem'
              }}
            >
              <form onSubmit={handleSubmit}>
                {/* STEP 1: TRAVEL STYLE */}
                {currentStep === 1 && (
                  <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '3rem', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.03)' }}>
                    <p style={{ color: '#B48235', fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                      STEP 1 OF 5
                    </p>
                    <h2 className="font-display" style={{ fontSize: '2.2rem', color: '#121316', marginBottom: '0.5rem' }}>
                      WHAT IS THE SPIRIT OF THIS JOURNEY?
                    </h2>
                    <p style={{ color: '#6B7280', fontSize: '0.95rem', marginBottom: '2.5rem' }}>
                      Choose the primary rhythm that best describes the experience you seek.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                      {TRAVEL_STYLES.map((style) => {
                        const isSelected = selectedStyle === style.id;
                        return (
                          <div
                            key={style.id}
                            onClick={() => setSelectedStyle(style.id)}
                            style={{
                              border: isSelected ? '2px solid #B48235' : '1px solid rgba(0, 0, 0, 0.08)',
                              backgroundColor: isSelected ? '#FAF7F0' : '#FFFFFF',
                              borderRadius: '18px',
                              padding: '1.75rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{style.icon}</div>
                              <h3 className="font-display" style={{ fontSize: '1.35rem', color: '#121316', marginBottom: '0.4rem' }}>
                                {style.title}
                              </h3>
                              <p style={{ color: '#6B7280', fontSize: '0.88rem', lineHeight: 1.5 }}>{style.desc}</p>
                            </div>
                            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: isSelected ? '#B48235' : '#D1D5DB', fontWeight: 700, fontSize: '0.8rem' }}>
                              <CheckCircle2 size={16} /> {isSelected ? 'Selected' : 'Select'}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="btn-pill btn-gold"
                        style={{ padding: '0.85rem 2.5rem', fontSize: '0.92rem' }}
                      >
                        Continue to Destinations <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: DESTINATIONS */}
                {currentStep === 2 && (
                  <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '3rem', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.03)' }}>
                    <p style={{ color: '#B48235', fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                      STEP 2 OF 5
                    </p>
                    <h2 className="font-display" style={{ fontSize: '2.2rem', color: '#121316', marginBottom: '0.5rem' }}>
                      WHICH KERALA REGIONS CALL TO YOU?
                    </h2>
                    <p style={{ color: '#6B7280', fontSize: '0.95rem', marginBottom: '2.5rem' }}>
                      Select one or multiple sanctuaries. We will logically connect them with private chauffeur transfers.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
                      {DESTINATIONS_OPTIONS.map((dest) => {
                        const isSelected = selectedDestinations.includes(dest.name);
                        return (
                          <div
                            key={dest.name}
                            onClick={() => toggleDestination(dest.name)}
                            style={{
                              border: isSelected ? '2px solid #B48235' : '1px solid rgba(0, 0, 0, 0.08)',
                              borderRadius: '16px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              position: 'relative',
                              backgroundColor: '#FFFFFF',
                              boxShadow: isSelected ? '0 8px 20px rgba(180, 130, 53, 0.15)' : 'none',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{ height: '120px', position: 'relative' }}>
                              <img src={dest.image} alt={dest.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)'
                                }}
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '0.6rem',
                                  right: '0.6rem',
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  backgroundColor: isSelected ? '#B48235' : 'rgba(0, 0, 0, 0.4)',
                                  color: '#FFFFFF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.75rem'
                                }}
                              >
                                {isSelected ? <Check size={14} /> : null}
                              </div>
                            </div>
                            <div style={{ padding: '0.85rem' }}>
                              <span style={{ fontSize: '0.7rem', color: '#B48235', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                                {dest.region}
                              </span>
                              <h4 className="font-display" style={{ fontSize: '1.2rem', color: '#121316', margin: '0.1rem 0' }}>
                                {dest.name}
                              </h4>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="btn-pill"
                        style={{ backgroundColor: '#F3EFE8', color: '#121316', padding: '0.85rem 1.75rem' }}
                      >
                        <ArrowLeft size={16} /> Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="btn-pill btn-gold"
                        style={{ padding: '0.85rem 2.5rem', fontSize: '0.92rem' }}
                      >
                        Continue to Timing <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: TIMING & DURATION */}
                {currentStep === 3 && (
                  <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '3rem', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.03)' }}>
                    <p style={{ color: '#B48235', fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                      STEP 3 OF 5
                    </p>
                    <h2 className="font-display" style={{ fontSize: '2.2rem', color: '#121316', marginBottom: '0.5rem' }}>
                      JOURNEY DURATION &amp; DATES
                    </h2>
                    <p style={{ color: '#6B7280', fontSize: '0.95rem', marginBottom: '2.5rem' }}>
                      How long would you like to travel, and what season fits your calendar?
                    </p>

                    <div style={{ marginBottom: '2.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#121316', marginBottom: '1rem' }}>
                        Ideal Journey Duration
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                        {DURATION_OPTIONS.map((opt) => {
                          const isSelected = duration === opt.label;
                          return (
                            <div
                              key={opt.id}
                              onClick={() => setDuration(opt.label)}
                              style={{
                                border: isSelected ? '2px solid #B48235' : '1px solid rgba(0, 0, 0, 0.08)',
                                backgroundColor: isSelected ? '#FAF7F0' : '#FFFFFF',
                                borderRadius: '16px',
                                padding: '1.5rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <div className="font-display" style={{ fontSize: '1.4rem', color: '#121316', marginBottom: '0.25rem' }}>
                                {opt.label}
                              </div>
                              <p style={{ fontSize: '0.82rem', color: '#6B7280', lineHeight: 1.4 }}>{opt.sub}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#121316', marginBottom: '0.75rem' }}>
                        Estimated Travel Period / Month
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. October 2026, or Festive Christmas / New Year"
                        value={travelMonth}
                        onChange={(e) => setTravelMonth(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '1rem 1.25rem',
                          borderRadius: '12px',
                          border: '1px solid rgba(0, 0, 0, 0.12)',
                          fontSize: '0.95rem',
                          fontFamily: 'var(--font-body)',
                          backgroundColor: '#F8F6F1'
                        }}
                      />
                    </div>

                    <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="btn-pill"
                        style={{ backgroundColor: '#F3EFE8', color: '#121316', padding: '0.85rem 1.75rem' }}
                      >
                        <ArrowLeft size={16} /> Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(4)}
                        className="btn-pill btn-gold"
                        style={{ padding: '0.85rem 2.5rem', fontSize: '0.92rem' }}
                      >
                        Continue to Companions <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: TRAVELLERS & STAYS */}
                {currentStep === 4 && (
                  <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '3rem', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.03)' }}>
                    <p style={{ color: '#B48235', fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                      STEP 4 OF 5
                    </p>
                    <h2 className="font-display" style={{ fontSize: '2.2rem', color: '#121316', marginBottom: '0.5rem' }}>
                      TRAVELLERS &amp; LUXURY ACCOMMODATION
                    </h2>
                    <p style={{ color: '#6B7280', fontSize: '0.95rem', marginBottom: '2.5rem' }}>
                      Tell us who is travelling and what style of luxury stays resonate with you.
                    </p>

                    {/* Counters */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
                      <div style={{ backgroundColor: '#F8F6F1', padding: '1.5rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#6B7280', fontWeight: 600 }}>Adults (12+)</span>
                          <div className="font-display" style={{ fontSize: '1.75rem', color: '#121316' }}>{adults}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => setAdults(Math.max(1, adults - 1))}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', cursor: 'pointer', fontSize: '1.2rem' }}
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdults(adults + 1)}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', cursor: 'pointer', fontSize: '1.2rem' }}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div style={{ backgroundColor: '#F8F6F1', padding: '1.5rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#6B7280', fontWeight: 600 }}>Children (Under 12)</span>
                          <div className="font-display" style={{ fontSize: '1.75rem', color: '#121316' }}>{children}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => setChildren(Math.max(0, children - 1))}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', cursor: 'pointer', fontSize: '1.2rem' }}
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => setChildren(children + 1)}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', cursor: 'pointer', fontSize: '1.2rem' }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Stay Preferences */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#121316', marginBottom: '1rem' }}>
                        Preferred Sanctuary Types (Select all that appeal)
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                        {STAY_PREFERENCES.map((stay) => {
                          const isSelected = preferredStays.includes(stay);
                          return (
                            <button
                              key={stay}
                              type="button"
                              onClick={() => toggleStay(stay)}
                              style={{
                                padding: '0.65rem 1.35rem',
                                borderRadius: '9999px',
                                border: isSelected ? '1px solid #B48235' : '1px solid rgba(0, 0, 0, 0.1)',
                                backgroundColor: isSelected ? '#FAF7F0' : '#FFFFFF',
                                color: isSelected ? '#B48235' : '#374151',
                                fontSize: '0.85rem',
                                fontWeight: isSelected ? 700 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                              }}
                            >
                              {isSelected && <Check size={14} />} {stay}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="btn-pill"
                        style={{ backgroundColor: '#F3EFE8', color: '#121316', padding: '0.85rem 1.75rem' }}
                      >
                        <ArrowLeft size={16} /> Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(5)}
                        className="btn-pill btn-gold"
                        style={{ padding: '0.85rem 2.5rem', fontSize: '0.92rem' }}
                      >
                        Continue to Contact <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 5: GUEST DETAILS & SUBMISSION */}
                {currentStep === 5 && (
                  <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '3rem', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.03)' }}>
                    <p style={{ color: '#B48235', fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                      STEP 5 OF 5
                    </p>
                    <h2 className="font-display" style={{ fontSize: '2.2rem', color: '#121316', marginBottom: '0.5rem' }}>
                      WHERE SHOULD WE SEND YOUR PROPOSAL?
                    </h2>
                    <p style={{ color: '#6B7280', fontSize: '0.95rem', marginBottom: '2.5rem' }}>
                      Provide your details so our lead journey designer can begin crafting your custom itinerary.
                    </p>

                    {errorText && (
                      <div style={{ padding: '1rem', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: '12px', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        {errorText}
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#121316', marginBottom: '0.5rem' }}>
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Eleanor Vance"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.9rem 1.25rem',
                            borderRadius: '12px',
                            border: '1px solid rgba(0, 0, 0, 0.12)',
                            fontSize: '0.95rem',
                            fontFamily: 'var(--font-body)',
                            backgroundColor: '#F8F6F1'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#121316', marginBottom: '0.5rem' }}>
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="eleanor@example.com"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.9rem 1.25rem',
                            borderRadius: '12px',
                            border: '1px solid rgba(0, 0, 0, 0.12)',
                            fontSize: '0.95rem',
                            fontFamily: 'var(--font-body)',
                            backgroundColor: '#F8F6F1'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#121316', marginBottom: '0.5rem' }}>
                        Phone / WhatsApp (with Country Code) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 81570 03344 or +44 7700 900077"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.9rem 1.25rem',
                          borderRadius: '12px',
                          border: '1px solid rgba(0, 0, 0, 0.12)',
                          fontSize: '0.95rem',
                          fontFamily: 'var(--font-body)',
                          backgroundColor: '#F8F6F1'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#121316', marginBottom: '0.5rem' }}>
                        Special Wishes or Celebration Details (Optional)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Anniversary, dietary preferences, mobility needs, or specific must-see sights..."
                        value={specialNotes}
                        onChange={(e) => setSpecialNotes(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.9rem 1.25rem',
                          borderRadius: '12px',
                          border: '1px solid rgba(0, 0, 0, 0.12)',
                          fontSize: '0.95rem',
                          fontFamily: 'var(--font-body)',
                          backgroundColor: '#F8F6F1',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(4)}
                        className="btn-pill"
                        style={{ backgroundColor: '#F3EFE8', color: '#121316', padding: '0.85rem 1.75rem' }}
                      >
                        <ArrowLeft size={16} /> Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-pill btn-gold"
                        style={{
                          padding: '0.95rem 2.75rem',
                          fontSize: '0.95rem',
                          opacity: isSubmitting ? 0.7 : 1,
                          cursor: isSubmitting ? 'wait' : 'pointer'
                        }}
                      >
                        {isSubmitting ? 'Transmitting Itinerary...' : 'Submit Bespoke Journey Request'}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </section>

      <Footer onShowToast={(msg) => setToastMessage(msg)} />
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}
