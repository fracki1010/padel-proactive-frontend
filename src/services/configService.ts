import type { ConfigResponse, Court, TimeSlot } from "../types";

import { api } from "./httpClient";

const ONE_HOUR_REMINDER_KEY = "booking-reminder-one-hour-enabled";

const parseOneHourReminderEnabled = (responseData: any): boolean | null => {
  const data = responseData?.data ?? responseData;
  const candidates = [
    data?.oneHourBeforeEnabled,
    data?.oneHourReminderEnabled,
    data?.bookingReminderOneHourEnabled,
    data?.notifyOneHourBeforeMatch,
    data?.notifyOneHourBeforeBooking,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "boolean") return candidate;
  }

  return null;
};

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
      method: "put" | "patch";
      payload: Record<string, boolean>;
    }> = [
      {
        method: "put",
        payload: { enabled: false, closeAll: true },
      },
      {
        method: "patch",
        payload: { enabled: false, closeAll: true },
      },
      {
        method: "put",
        payload: { enabled: false, forceShutdown: true },
      },
      {
        method: "patch",
        payload: { enabled: false, forceShutdown: true },
      },
      {
        method: "put",
        payload: { enabled: false },
      },
      {
        method: "patch",
        payload: { enabled: false },
      },
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
      } catch (error: any) {
        lastError = error;
      }
    }

    try {
      return await configService.updateWhatsappStatus(false);
    } catch {
      throw lastError;
    }
  },

  getOneHourReminderSetting: async (): Promise<any> => {
    const attempts = [
      "/config/notifications/reminders",
      "/config/notifications",
      "/config/reminders",
      "/config/settings",
    ];

    for (const url of attempts) {
      try {
        const response = await api.get(url);
        const parsed = parseOneHourReminderEnabled(response.data);
        if (parsed !== null) {
          localStorage.setItem(ONE_HOUR_REMINDER_KEY, String(parsed));
          return { data: { oneHourReminderEnabled: parsed } };
        }
      } catch {
        // continue trying known compatibility routes
      }
    }

    const localValue = localStorage.getItem(ONE_HOUR_REMINDER_KEY) === "true";
    return { data: { oneHourReminderEnabled: localValue, persistedLocally: true } };
  },

  updateOneHourReminderSetting: async (enabled: boolean): Promise<any> => {
    const attempts: Array<{
      method: "put" | "patch";
      url: string;
      payload: Record<string, boolean>;
    }> = [
      {
        method: "put",
        url: "/config/notifications/reminders",
        payload: { oneHourReminderEnabled: enabled },
      },
      {
        method: "patch",
        url: "/config/notifications/reminders",
        payload: { oneHourReminderEnabled: enabled },
      },
      {
        method: "put",
        url: "/config/notifications",
        payload: { oneHourBeforeEnabled: enabled },
      },
      {
        method: "patch",
        url: "/config/notifications",
        payload: { oneHourBeforeEnabled: enabled },
      },
    ];

    let lastError: any = null;

    for (const attempt of attempts) {
      try {
        const response = await api.request({
          method: attempt.method,
          url: attempt.url,
          data: attempt.payload,
        });
        localStorage.setItem(ONE_HOUR_REMINDER_KEY, String(enabled));
        return response.data;
      } catch (error: any) {
        lastError = error;
      }
    }

    const status = lastError?.response?.status;
    if (status === 404 || status === 405 || status === 400 || !status) {
      localStorage.setItem(ONE_HOUR_REMINDER_KEY, String(enabled));
      return { data: { oneHourReminderEnabled: enabled, persistedLocally: true } };
    }

    throw lastError;
  },
};
