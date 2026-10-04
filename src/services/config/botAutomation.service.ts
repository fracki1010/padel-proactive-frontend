import { api } from "../httpClient";
import {
  DEFAULT_ATTENDANCE_REMINDER_LEAD_MINUTES,
  DEFAULT_ATTENDANCE_RESPONSE_TIMEOUT_MINUTES,
  DEFAULT_TRUSTED_CLIENT_CONFIRMATION_COUNT,
  DEFAULT_PENALTY_LIMIT,
  DEFAULT_PENALTY_ENABLED,
  DEFAULT_CANCELLATION_LOCK_HOURS,
  parsePenaltySystemEnabled,
  parsePenaltyLimit,
} from "./parsers";
import { whatsappService } from "./whatsapp.service";
import { penaltiesService } from "./penalties.service";

let isBotAutomationEndpointAvailable: boolean | null = null;

export const botAutomationService = {
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
      whatsappService.getOneHourReminderSetting(),
      penaltiesService.getPenaltySettings(),
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
        whatsappService.updateOneHourReminderSetting(payload.oneHourReminderEnabled),
      );
    }

    if (payload.penaltyLimit !== undefined) {
      operations.push(penaltiesService.updatePenaltySettings(payload.penaltyLimit));
    }

    if (!operations.length) {
      throw new Error("No hay cambios compatibles para guardar.");
    }

    await Promise.all(operations);
    return botAutomationService.getBotAutomationSettings();
  },
};