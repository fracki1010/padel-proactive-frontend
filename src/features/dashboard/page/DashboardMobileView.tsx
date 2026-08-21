import { CourtsAvailability } from "../components/CourtsAvailability";
import { DashboardStats } from "../components/DashboardStats";
import { DateSelector } from "../components/DateSelector";
import { TimeFilterTabs } from "../components/TimeFilterTabs";
import { useDashboardData } from "../hooks/useDashboardData";

type DashboardMobileViewProps = {
  courts: any[];
  onBookingClick: (booking: any) => void;
};

export const DashboardMobileView = ({
  courts,
  onBookingClick,
}: DashboardMobileViewProps) => {
  const {
    selectedDate,
    setSelectedDate,
    activeFilter,
    setActiveFilter,
    slotCounts,
    filteredSlots,
    stats,
    isLoading,
    getSlotBookings,
  } = useDashboardData(courts);

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />

      <DashboardStats
        courts={courts.length}
        occupancy={stats.occupancy}
        availableSlots={stats.availableSlots}
        suspendedSlots={stats.suspendedSlots}
        variant="mobile"
      />

      <TimeFilterTabs
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={slotCounts}
      />

      <CourtsAvailability
        courts={courts}
        filteredSlots={filteredSlots}
        isLoading={isLoading}
        selectedDate={selectedDate}
        getSlotBookings={getSlotBookings}
        onBookingClick={onBookingClick}
      />
    </div>
  );
};

