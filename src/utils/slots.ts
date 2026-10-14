import type { TimeSlot } from "../types";

// A slot's owning court id (empty string for a GENERAL slot).
export const slotCourtId = (slot: Pick<TimeSlot, "court">): string =>
  slot.court ? String(slot.court) : "";

// Only the GENERAL slots (court == null) shown in the global schedule view.
export const generalSlots = (slots: TimeSlot[]): TimeSlot[] =>
  slots.filter((slot) => !slotCourtId(slot));

// The slots OWNED by a court (regardless of whether the court also falls back
// to the general set).
export const ownSlotsForCourt = (
  courtId: string,
  slots: TimeSlot[],
): TimeSlot[] => slots.filter((slot) => slotCourtId(slot) === String(courtId));

// OVERRIDE RULE: a court with its own active slots ignores the general set;
// otherwise it falls back to the general slots. Mirrors the backend rule so the
// admin booking form and the fixed-turn modal offer the exact same options the
// availability endpoint would.
export const slotsForCourt = (
  courtId: string | null | undefined,
  slots: TimeSlot[],
): TimeSlot[] => {
  if (!courtId) return generalSlots(slots);
  const own = ownSlotsForCourt(courtId, slots);
  return own.length > 0 ? own : generalSlots(slots);
};

// "HH:MM – HH:MM" label, deriving the end from the duration when the stored
// endTime is missing (legacy rows) so the UI never renders a dangling dash.
export const formatSlotRange = (slot: TimeSlot): string => {
  const end = slot.endTime || deriveEndTimeLabel(slot.startTime, slot.durationMinutes);
  return end ? `${slot.startTime} – ${end}` : slot.startTime;
};

const deriveEndTimeLabel = (
  startTime: string,
  durationMinutes?: number | null,
): string => {
  if (!durationMinutes || durationMinutes <= 0) return "";
  const [hours, minutes] = String(startTime).split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return "";
  const total = (((hours * 60 + minutes + durationMinutes) % 1440) + 1440) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
