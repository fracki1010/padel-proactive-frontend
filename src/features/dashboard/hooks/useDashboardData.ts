import { useCallback, useEffect, useMemo, useState } from "react";

import { useBookings, useSlots } from "../../../hooks/useData";
import type { TimeSlot } from "../../../types";
import { getTodayIsoLocal, toIsoDateKey } from "../../../utils/formatters";
import { slotsForCourt } from "../../../utils/slots";
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

// Apply the active time-of-day filter to a slot list.
const filterByTimeOfDay = (
  list: TimeSlot[],
  filter: string,
): TimeSlot[] => {
  return list.filter((slot) => {
    const startHour = parseInt(slot.startTime.split(":")[0]);
    if (filter === "morning") return startHour < 12;
    if (filter === "afternoon") return startHour >= 12 && startHour < 18;
    if (filter === "night") return startHour >= 18;
    return true;
  });
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

  const filteredSlots = useMemo(
    () => filterByTimeOfDay(slots, activeFilter),
    [slots, activeFilter],
  );

  // Effective schedule per court: apply the override rule on the COMPLETE slot
  // list FIRST (a court with its own active slots ignores the general set;
  // otherwise it falls back to the general slots), THEN apply the time-of-day
  // filter within that effective set. Deciding the override on the already
  // filtered set would make a court wrongly fall back to the general slots
  // whenever the filter excluded its own slots.
  const effectiveSlotsByCourt = useMemo(() => {
    const map: Record<string, TimeSlot[]> = {};
    for (const court of courts) {
      map[court._id] = slotsForCourt(court._id, slots);
    }
    return map;
  }, [courts, slots]);

  const slotsByCourt = useMemo(() => {
    const map: Record<string, TimeSlot[]> = {};
    for (const court of courts) {
      map[court._id] = filterByTimeOfDay(
        effectiveSlotsByCourt[court._id] ?? [],
        activeFilter,
      );
    }
    return map;
  }, [courts, effectiveSlotsByCourt, activeFilter]);

  const slotsFor = useCallback(
    (courtId: string): TimeSlot[] => slotsByCourt[courtId] ?? [],
    [slotsByCourt],
  );

  const slotCounts = useMemo(() => {
    const counts = {
      all: 0,
      morning: 0,
      afternoon: 0,
      night: 0,
    };

    // Count DISTINCT effective start times across every court's effective
    // schedule (before the time-of-day filter, so each chip shows its own
    // bucket). Deduping by startTime keeps a time that is both a general slot
    // and a court-owned slot from being counted twice.
    const seenStartTimes = new Set<string>();
    for (const court of courts) {
      for (const slot of effectiveSlotsByCourt[court._id] ?? []) {
        if (seenStartTimes.has(slot.startTime)) continue;
        seenStartTimes.add(slot.startTime);
        const startHour = parseInt(slot.startTime.split(":")[0]);
        if (startHour < 12) counts.morning += 1;
        else if (startHour < 18) counts.afternoon += 1;
        else counts.night += 1;
      }
    }
    counts.all = seenStartTimes.size;

    return counts;
  }, [courts, effectiveSlotsByCourt]);

  const getSlotBookings = (slotId: string, courtId: string) => {
    return dashboardBookings.filter(
      (booking: any) =>
        toIsoDateKey(booking.date) === selectedDate &&
        booking.court?._id === courtId &&
        booking.timeSlot?._id === slotId,
    );
  };

  const stats = useMemo(() => {
    let totalSlots = 0;
    let takenSlots = 0;
    let suspendedSlots = 0;

    courts.forEach((court) => {
      const courtSlots = slotsByCourt[court._id] ?? [];
      totalSlots += courtSlots.length;
      courtSlots.forEach((slot) => {
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
  }, [courts, slotsByCourt, dashboardBookings, selectedDate]);

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
    slotsByCourt,
    slotsFor,
    slotCounts,
    stats,
    fixedKeys,
    isLoading: isLoadingSlots || isLoadingBookings,
    getSlotBookings,
  };
};

