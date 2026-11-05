import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  tournamentService,
  type TournamentPayload,
  type TournamentStatus,
} from "../../../services/tournamentService";

export const tournamentKeys = {
  all: ["tournaments"] as const,
  list: (status?: TournamentStatus) =>
    [...tournamentKeys.all, "list", status ?? "all"] as const,
  detail: (id: string) => [...tournamentKeys.all, "detail", id] as const,
};

export const blockKeys = {
  all: ["tournament-blocks"] as const,
  byDate: (date: string) => [...blockKeys.all, date] as const,
};

const useInvalidateTournament = () => {
  const queryClient = useQueryClient();
  return (invalidateBlocks = false) => {
    queryClient.invalidateQueries({ queryKey: tournamentKeys.all });
    if (invalidateBlocks) {
      queryClient.invalidateQueries({ queryKey: blockKeys.all });
    }
  };
};

export const useTournaments = (status?: TournamentStatus) =>
  useQuery({
    queryKey: tournamentKeys.list(status),
    queryFn: () => tournamentService.listTournaments(status),
    retry: 1,
  });

export const useTournament = (id: string) =>
  useQuery({
    queryKey: tournamentKeys.detail(id),
    queryFn: () => tournamentService.getTournament(id),
    enabled: Boolean(id),
    retry: 1,
  });

export const useCreateTournament = () => {
  const invalidate = useInvalidateTournament();
  return useMutation({
    mutationFn: (payload: TournamentPayload) =>
      tournamentService.createTournament(payload),
    onSuccess: () => invalidate(),
  });
};

export const useUpdateTournament = () => {
  const invalidate = useInvalidateTournament();
  return useMutation({
    mutationFn: ({
      id,
      data,
      confirmConflicts,
    }: {
      id: string;
      data: Partial<TournamentPayload>;
      confirmConflicts?: boolean;
    }) => tournamentService.updateTournament(id, data, confirmConflicts),
    onSuccess: () => invalidate(true),
  });
};

export const useDeleteTournament = () => {
  const invalidate = useInvalidateTournament();
  return useMutation({
    mutationFn: (id: string) => tournamentService.deleteTournament(id),
    onSuccess: () => invalidate(),
  });
};

export const useActivateTournament = () => {
  const invalidate = useInvalidateTournament();
  return useMutation({
    mutationFn: ({
      id,
      confirmConflicts,
    }: {
      id: string;
      confirmConflicts?: boolean;
    }) => tournamentService.activateTournament(id, confirmConflicts),
    onSuccess: () => invalidate(true),
  });
};

export const useCompleteTournament = () => {
  const invalidate = useInvalidateTournament();
  return useMutation({
    mutationFn: (id: string) => tournamentService.completeTournament(id),
    onSuccess: () => invalidate(true),
  });
};

export const useCancelTournament = () => {
  const invalidate = useInvalidateTournament();
  return useMutation({
    mutationFn: (id: string) => tournamentService.cancelTournament(id),
    onSuccess: () => invalidate(true),
  });
};

export const useBlockedCourts = (date: string, enabled = true) =>
  useQuery({
    queryKey: blockKeys.byDate(date),
    queryFn: () => tournamentService.getBlockedCourts(date),
    enabled: Boolean(date) && enabled,
    retry: 1,
  });
