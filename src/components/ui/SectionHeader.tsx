import type { ReactNode } from "react";

export type SectionHeaderProps = {
  /** Small uppercase label above the title (e.g. "GESTIÓN DE RESERVAS") */
  eyebrow?: string;
  /** Main heading text */
  title: string;
  /** Optional description below the title */
  subtitle?: string;
  /** Optional badge/count displayed to the right */
  badge?: string | ReactNode;
  /** Optional action buttons displayed to the right */
  actions?: ReactNode;
  /** Semantic heading level (default: "h2") */
  headingLevel?: "h1" | "h2" | "h3";
  /** Extra classes for the outermost wrapper */
  className?: string;
};

const titleStyles: Record<"h1" | "h2" | "h3", string> = {
  h1: "text-3xl xl:text-4xl font-black text-foreground tracking-tight",
  h2: "text-3xl xl:text-4xl font-black text-foreground tracking-tight",
  h3: "text-xl font-bold text-foreground tracking-tight",
};

const eyebrowClass =
  "text-[11px] font-semibold uppercase tracking-wider text-primary/80";

const subtitleClass = "text-sm font-semibold text-gray-500 mt-1";

const compactSubtitleClass = "text-xs font-semibold text-gray-500 mt-1";

const badgeClass =
  "text-[10px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md";

export const SectionHeader = ({
  eyebrow,
  title,
  subtitle,
  badge,
  actions,
  headingLevel = "h2",
  className = "",
}: SectionHeaderProps) => {
  const HeadingTag = headingLevel;
  const hasRightSlot = badge || actions;

  // Compact layout when badge or actions are present
  if (hasRightSlot) {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        <div className="space-y-1">
          {eyebrow && <p className={eyebrowClass}>{eyebrow}</p>}
          <HeadingTag className={titleStyles[headingLevel]}>{title}</HeadingTag>
          {subtitle && <p className={compactSubtitleClass}>{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className={badgeClass}>{badge}</span>
          )}
          {actions}
        </div>
      </div>
    );
  }

  // Full-width layout (default)
  return (
    <div className={`space-y-1 ${className}`}>
      {eyebrow && <p className={eyebrowClass}>{eyebrow}</p>}
      <HeadingTag className={titleStyles[headingLevel]}>{title}</HeadingTag>
      {subtitle && <p className={subtitleClass}>{subtitle}</p>}
    </div>
  );
};
