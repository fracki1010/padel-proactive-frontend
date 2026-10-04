import { api } from "../httpClient";
import type { ConfigResponse, TimeSlot } from "../../types";

export const slotsService = {
  getSlots: async (all = false): Promise<ConfigResponse<TimeSlot>> => {
    const response = await api.get(`/config/slots${all ? "?all=true" : ""}`);
    return response.data;
  },

  createSlot: async (data: Partial<TimeSlot> & { startTime: string; endTime: string; price: number }): Promise<any> => {
    const response = await api.post("/config/slots", data);
    return response.data;
  },

  updateSlot: async (id: string, data: Partial<TimeSlot>): Promise<any> => {
    const response = await api.put(`/config/slots/${id}`, data);
    return response.data;
  },

  updateBasePrice: async (price: number): Promise<any> => {
    const response = await api.put("/config/slots/base-price", { price });
    return response.data;
  },
};