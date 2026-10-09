import {
  Button,
  Chip,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  addToast,
} from "@heroui/react";
import { AlertTriangle, Clock, CreditCard, History, MessageCircle, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import {
  publicService,
  type BookingDeposit,
  type DepositStatus,
} from "../../../services/publicService";
import { openPaymentLink } from "../../../utils/openPaymentLink";
import { useIsDesktop } from "../../../hooks/useIsDesktop";

interface Booking {
  _id: string;
  date: string;
  status: string;
  court: { name: string };
  timeSlot: { startTime: string; endTime: string; label?: string };
  deposit?: BookingDeposit;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  isAuthenticated: boolean;
  cancellationLockHours: number;
  // Club's WhatsApp bot number (digits, may include non-digits). Shown when a
  // paid-deposit booking cannot be self-cancelled.
  contactPhone?: string;
}

const phoneDigits = (phone?: string) => (phone || "").replace(/\D/g, "");

// E.164-ish display: the stored value is a bare number, so prefix the plus.
const formatPhoneForHumans = (phone?: string) => {
  const digits = phoneDigits(phone);
  return digits ? `+${digits}` : "";
};

const formatDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
};

const minutesUntilSlot = (dateStr: string, startTime: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = startTime.split(":").map(Number);
  return (new Date(y, m - 1, d, h, min).getTime() - Date.now()) / 60000;
};

const statusLabel: Record<string, string> = {
  reservado: "Reservado",
  confirmado: "Confirmado",
  suspendido: "Suspendido",
  cancelado: "Cancelado",
  "pendiente_seña": "Seña pendiente",
};

const statusColor: Record<string, "primary" | "success" | "warning" | "danger" | "default"> = {
  reservado: "primary",
  confirmado: "success",
  suspendido: "warning",
  cancelado: "danger",
  "pendiente_seña": "warning",
};

// Deposit subdocument copy — shown for holds, paid seña and refund flows.
const depositStatusLabel: Record<DepositStatus, string> = {
  pendiente: "Seña pendiente",
  pagado: "Seña pagada",
  expirado: "Seña vencida",
  refund_pending: "Reembolso pendiente",
  reembolsado: "Reembolsado",
};

const depositStatusColor: Record<DepositStatus, "warning" | "success" | "default" | "danger"> = {
  pendiente: "warning",
  pagado: "success",
  expirado: "default",
  refund_pending: "warning",
  reembolsado: "default",
};

const BookingCard = ({
  booking,
  onCancelPress,
  onPayPress,
  cancellingId,
  payingId,
  showCancel,
}: {
  booking: Booking;
  onCancelPress?: (b: Booking) => void;
  onPayPress?: (b: Booking) => void;
  cancellingId: string | null;
  payingId: string | null;
  showCancel: boolean;
}) => {
  const deposit = booking.deposit;
  // The backend still allows a legacy `reservado` booking to mint a deposit
  // link, so both statuses are payable while the seña is pending.
  const canPay =
    (booking.status === "pendiente_seña" || booking.status === "reservado") &&
    deposit?.status === "pendiente";

  return (
    <div className="rounded-xl border border-default-200 bg-default-50 p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">{booking.court?.name}</span>
        <Chip size="sm" color={statusColor[booking.status] || "default"} variant="flat">
          {statusLabel[booking.status] || booking.status}
        </Chip>
      </div>
      <div className="text-xs text-default-500 flex gap-3">
        <span>{formatDate(booking.date)}</span>
        <span>
          {booking.timeSlot?.label || `${booking.timeSlot?.startTime} - ${booking.timeSlot?.endTime}`}
        </span>
      </div>
      {deposit && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-default-500">
            Seña ${Number(deposit.amount || 0).toLocaleString("es-AR")}
          </span>
          <Chip size="sm" variant="dot" color={depositStatusColor[deposit.status] || "default"}>
            {depositStatusLabel[deposit.status] || deposit.status}
          </Chip>
        </div>
      )}
      {canPay && onPayPress && (
        <Button
          size="sm"
          color="primary"
          isLoading={payingId === booking._id}
          onPress={() => onPayPress(booking)}
          className="mt-1 font-bold"
          startContent={payingId === booking._id ? undefined : <CreditCard size={15} />}
        >
          Pagar seña
        </Button>
      )}
      {showCancel && booking.status !== "suspendido" && onCancelPress && (
        <Button
          size="sm"
          variant="flat"
          color="danger"
          isLoading={cancellingId === booking._id}
          onPress={() => onCancelPress(booking)}
          className="mt-1"
        >
          Cancelar turno
        </Button>
      )}
    </div>
  );
};

