import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./FromYourIdeaToKerala.css";

interface JourneyStep {
  stepNum: string;
  stepIndex: number;
  labelLine1: string;
  labelLine2: string;
  title: string;
  desc: string;
  ctaText: string;
  ctaLink: string;
  image: string;
  imageAlt: string;
}

const STEPS: JourneyStep[] = [
  {
    stepNum: "01",
    stepIndex: 1,
    labelLine1: "TELL US YOUR",
    labelLine2: "DREAM",
    title: "Tell us your dream",
    desc: "Share your travel style, dates, and the experiences you're hoping to discover. We'll get to know what makes your perfect Kerala journey.",
    ctaText: "START YOUR JOURNEY",
    ctaLink: "/plan",
    image: "/assets/how-it-works/step1-story.jpg",
    imageAlt: "A travel journal, fountain pen and warm coffee on a sunlit wooden desk",
  },
  {
    stepNum: "02",
    stepIndex: 2,
    labelLine1: "SPEAK WITH A",
    labelLine2: "KERALA CURATOR",
    title: "Speak with a Kerala curator",
    desc: "Within 24 hours, a dedicated Escora curator calls or messages you. We ask the thoughtful questions most agencies never think to ask.",
    ctaText: "START YOUR JOURNEY",
    ctaLink: "/plan",
    image: "/assets/how-it-works/step2-curator.jpg",
    imageAlt: "Warm hospitality in a heritage Kerala estate veranda",
  },
  {
    stepNum: "03",
    stepIndex: 3,
    labelLine1: "RECEIVE YOUR",
    labelLine2: "BESPOKE ITINERARY",
    title: "Receive your bespoke itinerary",
    desc: "Your curator crafts a day-by-day journey — hand-selected stays, private backwater cruises, secluded estates — presented for your review.",
    ctaText: "START YOUR JOURNEY",
    ctaLink: "/plan",
    image: "/assets/how-it-works/step3-journey.jpg",
    imageAlt: "A traditional Kerala houseboat gliding serenely along palm-lined backwaters",
  },
  {
    stepNum: "04",
    stepIndex: 4,
    labelLine1: "REFINE",
    labelLine2: "TOGETHER",
    title: "Refine together",
    desc: "Nothing is locked until you love it. We adjust, swap and rethink every stay, route and pace until every detail feels exactly right.",
    ctaText: "START YOUR JOURNEY",
    ctaLink: "/plan",
    image: "/assets/how-it-works/step4-refine.jpg",
    imageAlt: "A vintage travel map, compass, pins, and planning notes under soft natural light",
  },
  {
    stepNum: "05",
    stepIndex: 5,
    labelLine1: "TRAVEL WITH",
    labelLine2: "CONCIERGE SUPPORT",
    title: "Travel with concierge support",
    desc: "From airport arrival to final departure, your Escora concierge is quietly on call. Every day. Every hour. Any situation handled effortlessly.",
    ctaText: "START YOUR JOURNEY",
    ctaLink: "/plan",
    image: "/assets/how-it-works/step5-concierge.jpg",
    imageAlt: "A traveller peacefully gazing across calm Kerala backwaters lined with coconut palms",
  },
  {
    stepNum: "06",
    stepIndex: 6,
    labelLine1: "POST-TRIP",
    labelLine2: "SUPPORT",
    title: "Post-trip support",
    desc: "Once you're home, we're still here. Memories shared, feedback welcomed, and your next Kerala chapter ready whenever you are.",
    ctaText: "START YOUR JOURNEY",
    ctaLink: "/plan",
    image: "/assets/how-it-works/step6-posttrip.jpg",
    imageAlt: "Lush Kerala estate grounds under golden late afternoon light",
  },
];

