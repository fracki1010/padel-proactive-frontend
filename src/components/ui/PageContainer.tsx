import type { ReactNode } from "react";
import { cn } from "@heroui/react";

type Animation = "fade" | "slide-right" | "slide-bottom";
type Responsive = "desktop" | "mobile" | "both";

interface PageContainerProps {
  children: ReactNode;
  /** Animation variant — defaults to 'fade' */
  animation?: Animation;
  /** Responsive visibility — defaults to 'both' (visible everywhere) */
  responsive?: Responsive;
  /** Escape hatch for additional classes */
  className?: string;
}

const animationClasses: Record<Animation, string> = {
  fade: "fade-in",
  "slide-right": "slide-in-from-right-10",
  "slide-bottom": "slide-in-from-bottom-4",
};

const responsiveClasses: Record<Responsive, string> = {
  desktop: "hidden lg:block",
  mobile: "lg:hidden",
  both: "",
};

export function PageContainer({
  children,
  animation = "fade",
  responsive = "both",
  className,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "space-y-6 animate-in duration-500",
        animationClasses[animation],
        responsiveClasses[responsive],
        className,
      )}
    >
      {children}
    </div>
  );
}
