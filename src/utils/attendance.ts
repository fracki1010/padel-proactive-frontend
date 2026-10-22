import type { ComponentProps } from "react";

export type AttendanceStatus = "unmarked" | "attended" | "absent";

type BookingLike = {
  date?: string | Date | null;
  timeSlot?: { startTime?: string | null } | null;
  attendanceStatus?: AttendanceStatus | string | null;
};

export type AttendanceDisplay = {
  label: string;
  tone: "success" | "danger" | "default";
};

/**
 * Attendance shown in the admin panel. The bot only knows whether the client
 * SAID they would come; the real "vino / no vino" is marked by the club
 * (`attendanceStatus`). Until it is marked, a past turn reads "Sin marcar".
 */
export const resolveAttendanceDisplay = (
  booking: BookingLike,
  now: Date = new Date(),
): AttendanceDisplay => {
  const status = booking?.attendanceStatus;

  if (status === "attended") return { label: "Asistió", tone: "success" };
  if (status === "absent") return { label: "No asistió", tone: "danger" };

  const slot = booking?.timeSlot?.startTime;
  const date = booking?.date;
  if (date && slot) {
    const [hours, minutes] = String(slot).split(":").map(Number);
    const start = new Date(date);
    start.setHours(hours || 0, minutes || 0, 0, 0);
    if (start.getTime() > now.getTime()) return { label: "Pendiente", tone: "default" };
  }

  return { label: "Sin marcar", tone: "default" };
};

export const attendanceToneClasses: Record<
  AttendanceDisplay["tone"],
  string
> = {
  success: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  danger: "bg-red-500/20 text-red-300 border border-red-500/30",
  default: "bg-black/5 dark:bg-white/10 text-on-surface-variant border border-black/10 dark:border-white/10",
};

export type IconProps = ComponentProps<"svg">;
