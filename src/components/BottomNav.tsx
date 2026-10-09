import { Button } from "@heroui/react";
import { LayoutGrid, Calendar, Users, Wallet, Plus } from "lucide-react";
import { cn } from "@heroui/react";

interface BottomNavProps {
  activeTab?: string;
  isKeyboardOpen?: boolean;
  onTabChange?: (tab: string) => void;
}

export const BottomNav = ({
  activeTab = "panel",
  isKeyboardOpen = false,
  onTabChange,
}: BottomNavProps) => {
  const tabs = [
    { id: "panel", label: "Panel", icon: LayoutGrid },
    { id: "reservas", label: "Reservas", icon: Calendar },
    { id: "fab", isFab: true },
    { id: "socios", label: "Socios", icon: Users },
    { id: "caja", label: "Caja", icon: Wallet },
  ];

  return (
    <nav
      aria-label="Navegación principal"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 flex items-end justify-between gap-1 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] sm:px-6 app-bottom-nav transition-all duration-300 ease-[var(--md-sys-motion-emphasized)] lg:hidden",
        isKeyboardOpen
          ? "pointer-events-none translate-y-full opacity-0"
          : "translate-y-0 opacity-100",
      )}
    >
      {tabs.map((tab) => {
        if (tab.isFab) {
          return (
            <div key="fab-container" className="relative -top-6 sm:-top-8">
              <Button
                isIconOnly
                size="lg"
                aria-label="Nueva reserva"
                onClick={() => onTabChange?.("fab")}
                className="h-14 w-14 rounded-[var(--md-sys-shape-corner-large)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-lg shadow-black/25 sm:h-16 sm:w-16"
              >
                <Plus size={28} strokeWidth={3} />
              </Button>
            </div>
          );
        }

        const Icon = tab.icon!;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            aria-current={isActive ? "page" : undefined}
            onClick={() => onTabChange?.(tab.id!)}
            className={cn(
              "flex min-w-[64px] flex-col items-center gap-1 py-1 transition-colors duration-300 ease-[var(--md-sys-motion-emphasized)] active:scale-95",
              isActive
                ? "text-[var(--md-sys-color-on-surface)]"
                : "text-[var(--md-sys-color-on-surface-variant)]",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-16 items-center justify-center rounded-full transition-colors duration-300 ease-[var(--md-sys-motion-emphasized)]",
                isActive
                  ? "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]"
                  : "bg-transparent",
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            </span>
            <span className="md3-typescale-label-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
