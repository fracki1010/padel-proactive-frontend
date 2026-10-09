import { Button, Chip, Input } from "@heroui/react";
import { useMemo } from "react";
import {
  CalendarDays,
  MapPin,
  UserRound,
} from "lucide-react";

import { toIsoDateKey } from "../../../utils/formatters";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { DashboardStats } from "../components/DashboardStats";
import { useDashboardData } from "../hooks/useDashboardData";
import { SkeletonTable } from "../../../components/ui/SkeletonTable";

type DashboardDesktopViewProps = {
  courts: any[];
  onBookingClick: (booking: any) => void;
};

export const DashboardDesktopView = ({
  courts,
  onBookingClick,
}: DashboardDesktopViewProps) => {
  const {
    selectedDate,
    setSelectedDate,
    activeFilter,
    setActiveFilter,
    slotCounts,
    filteredSlots,
    stats,
    isLoading,
    getSlotBookings,
  } = useDashboardData(courts);

  const monthLabel = useMemo(() => {
    const date = new Date(`${selectedDate}T12:00:00`);
    return date.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  }, [selectedDate]);
  const filters: Array<{
    id: keyof typeof slotCounts;
    label: string;
  }> = [
    { id: "all", label: "Todos" },
    { id: "morning", label: "Mañana" },
    { id: "afternoon", label: "Tarde" },
    { id: "night", label: "Noche" },
  ];

  return (
    <div className="space-y-5 pb-10 animate-in fade-in duration-700 overflow-x-hidden">
      <section className="rounded-md border border-black/10 dark:border-white/10 bg-dark-200/75 p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-5">
          <div className="space-y-4 min-w-0">
            <SectionHeader
              eyebrow="Operación Diaria"
              title="Panel de Canchas"
              headingLevel="h2"
            />
            <div className="grid grid-cols-[210px_minmax(0,1fr)] gap-3">
              <Input
                type="date"
                value={selectedDate}
                onValueChange={setSelectedDate}
                startContent={<CalendarDays size={16} className="text-gray-500" />}
                classNames={{
                  inputWrapper:
                    "h-12 rounded-md bg-dark-300 border border-black/10 dark:border-white/10",
                  input: "text-sm text-foreground font-semibold",
                }}
              />
              <div className="rounded-md bg-dark-300 border border-black/10 dark:border-white/10 px-4 flex items-center">
                <span className="text-xs font-bold text-gray-300 capitalize">
                  {monthLabel}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <Button
                  key={filter.id}
                  size="sm"
                  variant="light"
                  className={`rounded-xl px-4 h-10 uppercase text-[11px] font-black tracking-wider ${
                    activeFilter === filter.id
                      ? "bg-primary text-black dark:text-white"
                      : "bg-dark-300 text-gray-400 hover:text-foreground"
                  }`}
                  onPress={() => setActiveFilter(filter.id)}
                >
                  {filter.label}
                  {slotCounts[filter.id] !== undefined ? ` (${slotCounts[filter.id]})` : ""}
                </Button>
              ))}
            </div>
          </div>

          <DashboardStats
            courts={courts.length}
            occupancy={stats.occupancy}
            availableSlots={stats.availableSlots}
            suspendedSlots={stats.suspendedSlots}
            variant="desktop"
          />
        </div>
      </section>

      <section className="rounded-md border border-black/10 dark:border-white/10 bg-dark-200/70 p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary/80 mb-4">
          Disponibilidad por Cancha
        </p>
        {isLoading ? (
          <SkeletonTable rows={5} columns={4} />
        ) : (
          <div className="space-y-4 max-h-[680px] overflow-y-auto pr-1">
            {courts.map((court: any) => (
              <div
                key={court._id}
                className="rounded-md border border-black/10 dark:border-white/10 bg-dark-200 px-4 py-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={14} className="text-primary" />
                  <h3 className="text-base font-black text-foreground uppercase tracking-wide">
                    {court.name}
                  </h3>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-3">
                  {filteredSlots.map((slot: any) => {
                    const slotBookings = getSlotBookings(slot._id, court._id);
                    const activeBooking = slotBookings.find(
                      (booking: any) => booking.status !== "cancelado",
                    );
                    const isTaken = !!activeBooking && activeBooking.status !== "suspendido";
                    const isSuspended =
                      !!activeBooking && activeBooking.status === "suspendido";
                    const slotDateTime = new Date(`${selectedDate}T${slot.startTime}:00`);
                    const isPast = slotDateTime < new Date();
                    const state = isSuspended
                      ? "suspendido"
                      : isTaken
                        ? "ocupado"
                        : isPast
                          ? "pasado"
                          : "libre";

                    return (
                      <div
                        key={`${court._id}-${slot._id}`}
                        className="rounded-xl border border-black/10 dark:border-white/10 bg-dark-100 px-3 py-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-black text-foreground text-base">
                            {slot.startTime}
                          </p>
                          <Chip
                            size="sm"
                            className={`font-black uppercase ${
                              state === "libre"
                                ? "bg-primary/20 text-primary border border-primary/30"
                                : state === "ocupado"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : state === "suspendido"
                                    ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                    : "bg-black/10 dark:bg-white/10 text-gray-400 border border-black/10 dark:border-white/10"
                            }`}
                          >
                            {state}
                          </Chip>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {activeBooking?.clientName ? (
                            <span className="inline-flex items-center gap-1.5">
                              <UserRound size={12} />
                              {activeBooking.clientName}
                            </span>
                          ) : (
                            "Sin reserva"
                          )}
                        </p>
                        <div className="mt-3">
                          {isPast ? (
                            <Button
                              size="sm"
                              isDisabled
                              className="h-8 rounded-lg w-full bg-black/10 dark:bg-white/10 text-gray-500 font-black uppercase"
                            >
                              Expirado
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className={`h-8 rounded-lg w-full font-black uppercase ${
                                isSuspended
                                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                  : isTaken
                                    ? "bg-black/10 dark:bg-white/10 text-foreground"
                                    : "bg-primary text-black dark:text-white"
                              }`}
                              onPress={() =>
                                onBookingClick(
                                  activeBooking ||
                                    ({
                                      status: "disponible",
                                      court,
                                      timeSlot: slot,
                                      date: toIsoDateKey(selectedDate),
                                    } as any),
                                )
                              }
                            >
                              {isSuspended
                                ? "Habilitar"
                                : isTaken
                                  ? "Ver detalle"
                                  : "Reservar"}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {!filteredSlots.length && (
              <div className="py-12 text-center">
                <p className="font-bold text-gray-500">
                  No hay turnos para el filtro seleccionado.
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
