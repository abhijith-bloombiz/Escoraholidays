import { useEffect } from "react";

export function useScrollReveal() {
  useEffect(() => {
    const opts: IntersectionObserverInit = {
      root: null,
      rootMargin: "0px 0px -60px 0px",
      threshold: 0.08,
    };

    const obs1 = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("is-revealed");
      });
    }, opts);

    const obs2 = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("in");
      });
    }, opts);

    function observeExisting() {
      document.querySelectorAll(".reveal-up:not([data-observed])").forEach((el) => {
        (el as HTMLElement).dataset.observed = "1";
        obs1.observe(el);
      });
      document.querySelectorAll(".reveal, .mask-reveal, .image-reveal").forEach((el) => {
        obs2.observe(el);
      });
    }

    observeExisting();

    // Watch for dynamically added elements (e.g. posts loaded from API)
    const mut = new MutationObserver(() => observeExisting());
    mut.observe(document.body, { childList: true, subtree: true });

    return () => {
      obs1.disconnect();
      obs2.disconnect();
      mut.disconnect();
    };
  }, []);
}
