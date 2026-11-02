import React from 'react';
import { PREMIUM_PARTNERS } from '../data/escoraData';

interface PremiumPartnersSectionProps {
  onOpenEnquiry?: (partnerName: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function PremiumPartnersSection({
  className = '',
  style
}: PremiumPartnersSectionProps) {
  return (
    <section
      id="premium-partners"
      className={`premium-partners-section ${className}`}
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
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
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
            Curated Alliances
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
            Our Premium Partners
          </h2>
        </div>

        {/* Clean Partner Display (White Card on Warm Cream Section, No Border, No Hover) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '2.5rem'
          }}
        >
          {PREMIUM_PARTNERS.map((partner, idx) => (
            <div
              key={partner.id}
              className={`reveal-card stagger-${idx + 2}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem 3.5rem',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: 'none',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                minWidth: '260px',
                maxWidth: '360px',
                cursor: 'default'
              }}
            >
              <img
                src="/images/tulah-logo-dark.png"
                alt="tulåh"
                style={{
                  height: '46px',
                  width: 'auto',
                  maxWidth: '180px',
                  objectFit: 'contain',
                  display: 'block'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 300,
                  color: '#4B5563',
                  marginTop: '0.75rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  fontFamily: 'var(--font-body)'
                }}
              >
                {partner.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
