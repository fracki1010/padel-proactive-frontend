import { Button, Chip, Input, Spinner } from "@heroui/react";
import { useMemo } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  MapPinned,
  PauseCircle,
  UserRound,
} from "lucide-react";

import { toIsoDateKey } from "../../../utils/formatters";
import { useDashboardData } from "../hooks/useDashboardData";

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
    isLoading,
    getSlotBookings,
  } = useDashboardData();

  const stats = useMemo(() => {
    const totalSlots = courts.length * filteredSlots.length;
    let takenSlots = 0;
    let suspendedSlots = 0;

    courts.forEach((court) => {
      filteredSlots.forEach((slot) => {
        const bookings = getSlotBookings(slot._id, court._id);
        const activeBooking = bookings.find((booking: any) => booking.status !== "cancelado");
        if (!activeBooking) return;
        if (activeBooking.status === "suspendido") {
          suspendedSlots += 1;
          return;
        }
        takenSlots += 1;
      });
    });

    const availableSlots = Math.max(0, totalSlots - takenSlots - suspendedSlots);
    const occupancy = totalSlots > 0 ? Math.round((takenSlots / totalSlots) * 100) : 0;

    return { totalSlots, takenSlots, suspendedSlots, availableSlots, occupancy };
  }, [courts, filteredSlots, getSlotBookings]);

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
      <section className="rounded-3xl border border-black/10 dark:border-white/10 bg-dark-200/75 p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-5">
          <div className="space-y-4 min-w-0">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary/80">
                Operación Diaria
              </p>
              <h2 className="text-3xl xl:text-4xl font-black text-foreground tracking-tight mt-2">
                Panel de Canchas
              </h2>
            </div>
            <div className="grid grid-cols-[210px_minmax(0,1fr)] gap-3">
              <Input
                type="date"
                value={selectedDate}
                onValueChange={setSelectedDate}
                startContent={<CalendarDays size={16} className="text-gray-500" />}
                classNames={{
                  inputWrapper:
                    "h-12 rounded-2xl bg-dark-300 border border-black/10 dark:border-white/10",
                  input: "text-sm text-foreground font-semibold",
                }}
              />
              <div className="rounded-2xl bg-dark-300 border border-black/10 dark:border-white/10 px-4 flex items-center">
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
                      ? "bg-primary text-black"
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

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-dark-200 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-2">
                <MapPinned size={15} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">
                Canchas
              </p>
              <p className="text-2xl font-black text-foreground">{courts.length}</p>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-dark-200 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-300 flex items-center justify-center mb-2">
                <CheckCircle2 size={15} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">
                Ocupación
              </p>
              <p className="text-2xl font-black text-foreground">{stats.occupancy}%</p>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-dark-200 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-2">
                <Clock3 size={15} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">
                Libres
              </p>
              <p className="text-2xl font-black text-foreground">{stats.availableSlots}</p>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-dark-200 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-300 flex items-center justify-center mb-2">
                <PauseCircle size={15} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">
                Suspendidos
              </p>
              <p className="text-2xl font-black text-foreground">{stats.suspendedSlots}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-black/10 dark:border-white/10 bg-dark-200/70 p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary/80 mb-4">
          Disponibilidad por Cancha
        </p>
        {isLoading ? (
          <div className="py-16 flex justify-center">
            <Spinner color="primary" />
          </div>
        ) : (
          <div className="space-y-4 max-h-[680px] overflow-y-auto pr-1">
            {courts.map((court: any) => (
              <div
                key={court._id}
                className="rounded-2xl border border-black/10 dark:border-white/10 bg-dark-200 px-4 py-4"
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
                                    : "bg-primary text-black"
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
