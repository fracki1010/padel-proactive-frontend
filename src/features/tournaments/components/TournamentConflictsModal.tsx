import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";

import type { TournamentConflict } from "../../../services/tournamentService";
import type { Court } from "../../../types";
import { courtName } from "../utils/bracket";

type TournamentConflictsModalProps = {
  isOpen: boolean;
  conflicts: TournamentConflict[] | null;
  courts: Court[];
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  description?: string;
  confirmText?: string;
};

const WEEKDAYS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export const TournamentConflictsModal = ({
  isOpen,
  conflicts,
  courts,
  onClose,
  onConfirm,
  isLoading = false,
  description = "Las canchas quedarán bloqueadas, pero no se cancelará ninguna reserva. Revisalas antes de continuar.",
  confirmText = "Continuar",
}: TournamentConflictsModalProps) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    size="xl"
    backdrop="blur"
    className="bg-surface-container-high text-foreground dark"
  >
    <ModalContent>
      <ModalHeader className="flex flex-col gap-1">
        <h2 className="text-xl font-black">Hay reservas en esas fechas</h2>
        <p className="text-sm font-normal text-on-surface-variant">
          {description}
        </p>
      </ModalHeader>
      <ModalBody>
        <ul className="space-y-2">
          {(conflicts ?? []).map((conflict, index) => (
            <li
              key={`${conflict.type}-${conflict.courtId}-${conflict.date ?? conflict.weekday}-${index}`}
              className="rounded-md border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 p-3 text-sm"
            >
              <p className="font-bold text-foreground">
                {conflict.type === "booking"
                  ? `Reserva de ${conflict.clientName || "un cliente"}`
                  : "Turno fijo activo"}
              </p>
              <p className="text-on-surface-variant">
                {courtName(courts, conflict.courtId)}
                {conflict.date ? ` · ${conflict.date}` : ""}
                {conflict.weekday !== undefined
                  ? ` · ${WEEKDAYS[conflict.weekday] ?? "Día"}`
                  : ""}
              </p>
            </li>
          ))}
        </ul>
      </ModalBody>
      <ModalFooter>
        <Button variant="light" onPress={onClose}>
          Cancelar
        </Button>
        <Button
          color="warning"
          onPress={onConfirm}
          isLoading={isLoading}
          className="font-black"
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
);
