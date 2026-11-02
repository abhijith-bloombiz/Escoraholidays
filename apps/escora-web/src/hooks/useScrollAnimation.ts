import { useState, useEffect, useRef, type RefObject } from 'react';

/**
 * Hook for smooth parallax scroll effects.
 * @param speed - The parallax speed factor (e.g. 0.18)
 * @returns Ref to attach to the container, and the calculated Y offset
 */
export function useParallax<T extends HTMLElement = HTMLElement>(speed = 0.2): [RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [offset, setOffset] = useState<number>(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            // Calculate how far the element is from the top of the viewport
            const scrolled = -rect.top;
            setOffset(scrolled * speed);
          } else {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            setOffset(scrollTop * speed);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [speed]);

  return [ref, offset];
}

export interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  reEnter?: boolean;
}

/**
 * Hook for intersection observer reveal animation on scroll.
 * Supports bi-directional reveal on both scroll down and scroll up.
 */
export function useScrollReveal<T extends HTMLElement = HTMLElement>({
  threshold = 0.12,
  rootMargin = '0px 0px -40px 0px',
  reEnter = true
}: ScrollRevealOptions = {}): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (!reEnter) {
          observer.unobserve(element);
        }
      } else if (reEnter) {
        // Only reset if the element is below the viewport (scrolling back up before seeing it).
        // Never reset when the element has scrolled past through the top of the viewport (rect.top <= 0),
        // which completely eliminates the infinite translateY oscillation / card shaking when only the bottom 2% is visible!
        const rect = entry.boundingClientRect;
        if (rect.top > 0) {
          setIsVisible(false);
        }
      }
    }, { threshold, rootMargin });

    observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [threshold, rootMargin, reEnter]);

  return [ref, isVisible];
}

/**
 * Page-level hook that automatically observes all reveal elements on public pages.
 * Supports bi-directional animations on both SCROLL DOWN and SCROLL UP.
 * When elements enter the visible viewport (coming from below or above), they animate into view.
 * When they scroll out of the viewport, they reset so they animate again on re-entry.
 */
export function usePageScrollReveal(containerRef?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = containerRef?.current || document;

    const selector = [
      '.reveal-fade-up',
      '.reveal-fade-down',
      '.reveal-fade-left',
      '.reveal-fade-right',
      '.reveal-scale-up',
      '.reveal-pop',
      '.reveal-card',
      '.reveal-text',
      '.reveal-item',
      '.anim-hero-badge',
      '.anim-hero-title',
      '.anim-hero-desc',
      '.anim-hero-search'
    ].join(', ');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            entry.target.classList.add('is-revealed');
          } else {
            // Scrolled out of view (either above or below) -> reset for bi-directional re-animation
            entry.target.classList.remove('in-view');
            entry.target.classList.remove('is-revealed');
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px', // Waits until element is 40px inside viewport
      }
    );

    const observeAll = () => {
      const els = root.querySelectorAll<HTMLElement>(selector);
      els.forEach((el) => {
        observer.observe(el);
      });
    };

    observeAll();
    const timer = setTimeout(observeAll, 120);

    const mutationObserver = new MutationObserver(() => {
      observeAll();
    });

    const targetNode = containerRef?.current || document.body;
    if (targetNode) {
      mutationObserver.observe(targetNode, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [containerRef]);
}


