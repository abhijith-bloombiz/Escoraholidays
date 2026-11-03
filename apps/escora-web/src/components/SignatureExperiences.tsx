import React, { useRef } from 'react';
import { ArrowRight, Clock, MapPin, Sparkles, Compass } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollAnimation';
import { useListHomeExperiences, type HomeExperienceCard } from '../hooks/useHomeExperiences';

export interface SignatureExperiencesProps {
  onOpenEnquiry?: (data?: Record<string, any>) => void;
}

const FALLBACK_HOME_CARDS: HomeExperienceCard[] = [
  {
    id: 1,
    slot: 1,
    tag: "Exclusive Charter",
    duration: "Overnight Cruise",
    title: "Luxury Houseboat Experience",
    location: "Alleppey Backwaters",
    desc: "An iconic Kerala experience with private cruising, beautiful backwaters and personalised dining.",
    inclusion: "Private kettuvallam charter, bespoke chef dining, and sunset deck relaxation.",
    videoUrl: "/Experience-section/12881094-hd_1920_1080_30fps.mp4",
    posterUrl: "/images/exp_houseboat.jpg",
    experienceSlug: "luxury-houseboat-experience",
    ctaText: "Curate This Experience",
    published: true,
  },
  {
    id: 2,
    slot: 2,
    tag: "Off-Road Safari",
    duration: "Dawn Excursion",
    title: "Kolukkumalai Jeep Safari & Sunrise",
    location: "Kolukkumalai Hills",
    desc: "Thrilling off-road adventure combined with breathtaking mountain sunrise views.",
    inclusion: "4x4 rugged jeep transit, dawn summit access, and orthodox tea factory visit.",
    videoUrl: "/Experience-section/12881094-hd_1920_1080_30fps.mp4",
    posterUrl: "/images/exp_tea_bungalow.jpg",
    experienceSlug: "kolukkumalai-jeep-safari-sunrise",
    ctaText: "Curate This Experience",
    published: true,
  },
  {
    id: 3,
    slot: 3,
    tag: "Water Adventure",
    duration: "2-3 Hours",
    title: "Kayaking",
    location: "Calicut",
    desc: "An immersive water adventure that lets travellers explore Kerala's waterways up close.",
    inclusion: "Equipment, certified water guide, and mangrove waterway route navigation.",
    videoUrl: "/hero/15015065_1920_1080_60fps.mp4",
    posterUrl: "/images/destinations/calicut.jpg",
    experienceSlug: "kayaking",
    ctaText: "Curate This Experience",
    published: true,
  },
  {
    id: 4,
    slot: 4,
    tag: "Aerial Adventure",
    duration: "Tandem Flight",
    title: "Paragliding",
    location: "Varkala Beach",
    desc: "An exciting aerial experience with spectacular views of Varkala's coastline.",
    inclusion: "Certified pilot tandem flight, safety briefing, and panoramic coastal video.",
    videoUrl: "/hero/9154179-uhd_3840_2160_25fps.mp4",
    posterUrl: "/images/dest_5_varkala.jpg",
    experienceSlug: "paragliding",
    ctaText: "Curate This Experience",
    published: true,
  },
];

