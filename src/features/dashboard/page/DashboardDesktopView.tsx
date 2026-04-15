import { CourtsAvailability } from "../components/CourtsAvailability";
import { DateSelector } from "../components/DateSelector";
import { TimeFilterTabs } from "../components/TimeFilterTabs";
import { useDashboardData } from "../hooks/useDashboardData";
import { useMemo } from "react";
import { CalendarDays, CheckCircle2, Clock3, MapPinned } from "lucide-react";

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

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-700">
      <div className="grid grid-cols-[340px_minmax(0,1fr)] gap-6 items-start">
        <aside className="space-y-5 sticky top-4">
          <div className="rounded-[2rem] border border-black/10 dark:border-white/10 bg-dark-200/80 p-5">
            <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
          </div>
          <div className="rounded-[2rem] border border-black/10 dark:border-white/10 bg-dark-200/80 p-5">
            <TimeFilterTabs
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              counts={slotCounts}
            />
          </div>
        </aside>

        <section className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-dark-200 px-5 py-4">
              <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-3">
                <MapPinned size={16} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">
                Canchas
              </p>
              <p className="text-3xl font-black text-foreground mt-1">{courts.length}</p>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-dark-200 px-5 py-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center mb-3">
                <CheckCircle2 size={16} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">
                Ocupación
              </p>
              <p className="text-3xl font-black text-foreground mt-1">{stats.occupancy}%</p>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-dark-200 px-5 py-4">
              <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-3">
                <Clock3 size={16} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">
                Libres
              </p>
              <p className="text-3xl font-black text-foreground mt-1">{stats.availableSlots}</p>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-dark-200 px-5 py-4">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center mb-3">
                <CalendarDays size={16} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">
                Suspendidos
              </p>
              <p className="text-3xl font-black text-foreground mt-1">{stats.suspendedSlots}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-dark-200/70 p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary/80 mb-4">
              Disponibilidad por Cancha
            </p>
            <div className="max-h-[680px] overflow-y-auto pr-1">
              <CourtsAvailability
                courts={courts}
                filteredSlots={filteredSlots}
                isLoading={isLoading}
                selectedDate={selectedDate}
                getSlotBookings={getSlotBookings}
                onBookingClick={onBookingClick}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
