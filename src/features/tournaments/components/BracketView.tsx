import { addToast, Button, Chip, Spinner } from "@heroui/react";
import { RefreshCw, Trophy } from "lucide-react";
import { useState } from "react";

import { useConfirm } from "../../../hooks/useConfirm";
import { useCourts, useSlots } from "../../../hooks/useData";
import { getErrorMessage } from "../../../services/apiError";
import type {
  Tournament, TournamentBracket, TournamentCategory, TournamentTeam,
} from "../../../services/tournamentService";
import { useBracket, useGenerateBracket } from "../hooks/useTournaments";
import { courtName, flattenMatches, slotLabel } from "../utils/bracket";
import { MatchActionsNotice } from "./MatchActionsNotice";
import { MatchCard } from "./MatchCard";

type BracketViewProps = {
  tournamentId: string;
  tournament: Tournament;
  category: TournamentCategory;
  teams: TournamentTeam[];
};

// The champion is derived: final winner, or the only registered team (size 1).
const bracketChampion = (bracket?: TournamentBracket | null, teams: TournamentTeam[] = []) => {
  if (!bracket?.bracketSize) return null;
  if (bracket.bracketSize === 1) return teams.find((team) => team.status !== "withdrawn")?._id ?? null;
  const matches = flattenMatches(bracket);
  const finalRound = Math.max(0, ...matches.map((match) => match.round));
  return matches.find((match) => match.round === finalRound && match.position === 0)?.winner ?? null;
};
const roundLabel = (round: number, totalRounds: number) =>
  round === totalRounds ? "Final" : round === totalRounds - 1 ? "Semifinal" : `Ronda ${round}`;

export const BracketView = ({ tournamentId, tournament, category, teams }: BracketViewProps) => {
  const confirm = useConfirm();
  const { data: bracket, isLoading, isError } = useBracket(tournamentId, category._id);
  const generateBracket = useGenerateBracket(tournamentId, category._id);
  const { data: courtsData } = useCourts();
  const { data: slotsData } = useSlots();
  const [drawSeed, setDrawSeed] = useState<number | null>(null);

  const rounds = bracket?.rounds ?? [];
  const allMatches = flattenMatches(bracket);
  const championId = bracketChampion(bracket, teams);
  const registeredTeams = teams.filter((team) => team.status !== "withdrawn");
  const courts = courtsData?.data ?? [];
  const slots = slotsData?.data ?? [];
  const resolveCourtName = (id: string) => courtName(courts, id);
  const resolveSlotLabel = (id: string) => slotLabel(slots, id);
  const canGenerate = tournament.status === "in_progress" && registeredTeams.length > 0;

  const handleGenerate = async () => {
    if (bracket?.bracketSize != null) {
      const confirmed = await confirm(
        "¿Regenerar la llave? Se descarta la llave actual. Si ya hay resultados, la operación se rechaza.",
        { title: "Regenerar llave", variant: "danger", confirmText: "Regenerar" },
      );
      if (!confirmed) return;
    }
    try {
      const result = await generateBracket.mutateAsync();
      setDrawSeed(result.drawSeed);
      addToast({ title: `Llave generada. Semilla de sorteo: ${result.drawSeed}`, color: "success" });
    } catch (error) {
      addToast({ title: getErrorMessage(error, "No se pudo generar la llave"), color: "danger" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-on-surface-variant">{registeredTeams.length} parejas registradas en {category.name}.</p>
          {drawSeed != null && <Chip size="sm" variant="flat" color="default" className="font-bold">Semilla {drawSeed}</Chip>}
          {category.bracketSize != null && <Chip size="sm" variant="flat" color="primary" className="font-bold">Llave {category.bracketSize}</Chip>}
        </div>
        <Button color="primary" size="sm" startContent={<RefreshCw size={16} />} onPress={handleGenerate}
          isLoading={generateBracket.isPending} isDisabled={!canGenerate} className="rounded-md font-black">
          {bracket?.bracketSize != null ? "Regenerar llave" : "Generar llave"}
        </Button>
      </div>

      <MatchActionsNotice
        bracketStale={category.bracketStale}
        tournamentStatus={tournament.status}
      />

      {championId && (
        <div className="flex items-center gap-3 rounded-lg border border-success/40 bg-success/10 p-4">
          <Trophy size={22} className="text-success" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Campeón</p>
            <p className="text-lg font-black text-foreground">{teams.find((team) => team._id === championId)?.name ?? "Pareja"}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner color="primary" /></div>
      ) : isError ? (
        <div className="rounded-md border border-black/5 dark:border-white/5 bg-dark-200 p-6 text-center">
          <p className="font-bold text-foreground">No pudimos cargar la llave</p>
          <p className="text-sm text-on-surface-variant">Reintentá en unos segundos.</p>
        </div>
      ) : allMatches.length === 0 ? (
        <div className="rounded-md border border-dashed border-black/10 dark:border-white/10 bg-dark-200 p-8 text-center">
          <Trophy size={32} className="mx-auto mb-2 text-on-surface-variant" />
          <p className="font-bold text-foreground">
            {bracket?.bracketSize === 1 ? "Categoría resuelta"
              : registeredTeams.length === 0 ? "Todavía no hay parejas" : "La llave está vacía"}
          </p>
          <p className="text-sm text-on-surface-variant">
            {bracket?.bracketSize === 1 ? "Una sola pareja registrada: es la campeona y no se generan partidos."
              : registeredTeams.length === 0 ? "Registrá parejas en esta categoría para poder generar la llave."
                : "Generá la llave para ver los cruces de la categoría."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-6">
            {[...rounds].sort((a, b) => a.round - b.round).map((round) => (
              <section key={round.round} className="flex w-[230px] flex-col gap-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-on-surface-variant">
                  {roundLabel(round.round, rounds.length)}
                </h3>
                {round.matches.map((match) => (
                  <MatchCard key={match._id} tournamentId={tournamentId} categoryId={category._id}
                    tournament={tournament} match={match} teams={teams} allMatches={allMatches}
                    bracketStale={category.bracketStale} courtName={resolveCourtName} slotLabel={resolveSlotLabel} />
                ))}
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