export default function FromYourIdeaToKerala() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isStageInView, setIsStageInView] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Navigation handlers
  const handlePrev = useCallback(() => {
    setActiveStep((prev) => (prev - 1 + STEPS.length) % STEPS.length);
  }, []);

  const handleNext = useCallback(() => {
    setActiveStep((prev) => (prev + 1) % STEPS.length);
  }, []);

  // Check if slide is active inside pinned container
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const pinnedSlide = stage.closest(".pinned-journey-slide");

    if (pinnedSlide) {
      const updateState = () => {
        const isActive =
          pinnedSlide.classList.contains("is-active") ||
          pinnedSlide.classList.contains("is-initial-active") ||
          (pinnedSlide as HTMLElement).style.visibility === "visible";
        setIsStageInView(isActive);
      };

      updateState();

      const observer = new MutationObserver(updateState);
      observer.observe(pinnedSlide, { attributes: true, attributeFilter: ["class", "style"] });

      return () => observer.disconnect();
    }

    if (typeof IntersectionObserver === "undefined") {
      setIsStageInView(true);
      return;
    }

    const stageObserver = new IntersectionObserver(
      ([entry]) => {
        setIsStageInView(entry.isIntersecting);
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );

    stageObserver.observe(stage);
    return () => stageObserver.disconnect();
  }, []);

  // Auto-advance every 5.2s when in view and not hovered
  useEffect(() => {
    if (isPaused || !isStageInView) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STEPS.length);
    }, 5200);
    return () => clearInterval(timer);
  }, [isPaused, isStageInView]);

  const current = STEPS[activeStep] || STEPS[0];

  return (
    <section
      ref={sectionRef}
      className="how-it-works-section"
      id="how-it-works"
      aria-label="From your idea to Kerala — How it works"
    >
      {/* ─── Atmospheric Decorative Background Watermarks ─── */}
      <div className="how-ambient-glow" aria-hidden="true" />

      <div className="how-container wrap" ref={stageRef}>
        {/* ─── Header: Eyebrow + Fonarto Title ─── */}
        <header className="how-header">
          <div className="how-header-left" data-pinned-reveal>
            <div className="how-eyebrow">
              <span className="how-eyebrow-dash" />
              <span>HOW IT WORKS</span>
              <span className="how-eyebrow-dash" />
            </div>
            <h2 className="how-title">
              From your idea to Kerala.
            </h2>
          </div>
        </header>

        {/* ─── Horizontal 6-Step Connected Timeline Stepper ─── */}
        <div
          className="how-stepper-wrap"
          data-pinned-reveal
          role="tablist"
          aria-label="Journey planning steps"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Continuous track connecting center of Step 01 to center of Step 06 */}
          <div className="how-stepper-track-wrapper" aria-hidden="true">
            <div className="how-stepper-track-bg" />
            <div
              className="how-stepper-track-fill"
              style={{ width: `${(activeStep / (STEPS.length - 1)) * 100}%` }}
            />
          </div>

          <div className="how-stepper-nodes-row">
            {STEPS.map((step, idx) => {
              const isActive = activeStep === idx;
              const isPast = idx < activeStep;

              return (
                <button
                  key={step.stepNum}
                  type="button"
                  role="tab"
                  id={`how-step-tab-${step.stepNum}`}
                  aria-selected={isActive}
                  aria-controls={`how-step-panel-${step.stepNum}`}
                  className={`how-stepper-item ${isActive ? "is-active" : ""} ${isPast ? "is-past" : ""}`}
                  onClick={() => {
                    setActiveStep(idx);
                    setIsPaused(true);
                  }}
                >
                  <div className="how-stepper-node-anchor">
                    {isActive && <div className="how-stepper-halo" aria-hidden="true" />}
                    <span className="how-stepper-circle">
                      {step.stepNum}
                    </span>
                  </div>
                  <span className="how-stepper-label">
                    <span className="how-stepper-label-line">{step.labelLine1}</span>
                    <span className="how-stepper-label-line">{step.labelLine2}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Bottom Split Showcase: Left Image Frame + Right Step Details & Controls ─── */}
        <div
          className="how-showcase-split"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Left Column: Rounded Corner Image Frame */}
          <div className="how-showcase-image-col" data-pinned-reveal>
            <div className="how-showcase-image-frame">
              {STEPS.map((step, idx) => (
                <img
                  key={step.stepNum}
                  src={step.image}
                  alt={step.imageAlt}
                  className={`how-showcase-img ${activeStep === idx ? "is-active" : ""}`}
                  loading={idx === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              ))}
              <div className="how-showcase-image-glow" aria-hidden="true" />
            </div>
          </div>

          {/* Right Column: Step details & navigation controls */}
          <div
            className="how-showcase-content-col"
            data-pinned-reveal
            role="tabpanel"
            id={`how-step-panel-${current.stepNum}`}
            aria-labelledby={`how-step-tab-${current.stepNum}`}
          >
            {/* Animated step panel key reveals content on step change */}
            <div className="how-step-editorial-panel" key={`step-panel-${current.stepNum}`}>
              <div className="how-step-eyebrow">
                <span className="how-step-eyebrow-line" aria-hidden="true" />
                <span>STEP {current.stepNum}</span>
              </div>

              <h3 className="how-showcase-title">
                {current.title}
              </h3>

              <p className="how-showcase-desc">
                {current.desc}
              </p>

              {/* Direct CTA pill button */}
              <div className="how-showcase-action-row">
                <Link href={current.ctaLink} className="how-cta-pill-btn" aria-label="Plan your journey">
                  <span className="how-cta-pill-text">PLAN YOUR JOURNEY</span>
                  <span className="how-cta-pill-circle" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M2.5 7H11.5M11.5 7L7.5 3M11.5 7L7.5 11"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </Link>
              </div>
            </div>

            {/* Bottom Navigation Arrows */}
            <div className="how-showcase-nav-row">
              <div className="how-showcase-nav-arrows">
                <button
                  type="button"
                  className="how-nav-arrow-btn"
                  onClick={handlePrev}
                  aria-label="Previous journey step"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="how-nav-arrow-btn"
                  onClick={handleNext}
                  aria-label="Next journey step"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