export const MyBookingsDrawer = ({ isOpen, onClose, slug, isAuthenticated, cancellationLockHours, contactPhone }: Props) => {
  const isDesktop = useIsDesktop();
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [history, setHistory] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [confirmBooking, setConfirmBooking] = useState<Booking | null>(null);
  const [blockedBooking, setBlockedBooking] = useState<Booking | null>(null);
  // Paid-deposit bookings cannot be self-cancelled: the club must handle them.
  // The contact phone may come from the club info prop or the 409 response.
  const [paidDeposit, setPaidDeposit] = useState<{ booking: Booking; contactPhone: string } | null>(null);

  const load = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await publicService.getMyBookings(slug);
      setUpcoming(res.data?.upcoming || []);
      setHistory(res.data?.history || []);
    } catch {
      addToast({ title: "No se pudieron cargar tus turnos", color: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen]);

  const handleCancelPress = (booking: Booking) => {
    // A paid seña never self-cancels: route the client to the club contact.
    if (booking.deposit?.status === "pagado") {
      setPaidDeposit({ booking, contactPhone: contactPhone || "" });
      return;
    }
    if (cancellationLockHours > 0 && booking.timeSlot?.startTime) {
      const minutes = minutesUntilSlot(booking.date, booking.timeSlot.startTime);
      if (minutes < cancellationLockHours * 60) {
        setBlockedBooking(booking);
        return;
      }
    }
    setConfirmBooking(booking);
  };

  const handleConfirmCancel = async () => {
    if (!confirmBooking) return;
    const booking = confirmBooking;
    const id = booking._id;
    setConfirmBooking(null);
    setCancellingId(id);
    try {
      await publicService.cancelBooking(slug, id);
      addToast({ title: "Turno cancelado", color: "success" });
      setUpcoming((prev) => prev.filter((b) => b._id !== id));
    } catch (err: any) {
      const response = err?.response;
      const data = response?.data;
      // Defense in depth: the backend may block a paid-deposit cancel even if
      // the local deposit snapshot was stale. Show the same club-contact modal.
      if (response?.status === 409 && data?.error === "CANCEL_REQUIRES_ADMIN") {
        setPaidDeposit({ booking, contactPhone: data?.contactPhone || contactPhone || "" });
        return;
      }
      addToast({
        title: data?.error || "No se pudo cancelar",
        color: "danger",
      });
    } finally {
      setCancellingId(null);
    }
  };

  const handlePayDeposit = async (booking: Booking) => {
    setPayingId(booking._id);
    try {
      // Mint a fresh link on demand: the list endpoint does not expose
      // `initPoint`, and a stale preference may have expired. `openPaymentLink`
      // falls back to copying the URL when the await loses the popup gesture.
      const res = await publicService.regeneratePaymentLink(slug, booking._id);
      const link = res.data?.initPoint;
      if (!link) throw new Error("empty payment link");
      await openPaymentLink(link);
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { error?: string; code?: string } } })?.response;
      const code = response?.data?.code;
      if (code === "DEPOSIT_EXPIRED") {
        // Disable the pay action locally instead of only toasting.
        setUpcoming((prev) =>
          prev.map((b) =>
            b._id === booking._id && b.deposit
              ? { ...b, deposit: { ...b.deposit, status: "expirado" } }
              : b,
          ),
        );
      }
      const message = code === "DEPOSIT_EXPIRED"
        ? "La seña venció; el turno ya no admite pago"
        : code === "DEPOSIT_NOT_CONFIGURED"
          ? "El pago de seña no está disponible en este momento"
          : response?.data?.error || "No se pudo generar el link de pago";
      addToast({ title: message, color: "danger" });
    } finally {
      setPayingId(null);
    }
  };

  const paidPhoneDigits = phoneDigits(paidDeposit?.contactPhone);
  const paidPhoneHuman = formatPhoneForHumans(paidDeposit?.contactPhone);

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        placement={isDesktop ? "right" : "bottom"}
        size={isDesktop ? "sm" : "3xl"}
        classNames={{
          base: isDesktop
            ? "rounded-l-[var(--md-sys-shape-corner-extra-large)] bg-[var(--md-sys-color-surface-container)]"
            : "rounded-t-[var(--md-sys-shape-corner-extra-large)] bg-[var(--md-sys-color-surface-container)]",
        }}
      >
        <DrawerContent>
          <DrawerHeader className="flex flex-col gap-1">
            <span className="md3-typescale-title-large">Mis turnos</span>
          </DrawerHeader>
          <DrawerBody className="gap-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : (
              <>
                {/* ── Próximas reservas ── */}
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-default-400 mb-3">
                    Próximas reservas
                  </p>
                  {upcoming.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-default-400">
                      <span className="text-3xl">🎾</span>
                      <p className="text-xs">No tenés turnos próximos</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {upcoming.map((b) => (
                        <BookingCard
                          key={b._id}
                          booking={b}
                          onCancelPress={handleCancelPress}
                          onPayPress={handlePayDeposit}
                          cancellingId={cancellingId}
                          payingId={payingId}
                          showCancel
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Historial ── */}
                {history.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <History size={12} className="text-default-400" />
                      <p className="text-[10px] font-bold tracking-widest uppercase text-default-400">
                        Historial (últimos 60 días)
                      </p>
                    </div>
                    <div className="flex flex-col gap-3">
                      {history.map((b) => (
                        <BookingCard
                          key={b._id}
                          booking={b}
                          cancellingId={cancellingId}
                          payingId={payingId}
                          showCancel={false}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Modal: confirmación */}
      <Modal isOpen={!!confirmBooking} onClose={() => setConfirmBooking(null)} size="sm">
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-warning" />
            Cancelar turno
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-600">
              ¿Estás seguro que querés cancelar el turno de las{" "}
              <span className="font-bold text-foreground">{confirmBooking?.timeSlot?.startTime}</span>{" "}
              en <span className="font-bold text-foreground">{confirmBooking?.court?.name}</span>?
            </p>
            <p className="text-xs text-default-400 mt-1">Esta acción no se puede deshacer.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" size="sm" onPress={() => setConfirmBooking(null)}>Volver</Button>
            <Button color="danger" size="sm" onPress={handleConfirmCancel}>Sí, cancelar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal: bloqueo por ventana */}
      <Modal isOpen={!!blockedBooking} onClose={() => setBlockedBooking(null)} size="sm">
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <Clock size={18} className="text-danger" />
            No podés cancelar
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-600">
              Este turno comienza en menos de{" "}
              <span className="font-bold text-foreground">
                {cancellationLockHours} hora{cancellationLockHours !== 1 ? "s" : ""}
              </span>
              , por lo que ya no es posible cancelarlo desde el portal.
            </p>
            <p className="text-sm text-default-600 mt-2">
              Si necesitás cancelar, comunicate directamente con el club con la debida anticipación.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" size="sm" onPress={() => setBlockedBooking(null)}>Entendido</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal: seña abonada — derivar al contacto del club */}
      <Modal isOpen={!!paidDeposit} onClose={() => setPaidDeposit(null)} size="sm">
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <CreditCard size={18} className="text-warning" />
            Seña abonada
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-600">
              Este turno tiene la seña abonada. Para cancelarlo, comunicate con el club.
            </p>
            {paidPhoneHuman && (
              <p className="text-sm text-default-600 mt-2">
                Teléfono:{" "}
                <span className="font-semibold text-foreground">{paidPhoneHuman}</span>
              </p>
            )}
          </ModalBody>
          <ModalFooter className="flex flex-wrap gap-2">
            <Button variant="flat" size="sm" onPress={() => setPaidDeposit(null)}>
              Cerrar
            </Button>
            {paidPhoneDigits && (
              <>
                <Button
                  as="a"
                  href={`tel:+${paidPhoneDigits}`}
                  variant="flat"
                  size="sm"
                  startContent={<Phone size={15} />}
                >
                  Llamar
                </Button>
                <Button
                  as="a"
                  href={`https://wa.me/${paidPhoneDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="success"
                  size="sm"
                  startContent={<MessageCircle size={15} />}
                >
                  WhatsApp
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
