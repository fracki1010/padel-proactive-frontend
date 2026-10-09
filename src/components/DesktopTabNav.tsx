import { Button } from "@heroui/react";
import { Calendar, CalendarClock, LayoutGrid, Plus, Users } from "lucide-react";
import { cn } from "@heroui/react";

type DesktopTabNavProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCreateBooking: () => void;
};

const tabs = [
  { id: "panel", label: "Panel", icon: LayoutGrid },
  { id: "reservas", label: "Reservas", icon: Calendar },
  { id: "turnos-fijos", label: "Turnos fijos", icon: CalendarClock },
  { id: "socios", label: "Socios", icon: Users },
];

export const DesktopTabNav = ({
  activeTab,
  onTabChange,
  onCreateBooking,
}: DesktopTabNavProps) => {
  return (
    <div className="hidden lg:flex items-center justify-between gap-4 w-full max-w-[1520px] mx-auto px-8 pt-5 pb-4 border-b border-black/5 dark:border-white/5">
      <div className="flex items-center gap-2 rounded-md border border-black/5 dark:border-white/5 bg-dark-100/70 p-1.5 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <Button
              key={tab.id}
              variant="light"
              startContent={<Icon size={16} />}
              className={cn(
                "h-11 px-4 rounded-xl font-bold transition-all whitespace-nowrap",
                isActive
                  ? "bg-primary text-black dark:text-white shadow-lg shadow-primary/20"
                  : "text-on-surface-variant hover:text-foreground",
              )}
              onPress={() => onTabChange(tab.id)}
            >
              {tab.label}
            </Button>
          );
        })}
      </div>

      <Button
        color="primary"
        className="h-11 px-5 rounded-xl text-on-primary font-black shadow-lg shadow-primary/20"
        startContent={<Plus size={18} />}
        onPress={onCreateBooking}
      >
        Nueva Reserva
      </Button>
    </div>
  );
};
