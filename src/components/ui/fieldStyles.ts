/**
 * Shared HeroUI form-control styling so every field looks the same.
 *
 * The subtle inset definition, uniform radius and the primary (cyan) focus
 * treatment are applied globally in `src/index.css` via HeroUI's stable data
 * attributes. These classNames cover the remaining per-usage surface:
 * background, padding, height and muted placeholder for fields that do not
 * pass `classNames` of their own.
 *
 * Height scale (touch-safe, >= 44px) — shared with `tailwind.config.js`
 * (`control-sm|md|lg`) and `src/index.css` (`--control-height-*`):
 *   sm -> 44px (control-sm)
 *   md -> 48px (control-md)
 *   lg -> 56px (control-lg)
 */
export type FieldSize = "sm" | "md" | "lg";

// `!` (important) is required because HeroUI's own variant utilities
// (`bg-default-100`, `h-8`, `min-h-8`, ...) are emitted after these and would
// otherwise win on equal specificity. Radius and the primary focus treatment
// are owned globally by `src/index.css`.
const SURFACE = "!bg-black/5 dark:!bg-white/5 border-none px-4";

const HEIGHT: Record<FieldSize, string> = {
  sm: "!h-control-sm !min-h-control-sm",
  md: "!h-control-md !min-h-control-md",
  lg: "!h-control-lg !min-h-control-lg",
};

const INPUT_TEXT = "text-foreground placeholder:text-gray-500";

export const fieldInputClassNames: Record<
  FieldSize,
  { inputWrapper: string; input: string }
> = {
  sm: { inputWrapper: `${SURFACE} ${HEIGHT.sm}`, input: INPUT_TEXT },
  md: { inputWrapper: `${SURFACE} ${HEIGHT.md}`, input: INPUT_TEXT },
  lg: { inputWrapper: `${SURFACE} ${HEIGHT.lg}`, input: INPUT_TEXT },
};

export const fieldSelectClassNames: Record<
  FieldSize,
  { trigger: string }
> = {
  sm: { trigger: `${SURFACE} ${HEIGHT.sm}` },
  md: { trigger: `${SURFACE} ${HEIGHT.md}` },
  lg: { trigger: `${SURFACE} ${HEIGHT.lg}` },
};
