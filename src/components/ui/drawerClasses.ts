/**
 * Shared classes for mobile bottom-sheet drawers.
 *
 * Every bottom sheet caps its height so it never covers the whole viewport: the
 * sheet takes at most 3/4 of the visible height and its body scrolls internally.
 * Desktop right-side drawers keep full height, so these classes only apply to
 * the mobile/bottom branch.
 */
export const MOBILE_DRAWER_MAX_HEIGHT = "!max-h-[75dvh]";

/** Cap + clipping for the `DrawerContent` wrapper of a mobile bottom sheet. */
export const MOBILE_DRAWER_CONTENT = `${MOBILE_DRAWER_MAX_HEIGHT} overflow-hidden`;
