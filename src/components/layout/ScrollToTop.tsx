import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Reset the scroll position to the top whenever the route changes. */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}
