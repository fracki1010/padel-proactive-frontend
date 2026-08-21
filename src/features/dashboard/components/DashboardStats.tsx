import { Clock3, MapPinned, PauseCircle, TrendingUp } from "lucide-react";

import { StatCard } from "../../../components/ui/StatCard";

type DashboardStatsProps = {
  courts: number;
  occupancy: number;
  availableSlots: number;
  suspendedSlots: number;
  variant?: "desktop" | "mobile";
};

export const DashboardStats = ({
  courts,
  occupancy,
  availableSlots,
  suspendedSlots,
  variant = "desktop",
}: DashboardStatsProps) => {
  const isDesktop = variant === "desktop";

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Hero metric — Occupancy */}
      <div
        className={`col-span-2 rounded-md border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 ${
          isDesktop ? "px-5 py-4" : "px-4 py-3"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp
            size={isDesktop ? 16 : 14}
            className="text-primary"
          />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/80">
            Ocupación
          </p>
        </div>
        <p
          className={`font-black text-foreground ${
            isDesktop ? "text-4xl" : "text-3xl"
          }`}
        >
          {occupancy}%
        </p>
        <p className="text-xs text-gray-500 mt-1 font-medium">
          de las canchas reservadas hoy
        </p>
      </div>

      {/* Courts */}
      <StatCard
        icon={isDesktop ? <MapPinned size={15} /> : undefined}
        label="Canchas"
        value={courts}
        iconColor="primary"
        variant={isDesktop ? "default" : "mini"}
      />

      {/* Available slots */}
      <StatCard
        icon={isDesktop ? <Clock3 size={15} /> : undefined}
        label="Libres"
        value={availableSlots}
        iconColor="primary"
        variant={isDesktop ? "default" : "mini"}
      />

      {/* Suspended slots */}
      <StatCard
        icon={isDesktop ? <PauseCircle size={15} /> : undefined}
        label="Suspendidos"
        value={suspendedSlots}
        iconColor="amber"
        variant={isDesktop ? "default" : "mini"}
        className="col-span-2"
      />
    </div>
  );
};
