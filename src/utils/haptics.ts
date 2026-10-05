/**
 * Haptic feedback helper for the installed PWA.
 *
 * Uses the Vibration API when the device supports it and silently no-ops
 * everywhere else (desktop browsers, iOS Safari, devices without a motor).
 * The user's reduced-motion preference is treated as an accessibility guard.
 */

export type HapticPattern = number | number[];

/** Short tick used for lightweight interactions such as selecting a slot. */
export const HAPTIC_TAP: HapticPattern = 10;

/** Confirmation pattern fired once a booking is created successfully. */
export const HAPTIC_BOOKING_CONFIRMED: HapticPattern = [10, 40, 20];

const supportsVibration = (): boolean =>
  typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Triggers a vibration pattern when the device supports it.
 * Returns `true` when the vibration was dispatched, `false` otherwise.
 */
export const vibrate = (pattern: HapticPattern): boolean => {
  if (!supportsVibration() || prefersReducedMotion()) {
    return false;
  }

  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
};
