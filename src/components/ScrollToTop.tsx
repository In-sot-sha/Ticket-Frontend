import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Routes that should keep scroll position (no jump to top). */
const SKIP_SCROLL_PATHS = new Set(['/', '/events']);

/**
 * Scrolls to the top on route change, except allowlisted pages
 * (home + events browse — preserve scroll while filtering/navigating back).
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    if (SKIP_SCROLL_PATHS.has(pathname)) return;
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
