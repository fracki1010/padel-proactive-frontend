import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Resets the scroll to the top on every NEW navigation (push/replace — clicking a
 * tab, opening a screen) but leaves the position untouched when the browser
 * navigates back/forward (POP), so "atrás" returns to where the user was.
 *
 * The app scrolls the window (no internal scroll container), plus the profile
 * drawer which has its own scrollable body.
 */
export const ScrollToTop = () => {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === "POP") return;

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    const containers = ["profile-drawer-body", "app-main-scroll"];
    for (const id of containers) {
      document.getElementById(id)?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [location.pathname, navigationType]);

  return null;
};
