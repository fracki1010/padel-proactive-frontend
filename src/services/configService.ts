import type { ClubClosure, ConfigResponse, Court, TimeSlot } from "../types";

import { api } from "./httpClient";

const ONE_HOUR_REMINDER_KEY = "booking-reminder-one-hour-enabled";
const CANCELLATION_GROUP_SETTINGS_KEY = "whatsapp-cancellation-group-settings";
const WHATSAPP_GROUPS_CACHE_KEY = "whatsapp-groups-cache";
const WHATSAPP_GROUP_ID_REGEX = /^[A-Za-z0-9._:-]{6,80}@g\.us$/;
let isBotAutomationEndpointAvailable: boolean | null = null;
const DEFAULT_ATTENDANCE_REMINDER_LEAD_MINUTES = 60;
const DEFAULT_ATTENDANCE_RESPONSE_TIMEOUT_MINUTES = 15;
const DEFAULT_TRUSTED_CLIENT_CONFIRMATION_COUNT = 3;
const DEFAULT_PENALTY_LIMIT = 2;
const DEFAULT_PENALTY_ENABLED = true;
const DEFAULT_CANCELLATION_LOCK_HOURS = 2;

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
  dailyAvailabilityDigestHour: string;
  dailyAvailabilityDigestNextDayEnabled: boolean;
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
  const dailyAvailabilityDigestHourCandidates = [
    data?.dailyAvailabilityDigestHour,
    data?.dailyGroupAvailabilityHour,
    data?.groupDailyAvailabilityDigestHour,
    data?.groupNotifications?.dailyAvailability?.hour,
  ];
  const dailyAvailabilityDigestNextDayEnabledCandidates = [
    data?.dailyAvailabilityDigestNextDayEnabled,
    data?.dailyNextDayAvailabilityEnabled,
    data?.groupDailyAvailabilityNextDayEnabled,
    data?.groupNotifications?.dailyAvailability?.nextDayEnabled,
  ];

  const enabled = enabledCandidates.find((value) => typeof value === "boolean");
  const groupId = groupIdCandidates.find((value) => typeof value === "string");
  const groupName = groupNameCandidates.find((value) => typeof value === "string");
  const dailyAvailabilityDigestEnabled =
    dailyAvailabilityDigestEnabledCandidates.find(
      (value) => typeof value === "boolean",
    );
  const dailyAvailabilityDigestHour = dailyAvailabilityDigestHourCandidates.find(
    (value) =>
      typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value),
  );
  const dailyAvailabilityDigestNextDayEnabled =
    dailyAvailabilityDigestNextDayEnabledCandidates.find(
      (value) => typeof value === "boolean",
    );

  if (
    typeof enabled !== "boolean" &&
    typeof groupId !== "string" &&
    typeof groupName !== "string" &&
    typeof dailyAvailabilityDigestEnabled !== "boolean" &&
    typeof dailyAvailabilityDigestHour !== "string" &&
    typeof dailyAvailabilityDigestNextDayEnabled !== "boolean"
  ) {
    return null;
  }

  return {
    enabled: Boolean(enabled),
    groupId: typeof groupId === "string" ? groupId : "",
    groupName: typeof groupName === "string" ? groupName : "",
    dailyAvailabilityDigestEnabled: Boolean(dailyAvailabilityDigestEnabled),
    dailyAvailabilityDigestHour:
      typeof dailyAvailabilityDigestHour === "string"
        ? dailyAvailabilityDigestHour
        : "09:00",
    dailyAvailabilityDigestNextDayEnabled: Boolean(
      dailyAvailabilityDigestNextDayEnabled,
    ),
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
      const rawName = normalizeGroupName(group);
      const name = rawName.replace(/\s+/g, " ").trim().slice(0, 80);

      return { id, name: name || id };
    })
    .filter((group: { id: string }) => WHATSAPP_GROUP_ID_REGEX.test(group.id));

  const uniqueById = new Map<string, { id: string; name: string }>();
  for (const group of normalized) {
    if (!uniqueById.has(group.id)) {
      uniqueById.set(group.id, group);
    }
  }

  return Array.from(uniqueById.values()).slice(0, 200);
};

