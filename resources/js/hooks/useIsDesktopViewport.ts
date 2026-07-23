import { useEffect, useState } from 'react';

/** Below this width the app's fixed-width, desktop-only layout breaks down. */
const MIN_DESKTOP_WIDTH = 1024;

/**
 * Reports whether the viewport is wide enough for this app's desktop-only
 * layout (no responsive breakpoints exist below `lg`). Backed by
 * `matchMedia` so it reacts instantly to window resizes and OS-level
 * orientation changes, not just a debounced `resize` listener.
 */
export const useIsDesktopViewport = (): boolean => {
  const [isDesktop, setIsDesktop] = useState(
    () => window.innerWidth >= MIN_DESKTOP_WIDTH,
  );

  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${MIN_DESKTOP_WIDTH}px)`);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
    };

    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  return isDesktop;
};
