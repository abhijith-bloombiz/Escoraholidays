import { useEffect } from "react";

export const PORTAL_CARD_SELECTORS = [
  ".why-card",
  ".rcard",
  ".t2card",
  ".process-step",
  ".stat-cell",
  ".explore-card:not(.coverflow-card)",
  ".dest-card",
  ".pkg-card",
  ".pkg2-card",
  ".p2card",
  ".v3-tile",
  ".v3-retreat-card",
  ".v3-way-card",
  ".v3-explore-card",
  ".v3-stat",
  ".about-founder-card",
  ".about-team-card",
  ".jd-author-card",
  ".jd-rcard",
  ".portal-card",
  ".scale-card",
  "[data-scale-card]",
].join(", ");

export const PORTAL_HEADING_SELECTORS = [
  ".rv",
  ".reveal-up:not(.portal-card):not(.dest-card):not(.pkg-card):not(.v3-tile)",
  ".heading-reveal",
  ".reveal-heading",
  ".cat-section-head > div > *",
  ".why-escora-head > *",
  ".process-head > *",
  ".retreat2 .head > div > *",
  ".retreat2 .head > .rv",
  ".testi2 .head > *",
  ".cta2 .left > *",
  "section h1:not(.hero-editorial *):not(.hero2 *):not(.hero-main-title-sr):not(.escora-clip-char):not(.portal-card *):not(.v3-tile *)",
  "section h2:not(.hero-editorial *):not(.hero2 *):not(.v3-tile *):not(.rcard *):not(.why-card *):not(.process-step *):not(.stat-cell *):not(.t2card *):not(.portal-card *):not(.dest-card *):not(.pkg-card *)",
  ".v3dest-hero > *",
  ".v3dest-cta > *",
  ".v3dest-eyebrow",
  ".eyebrow:not(.hero-editorial *):not(.hero2 *)",
  ".s-head > *",
].join(", ");

export function useScrollReveal() {
  useEffect(() => {
    const cardOpts: IntersectionObserverInit = {
      root: null,
      rootMargin: "0px 0px -40px 0px",
      threshold: [0, 0.12],
    };

    const textOpts: IntersectionObserverInit = {
      root: null,
      rootMargin: "0px 0px -50px 0px",
      threshold: [0, 0.08],
    };

    const headingOpts: IntersectionObserverInit = {
      root: null,
      rootMargin: "0px 0px -40px 0px",
      threshold: [0, 0.08],
    };

    /* Card observer: bidirectional 0% to 100% scale reveal (always animates on scroll forward and backward) */
    const cardObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("card-in-view", "in");
        } else {
          // Never reset elements inside the hero header
          if (!e.target.closest(".hero-editorial, .hero2, .v3-hero")) {
            e.target.classList.remove("card-in-view", "in");
          }
        }
      });
    }, cardOpts);

    /* Heading observer: smooth luxury transition (bidirectional on scroll) */
    const headingObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("heading-in-view", "in", "is-revealed");
        } else {
          if (!e.target.closest(".hero-editorial, .hero2, .v3-hero")) {
            e.target.classList.remove("heading-in-view", "in", "is-revealed");
          }
        }
      });
    }, headingOpts);

    /* Text & general element observer: bidirectional */
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-revealed", "in");
        } else {
          if (!e.target.closest(".hero-editorial, .hero2, .v3-hero")) {
            e.target.classList.remove("is-revealed", "in");
          }
        }
      });
    }, textOpts);

    function observeElements() {
      // Observe all cards across public portal
      document.querySelectorAll(PORTAL_CARD_SELECTORS).forEach((el) => {
        if (!(el as HTMLElement).dataset.cardObserved) {
          (el as HTMLElement).dataset.cardObserved = "1";
          cardObs.observe(el);
        }
      });

      // Observe all headings across public portal
      document.querySelectorAll(PORTAL_HEADING_SELECTORS).forEach((el) => {
        if (!(el as HTMLElement).dataset.headingObserved && !el.matches(PORTAL_CARD_SELECTORS)) {
          (el as HTMLElement).dataset.headingObserved = "1";
          el.classList.add("heading-reveal");
          headingObs.observe(el);
        }
      });

      // Observe general reveal elements (if not already handled)
      document.querySelectorAll(".reveal-up, .reveal, .mask-reveal, .image-reveal").forEach((el) => {
        if (
          !(el as HTMLElement).dataset.revealObserved &&
          !(el as HTMLElement).dataset.headingObserved &&
          !el.matches(PORTAL_CARD_SELECTORS)
        ) {
          (el as HTMLElement).dataset.revealObserved = "1";
          revealObs.observe(el);
        }
      });
    }

    observeElements();

    // Dynamically watch for added elements (route changes, API fetch responses)
    const mut = new MutationObserver(() => observeElements());
    mut.observe(document.body, { childList: true, subtree: true });

    return () => {
      cardObs.disconnect();
      headingObs.disconnect();
      revealObs.disconnect();
      mut.disconnect();
    };
  }, []);
}
