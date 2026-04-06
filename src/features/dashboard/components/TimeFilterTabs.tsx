import { Button } from "@heroui/react";
import { Moon, Sun, Sunset } from "lucide-react";

type TimeFilterTabsProps = {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
};

export const TimeFilterTabs = ({
  activeFilter,
  onFilterChange,
}: TimeFilterTabsProps) => {
  return (
    <div className="flex gap-3">
      {[
        { id: "morning", label: "Mañana", icon: Sun },
        { id: "afternoon", label: "Tarde", icon: Sunset },
        { id: "night", label: "Noche", icon: Moon },
      ].map((filter) => (
        <Button
          key={filter.id}
          variant={activeFilter === filter.id ? "solid" : "flat"}
          className={`flex-grow h-14 rounded-full font-bold transition-all ${
            activeFilter === filter.id
              ? "bg-primary text-black shadow-lg shadow-primary/20"
              : "bg-dark-100 text-gray-400"
          }`}
          onClick={() => onFilterChange(filter.id)}
          startContent={<filter.icon size={20} />}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
};
