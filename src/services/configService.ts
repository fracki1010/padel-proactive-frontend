import type { ConfigResponse, Court, TimeSlot } from "../types";

import { api } from "./httpClient";

const ONE_HOUR_REMINDER_KEY = "booking-reminder-one-hour-enabled";
const CANCELLATION_GROUP_SETTINGS_KEY = "whatsapp-cancellation-group-settings";
const WHATSAPP_GROUPS_CACHE_KEY = "whatsapp-groups-cache";

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

const parseWhatsappCancellationGroupSettings = (
  responseData: any,
): {
  enabled: boolean;
  groupId: string;
  groupName: string;
  dailyAvailabilityDigestEnabled: boolean;
} | null => {
  const data = responseData?.data ?? responseData;

  if (!data || typeof data !== "object") return null;

  const enabledCandidates = [
    data?.cancellationGroupEnabled,
    data?.cancelationGroupEnabled,
    data?.groupCancellationAlertsEnabled,
    data?.cancelledBookingGroupEnabled,
    data?.notifyCancelledBookingGroup,
    data?.groupNotifications?.cancellations?.enabled,
  ];
  const groupIdCandidates = [
    data?.cancellationGroupId,
    data?.cancelationGroupId,
    data?.groupCancellationAlertsId,
    data?.cancelledBookingGroupId,
    data?.groupNotifications?.cancellations?.groupId,
  ];
  const groupNameCandidates = [
    data?.cancellationGroupName,
    data?.cancelationGroupName,
    data?.groupCancellationAlertsName,
    data?.cancelledBookingGroupName,
    data?.groupNotifications?.cancellations?.groupName,
    data?.groupNotifications?.cancellations?.name,
  ];
  const dailyAvailabilityDigestEnabledCandidates = [
    data?.dailyAvailabilityDigestEnabled,
    data?.dailyGroupAvailabilityEnabled,
    data?.groupDailyAvailabilityDigestEnabled,
    data?.groupNotifications?.dailyAvailability?.enabled,
  ];

  const enabled = enabledCandidates.find((value) => typeof value === "boolean");
  const groupId = groupIdCandidates.find((value) => typeof value === "string");
  const groupName = groupNameCandidates.find((value) => typeof value === "string");
  const dailyAvailabilityDigestEnabled =
    dailyAvailabilityDigestEnabledCandidates.find(
      (value) => typeof value === "boolean",
    );

  if (
    typeof enabled !== "boolean" &&
    typeof groupId !== "string" &&
    typeof groupName !== "string" &&
    typeof dailyAvailabilityDigestEnabled !== "boolean"
  ) {
    return null;
  }

  return {
    enabled: Boolean(enabled),
    groupId: typeof groupId === "string" ? groupId : "",
    groupName: typeof groupName === "string" ? groupName : "",
    dailyAvailabilityDigestEnabled: Boolean(dailyAvailabilityDigestEnabled),
  };
};

