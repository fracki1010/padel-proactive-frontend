import {
  addToast,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { useState } from "react";

import { fieldInputClassNames, fieldSelectClassNames } from "../../../components/ui/fieldStyles";
import { useCourts } from "../../../hooks/useData";
import type { Tournament } from "../../../services/tournamentService";
import {
  useCreateTournament,
  useUpdateTournament,
} from "../hooks/useTournaments";

type TournamentFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  editing: Tournament | null;
};

const MAX_TOURNAMENT_DAYS = 120;

const getErrorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { response?: { data?: { error?: string } } })
    ?.response?.data?.error;
  return typeof message === "string" && message ? message : fallback;
};

const daySpan = (startDate: string, endDate: string): number =>
  Math.round(
    (Date.parse(`${endDate}T00:00:00.000Z`) -
      Date.parse(`${startDate}T00:00:00.000Z`)) /
      86400000,
  ) + 1;

const labelClass =
  "text-sm font-semibold text-on-surface-variant uppercase tracking-wider";

export const TournamentFormModal = ({
  isOpen,
  onClose,
  editing,
}: TournamentFormModalProps) => {
  const { data: courtsData, isLoading: isLoadingCourts } = useCourts();
  const createTournament = useCreateTournament();
  const updateTournament = useUpdateTournament();

  // Parent remounts this modal on open/edit changes, so props seed the form.
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [startDate, setStartDate] = useState(editing?.startDate ?? "");
  const [endDate, setEndDate] = useState(editing?.endDate ?? "");
  const [courtIds, setCourtIds] = useState<string[]>(editing?.courts ?? []);

  const availableCourts = (courtsData?.data ?? []).filter(
    (court) => court.isActive !== false,
  );
  const isSaving =
    createTournament.isPending || updateTournament.isPending;

  const validate = (): string | null => {
    if (!name.trim()) return "El nombre del torneo es obligatorio.";
    if (!startDate || !endDate) {
      return "Completá las fechas de inicio y fin.";
    }
    if (endDate < startDate) {
      return "La fecha de fin debe ser igual o posterior a la fecha de inicio.";
    }
    if (daySpan(startDate, endDate) > MAX_TOURNAMENT_DAYS) {
      return `El torneo no puede abarcar más de ${MAX_TOURNAMENT_DAYS} días.`;
    }
    if (courtIds.length === 0) {
      return "Seleccioná al menos una cancha.";
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      addToast({ title: validationError, color: "warning" });
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      startDate,
      endDate,
      courts: courtIds,
    };

    try {
      if (editing) {
        await updateTournament.mutateAsync({ id: editing._id, data: payload });
        addToast({ title: "Torneo actualizado", color: "success" });
      } else {
        await createTournament.mutateAsync(payload);
        addToast({ title: "Torneo creado", color: "success" });
      }
      onClose();
    } catch (error) {
      addToast({
        title: getErrorMessage(error, "No se pudo guardar el torneo"),
        color: "danger",
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      backdrop="blur"
      className="bg-surface-container-high text-foreground dark"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-2xl font-black">
            {editing ? "Editar torneo" : "Nuevo torneo"}
          </h2>
          <p className="text-sm text-on-surface-variant font-normal">
            Definí las fechas y las canchas que se bloquean al activarlo.
          </p>
        </ModalHeader>

        <ModalBody className="space-y-5">
          <div className="space-y-2">
            <label className={labelClass}>Nombre</label>
            <Input
              value={name}
              onValueChange={setName}
              placeholder="Copa de verano"
              variant="bordered"
              size="lg"
              classNames={fieldInputClassNames.lg}
            />
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Descripción</label>
            <Textarea
              value={description}
              onValueChange={setDescription}
              placeholder="Opcional"
              variant="bordered"
              minRows={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className={labelClass}>Inicio</label>
              <Input
                type="date"
                value={startDate}
                onValueChange={setStartDate}
                variant="bordered"
                size="lg"
                classNames={fieldInputClassNames.lg}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Fin</label>
              <Input
                type="date"
                value={endDate}
                onValueChange={setEndDate}
                variant="bordered"
                size="lg"
                classNames={fieldInputClassNames.lg}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Canchas</label>
            <Select
              aria-label="Canchas"
              selectionMode="multiple"
              placeholder="Elegí una o más canchas"
              selectedKeys={courtIds}
              onSelectionChange={(keys) => {
                const selected =
                  typeof keys === "string"
                    ? availableCourts.map((court) => court._id)
                    : Array.from(keys).map(String);
                setCourtIds(selected);
              }}
              isDisabled={isLoadingCourts}
              variant="bordered"
              size="lg"
              classNames={fieldSelectClassNames.lg}
            >
              {availableCourts.map((court) => (
                <SelectItem key={court._id}>{court.name}</SelectItem>
              ))}
            </Select>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={isSaving}>
            Cancelar
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isSaving}
            className="font-black"
          >
            {editing ? "Guardar cambios" : "Crear torneo"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
