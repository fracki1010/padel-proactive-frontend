import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Spinner, addToast, useDisclosure } from "@heroui/react";
import { ArrowRight, Calendar, Check, ChevronDown, ChevronUp, CircleDot, Clock, LayoutGrid, Leaf, Lock, LogIn, LogOut, MapPin, Plus, Ticket, User, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import logo from "../../assets/logo.svg";
import { useQueryClient } from "@tanstack/react-query";
import { useClientAuth } from "../../context/ClientAuthContext";
import { useAdaptiveHero } from "../../hooks/useAdaptiveHero";
import { formatCountdown } from "../../utils/formatters";
import { HAPTIC_BOOKING_CONFIRMED, HAPTIC_TAP, vibrate } from "../../utils/haptics";
import { getHolderId } from "../../utils/holderId";
import { openPaymentLink } from "../../utils/openPaymentLink";
import { Announcements } from "./components/Announcements";
import { BookingConfirmModal } from "./components/BookingConfirmModal";
import { ClientAuthModal } from "./components/ClientAuthModal";
import { MyBookingsDrawer } from "./components/MyBookingsDrawer";
import { SlotSkeleton } from "./components/SlotSkeleton";
import { useAcquireSlotLock, useRegeneratePaymentLink, useReleaseSlotLock } from "./hooks/usePortalMutations";
import { useClubInfo, usePortalAnnouncements, usePortalAvailability } from "./hooks/usePortalQueries";
import type { BookingTransfer } from "../../services/publicService";

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

interface PendingDeposit {
  bookingId: string;
  amount: number;
  link: string;
  expiresAt: string | null;
  transfer?: BookingTransfer;
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
  const { clientToken, clientUser, isClientAuthenticated, logoutClient } = useClientAuth();

  const dates = buildDates();
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(null);

  const [lock, setLock] = useState<ActiveLock | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const holderId = useMemo(() => getHolderId(), []);

  // Deposit (seña) hold created by this session. Keeping the issued link in
  // page state means the payment stays reachable even if the club disables
  // deposits mid-flight (the already-minted preference is still valid).
  const [pendingDeposit, setPendingDeposit] = useState<PendingDeposit | null>(null);
  const [pendingSecondsLeft, setPendingSecondsLeft] = useState<number | null>(null);
  const [isRegeneratingLink, setIsRegeneratingLink] = useState(false);

  const queryClient = useQueryClient();
  const acquireLockMutation = useAcquireSlotLock(slug);
  const releaseLockMutation = useReleaseSlotLock(slug);
  const regenerateLinkMutation = useRegeneratePaymentLink(slug);
  const { data: clubInfo, isLoading: isLoadingInfo } = useClubInfo(slug);
  const { data: announcements = [] } = usePortalAnnouncements(slug);
  // When the club pauses bookings, clients keep read access to the grid but the
  // selection/lock/confirm flow is disabled (the backend also 409s as a guard).
  const bookingsPaused = clubInfo?.club?.bookingsPaused === true;
  const { data: availability, isFetching: isLoadingAvail } = usePortalAvailability(
    slug,
    selectedDate,
    holderId,
  );

  const dateScrollRef = useRef<HTMLDivElement>(null);
  const setHeroRoot = useAdaptiveHero();

  const { isOpen: isAuthOpen, onOpen: openAuth, onClose: closeAuth } = useDisclosure();
  const { isOpen: isConfirmOpen, onOpen: openConfirm, onClose: closeConfirm } = useDisclosure();
  const { isOpen: isMyBookingsOpen, onOpen: openMyBookings, onClose: closeMyBookings } = useDisclosure();

  // The club-info query carries the companyId the client token must belong to.
  // Kept as a side effect reacting to the query data (not inside the queryFn)
  // so the login check never blocks rendering of the portal data itself.
  useEffect(() => {
    if (!clubInfo || !clientToken) return;
    try {
      const parts = clientToken.split(".");
      if (parts.length !== 3) throw new Error("malformed token");
      const payload = JSON.parse(atob(parts[1]));
      if (payload?.companyId && payload.companyId !== clubInfo.club?.companyId) {
        logoutClient();
      }
    } catch {
      logoutClient();
    }
  }, [clubInfo, clientToken, logoutClient]);

  // The availability query refetches on its own when slug/date/holderId change;
  // this effect only resets the selection state tied to the previous grid.
  useEffect(() => {
    if (!slug) return;
    setSelectedSlot(null);
    setLock(null);
    setExpandedSlotId(null);
  }, [slug, selectedDate, holderId]);

  // Post-mutation refreshes (lock expiry, booking done/conflict) re-fetch the
  // availability query instead of re-running the service call by hand.
  const refreshAvailability = useCallback(() => {
    if (!slug) return;
    queryClient.invalidateQueries({ queryKey: ["portal-availability"] });
  }, [slug, queryClient]);

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

  // Countdown for a pending seña hold so the banner can show remaining time.
  useEffect(() => {
    if (!pendingDeposit?.expiresAt) {
      setPendingSecondsLeft(null);
      return;
    }
    const target = new Date(pendingDeposit.expiresAt).getTime();
    const tick = () => {
      setPendingSecondsLeft(Math.max(0, Math.round((target - Date.now()) / 1000)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [pendingDeposit?.expiresAt]);

  const releaseLock = useCallback(
    (activeLock: ActiveLock | null) => {
      if (!slug || !activeLock) return;
      releaseLockMutation.mutate({ lockId: activeLock.lockId, holderId });
    },
    [slug, holderId, releaseLockMutation],
  );

  const handleCourtSelect = async (court: Court, slot: Slot) => {
    vibrate(HAPTIC_TAP);
    if (bookingsPaused) {
      // Keep the grid visible but never reach the lock/confirm flow.
      addToast({
        title: "Las reservas están pausadas por el momento — solo podés consultar los turnos",
        color: "warning",
      });
      return;
    }
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
      const res = await acquireLockMutation.mutateAsync({
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
    if (bookingsPaused || !selectedSlot) return;
    if (!isClientAuthenticated) openAuth();
    else openConfirm();
  };

  const handleAuthSuccess = () => {
    if (bookingsPaused) return;
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

  const handleDepositPending = useCallback(
    (info: PendingDeposit) => {
      setPendingDeposit(info);
    },
    [],
  );

  // The modal can refresh the link after creating an empty one; mirror it here
  // so the banner never holds a stale URL.
  const handleDepositLinkChange = useCallback((link: string) => {
    setPendingDeposit((prev) => (prev ? { ...prev, link } : prev));
  }, []);

  const handleResumeDepositPayment = () => {
    if (pendingDeposit?.link) {
      void openPaymentLink(pendingDeposit.link);
    }
  };

  const handleRegenerateDepositLink = async () => {
    if (!slug || !pendingDeposit) return;
    setIsRegeneratingLink(true);
    try {
      const res = await regenerateLinkMutation.mutateAsync(pendingDeposit.bookingId);
      const link = res.data?.initPoint;
      if (!link) throw new Error("empty payment link");
      setPendingDeposit((prev) => (prev ? { ...prev, link } : prev));
      await openPaymentLink(link);
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { error?: string; code?: string } } })?.response;
      const code = response?.data?.code;
      if (code === "DEPOSIT_EXPIRED") {
        // Move the banner to its expired state locally.
        setPendingDeposit((prev) =>
          prev ? { ...prev, expiresAt: prev.expiresAt ?? new Date().toISOString() } : prev,
        );
        setPendingSecondsLeft(0);
      }
      const message = code === "DEPOSIT_EXPIRED"
        ? "La seña venció; el turno ya no admite pago"
        : code === "DEPOSIT_NOT_CONFIGURED"
          ? "El pago de seña no está disponible en este momento"
          : response?.data?.error || "No se pudo generar el link de pago";
      addToast({ title: message, color: "danger" });
    } finally {
      setIsRegeneratingLink(false);
    }
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

  // Derived display labels for the restyled hero and docked action bar. Purely
  // presentational — they never feed the query/mutation or selection flows.
  const hoursLabel = useMemo(() => {
    const starts = slots.map((s) => s.startTime).filter(Boolean).sort();
    const ends = slots.map((s) => s.endTime).filter(Boolean).sort();
    if (starts.length === 0 || ends.length === 0) return null;
    return `${starts[0]} - ${ends[ends.length - 1]} hs`;
  }, [slots]);

  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return "";
    const [y, m, d] = selectedDate.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const capitalize = (value: string) =>
      value.charAt(0).toUpperCase() + value.slice(1);
    return `${capitalize(date.toLocaleDateString("es-AR", { weekday: "long" }))} ${d} de ${capitalize(
      date.toLocaleDateString("es-AR", { month: "long" }),
    )}`;
  }, [selectedDate]);

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
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background shadow-xl">

        {/* ── TopAppBar ─────────────────────────────────────────────────────── */}
        <header
          className="sticky top-0 z-40 border-b border-outline-variant bg-background/95 px-4 py-3 backdrop-blur-md"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
        >
          <div className="flex items-center justify-between gap-2">
            {/* Logotipo / nombre del club (se intercambian con el scroll) */}
            <div className="flex min-w-0 items-center gap-2.5">
              <img
                src={logo}
                alt="PADEXA"
                className="h-10 w-10 shrink-0 object-contain"
              />
              {/* The brand mark yields to the club name once the hero collapses. */}
              <span className="grid min-w-0">
                <span
                  aria-hidden="true"
                  className="col-start-1 row-start-1 min-w-0 text-xl font-black leading-none tracking-wider text-primary truncate"
                  style={{ opacity: "calc(1 - var(--hero-reveal, 0))" }}
                >
                  PADEXA
                </span>
                <span
                  className="col-start-1 row-start-1 min-w-0 text-base font-black uppercase leading-none tracking-widest text-foreground truncate"
                  style={{ opacity: "var(--hero-reveal, 0)" }}
                >
                  {clubInfo.club.name}
                </span>
                <span className="col-start-1 row-start-2 text-[10px] font-semibold uppercase tracking-widest text-outline">
                  Court Booking
                </span>
              </span>
            </div>

            {/* Acciones de cuenta */}
            <div className="flex shrink-0 items-center gap-2">
              {isClientAuthenticated ? (
                <>
                  <Button
                    isIconOnly
                    variant="light"
                    size="md"
                    radius="full"
                    className="text-on-surface-variant"
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
                        radius="full"
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
                  radius="full"
                  className="bg-secondary-container text-on-secondary-container font-medium text-sm"
                  startContent={<LogIn size={18} />}
                  onPress={openAuth}
                >
                  Ingresar
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* ── Contenido ─────────────────────────────────────────────────────── */}
        <main className="flex flex-1 flex-col gap-5 px-4 pt-3 pb-40">

          {/* ── Hero del club ── */}
          <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0c2d3a] via-[#05445e] to-[#189ab4] p-6 text-white shadow-lg">
            {/* Imagen de portada del club (subida desde Configuración) con overlay para legibilidad */}
            {clubInfo.club.coverImage && (
              <>
                <img
                  src={clubInfo.club.coverImage}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/45 to-black/20" />
              </>
            )}
            {/* Fondo geométrico decorativo */}
            <div className="pointer-events-none absolute -right-8 -top-8 flex h-56 w-56 items-center justify-center rounded-full border-[10px] border-white/10">
              <div className="h-40 w-40 rounded-full border border-white/15" />
            </div>
            <div className="pointer-events-none absolute bottom-2 right-4 text-white opacity-15">
              <img src={logo} alt="" aria-hidden="true" className="h-[120px] w-auto object-contain" />
            </div>

            <div className="relative z-10 flex flex-col items-start gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-100 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-cyan-300 animate-pulse" />
                Reservá tu turno
              </span>

              <div className="mt-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-cyan-200">
                  Club de Padel
                </p>
                <h1 className="text-4xl font-extrabold uppercase leading-tight tracking-tight text-white drop-shadow-sm">
                  {clubInfo.club.name}
                </h1>
              </div>

              {clubInfo.club.address && (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-cyan-100/90">
                  <MapPin size={16} />
                  <span>{clubInfo.club.address}</span>
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/80">
                {hoursLabel && (
                  <span className="flex items-center gap-1 rounded-md bg-black/20 px-2.5 py-1">
                    <Clock size={14} />
                    {hoursLabel}
                  </span>
                )}
                {courts.length > 0 && (
                  <span className="flex items-center gap-1 rounded-md bg-black/20 px-2.5 py-1">
                    <LayoutGrid size={14} />
                    {courts.length} {courts.length === 1 ? "Cancha" : "Canchas"}
                  </span>
                )}
              </div>

              {isClientAuthenticated && (
                <p className="mt-2 text-sm text-white/70">
                  Hola,{" "}
                  <span className="font-bold text-white">{clientUser?.name}</span>
                </p>
              )}
            </div>
          </section>

          {/* ── Selector de fecha ── */}
          <section className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-outline">
                Seleccioná una fecha
              </h2>
              <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary">
                <Calendar size={14} />
                {month} {year}
              </span>
            </div>

            <div
              ref={dateScrollRef}
              className="flex items-center gap-2.5 overflow-x-auto py-1 -mx-4 px-4 scroll-smooth"
              style={{ scrollbarWidth: "none" }}
            >
              {dates.map((iso) => {
                const { dayName, day } = getDateParts(iso);
                const isActive = iso === selectedDate;
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setSelectedDate(iso)}
                    aria-pressed={isActive}
                    aria-label={`${dayName} ${day}`}
                    className={`
                      flex h-20 w-16 shrink-0 flex-col items-center justify-center rounded-xl transition-transform active:scale-95
                      ${isActive
                        ? "bg-primary text-on-primary shadow-md ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "border border-outline-variant bg-surface-container text-on-surface hover:bg-surface-container-high"}
                    `}
                  >
                    <span className={`text-xs font-medium uppercase tracking-wide ${isActive ? "opacity-90" : "text-outline"}`}>
                      {dayName}
                    </span>
                    <span className="mt-1 text-2xl font-bold leading-none">{day}</span>
                    <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${isActive ? "bg-white" : "bg-transparent"}`} />
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Avisos del club ── */}
          <Announcements announcements={announcements} />

          {/* ── Reservas pausadas ── */}
          {bookingsPaused && (
            <div className="rounded-lg border border-warning-200 bg-warning-50 dark:bg-warning-900/20 p-4 text-center">
              <p className="font-bold text-warning-600 dark:text-warning-400">
                Reservas pausadas por el momento — solo podés consultar los turnos.
              </p>
              <p className="mt-1 text-xs text-warning-500">
                La grilla sigue disponible para que veas los horarios.
              </p>
            </div>
          )}

          {/* ── Horarios disponibles ── */}

          {/* Cierre del club */}
          {availability?.closed && (
            <div className="rounded-lg border border-warning-200 bg-warning-50 dark:bg-warning-900/20 p-4 text-center">
              <p className="font-bold text-warning-600 dark:text-warning-400">
                El club está cerrado ese día
              </p>
              {availability.closureReason && (
                <p className="mt-1 text-xs text-warning-500">{availability.closureReason}</p>
              )}
            </div>
          )}

          {isLoadingAvail ? (
            <SlotSkeleton />
          ) : courts.length === 0 && !availability?.closed ? (
            <div className="flex flex-col items-center gap-3 py-20 text-on-surface-variant">
              <CircleDot size={36} />
              <p className="text-sm">No hay canchas configuradas todavía</p>
            </div>
          ) : slots.length === 0 && !availability?.closed ? (
            <div className="flex flex-col items-center gap-3 py-20 text-on-surface-variant">
              <Clock size={32} />
              <p className="text-sm">No hay horarios configurados todavía</p>
            </div>
          ) : !availability?.closed ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-outline">
                  Horarios
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-outline">
                  Disponibilidad
                </span>
              </div>

              {slotRows.map(({ slot, availableCourts, past, disabled }) => {
                const count = availableCourts.length;
                const expanded = expandedSlotId === slot._id;
                const duration = calcDurationMin(slot.startTime, slot.endTime);

                return (
                  <article
                    key={slot._id}
                    className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low shadow-sm transition-all"
                  >
                    {/* Fila de horario (accordion header) */}
                    <button
                      type="button"
                      disabled={disabled}
                      aria-expanded={expanded}
                      onClick={() => {
                        vibrate(HAPTIC_TAP);
                        setExpandedSlotId(expanded ? null : slot._id);
                      }}
                      className={`
                        flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors
                        ${disabled
                          ? "cursor-not-allowed opacity-40"
                          : "cursor-pointer hover:bg-surface-container"}
                        ${expanded ? "bg-surface-container" : ""}
                      `}
                    >
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className={`text-2xl font-bold tabular-nums leading-none ${disabled ? "text-on-surface-variant" : "text-on-surface"}`}>
                            {slot.startTime}
                          </span>
                          {duration > 0 && (
                            <span className="text-xs font-medium uppercase tracking-wider text-outline">
                              {duration} MIN
                            </span>
                          )}
                        </div>

                        {past ? (
                          <span className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-semibold text-outline">
                            <Clock size={13} /> Pasado
                          </span>
                        ) : count === 0 ? (
                          <span className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-semibold text-outline">
                            <Lock size={13} /> Completo
                          </span>
                        ) : (
                          <span className={`mt-0.5 inline-flex items-center gap-1.5 text-xs font-semibold ${expanded ? "text-primary" : "text-emerald-600 dark:text-emerald-400"}`}>
                            <span className={`h-2 w-2 rounded-full ${expanded ? "bg-emerald-500" : "bg-emerald-600"}`} />
                            {count} {count === 1 ? "cancha libre" : "canchas libres"}
                          </span>
                        )}
                      </div>

                      {!disabled && (
                        <span
                          className={`
                            flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all
                            ${expanded ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-high text-primary"}
                          `}
                        >
                          {expanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                        </span>
                      )}
                    </button>

                    {/* Canchas disponibles del horario */}
                    {expanded && count > 0 && (
                      <div className="space-y-2.5 bg-surface-container-low p-3">
                        {availableCourts.map((court) => {
                          const sel =
                            selectedSlot?.court._id === court._id &&
                            selectedSlot?.slot._id === slot._id;
                          return (
                            <button
                              key={court._id}
                              type="button"
                              onClick={() => handleCourtSelect(court, slot)}
                              aria-pressed={sel}
                              aria-label={sel ? `${court.name} seleccionada` : `Seleccionar ${court.name}`}
                              className={`
                                relative flex w-full items-center justify-between gap-3 rounded-lg p-3.5 text-left transition-all
                                ${sel
                                  ? "border-2 border-primary bg-primary/10 shadow-sm"
                                  : "border border-outline-variant bg-surface-container-lowest hover:border-primary/50"}
                              `}
                            >
                              {sel && (
                                <span className="absolute -top-2 right-4 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-on-primary">
                                  Seleccionada
                                </span>
                              )}

                              <div className="flex min-w-0 flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="truncate text-sm font-bold text-on-surface">
                                    {court.name}
                                  </span>
                                  {court.courtType && (
                                    <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
                                      {court.courtType}
                                    </span>
                                  )}
                                </div>
                                {court.surface && (
                                  <div className="flex items-center gap-1 text-[11px] text-outline">
                                    <Leaf size={14} />
                                    <span>{court.surface}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex shrink-0 items-center gap-3">
                                <span className="text-base font-bold tabular-nums text-primary">
                                  {slot.price > 0 ? `$${slot.price.toLocaleString("es-AR")}` : "—"}
                                </span>
                                <span
                                  className={`
                                    flex h-9 w-9 items-center justify-center rounded-full transition-all
                                    ${sel
                                      ? "bg-primary text-on-primary shadow-sm"
                                      : "bg-secondary-container text-on-secondary-container"}
                                  `}
                                >
                                  {sel ? (
                                    <Check size={18} strokeWidth={3} />
                                  ) : (
                                    <Plus size={18} strokeWidth={3} />
                                  )}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : null}
        </main>

        {/* ── Barra inferior de reserva ─────────────────────────────────────── */}
        <footer
          className={`
            fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md
            border-t border-outline-variant bg-surface-container-lowest
            px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]
            transition-transform duration-300 ease-[var(--md-sys-motion-emphasized)]
            ${!bookingsPaused && selectedSlot ? "translate-y-0" : "translate-y-full"}
          `}
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              {lock && secondsLeft !== null ? (
                <p
                  aria-live="polite"
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-warning-500"
                >
                  <Clock size={11} /> Reservá en {formatCountdown(secondsLeft)}
                </p>
              ) : (
                <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
                  Turno seleccionado
                </p>
              )}
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="truncate text-sm font-extrabold text-on-surface">
                  {selectedSlot?.court.name} · {selectedSlot?.slot.startTime} hs
                </span>
                {(selectedSlot?.slot.price ?? 0) > 0 && (
                  <span className="shrink-0 text-xs font-semibold text-primary">
                    (${selectedSlot?.slot.price.toLocaleString("es-AR")})
                  </span>
                )}
              </div>
              <p className="truncate text-[11px] text-outline">{selectedDateLabel}</p>
            </div>
            <Button
              color="primary"
              radius="full"
              className="h-12 shrink-0 px-6 font-bold text-sm uppercase tracking-wide shadow-lg shadow-primary/30"
              endContent={<ArrowRight size={18} />}
              onPress={handleCompleteBooking}
            >
              Reservar
            </Button>
          </div>
        </footer>

        {/* ── Aviso de seña pendiente ────────────────────────────────────────── */}
        {pendingDeposit && (() => {
          const fallbackSeconds = pendingDeposit.expiresAt
            ? Math.max(0, Math.round((new Date(pendingDeposit.expiresAt).getTime() - Date.now()) / 1000))
            : null;
          const seconds = pendingSecondsLeft ?? fallbackSeconds;
          const expired = Boolean(pendingDeposit.expiresAt) && seconds !== null && seconds <= 0;
          return (
            <div
              className="fixed inset-x-0 bottom-0 z-[60] mx-auto max-w-md border-t border-outline-variant bg-surface-container-lowest px-4 py-3"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0" aria-live="polite">
                  <p
                    className={`text-[10px] font-bold tracking-widest uppercase ${
                      expired ? "text-outline" : "text-warning-500"
                    }`}
                  >
                    {expired ? "Seña vencida" : "Seña pendiente"}
                  </p>
                  <p className="font-bold text-sm text-foreground truncate">
                    ${pendingDeposit.amount.toLocaleString("es-AR")}
                    {!expired && seconds !== null
                      ? ` · ${formatCountdown(seconds)}`
                      : ""}
                  </p>
                  {pendingDeposit.transfer ? (
                    <p className="text-[11px] text-on-surface-variant font-semibold truncate">
                      Transferencia: enviá el comprobante por WhatsApp
                    </p>
                  ) : null}
                </div>
                {!expired && !pendingDeposit.transfer && (
                  <Button
                    color="primary"
                    radius="full"
                    size="sm"
                    className="font-bold shrink-0"
                    isLoading={isRegeneratingLink && !pendingDeposit.link}
                    onPress={pendingDeposit.link ? handleResumeDepositPayment : handleRegenerateDepositLink}
                  >
                    {pendingDeposit.link ? "Pagar seña" : "Generar link"}
                  </Button>
                )}
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="shrink-0"
                  onPress={() => setPendingDeposit(null)}
                  aria-label="Descartar aviso de seña"
                  title="Descartar aviso"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          );
        })()}

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
              contactPhone={clubInfo?.club?.contactPhone ?? ""}
              onConfirmed={handleBookingConfirmed}
              onConflict={handleBookingConflict}
              onDepositPending={handleDepositPending}
              onDepositLinkChange={handleDepositLinkChange}
            />
            <MyBookingsDrawer
              isOpen={isMyBookingsOpen}
              onClose={closeMyBookings}
              slug={slug}
              isAuthenticated={isClientAuthenticated}
              cancellationLockHours={clubInfo?.cancellationLockHours ?? 0}
              contactPhone={clubInfo?.club?.contactPhone ?? ""}
            />
          </>
        )}
      </div>
    </div>
  );
};
