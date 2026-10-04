import { api } from "../httpClient";
import {
  ONE_HOUR_REMINDER_KEY,
  CANCELLATION_GROUP_SETTINGS_KEY,
  WHATSAPP_GROUPS_CACHE_KEY,
  WHATSAPP_GROUP_ID_REGEX,
  parseOneHourReminderEnabled,
  parseWhatsappCancellationGroupSettings,
  parseWhatsappGroups,
  parseWhatsappCommandId,
  waitForWhatsappCommandCompletion,
} from "./parsers";

export const whatsappService = {
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

  resetWhatsappSession: async (): Promise<any> => {
    const response = await api.post("/config/whatsapp/reset-session");
    return response.data;
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
      return await whatsappService.updateWhatsappStatus(false);
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
    dailyAvailabilityDigestFormat = "text",
  }: {
    enabled: boolean;
    groupId: string;
    groupName: string;
    dailyAvailabilityDigestEnabled: boolean;
    dailyAvailabilityDigestHour: string;
    dailyAvailabilityDigestNextDayEnabled: boolean;
    dailyAvailabilityDigestFormat?: "text" | "image";
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
          dailyAvailabilityDigestFormat,
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
          dailyAvailabilityDigestFormat,
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
          dailyAvailabilityDigestFormat,
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
          dailyAvailabilityDigestFormat,
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
          groupDailyAvailabilityNextDayEnabled: dailyAvailabilityDigestNextDayEnabled,
          dailyAvailabilityDigestFormat,
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
          groupDailyAvailabilityNextDayEnabled: dailyAvailabilityDigestNextDayEnabled,
          dailyAvailabilityDigestFormat,
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

  sendDigestNow: async (): Promise<{ commandId: string }> => {
    const response = await api.post("/config/whatsapp/send-digest-now");
    return response.data?.data ?? {};
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