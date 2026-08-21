import { addToast } from "@heroui/react";
import { useEffect, useState } from "react";

import {
  useBotAutomationSettings,
  useUpdateBotAutomationSettings,
  useDigestBackgrounds,
  useUploadDigestBackground,
  useDeleteDigestBackground,
  useSendDigestNow,
} from "../../../hooks/useData";
import type { useWhatsappManagement } from "./useWhatsappManagement";

const resolveOneHourReminderEnabled = (
  source: any,
  fallback = true,
): boolean => {
  const candidates = [
    source?.oneHourReminderEnabled,
    source?.oneHourBeforeEnabled,
    source?.bookingReminderOneHourEnabled,
    source?.notifyOneHourBeforeMatch,
    source?.notifyOneHourBeforeBooking,
  ];

  const firstBoolean = candidates.find((value) => typeof value === "boolean");
  return typeof firstBoolean === "boolean" ? firstBoolean : fallback;
};

type WhatsappDigestContext = ReturnType<typeof useWhatsappManagement>;

export const useBotAutomationManagement = (
  whatsapp: WhatsappDigestContext,
) => {
  const { data: botAutomationSettingsData } = useBotAutomationSettings();
  const updateBotAutomationSettings = useUpdateBotAutomationSettings();
  const { data: digestBackgroundsData } = useDigestBackgrounds();
  const uploadDigestBackground = useUploadDigestBackground();
  const deleteDigestBackground = useDeleteDigestBackground();
  const sendDigestNow = useSendDigestNow();

  const botAutomationSettings = botAutomationSettingsData?.data || {};

  // --- Bot-specific states ---
  const [penaltyLimitInput, setPenaltyLimitInput] = useState("");
  const [penaltyEnabledInput, setPenaltyEnabledInput] = useState(true);
  const [attendanceReminderLeadMinutesInput, setAttendanceReminderLeadMinutesInput] =
    useState("");
  const [
    attendanceResponseTimeoutMinutesInput,
    setAttendanceResponseTimeoutMinutesInput,
  ] = useState("");
  const [cancellationLockHoursInput, setCancellationLockHoursInput] = useState("");
  const [trustedClientConfirmationCountInput, setTrustedClientConfirmationCountInput] =
    useState("");
  const [botOneHourReminderEnabledInput, setBotOneHourReminderEnabledInput] =
    useState(true);

  // --- Saving flags ---
  const [isSavingReminderToggle, setIsSavingReminderToggle] = useState(false);
  const [isSavingPenaltyToggle, setIsSavingPenaltyToggle] = useState(false);
  const [isSavingReminderMinutes, setIsSavingReminderMinutes] = useState(false);
  const [isSavingResponseTimeoutMinutes, setIsSavingResponseTimeoutMinutes] =
    useState(false);
  const [isSavingCancellationLockHours, setIsSavingCancellationLockHours] =
    useState(false);
  const [isSavingTrustedCount, setIsSavingTrustedCount] = useState(false);
  const [isSavingPenaltyLimit, setIsSavingPenaltyLimit] = useState(false);

  // --- Sync effects from botAutomationSettings ---
  useEffect(() => {
    const backendLimit = botAutomationSettings?.penaltyLimit;
    if (!backendLimit) return;
    setPenaltyLimitInput(String(backendLimit));
  }, [botAutomationSettings]);

  useEffect(() => {
    const backendPenaltyEnabledCandidate = [
      botAutomationSettings?.penaltyEnabled,
      botAutomationSettings?.penaltySystemEnabled,
    ].find((value) => typeof value === "boolean");

    if (typeof backendPenaltyEnabledCandidate === "boolean") {
      setPenaltyEnabledInput(backendPenaltyEnabledCandidate);
    }
  }, [botAutomationSettings]);

  useEffect(() => {
    const leadMinutes = botAutomationSettings?.attendanceReminderLeadMinutes;
    if (!leadMinutes) return;
    setAttendanceReminderLeadMinutesInput(String(leadMinutes));
  }, [botAutomationSettings]);

  useEffect(() => {
    const timeoutMinutes = botAutomationSettings?.attendanceResponseTimeoutMinutes;
    if (timeoutMinutes === undefined || timeoutMinutes === null) return;
    if (!Number.isInteger(Number(timeoutMinutes))) return;
    setAttendanceResponseTimeoutMinutesInput(String(Number(timeoutMinutes)));
  }, [botAutomationSettings]);

  useEffect(() => {
    const lockHours = botAutomationSettings?.cancellationLockHours;
    if (lockHours === undefined || lockHours === null) return;
    if (!Number.isInteger(Number(lockHours))) return;
    setCancellationLockHoursInput(String(Number(lockHours)));
  }, [botAutomationSettings]);

  useEffect(() => {
    const trustedCount = botAutomationSettings?.trustedClientConfirmationCount;
    if (!trustedCount) return;
    setTrustedClientConfirmationCountInput(String(trustedCount));
  }, [botAutomationSettings]);

  useEffect(() => {
    setBotOneHourReminderEnabledInput(resolveOneHourReminderEnabled(botAutomationSettings));
  }, [botAutomationSettings]);

  // --- Snapshot/restore helpers ---
  const getServerBotAutomationSnapshot = () => {
    const rawPenaltyEnabled = [
      botAutomationSettings?.penaltyEnabled,
      botAutomationSettings?.penaltySystemEnabled,
    ].find((value) => typeof value === "boolean");

    return {
      oneHourReminderEnabled: resolveOneHourReminderEnabled(botAutomationSettings),
      penaltyEnabled:
        typeof rawPenaltyEnabled === "boolean" ? rawPenaltyEnabled : true,
      attendanceReminderLeadMinutes:
        Number(botAutomationSettings?.attendanceReminderLeadMinutes) || 60,
      attendanceResponseTimeoutMinutes: Number.isInteger(
        Number(botAutomationSettings?.attendanceResponseTimeoutMinutes),
      )
        ? Number(botAutomationSettings?.attendanceResponseTimeoutMinutes)
        : 15,
      cancellationLockHours:
        Number.isInteger(Number(botAutomationSettings?.cancellationLockHours))
          ? Number(botAutomationSettings?.cancellationLockHours)
          : 0,
      trustedClientConfirmationCount:
        Number(botAutomationSettings?.trustedClientConfirmationCount) || 3,
      penaltyLimit: Number(botAutomationSettings?.penaltyLimit) || 2,
    };
  };

  const restoreBotAutomationSnapshot = (snapshot: {
    oneHourReminderEnabled: boolean;
    penaltyEnabled: boolean;
    attendanceReminderLeadMinutes: number;
    attendanceResponseTimeoutMinutes: number;
    cancellationLockHours: number;
    trustedClientConfirmationCount: number;
    penaltyLimit: number;
  }) => {
    setBotOneHourReminderEnabledInput(Boolean(snapshot.oneHourReminderEnabled));
    setPenaltyEnabledInput(Boolean(snapshot.penaltyEnabled));
    setAttendanceReminderLeadMinutesInput(
      String(snapshot.attendanceReminderLeadMinutes),
    );
    setAttendanceResponseTimeoutMinutesInput(
      String(snapshot.attendanceResponseTimeoutMinutes),
    );
    setCancellationLockHoursInput(String(snapshot.cancellationLockHours));
    setTrustedClientConfirmationCountInput(
      String(snapshot.trustedClientConfirmationCount),
    );
    setPenaltyLimitInput(String(snapshot.penaltyLimit));
  };

  const syncBotAutomationFromResponse = (response: any) => {
    const data = response?.data || {};
    setBotOneHourReminderEnabledInput(
      resolveOneHourReminderEnabled(data, botOneHourReminderEnabledInput),
    );
    const responsePenaltyEnabled = [
      data?.penaltyEnabled,
      data?.penaltySystemEnabled,
    ].find((value) => typeof value === "boolean");
    if (typeof responsePenaltyEnabled === "boolean") {
      setPenaltyEnabledInput(responsePenaltyEnabled);
    }
    if (Number.isInteger(Number(data?.attendanceReminderLeadMinutes))) {
      setAttendanceReminderLeadMinutesInput(
        String(Number(data.attendanceReminderLeadMinutes)),
      );
    }
    if (Number.isInteger(Number(data?.attendanceResponseTimeoutMinutes))) {
      setAttendanceResponseTimeoutMinutesInput(
        String(Number(data.attendanceResponseTimeoutMinutes)),
      );
    }
    if (Number.isInteger(Number(data?.cancellationLockHours))) {
      setCancellationLockHoursInput(String(Number(data.cancellationLockHours)));
    }
    if (Number.isInteger(Number(data?.trustedClientConfirmationCount))) {
      setTrustedClientConfirmationCountInput(
        String(Number(data.trustedClientConfirmationCount)),
      );
    }
    if (Number.isInteger(Number(data?.penaltyLimit))) {
      setPenaltyLimitInput(String(Number(data.penaltyLimit)));
    }
  };

  // --- Handlers ---
  const handleToggleBotOneHourReminderRealtime = async (enabled: boolean) => {
    const previousSnapshot = getServerBotAutomationSnapshot();
    setBotOneHourReminderEnabledInput(enabled);
    setIsSavingReminderToggle(true);
    try {
      const response = await updateBotAutomationSettings.mutateAsync({
        oneHourReminderEnabled: enabled,
      });
      syncBotAutomationFromResponse(response);
      addToast({
        title: enabled ? "Confirmación previa activada" : "Confirmación previa desactivada",
        color: "success",
      });
    } catch (err: any) {
      restoreBotAutomationSnapshot(previousSnapshot);
      addToast({
        title:
          err?.response?.data?.error ||
          err?.message ||
          "No se pudo actualizar la confirmación previa",
        color: "danger",
      });
    } finally {
      setIsSavingReminderToggle(false);
    }
  };

  const handleTogglePenaltyEnabledRealtime = async (enabled: boolean) => {
    const previousSnapshot = getServerBotAutomationSnapshot();
    setPenaltyEnabledInput(enabled);
    setIsSavingPenaltyToggle(true);
    try {
      const response = await updateBotAutomationSettings.mutateAsync({
        penaltyEnabled: enabled,
      });
      syncBotAutomationFromResponse(response);
      addToast({
        title: enabled ? "Penalizaciones activadas" : "Penalizaciones desactivadas",
        color: "success",
      });
    } catch (err: any) {
      restoreBotAutomationSnapshot(previousSnapshot);
      addToast({
        title:
          err?.response?.data?.error ||
          err?.message ||
          "No se pudo actualizar el estado de penalizaciones",
        color: "danger",
      });
    } finally {
      setIsSavingPenaltyToggle(false);
    }
  };

  const handleSaveReminderMinutes = async () => {
    const parsedLeadMinutes = Number(attendanceReminderLeadMinutesInput);
    if (!Number.isInteger(parsedLeadMinutes) || parsedLeadMinutes < 5 || parsedLeadMinutes > 240) {
      addToast({
        title: "Minutos de aviso inválidos (usar entero entre 5 y 240).",
        color: "danger",
      });
      return;
    }

    const previousSnapshot = getServerBotAutomationSnapshot();
    setIsSavingReminderMinutes(true);
    try {
      const response = await updateBotAutomationSettings.mutateAsync({
        attendanceReminderLeadMinutes: parsedLeadMinutes,
      });
      syncBotAutomationFromResponse(response);
      addToast({ title: "Minutos de aviso actualizados", color: "success" });
    } catch (err: any) {
      restoreBotAutomationSnapshot(previousSnapshot);
      addToast({
        title:
          err?.response?.data?.error ||
          err?.message ||
          "No se pudo actualizar los minutos de aviso",
        color: "danger",
      });
    } finally {
      setIsSavingReminderMinutes(false);
    }
  };

  const handleSaveAttendanceResponseTimeoutMinutes = async () => {
    const parsedTimeoutMinutes = Number(attendanceResponseTimeoutMinutesInput);
    if (
      !Number.isInteger(parsedTimeoutMinutes) ||
      parsedTimeoutMinutes < 1 ||
      parsedTimeoutMinutes > 240
    ) {
      addToast({
        title: "Tiempo máximo de espera inválido (usar entero entre 1 y 240).",
        color: "danger",
      });
      return;
    }

    const previousSnapshot = getServerBotAutomationSnapshot();
    setIsSavingResponseTimeoutMinutes(true);
    try {
      const response = await updateBotAutomationSettings.mutateAsync({
        attendanceResponseTimeoutMinutes: parsedTimeoutMinutes,
      });
      syncBotAutomationFromResponse(response);
      addToast({
        title: "Tiempo máximo de espera actualizado",
        color: "success",
      });
    } catch (err: any) {
      restoreBotAutomationSnapshot(previousSnapshot);
      addToast({
        title:
          err?.response?.data?.error ||
          err?.message ||
          "No se pudo actualizar el tiempo máximo de espera",
        color: "danger",
      });
    } finally {
      setIsSavingResponseTimeoutMinutes(false);
    }
  };

  const handleSaveCancellationLockHours = async () => {
    const parsedHours = Number(cancellationLockHoursInput);
    if (!Number.isInteger(parsedHours) || parsedHours < 0 || parsedHours > 72) {
      addToast({
        title: "Bloqueo de cancelación inválido (usar entero entre 0 y 72).",
        color: "danger",
      });
      return;
    }

    const previousSnapshot = getServerBotAutomationSnapshot();
    setIsSavingCancellationLockHours(true);
    try {
      const response = await updateBotAutomationSettings.mutateAsync({
        cancellationLockHours: parsedHours,
      });
      syncBotAutomationFromResponse(response);
      addToast({
        title: "Bloqueo de cancelación actualizado",
        color: "success",
      });
    } catch (err: any) {
      restoreBotAutomationSnapshot(previousSnapshot);
      addToast({
        title:
          err?.response?.data?.error ||
          err?.message ||
          "No se pudo actualizar el bloqueo de cancelación",
        color: "danger",
      });
    } finally {
      setIsSavingCancellationLockHours(false);
    }
  };

  const handleSaveTrustedConfirmationCount = async () => {
    const parsedTrustedCount = Number(trustedClientConfirmationCountInput);
    if (!Number.isInteger(parsedTrustedCount) || parsedTrustedCount < 1 || parsedTrustedCount > 20) {
      addToast({
        title: "Confirmaciones para cliente confiable inválidas (1 a 20).",
        color: "danger",
      });
      return;
    }

    const previousSnapshot = getServerBotAutomationSnapshot();
    setIsSavingTrustedCount(true);
    try {
      const response = await updateBotAutomationSettings.mutateAsync({
        trustedClientConfirmationCount: parsedTrustedCount,
      });
      syncBotAutomationFromResponse(response);
      addToast({
        title: "Umbral de cliente confiable actualizado",
        color: "success",
      });
    } catch (err: any) {
      restoreBotAutomationSnapshot(previousSnapshot);
      addToast({
        title:
          err?.response?.data?.error ||
          err?.message ||
          "No se pudo actualizar el umbral de cliente confiable",
        color: "danger",
      });
    } finally {
      setIsSavingTrustedCount(false);
    }
  };

  const handleSavePenaltyLimit = async () => {
    const parsedPenalty = Number(penaltyLimitInput);
    if (!Number.isInteger(parsedPenalty) || parsedPenalty < 1) {
      addToast({
        title: "Límite de penalizaciones inválido (entero mayor o igual a 1).",
        color: "danger",
      });
      return;
    }

    const previousSnapshot = getServerBotAutomationSnapshot();
    setIsSavingPenaltyLimit(true);
    try {
      const response = await updateBotAutomationSettings.mutateAsync({
        penaltyLimit: parsedPenalty,
      });
      syncBotAutomationFromResponse(response);
      addToast({ title: "Límite de penalizaciones actualizado", color: "success" });
    } catch (err: any) {
      restoreBotAutomationSnapshot(previousSnapshot);
      addToast({
        title:
          err?.response?.data?.error ||
          err?.message ||
          "No se pudo actualizar el límite de penalizaciones",
        color: "danger",
      });
    } finally {
      setIsSavingPenaltyLimit(false);
    }
  };

  // --- Digest handlers (delegate to whatsapp hook) ---
  const handleToggleDailyAvailabilityDigestFromBot = (enabled: boolean) => {
    if (enabled && !whatsapp.cancellationGroupIdInput.trim()) {
      addToast({
        title: "Primero seleccioná un grupo para enviar el resumen diario",
        color: "warning",
      });
      return;
    }

    whatsapp.persistWhatsappCancellationGroupSettings(
      whatsapp.cancellationGroupEnabled,
      whatsapp.cancellationGroupIdInput,
      whatsapp.cancellationGroupNameInput,
      enabled,
      whatsapp.dailyAvailabilityDigestHourInput,
      whatsapp.dailyAvailabilityDigestNextDayEnabledInput,
      whatsapp.dailyAvailabilityDigestFormatInput,
    );
  };

  const handleToggleDailyAvailabilityDigestNextDayFromBot = (enabled: boolean) => {
    if (enabled && !whatsapp.cancellationGroupIdInput.trim()) {
      addToast({
        title: "Primero seleccioná un grupo para enviar la disponibilidad de mañana",
        color: "warning",
      });
      return;
    }

    whatsapp.persistWhatsappCancellationGroupSettings(
      whatsapp.cancellationGroupEnabled,
      whatsapp.cancellationGroupIdInput,
      whatsapp.cancellationGroupNameInput,
      whatsapp.dailyAvailabilityDigestEnabledInput,
      whatsapp.dailyAvailabilityDigestHourInput,
      enabled,
      whatsapp.dailyAvailabilityDigestFormatInput,
    );
  };

  const handleSaveDailyAvailabilityDigestSchedule = () => {
    if (!whatsapp.cancellationGroupIdInput.trim()) {
      addToast({
        title: "Primero configurá un grupo en WhatsApp Web para usar estos avisos",
        color: "warning",
      });
      return;
    }

    whatsapp.persistWhatsappCancellationGroupSettings(
      whatsapp.cancellationGroupEnabled,
      whatsapp.cancellationGroupIdInput,
      whatsapp.cancellationGroupNameInput,
      whatsapp.dailyAvailabilityDigestEnabledInput,
      whatsapp.dailyAvailabilityDigestHourInput,
      whatsapp.dailyAvailabilityDigestNextDayEnabledInput,
      whatsapp.dailyAvailabilityDigestFormatInput,
    );
  };

  return {
    oneHourReminderEnabled: botOneHourReminderEnabledInput,
    penaltyEnabled: penaltyEnabledInput,
    attendanceReminderLeadMinutesInput,
    attendanceResponseTimeoutMinutesInput,
    cancellationLockHoursInput,
    trustedClientConfirmationCountInput,
    penaltyLimitInput,
    dailyAvailabilityDigestEnabled: whatsapp.dailyAvailabilityDigestEnabledInput,
    dailyAvailabilityDigestHourInput: whatsapp.dailyAvailabilityDigestHourInput,
    dailyAvailabilityDigestNextDayEnabled:
      whatsapp.dailyAvailabilityDigestNextDayEnabledInput,
    dailyAvailabilityDigestFormat: whatsapp.dailyAvailabilityDigestFormatInput,
    cancellationGroupConfigured: Boolean(whatsapp.cancellationGroupIdInput.trim()),
    isSavingReminderToggle,
    isSavingPenaltyToggle,
    isSavingReminderMinutes,
    isSavingResponseTimeoutMinutes,
    isSavingCancellationLockHours,
    isSavingTrustedCount,
    isSavingPenaltyLimit,
    isSavingDailyAvailabilityDigestSettings:
      whatsapp.isSavingDailyAvailabilityDigestSettings,
    digestBackgrounds: digestBackgroundsData ?? [],
    isUploadingBackground: uploadDigestBackground.isPending,
    isDeletingBackground: deleteDigestBackground.isPending,
    isSendingDigestNow: sendDigestNow.isPending,
    onToggleOneHourReminder: handleToggleBotOneHourReminderRealtime,
    onTogglePenaltyEnabled: handleTogglePenaltyEnabledRealtime,
    onAttendanceReminderLeadMinutesChange: setAttendanceReminderLeadMinutesInput,
    onAttendanceResponseTimeoutMinutesChange:
      setAttendanceResponseTimeoutMinutesInput,
    onCancellationLockHoursChange: setCancellationLockHoursInput,
    onTrustedClientConfirmationCountChange:
      setTrustedClientConfirmationCountInput,
    onPenaltyLimitChange: setPenaltyLimitInput,
    onToggleDailyAvailabilityDigest: handleToggleDailyAvailabilityDigestFromBot,
    onDailyAvailabilityDigestHourChange:
      whatsapp.setDailyAvailabilityDigestHourInput,
    onToggleDailyAvailabilityDigestNextDay:
      handleToggleDailyAvailabilityDigestNextDayFromBot,
    onDailyAvailabilityDigestFormatChange:
      whatsapp.setDailyAvailabilityDigestFormatInput,
    onSaveReminderMinutes: handleSaveReminderMinutes,
    onSaveAttendanceResponseTimeoutMinutes:
      handleSaveAttendanceResponseTimeoutMinutes,
    onSaveCancellationLockHours: handleSaveCancellationLockHours,
    onSaveTrustedCount: handleSaveTrustedConfirmationCount,
    onSavePenaltyLimit: handleSavePenaltyLimit,
    onSaveDailyAvailabilityDigestSettings:
      handleSaveDailyAvailabilityDigestSchedule,
    onUploadBackground: (file: File, order: number) =>
      uploadDigestBackground.mutate({ file, order }, {
        onSuccess: () => addToast({ title: "Imagen guardada", color: "success" }),
        onError: () => addToast({ title: "Error al subir la imagen", color: "danger" }),
      }),
    onDeleteBackground: (id: string) => deleteDigestBackground.mutate(id, {
      onSuccess: () => addToast({ title: "Imagen eliminada", color: "success" }),
      onError: () => addToast({ title: "Error al eliminar la imagen", color: "danger" }),
    }),
    onSendDigestNow: () =>
      sendDigestNow.mutate(undefined, {
        onSuccess: () =>
          addToast({ title: "Digest en cola — se enviará en segundos", color: "success" }),
        onError: (err: any) =>
          addToast({ title: err?.response?.data?.error || "Error al enviar el digest", color: "danger" }),
      }),
  };
};
