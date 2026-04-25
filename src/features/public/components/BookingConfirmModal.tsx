import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  addToast,
} from "@heroui/react";
import { useState } from "react";
import { publicService } from "../../../services/publicService";

interface Slot {
  _id: string;
  startTime: string;
  endTime: string;
  price: number;
  label?: string;
}

interface Court {
  _id: string;
  name: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  court: Court | null;
  slot: Slot | null;
  date: string;
  clientName: string;
  onConfirmed: () => void;
  onConflict?: () => void;
}

const formatDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const BookingConfirmModal = ({
  isOpen,
  onClose,
  slug,
  court,
  slot,
  date,
  clientName,
  onConfirmed,
  onConflict,
}: Props) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!court || !slot || !date) return;
    setIsLoading(true);
    try {
      await publicService.createBooking(slug, {
        courtId: court._id,
        slotId: slot._id,
        date,
      });
      addToast({ title: "Turno reservado con éxito", color: "success" });
      onConfirmed();
      onClose();
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.response?.data?.error || "No se pudo reservar el turno";
      addToast({ title: message, color: "danger" });
      if (status === 409) {
        onClose();
        onConflict?.();
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!court || !slot) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} placement="center" size="sm">
      <ModalContent>
        <ModalHeader>Confirmar reserva</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-3">
            <div className="rounded-xl bg-default-100 p-4 flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-default-500">Cancha</span>
                <span className="font-semibold">{court.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-default-500">Horario</span>
                <span className="font-semibold">
                  {slot.label || `${slot.startTime} - ${slot.endTime}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-default-500">Fecha</span>
                <span className="font-semibold capitalize">{formatDate(date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-default-500">Precio</span>
                <span className="font-semibold text-primary">
                  {slot.price > 0 ? `$${slot.price.toLocaleString("es-AR")}` : "A convenir"}
                </span>
              </div>
              <hr className="border-default-200" />
              <div className="flex justify-between">
                <span className="text-default-500">A nombre de</span>
                <span className="font-semibold">{clientName}</span>
              </div>
            </div>
            <p className="text-xs text-default-400 text-center">
              El pago se abona en el club. Estado inicial: pendiente.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose} isDisabled={isLoading}>
            Cancelar
          </Button>
          <Button color="primary" onPress={handleConfirm} isLoading={isLoading}>
            Confirmar reserva
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
