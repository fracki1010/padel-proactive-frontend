import { api } from "./httpClient";

export type TournamentStatus = "draft" | "in_progress" | "finished" | "cancelled";
export type MatchStatus = "pending" | "ready" | "played" | "bye";

export interface Tournament {
  _id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
  courts: string[];
  activatedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TournamentPayload {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  courts: string[];
}

export interface TournamentConflict {
  type: "booking" | "fixed";
  courtId: string;
  date?: string;
  weekday?: number;
  clientName?: string | null;
}

export interface BlockedCourts {
  date: string;
  courtIds: string[];
  tournaments: { _id: string; name: string }[];
}

// Read-only shapes for the P5 bracket UI.
export interface TournamentMatch {
  _id: string;
  round: number;
  position: number;
  teamA: string | null;
  teamB: string | null;
  winner: string | null;
  scoreA: number | null;
  scoreB: number | null;
  status: MatchStatus;
  court: string | null;
  date: string | null;
  timeSlot: string | null;
}

export interface TournamentBracket {
  bracketSize: number;
  rounds: { round: number; matches: TournamentMatch[] }[];
}

const unwrap = <T>(response: { data?: { data?: T } }): T =>
  response.data?.data as T;

export const tournamentService = {
  listTournaments: async (status?: TournamentStatus): Promise<Tournament[]> => {
    const response = await api.get("/tournaments", {
      params: status ? { status } : undefined,
    });
    return unwrap<Tournament[]>(response);
  },

  getTournament: async (id: string): Promise<Tournament> => {
    const response = await api.get(`/tournaments/${id}`);
    return unwrap<Tournament>(response);
  },

  createTournament: async (payload: TournamentPayload): Promise<Tournament> => {
    const response = await api.post("/tournaments", payload);
    return unwrap<Tournament>(response);
  },

  updateTournament: async (
    id: string,
    payload: Partial<TournamentPayload>,
    confirmConflicts = false,
  ): Promise<Tournament> => {
    const response = await api.put(`/tournaments/${id}`, {
      ...payload,
      confirmConflicts,
    });
    return unwrap<Tournament>(response);
  },

  deleteTournament: async (id: string): Promise<{ _id: string }> => {
    const response = await api.delete(`/tournaments/${id}`);
    return unwrap<{ _id: string }>(response);
  },

  activateTournament: async (
    id: string,
    confirmConflicts = false,
  ): Promise<Tournament> => {
    const response = await api.post(`/tournaments/${id}/activate`, {
      confirmConflicts,
    });
    return unwrap<Tournament>(response);
  },

  completeTournament: async (id: string): Promise<Tournament> => {
    const response = await api.post(`/tournaments/${id}/complete`);
    return unwrap<Tournament>(response);
  },

  cancelTournament: async (id: string): Promise<Tournament> => {
    const response = await api.post(`/tournaments/${id}/cancel`);
    return unwrap<Tournament>(response);
  },

  getBlockedCourts: async (date: string): Promise<BlockedCourts> => {
    const response = await api.get("/tournaments/blocked-courts", {
      params: { date },
    });
    return unwrap<BlockedCourts>(response);
  },
};