const parseWhatsappCommandId = (responseData: any): string => {
  const commandIdCandidates = [
    responseData?.commandId,
    responseData?.data?.commandId,
    responseData?.data?.meta?.commandId,
    responseData?.meta?.commandId,
  ];

  const commandId = commandIdCandidates.find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
  return typeof commandId === "string" ? commandId.trim() : "";
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForWhatsappCommandCompletion = async (
  commandId: string,
  {
    maxAttempts = 15,
    delayMs = 1200,
  }: { maxAttempts?: number; delayMs?: number } = {},
): Promise<boolean> => {
  const normalizedCommandId = String(commandId || "").trim();
  if (!normalizedCommandId) return false;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const statusResponse = await api.get(`/whatsapp/commands/${normalizedCommandId}`);
      const status = String(statusResponse?.data?.data?.status || "").toLowerCase();
      if (status === "done" || status === "failed") return true;
    } catch {
      // If status endpoint fails, avoid blocking and fallback to other routes/cache.
      return false;
    }

    if (attempt < maxAttempts) {
      await sleep(delayMs);
    }
  }

  return false;
};

const parsePenaltySystemEnabled = (responseData: any): boolean | null => {
  const data = responseData?.data ?? responseData;
  const candidates = [
    data?.penaltyEnabled,
    data?.penaltySystemEnabled,
    data?.penaltiesEnabled,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "boolean") return candidate;
  }

  return null;
};

