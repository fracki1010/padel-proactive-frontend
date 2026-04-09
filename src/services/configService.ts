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

  getPenaltySettings: async (): Promise<any> => {
    const response = await api.get("/config/penalties");
    return response.data;
  },

  updatePenaltySettings: async (penaltyLimit: number): Promise<any> => {
    const response = await api.put("/config/penalties", { penaltyLimit });
    return response.data;
  },

  getWhatsappStatus: async (): Promise<any> => {
    const response = await api.get("/config/whatsapp");
    return response.data;
  },

  updateWhatsappStatus: async (enabled: boolean): Promise<any> => {
    const attempts: Array<{
      method: "put" | "patch";
      payload: Record<string, boolean>;
    }> = [
      { method: "put", payload: { enabled } },
      { method: "put", payload: { isEnabled: enabled } },
      { method: "put", payload: { isActive: enabled } },
      { method: "patch", payload: { enabled } },
      { method: "patch", payload: { isEnabled: enabled } },
      { method: "patch", payload: { isActive: enabled } },
    ];

    let lastError: unknown;

    for (const attempt of attempts) {
      try {
        const response = await api.request({
          method: attempt.method,
          url: "/config/whatsapp",
          data: attempt.payload,
        });
        return response.data;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  },

  closeWhatsappSession: async (): Promise<any> => {
    const attempts: Array<{
      method: "put" | "patch" | "post";
      url: string;
      payload: Record<string, boolean>;
    }> = [
      {
        method: "post",
        url: "/config/whatsapp/session/close",
        payload: { closeAll: true },
      },
      {
        method: "post",
        url: "/config/whatsapp/logout",
        payload: { closeAll: true },
      },
      {
        method: "put",
        url: "/config/whatsapp",
        payload: { enabled: false, closeAll: true },
      },
      {
        method: "patch",
        url: "/config/whatsapp",
        payload: { enabled: false, closeAll: true },
      },
      {
        method: "put",
        url: "/config/whatsapp",
        payload: { enabled: false, forceShutdown: true },
      },
      {
        method: "patch",
        url: "/config/whatsapp",
        payload: { enabled: false, forceShutdown: true },
      },
    ];

    let lastError: unknown;

    for (const attempt of attempts) {
      try {
        const response = await api.request({
          method: attempt.method,
          url: attempt.url,
          data: attempt.payload,
        });
        return response.data;
      } catch (error: any) {
        lastError = error;
        const status = error?.response?.status;
        if (status !== 404 && status !== 405) {
          break;
        }
      }
    }

    try {
      return await configService.updateWhatsappStatus(false);
    } catch {
      throw lastError;
    }
  },
};
