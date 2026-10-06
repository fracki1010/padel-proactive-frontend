import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Spinner, addToast, useDisclosure } from "@heroui/react";
import { Check, ChevronDown, Clock, Lock, LogIn, LogOut, Plus, Ticket, User } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import logo from "../../assets/logo-8.svg";
import { useClientAuth } from "../../context/ClientAuthContext";
import { useAdaptiveHero } from "../../hooks/useAdaptiveHero";
import { publicService } from "../../services/publicService";
import type { Announcement } from "../../types";
import { HAPTIC_BOOKING_CONFIRMED, HAPTIC_TAP, vibrate } from "../../utils/haptics";
import { getHolderId } from "../../utils/holderId";
import { Announcements } from "./components/Announcements";
import { BookingConfirmModal } from "./components/BookingConfirmModal";
import { ClientAuthModal } from "./components/ClientAuthModal";
import { MyBookingsDrawer } from "./components/MyBookingsDrawer";
import { SlotSkeleton } from "./components/SlotSkeleton";

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
  locked?: boolean;
}

interface SelectedSlot {
  court: Court;
  slot: Slot;
}

interface ActiveLock {
  lockId: string;
  expiresAt: number;
  courtId: string;
  slotId: string;
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

const formatCountdown = (totalSeconds: number) => {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

// ─── Página ──────────────────────────────────────────────────────────────────

export const BookingPortalPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { clientToken, clientUser, isClientAuthenticated, logoutClient } = useClientAuth();

  const dates = buildDates();
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(null);

  const [lock, setLock] = useState<ActiveLock | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const holderId = useMemo(() => getHolderId(), []);

  const [clubInfo, setClubInfo] = useState<{
    club: { name: string; address?: string; coverImage?: string; companyId?: string };
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

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [isLoadingAvail, setIsLoadingAvail] = useState(false);

  const dateScrollRef = useRef<HTMLDivElement>(null);
  const setHeroRoot = useAdaptiveHero();

  const { isOpen: isAuthOpen, onOpen: openAuth, onClose: closeAuth } = useDisclosure();
  const { isOpen: isConfirmOpen, onOpen: openConfirm, onClose: closeConfirm } = useDisclosure();
  const { isOpen: isMyBookingsOpen, onOpen: openMyBookings, onClose: closeMyBookings } = useDisclosure();

  useEffect(() => {
    if (!slug) return;
    setIsLoadingInfo(true);
    publicService.getClubInfo(slug)
      .then((r) => {
        setClubInfo(r.data);
        if (clientToken) {
          try {
            const parts = clientToken.split(".");
            if (parts.length !== 3) throw new Error("malformed token");
            const payload = JSON.parse(atob(parts[1]));
            if (payload?.companyId && payload.companyId !== r.data?.club?.companyId) {
              logoutClient();
            }
          } catch {
            logoutClient();
          }
        }
      })
      .catch(() => setClubInfo(null))
      .finally(() => setIsLoadingInfo(false));
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    publicService
      .getAnnouncements(slug)
      .then((r) => setAnnouncements(r.data || []))
      .catch(() => setAnnouncements([]));
  }, [slug]);

  const refreshAvailability = useCallback(() => {
    if (!slug) return;
    setIsLoadingAvail(true);
    publicService.getAvailability(slug, selectedDate, holderId)
      .then((r) => setAvailability(r.data))
      .catch(() => setAvailability(null))
      .finally(() => setIsLoadingAvail(false));
  }, [slug, selectedDate, holderId]);

  useEffect(() => {
    if (!slug) return;
    setSelectedSlot(null);
    setLock(null);
    setExpandedSlotId(null);
    refreshAvailability();
  }, [slug, selectedDate, holderId, refreshAvailability]);

  // Countdown for the temporary slot lock.
  useEffect(() => {
    if (!lock) {
      setSecondsLeft(null);
      return;
    }
    const update = () => {
      const remaining = Math.round((lock.expiresAt - Date.now()) / 1000);
      if (remaining <= 0) {
        setLock(null);
        setSelectedSlot(null);
        addToast({ title: "El tiempo expiró, elegí otro turno", color: "warning" });
        refreshAvailability();
        return;
      }
      setSecondsLeft(remaining);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [lock, refreshAvailability]);

  const releaseLock = useCallback(
    async (activeLock: ActiveLock | null) => {
      if (!slug || !activeLock) return;
      try {
        await publicService.releaseSlotLock(slug, activeLock.lockId, holderId);
      } catch {
        // The backend TTL releases it anyway.
      }
    },
    [slug, holderId],
  );

  const handleCourtSelect = async (court: Court, slot: Slot) => {
    vibrate(HAPTIC_TAP);
    const isSame =
      selectedSlot?.court._id === court._id && selectedSlot?.slot._id === slot._id;
    if (isSame) {
      // Deseleccionar optimista: el check se va al instante; el lock se libera en background.
      setSelectedSlot(null);
      setLock(null);
      setExpandedSlotId(null);
      releaseLock(lock);
      return;
    }

    // Selección optimista: marca el check de inmediato; el lock se adquiere en paralelo.
    setSelectedSlot({ court, slot });
    setLock(null);
    if (lock && (lock.courtId !== court._id || lock.slotId !== slot._id)) {
      releaseLock(lock);
    }

    if (!slug) return;

    try {
      const res = await publicService.acquireSlotLock(slug, {
        courtId: court._id,
        slotId: slot._id,
        date: selectedDate,
        holderId,
      });
      setLock({
        lockId: res.data.lockId,
        expiresAt: new Date(res.data.expiresAt).getTime(),
        courtId: court._id,
        slotId: slot._id,
      });
    } catch (err: unknown) {
      const response = (err as { response?: { status?: number; data?: { error?: string } } })?.response;
      if (response?.status === 409) {
        // Otro lo tomó: si sigue siendo el turno que elegí, lo deselecciono.
        setSelectedSlot((prev) =>
          prev?.court._id === court._id && prev?.slot._id === slot._id ? null : prev,
        );
        setLock(null);
        setExpandedSlotId(null);
        addToast({
          title: response.data?.error || "Ese turno lo está reservando otra persona, elegí otro",
          color: "warning",
        });
        refreshAvailability();
      } else {
        // Lock best-effort; el índice único de la reserva sigue protegiendo el turno.
        setLock(null);
      }
    }
  };

  const handleCompleteBooking = () => {
    if (!selectedSlot) return;
    if (!isClientAuthenticated) openAuth();
    else openConfirm();
  };

  const handleAuthSuccess = () => {
    if (selectedSlot) openConfirm();
  };

  const handleBookingConfirmed = () => {
    vibrate(HAPTIC_BOOKING_CONFIRMED);
    setSelectedSlot(null);
    setLock(null);
    setExpandedSlotId(null);
    refreshAvailability();
  };

  const handleBookingConflict = () => {
    setSelectedSlot(null);
    setLock(null);
    refreshAvailability();
  };

  const courts = useMemo(
    () => availability?.courts || clubInfo?.courts || [],
    [availability, clubInfo],
  );
  const slots = useMemo(
    () => availability?.slots || clubInfo?.slots || [],
    [availability, clubInfo],
  );
  const { month, year } = selectedDate ? getDateParts(selectedDate) : { month: "", year: 0 };

  // Group availability by time slot: one row per horario with the count of
  // free courts, then the court list when expanded.
  const slotRows = useMemo(() => {
    const availableByKey = new Map<string, boolean>();
    (availability?.availability || []).forEach((item) => {
      availableByKey.set(`${item.courtId}_${item.slotId}`, item.available);
    });
    return slots.map((slot) => {
      const availableCourts = courts.filter(
        (court) => availableByKey.get(`${court._id}_${slot._id}`) === true,
      );
      const past = isSlotPast(slot.startTime, selectedDate);
      return {
        slot,
        availableCourts,
        past,
        disabled: past || availableCourts.length === 0,
      };
    });
  }, [slots, courts, availability, selectedDate]);

  const clubWords = clubInfo?.club?.name?.trim().split(" ") ?? [];
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
    <div ref={setHeroRoot} className="min-h-screen bg-background text-foreground font-sans">

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-black/10 dark:border-white/10"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo izquierda */}
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={logo}
              alt="Logo"
              className="w-10 h-10 rounded-xl object-cover shrink-0"
            />
            {/* The brand mark yields to the club name once the hero collapses. */}
            <span className="grid h-6 min-w-0 max-w-[160px]">
              <span
                aria-hidden="true"
                className="col-start-1 row-start-1 min-w-0 font-black text-base tracking-widest uppercase text-foreground truncate"
                style={{ opacity: "calc(1 - var(--hero-reveal, 0))" }}
              >
                PADEXA
              </span>
              <span
                className="col-start-1 row-start-1 min-w-0 font-black text-base tracking-widest uppercase text-foreground truncate"
                style={{ opacity: "var(--hero-reveal, 0)" }}
              >
                {clubInfo.club.name}
              </span>
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
      <section
        className="relative w-full overflow-hidden"
        style={{ minHeight: "calc(260px - var(--hero-p, 0) * 112px)" }}
      >

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
        <div
          className="relative max-w-2xl mx-auto px-6"
          style={{
            paddingTop: "calc(2.5rem - var(--hero-p, 0) * 1.5rem)",
            paddingBottom: "calc(3rem - var(--hero-p, 0) * 1.75rem)",
          }}
        >

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
          <h1
            className="leading-none"
            style={{ marginBottom: "calc(1.25rem - var(--hero-p, 0) * 0.5rem)" }}
          >
            <span
              className="font-black uppercase block"
              style={{
                fontSize:
                  "calc(clamp(3.8rem, 18vw, 6.5rem) * (1 - var(--hero-p, 0)) + 1.75rem * var(--hero-p, 0))",
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
          <div
            className="flex items-center gap-3"
            style={{ marginBottom: "calc(1rem - var(--hero-p, 0) * 0.5rem)" }}
          >
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
                  flex flex-col items-center py-4 px-4 rounded-md shrink-0 transition-all border
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

      {/* ── Avisos del club ───────────────────────────────────────────────── */}
      <Announcements announcements={announcements} />

      {/* ── Horarios disponibles ──────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-4 pb-40">

        {/* Cierre del club */}
        {availability?.closed && (
          <div className="mx-2 p-4 rounded-md border border-warning-200 bg-warning-50 dark:bg-warning-900/20 text-center mb-6">
            <p className="font-bold text-warning-600 dark:text-warning-400">El club está cerrado ese día</p>
            {availability.closureReason && (
              <p className="text-xs text-warning-500 mt-1">{availability.closureReason}</p>
            )}
          </div>
        )}

        {isLoadingAvail ? (
          <SlotSkeleton />
        ) : courts.length === 0 && !availability?.closed ? (
          <div className="flex flex-col items-center gap-3 py-20 text-default-400">
            <span className="text-4xl">🎾</span>
            <p className="text-sm">No hay canchas configuradas todavía</p>
          </div>
        ) : slots.length === 0 && !availability?.closed ? (
          <div className="flex flex-col items-center gap-3 py-20 text-default-400">
            <Clock size={32} />
            <p className="text-sm">No hay horarios configurados todavía</p>
          </div>
        ) : !availability?.closed ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-2">
              <p className="text-sm font-bold tracking-widest uppercase text-default-400">
                Horarios
              </p>
              <p className="text-xs font-bold tracking-widest uppercase text-default-400">
                Disponibilidad
              </p>
            </div>

            <div className="flex flex-col rounded-2xl border border-default-200 bg-default-50/60 overflow-hidden">
              {slotRows.map(({ slot, availableCourts, past, disabled }) => {
                const count = availableCourts.length;
                const expanded = expandedSlotId === slot._id;
                const duration = calcDurationMin(slot.startTime, slot.endTime);

                return (
                  <div key={slot._id} className="border-b border-default-100 last:border-b-0">
                    {/* Fila de horario */}
                    <button
                      type="button"
                      disabled={disabled}
                      aria-expanded={expanded}
                      onClick={() => {
                        vibrate(HAPTIC_TAP);
                        setExpandedSlotId(expanded ? null : slot._id);
                      }}
                      className={`
                        w-full flex items-center gap-4 px-4 py-4 text-left transition-colors
                        ${disabled
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:bg-primary/5 active:bg-primary/10"}
                      `}
                    >
                      <div className="w-20 shrink-0">
                        <span className={`text-2xl font-black tabular-nums leading-none ${disabled ? "text-default-400" : "text-foreground"}`}>
                          {slot.startTime}
                        </span>
                        {duration > 0 && (
                          <span className="block text-[10px] font-bold tracking-widest uppercase text-default-400 mt-1">
                            {duration} min
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {past ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-default-400">
                            <Clock size={13} /> Pasado
                          </span>
                        ) : count === 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-default-400">
                            <Lock size={13} /> Completo
                          </span>
                        ) : (
                          <span className={`text-sm font-bold ${expanded ? "text-primary" : "text-foreground/80"}`}>
                            {count} {count === 1 ? "cancha libre" : "canchas libres"}
                          </span>
                        )}
                      </div>

                      {!disabled && (
                        <div
                          className={`
                            w-9 h-9 rounded-full flex items-center justify-center shrink-0 border transition-all
                            ${expanded ? "bg-primary border-primary text-white" : "bg-primary/10 border-primary/20 text-primary"}
                          `}
                        >
                          <ChevronDown
                            size={18}
                            className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                          />
                        </div>
                      )}
                    </button>

                    {/* Canchas disponibles del horario */}
                    {expanded && count > 0 && (
                      <div className="px-4 pb-4 pt-1 flex flex-col gap-2 bg-background/60">
                        {availableCourts.map((court) => {
                          const sel =
                            selectedSlot?.court._id === court._id &&
                            selectedSlot?.slot._id === slot._id;
                          return (
                            <button
                              key={court._id}
                              type="button"
                              onClick={() => handleCourtSelect(court, slot)}
                              className={`
                                w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all
                                ${sel
                                  ? "border-primary bg-primary/10 shadow-sm shadow-primary/20"
                                  : "border-default-200 bg-default-100 hover:border-primary/40 hover:bg-primary/5"}
                              `}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-foreground truncate">{court.name}</p>
                                <div className="flex gap-1.5 mt-1 flex-wrap">
                                  {court.courtType && (
                                    <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border border-default-300 text-default-500">
                                      {court.courtType}
                                    </span>
                                  )}
                                  {court.surface && (
                                    <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border border-default-300 text-default-500">
                                      {court.surface}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <span className="text-lg font-black text-primary shrink-0 tabular-nums">
                                {slot.price > 0 ? `$${slot.price.toLocaleString("es-AR")}` : "—"}
                              </span>

                              <div
                                className={`
                                  w-7 h-7 rounded-full flex items-center justify-center shrink-0 border transition-all
                                  ${sel ? "bg-primary border-primary" : "bg-primary/10 border-primary/30"}
                                `}
                              >
                                {sel ? (
                                  <Check size={13} className="text-white" strokeWidth={3} />
                                ) : (
                                  <Plus size={13} className="text-primary" strokeWidth={3} />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>

      {/* ── Barra inferior de reserva ──────────────────────────────────────── */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-20
          bg-background/95 backdrop-blur-md border-t border-black/10 dark:border-white/10
          px-4 py-4 transition-transform duration-300 ease-out
          ${selectedSlot ? "translate-y-0" : "translate-y-full"}
        `}
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
      >
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="flex-1 min-w-0">
            {lock && secondsLeft !== null ? (
              <p className="text-[10px] font-bold tracking-widest uppercase text-warning-500 mb-0.5 flex items-center gap-1">
                <Clock size={11} /> Reservá en {formatCountdown(secondsLeft)}
              </p>
            ) : (
              <p className="text-[9px] font-bold tracking-widest uppercase text-default-400 mb-0.5">
                Turno seleccionado
              </p>
            )}
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
            holderId={holderId}
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
