import { api } from "../httpClient";

export const ONE_HOUR_REMINDER_KEY = "booking-reminder-one-hour-enabled";
export const CANCELLATION_GROUP_SETTINGS_KEY = "whatsapp-cancellation-group-settings";
export const WHATSAPP_GROUPS_CACHE_KEY = "whatsapp-groups-cache";
export const WHATSAPP_GROUP_ID_REGEX = /^[A-Za-z0-9._:-]{6,80}@g\.us$/;
export const DEFAULT_ATTENDANCE_REMINDER_LEAD_MINUTES = 60;
export const DEFAULT_ATTENDANCE_RESPONSE_TIMEOUT_MINUTES = 15;
export const DEFAULT_TRUSTED_CLIENT_CONFIRMATION_COUNT = 3;
export const DEFAULT_PENALTY_LIMIT = 2;
export const DEFAULT_PENALTY_ENABLED = true;
export const DEFAULT_CANCELLATION_LOCK_HOURS = 2;

export type CompanyImage = {
  _id: string;
  type: "portal_cover" | "digest_background";
  order: number;
  url: string;
};

export type DigestBackground = CompanyImage;

export const parseOneHourReminderEnabled = (responseData: any): boolean | null => {
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

export const parseWhatsappCancellationGroupSettings = (
  responseData: any,
): {
  enabled: boolean;
  groupId: string;
  groupName: string;
  dailyAvailabilityDigestEnabled: boolean;
  dailyAvailabilityDigestHour: string;
  dailyAvailabilityDigestNextDayEnabled: boolean;
  dailyAvailabilityDigestFormat: "text" | "image";
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
  const dailyAvailabilityDigestFormatRaw =
    data?.dailyAvailabilityDigestFormat === "image" ||
    data?.dailyAvailabilityDigestFormat === "text"
      ? data.dailyAvailabilityDigestFormat
      : null;

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
    typeof dailyAvailabilityDigestNextDayEnabled !== "boolean" &&
    dailyAvailabilityDigestFormatRaw === null
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
    dailyAvailabilityDigestFormat:
      dailyAvailabilityDigestFormatRaw ?? "text",
  };
};

export const parseWhatsappGroups = (responseData: any): Array<{ id: string; name: string }> => {
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

export const parseWhatsappCommandId = (responseData: any): string => {
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

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const waitForWhatsappCommandCompletion = async (
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

export const parsePenaltySystemEnabled = (responseData: any): boolean | null => {
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

export const parsePenaltyLimit = (responseData: any): number | null => {
  const data = responseData?.data ?? responseData;
  const parsed = Number(data?.penaltyLimit);
  if (Number.isInteger(parsed) && parsed >= 1) return parsed;
  return null;
};