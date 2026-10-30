import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  MessageSquare,
  Map,
  SlidersHorizontal,
  ShieldCheck,
  HeartHandshake,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Sparkles,
  type LucideIcon
} from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollAnimation';

export interface Milestone {
  step: string;
  tag: string;
  title: string;
  shortLabel: string;
  timeframe: string;
  deliverable: string;
  icon: LucideIcon;
  image: string;
  lead: string;
  detail: string;
  deliverables: string[];
}

const MILESTONES: Milestone[] = [
  {
    step: "01",
    tag: "DISCOVERY",
    title: "TELL US YOUR DREAM & VISION",
    shortLabel: "Discovery",
    timeframe: "Instant Inquiry",
    deliverable: "Private Travel Profile",
    icon: Compass,
    image: "/images/hero/5-idukky_upscaled.png",
    lead: "Share your travel style, pace, sensory desires, and ideal dates.",
    detail: "Whether you long for dawn tea cuppings above Munnar's cloudline, silent backwater cruises with a private chef, or intensive curative Ayurvedic detoxification, we begin by listening closely to what matters most to you.",
    deliverables: ["1-on-1 Lifestyle Consultation", "Personalized Pace Mapping", "Bespoke Dietary & Accommodation Profile"]
  },
  {
    step: "02",
    tag: "CONSULTATION",
    title: "SPEAK WITH A SENIOR KERALA CURATOR",
    shortLabel: "Curator Call",
    timeframe: "Within 24 Hours",
    deliverable: "1-on-1 Local Guidance",
    icon: MessageSquare,
    image: "/images/exp_tea_bungalow.jpg",
    lead: "Connect directly with seasoned local insiders who call Kerala home.",
    detail: "Skip middlemen and generic travel agencies. Your dedicated curator lives in Kerala, has personally vetted every villa and private estate, and knows secret detours, secluded viewpoints, and the best local harvest seasons.",
    deliverables: ["Direct WhatsApp or Zoom Connection", "Private Estate Recommendations", "Expert Hill-Road Logistics Planning"]
  },
  {
    step: "03",
    tag: "BLUEPRINT",
    title: "RECEIVE YOUR BESPOKE ITINERARY",
    shortLabel: "Blueprint",
    timeframe: "48-Hour Turnaround",
    deliverable: "Digital Route Dossier",
    icon: Map,
    image: "/images/exp_houseboat.jpg",
    lead: "A turnkey, day-by-day interactive route crafted strictly for your party.",
    detail: "Receive an unhurried, tailor-made digital dossier with handpicked luxury stays, private chauffeur assignments, daily timing estimates, and bespoke sensory moments that cannot be booked through public platforms.",
    deliverables: ["Bespoke Day-by-Day Schedule", "Exclusive Private Charters", "Transparent All-Inclusive Pricing"]
  },
  {
    step: "04",
    tag: "REFINEMENT",
    title: "FINE-TUNE & PERFECT TOGETHER",
    shortLabel: "Refine",
    timeframe: "Unlimited Adjustments",
    deliverable: "Final Confirmed Journey",
    icon: SlidersHorizontal,
    image: "/images/exp_pool_villa.jpg",
    lead: "Adjust pacing, inclusions, and private requests until every detail sings.",
    detail: "Want an extra night listening to the waves at Marari? Prefer an intimate cooking masterclass with an ancestral chef? We adapt every segment until the journey feels like an effortless reflection of your desires.",
    deliverables: ["Zero Change Penalties", "Dietary & Wellness Customization", "Confirmed VIP Arrival Reservations"]
  },
  {
    step: "05",
    tag: "CONCIERGE",
    title: "TRAVEL WITH 24/7 GROUND CARE",
    shortLabel: "On-Ground",
    timeframe: "Arrival to Departure",
    deliverable: "24/7 Dedicated Concierge",
    icon: ShieldCheck,
    image: "/images/executive_transit.jpg",
    lead: "One direct message away from the moment your aircraft lands.",
    detail: "From airport luggage assistance and your private executive chauffeur to on-the-spot restaurant recommendations and weather-optimized timing adjustments, your personal concierge ensures frictionless peace of mind.",
    deliverables: ["VIP Airport Meet & Assist", "Dedicated Local Chauffeur", "Real-Time 24/7 WhatsApp Concierge"]
  },
  {
    step: "06",
    tag: "MEMOIR",
    title: "CHERISHED MEMORIES & LIFETIME ARCHIVE",
    shortLabel: "Archive",
    timeframe: "Unhurried Return",
    deliverable: "Lifelong Connection",
    icon: HeartHandshake,
    image: "/images/dest_5_varkala.jpg",
    lead: "Thoughtful departure care and an enduring Kerala connection.",
    detail: "We coordinate comfortable airport transfers, curated departure gifts, and post-trip follow-up, ensuring your return home is as serene and memorable as your days in God's Own Country.",
    deliverables: ["Airport Transfer Protocol", "Complimentary Curated Spice Gift", "Private Return Traveler Privileges"]
  }
];

