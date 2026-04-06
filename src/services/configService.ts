import type { ConfigResponse, Court, TimeSlot } from "../types";

import { api } from "./httpClient";

export const configService = {
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

  getWhatsappStatus: async (): Promise<any> => {
    const response = await api.get("/config/whatsapp");
    return response.data;
  },

  updateWhatsappStatus: async (enabled: boolean): Promise<any> => {
    const response = await api.put("/config/whatsapp", { enabled });
    return response.data;
  },
};
