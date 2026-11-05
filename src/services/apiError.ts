import type { TournamentConflict } from "./tournamentService";

export interface ApiErrorData {
  error?: string;
  code?: string;
  bracketStale?: boolean;
  conflicts?: TournamentConflict[];
}

export interface ApiErrorEnvelope {
  response?: { status?: number; data?: ApiErrorData };
}

const asApiError = (error: unknown): ApiErrorEnvelope | undefined =>
  error as ApiErrorEnvelope;

export const getApiErrorData = (error: unknown): ApiErrorData | undefined =>
  asApiError(error)?.response?.data;

export const getApiErrorStatus = (error: unknown): number | undefined =>
  asApiError(error)?.response?.status;

export const getErrorMessage = (error: unknown, fallback: string): string => {
  const message = getApiErrorData(error)?.error;
  return typeof message === "string" && message ? message : fallback;
};

export const getApiConflicts = (
  error: unknown,
): TournamentConflict[] | null => {
  const conflicts = getApiErrorData(error)?.conflicts;
  return Array.isArray(conflicts) && conflicts.length > 0 ? conflicts : null;
};

// Bracket writes answer 409 when the cached bracket/category state may be out of
// date (stale bracket, downstream result, occupied slot). Prefer the stable API
// marker when one is present and fall back to the HTTP status so older backends
// keep refreshing without matching Spanish message text.
export const isBracketConflictError = (error: unknown): boolean => {
  if (getApiErrorStatus(error) !== 409) return false;
  const data = getApiErrorData(error);
  if (data?.code == null && data?.bracketStale == null) return true;
  return data.code === "BRACKET_STALE" || data.bracketStale === true;
};
