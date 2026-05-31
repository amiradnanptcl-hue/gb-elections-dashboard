import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * On every client-side route change, scroll the window back to the top.
 *
 * Without this the React Router default is to preserve the previous
 * page's scroll position, so a visitor who scrolls halfway down /map
 * and then clicks "Anthems" lands halfway down the new page. The
 * fix is the standard SPA pattern: subscribe to pathname changes
 * and call window.scrollTo({ top: 0 }).
 *
 * Two notes on behaviour:
 *   - We use `behavior: "auto"` (the default), not "smooth", so the
 *     visitor lands at the top instantly. Smooth-scrolling the
 *     previous page out of view on every nav click is visually
 *     distracting and feels slower than it is.
 *   - We do NOT scroll on changes that carry a hash (e.g.
 *     /predictions#scenarios) so in-page anchor links still work.
 *
 * Mount once at the App root; component renders nothing.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
}
