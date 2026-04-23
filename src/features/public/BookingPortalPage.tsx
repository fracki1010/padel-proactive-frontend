import { Button, Chip, Spinner, useDisclosure } from "@heroui/react";
import { CalendarDays, ChevronLeft, ChevronRight, LogIn, LogOut, Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useClientAuth } from "../../context/ClientAuthContext";
import { publicService } from "../../services/publicService";
import { BookingConfirmModal } from "./components/BookingConfirmModal";
import { ClientAuthModal } from "./components/ClientAuthModal";
import { MyBookingsDrawer } from "./components/MyBookingsDrawer";

interface Court {
  _id: string;
  name: string;
  courtType?: string;
}

interface Slot {
  _id: string;
  startTime: string;
  endTime: string;
  price: number;
  label?: string;
  order?: number;
}

interface AvailabilityItem {
  courtId: string;
  slotId: string;
  available: boolean;
}

const todayIso = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

const addDays = (isoDate: string, days: number) => {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return date.toISOString().slice(0, 10);
};

const formatDisplayDate = (isoDate: string) => {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

const MAX_DAYS_AHEAD = 14;

export const BookingPortalPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { clientUser, isClientAuthenticated, logoutClient } = useClientAuth();

  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [clubInfo, setClubInfo] = useState<{
    club: { name: string; address?: string };
    courts: Court[];
    slots: Slot[];
  } | null>(null);
  const [availability, setAvailability] = useState<{
    closed: boolean;
    closureReason?: string;
    courts: Court[];
    slots: Slot[];
    availability: AvailabilityItem[];
  } | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  const [pendingCourt, setPendingCourt] = useState<Court | null>(null);
  const [pendingSlot, setPendingSlot] = useState<Slot | null>(null);

  const {
    isOpen: isAuthOpen,
    onOpen: openAuth,
    onClose: closeAuth,
  } = useDisclosure();

  const {
    isOpen: isConfirmOpen,
    onOpen: openConfirm,
    onClose: closeConfirm,
  } = useDisclosure();

  const {
    isOpen: isMyBookingsOpen,
    onOpen: openMyBookings,
    onClose: closeMyBookings,
  } = useDisclosure();

  useEffect(() => {
    if (!slug) return;
    setIsLoadingInfo(true);
    publicService
      .getClubInfo(slug)
      .then((res) => setClubInfo(res.data))
      .catch(() => setClubInfo(null))
      .finally(() => setIsLoadingInfo(false));
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    setIsLoadingAvailability(true);
    publicService
      .getAvailability(slug, selectedDate)
      .then((res) => setAvailability(res.data))
      .catch(() => setAvailability(null))
      .finally(() => setIsLoadingAvailability(false));
  }, [slug, selectedDate]);

  const handleSlotClick = (court: Court, slot: Slot) => {
    setPendingCourt(court);
    setPendingSlot(slot);
    if (!isClientAuthenticated) {
      openAuth();
    } else {
      openConfirm();
    }
  };

  const handleAuthSuccess = () => {
    if (pendingCourt && pendingSlot) {
      openConfirm();
    }
  };

  const handleBookingConfirmed = () => {
    if (!slug) return;
    setIsLoadingAvailability(true);
    publicService
      .getAvailability(slug, selectedDate)
      .then((res) => setAvailability(res.data))
      .catch(() => {})
      .finally(() => setIsLoadingAvailability(false));
  };

  const canGoBack = selectedDate > todayIso();
  const canGoForward = selectedDate < addDays(todayIso(), MAX_DAYS_AHEAD - 1);

  const courts = availability?.courts || clubInfo?.courts || [];
  const slots = availability?.slots || clubInfo?.slots || [];

  const isAvailable = (courtId: string, slotId: string) => {
    if (!availability || availability.closed) return false;
    return (
      availability.availability?.find(
        (a) => a.courtId === courtId && a.slotId === slotId,
      )?.available ?? false
    );
  };

  if (isLoadingInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!clubInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground">
        <span className="text-5xl">🎾</span>
        <p className="text-xl font-semibold">Club no encontrado</p>
        <p className="text-default-500 text-sm">
          Verificá que el link sea correcto.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-default-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-base">{clubInfo.club.name}</span>
            {clubInfo.club.address && (
              <span className="text-xs text-default-400">{clubInfo.club.address}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isClientAuthenticated ? (
              <>
                <Button
                  size="sm"
                  variant="flat"
                  startContent={<Ticket size={14} />}
                  onPress={openMyBookings}
                >
                  Mis turnos
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  isIconOnly
                  onPress={logoutClient}
                  title="Cerrar sesión"
                >
                  <LogOut size={16} />
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="flat"
                startContent={<LogIn size={14} />}
                onPress={openAuth}
              >
                Ingresar
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Saludo */}
        {isClientAuthenticated && (
          <p className="text-sm text-default-500">
            Hola, <span className="font-semibold text-foreground">{clientUser?.name}</span>
          </p>
        )}

        {/* Selector de fecha */}
        <div className="flex items-center gap-3 justify-between">
          <Button
            isIconOnly
            variant="flat"
            size="sm"
            isDisabled={!canGoBack}
            onPress={() => setSelectedDate((d) => addDays(d, -1))}
          >
            <ChevronLeft size={18} />
          </Button>

          <div className="flex items-center gap-2 flex-1 justify-center">
            <CalendarDays size={16} className="text-primary" />
            <span className="font-semibold text-sm capitalize">
              {formatDisplayDate(selectedDate)}
            </span>
          </div>

          <Button
            isIconOnly
            variant="flat"
            size="sm"
            isDisabled={!canGoForward}
            onPress={() => setSelectedDate((d) => addDays(d, 1))}
          >
            <ChevronRight size={18} />
          </Button>
        </div>

        {/* Estado del club */}
        {availability?.closed && (
          <div className="rounded-xl border border-warning-200 bg-warning-50 p-4 text-center text-warning-700 text-sm">
            <span className="font-semibold">El club está cerrado ese día.</span>
            {availability.closureReason && (
              <p className="mt-1 text-xs">{availability.closureReason}</p>
            )}
          </div>
        )}

        {/* Grid de disponibilidad */}
        {isLoadingAvailability ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : courts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-default-400">
            <span className="text-4xl">🎾</span>
            <p className="text-sm">No hay canchas configuradas todavía</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {courts.map((court) => (
              <div key={court._id} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm">{court.name}</h2>
                  {court.courtType && (
                    <Chip size="sm" variant="flat" className="text-xs">
                      {court.courtType}
                    </Chip>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {slots.map((slot) => {
                    const available = isAvailable(court._id, slot._id);
                    return (
                      <button
                        key={slot._id}
                        disabled={!available || availability?.closed}
                        onClick={() => available && handleSlotClick(court, slot)}
                        className={`
                          rounded-xl border p-3 text-left flex flex-col gap-1 transition-all
                          ${
                            available && !availability?.closed
                              ? "border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary cursor-pointer"
                              : "border-default-200 bg-default-50 opacity-50 cursor-not-allowed"
                          }
                        `}
                      >
                        <span className="font-semibold text-sm">
                          {slot.label || `${slot.startTime}`}
                        </span>
                        <span className="text-xs text-default-500">
                          {slot.startTime} - {slot.endTime}
                        </span>
                        {available && !availability?.closed ? (
                          <span className="text-xs font-medium text-primary mt-1">
                            {slot.price > 0
                              ? `$${slot.price.toLocaleString("es-AR")}`
                              : "Reservar"}
                          </span>
                        ) : (
                          <span className="text-xs text-default-400 mt-1">Ocupado</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modales */}
      {slug && (
        <>
          <ClientAuthModal
            isOpen={isAuthOpen}
            onClose={closeAuth}
            slug={slug}
            onSuccess={handleAuthSuccess}
          />

          <BookingConfirmModal
            isOpen={isConfirmOpen}
            onClose={closeConfirm}
            slug={slug}
            court={pendingCourt}
            slot={pendingSlot}
            date={selectedDate}
            clientName={clientUser?.name || ""}
            onConfirmed={handleBookingConfirmed}
          />

          <MyBookingsDrawer
            isOpen={isMyBookingsOpen}
            onClose={closeMyBookings}
            slug={slug}
            isAuthenticated={isClientAuthenticated}
          />
        </>
      )}
    </div>
  );
};
