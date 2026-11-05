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
import { getApiConflicts, getErrorMessage } from "../../../services/apiError";
import type { Tournament, TournamentConflict, TournamentPayload } from "../../../services/tournamentService";
import {
  useCreateTournament,
  useUpdateTournament,
} from "../hooks/useTournaments";
import { TournamentConflictsModal } from "./TournamentConflictsModal";

type TournamentFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  editing: Tournament | null;
};

const MAX_TOURNAMENT_DAYS = 120;
const MS_PER_DAY = 86_400_000;

const daySpan = (startDate: string, endDate: string): number =>
  Math.round(
    (Date.parse(`${endDate}T00:00:00.000Z`) -
      Date.parse(`${startDate}T00:00:00.000Z`)) /
      MS_PER_DAY,
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
  const [conflicts, setConflicts] = useState<TournamentConflict[] | null>(null);

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

  const buildPayload = (): TournamentPayload => ({
    name: name.trim(),
    description: description.trim(),
    startDate,
    endDate,
    courts: courtIds,
  });

  const closeAll = () => {
    setConflicts(null);
    onClose();
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      addToast({ title: validationError, color: "warning" });
      return;
    }

    try {
      if (editing) {
        await updateTournament.mutateAsync({ id: editing._id, data: buildPayload() });
        addToast({ title: "Torneo actualizado", color: "success" });
      } else {
        await createTournament.mutateAsync(buildPayload());
        addToast({ title: "Torneo creado", color: "success" });
      }
      closeAll();
    } catch (error) {
      const conflictList = editing ? getApiConflicts(error) : null;
      if (conflictList) {
        setConflicts(conflictList);
        return;
      }
      addToast({
        title: getErrorMessage(error, "No se pudo guardar el torneo"),
        color: "danger",
      });
    }
  };

  const handleConfirmConflicts = async () => {
    if (!editing) return;
    try {
      await updateTournament.mutateAsync({
        id: editing._id,
        data: buildPayload(),
        confirmConflicts: true,
      });
      setConflicts(null);
      addToast({ title: "Torneo actualizado", color: "success" });
      onClose();
    } catch (error) {
      addToast({
        title: getErrorMessage(error, "No se pudo guardar el torneo"),
        color: "danger",
      });
    }
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={closeAll}
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
            <label htmlFor="tournament-name" className={labelClass}>Nombre</label>
            <Input
              id="tournament-name"
              value={name}
              onValueChange={setName}
              placeholder="Copa de verano"
              variant="bordered"
              size="lg"
              classNames={fieldInputClassNames.lg}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="tournament-description" className={labelClass}>Descripción</label>
            <Textarea
              id="tournament-description"
              value={description}
              onValueChange={setDescription}
              placeholder="Opcional"
              variant="bordered"
              minRows={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label htmlFor="tournament-start-date" className={labelClass}>Inicio</label>
              <Input
                id="tournament-start-date"
                type="date"
                value={startDate}
                onValueChange={setStartDate}
                variant="bordered"
                size="lg"
                classNames={fieldInputClassNames.lg}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="tournament-end-date" className={labelClass}>Fin</label>
              <Input
                id="tournament-end-date"
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
            <label id="tournament-courts-label" className={labelClass}>Canchas</label>
            <Select
              aria-labelledby="tournament-courts-label"
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
          <Button variant="light" onPress={closeAll} isDisabled={isSaving}>
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
    <TournamentConflictsModal
      isOpen={Boolean(conflicts)}
      conflicts={conflicts}
      courts={courtsData?.data ?? []}
      onClose={() => setConflicts(null)}
      onConfirm={handleConfirmConflicts}
      isLoading={updateTournament.isPending}
      description="Guardar estos cambios bloqueará las canchas y fechas nuevas, pero no cancelará ninguna reserva. Revisalas antes de continuar."
      confirmText="Guardar de todos modos"
    />
    </>
  );
};
