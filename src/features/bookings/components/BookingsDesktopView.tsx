import { Button, Chip, Input } from "@heroui/react";
import { Calendar, ChevronDown, Filter, MoreVertical, Search } from "lucide-react";

import { formatCurrency, toIsoDateKey } from "../../../utils/formatters";

type BookingsDesktopViewProps = {
  bookings: any[];
  courts: any[];
  filterValue: string;
  onFilterChange: (value: string) => void;
  selectedCourt: string;
  onCourtChange: (value: string) => void;
  onBookingClick: (booking: any) => void;
  onClearFilters: () => void;
};

export const BookingsDesktopView = ({
  bookings,
  courts,
  filterValue,
  onFilterChange,
  selectedCourt,
  onCourtChange,
  onBookingClick,
  onClearFilters,
}: BookingsDesktopViewProps) => {
  return (
    <div className="hidden lg:block space-y-5 animate-in fade-in duration-500">
      <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-dark-200/70 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary/80 mb-2">
              Reservas
            </p>
            <h2 className="text-5xl font-black text-foreground tracking-tight">
              Gestión de Turnos
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="flat"
              className="bg-black/10 dark:bg-white/10 text-gray-300 uppercase font-black text-[11px] tracking-wider"
              startContent={<Filter size={14} />}
              endContent={<ChevronDown size={14} />}
              isDisabled
            >
              Filtros
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[1fr_240px_auto] gap-3">
          <Input
            isClearable
            value={filterValue}
            onValueChange={onFilterChange}
            placeholder="Buscar por nombre, teléfono o cancha..."
            startContent={<Search size={16} className="text-gray-500" />}
            classNames={{
              inputWrapper:
                "h-12 rounded-2xl bg-dark-300 border border-black/10 dark:border-white/10",
              input: "text-foreground",
            }}
          />
          <div className="h-12 rounded-2xl bg-dark-300 border border-black/10 dark:border-white/10 px-3 flex items-center gap-2">
            <Calendar size={16} className="text-gray-500" />
            <select
              value={selectedCourt}
              onChange={(event) => onCourtChange(event.target.value)}
              className="w-full bg-transparent text-foreground font-semibold outline-none"
            >
              <option value="all">Todas las canchas</option>
              {courts.map((court: any) => (
                <option key={court._id} value={court._id}>
                  {court.name}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="flat"
            className="h-12 rounded-2xl px-5 text-foreground bg-black/10 dark:bg-white/10 font-black"
            onPress={onClearFilters}
          >
            Limpiar
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-dark-200 overflow-hidden">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_0.9fr_60px] px-6 py-3 bg-black/10 dark:bg-white/5 text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
          <p>Cliente</p>
          <p>Cancha</p>
          <p>Fecha</p>
          <p>Horario</p>
          <p>Pago</p>
          <p className="text-right">Acción</p>
        </div>

        <div className="max-h-[680px] overflow-y-auto">
          {bookings.map((booking: any) => (
            <button
              key={booking._id}
              type="button"
              className="w-full grid grid-cols-[1.4fr_1fr_1fr_1fr_0.9fr_60px] items-center px-6 py-4 border-b border-black/10 dark:border-white/5 last:border-b-0 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              onClick={() => onBookingClick(booking)}
            >
              <div className="min-w-0">
                <p className="font-black text-foreground text-xl truncate">{booking.clientName}</p>
                <p className="text-xs text-gray-500">{booking.clientPhone}</p>
              </div>
              <p className="font-semibold text-gray-300">{booking.court?.name || "-"}</p>
              <p className="font-semibold text-foreground">{toIsoDateKey(booking.date)}</p>
              <p className="font-semibold text-gray-300">
                {booking.timeSlot?.startTime || "--:--"} - {booking.timeSlot?.endTime || "--:--"}
              </p>
              <div className="flex items-center gap-2">
                <Chip
                  size="sm"
                  className={`font-black uppercase ${booking.paymentStatus === "pagado" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"}`}
                >
                  {booking.paymentStatus === "pagado" ? "Pagado" : "Pendiente"}
                </Chip>
                <p className="font-black text-foreground">{formatCurrency(Number(booking.finalPrice) || 0)}</p>
              </div>
              <div className="flex justify-end">
                <MoreVertical size={16} className="text-gray-400" />
              </div>
            </button>
          ))}

          {bookings.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-gray-500 font-bold">No hay reservas para los filtros actuales.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
