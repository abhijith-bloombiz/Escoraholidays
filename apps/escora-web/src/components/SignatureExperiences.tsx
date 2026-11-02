import React, { useState } from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollAnimation';

export interface ExperienceItem {
  id: string;
  tag: string;
  duration: string;
  title: string;
  location: string;
  desc: string;
  image: string;
  video?: string;
  detail: string;
}

const EXPERIENCES: ExperienceItem[] = [
  {
    id: "exp-1",
    tag: "Exclusive Charter",
    duration: "4 Hours",
    title: "Private Chef Twilight Cruise",
    location: "Alleppey Waters",
    desc: "Drift along silent palm-fringed lagoons aboard a handcrafted Kettuvallam with your personal chef preparing fresh Malabar seafood on starlit decks.",
    image: "/images/exp_houseboat.jpg",
    video: "/Experience-section/12881094-hd_1920_1080_30fps.mp4",
    detail: "Includes exclusive wooden vessel charter, 3-course customized menu, and twilight flute accompaniment."
  },
  {
    id: "exp-2",
    tag: "Estate Seclusion",
    duration: "Overnight Sanctuary",
    title: "Secluded Lakefront Pool Villas",
    location: "Kumarakom Sanctuary",
    desc: "Wake to tranquil Vembanad waters, dawn canoe excursions through lotus-filled tributaries, and private plunge pool seclusion in coconut groves.",
    image: "/images/exp_pool_villa.jpg",
    detail: "Heritage architecture, private open-to-sky shower, and dedicated lakeside butler."
  },
  {
    id: "exp-3",
    tag: "Private Planter",
    duration: "Dawn // 3 Hours",
    title: "Dawn Tea Cupping with a Planter",
    location: "Munnar Highlands",
    desc: "Walk high-range tea slopes at first light with a 3rd-generation estate planter, followed by private single-origin cuppings in a 150-year-old colonial bungalow.",
    image: "/images/exp_tea_bungalow.jpg",
    detail: "Handpick tender tea leaves, explore vintage rolling factory, and taste rare artisanal white teas."
  },
  {
    id: "exp-4",
    tag: "Tribal Trackers",
    duration: "Full Day Wilderness",
    title: "Periyar Bamboo River Rafting",
    location: "Periyar Reserve",
    desc: "Glide silently across misty reserve waters at dawn with indigenous tribal trackers, encountering wild elephant herds and rare hornbills along the forest edge.",
    image: "/images/dest_4_rafting.jpg",
    detail: "Non-motorized eco-rafting, armed forest naturalist, and breakfast on remote islands."
  },
  {
    id: "exp-5",
    tag: "Canopy Architecture",
    duration: "Overnight Stay",
    title: "Rainforest Canopy Treehouses",
    location: "Wayanad Rainforest",
    desc: "Private eco-luxury treehouse sanctuaries nestled 60 feet above ancient rainforest floors, guided night walks for bioluminescent flora, and secret waterfalls.",
    image: "/images/exp_treehouse.jpg",
    detail: "Architect-designed sustainably harvested bamboo suites with suspension bridge access."
  },
  {
    id: "exp-6",
    tag: "Living Arts",
    duration: "Evening Masterclass",
    title: "Kathakali Greenroom & Sacred Arts",
    location: "Thrissur Cultural Quarters",
    desc: "Private front-row access to the mesmerizing 3-hour sacred makeup transformation, classical percussion masterclasses, and royal Travancore culinary feasts.",
    image: "/images/exp_kathakali.jpg",
    detail: "Exclusive discussion with the master artiste, sacred natural pigment demonstration, and seated sadhya."
  }
];

export interface SignatureExperiencesProps {
  onOpenEnquiry?: (data?: Record<string, any>) => void;
}

