import { useMemo, useState } from "react";

import { useSlots, useBookings } from "../../../hooks/useData";
import { CourtsAvailability } from "../components/CourtsAvailability";
import { DateSelector } from "../components/DateSelector";
import { TimeFilterTabs } from "../components/TimeFilterTabs";

interface DashboardProps {
  courts: any[];
  onBookingClick: (booking: any) => void;
}

export const Dashboard = ({ courts, onBookingClick }: DashboardProps) => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [activeFilter, setActiveFilter] = useState("afternoon");
  const { data: slotsData, isLoading: isLoadingSlots } = useSlots();
  const { data: bookingsData, isLoading: isLoadingBookings } = useBookings(selectedDate);

  const slots = slotsData?.data || [];
  const dashboardBookings = bookingsData?.data || [];

  const filteredSlots = useMemo(() => {
    return slots.filter((slot: any) => {
      const startHour = parseInt(slot.startTime.split(":")[0]);
      if (activeFilter === "morning") return startHour < 12;
      if (activeFilter === "afternoon") return startHour >= 12 && startHour < 18;
      if (activeFilter === "night") return startHour >= 18;
      return true;
    });
  }, [slots, activeFilter]);

  const getSlotBookings = (slotId: string, courtId: string) => {
    return dashboardBookings.filter(
      (booking: any) =>
        booking.date.startsWith(selectedDate) &&
        booking.court?._id === courtId &&
        booking.timeSlot?._id === slotId,
    );
  };

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      {/* <DashboardHeader /> */}

      <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />

      <TimeFilterTabs activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      <CourtsAvailability
        courts={courts}
        filteredSlots={filteredSlots}
        isLoading={isLoadingSlots || isLoadingBookings}
        selectedDate={selectedDate}
        getSlotBookings={getSlotBookings}
        onBookingClick={onBookingClick}
      />
    </div>
  );
};
