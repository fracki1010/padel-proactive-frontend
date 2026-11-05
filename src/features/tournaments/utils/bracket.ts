import type { TournamentBracket } from "../../../services/tournamentService";
import type { Court, TimeSlot } from "../../../types";

export const flattenMatches = (bracket?: TournamentBracket | null) =>
  bracket?.rounds.flatMap((round) => round.matches) ?? [];

export const courtName = (courts: Court[], courtId: string): string =>
  courts.find((court) => court._id === courtId)?.name ?? "Cancha";

export const slotLabel = (slots: TimeSlot[], slotId: string): string => {
  const slot = slots.find((item) => item._id === slotId);
  return slot ? `${slot.startTime} - ${slot.endTime}` : "Horario";
};
