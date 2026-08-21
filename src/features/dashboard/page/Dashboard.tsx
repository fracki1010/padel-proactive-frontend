import { useIsDesktop } from "../../../hooks/useIsDesktop";

import { DashboardDesktopView } from "./DashboardDesktopView";
import { DashboardMobileView } from "./DashboardMobileView";

interface DashboardProps {
  courts: any[];
  onBookingClick: (booking: any) => void;
}

export const Dashboard = ({ courts, onBookingClick }: DashboardProps) => {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return <DashboardDesktopView courts={courts} onBookingClick={onBookingClick} />;
  }

  return <DashboardMobileView courts={courts} onBookingClick={onBookingClick} />;
};

