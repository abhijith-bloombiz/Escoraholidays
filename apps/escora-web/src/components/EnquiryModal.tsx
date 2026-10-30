import React, { useState } from 'react';
import { X, Compass, CheckCircle2, Clock } from 'lucide-react';
import { PLANNING_STEPS } from '../data/escoraData';

export interface EnquiryInitialData {
  destination?: string;
  experience?: string;
  duration?: string;
  travellers?: string;
  interest?: string;
  [key: string]: any;
}

export interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: EnquiryInitialData;
  onShowToast?: (msg: string) => void;
}

export default function EnquiryModal({ isOpen, onClose, initialData = {}, onShowToast }: EnquiryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    destination: initialData.destination || 'Munnar & Alleppey',
    experienceType: initialData.experience || 'Backwaters & Houseboat',
    duration: initialData.duration || '8-10 Days',
    travellers: initialData.travellers || '2 Travellers',
    travelMonth: 'Upcoming Months (Nov - Mar)',
    specialRequests: ''
  });

  const [submitted, setSubmitted] = useState<boolean>(false);
  const [activeStepTab, setActiveStepTab] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      alert('Please fill out your name, email, and contact number.');
      return;
    }
    try {
      await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          destinations: formData.destination,
          travelStyle: formData.experienceType,
          travelDate: formData.travelMonth,
          specialRequests: `Duration: ${formData.duration}. Travellers: ${formData.travellers}. ${formData.specialRequests || ''}`.trim(),
          source: 'website_modal'
        })
      });
    } catch (err) {
      console.warn('Enquiry submission network note:', err);
    }
    setSubmitted(true);
    if (onShowToast) {
      onShowToast('Your bespoke enquiry has been received! A Kerala curator will reach out within 24 hours.');
    }
  };

  return (
    <div
      data-lenis-prevent
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        backgroundColor: 'rgba(13, 15, 19, 0.8)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        data-lenis-prevent
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '28px',
          maxWidth: '720px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          padding: 'clamp(2rem, 3.5vw, 3rem)',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(0, 0, 0, 0.08)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#F3F4F6',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s ease'
          }}
          aria-label="Close modal"
        >
          <X size={20} color="#121316" />
        </button>

        {!submitted ? (
          <div>
            <div style={{ marginBottom: '1.75rem' }}>
              <span
                style={{
                  fontSize: '0.8rem',
                  letterSpacing: '0.15em',
                  color: '#B48235',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  marginBottom: '0.35rem'
                }}
              >
                <Compass size={14} /> Start with a blank canvas
              </span>
              <h2
                className="font-display"
                style={{
                  fontSize: '2.2rem',
                  color: '#121316',
                  letterSpacing: '0.03em',
                  lineHeight: 1.1
                }}
              >
                PLAN YOUR BESPOKE KERALA JOURNEY
              </h2>
              <p style={{ fontSize: '0.925rem', color: '#6B7280', marginTop: '0.4rem', lineHeight: 1.5 }}>
                Share your travel vision. Our Kerala curators will handcraft a personalized itinerary with luxury boutique stays, private houseboats, and chauffeured transit.
              </p>
            </div>

            {/* Toggle to view 6 planning steps */}
            <div style={{ marginBottom: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setActiveStepTab(!activeStepTab)}
                style={{
                  background: '#F8F6F1',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: '12px',
                  padding: '0.6rem 1rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#121316',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <span>{activeStepTab ? 'Hide How It Works' : 'View the 6 Journey-Planning Steps'}</span>
                <span>{activeStepTab ? '▲' : '▼'}</span>
              </button>

              {activeStepTab && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.75rem',
                    backgroundColor: '#F8F6F1',
                    padding: '1.25rem',
                    borderRadius: '16px',
                    marginTop: '0.75rem'
                  }}
                >
                  {PLANNING_STEPS.map((st) => (
                    <div key={st.step} style={{ fontSize: '0.78rem' }}>
                      <div style={{ fontWeight: 700, color: '#B48235', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span>{st.step}.</span> {st.title}
                      </div>
                      <p style={{ color: '#6B7280', marginTop: '0.2rem', lineHeight: 1.35 }}>{st.desc}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Row 1: Name & Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="modal-two-col">
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#121316', marginBottom: '0.35rem' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Eleanor Vance"
                    value={formData.name}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      border: '1px solid #D1D5DB',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#121316', marginBottom: '0.35rem' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="eleanor@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      border: '1px solid #D1D5DB',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Row 2: Phone/WhatsApp & Destination */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="modal-two-col">
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#121316', marginBottom: '0.35rem' }}>
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="+44 7911 123456"
                    value={formData.phone}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      border: '1px solid #D1D5DB',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#121316', marginBottom: '0.35rem' }}>
                    Preferred Destination
                  </label>
                  <select
                    name="destination"
                    value={formData.destination}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      border: '1px solid #D1D5DB',
                      fontSize: '0.9rem',
                      outline: 'none',
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    <option value="Munnar & Alleppey">Munnar & Alleppey</option>
                    <option value="Wayanad Rainforest">Wayanad Rainforest</option>
                    <option value="Varkala & Marari Shores">Varkala & Marari Shores</option>
                    <option value="Periyar Wildlife Sanctuary">Periyar Wildlife Sanctuary</option>
                    <option value="Fort Kochi Colonial Heritage">Fort Kochi Colonial Heritage</option>
                    <option value="All Kerala Grand Odyssey">All Kerala Grand Odyssey</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Experience Type & Travellers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="modal-two-col">
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#121316', marginBottom: '0.35rem' }}>
                    Experience & Wellness
                  </label>
                  <select
                    name="experienceType"
                    value={formData.experienceType}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      border: '1px solid #D1D5DB',
                      fontSize: '0.9rem',
                      outline: 'none',
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    <option value="Backwaters & Houseboat">Backwaters & Houseboat</option>
                    <option value="Ayurveda & Panchakarma Healing">Ayurveda & Panchakarma Healing</option>
                    <option value="Yoga, Meditation & Healthcare">Yoga, Meditation & Healthcare</option>
                    <option value="Misty Hill Station & Tea Estates">Misty Hill Station & Tea Estates</option>
                    <option value="Kalaripayattu & Temple Culture">Kalaripayattu & Temple Culture</option>
                    <option value="Romantic Luxury Honeymoon">Romantic Luxury Honeymoon</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#121316', marginBottom: '0.35rem' }}>
                    Number of Travellers
                  </label>
                  <select
                    name="travellers"
                    value={formData.travellers}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      border: '1px solid #D1D5DB',
                      fontSize: '0.9rem',
                      outline: 'none',
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    <option value="1 Traveller (Solo)">1 Traveller (Solo)</option>
                    <option value="2 Travellers (Couple)">2 Travellers (Couple)</option>
                    <option value="3-5 Travellers (Family)">3-5 Travellers (Family)</option>
                    <option value="6+ Travellers (Group)">6+ Travellers (Group)</option>
                  </select>
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#121316', marginBottom: '0.35rem' }}>
                  Wishes, Dietary Preferences or Notes
                </label>
                <textarea
                  name="specialRequests"
                  rows={3}
                  placeholder="Tell us what you love (e.g., quiet nature, Ayurvedic treatments, private balcony with tea view, private boat master)..."
                  value={formData.specialRequests}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid #D1D5DB',
                    fontSize: '0.9rem',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>

              {/* Notice */}
              <div style={{ fontSize: '0.78rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={13} color="#B48235" />
                <span>Our Kerala travel curator will respond with a bespoke proposal within 24 hours. No obligation.</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-pill btn-gold"
                style={{
                  width: '100%',
                  padding: '0.95rem',
                  fontSize: '0.95rem',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  marginTop: '0.5rem'
                }}
              >
                Send Journey Enquiry
              </button>

            </form>
          </div>
        ) : (
          /* Submission Confirmation View */
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}
            >
              <CheckCircle2 size={36} color="#10B981" />
            </div>

            <h3
              className="font-display"
              style={{
                fontSize: '2rem',
                color: '#121316',
                letterSpacing: '0.03em',
                marginBottom: '0.75rem'
              }}
            >
              ENQUIRY RECEIVED!
            </h3>

            <p style={{ fontSize: '1rem', color: '#6B7280', maxWidth: '480px', margin: '0 auto 1.75rem', lineHeight: 1.6 }}>
              Thank you, <strong>{formData.name}</strong>. Your Kerala journey concept has been handed to our local travel curator.
            </p>

            <div
              style={{
                backgroundColor: '#F8F6F1',
                borderRadius: '16px',
                padding: '1.25rem',
                maxWidth: '440px',
                margin: '0 auto 2rem',
                textAlign: 'left',
                fontSize: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                color: '#4B5563'
              }}
            >
              <div><strong>Destination:</strong> {formData.destination}</div>
              <div><strong>Experience:</strong> {formData.experienceType}</div>
              <div><strong>Travellers:</strong> {formData.travellers}</div>
              <div><strong>Contact:</strong> {formData.email} • {formData.phone}</div>
            </div>

            <button
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="btn-pill btn-black"
              style={{ padding: '0.75rem 2rem' }}
            >
              Done
            </button>
          </div>
        )}

      </div>

      <style>{`
        @media (max-width: 600px) {
          .modal-two-col {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
