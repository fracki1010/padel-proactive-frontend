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
import { AlertTriangle, Clock, History } from "lucide-react";
import { useEffect, useState } from "react";
import { publicService } from "../../../services/publicService";

interface Booking {
  _id: string;
  date: string;
  status: string;
  court: { name: string };
  timeSlot: { startTime: string; endTime: string; label?: string };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  isAuthenticated: boolean;
  cancellationLockHours: number;
}

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
};

const statusColor: Record<string, "primary" | "success" | "warning" | "danger" | "default"> = {
  reservado: "primary",
  confirmado: "success",
  suspendido: "warning",
  cancelado: "danger",
};

const BookingCard = ({
  booking,
  onCancelPress,
  cancellingId,
  showCancel,
}: {
  booking: Booking;
  onCancelPress?: (b: Booking) => void;
  cancellingId: string | null;
  showCancel: boolean;
}) => (
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

export const MyBookingsDrawer = ({ isOpen, onClose, slug, isAuthenticated, cancellationLockHours }: Props) => {
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [history, setHistory] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmBooking, setConfirmBooking] = useState<Booking | null>(null);
  const [blockedBooking, setBlockedBooking] = useState<Booking | null>(null);

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
    if (cancellationLockHours > 0) {
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
    const id = confirmBooking._id;
    setConfirmBooking(null);
    setCancellingId(id);
    try {
      await publicService.cancelBooking(slug, id);
      addToast({ title: "Turno cancelado", color: "success" });
      setUpcoming((prev) => prev.filter((b) => b._id !== id));
    } catch (err: any) {
      addToast({
        title: err?.response?.data?.error || "No se pudo cancelar",
        color: "danger",
      });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <>
      <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="sm">
        <DrawerContent>
          <DrawerHeader className="flex flex-col gap-1">
            <span className="text-lg font-bold">Mis turnos</span>
          </DrawerHeader>
          <DrawerBody className="gap-6">
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
                          cancellingId={cancellingId}
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
    </>
  );
};
