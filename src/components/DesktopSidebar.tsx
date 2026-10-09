import { Button } from "@heroui/react";
import {
  Calendar,
  CalendarClock,
  LayoutGrid,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@heroui/react";

type DesktopSidebarProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
};

const navItems = [
  { id: "panel", label: "Dashboard", icon: LayoutGrid },
  { id: "reservas", label: "Turnos", icon: Calendar },
  { id: "turnos-fijos", label: "Turnos fijos", icon: CalendarClock },
  { id: "socios", label: "Socios", icon: Users },
];

export const DesktopSidebar = ({
  activeTab,
  onTabChange,
  onOpenSettings,
  onLogout,
}: DesktopSidebarProps) => {
  return (
    <aside className="hidden lg:sticky lg:top-0 lg:h-dvh lg:self-start lg:flex flex-col border-r border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
      <div className="px-8 pt-9 pb-8 border-b border-[var(--md-sys-color-outline-variant)]">
        <h2 className="text-2xl font-black text-[var(--md-sys-color-primary)] italic tracking-tight uppercase">
          PADEXA
        </h2>
        <p className="md3-typescale-label-medium text-[var(--md-sys-color-on-surface-variant)] mt-2">
          Admin Console
        </p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <Button
              key={item.id}
              variant="light"
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "w-full justify-start h-12 rounded-full px-4 md3-typescale-label-large",
                isActive
                  ? "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]"
                  : "text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]",
              )}
              startContent={<Icon size={18} />}
              onPress={() => onTabChange(item.id)}
            >
              {item.label}
            </Button>
          );
        })}

        <Button
          variant="light"
          className="w-full justify-start h-12 rounded-full px-4 md3-typescale-label-large text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]"
          startContent={<Settings size={18} />}
          onPress={onOpenSettings}
        >
          Configuración
        </Button>
      </nav>

      <div className="p-4 border-t border-[var(--md-sys-color-outline-variant)]">
        <Button
          variant="light"
          className="w-full justify-start h-12 rounded-full px-4 md3-typescale-label-large text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-surface-container-high)]"
          startContent={<LogOut size={18} />}
          onPress={onLogout}
        >
          Cerrar Sesión
        </Button>
      </div>
    </aside>
  );
};