const parsePenaltyLimit = (responseData: any): number | null => {
  const data = responseData?.data ?? responseData;
  const parsed = Number(data?.penaltyLimit);
  if (Number.isInteger(parsed) && parsed >= 1) return parsed;
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

  deleteCourt: async (id: string): Promise<any> => {
    const response = await api.delete(`/config/courts/${id}`);
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

  getBotAutomationSettings: async (): Promise<any> => {
    if (isBotAutomationEndpointAvailable !== false) {
      try {
        const response = await api.get("/config/bot-automation");
        isBotAutomationEndpointAvailable = true;
        return response.data;
      } catch (error: any) {
        const status = error?.response?.status;
        if (![404, 405].includes(status)) {
          throw error;
        }
        isBotAutomationEndpointAvailable = false;
      }
    }

    // Compatibilidad con backends viejos sin /config/bot-automation
    const [oneHourResponse, penaltiesResponse] = await Promise.allSettled([
      configService.getOneHourReminderSetting(),
      configService.getPenaltySettings(),
    ]);

    const oneHourReminderEnabled =
      oneHourResponse.status === "fulfilled"
        ? Boolean(oneHourResponse.value?.data?.oneHourReminderEnabled)
        : true;

    const penaltiesData =
      penaltiesResponse.status === "fulfilled" ? penaltiesResponse.value : null;
    const penaltyEnabledParsed = parsePenaltySystemEnabled(penaltiesData);
    const penaltyLimitParsed = parsePenaltyLimit(penaltiesData);

    return {
      success: true,
      data: {
        oneHourReminderEnabled,
        attendanceReminderLeadMinutes: DEFAULT_ATTENDANCE_REMINDER_LEAD_MINUTES,
        attendanceResponseTimeoutMinutes:
          DEFAULT_ATTENDANCE_RESPONSE_TIMEOUT_MINUTES,
        cancellationLockHours: DEFAULT_CANCELLATION_LOCK_HOURS,
        trustedClientConfirmationCount:
          DEFAULT_TRUSTED_CLIENT_CONFIRMATION_COUNT,
        penaltyEnabled:
          typeof penaltyEnabledParsed === "boolean"
            ? penaltyEnabledParsed
            : DEFAULT_PENALTY_ENABLED,
        penaltySystemEnabled:
          typeof penaltyEnabledParsed === "boolean"
            ? penaltyEnabledParsed
            : DEFAULT_PENALTY_ENABLED,
        penaltyLimit: penaltyLimitParsed ?? DEFAULT_PENALTY_LIMIT,
        compatibilityMode: true,
      },
    };
  },

  updateBotAutomationSettings: async (payload: {
    oneHourReminderEnabled?: boolean;
    attendanceReminderLeadMinutes?: number;
    attendanceResponseTimeoutMinutes?: number;
    cancellationLockHours?: number;
    trustedClientConfirmationCount?: number;
    penaltyEnabled?: boolean;
    penaltySystemEnabled?: boolean;
    penaltyLimit?: number;
  }): Promise<any> => {
    const canFallbackToLegacyRoutes =
      payload.attendanceReminderLeadMinutes === undefined &&
      payload.attendanceResponseTimeoutMinutes === undefined &&
      payload.cancellationLockHours === undefined &&
      payload.trustedClientConfirmationCount === undefined &&
      payload.penaltyEnabled === undefined &&
      payload.penaltySystemEnabled === undefined;

    if (isBotAutomationEndpointAvailable !== false) {
      try {
        const response = await api.put("/config/bot-automation", payload);
        isBotAutomationEndpointAvailable = true;
        return response.data;
      } catch (error: any) {
        const status = error?.response?.status;
        const shouldFallback =
          [404, 405].includes(status) ||
          (canFallbackToLegacyRoutes && [400, 422].includes(status));

        if (!shouldFallback) {
          throw error;
        }
        isBotAutomationEndpointAvailable = false;
      }
    }

    // Compatibilidad con backends viejos sin /config/bot-automation
    const hasUnsupportedFields =
      payload.attendanceReminderLeadMinutes !== undefined ||
      payload.attendanceResponseTimeoutMinutes !== undefined ||
      payload.cancellationLockHours !== undefined ||
      payload.trustedClientConfirmationCount !== undefined ||
      payload.penaltyEnabled !== undefined ||
      payload.penaltySystemEnabled !== undefined;

    if (hasUnsupportedFields) {
      throw new Error(
        "El backend actual no soporta esta configuración. Actualizá el backend o usá VITE_API_URL local.",
      );
    }

    const operations: Array<Promise<any>> = [];

    if (typeof payload.oneHourReminderEnabled === "boolean") {
      operations.push(
        configService.updateOneHourReminderSetting(payload.oneHourReminderEnabled),
      );
    }

    if (payload.penaltyLimit !== undefined) {
      operations.push(configService.updatePenaltySettings(payload.penaltyLimit));
    }

    if (!operations.length) {
      throw new Error("No hay cambios compatibles para guardar.");
    }

    await Promise.all(operations);
    return configService.getBotAutomationSettings();
  },

  getWhatsappStatus: async (): Promise<any> => {
    const response = await api.get("/config/whatsapp");
    return response.data;
  },

  getWhatsappCommandStatus: async (commandId: string): Promise<any> => {
    const normalizedId = String(commandId || "").trim();
    if (!normalizedId) {
      throw new Error("commandId inválido");
    }
    const response = await api.get(`/whatsapp/commands/${normalizedId}`);
    return response.data;
  },

  getWhatsappCommands: async ({
    limit = 20,
    status = "",
    type = "",
  }: {
    limit?: number;
    status?: string;
    type?: string;
  } = {}): Promise<any> => {
    const normalizedLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const response = await api.get("/whatsapp/commands", {
      params: {
        limit: normalizedLimit,
        ...(status ? { status } : {}),
        ...(type ? { type } : {}),
      },
    });
    return response.data;
  },

  retryWhatsappCommand: async (commandId: string): Promise<any> => {
    const normalizedId = String(commandId || "").trim();
    if (!normalizedId) {
      throw new Error("commandId inválido");
    }
    const response = await api.post(`/whatsapp/commands/${normalizedId}/retry`);
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
      "/config/whatsapp",
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
        url: "/config/whatsapp",
        payload: { oneHourReminderEnabled: enabled },
      },
      {
        method: "patch",
        url: "/config/whatsapp",
        payload: { oneHourReminderEnabled: enabled },
      },
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

    throw (
      lastError ??
      new Error(
        "No se pudo guardar la configuración de confirmación previa en el backend.",
      )
    );
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
            dailyAvailabilityDigestHour:
              typeof localParsed?.dailyAvailabilityDigestHour === "string" &&
              /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(
                localParsed.dailyAvailabilityDigestHour,
              )
                ? localParsed.dailyAvailabilityDigestHour
                : "09:00",
            dailyAvailabilityDigestNextDayEnabled: Boolean(
              localParsed?.dailyAvailabilityDigestNextDayEnabled,
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
        dailyAvailabilityDigestHour: "09:00",
        dailyAvailabilityDigestNextDayEnabled: false,
        persistedLocally: true,
      },
    };
  },

  updateWhatsappCancellationGroupSettings: async ({
    enabled,
    groupId,
    groupName,
    dailyAvailabilityDigestEnabled,
    dailyAvailabilityDigestHour,
    dailyAvailabilityDigestNextDayEnabled,
  }: {
    enabled: boolean;
    groupId: string;
    groupName: string;
    dailyAvailabilityDigestEnabled: boolean;
    dailyAvailabilityDigestHour: string;
    dailyAvailabilityDigestNextDayEnabled: boolean;
  }): Promise<any> => {
    const normalizedGroupId = groupId.trim();
    const normalizedGroupName = groupName.trim();
    if (enabled && !WHATSAPP_GROUP_ID_REGEX.test(normalizedGroupId)) {
      throw new Error("ID de grupo inválido. Debe terminar en @g.us.");
    }
    const normalizedDailyAvailabilityDigestHour =
      typeof dailyAvailabilityDigestHour === "string" &&
      /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(dailyAvailabilityDigestHour.trim())
        ? dailyAvailabilityDigestHour.trim()
        : "09:00";
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
          dailyAvailabilityDigestHour: normalizedDailyAvailabilityDigestHour,
          dailyAvailabilityDigestNextDayEnabled,
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
          dailyAvailabilityDigestHour: normalizedDailyAvailabilityDigestHour,
          dailyAvailabilityDigestNextDayEnabled,
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
          dailyGroupAvailabilityHour: normalizedDailyAvailabilityDigestHour,
          dailyNextDayAvailabilityEnabled: dailyAvailabilityDigestNextDayEnabled,
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
          dailyGroupAvailabilityHour: normalizedDailyAvailabilityDigestHour,
          dailyNextDayAvailabilityEnabled: dailyAvailabilityDigestNextDayEnabled,
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
          groupDailyAvailabilityDigestHour: normalizedDailyAvailabilityDigestHour,
          groupDailyAvailabilityNextDayEnabled:
            dailyAvailabilityDigestNextDayEnabled,
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
          groupDailyAvailabilityDigestHour: normalizedDailyAvailabilityDigestHour,
          groupDailyAvailabilityNextDayEnabled:
            dailyAvailabilityDigestNextDayEnabled,
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
          dailyAvailabilityDigestHour: normalizedDailyAvailabilityDigestHour,
          dailyAvailabilityDigestNextDayEnabled,
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

    throw (
      lastError ??
      new Error("No se pudo guardar la configuración de grupo en el backend.")
    );
  },

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
        let response = await api.get(url);
        let groups = parseWhatsappGroups(response.data);

        const commandId = parseWhatsappCommandId(response.data);
        if (!groups.length && commandId) {
          const completed = await waitForWhatsappCommandCompletion(commandId);
          if (completed) {
            response = await api.get(url);
            groups = parseWhatsappGroups(response.data);
          }
        }

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
      const normalizedCached = parseWhatsappGroups({ data: localParsed });
      if (normalizedCached.length > 0) {
        return { data: normalizedCached, persistedLocally: true };
      }
    } catch {
      // ignore malformed local data
    }

    return { data: [] };
  },
};
