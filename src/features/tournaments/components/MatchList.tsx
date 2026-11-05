import { Spinner } from "@heroui/react";

import { useCourts, useSlots } from "../../../hooks/useData";
import type {
  Tournament, TournamentCategory, TournamentTeam,
} from "../../../services/tournamentService";
import { useBracket } from "../hooks/useTournaments";
import { courtName, flattenMatches, slotLabel } from "../utils/bracket";
import { MatchActionsNotice } from "./MatchActionsNotice";
import { MatchCard } from "./MatchCard";

type MatchListProps = {
  mode: "schedule" | "results";
  tournamentId: string;
  tournament: Tournament;
  category: TournamentCategory;
  teams: TournamentTeam[];
};

export const MatchList = ({ mode, tournamentId, tournament, category, teams }: MatchListProps) => {
  const { data: bracket, isLoading, isError } = useBracket(tournamentId, category._id);
  const { data: courtsData } = useCourts();
  const { data: slotsData } = useSlots();

  const allMatches = flattenMatches(bracket);
  const matches = allMatches
    .filter((match) => (mode === "schedule" ? match.status === "ready" : match.status === "ready" || match.status === "played"))
    .sort((left, right) => left.round - right.round || left.position - right.position);
  const courts = courtsData?.data ?? [];
  const slots = slotsData?.data ?? [];
  const resolveCourtName = (id: string) => courtName(courts, id);
  const resolveSlotLabel = (id: string) => slotLabel(slots, id);

  const notice = (
    <MatchActionsNotice
      bracketStale={category.bracketStale}
      tournamentStatus={tournament.status}
    />
  );

  if (isLoading) return <div className="flex justify-center py-12"><Spinner color="primary" /></div>;
  if (isError) {
    return (
      <div className="rounded-md border border-black/5 dark:border-white/5 bg-dark-200 p-6 text-center">
        <p className="font-bold text-foreground">No pudimos cargar los partidos</p>
        <p className="text-sm text-on-surface-variant">Reintentá en unos segundos.</p>
      </div>
    );
  }
  if (allMatches.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-black/10 dark:border-white/10 bg-dark-200 p-8 text-center">
        <p className="font-bold text-foreground">Generá la llave primero</p>
        <p className="text-sm text-on-surface-variant">Los partidos de {category.name} aparecen acá cuando la llave está generada.</p>
      </div>
    );
  }
  if (matches.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-black/10 dark:border-white/10 bg-dark-200 p-8 text-center">
        <p className="font-bold text-foreground">No hay partidos para mostrar todavía</p>
        <p className="text-sm text-on-surface-variant">
          {mode === "schedule" ? "Los cruces se habilitan cuando ambas parejas están definidas."
            : "Los resultados aparecen cuando el partido está listo para jugarse."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notice}
      <p className="text-sm text-on-surface-variant">
        {mode === "schedule"
          ? "Elegí cancha, fecha y horario de cada partido. Programar no crea una reserva."
          : "Cargá los sets de cada partido. Podés editar o borrar un resultado mientras no haya partidos posteriores jugados."}
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {matches.map((match) => (
          <MatchCard key={match._id} tournamentId={tournamentId} categoryId={category._id}
            tournament={tournament} match={match} teams={teams} allMatches={allMatches}
            bracketStale={category.bracketStale} courtName={resolveCourtName} slotLabel={resolveSlotLabel} />
        ))}
      </div>
    </div>
  );
};
