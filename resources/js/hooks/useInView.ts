import { useEffect, useRef, useState } from 'react';

interface UseInViewOptions {
  /** Margin around the root, e.g. trigger slightly before an element is fully on screen. */
  rootMargin?: string;
  /** Fraction of the target visible before it counts as in view. */
  threshold?: number;
  /** When true (default) the element reveals once and stays revealed. */
  once?: boolean;
}

/**
 * Reports when the referenced element scrolls into the viewport, via
 * IntersectionObserver. Used by the landing scroll-reveal (`Reveal.tsx`).
 *
 * Fail-safe: content is never left permanently hidden. A short `setTimeout`
 * (which fires even in environments that never produce animation frames, so
 * IntersectionObserver/rAF never fire) reveals anything already on screen; the
 * observer still drives the scroll-in animation for below-the-fold content in
 * normal browsers.
 */
export const useInView = <T extends Element = HTMLDivElement>(
  options: UseInViewOptions = {},
) => {
  const {
    rootMargin = '0px 0px -10% 0px',
    threshold = 0.15,
    once = true,
  } = options;
  const ref = useRef<T | null>(null);
  // Degrade to immediately-visible where IntersectionObserver is unavailable,
  // set as the initial value so the effect never has to setState synchronously.
  const [inView, setInView] = useState(
    () => typeof IntersectionObserver === 'undefined',
  );

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Fail-safe: reveal immediately if the element is already within the
    // viewport, so above-the-fold content shows without waiting on (or in spite
    // of a non-firing) IntersectionObserver.
    const failSafe = window.setTimeout(() => {
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) setInView(true);
    }, 0);

    if (typeof IntersectionObserver === 'undefined') {
      return () => window.clearTimeout(failSafe);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(node);
    return () => {
      window.clearTimeout(failSafe);
      observer.disconnect();
    };
  }, [rootMargin, threshold, once]);

  return { ref, inView } as const;
};
