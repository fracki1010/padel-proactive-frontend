import { Button } from "@heroui/react";
import {
  Calendar,
  LayoutGrid,
  LogOut,
  Settings,
  Users,
  Wallet,
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
  { id: "socios", label: "Socios", icon: Users },
  { id: "caja", label: "Caja", icon: Wallet },
];

export const DesktopSidebar = ({
  activeTab,
  onTabChange,
  onOpenSettings,
  onLogout,
}: DesktopSidebarProps) => {
  return (
    <aside className="hidden lg:sticky lg:top-0 lg:h-dvh lg:self-start lg:flex flex-col border-r border-black/10 dark:border-white/10 bg-dark-300/70 backdrop-blur-xl">
      <div className="px-8 pt-9 pb-8 border-b border-black/10 dark:border-white/10">
        <h2 className="text-2xl font-black text-primary italic tracking-tight uppercase">
          PADEXA
        </h2>
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.22em] mt-2">
          Admin Console
        </p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <Button
              key={item.id}
              variant="light"
              className={cn(
                "w-full justify-start h-11 rounded-xl px-4 text-sm font-bold",
                isActive
                  ? "bg-primary text-black shadow-lg shadow-primary/20"
                  : "text-gray-400 hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10",
              )}
              startContent={<Icon size={16} />}
              onPress={() => onTabChange(item.id)}
            >
              {item.label}
            </Button>
          );
        })}

        <Button
          variant="light"
          className="w-full justify-start h-11 rounded-xl px-4 text-sm font-bold text-gray-400 hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10"
          startContent={<Settings size={16} />}
          onPress={onOpenSettings}
        >
          Configuración
        </Button>
      </nav>

      <div className="p-4 border-t border-black/10 dark:border-white/10">
        <Button
          variant="light"
          className="w-full justify-start h-11 rounded-xl px-4 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10"
          startContent={<LogOut size={16} />}
          onPress={onLogout}
        >
          Cerrar Sesión
        </Button>
      </div>
    </aside>
  );
};