const parseWhatsappGroups = (responseData: any): Array<{ id: string; name: string }> => {
  const data = responseData?.data ?? responseData;
  const groupsRaw = Array.isArray(data)
    ? data
    : Array.isArray(data?.groups)
      ? data.groups
      : Array.isArray(data?.chats)
        ? data.chats
        : Array.isArray(data?.items)
          ? data.items
          : [];

  const normalizeGroupId = (group: any): string => {
    const directId = [group?.id, group?._id, group?.groupId, group?.chatId].find(
      (value) => typeof value === "string",
    );
    if (typeof directId === "string") return directId;

    const serializedNestedId = [
      group?.id?._serialized,
      group?.wid?._serialized,
      group?.chatId?._serialized,
    ].find((value) => typeof value === "string");
    if (typeof serializedNestedId === "string") return serializedNestedId;

    return "";
  };

  const normalizeGroupName = (group: any): string => {
    const directName = [group?.name, group?.subject, group?.title].find(
      (value) => typeof value === "string" && value.trim().length > 0,
    );
    return typeof directName === "string" ? directName.trim() : "";
  };

  const normalized = groupsRaw
    .map((group: any) => {
      const id = normalizeGroupId(group).trim();
      const name = normalizeGroupName(group);

      return { id, name: name || id };
    })
    .filter((group: { id: string }) => group.id.endsWith("@g.us"));

  const uniqueById = new Map<string, { id: string; name: string }>();
  for (const group of normalized) {
    if (!uniqueById.has(group.id)) {
      uniqueById.set(group.id, group);
    }
  }

  return Array.from(uniqueById.values());
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
      {
        method: "put",
        url: "/config/notifications",
        payload: { notifyOneHourBeforeMatch: enabled },
      },
      {
        method: "patch",
        url: "/config/notifications",
        payload: { notifyOneHourBeforeMatch: enabled },
      },
      {
        method: "put",
        url: "/config/notifications",
        payload: { notifyOneHourBeforeBooking: enabled },
      },
      {
        method: "patch",
        url: "/config/notifications",
        payload: { notifyOneHourBeforeBooking: enabled },
      },
      {
        method: "put",
        url: "/config/settings",
        payload: { bookingReminderOneHourEnabled: enabled },
      },
      {
        method: "patch",
        url: "/config/settings",
        payload: { bookingReminderOneHourEnabled: enabled },
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
        return {
          ...response.data,
          data: {
            ...response.data?.data,
            oneHourReminderEnabled: enabled,
          },
        };
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

  getWhatsappCancellationGroupSettings: async (): Promise<any> => {
    const attempts = ["/config/whatsapp", "/config/notifications", "/config/settings"];

    for (const url of attempts) {
      try {
        const response = await api.get(url);
        const parsed = parseWhatsappCancellationGroupSettings(response.data);
        if (parsed) {
          localStorage.setItem(
            CANCELLATION_GROUP_SETTINGS_KEY,
            JSON.stringify(parsed),
          );
          return { data: parsed };
        }
      } catch {
        // continue trying known compatibility routes
      }
    }

    try {
      const localRaw = localStorage.getItem(CANCELLATION_GROUP_SETTINGS_KEY);
      if (localRaw) {
        const localParsed = JSON.parse(localRaw);
        return {
          data: {
            enabled: Boolean(localParsed?.enabled),
            groupId:
              typeof localParsed?.groupId === "string" ? localParsed.groupId : "",
            groupName:
              typeof localParsed?.groupName === "string"
                ? localParsed.groupName
                : "",
            dailyAvailabilityDigestEnabled: Boolean(
              localParsed?.dailyAvailabilityDigestEnabled,
            ),
            persistedLocally: true,
          },
        };
      }
    } catch {
      // ignore malformed local data
    }

    return {
      data: {
        enabled: false,
        groupId: "",
        groupName: "",
        dailyAvailabilityDigestEnabled: false,
        persistedLocally: true,
      },
    };
  },

  updateWhatsappCancellationGroupSettings: async ({
    enabled,
    groupId,
    groupName,
    dailyAvailabilityDigestEnabled,
  }: {
    enabled: boolean;
    groupId: string;
    groupName: string;
    dailyAvailabilityDigestEnabled: boolean;
  }): Promise<any> => {
    const normalizedGroupId = groupId.trim();
    const normalizedGroupName = groupName.trim();
    const attempts: Array<{
      method: "put" | "patch";
      url: string;
      payload: Record<string, any>;
    }> = [
      {
        method: "put",
        url: "/config/whatsapp",
        payload: {
          cancellationGroupEnabled: enabled,
          cancellationGroupId: normalizedGroupId,
          cancellationGroupName: normalizedGroupName,
          dailyAvailabilityDigestEnabled,
        },
      },
      {
        method: "patch",
        url: "/config/whatsapp",
        payload: {
          cancellationGroupEnabled: enabled,
          cancellationGroupId: normalizedGroupId,
          cancellationGroupName: normalizedGroupName,
          dailyAvailabilityDigestEnabled,
        },
      },
      {
        method: "put",
        url: "/config/whatsapp",
        payload: {
          groupCancellationAlertsEnabled: enabled,
          groupCancellationAlertsId: normalizedGroupId,
          groupCancellationAlertsName: normalizedGroupName,
          dailyGroupAvailabilityEnabled: dailyAvailabilityDigestEnabled,
        },
      },
      {
        method: "patch",
        url: "/config/whatsapp",
        payload: {
          groupCancellationAlertsEnabled: enabled,
          groupCancellationAlertsId: normalizedGroupId,
          groupCancellationAlertsName: normalizedGroupName,
          dailyGroupAvailabilityEnabled: dailyAvailabilityDigestEnabled,
        },
      },
      {
        method: "put",
        url: "/config/notifications",
        payload: {
          cancelledBookingGroupEnabled: enabled,
          cancelledBookingGroupId: normalizedGroupId,
          cancelledBookingGroupName: normalizedGroupName,
          groupDailyAvailabilityDigestEnabled: dailyAvailabilityDigestEnabled,
        },
      },
      {
        method: "patch",
        url: "/config/notifications",
        payload: {
          cancelledBookingGroupEnabled: enabled,
          cancelledBookingGroupId: normalizedGroupId,
          cancelledBookingGroupName: normalizedGroupName,
          groupDailyAvailabilityDigestEnabled: dailyAvailabilityDigestEnabled,
        },
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

        const normalizedResult = {
          enabled,
          groupId: normalizedGroupId,
          groupName: normalizedGroupName,
          dailyAvailabilityDigestEnabled,
        };
        localStorage.setItem(
          CANCELLATION_GROUP_SETTINGS_KEY,
          JSON.stringify(normalizedResult),
        );

        return {
          ...response.data,
          data: {
            ...response.data?.data,
            ...normalizedResult,
          },
        };
      } catch (error: any) {
        lastError = error;
      }
    }

    const status = lastError?.response?.status;
    if (status === 404 || status === 405 || status === 400 || !status) {
      const normalizedResult = {
        enabled,
        groupId: normalizedGroupId,
        groupName: normalizedGroupName,
        dailyAvailabilityDigestEnabled,
      };
      localStorage.setItem(
        CANCELLATION_GROUP_SETTINGS_KEY,
        JSON.stringify(normalizedResult),
      );
      return { data: { ...normalizedResult, persistedLocally: true } };
    }

    throw lastError;
  },

  getWhatsappGroups: async (): Promise<any> => {
    const attempts = [
      "/config/whatsapp/groups",
      "/config/whatsapp/chats?type=group",
      "/config/whatsapp/chats",
      "/whatsapp/groups",
      "/whatsapp/chats?type=group",
    ];

    for (const url of attempts) {
      try {
        const response = await api.get(url);
        const groups = parseWhatsappGroups(response.data);
        if (groups.length > 0) {
          localStorage.setItem(WHATSAPP_GROUPS_CACHE_KEY, JSON.stringify(groups));
          return { data: groups };
        }
      } catch {
        // continue trying known compatibility routes
      }
    }

    try {
      const localRaw = localStorage.getItem(WHATSAPP_GROUPS_CACHE_KEY);
      const localParsed = localRaw ? JSON.parse(localRaw) : [];
      if (Array.isArray(localParsed) && localParsed.length > 0) {
        return { data: localParsed, persistedLocally: true };
      }
    } catch {
      // ignore malformed local data
    }

    return { data: [] };
  },
};
