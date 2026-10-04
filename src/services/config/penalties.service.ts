import { api } from "../httpClient";

export const penaltiesService = {
  getPenaltySettings: async (): Promise<any> => {
    const response = await api.get("/config/penalties");
    return response.data;
  },

  updatePenaltySettings: async (penaltyLimit: number): Promise<any> => {
    const response = await api.put("/config/penalties", { penaltyLimit });
    return response.data;
  },
};