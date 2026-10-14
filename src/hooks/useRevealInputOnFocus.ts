/**
 * Mobile keyboards overlap bottom-sheet drawers: once the keyboard opens, the
 * focused input can end up hidden behind it.
 *
 * Return this handler from an input's `onFocus` and the field scrolls into view
 * ~300ms later, after the keyboard has settled.
 */
export function useRevealInputOnFocus() {
  return (event: { target: unknown }) => {
    const element = event.target as HTMLElement | null;
    window.setTimeout(() => {
      element?.scrollIntoView?.({ block: "center", behavior: "smooth" });
    }, 300);
  };
}
