import {
  Button,
  Chip,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  Spinner,
  addToast,
} from "@heroui/react";
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
}

const formatDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
};

const statusLabel: Record<string, string> = {
  reservado: "Reservado",
  confirmado: "Confirmado",
  suspendido: "Suspendido",
};

const statusColor: Record<string, "primary" | "success" | "warning" | "danger" | "default"> = {
  reservado: "primary",
  confirmado: "success",
  suspendido: "warning",
};

export const MyBookingsDrawer = ({ isOpen, onClose, slug, isAuthenticated }: Props) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await publicService.getMyBookings(slug);
      setBookings(res.data || []);
    } catch {
      addToast({ title: "No se pudieron cargar tus turnos", color: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen]);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await publicService.cancelBooking(slug, id);
      addToast({ title: "Turno cancelado", color: "success" });
      setBookings((prev) => prev.filter((b) => b._id !== id));
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
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="sm">
      <DrawerContent>
        <DrawerHeader className="flex flex-col gap-1">
          <span className="text-lg font-bold">Mis turnos</span>
          <span className="text-sm text-default-500 font-normal">Próximas reservas</span>
        </DrawerHeader>
        <DrawerBody>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-default-400">
              <span className="text-4xl">🎾</span>
              <p className="text-sm">No tenés turnos próximos</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {bookings.map((b) => (
                <div
                  key={b._id}
                  className="rounded-xl border border-default-200 bg-default-50 p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{b.court?.name}</span>
                    <Chip
                      size="sm"
                      color={statusColor[b.status] || "default"}
                      variant="flat"
                    >
                      {statusLabel[b.status] || b.status}
                    </Chip>
                  </div>
                  <div className="text-xs text-default-500 flex gap-3">
                    <span>{formatDate(b.date)}</span>
                    <span>
                      {b.timeSlot?.label ||
                        `${b.timeSlot?.startTime} - ${b.timeSlot?.endTime}`}
                    </span>
                  </div>
                  {b.status !== "suspendido" && (
                    <Button
                      size="sm"
                      variant="flat"
                      color="danger"
                      isLoading={cancellingId === b._id}
                      onPress={() => handleCancel(b._id)}
                      className="mt-1"
                    >
                      Cancelar turno
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};
