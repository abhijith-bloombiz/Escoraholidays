import { useState, useEffect } from "react";
import { Link } from "wouter";
import "./FromYourIdeaToKerala.css";

interface JourneyStep {
  stepNum: string;
  stepIndex: number;
  title: string;
  cardDesc: string;
  image: string;
  imageAlt: string;
  colClass: string;
  shapeClass: string;
}

// 6 Cards Layout Configuration:
// 1(bigger), 2(two cards like top and bottom), 2(two cards like top and bottom), 1(bigger)
const STEPS: JourneyStep[] = [
  {
    stepNum: "01",
    stepIndex: 1,
    title: "Tell us your dream",
    cardDesc:
      "Share your travel style, dates, who you're travelling with and what you're hoping to feel. No form is too vague — we work with ideas as much as specifics.",
    image: "/assets/how-it-works/step1-story.jpg",
    imageAlt: "A travel journal, fountain pen and warm coffee on a sunlit wooden desk",
    colClass: "card-col-1-big",
    shapeClass: "shape-capsule",
  },
  {
    stepNum: "02",
    stepIndex: 2,
    title: "Speak with a Kerala curator",
    cardDesc:
      "Within 24 hours, a dedicated Escora curator calls or messages you. We ask questions most agents never think to ask.",
    image: "/assets/how-it-works/step2-curator.jpg",
    imageAlt: "Warm hospitality in a heritage Kerala estate veranda",
    colClass: "card-col-2-top",
    shapeClass: "shape-leaf-tr",
  },
  {
    stepNum: "03",
    stepIndex: 3,
    title: "Receive your bespoke itinerary",
    cardDesc:
      "Your curator crafts a day-by-day journey — hand-selected stays, private experiences, local access — presented for your review.",
    image: "/assets/how-it-works/step3-journey.jpg",
    imageAlt: "A traditional Kerala houseboat gliding serenely along palm-lined backwaters",
    colClass: "card-col-2-btm",
    shapeClass: "shape-leaf-bl",
  },
  {
    stepNum: "04",
    stepIndex: 4,
    title: "Refine together",
    cardDesc:
      "Nothing is locked until you love it. We adjust, swap and rethink until every detail feels exactly right.",
    image: "/assets/how-it-works/step4-refine.jpg",
    imageAlt: "A vintage travel map, compass, pins, and planning notes under soft natural light",
    colClass: "card-col-3-top",
    shapeClass: "shape-leaf-tl",
  },
  {
    stepNum: "05",
    stepIndex: 5,
    title: "Travel with concierge support",
    cardDesc:
      "From airport arrival to final departure, your Escora concierge is on call. Every day. Every hour. Any situation.",
    image: "/assets/how-it-works/step5-concierge.jpg",
    imageAlt: "A traveller peacefully gazing across calm Kerala backwaters lined with coconut palms",
    colClass: "card-col-3-btm",
    shapeClass: "shape-leaf-br",
  },
  {
    stepNum: "06",
    stepIndex: 6,
    title: "Post-trip support",
    cardDesc:
      "Once you're home, we're still here. Memories shared, feedback welcomed, and your next Kerala chapter ready to begin whenever you are.",
    image: "/assets/how-it-works/step6-posttrip.jpg",
    imageAlt: "Lush Kerala estate grounds under golden late afternoon light",
    colClass: "card-col-4-big",
    shapeClass: "shape-capsule",
  },
];

export default function FromYourIdeaToKerala() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-looping timer: reveals each card's contents one after another sequentially
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STEPS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused]);


  return (
    <section className="how-it-works-section" id="how-it-works" aria-label="From your idea to Kerala — How it works">
      {/* Decorative botanical shadow casting */}
      <div className="how-palm-shadow-tr" aria-hidden="true" />
      <div className="how-palm-shadow-bl" aria-hidden="true" />

      <div className="how-container">
        {/* ─── Header: Matching Travel by Type editorial specifications with Fonarto non-italic ─── */}
        <header className="how-header">
          <div className="how-header-left">
            <div className="how-eyebrow">
              HOW IT WORKS
            </div>
            <h2 className="how-title display-md">
              From your idea <span className="how-title-em">to Kerala.</span>
            </h2>
          </div>

          <div className="how-header-right">
            <p className="how-intro">
              Planning an Escora journey is simple, personal and handled thoughtfully every step of the way.
            </p>
            <Link href="/plan" className="how-cta-btn" aria-label="Plan your journey">
              <span>PLAN YOUR JOURNEY</span>
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
        </header>

        {/* ─── 4-Column Architectural Grid: 1(bigger), 2(top/bottom), 2(top/bottom), 1(bigger) ─── */}
        <div
          className={`how-journey-stage active-is-${activeStep}`}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="how-cards-stage" role="tablist" aria-label="Journey planning steps">
            {STEPS.map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <button
                  key={step.stepNum}
                  type="button"
                  role="tab"
                  id={`how-tab-${step.stepNum}`}
                  aria-selected={isActive}
                  className={`how-card ${step.colClass} ${step.shapeClass} ${isActive ? "is-active" : ""}`}
                  onClick={() => setActiveStep(idx)}
                  onMouseEnter={() => {
                    setActiveStep(idx);
                    setIsPaused(true);
                  }}
                >
                  {/* Image Arch Frame without outer box container */}
                  <div className={`how-card-arch-frame ${step.shapeClass}`}>
                    <img
                      src={step.image}
                      alt={step.imageAlt}
                      className="how-card-img"
                      loading="lazy"
                    />

                    {/* Contents inside the image card: centered numbering, heading & revealable description */}
                    <div className="how-card-inner-content">
                      <div className="how-card-badge-wrap">
                        <div className="how-step-badge">
                          {isActive && !isPaused && (
                            <svg key={`ring-${step.stepNum}-${activeStep}`} className="how-badge-ring" viewBox="0 0 40 40" aria-hidden="true">
                              <circle cx="20" cy="20" r="18" className="how-badge-ring-circle" />
                            </svg>
                          )}
                          <span className="how-step-num">{step.stepNum}</span>
                        </div>
                      </div>

                      <h3 className="how-card-title">{step.title}</h3>

                      <div className="how-card-details">
                        <p className="how-card-desc">{step.cardDesc}</p>
                        <div className="how-card-indicator" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
