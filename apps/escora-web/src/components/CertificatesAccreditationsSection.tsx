import React from 'react';
import { CERTIFICATES_ACCREDITATIONS } from '../data/escoraData';

interface CertificatesAccreditationsSectionProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function CertificatesAccreditationsSection({
  className = '',
  style
}: CertificatesAccreditationsSectionProps) {
  return (
    <section
      id="certificates-accreditations"
      className={`certificates-accreditations-section ${className}`}
      style={{
        position: 'relative',
        backgroundColor: '#F8F6F1',
        color: '#121316',
        padding: 'clamp(4rem, 6vw, 5.5rem) 0',
        borderTop: '1px solid rgba(0, 0, 0, 0.06)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        ...style
      }}
    >
      <div className="section-wrapper">
        {/* Section Header with Scroll Reveal */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div
            className="reveal-fade-up"
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#B48235',
              marginBottom: '0.5rem'
            }}
          >
            Verified Credentials
          </div>
          <h2
            className="font-display reveal-fade-up stagger-1"
            style={{
              fontSize: 'clamp(2rem, 3.6vw, 2.75rem)',
              color: '#121316',
              lineHeight: 1.2,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              margin: 0
            }}
          >
            Certificates & Accreditations
          </h2>
        </div>

        {/* Clean Logo Display Cards (White Card on Warm Cream Section, No Border, No Hover) */}
        <div
          className="accreditations-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1.75rem',
            maxWidth: '1160px',
            margin: '0 auto',
            alignItems: 'stretch'
          }}
        >
          {CERTIFICATES_ACCREDITATIONS.map((item, idx) => (
            <div
              key={item.id}
              className={`reveal-card stagger-${idx + 1}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2.25rem 1.75rem',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: 'none',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                cursor: 'default',
                minHeight: '170px'
              }}
            >
              {/* Logo container */}
              <div
                style={{
                  height: '75px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%'
                }}
              >
                <img
                  src={item.logo}
                  alt={item.alt}
                  style={{
                    maxHeight: '65px',
                    maxWidth: '170px',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                  loading="lazy"
                />
              </div>

              {/* Thin uppercase text title below (matching Tulah's thin style) */}
              <div
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 300,
                  color: '#4B5563',
                  marginTop: '1rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  fontFamily: 'var(--font-body)',
                  lineHeight: 1.3
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 992px) {
          .accreditations-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1.5rem !important;
          }
        }
        @media (max-width: 520px) {
          .accreditations-grid {
            grid-template-columns: 1fr !important;
            gap: 1.25rem !important;
          }
        }
      `}</style>
    </section>
  );
}

