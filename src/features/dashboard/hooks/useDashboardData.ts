import { useEffect, useMemo, useState } from "react";

import { useBookings, useSlots } from "../../../hooks/useData";
import { getTodayIsoLocal, toIsoDateKey } from "../../../utils/formatters";

const DASHBOARD_SELECTED_DATE_KEY = "padexa:dashboard-selected-date";
const DASHBOARD_ACTIVE_FILTER_KEY = "padexa:dashboard-active-filter";
const ALLOWED_DASHBOARD_FILTERS = new Set([
  "all",
  "morning",
  "afternoon",
  "night",
]);

const readStoredDashboardDate = () => {
  if (typeof window === "undefined") return getTodayIsoLocal();
  const storedDate = window.localStorage.getItem(DASHBOARD_SELECTED_DATE_KEY);
  if (
    typeof storedDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(storedDate.trim())
  ) {
    return storedDate;
  }
  return getTodayIsoLocal();
};

const readStoredDashboardFilter = () => {
  if (typeof window === "undefined") return "all";
  const storedFilter = window.localStorage.getItem(DASHBOARD_ACTIVE_FILTER_KEY);
  if (typeof storedFilter === "string" && ALLOWED_DASHBOARD_FILTERS.has(storedFilter)) {
    return storedFilter;
  }
  return "all";
};

export const useDashboardData = () => {
  const [selectedDate, setSelectedDate] = useState(readStoredDashboardDate);
  const [activeFilter, setActiveFilter] = useState(readStoredDashboardFilter);
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

  const slotCounts = useMemo(() => {
    const counts = {
      all: slots.length,
      morning: 0,
      afternoon: 0,
      night: 0,
    };

    for (const slot of slots) {
      const startHour = parseInt(slot.startTime.split(":")[0]);
      if (startHour < 12) counts.morning += 1;
      else if (startHour < 18) counts.afternoon += 1;
      else counts.night += 1;
    }

    return counts;
  }, [slots]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DASHBOARD_SELECTED_DATE_KEY, selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DASHBOARD_ACTIVE_FILTER_KEY, activeFilter);
  }, [activeFilter]);

  const getSlotBookings = (slotId: string, courtId: string) => {
    return dashboardBookings.filter(
      (booking: any) =>
        toIsoDateKey(booking.date) === selectedDate &&
        booking.court?._id === courtId &&
        booking.timeSlot?._id === slotId,
    );
  };

  return {
    selectedDate,
    setSelectedDate,
    activeFilter,
    setActiveFilter,
    filteredSlots,
    slotCounts,
    isLoading: isLoadingSlots || isLoadingBookings,
    getSlotBookings,
  };
};

