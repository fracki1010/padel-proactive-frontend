import { useEffect, useRef, useState } from "react";

/**
 * Scroll distance (px) over which the hero fully contracts.
 *
 * The hero sits right below the 64px sticky header, so past this point the
 * expanded hero has scrolled out of view and the compact treatment is active.
 */
export const HERO_SCROLL_DISTANCE = 240;

/** Linear scroll fraction at which the compact header title starts to appear. */
const HERO_REVEAL_START = 0.72;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Deceleration curve — fast at the start, gently settling. Never a spring. */
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Drives the adaptive booking-portal hero from scroll position.
 *
 * Instead of re-rendering React on every scroll frame, it writes two CSS
 * custom properties on the attached element:
 *
 * - `--hero-p`: eased collapse progress (0 = expanded, 1 = compact), used by
 *   the hero to interpolate its height, padding and headline size.
 * - `--hero-reveal`: how visible the compact header title should be.
 *
 * Updates are throttled with `requestAnimationFrame`, so at most one write
 * happens per painted frame.
 *
 * When the user prefers reduced motion the size animation is skipped entirely
 * (the hero stays at full size) and the header title snaps in without a fade.
 *
 * Returns a callback ref to attach to the element that should receive the
 * variables (it can be any ancestor of the hero and the sticky header).
 */
export function useAdaptiveHero(): (node: HTMLElement | null) => void {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!node) return;

    const mediaQuery =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;

    const update = () => {
      frameRef.current = null;

      const linear = clamp01(window.scrollY / HERO_SCROLL_DISTANCE);
      const reduced = mediaQuery?.matches ?? prefersReducedMotion();

      if (reduced) {
        // No size animation: keep the hero expanded, reveal the title in one step.
        node.style.setProperty("--hero-p", "0");
        node.style.setProperty("--hero-reveal", linear >= 1 ? "1" : "0");
        return;
      }

      const progress = easeOutCubic(linear);
      const reveal = clamp01((linear - HERO_REVEAL_START) / (1 - HERO_REVEAL_START));

      node.style.setProperty("--hero-p", progress.toFixed(4));
      node.style.setProperty("--hero-reveal", reveal.toFixed(4));
    };

    const scheduleUpdate = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    mediaQuery?.addEventListener("change", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      mediaQuery?.removeEventListener("change", scheduleUpdate);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [node]);

  return setNode;
}
