import { useState } from "react";
import { Link } from "wouter";
import "./FromYourIdeaToKerala.css";

interface JourneyStep {
  stepNum: string;
  stepIndex: number;
  title: string;
  cardDesc: string;
  panelTitle: string;
  panelDesc: string;
  image: string;
  imageAlt: string;
}

const STEPS: JourneyStep[] = [
  {
    stepNum: "01",
    stepIndex: 1,
    title: "Tell us your dream",
    cardDesc: "Share your travel style & dates.",
    panelTitle: "Tell us your dream",
    panelDesc:
      "Share your travel style, dates, who you’re travelling with, and what you’re hoping to feel. Whether you seek quiet backwaters, Ayurveda sanctuaries, or misty cardamom hills, we listen before we craft.",
    image: "/assets/how-it-works/step1-story.jpg",
    imageAlt: "A travel journal, fountain pen and warm coffee on a sunlit wooden desk",
  },
  {
    stepNum: "02",
    stepIndex: 2,
    title: "Speak with a curator",
    cardDesc: "Within 24 hours, our specialist connects.",
    panelTitle: "Speak with a Kerala curator",
    panelDesc:
      "Within 24 hours, a dedicated Escora curator calls or messages you to understand your travel rhythm, companions, and bespoke preferences in detail.",
    image: "/assets/how-it-works/step2-curator.jpg",
    imageAlt: "Warm hospitality in a heritage Kerala estate veranda",
  },
  {
    stepNum: "03",
    stepIndex: 3,
    title: "Bespoke itinerary",
    cardDesc: "Custom route & private experiences.",
    panelTitle: "Receive your bespoke itinerary",
    panelDesc:
      "Your curator crafts a day-by-day journey with hand-selected stays, private experiences, and local access — built from scratch, never pulled from a template.",
    image: "/assets/how-it-works/step3-journey.jpg",
    imageAlt: "A traditional Kerala houseboat gliding serenely along palm-lined backwaters",
  },
  {
    stepNum: "04",
    stepIndex: 4,
    title: "Refine together",
    cardDesc: "Adjust until every detail is right.",
    panelTitle: "Refine together",
    panelDesc:
      "Nothing is locked until you love it. We adjust, swap, and rethink stays, routes, and experiences until every detail feels effortless and distinctly yours.",
    image: "/assets/how-it-works/step4-refine.jpg",
    imageAlt: "A vintage travel map, compass, pins, and planning notes under soft natural light",
  },
  {
    stepNum: "05",
    stepIndex: 5,
    title: "Concierge support",
    cardDesc: "Dedicated care from arrival to end.",
    panelTitle: "Travel with concierge support",
    panelDesc:
      "Your concierge supports you from airport arrival to final departure, every day and every hour. A real person is on call whenever you need anything in Kerala.",
    image: "/assets/how-it-works/step5-concierge.jpg",
    imageAlt: "A traveller peacefully gazing across calm Kerala backwaters lined with coconut palms",
  },
  {
    stepNum: "06",
    stepIndex: 6,
    title: "Post-trip support",
    cardDesc: "Your Kerala chapter continues.",
    panelTitle: "Post-trip support",
    panelDesc:
      "Once you’re home, feedback is welcomed and your next Kerala chapter can begin. We preserve your preferences and memories for every future return.",
    image: "/assets/how-it-works/step6-posttrip.jpg",
    imageAlt: "Lush Kerala estate grounds under golden late afternoon light",
  },
];

const SUPPORTING_FEATURES = [
  {
    title: "Curated itineraries",
    desc: "Tailored to your interests and pace.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3c1.5 3.5 4 6 8 7-3 1-5 4-5 8H9c0-4-2-7-5-8 4-1 6.5-3.5 8-7z" />
        <path d="M12 10c0 4-1 6-3 8" />
        <path d="M12 10c0 4 1 6 3 8" />
      </svg>
    ),
  },
  {
    title: "Handpicked stays",
    desc: "Boutique and heritage options.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10.5L12 3l9 7.5v9.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9.5z" />
        <path d="M9 21v-7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v7" />
      </svg>
    ),
  },
  {
    title: "Authentic experiences",
    desc: "Real local stories and hidden gems.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 4 13C4 7 12 4 20 4c0 8-3 16-9 16z" />
        <path d="M4 13c5.5 0 10.5-2.5 13-7" />
      </svg>
    ),
  },
];

