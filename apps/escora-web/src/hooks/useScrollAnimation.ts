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
        setIsVisible(false);
      }
    }, { threshold, rootMargin });

    observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [threshold, rootMargin, reEnter]);

  return [ref, isVisible];
}
