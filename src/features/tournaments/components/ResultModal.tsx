import {
  addToast, Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader,
} from "@heroui/react";
import { useState } from "react";

import { fieldInputClassNames } from "../../../components/ui/fieldStyles";
import { useConfirm } from "../../../hooks/useConfirm";
import type { TournamentMatch, TournamentTeam } from "../../../services/tournamentService";
import { useClearResult, useRecordResult } from "../hooks/useTournaments";

type ResultModalProps = {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  categoryId: string;
  match: TournamentMatch;
  teams: TournamentTeam[];
};

const getErrorText = (error: unknown, fallback: string): string => {
  const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
  return typeof message === "string" && message ? message : fallback;
};
const teamName = (teams: TournamentTeam[], id: string | null): string =>
  (id && teams.find((team) => team._id === id)?.name) || "Por definir";

export const ResultModal = ({ isOpen, onClose, tournamentId, categoryId, match, teams }: ResultModalProps) => {
  const confirm = useConfirm();
  const recordResult = useRecordResult(tournamentId, categoryId);
  const clearResult = useClearResult(tournamentId, categoryId);
  const [scoreA, setScoreA] = useState(match.scoreA != null ? String(match.scoreA) : "");
  const [scoreB, setScoreB] = useState(match.scoreB != null ? String(match.scoreB) : "");
  const [error, setError] = useState("");
  const isPlayed = match.status === "played";

  const handleSave = async () => {
    setError("");
    const parsedA = Number(scoreA);
    const parsedB = Number(scoreB);
    if (!scoreA.trim() || !scoreB.trim() || !Number.isInteger(parsedA) || !Number.isInteger(parsedB) || parsedA < 0 || parsedB < 0) {
      return addToast({ title: "Ingresá sets enteros no negativos en ambos lados.", color: "warning" });
    }
    if (parsedA === parsedB) {
      return addToast({ title: "Los sets no pueden quedar empatados.", color: "warning" });
    }
    const confirmed = await confirm(`¿Guardar el resultado ${parsedA} - ${parsedB} para este partido?`,
      { title: "Registrar resultado", confirmText: "Guardar" });
    if (!confirmed) return;
    try {
      const result = await recordResult.mutateAsync({ matchId: match._id, scoreA: parsedA, scoreB: parsedB });
      addToast({ title: "Resultado registrado", color: "success" });
      if (result.champion) addToast({ title: `¡Campeón definido: ${teamName(teams, result.champion)}!`, color: "success" });
      onClose();
    } catch (saveError) {
      setError(getErrorText(saveError, "No se pudo registrar el resultado."));
    }
  };

  const handleClear = async () => {
    setError("");
    const confirmed = await confirm("¿Borrar el resultado? Se deshacen los avances posteriores de la llave.",
      { title: "Borrar resultado", variant: "danger", confirmText: "Borrar" });
    if (!confirmed) return;
    try {
      await clearResult.mutateAsync(match._id);
      addToast({ title: "Resultado borrado", color: "success" });
      onClose();
    } catch (clearError) {
      setError(getErrorText(clearError, "No se pudo borrar el resultado."));
    }
  };

  const labelClass = "text-xs font-bold uppercase tracking-wider text-on-surface-variant truncate";
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" backdrop="blur" className="bg-surface-container-high text-foreground dark">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-black">{isPlayed ? "Editar resultado" : "Registrar resultado"}</h2>
          <p className="text-sm font-normal text-on-surface-variant">Cargá los sets ganados por cada pareja. No se permiten empates.</p>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><p className={labelClass}>{teamName(teams, match.teamA)}</p>
              <Input type="number" min={0} value={scoreA} onValueChange={setScoreA} aria-label="Sets pareja A"
                variant="bordered" size="lg" classNames={fieldInputClassNames.lg} /></div>
            <div className="space-y-2"><p className={labelClass}>{teamName(teams, match.teamB)}</p>
              <Input type="number" min={0} value={scoreB} onValueChange={setScoreB} aria-label="Sets pareja B"
                variant="bordered" size="lg" classNames={fieldInputClassNames.lg} /></div>
          </div>
          {error && <p className="text-sm font-semibold text-danger">{error}</p>}
        </ModalBody>
        <ModalFooter className="flex-wrap gap-2">
          <Button variant="light" onPress={onClose} isDisabled={recordResult.isPending || clearResult.isPending}>Cancelar</Button>
          {isPlayed && (
            <Button color="danger" variant="flat" onPress={handleClear} isLoading={clearResult.isPending} className="font-bold">
              Borrar resultado
            </Button>
          )}
          <Button color="primary" onPress={handleSave} isLoading={recordResult.isPending} className="font-black">
            Guardar resultado
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
