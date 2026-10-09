import { useEffect, useMemo, useState } from "react";

import { useBookings, useSlots } from "../../../hooks/useData";
import { getTodayIsoLocal, toIsoDateKey } from "../../../utils/formatters";
import { useFixedBookings } from "../../fixed-bookings/hooks/useFixedBookings";

type Court = { _id: string;[key: string]: any };

const refId = (ref: { _id: string } | string | null | undefined): string => {
  if (!ref) return "";
  return typeof ref === "string" ? ref : ref._id;
};

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

export const useDashboardData = (courts: Court[] = []) => {
  const [selectedDate, setSelectedDate] = useState(readStoredDashboardDate);
  const [activeFilter, setActiveFilter] = useState(readStoredDashboardFilter);
  const { data: slotsData, isLoading: isLoadingSlots } = useSlots();
  const { data: bookingsData, isLoading: isLoadingBookings } = useBookings(selectedDate);
  const { data: fixedBookingsData } = useFixedBookings();

  const slots = slotsData?.data || [];
  const dashboardBookings = bookingsData?.data || [];

  // Active fixed weekly turns block their court+slot for the selected date's
  // weekday. Keys use the backend format `String(courtId)_String(timeSlotId)`.
  // Date-only strings parse as UTC midnight, so getUTCDay() matches the
  // backend's UTC weekday derivation for the same calendar date.
  const fixedKeys = useMemo(() => {
    const weekday = new Date(selectedDate).getUTCDay();
    const keys = new Set<string>();
    for (const fixedBooking of fixedBookingsData?.data ?? []) {
      if (fixedBooking.status !== "active") continue;
      if (fixedBooking.weekday !== weekday) continue;
      const courtId = refId(fixedBooking.court);
      const slotId = refId(fixedBooking.timeSlot);
      if (courtId && slotId) keys.add(`${courtId}_${slotId}`);
    }
    return keys;
  }, [fixedBookingsData, selectedDate]);

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

  const getSlotBookings = (slotId: string, courtId: string) => {
    return dashboardBookings.filter(
      (booking: any) =>
        toIsoDateKey(booking.date) === selectedDate &&
        booking.court?._id === courtId &&
        booking.timeSlot?._id === slotId,
    );
  };

  const stats = useMemo(() => {
    const totalSlots = courts.length * filteredSlots.length;
    let takenSlots = 0;
    let suspendedSlots = 0;

    courts.forEach((court) => {
      filteredSlots.forEach((slot) => {
        const bookings = getSlotBookings(slot._id, court._id);
        const activeBooking = bookings.find(
          (booking: any) => booking.status !== "cancelado",
        );
        if (!activeBooking) return;
        if (activeBooking.status === "suspendido") {
          suspendedSlots += 1;
          return;
        }
        takenSlots += 1;
      });
    });

    const availableSlots = Math.max(0, totalSlots - takenSlots - suspendedSlots);
    const occupancy =
      totalSlots > 0 ? Math.round((takenSlots / totalSlots) * 100) : 0;

    return { totalSlots, takenSlots, suspendedSlots, availableSlots, occupancy };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courts, filteredSlots, dashboardBookings, selectedDate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DASHBOARD_SELECTED_DATE_KEY, selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DASHBOARD_ACTIVE_FILTER_KEY, activeFilter);
  }, [activeFilter]);

  return {
    selectedDate,
    setSelectedDate,
    activeFilter,
    setActiveFilter,
    filteredSlots,
    slotCounts,
    stats,
    fixedKeys,
    isLoading: isLoadingSlots || isLoadingBookings,
    getSlotBookings,
  };
};

