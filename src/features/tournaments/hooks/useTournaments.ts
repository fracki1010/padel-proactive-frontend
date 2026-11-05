import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { isBracketConflictError } from "../../../services/apiError";
import {
  tournamentService,
  type CategoryPayload,
  type GenerateBracketResponse,
  type MatchResultResponse,
  type ScheduleMatchPayload,
  type TeamPayload,
  type TournamentMatch,
  type TournamentPayload,
  type TournamentStatus,
} from "../../../services/tournamentService";

export const tournamentKeys = {
  all: ["tournaments"] as const,
  list: (status?: TournamentStatus) =>
    [...tournamentKeys.all, "list", status ?? "all"] as const,
  detail: (id: string) => [...tournamentKeys.all, "detail", id] as const,
  categories: (id: string) =>
    [...tournamentKeys.detail(id), "categories"] as const,
  teams: (id: string, categoryId: string) =>
    [...tournamentKeys.categories(id), categoryId, "teams"] as const,
  bracket: (id: string, categoryId: string) =>
    [...tournamentKeys.categories(id), categoryId, "bracket"] as const,
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

export const useCategories = (tournamentId: string) =>
  useQuery({
    queryKey: tournamentKeys.categories(tournamentId),
    queryFn: () => tournamentService.listCategories(tournamentId),
    enabled: Boolean(tournamentId),
    retry: 1,
  });

const useInvalidateCategories = (tournamentId: string) => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: tournamentKeys.categories(tournamentId) });
    queryClient.invalidateQueries({ queryKey: tournamentKeys.detail(tournamentId) });
  };
};

const useCategoryMutation = <T,>(tournamentId: string, mutationFn: (input: T) => Promise<unknown>) => {
  const invalidate = useInvalidateCategories(tournamentId);
  return useMutation({ mutationFn, onSuccess: () => invalidate() });
};

export const useCreateCategory = (tournamentId: string) =>
  useCategoryMutation<CategoryPayload>(tournamentId, (payload) => tournamentService.createCategory(tournamentId, payload));

export const useUpdateCategory = (tournamentId: string) =>
  useCategoryMutation<{ categoryId: string; data: Partial<CategoryPayload> }>(tournamentId,
    ({ categoryId, data }) => tournamentService.updateCategory(tournamentId, categoryId, data));

export const useDeleteCategory = (tournamentId: string) =>
  useCategoryMutation<string>(tournamentId, (categoryId) => tournamentService.deleteCategory(tournamentId, categoryId));

export const useTeams = (tournamentId: string, categoryId: string, enabled = true) =>
  useQuery({
    queryKey: tournamentKeys.teams(tournamentId, categoryId),
    queryFn: () => tournamentService.listTeams(tournamentId, categoryId),
    enabled: enabled && Boolean(tournamentId && categoryId),
    retry: 1,
  });

const useInvalidateTeams = (tournamentId: string, categoryId: string) => {
  const invalidateCategories = useInvalidateCategories(tournamentId);
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: tournamentKeys.teams(tournamentId, categoryId) });
    invalidateCategories();
  };
};

const useTeamMutation = <T,>(tournamentId: string, categoryId: string, mutationFn: (input: T) => Promise<unknown>) => {
  const invalidate = useInvalidateTeams(tournamentId, categoryId);
  return useMutation({ mutationFn, onSuccess: () => invalidate() });
};

export const useCreateTeam = (tournamentId: string, categoryId: string) =>
  useTeamMutation<TeamPayload>(tournamentId, categoryId, (payload) => tournamentService.createTeam(tournamentId, categoryId, payload));

export const useUpdateTeam = (tournamentId: string, categoryId: string) =>
  useTeamMutation<{ teamId: string; data: Partial<TeamPayload> }>(tournamentId, categoryId,
    ({ teamId, data }) => tournamentService.updateTeam(tournamentId, categoryId, teamId, data));

export const useWithdrawTeam = (tournamentId: string, categoryId: string) =>
  useTeamMutation<string>(tournamentId, categoryId, (teamId) => tournamentService.withdrawTeam(tournamentId, categoryId, teamId));

export const useDeleteTeam = (tournamentId: string, categoryId: string) =>
  useTeamMutation<string>(tournamentId, categoryId, (teamId) => tournamentService.deleteTeam(tournamentId, categoryId, teamId));

// Bracket, result and scheduling writes share invalidation: the bracket and its
// category (size/status/stale flag) always change together. Any 409 also
// refreshes both so the admin sees the current state before regenerating.
const useBracketMutation = <T, R,>(
  tournamentId: string,
  categoryId: string,
  mutationFn: (input: T) => Promise<R>,
) => {
  const queryClient = useQueryClient();
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: tournamentKeys.bracket(tournamentId, categoryId) });
    queryClient.invalidateQueries({ queryKey: tournamentKeys.categories(tournamentId) });
    queryClient.invalidateQueries({ queryKey: tournamentKeys.detail(tournamentId) });
  };
  return useMutation<R, Error, T>({
    mutationFn,
    onSuccess: refresh,
    onError: (error) => {
      if (isBracketConflictError(error)) refresh();
    },
  });
};

export const useBracket = (tournamentId: string, categoryId: string) =>
  useQuery({
    queryKey: tournamentKeys.bracket(tournamentId, categoryId),
    queryFn: () => tournamentService.getBracket(tournamentId, categoryId),
    enabled: Boolean(tournamentId && categoryId),
    retry: 1,
  });

export const useGenerateBracket = (tournamentId: string, categoryId: string) =>
  useBracketMutation<void, GenerateBracketResponse>(tournamentId, categoryId, () =>
    tournamentService.generateBracket(tournamentId, categoryId));

export const useRecordResult = (tournamentId: string, categoryId: string) =>
  useBracketMutation<{ matchId: string; scoreA: number; scoreB: number }, MatchResultResponse>(
    tournamentId, categoryId,
    ({ matchId, scoreA, scoreB }) =>
      tournamentService.recordResult(tournamentId, categoryId, matchId, scoreA, scoreB),
  );

export const useUpdateResult = (tournamentId: string, categoryId: string) =>
  useBracketMutation<{ matchId: string; scoreA: number; scoreB: number }, MatchResultResponse>(
    tournamentId, categoryId,
    ({ matchId, scoreA, scoreB }) =>
      tournamentService.updateResult(tournamentId, matchId, scoreA, scoreB),
  );

export const useClearResult = (tournamentId: string, categoryId: string) =>
  useBracketMutation<string, TournamentMatch>(tournamentId, categoryId, (matchId) =>
    tournamentService.clearResult(tournamentId, categoryId, matchId));

export const useScheduleMatch = (tournamentId: string, categoryId: string) =>
  useBracketMutation<{ matchId: string } & ScheduleMatchPayload, TournamentMatch>(
    tournamentId, categoryId,
    ({ matchId, ...payload }) =>
      tournamentService.scheduleMatch(tournamentId, categoryId, matchId, payload),
  );
