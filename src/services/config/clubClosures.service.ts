import { api } from "../httpClient";
import type { ClubClosure, ConfigResponse } from "../../types";

export const clubClosuresService = {
  getClubClosures: async (): Promise<ConfigResponse<ClubClosure>> => {
    const response = await api.get("/config/club-closures");
    return response.data;
  },

  createClubClosure: async (data: { startDate: string; endDate: string; reason: string }): Promise<any> => {
    const response = await api.post("/config/club-closures", data);
    return response.data;
  },

  updateClubClosure: async (id: string, data: Partial<{ startDate: string; endDate: string; reason: string }>): Promise<any> => {
    const response = await api.put(`/config/club-closures/${id}`, data);
    return response.data;
  },

  deleteClubClosure: async (id: string): Promise<any> => {
    const response = await api.delete(`/config/club-closures/${id}`);
    return response.data;
  },
};