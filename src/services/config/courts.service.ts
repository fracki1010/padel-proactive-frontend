import { api } from "../httpClient";
import type { ConfigResponse, Court } from "../../types";

export const courtsService = {
  getCourts: async (all = false): Promise<ConfigResponse<Court>> => {
    const response = await api.get(`/config/courts${all ? "?all=true" : ""}`);
    return response.data;
  },

  createCourt: async (data: Partial<Court>): Promise<any> => {
    const response = await api.post("/config/courts", data);
    return response.data;
  },

  updateCourt: async (id: string, data: Partial<Court>): Promise<any> => {
    const response = await api.put(`/config/courts/${id}`, data);
    return response.data;
  },

  deleteCourt: async (id: string): Promise<any> => {
    const response = await api.delete(`/config/courts/${id}`);
    return response.data;
  },
};