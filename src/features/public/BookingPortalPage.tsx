import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Spinner, useDisclosure } from "@heroui/react";
import { Check, Clock, Lock, LogIn, LogOut, Plus, Ticket, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import logo from "../../assets/logo-8.svg";
import { useClientAuth } from "../../context/ClientAuthContext";
import { publicService } from "../../services/publicService";
import { BookingConfirmModal } from "./components/BookingConfirmModal";
import { ClientAuthModal } from "./components/ClientAuthModal";
import { MyBookingsDrawer } from "./components/MyBookingsDrawer";

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface Court {
  _id: string;
  name: string;
  courtType?: string;
  surface?: string;
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

interface SelectedSlot {
  court: Court;
  slot: Slot;
}

// ─── Helpers de fecha ────────────────────────────────────────────────────────

const toLocalIso = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const todayIso = () => toLocalIso(new Date());

const addDays = (iso: string, n: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  return toLocalIso(new Date(y, m - 1, d + n));
};

const MAX_DAYS = 14;

const DAY_SHORT = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const MONTH_NAMES = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
];

const getDateParts = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    dayName: DAY_SHORT[date.getDay()],
    day: date.getDate(),
    month: MONTH_NAMES[date.getMonth()],
    year: date.getFullYear(),
  };
};

const calcDurationMin = (start: string, end: string) => {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
};

const isSlotPast = (startTime: string, selectedDate: string) => {
  if (selectedDate !== todayIso()) return false;
  const now = new Date();
  const [h, m] = startTime.split(":").map(Number);
  return h * 60 + m <= now.getHours() * 60 + now.getMinutes();
};

const buildDates = () =>
  Array.from({ length: MAX_DAYS }, (_, i) => addDays(todayIso(), i));

// ─── Página ──────────────────────────────────────────────────────────────────

