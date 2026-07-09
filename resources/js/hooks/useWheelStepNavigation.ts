import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

/**
 * Minimum time between wheel-triggered navigation steps. A single trackpad
 * "flick" fires many small wheel events in quick succession — without a
 * cooldown, one scroll gesture would skip several steps instead of one.
 */
const WHEEL_COOLDOWN_MS = 350;

interface UseWheelStepNavigationOptions {
  onPrev: () => void;
  onNext: () => void;
  /**
   * When true, only step when the element is already scrolled to its top
   * (scrolling up further) or bottom (scrolling down further) — for
   * elements that also scroll their own content (e.g. the week view's
   * hour grid), so normal in-place scrolling isn't hijacked. Defaults to
   * false: every wheel event over the element steps, for elements with no
   * scrollable content of their own (e.g. the mini calendar, month grid).
   */
  requireScrollBoundary?: boolean;
}

/**
 * Attaches a native (non-passive) wheel listener to the returned ref's
 * element, so scrolling over it steps `onPrev`/`onNext` instead of — or, with
 * `requireScrollBoundary`, in addition to — scrolling the page. Native
 * because React's synthetic `onWheel` is passive by default, which silently
 * ignores `preventDefault()`.
 */
export const useWheelStepNavigation = <T extends HTMLElement>({
  onPrev,
  onNext,
  requireScrollBoundary = false,
}: UseWheelStepNavigationOptions): RefObject<T | null> => {
  const containerRef = useRef<T>(null);
  const lastWheelAt = useRef(0);
  const callbacksRef = useRef({ onPrev, onNext });

  useEffect(() => {
    callbacksRef.current = { onPrev, onNext };
  }, [onPrev, onNext]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;

      if (requireScrollBoundary) {
        const atTop = el.scrollTop <= 0;
        const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;

        if (e.deltaY < 0 && !atTop) return;
        if (e.deltaY > 0 && !atBottom) return;
      }

      e.preventDefault();

      const now = Date.now();
      if (now - lastWheelAt.current < WHEEL_COOLDOWN_MS) return;
      lastWheelAt.current = now;

      if (e.deltaY > 0) {
        callbacksRef.current.onNext();
      } else {
        callbacksRef.current.onPrev();
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [requireScrollBoundary]);

  return containerRef;
};