export default function SignatureExperiences({ onOpenEnquiry }: SignatureExperiencesProps) {
  const [sectionRef, isVisible] = useScrollReveal<HTMLElement>({ threshold: 0.08, reEnter: true });
  const { data: remoteCards } = useListHomeExperiences();

  // Pick published cards in slot order, fallback if not populated
  const displayCards = React.useMemo(() => {
    if (remoteCards && remoteCards.length > 0) {
      const live = remoteCards
        .filter((c) => c.published !== false)
        .sort((a, b) => a.slot - b.slot)
        .slice(0, 4);
      if (live.length > 0) return live;
    }
    return FALLBACK_HOME_CARDS;
  }, [remoteCards]);

  const handleEnquire = (card: HomeExperienceCard) => {
    if (onOpenEnquiry) {
      onOpenEnquiry({
        experience: card.title,
        destination: card.location,
        interest: `Signature Experience: ${card.title} (${card.location})`,
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
        padding: '5.5rem 0 7rem',
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)'
      }}
    >
      {/* Subtle Ambient Radial Glows */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '15%',
          width: '600px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(24, 61, 46, 0.35) 0%, rgba(11, 20, 16, 0) 70%)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: '650px',
          height: '450px',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, rgba(11, 20, 16, 0) 70%)',
          pointerEvents: 'none'
        }}
      />

      <div className="section-wrapper" style={{ position: 'relative', zIndex: 2 }}>
        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
            marginBottom: '3.5rem',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.8s var(--ease-luxury), transform 0.8s var(--ease-luxury)'
          }}
        >
          <div style={{ maxWidth: '640px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
                fontSize: '0.75rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: '#D4AF37',
                fontWeight: 700,
                marginBottom: '0.75rem'
              }}
            >
              <Sparkles size={13} />
              THE ESCORA PRIVILEGE
            </div>
            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(2rem, 3.2vw, 2.85rem)',
                lineHeight: 1.15,
                color: '#FFFFFF',
                margin: 0,
                fontWeight: 600,
                letterSpacing: '-0.01em'
              }}
            >
              Signature Experiences
            </h2>
            <p
              style={{
                fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
                fontSize: 'clamp(0.92rem, 1.05vw, 1.02rem)',
                color: 'rgba(255, 255, 255, 0.72)',
                lineHeight: 1.6,
                margin: '0.75rem 0 0'
              }}
            >
              Private twilight cruises, colonial estate cuppings, and untouched rainforest sanctuaries—crafted exclusively for Escora travelers.
            </p>
          </div>

          <a
            href="/experiences"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.55rem',
              padding: '0.75rem 1.4rem',
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(8px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#D4AF37';
              e.currentTarget.style.borderColor = '#D4AF37';
              e.currentTarget.style.color = '#0E1412';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
          >
            <Compass size={15} /> View All Experiences <ArrowRight size={15} />
          </a>
        </div>

        {/* 4-Card Luxury Video Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'clamp(1.25rem, 2vw, 1.75rem)',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(32px)',
            transition: 'opacity 0.85s var(--ease-luxury) 0.15s, transform 0.85s var(--ease-luxury) 0.15s'
          }}
          className="signature-4cards-grid"
        >
          {displayCards.map((card, idx) => (
            <ExperienceCardItem
              key={card.id || card.slot || idx}
              card={card}
              slotIndex={idx + 1}
              onEnquire={() => handleEnquire(card)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface CardItemProps {
  card: HomeExperienceCard;
  slotIndex: number;
  onEnquire: () => void;
}

function ExperienceCardItem({ card, slotIndex, onEnquire }: CardItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '22px',
        overflow: 'hidden',
        minHeight: 'clamp(480px, 58vh, 560px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.6rem',
        border: isHovered ? '1px solid rgba(212, 175, 55, 0.55)' : '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: isHovered
          ? '0 25px 60px rgba(0, 0, 0, 0.65), 0 0 30px rgba(212, 175, 55, 0.15)'
          : '0 18px 40px rgba(0, 0, 0, 0.45)',
        transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.45s ease, box-shadow 0.45s ease',
        backgroundColor: '#111A15',
        isolation: 'isolate'
      }}
      onMouseEnter={() => {
        setIsHovered(true);
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
      }}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
    >
      {/* Background Looping Ambient Video */}
      <video
        ref={videoRef}
        src={card.videoUrl}
        poster={card.posterUrl || undefined}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
        tabIndex={-1}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: -2,
          transform: isHovered ? 'scale(1.06)' : 'scale(1.0)',
          transition: 'transform 0.75s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: 'none'
        }}
      />

      {/* Luxury Scrim Overlays */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(11,20,16,0.35) 0%, rgba(11,20,16,0.2) 30%, rgba(11,20,16,0.85) 70%, rgba(11,20,16,0.98) 100%)',
          zIndex: -1,
          pointerEvents: 'none'
        }}
      />

      {/* Top Header Information */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
              fontSize: '0.65rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#D4AF37',
              fontWeight: 800,
              backgroundColor: 'rgba(0, 0, 0, 0.55)',
              padding: '0.3rem 0.65rem',
              borderRadius: '6px',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              backdropFilter: 'blur(8px)'
            }}
          >
            0{slotIndex} • {card.tag}
          </span>
        </div>

        {card.duration && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.72rem',
              color: 'rgba(255, 255, 255, 0.85)',
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              padding: '0.28rem 0.6rem',
              borderRadius: '999px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)'
            }}
          >
            <Clock size={11} className="text-[#D4AF37]" />
            {card.duration}
          </span>
        )}
      </div>

      {/* Bottom Content Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto' }}>
        {card.location && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: 500
            }}
          >
            <MapPin size={12} className="text-[#D4AF37]" />
            {card.location}
          </div>
        )}

        <h3
          className="font-display"
          style={{
            fontSize: 'clamp(1.22rem, 1.45vw, 1.42rem)',
            lineHeight: 1.25,
            color: '#FFFFFF',
            margin: 0,
            fontWeight: 600,
            letterSpacing: '-0.01em'
          }}
        >
          {card.title}
        </h3>

        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
            fontSize: '0.84rem',
            lineHeight: 1.5,
            color: 'rgba(255, 255, 255, 0.78)',
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {card.desc}
        </p>

        {card.inclusion && (
          <div
            style={{
              padding: '0.55rem 0.75rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.72)',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            <strong style={{ color: '#D4AF37', fontWeight: 600 }}>Inclusion: </strong>
            {card.inclusion}
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.35rem' }}>
          <button
            type="button"
            onClick={onEnquire}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '999px',
              backgroundColor: '#D4AF37',
              color: '#0E1412',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.78rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              boxShadow: '0 6px 20px rgba(212, 175, 55, 0.25)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#D4AF37';
            }}
          >
            {card.ctaText || 'Curate This Experience'} <ArrowRight size={14} />
          </button>

          {card.experienceSlug && (
            <a
              href={`/experiences/${card.experienceSlug}`}
              style={{
                textAlign: 'center',
                fontSize: '0.74rem',
                color: 'rgba(255, 255, 255, 0.65)',
                textDecoration: 'none',
                padding: '0.25rem',
                transition: 'color 0.2s ease',
                fontWeight: 500
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)';
              }}
            >
              Explore Full Story →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