export const BookingPortalPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { clientUser, isClientAuthenticated, logoutClient } = useClientAuth();

  const dates = buildDates();
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);

  const [clubInfo, setClubInfo] = useState<{
    club: { name: string; address?: string; coverImage?: string };
    courts: Court[];
    slots: Slot[];
    cancellationLockHours: number;
  } | null>(null);

  const [availability, setAvailability] = useState<{
    closed: boolean;
    closureReason?: string;
    courts: Court[];
    slots: Slot[];
    availability: AvailabilityItem[];
  } | null>(null);

  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [isLoadingAvail, setIsLoadingAvail] = useState(false);

  const dateScrollRef = useRef<HTMLDivElement>(null);

  const { isOpen: isAuthOpen, onOpen: openAuth, onClose: closeAuth } = useDisclosure();
  const { isOpen: isConfirmOpen, onOpen: openConfirm, onClose: closeConfirm } = useDisclosure();
  const { isOpen: isMyBookingsOpen, onOpen: openMyBookings, onClose: closeMyBookings } = useDisclosure();

  useEffect(() => {
    if (!slug) return;
    setIsLoadingInfo(true);
    publicService.getClubInfo(slug)
      .then((r) => setClubInfo(r.data))
      .catch(() => setClubInfo(null))
      .finally(() => setIsLoadingInfo(false));
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    setIsLoadingAvail(true);
    setSelectedSlot(null);
    publicService.getAvailability(slug, selectedDate)
      .then((r) => setAvailability(r.data))
      .catch(() => setAvailability(null))
      .finally(() => setIsLoadingAvail(false));
  }, [slug, selectedDate]);

  const isAvailable = (courtId: string, slotId: string) => {
    if (!availability || availability.closed) return false;
    return availability.availability?.find(
      (a) => a.courtId === courtId && a.slotId === slotId,
    )?.available ?? false;
  };

  const isSelected = (courtId: string, slotId: string) =>
    selectedSlot?.court._id === courtId && selectedSlot?.slot._id === slotId;

  const handleSlotClick = (court: Court, slot: Slot) => {
    setSelectedSlot((prev) =>
      prev?.court._id === court._id && prev?.slot._id === slot._id ? null : { court, slot },
    );
  };

  const handleCompleteBooking = () => {
    if (!selectedSlot) return;
    if (!isClientAuthenticated) openAuth();
    else openConfirm();
  };

  const handleAuthSuccess = () => {
    if (selectedSlot) openConfirm();
  };

  const refreshAvailability = () => {
    if (!slug) return;
    setIsLoadingAvail(true);
    publicService.getAvailability(slug, selectedDate)
      .then((r) => setAvailability(r.data))
      .catch(() => {})
      .finally(() => setIsLoadingAvail(false));
  };

  const handleBookingConfirmed = () => {
    setSelectedSlot(null);
    refreshAvailability();
  };

  const handleBookingConflict = () => {
    setSelectedSlot(null);
    refreshAvailability();
  };

  const courts = availability?.courts || clubInfo?.courts || [];
  const slots = availability?.slots || clubInfo?.slots || [];
  const { month, year } = selectedDate ? getDateParts(selectedDate) : { month: "", year: 0 };

  const clubWords = clubInfo?.club.name.trim().split(" ") ?? [];
  const heroFirst = clubWords.length > 1 ? clubWords.slice(0, -1).join(" ") : clubWords[0] ?? "";
  const heroLast = clubWords.length > 1 ? clubWords[clubWords.length - 1] : "";

  // ─── Loading / error ─────────────────────────────────────────────────────

  if (isLoadingInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (!clubInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground">
        <span className="text-5xl">🎾</span>
        <p className="text-xl font-bold">Club no encontrado</p>
        <p className="text-default-400 text-sm">Verificá que el link sea correcto.</p>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-black/10 dark:border-white/10">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo izquierda */}
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Logo"
              className="w-10 h-10 rounded-xl object-cover"
            />
            <span className="font-black text-base tracking-widest uppercase text-foreground truncate max-w-[160px]">
              PADEXA
            </span>
          </div>

          {/* Íconos derecha */}
          <div className="flex items-center gap-2">
            {isClientAuthenticated ? (
              <>
                <Button
                  isIconOnly
                  variant="light"
                  size="md"
                  radius="lg"
                  className="text-default-500"
                  onPress={openMyBookings}
                  title="Mis turnos"
                >
                  <Ticket size={22} />
                </Button>
                <Dropdown placement="bottom-end">
                  <DropdownTrigger>
                    <Button
                      isIconOnly
                      variant="flat"
                      size="md"
                      radius="lg"
                      className="bg-primary/10 text-primary border border-primary/20"
                      title={clientUser?.name}
                    >
                      <User size={20} />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="Cuenta">
                    <DropdownItem key="name" isReadOnly className="opacity-60 text-sm">
                      {clientUser?.name}
                    </DropdownItem>
                    <DropdownItem
                      key="bookings"
                      startContent={<Ticket size={16} />}
                      onPress={openMyBookings}
                    >
                      Mis turnos
                    </DropdownItem>
                    <DropdownItem
                      key="logout"
                      color="danger"
                      startContent={<LogOut size={16} />}
                      onPress={logoutClient}
                    >
                      Cerrar sesión
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </>
            ) : (
              <Button
                variant="flat"
                size="md"
                radius="lg"
                className="bg-primary/10 text-primary border border-primary/20 font-semibold text-sm"
                startContent={<LogIn size={16} />}
                onPress={openAuth}
              >
                Ingresar
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: 260 }}>

        {/* ── Fondo: imagen o gradiente de cancha ── */}
        <div className="absolute inset-0">
          {clubInfo.club.coverImage ? (
            <img
              src={clubInfo.club.coverImage}
              alt=""
              className="w-full h-full object-cover object-center"
              style={{ filter: "brightness(0.55) saturate(1.2)" }}
            />
          ) : (
            /* Gradiente que simula una cancha de padel vista de lado */
            <div
              className="w-full h-full"
              style={{
                background: "linear-gradient(160deg, #0a1628 0%, #0d2137 35%, #0b2e38 60%, #0a3d2e 100%)",
              }}
            >
              {/* Líneas de cancha sutiles */}
              <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
                  backgroundSize: "48px 48px",
                }}
              />
              {/* Red de la cancha */}
              <div
                className="absolute left-1/2 top-0 bottom-0 opacity-10"
                style={{ width: 2, background: "rgba(255,255,255,0.9)", transform: "translateX(-50%)" }}
              />
              {/* Glow primario */}
              <div
                className="absolute -top-20 -right-20 w-96 h-96 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(13,181,219,0.18) 0%, transparent 65%)" }}
              />
              <div
                className="absolute bottom-0 left-0 w-72 h-72 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(45,212,191,0.12) 0%, transparent 70%)" }}
              />
            </div>
          )}

          {/* Overlay: arriba casi transparente, abajo funde con el fondo de la página */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.35) 50%, var(--heroui-background, #000) 100%)",
            }}
          />
        </div>

        {/* ── Contenido sobre el fondo ── */}
        <div className="relative max-w-2xl mx-auto px-6 pt-10 pb-12">

          {/* Primera palabra del nombre */}
          {heroFirst && (
            <p
              className="font-bold tracking-[0.35em] uppercase mb-1"
              style={{ fontSize: "clamp(0.65rem, 3vw, 0.85rem)", color: "rgba(255,255,255,0.65)" }}
            >
              {heroFirst}
            </p>
          )}

          {/* Palabra principal */}
          <h1 className="leading-none mb-5">
            <span
              className="font-black uppercase block"
              style={{
                fontSize: "clamp(3.8rem, 18vw, 6.5rem)",
                background: "linear-gradient(135deg, rgb(13,181,219) 0%, rgb(100,210,255) 50%, rgb(45,212,191) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                lineHeight: 0.88,
                letterSpacing: "-0.02em",
                filter: "drop-shadow(0 2px 24px rgba(13,181,219,0.45))",
              }}
            >
              {heroLast || heroFirst}
            </span>
          </h1>

          {/* Línea decorativa */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px bg-primary w-12 opacity-70" />
            <div className="h-[3px] bg-primary rounded-full w-3 opacity-50" />
          </div>

          {/* Subtítulo + dirección + saludo */}
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1rem", fontWeight: 500 }}>
            Reservá tu turno
          </p>
          {clubInfo.club.address && (
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.85rem", marginTop: 4 }}>
              {clubInfo.club.address}
            </p>
          )}
          {isClientAuthenticated && (
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.95rem", marginTop: 8 }}>
              Hola,{" "}
              <span style={{ color: "rgba(255,255,255,0.9)", fontWeight: 700 }}>
                {clientUser?.name}
              </span>
            </p>
          )}
        </div>
      </section>

      {/* ── Selector de fecha ─────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold tracking-widest uppercase text-default-400">
            Seleccioná una fecha
          </p>
          <span className="text-sm font-bold tracking-widest text-primary">
            {month} {year}
          </span>
        </div>

        <div
          ref={dateScrollRef}
          className="flex gap-2.5 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {dates.map((iso) => {
            const { dayName, day } = getDateParts(iso);
            const isActive = iso === selectedDate;
            return (
              <button
                key={iso}
                onClick={() => setSelectedDate(iso)}
                className={`
                  flex flex-col items-center py-4 px-4 rounded-2xl shrink-0 transition-all border
                  ${isActive
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-default-100 border-default-200 text-default-500 hover:border-default-400"}
                `}
              >
                <span className="text-xs font-bold tracking-widest mb-2">{dayName}</span>
                <span className={`text-2xl font-black leading-none ${isActive ? "text-primary" : "text-foreground"}`}>
                  {day}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Canchas y turnos ──────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-4 pb-40">

        {/* Cierre del club */}
        {availability?.closed && (
          <div className="mx-2 p-4 rounded-2xl border border-warning-200 bg-warning-50 dark:bg-warning-900/20 text-center mb-6">
            <p className="font-bold text-warning-600 dark:text-warning-400">El club está cerrado ese día</p>
            {availability.closureReason && (
              <p className="text-xs text-warning-500 mt-1">{availability.closureReason}</p>
            )}
          </div>
        )}

        {isLoadingAvail ? (
          <div className="flex justify-center py-20">
            <Spinner color="primary" />
          </div>
        ) : courts.length === 0 && !availability?.closed ? (
          <div className="flex flex-col items-center gap-3 py-20 text-default-400">
            <span className="text-4xl">🎾</span>
            <p className="text-sm">No hay canchas configuradas todavía</p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {courts.map((court, idx) => (
              <div key={court._id}>

                {/* Cabecera de la cancha */}
                <div className="flex items-start gap-3 mb-5 px-2">
                  <span className="text-primary font-black text-base tabular-nums mt-0.5 w-7 shrink-0">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-black uppercase tracking-tight leading-tight">
                      {court.name}
                    </h2>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {court.courtType && (
                        <span className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-default-300 text-default-500">
                          {court.courtType}
                        </span>
                      )}
                      {court.surface && (
                        <span className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-default-300 text-default-500">
                          {court.surface}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grid de turnos */}
                <div className="grid grid-cols-2 gap-3 px-2">
                  {slots.map((slot) => {
                    const avail = isAvailable(court._id, slot._id);
                    const past = isSlotPast(slot.startTime, selectedDate);
                    const sel = isSelected(court._id, slot._id);
                    const durationMin = calcDurationMin(slot.startTime, slot.endTime);

                    if (past) {
                      return (
                        <div
                          key={slot._id}
                          className="bg-default-50 border border-default-100 rounded-2xl p-5 flex items-center justify-between opacity-40"
                        >
                          <span className="text-2xl font-black text-default-400">
                            {slot.startTime}
                          </span>
                          <div className="flex flex-col items-end gap-1">
                            <Clock size={16} className="text-default-300" />
                            <span className="text-xs font-bold tracking-widest uppercase text-default-400">
                              Pasado
                            </span>
                          </div>
                        </div>
                      );
                    }

                    if (!avail) {
                      return (
                        <div
                          key={slot._id}
                          className="bg-default-50 border border-default-100 rounded-2xl p-5 flex items-center justify-between opacity-50"
                        >
                          <span className="text-2xl font-black text-default-400">
                            {slot.startTime}
                          </span>
                          <div className="flex flex-col items-end gap-1">
                            <Lock size={16} className="text-default-300" />
                            <span className="text-xs font-bold tracking-widest uppercase text-default-400">
                              Ocupado
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={slot._id}
                        onClick={() => handleSlotClick(court, slot)}
                        className={`
                          rounded-2xl p-5 text-left flex flex-col gap-3 border transition-all
                          ${sel
                            ? "bg-primary/10 border-primary shadow-sm shadow-primary/20"
                            : "bg-default-100 border-default-200 hover:border-primary/40 hover:bg-primary/5"}
                        `}
                      >
                        {/* Hora + ícono acción */}
                        <div className="flex items-start justify-between">
                          <span className="text-2xl font-black text-foreground leading-none">
                            {slot.startTime}
                          </span>
                          <div
                            className={`
                              w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all
                              ${sel
                                ? "bg-primary border-primary"
                                : "bg-primary/10 border-primary/30"}
                            `}
                          >
                            {sel
                              ? <Check size={14} className="text-white" strokeWidth={3} />
                              : <Plus size={14} className="text-primary" strokeWidth={3} />
                            }
                          </div>
                        </div>

                        {/* Duración */}
                        {durationMin > 0 && (
                          <div>
                            <p className="text-xs font-bold tracking-widest uppercase text-default-400 mb-0.5">
                              Duración
                            </p>
                            <p className="text-base font-bold text-default-500">
                              {durationMin} MIN
                            </p>
                          </div>
                        )}

                        {/* Precio + estado */}
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-xl font-black text-primary">
                            {slot.price > 0 ? `$${slot.price.toLocaleString("es-AR")}` : "—"}
                          </span>
                          <span className={`text-xs font-bold tracking-widest uppercase ${sel ? "text-primary" : "text-default-400"}`}>
                            {sel ? "SELEC." : "DISP."}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Barra inferior de reserva ──────────────────────────────────────── */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-20
          bg-background/95 backdrop-blur-md border-t border-black/10 dark:border-white/10
          px-4 py-4 transition-transform duration-300 ease-out
          ${selectedSlot ? "translate-y-0" : "translate-y-full"}
        `}
      >
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-bold tracking-widest uppercase text-default-400 mb-0.5">
              Turno seleccionado
            </p>
            <p className="font-bold text-sm text-foreground truncate">
              {selectedSlot?.court.name} · {selectedSlot?.slot.startTime}
            </p>
            {(selectedSlot?.slot.price ?? 0) > 0 && (
              <p className="text-xs font-bold text-primary mt-0.5">
                Total ${selectedSlot?.slot.price.toLocaleString("es-AR")}
              </p>
            )}
          </div>
          <Button
            color="primary"
            radius="lg"
            className="font-black text-sm tracking-wider uppercase shrink-0 px-6 h-12 shadow-lg shadow-primary/30"
            onPress={handleCompleteBooking}
          >
            Reservar
          </Button>
        </div>
      </div>

      {/* ── Modales ────────────────────────────────────────────────────────── */}
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
            court={selectedSlot?.court ?? null}
            slot={selectedSlot?.slot ?? null}
            date={selectedDate}
            clientName={clientUser?.name || ""}
            onConfirmed={handleBookingConfirmed}
            onConflict={handleBookingConflict}
          />
          <MyBookingsDrawer
            isOpen={isMyBookingsOpen}
            onClose={closeMyBookings}
            slug={slug}
            isAuthenticated={isClientAuthenticated}
            cancellationLockHours={clubInfo?.cancellationLockHours ?? 0}
          />
        </>
      )}
    </div>
  );
};
