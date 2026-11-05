import { Button, Chip } from "@heroui/react";
import { CalendarPlus, ClipboardCheck } from "lucide-react";
import { useState } from "react";

import type { Tournament, TournamentMatch, TournamentTeam } from "../../../services/tournamentService";
import { ResultModal } from "./ResultModal";
import { ScheduleMatchModal } from "./ScheduleMatchModal";

type MatchCardProps = {
  tournamentId: string;
  categoryId: string;
  tournament: Tournament;
  match: TournamentMatch;
  teams: TournamentTeam[];
  allMatches: TournamentMatch[];
  bracketStale?: boolean;
  courtName: (id: string) => string;
  slotLabel: (id: string) => string;
};

const STATUS_META: Record<TournamentMatch["status"], { label: string; color: "default" | "primary" | "success" | "warning" }> = {
  pending: { label: "Por definir", color: "default" },
  ready: { label: "Listo", color: "primary" },
  played: { label: "Jugado", color: "success" },
  bye: { label: "Pase directo", color: "warning" },
};
const teamName = (teams: TournamentTeam[], id: string | null): string | null =>
  (id && teams.find((team) => team._id === id)?.name) || null;

const TeamRow = ({ name, score, winner, bye }: { name: string | null; score: number | null; winner: boolean; bye: boolean }) => (
  <div className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 ${winner ? "bg-primary/10" : ""}`}>
    <span className={`truncate text-sm ${winner ? "font-black text-primary" : name ? "font-semibold text-foreground" : "italic text-on-surface-variant"}`}>
      {name ?? (bye ? "Pase directo" : "Por definir")}
    </span>
    {score != null && <span className="shrink-0 font-black text-foreground">{score}</span>}
  </div>
);

export const MatchCard = ({
  tournamentId, categoryId, tournament, match, teams, allMatches,
  bracketStale, courtName, slotLabel,
}: MatchCardProps) => {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const status = STATUS_META[match.status];
  const canAct = tournament.status === "in_progress" && !bracketStale;
  const hasTeams = Boolean(match.teamA && match.teamB);

  return (
    <article className="rounded-lg border border-black/5 dark:border-white/5 bg-dark-200 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">#{match.position + 1}</span>
        <Chip size="sm" variant="flat" color={status.color} className="font-bold">{status.label}</Chip>
      </div>
      <div className="space-y-1">
        <TeamRow name={teamName(teams, match.teamA)} score={match.scoreA}
          winner={match.status === "played" && match.winner === match.teamA} bye={match.status === "bye"} />
        <TeamRow name={teamName(teams, match.teamB)} score={match.scoreB}
          winner={match.status === "played" && match.winner === match.teamB} bye={match.status === "bye"} />
      </div>
      {match.date && (
        <p className="text-xs text-on-surface-variant">
          {match.court ? courtName(match.court) : "Sin cancha"} · {match.date}
          {match.timeSlot ? ` · ${slotLabel(match.timeSlot)}` : ""}
        </p>
      )}
      {match.status === "ready" && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" variant="flat" startContent={<CalendarPlus size={14} />} isDisabled={!canAct || !hasTeams}
            onPress={() => setScheduleOpen(true)} className="font-bold">Programar</Button>
          <Button size="sm" variant="flat" color="primary" startContent={<ClipboardCheck size={14} />} isDisabled={!canAct || !hasTeams}
            onPress={() => setResultOpen(true)} className="font-bold">Resultado</Button>
        </div>
      )}
      {match.status === "played" && (
        <div className="pt-1">
          <Button size="sm" variant="flat" color="warning" startContent={<ClipboardCheck size={14} />} isDisabled={!canAct}
            onPress={() => setResultOpen(true)} className="font-bold">Editar resultado</Button>
        </div>
      )}
      {scheduleOpen && (
        <ScheduleMatchModal key={`schedule-${match._id}`} isOpen onClose={() => setScheduleOpen(false)}
          tournamentId={tournamentId} categoryId={categoryId} match={match} tournament={tournament} matches={allMatches} />
      )}
      {resultOpen && (
        <ResultModal key={`result-${match._id}`} isOpen onClose={() => setResultOpen(false)}
          tournamentId={tournamentId} categoryId={categoryId} match={match} teams={teams} />
      )}
    </article>
  );
};
