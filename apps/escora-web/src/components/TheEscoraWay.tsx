import React, { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import "./TheEscoraWay.css";

/* Local assets */
import escoraWayHeroImg from "@assets/escora/escora-way-hero.jpg";
import munnarThumb from "@assets/escora/collections/munnar-tea-estate.jpeg";
import backwaterThumb from "@assets/escora/collections/alleppey-backwaters.jpeg";

export default function TheEscoraWay() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  /* Viewport reveal animation */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    const revealElements = section.querySelectorAll(".escora-way-reveal");
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  /* Close video on Escape key */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsVideoOpen(false);
      }
    };
    if (isVideoOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isVideoOpen]);

  return (
    <section
      className="escora-way-section"
      id="the-escora-way"
      aria-label="The Escora Way"
      ref={sectionRef}
    >
      {/* Background ambient warm glows */}
      <div className="escora-way-glow-left" aria-hidden="true" />
      <div className="escora-way-glow-right" aria-hidden="true" />

      {/* Subtle organic wash watermarks */}
      <svg
        className="escora-way-watermark-left"
        viewBox="0 0 200 260"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M20,240 C60,180 30,100 90,60 C150,20 180,70 170,140 C160,210 110,250 20,240 Z"
          fill="#B58D5D"
        />
      </svg>
      <svg
        className="escora-way-watermark-right"
        viewBox="0 0 200 260"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M180,30 C120,80 150,160 90,200 C30,240 10,190 20,120 C30,50 80,10 180,30 Z"
          fill="#B58D5D"
        />
      </svg>

      {/* Editorial Section Index Indicator matching reference */}
      <div className="escora-way-index-indicator" aria-hidden="true">
        <span className="escora-way-index-num">02</span>
        <div className="escora-way-index-dots">
          <span className="dot dot-faint" />
          <span className="dot dot-active" />
          <span className="dot dot-faint" />
        </div>
      </div>

      <div className="escora-way-wrap">
        <div className="escora-way-grid">
          {/* ── Left Column: Editorial Manifesto & CTA ── */}
          <div className="escora-way-left">
            <div className="escora-way-eyebrow escora-way-reveal">
              <span className="dot" />
              <span>THE ESCORA WAY</span>
            </div>

            <h2 className="escora-way-heading escora-way-reveal d1">
              <span className="escora-way-heading-line">More than</span>
              <span className="escora-way-heading-line italic-green">a destination,</span>
              <span className="escora-way-heading-line">a different way</span>
              <span className="escora-way-heading-line italic-gold">of travelling.</span>
            </h2>

            <div className="escora-way-body escora-way-reveal d2">
              <p>
                Escora creates private journeys for travellers who want to experience Kerala
                at their own pace — through places, people, flavours and moments that feel personal.
              </p>
              <p>
                From quiet backwaters to mist-covered mountains and coastal escapes, every journey
                is thoughtfully shaped around how you want to travel.
              </p>
            </div>

            <div className="escora-way-reveal d3">
              <Link href="/about" className="escora-way-cta" aria-label="Discover The Escora Way">
                <span>DISCOVER THE ESCORA WAY</span>
                <span className="escora-way-cta-arrow" aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          {/* ── Right Column: Scenic Arch Image & Story Card ── */}
          <div className="escora-way-right escora-way-reveal d2">
            <div className="escora-way-image-frame">
              {/* Grand Arch Houseboat Photograph */}
              <div className="escora-way-arch-wrap">
                <img
                  src={escoraWayHeroImg}
                  alt="A peaceful sunset aboard a traditional luxury Kerala kettuvallam houseboat along the tranquil backwaters"
                  className="escora-way-arch-img"
                  loading="lazy"
                />
              </div>

              {/* Floating Story Card */}
              <div className="escora-way-story-card">
                <div className="escora-way-story-text-col">
                  <p className="escora-way-story-tagline">
                    {"Thoughtfully crafted journeys,\naround you."}
                  </p>
                  <button
                    type="button"
                    className="escora-way-story-btn"
                    onClick={() => setIsVideoOpen(true)}
                    aria-label="Watch our Kerala journey story video"
                  >
                    <span className="escora-way-play-icon-wrap" aria-hidden="true">
                      <svg width="8" height="9" viewBox="0 0 8 9" fill="none">
                        <path d="M7 4.5L1 8V1L7 4.5Z" fill="#B58D5D" />
                      </svg>
                    </span>
                    <span>WATCH OUR STORY</span>
                  </button>
                </div>

                <div className="escora-way-story-thumbs">
                  <button
                    type="button"
                    className="escora-way-thumb-btn"
                    onClick={() => setIsVideoOpen(true)}
                    aria-label="Watch story: Munnar highland tea valleys"
                  >
                    <img src={munnarThumb} alt="Munnar green tea estate misty highlands" />
                    <span className="escora-way-thumb-play-overlay" aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M11 7L4.25 11V3L11 7Z" fill="#FFFFFF" />
                      </svg>
                    </span>
                  </button>

                  <button
                    type="button"
                    className="escora-way-thumb-btn"
                    onClick={() => setIsVideoOpen(true)}
                    aria-label="Watch story: Alleppey sunset backwaters"
                  >
                    <img src={backwaterThumb} alt="Alleppey traditional houseboat backwater sunset" />
                    <span className="escora-way-thumb-play-overlay" aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M11 7L4.25 11V3L11 7Z" fill="#FFFFFF" />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Story Video Modal ── */}
      {isVideoOpen && (
        <div
          className="escora-way-video-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Escora Kerala Story Video"
          onClick={() => setIsVideoOpen(false)}
        >
          <div
            className="escora-way-video-frame"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src="/BGVideo.mp4"
              poster="/hero-poster.jpg"
              controls
              autoPlay
              playsInline
            />
            <button
              type="button"
              className="escora-way-video-close"
              onClick={() => setIsVideoOpen(false)}
              aria-label="Close video"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
