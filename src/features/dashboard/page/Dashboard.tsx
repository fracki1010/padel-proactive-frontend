import { useEffect, useState } from "react";

import { DashboardDesktopView } from "./DashboardDesktopView";
import { DashboardMobileView } from "./DashboardMobileView";

interface DashboardProps {
  courts: any[];
  onBookingClick: (booking: any) => void;
}

export const Dashboard = ({ courts, onBookingClick }: DashboardProps) => {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 1024px)").matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
    };

    setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  if (isDesktop) {
    return <DashboardDesktopView courts={courts} onBookingClick={onBookingClick} />;
  }

  return <DashboardMobileView courts={courts} onBookingClick={onBookingClick} />;
};