export default function SignatureExperiences({ onOpenEnquiry }: SignatureExperiencesProps) {
  const [sectionRef, isVisible] = useScrollReveal<HTMLElement>({ threshold: 0.1, reEnter: true });
  const [activeExpIdx, setActiveExpIdx] = useState<number>(0);

  const activeExp = EXPERIENCES[activeExpIdx];

  const handleEnquire = (exp: ExperienceItem) => {
    if (onOpenEnquiry) {
      onOpenEnquiry({
        experience: exp.title,
        destination: exp.location,
        interest: `Signature Experience: ${exp.title}`
      });
    }
  };

  return (
    <section
      id="experiences"
      ref={sectionRef}
      style={{
        backgroundColor: '#0B1410',
        color: '#FFFFFF',
        padding: '3.5rem 0 7.5rem',
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)'
      }}
    >
      {/* Subtle Ambient Glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(30, 77, 58, 0.35) 0%, rgba(11, 20, 16, 0) 70%)',
          pointerEvents: 'none'
        }}
      />

      <div className="section-wrapper" style={{ position: 'relative', zIndex: 2 }}>

        {/* Armenia Travel Style Asymmetric Editorial Spread */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 1fr) minmax(360px, 1.25fr) minmax(280px, 1fr)',
            gap: 'clamp(1.5rem, 3vw, 2.5rem)',
            alignItems: 'center',
            marginBottom: '4.5rem',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(28px)',
            transition: 'opacity 0.8s var(--ease-luxury) 0.15s, transform 0.8s var(--ease-luxury) 0.15s'
          }}
          className="signature-asymmetric-grid"
        >
          {/* Left Angled Scenic Visual (Periyar Rafting / Highland Wilderness) */}
          <div
            style={{
              borderRadius: '20px',
              overflow: 'hidden',
              height: '420px',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'relative',
              transform: 'rotate(-2deg)',
              transition: 'box-shadow 0.4s ease',
              willChange: 'box-shadow'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 28px 60px rgba(0, 0, 0, 0.55)';
              const video = e.currentTarget.querySelector('video');
              if (video) video.style.transform = 'scale(1.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 20px 45px rgba(0, 0, 0, 0.4)';
              const video = e.currentTarget.querySelector('video');
              if (video) video.style.transform = 'scale(1)';
            }}
          >
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              disablePictureInPicture
              disableRemotePlayback
              controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
              data-video-popout="false"
              tabIndex={-1}
              aria-hidden="true"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                pointerEvents: 'none',
                transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
                willChange: 'transform'
              }}
            >
              <source src="/Experience-section/12881094-hd_1920_1080_30fps.mp4" type="video/mp4" />
            </video>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%)'
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '1.5rem',
                left: '1.5rem',
                right: '1.5rem',
                color: '#FFFFFF'
              }}
            >
              <span
                style={{
                  fontSize: '0.72rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#D4AF37',
                  fontWeight: 700
                }}
              >
                PERIYAR RESERVE
              </span>
              <h4 style={{ fontSize: '1.15rem', margin: '0.25rem 0 0', fontWeight: 600 }}>
                Dawn Bamboo River Rafting
              </h4>
            </div>
          </div>

          {/* Center Feature: Deep Emerald Editorial Statement Box (Armenia Travel Signature Box) */}
          <div
            style={{
              backgroundColor: '#143125',
              padding: 'clamp(2rem, 3.5vw, 3.2rem)',
              borderRadius: '24px',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              position: 'relative',
              zIndex: 3
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
              }}
            >
              <span
                style={{
                  fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
                  fontSize: '0.75rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: '#D4AF37',
                  fontWeight: 700
                }}
              >
                THE ESCORA PRIVILEGE
              </span>
              <span
                style={{
                  fontSize: '0.78rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Clock size={14} /> {activeExp.duration}
              </span>
            </div>

            <h3
              className="font-display"
              style={{
                fontSize: 'clamp(1.75rem, 2.5vw, 2.2rem)',
                lineHeight: 1.15,
                color: '#FFFFFF',
                margin: 0
              }}
            >
              {activeExp.title}
            </h3>

            <p
              style={{
                fontSize: '0.94rem',
                color: 'rgba(255, 255, 255, 0.85)',
                lineHeight: 1.6,
                margin: 0
              }}
            >
              {activeExp.desc}
            </p>

            <div
              style={{
                padding: '0.9rem 1.1rem',
                borderRadius: '12px',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '0.82rem',
                color: 'rgba(255, 255, 255, 0.75)',
                lineHeight: 1.45
              }}
            >
              <strong style={{ color: '#D4AF37' }}>Bespoke Inclusion:</strong> {activeExp.detail}
            </div>

            <button
              onClick={() => handleEnquire(activeExp)}
              style={{
                marginTop: '0.5rem',
                padding: '0.95rem 1.8rem',
                borderRadius: '999px',
                backgroundColor: '#D4AF37',
                color: '#0E1412',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 24px rgba(212, 175, 55, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#D4AF37';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Curate This Experience <ArrowRight size={17} />
            </button>
          </div>

          {/* Right Angled Portrait Visual (Kathakali Master / Pool Villa) */}
          <div
            style={{
              borderRadius: '20px',
              overflow: 'hidden',
              height: '420px',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'relative',
              transform: 'rotate(2deg)',
              transition: 'box-shadow 0.4s ease',
              willChange: 'box-shadow'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 28px 60px rgba(0, 0, 0, 0.55)';
              const img = e.currentTarget.querySelector('img');
              if (img) img.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 20px 45px rgba(0, 0, 0, 0.4)';
              const img = e.currentTarget.querySelector('img');
              if (img) img.style.transform = 'scale(1)';
            }}
          >
            <img
              src="/images/exp_kathakali.jpg"
              alt="Sacred Kathakali Master"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                pointerEvents: 'none',
                transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
                willChange: 'transform'
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%)'
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '1.5rem',
                left: '1.5rem',
                right: '1.5rem',
                color: '#FFFFFF'
              }}
            >
              <span
                style={{
                  fontSize: '0.72rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#D4AF37',
                  fontWeight: 700
                }}
              >
                SACRED HERITAGE
              </span>
              <h4 style={{ fontSize: '1.15rem', margin: '0.25rem 0 0', fontWeight: 600 }}>
                Kathakali Greenroom Access
              </h4>
            </div>
          </div>
        </div>

        {/* Interactive Experience Navigator Selector Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s var(--ease-luxury) 0.3s, transform 0.8s var(--ease-luxury) 0.3s'
          }}
        >
          {EXPERIENCES.map((exp, idx) => {
            const isActive = idx === activeExpIdx;
            return (
              <button
                key={exp.id}
                onClick={() => setActiveExpIdx(idx)}
                style={{
                  padding: '1.1rem 1rem',
                  borderRadius: '14px',
                  backgroundColor: isActive ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  border: isActive ? '1px solid rgba(212, 175, 55, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  }
                }}
              >
                <span
                  style={{
                    fontSize: '0.68rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: isActive ? '#D4AF37' : 'rgba(255, 255, 255, 0.5)',
                    fontWeight: 700
                  }}
                >
                  0{idx + 1} • {exp.location.split(' ')[0]}
                </span>
                <span
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)',
                    lineHeight: 1.3
                  }}
                >
                  {exp.title}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
}