export interface HowItWorksProps {
  onOpenEnquiry?: (data?: Record<string, any>) => void;
}

export default function HowItWorks({ onOpenEnquiry }: HowItWorksProps) {
  const [sectionRef, isVisible] = useScrollReveal<HTMLDivElement>({ threshold: 0.05, reEnter: true });
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [isDesktop, setIsDesktop] = useState<boolean>(true);

  const trackRef = useRef<HTMLElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);

  // Responsive desktop detection: enable pinned scroll when screen has adequate dimensions
  useEffect(() => {
    const checkDesktop = () => {
      const desktop = typeof window !== 'undefined' && window.innerWidth >= 992 && window.innerHeight >= 600;
      setIsDesktop(desktop);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Synchronized scroll-driven checkpoint progression
  useEffect(() => {
    if (!isDesktop) return;

    let rafId: number | null = null;

    const updateScroll = () => {
      const track = trackRef.current;
      if (!track) return;

      const rect = track.getBoundingClientRect();
      const vh = window.innerHeight;
      const totalScrollDistance = rect.height - vh;

      if (totalScrollDistance <= 0) return;

      // Progress: 0 when track top reaches top of viewport, 1 when track bottom reaches bottom of viewport
      const rawProgress = -rect.top / totalScrollDistance;
      const clampedProgress = Math.max(0, Math.min(1, rawProgress));

      // Map progress across the 6 checkpoints evenly:
      // Discovery (0), Curator Call (1), Blueprint (2), Refine (3), On-Ground (4), Archive (5)
      const count = MILESTONES.length;
      const targetIdx = Math.min(count - 1, Math.max(0, Math.floor(Math.min(clampedProgress, 0.9999) * count)));

      setActiveIdx((prev) => (prev !== targetIdx ? targetIdx : prev));
    };

    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        updateScroll();
        rafId = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    const lenis = (window as any).lenis;
    if (lenis) {
      lenis.on('scroll', handleScroll);
    }
    updateScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      const activeLenis = (window as any).lenis;
      if (activeLenis) {
        activeLenis.off('scroll', handleScroll);
      }
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isDesktop]);

  // Interactive step navigation (scrubber nodes or prev/next arrows)
  const scrollToStep = (targetIdx: number) => {
    const clampedIdx = Math.max(0, Math.min(MILESTONES.length - 1, targetIdx));
    setActiveIdx(clampedIdx);

    if (!isDesktop || !trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const currentScrollY = window.scrollY || window.pageYOffset;
    const trackTopY = currentScrollY + rect.top;
    const totalScrollDistance = rect.height - window.innerHeight;

    if (totalScrollDistance <= 0) return;

    // Center of the target checkpoint's scroll zone
    const targetProgress = (clampedIdx + 0.5) / MILESTONES.length;
    const targetY = trackTopY + targetProgress * totalScrollDistance;

    const lenis = (window as any).lenis;
    if (lenis) {
      lenis.scrollTo(targetY, { duration: 0.8 });
    } else {
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
  };

  const activeMilestone = MILESTONES[activeIdx];

  return (
    <section
      id="how-it-works"
      ref={trackRef}
      style={{
        backgroundColor: '#F8F6F1',
        position: 'relative',
        height: isDesktop ? '380vh' : 'auto'
      }}
    >
      {/* Sticky Viewport Container */}
      <div
        ref={stickyRef}
        style={{
          position: isDesktop ? 'sticky' : 'relative',
          top: 0,
          left: 0,
          width: '100%',
          height: isDesktop ? '100vh' : 'auto',
          minHeight: isDesktop ? '100vh' : 'auto',
          maxHeight: isDesktop ? '100vh' : 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          backgroundColor: '#F8F6F1',
          borderTop: '1px solid rgba(0, 0, 0, 0.05)',
          padding: isDesktop ? 'clamp(1rem, 2.5vh, 2.5rem) 1.5rem' : '5rem 1rem 5.5rem',
          boxSizing: 'border-box'
        }}
      >
        <div
          ref={sectionRef}
          className="section-wrapper"
          style={{
            width: '100%',
            maxWidth: '1160px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >

          {/* Section Header */}
          <div
            style={{
              maxWidth: '820px',
              margin: isDesktop ? '0 auto clamp(0.85rem, 1.8vh, 1.6rem)' : '0 auto 2.5rem',
              textAlign: 'center',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 0.7s var(--ease-luxury), transform 0.7s var(--ease-luxury)'
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.4rem'
              }}
            >
              <span
                style={{
                  fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
                  textTransform: 'uppercase',
                  fontSize: '0.76rem',
                  letterSpacing: '0.2em',
                  color: '#9E6F29',
                  fontWeight: 700
                }}
              >
                THE BESPOKE PROCESS
              </span>
            </div>

            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(1.9rem, 3.2vw, 2.8rem)',
                color: '#121316',
                lineHeight: 1.05,
                letterSpacing: '0.04em',
                marginBottom: '0.45rem'
              }}
            >
              HOW WE CRAFT YOUR JOURNEY
            </h2>

            <p
              style={{
                fontSize: 'clamp(0.88rem, 1vw, 0.98rem)',
                color: '#5C5850',
                lineHeight: 1.5,
                maxWidth: '620px',
                margin: '0 auto',
                fontWeight: 400
              }}
            >
              From your initial conversation to seamless 24/7 on-ground concierge support.
            </p>
          </div>

          {/* Lightship-Inspired Milestone Scrubber Bar */}
          <div
            style={{
              position: 'relative',
              maxWidth: '960px',
              width: '100%',
              margin: isDesktop ? '0 auto clamp(0.9rem, 2vh, 1.8rem)' : '0 auto 2.5rem',
              padding: '0 1rem'
            }}
            className="milestone-scrubber-wrapper"
          >
            {/* Continuous Gold Connecting Hairline */}
            <div
              style={{
                position: 'absolute',
                top: '21px',
                left: '5%',
                right: '5%',
                height: '2px',
                backgroundColor: 'rgba(18, 19, 22, 0.1)',
                zIndex: 0
              }}
            >
              {/* Active Progress Fill */}
              <div
                style={{
                  height: '100%',
                  width: `${(activeIdx / (MILESTONES.length - 1)) * 100}%`,
                  backgroundColor: '#B48235',
                  transition: 'width 0.45s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />
            </div>

            {/* 6 Milestone Station Nodes */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                zIndex: 1
              }}
            >
              {MILESTONES.map((m, idx) => {
                const isCurrent = idx === activeIdx;
                const isPast = idx <= activeIdx;

                return (
                  <button
                    key={m.step}
                    onClick={() => scrollToStep(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.55rem',
                      outline: 'none'
                    }}
                    aria-label={`Milestone ${m.step}: ${m.shortLabel}`}
                  >
                    {/* Circle Beacon */}
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        backgroundColor: isCurrent ? '#121316' : isPast ? '#B48235' : '#FFFFFF',
                        border: isCurrent ? '2px solid #D4A359' : isPast ? '2px solid #B48235' : '2px solid rgba(18, 19, 22, 0.15)',
                        color: isCurrent ? '#D4A359' : isPast ? '#FFFFFF' : '#6B7280',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        boxShadow: isCurrent ? '0 0 0 5px rgba(212, 163, 89, 0.25)' : 'none',
                        transform: isCurrent ? 'scale(1.08)' : 'scale(1)',
                        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    >
                      {m.step}
                    </div>

                    {/* Micro Stage Label */}
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: isCurrent ? 700 : 500,
                        color: isCurrent ? '#121316' : '#6B7280',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        transition: 'color 0.25s ease'
                      }}
                      className="milestone-text-label"
                    >
                      {m.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Milestone Station Detail Card (Lightship Showcase Split) */}
          <div
            style={{
              maxWidth: '1040px',
              width: '100%',
              margin: '0 auto',
              backgroundColor: '#FFFFFF',
              borderRadius: '26px',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.06)',
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: 'minmax(340px, 1.25fr) minmax(320px, 1fr)',
              alignItems: 'stretch',
              maxHeight: isDesktop ? 'calc(100vh - 270px)' : 'none',
              minHeight: isDesktop ? '430px' : 'auto'
            }}
            className="milestone-showcase-split"
          >

            {/* Left Narrative Panel */}
            <div
              style={{
                padding: isDesktop ? 'clamp(1.5rem, 2.5vw, 2.4rem)' : '2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              <div key={activeMilestone.step} className="bespoke-step-fade">
                {/* Monospace Phase Tracker */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.85rem'
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontFamily: 'monospace',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: '#9E6F29',
                      fontWeight: 700
                    }}
                  >
                    [ STAGE {activeMilestone.step} // 06 ] • {activeMilestone.tag}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', color: '#6B7280', fontWeight: 600 }}>
                    <Clock size={12} color="#B48235" />
                    <span>{activeMilestone.timeframe}</span>
                  </div>
                </div>

                {/* Title */}
                <h3
                  className="font-display"
                  style={{
                    fontSize: 'clamp(1.35rem, 2vw, 1.75rem)',
                    color: '#121316',
                    lineHeight: 1.15,
                    letterSpacing: '0.02em',
                    marginBottom: '0.65rem'
                  }}
                >
                  {activeMilestone.title}
                </h3>

                <p
                  style={{
                    fontSize: 'clamp(0.88rem, 1vw, 0.95rem)',
                    fontWeight: 600,
                    color: '#121316',
                    lineHeight: 1.45,
                    marginBottom: '0.6rem'
                  }}
                >
                  {activeMilestone.lead}
                </p>

                <p
                  style={{
                    fontSize: 'clamp(0.82rem, 0.9vw, 0.88rem)',
                    color: '#4B5563',
                    lineHeight: 1.55,
                    marginBottom: '1.25rem'
                  }}
                >
                  {activeMilestone.detail}
                </p>

                {/* Deliverable Micro-Chips */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    marginBottom: '1.25rem'
                  }}
                >
                  {activeMilestone.deliverables.map((d, dIdx) => (
                    <div
                      key={dIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.82rem',
                        color: '#1F2937',
                        fontWeight: 500
                      }}
                    >
                      <CheckCircle2 size={14} color="#10B981" style={{ flexShrink: 0 }} />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stepper Navigation Buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '1rem',
                  borderTop: '1px solid rgba(0, 0, 0, 0.08)'
                }}
              >
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => scrollToStep(Math.max(0, activeIdx - 1))}
                    className="nav-arrow-btn light"
                    aria-label="Previous Milestone"
                    title="Previous Step"
                    disabled={activeIdx === 0}
                    style={{
                      opacity: activeIdx === 0 ? 0.35 : 1,
                      cursor: activeIdx === 0 ? 'not-allowed' : 'pointer',
                      transition: 'opacity 0.2s ease'
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => scrollToStep(Math.min(MILESTONES.length - 1, activeIdx + 1))}
                    className="nav-arrow-btn dark"
                    aria-label="Next Milestone"
                    title="Next Step"
                    disabled={activeIdx === MILESTONES.length - 1}
                    style={{
                      opacity: activeIdx === MILESTONES.length - 1 ? 0.35 : 1,
                      cursor: activeIdx === MILESTONES.length - 1 ? 'not-allowed' : 'pointer',
                      transition: 'opacity 0.2s ease'
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <button
                  onClick={() => onOpenEnquiry && onOpenEnquiry({ interest: `Planning: ${activeMilestone.title}` })}
                  className="btn-pill btn-gold"
                  style={{
                    padding: '0.6rem 1.35rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}
                >
                  <span>Start Stage {activeMilestone.step}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>

            {/* Right Photographic Visual Canvas */}
            <div
              style={{
                position: 'relative',
                minHeight: '340px',
                backgroundColor: '#121316',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.5rem',
                overflow: 'hidden'
              }}
            >
              {/* Stacked background images for instant cross-fading */}
              {MILESTONES.map((m, idx) => (
                <div
                  key={m.step}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${m.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: idx === activeIdx ? 1 : 0,
                    transform: idx === activeIdx ? 'scale(1)' : 'scale(1.05)',
                    transition: 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)',
                    zIndex: idx === activeIdx ? 1 : 0,
                    pointerEvents: 'none'
                  }}
                />
              ))}

              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(14, 20, 18, 0.25) 0%, rgba(14, 20, 18, 0.85) 100%)',
                  zIndex: 2,
                  pointerEvents: 'none'
                }}
              />

              {/* Top Badge */}
              <div style={{ position: 'relative', zIndex: 3 }}>
                <span
                  key={activeMilestone.step}
                  className="bespoke-step-fade"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    backgroundColor: 'rgba(18, 19, 22, 0.8)',
                    backdropFilter: 'blur(8px)',
                    color: '#FFFFFF',
                    borderRadius: '9999px',
                    padding: '0.3rem 0.8rem',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  }}
                >
                  <Sparkles size={11} color="#D4A359" />
                  <span>Deliverable: {activeMilestone.deliverable}</span>
                </span>
              </div>

              {/* Bottom Assurance Pill */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 3,
                  backgroundColor: 'rgba(18, 19, 22, 0.82)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '16px',
                  padding: '1.1rem',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF'
                }}
              >
                <div style={{ fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D4A359', fontWeight: 700, marginBottom: '0.25rem' }}>
                  THE ESCORA GUARANTEE
                </div>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.5, margin: 0 }}>
                  100% private departures. Direct curator phone access. Every route individually drafted with zero fixed cookie-cutter templates.
                </p>
              </div>

            </div>

          </div>

          <style>{`
            @keyframes bespokeStepFade {
              from {
                opacity: 0.35;
                transform: translateY(6px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            .bespoke-step-fade {
              animation: bespokeStepFade 0.35s cubic-bezier(0.16, 1, 0.3, 1);
            }

            @media (max-width: 900px) {
              .milestone-showcase-split {
                grid-template-columns: 1fr !important;
                max-height: none !important;
              }
              .milestone-text-label {
                display: none !important;
              }
            }
          `}</style>

        </div>
      </div>
    </section>
  );
}
