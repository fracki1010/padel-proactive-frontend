import { Card, CardBody } from "@heroui/react";
import type { ReactNode } from "react";

type IconColor =
  | "primary"
  | "emerald"
  | "amber"
  | "violet"
  | "red"
  | "green"
  | "blue"
  | "orange";

export type StatCardProps = {
  icon?: ReactNode;
  label: string;
  value: string | number;
  iconColor?: IconColor;
  variant?: "default" | "mini" | "card";
  className?: string;
};

/**
 * Tailwind class pairs for each icon color.
 * Mapped statically so the JIT scanner can detect them at build time.
 */
const iconColorClasses: Record<IconColor, { bg: string; text: string }> = {
  primary: { bg: "bg-primary/15", text: "text-primary" },
  emerald: { bg: "bg-emerald-500/15", text: "text-emerald-300" },
  amber: { bg: "bg-amber-500/15", text: "text-amber-300" },
  violet: { bg: "bg-violet-500/15", text: "text-violet-300" },
  red: { bg: "bg-red-500/15", text: "text-red-300" },
  green: { bg: "bg-green-500/15", text: "text-green-300" },
  blue: { bg: "bg-blue-500/15", text: "text-blue-300" },
  orange: { bg: "bg-orange-500/15", text: "text-orange-300" },
};

export const StatCard = ({
  icon,
  label,
  value,
  iconColor = "primary",
  variant = "default",
  className = "",
}: StatCardProps) => {
  const colors = iconColorClasses[iconColor];

  if (variant === "mini") {
    return (
      <div
        className={`rounded-md border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 py-3 ${className}`}
      >
        <p className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant">
          {label}
        </p>
        <p className="text-xl font-black text-foreground">{value}</p>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <Card
        className={`bg-dark-200 border border-black/5 dark:border-white/5 ${className}`}
      >
        <CardBody className="p-4 flex flex-col justify-center">
          <p className="text-[10px] font-semibold text-primary tracking-wider">
            {label}
          </p>
          <p className="text-3xl font-black text-foreground">{value}</p>
        </CardBody>
      </Card>
    );
  }

  // default variant
  return (
    <div
      className={`rounded-md border border-black/10 dark:border-white/10 bg-dark-200 px-4 py-3 ${className}`}
    >
      {icon && (
        <div
          className={`w-8 h-8 rounded-lg ${colors.bg} ${colors.text} flex items-center justify-center mb-2`}
        >
          {icon}
        </div>
      )}
      <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
        {label}
      </p>
      <p className="text-2xl font-black text-foreground">{value}</p>
    </div>
  );
};