export default function FromYourIdeaToKerala() {
  // Step 02 is the initial active step per the reference design (0-indexed: 1)
  const [activeStep, setActiveStep] = useState(1);
  const current = STEPS[activeStep];

  return (
    <section className="how-it-works-section" id="how-it-works" aria-label="From your idea to Kerala — How it works">
      {/* Decorative botanical shadow casting */}
      <div className="how-palm-shadow-tr" aria-hidden="true" />
      <div className="how-palm-shadow-bl" aria-hidden="true" />

      <div className="how-container">
        {/* ─── Header: Matching Travel by Type editorial specifications ─── */}
        <header className="how-header">
          <div className="how-header-left">
            <div className="how-eyebrow">
              <span className="dot" />
              HOW IT WORKS
            </div>
            <h2 className="how-title display-md">
              From your idea{" "}
              <em className="how-title-em">to Kerala.</em>
            </h2>
          </div>

          <p className="how-intro">
            Planning an Escora journey is simple, personal and handled thoughtfully every step of the way.
          </p>
        </header>

        <div
          className={`how-journey-stage active-is-${activeStep}`}
          style={{ "--active-step": activeStep } as React.CSSProperties}
        >
          {/* Subtle wavy spline threading through cards behind badges */}
          <svg className="how-spline-bg" viewBox="0 0 1200 80" fill="none" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M 20,40 C 140,15 220,65 340,40 C 460,15 540,65 660,40 C 780,15 860,65 980,40 C 1080,15 1160,55 1180,40"
              stroke="rgba(197, 160, 105, 0.45)"
              strokeWidth="1.2"
            />
          </svg>

          {/* 6 Horizontally Arranged Arched Cards */}
          <div className="how-cards-grid" role="tablist" aria-label="Journey planning steps">
            {STEPS.map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <button
                  key={step.stepNum}
                  type="button"
                  role="tab"
                  id={`how-tab-${step.stepNum}`}
                  aria-selected={isActive}
                  aria-controls="how-panel-content"
                  className={`how-card ${isActive ? "is-active" : ""}`}
                  onClick={() => setActiveStep(idx)}
                >
                  {/* Tall Architectural Arch Frame */}
                  <div className="how-arch-frame">
                    <div className="how-arch-img-wrap">
                      <img
                        src={step.image}
                        alt={step.imageAlt}
                        className="how-card-img"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  {/* Circular step number badge */}
                  <div className="how-badge-wrap">
                    <span className="how-step-badge">{step.stepNum}</span>
                  </div>

                  {/* Card typography */}
                  <div className="how-card-text">
                    <h3 className="how-card-title">{step.title}</h3>
                    {step.cardDesc ? <p className="how-card-desc">{step.cardDesc}</p> : null}
                  </div>

                  {/* Sculptural fillets connecting the active card to the bottom panel */}
                  {isActive && (
                    <>
                      {idx > 0 && (
                        <svg className="how-fillet how-fillet-left" viewBox="0 0 100 100" fill="none" preserveAspectRatio="none" aria-hidden="true">
                          <path d="M 100,0 C 100,55.23 55.23,100 0,100 L 0,104 L 100,104 Z" fill="#0E291C" />
                          <path d="M 100,0 C 100,55.23 55.23,100 0,100" stroke="rgba(197, 160, 105, 0.55)" strokeWidth="1.2" strokeLinecap="butt" vectorEffect="non-scaling-stroke" />
                        </svg>
                      )}
                      {idx < STEPS.length - 1 && (
                        <svg className="how-fillet how-fillet-right" viewBox="0 0 100 100" fill="none" preserveAspectRatio="none" aria-hidden="true">
                          <path d="M 0,0 C 0,55.23 44.77,100 100,100 L 100,104 L 0,104 Z" fill="#0E291C" />
                          <path d="M 0,0 C 0,55.23 44.77,100 100,100" stroke="rgba(197, 160, 105, 0.55)" strokeWidth="1.2" strokeLinecap="butt" vectorEffect="non-scaling-stroke" />
                        </svg>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* ─── Bottom Information Panel Seamlessly Connected ─── */}
          <div
            id="how-panel-content"
            role="tabpanel"
            aria-labelledby={`how-tab-${current.stepNum}`}
            className="how-info-panel"
          >
            {/* Atmospheric right-side backdrop reflection */}
            <div className="how-panel-ambience" aria-hidden="true" />

            <div className="how-panel-body">
              {/* Left: Active step description */}
              <div className="how-panel-left">
                <div className="how-panel-step-label">
                  <span>STEP {current.stepNum} OF 06</span>
                  <span className="how-panel-step-line" />
                </div>
                <h3 className="how-panel-title">{current.panelTitle}</h3>
                <p className="how-panel-desc">{current.panelDesc}</p>
              </div>

              {/* Middle: 3 compact supporting features */}
              <div className="how-panel-features">
                {SUPPORTING_FEATURES.map((feat, i) => (
                  <div key={i} className="how-feature-item">
                    <span className="how-feature-icon" aria-hidden="true">
                      {feat.icon}
                    </span>
                    <div className="how-feature-content">
                      <h4 className="how-feature-title">{feat.title}</h4>
                      <p className="how-feature-desc">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: Golden CTA button */}
              <div className="how-panel-action">
                <Link href="/plan" className="how-cta-btn" aria-label="Start planning your Kerala journey">
                  <span>START PLANNING YOUR JOURNEY</span>
                  <span className="how-cta-arrow" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M2.5 7H11.5M11.5 7L7.5 3M11.5 7L7.5 11"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Footer caption bar ─── */}
        <footer className="how-footer-bar" aria-hidden="true">
          <div className="how-footer-left">
            <span className="how-footer-line" />
            <span className="how-footer-text">A MORE MEANINGFUL WAY TO EXPLORE KERALA</span>
          </div>

          <div className="how-footer-right">
            <div className="how-progress-pips">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`how-progress-pip ${i === activeStep ? "is-active" : ""}`}
                />
              ))}
            </div>
            <span className="how-progress-counter">{current.stepNum} / 06</span>
          </div>
        </footer>
      </div>
    </section>
  );
}
