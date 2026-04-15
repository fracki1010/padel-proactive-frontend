import { Card, CardBody, Chip } from "@heroui/react";
import type { Booking } from "../types";
import { Clock3, MapPin, UserRound } from "lucide-react";

interface BookingCardProps {
  booking: Booking;
  onClick?: (booking: Booking) => void;
}

const statusColorMap: Record<string, string> = {
  confirmado: "bg-primary text-black",
  reservado: "bg-orange-500 text-white",
  cancelado: "bg-red-500 text-white",
};

const statusLabelMap: Record<string, string> = {
  confirmado: "PAGO",
  reservado: "PENDIENTE",
  cancelado: "CANCELADO",
};

export const BookingCard = ({ booking, onClick }: BookingCardProps) => {
  const isAvailable = booking.status === "disponible";

  if (isAvailable) {
    return (
      <Card
        isPressable
        onPress={() => onClick?.(booking)}
        className="w-full border-none rounded-[1.6rem] bg-gradient-to-br from-primary via-primary to-amber-300 shadow-2xl shadow-primary/20 hover:scale-[1.01] transition-all duration-300"
      >
        <CardBody className="p-5 flex flex-row items-center gap-4 sm:gap-6 min-w-0">
          <div className="flex flex-col items-center bg-black/10 rounded-2xl px-3 py-2 min-w-[76px]">
            <span className="text-xl font-black text-black leading-none">
              {booking.timeSlot?.startTime || "00:00"}
            </span>
            <span className="text-[10px] font-bold text-black/60 uppercase">
              90 MIN
            </span>
          </div>

          <div className="w-[1px] h-12 bg-black/15"></div>

          <div className="flex-grow flex flex-col min-w-0">
            <span className="font-black text-black text-lg tracking-tight">
              DISPONIBLE
            </span>
            <span className="text-xs text-black/70 font-semibold">
              ¡Presiona para reservar!
            </span>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card
      isPressable
      onPress={() => onClick?.(booking)}
      className="w-full rounded-[1.6rem] bg-dark-200/90 border border-black/10 dark:border-white/10 hover:border-primary/40 transition-all duration-300 shadow-2xl shadow-black/20"
    >
      <CardBody className="p-5 flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6 min-w-0">
        <div className="flex flex-col items-center min-w-[72px] rounded-2xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 px-2.5 py-2">
          <span className="text-xl font-black text-foreground leading-none">
            {booking.timeSlot?.startTime}
          </span>
          <span className="text-[10px] font-bold text-foreground/40 uppercase">
            90 MIN
          </span>
        </div>

        <div className="flex flex-col flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap min-w-0">
            <span className="font-black text-foreground text-lg truncate min-w-0 flex-1 tracking-tight">
              {booking.clientName}
            </span>
            <Chip
              size="sm"
              className={`${statusColorMap[booking.status] || "bg-gray-600"} h-5 px-2 text-[10px] font-black tracking-wide shrink-0 rounded-lg`}
              radius="sm"
            >
              {statusLabelMap[booking.status] || booking.status.toUpperCase()}
            </Chip>
            {booking.isFixed && (
              <Chip
                size="sm"
                className="bg-success/20 text-success border border-success/30 h-5 px-2 text-[10px] font-black shrink-0 rounded-lg"
                radius="sm"
              >
                FIJO
              </Chip>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs">
            <span className="inline-flex items-center gap-1.5 text-foreground/60 font-semibold min-w-0">
              <UserRound size={13} className="text-foreground/35 shrink-0" />
              <span className="truncate">{booking.clientPhone}</span>
            </span>
            <span className="hidden sm:block h-3 w-px bg-black/10 dark:bg-white/10" />
            <span className="inline-flex items-center gap-1.5 text-foreground/60 font-semibold min-w-0">
              <MapPin size={13} className="text-foreground/35 shrink-0" />
              <span className="truncate">{booking.court?.name}</span>
            </span>
            <span className="hidden sm:block h-3 w-px bg-black/10 dark:bg-white/10" />
            <span className="inline-flex items-center gap-1.5 text-foreground/50 font-semibold">
              <Clock3 size={13} className="text-foreground/35 shrink-0" />
              90 min
            </span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
