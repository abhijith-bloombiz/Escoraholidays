import React from 'react';
import { X, Calendar, MapPin, Star, ArrowRight } from 'lucide-react';
import { PLANNING_STEPS, type TravelCategoryItem } from '../data/escoraData';

export interface ItineraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  journey: TravelCategoryItem | null;
  onBookThisTour?: (journey: TravelCategoryItem) => void;
}

export default function ItineraryModal({ isOpen, onClose, journey, onBookThisTour }: ItineraryModalProps) {
  if (!isOpen || !journey) return null;

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
          maxWidth: '780px',
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
        {/* Close Button */}
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
            zIndex: 10
          }}
          aria-label="Close modal"
        >
          <X size={20} color="#121316" />
        </button>

        {/* Hero image banner */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '240px',
            borderRadius: '20px',
            overflow: 'hidden',
            marginBottom: '1.75rem'
          }}
        >
          <img
            src={journey.image}
            alt={journey.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '1.5rem',
              color: '#FFFFFF'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <span
                style={{
                  backgroundColor: '#B48235',
                  color: '#FFFFFF',
                  borderRadius: '6px',
                  padding: '0.15rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                TOUR {journey.num}
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{journey.dest}</span>
            </div>
            <h2 className="font-display" style={{ fontSize: '2rem', letterSpacing: '0.03em', lineHeight: 1.1 }}>
              {journey.title}
            </h2>
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            backgroundColor: '#F8F6F1',
            borderRadius: '16px',
            padding: '1rem 1.5rem',
            marginBottom: '2rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.875rem', color: '#4B5563' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={15} color="#B48235" /> <strong>{journey.days}</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={15} color="#B48235" /> <strong>{journey.destinationsCount}</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Star size={15} color="#B48235" /> <strong>{journey.highlightsCount}</strong>
            </span>
          </div>

          <div>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#B48235',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                backgroundColor: 'rgba(180, 130, 53, 0.1)',
                padding: '0.45rem 1rem',
                borderRadius: '9999px',
                display: 'inline-block'
              }}
            >
              Tailor-Made Tour
            </span>
          </div>
        </div>

        {/* Journey Description */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 className="font-display" style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#121316' }}>
            OVERVIEW
          </h3>
          <p style={{ fontSize: '0.95rem', color: '#6B7280', lineHeight: 1.6 }}>
            {journey.desc} Each detail is customized specifically to your travel tempo, including private chauffeured AC vehicle, handpicked boutique heritage stays, and dedicated 24/7 on-ground concierge support.
          </p>
        </div>

        {/* Day-by-Day Plan */}
        {journey.itinerary && journey.itinerary.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 className="font-display" style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#121316' }}>
              SAMPLE DAY-BY-DAY CURATION
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {journey.itinerary.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#FAF9F6',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: '14px',
                    padding: '1rem 1.25rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B48235', textTransform: 'uppercase' }}>
                      {item.day}
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#121316' }}>
                      {item.title}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#6B7280', lineHeight: 1.5 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* The 6 Journey Planning Steps */}
        <div style={{ backgroundColor: '#F8F6F1', borderRadius: '18px', padding: '1.5rem', marginBottom: '2rem' }}>
          <h4 className="font-display" style={{ fontSize: '1.1rem', color: '#121316', marginBottom: '0.75rem' }}>
            FROM YOUR IDEA TO KERALA — 6 BESPOKE STEPS
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {PLANNING_STEPS.map((s) => (
              <div key={s.step} style={{ fontSize: '0.78rem' }}>
                <span style={{ fontWeight: 700, color: '#B48235' }}>{s.step}. {s.title}</span>
                <p style={{ color: '#6B7280', marginTop: '0.15rem', lineHeight: 1.35 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            onClick={onClose}
            className="btn-pill btn-outline"
            style={{ padding: '0.75rem 1.5rem' }}
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              if (onBookThisTour) onBookThisTour(journey);
            }}
            className="btn-pill btn-gold"
            style={{
              padding: '0.75rem 2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>Customise & Book This Tour</span>
            <ArrowRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}
