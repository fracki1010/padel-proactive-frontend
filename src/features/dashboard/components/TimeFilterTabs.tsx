import { Button } from "@heroui/react";
import { Clock3, Moon, Sun, Sunset } from "lucide-react";

type TimeFilterTabsProps = {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  counts?: Record<string, number>;
};

export const TimeFilterTabs = ({
  activeFilter,
  onFilterChange,
  counts = {},
}: TimeFilterTabsProps) => {
  void counts;

  return (
    <div className="flex gap-3">
      {[
        { id: "all", label: "Todos", icon: Clock3 },
        { id: "morning", label: "Mañana", icon: Sun },
        { id: "afternoon", label: "Tarde", icon: Sunset },
        { id: "night", label: "Noche", icon: Moon },
      ].map((filter) => (
        <Button
          key={filter.id}
          variant={activeFilter === filter.id ? "solid" : "flat"}
          aria-label={filter.label}
          className={`flex-grow h-14 rounded-full font-bold border border-black/5 dark:border-white/10 transition-all ${activeFilter === filter.id
              ? "bg-primary text-black shadow-lg shadow-primary/20"
              : "bg-dark-100 text-gray-500 hover:text-foreground"
            }`}
          onClick={() => onFilterChange(filter.id)}
          startContent={<filter.icon size={20} />}
        >
          {filter.id === "all" ? (
            filter.label
          ) : (
            <span className="hidden sm:inline">{filter.label}</span>
          )}
        </Button>
      ))}
    </div>
  );
};
