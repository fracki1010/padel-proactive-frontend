import { addToast } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
  useWhatsappStatus,
  useUpdateWhatsappStatus,
  useCloseWhatsappSession,
  useResetWhatsappSession,
  useWhatsappCancellationGroupSettings,
  useUpdateWhatsappCancellationGroupSettings,
  useWhatsappGroups,
  useBotAutomationSettings,
} from "../../../hooks/useData";
import { useConfirm } from "../../../hooks/useConfirm";
import { configService } from "../../../services/api";

const WHATSAPP_GROUP_ID_REGEX = /^[A-Za-z0-9._:-]{6,80}@g\.us$/;

export const WHATSAPP_STATUS_LABEL_BY_KEY: Record<string, string> = {
  disabled: "Desactivado",
  ready: "Conectado",
  authenticated: "Autenticado",
  qr_pending: "Esperando escaneo",
  loading: "Iniciando",
  auth_failure: "Error de autenticación",
  initializing: "Inicializando",
  logged_out: "Sesión cerrada",
  locked_elsewhere: "Bloqueado por otra instancia",
  disconnected: "Desconectado",
  connection_closed: "Conexión cerrada",
  unpaired: "Desvinculado",
};

export const useWhatsappManagement = () => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const { data: whatsappData, isLoading: isLoadingWhatsapp } = useWhatsappStatus();
  const { data: whatsappCancellationGroupSettingsData } =
    useWhatsappCancellationGroupSettings();
  const {
    data: whatsappGroupsData,
    isLoading: isLoadingWhatsappGroups,
    refetch: refetchWhatsappGroups,
  } = useWhatsappGroups();
  const { data: botAutomationSettingsData } = useBotAutomationSettings();

  const updateWhatsappStatus = useUpdateWhatsappStatus();
  const closeWhatsappSession = useCloseWhatsappSession();
  const resetWhatsappSession = useResetWhatsappSession();
  const updateWhatsappCancellationGroupSettings =
    useUpdateWhatsappCancellationGroupSettings();

  const [cancellationGroupIdInput, setCancellationGroupIdInput] = useState("");
  const [cancellationGroupNameInput, setCancellationGroupNameInput] = useState("");
  const [dailyAvailabilityDigestEnabledInput, setDailyAvailabilityDigestEnabledInput] =
    useState(false);
  const [dailyAvailabilityDigestHourInput, setDailyAvailabilityDigestHourInput] =
    useState("09:00");
  const [
    dailyAvailabilityDigestNextDayEnabledInput,
    setDailyAvailabilityDigestNextDayEnabledInput,
  ] = useState(false);
  const [dailyAvailabilityDigestFormatInput, setDailyAvailabilityDigestFormatInput] =
    useState<"text" | "image">("text");
  const [isEditingCancellationGroupId, setIsEditingCancellationGroupId] =
    useState(false);
  const [isEditingCancellationGroupName, setIsEditingCancellationGroupName] =
    useState(false);
  const [isSavingDailyAvailabilityDigestSettings, setIsSavingDailyAvailabilityDigestSettings] =
    useState(false);
  const [isWaitingWhatsappCommand, setIsWaitingWhatsappCommand] = useState(false);

  // --- Derived whatsapp state ---
  const whatsappRawState = whatsappData?.data ?? {};
  const whatsappState =
    whatsappRawState && typeof whatsappRawState === "object"
      ? whatsappRawState
      : {};
  const whatsappEnabled = Boolean(whatsappState?.enabled);
  const whatsappStatusRaw = String(whatsappState?.status || "").toLowerCase();
  const disconnectedWhatsappStatuses = new Set([
    "auth_failure",
    "logged_out",
    "disconnected",
    "connection_closed",
    "unpaired",
  ]);
  const whatsappStatus = !whatsappEnabled
    ? "disabled"
    : whatsappStatusRaw === "locked_elsewhere"
      ? "locked_elsewhere"
      : disconnectedWhatsappStatuses.has(whatsappStatusRaw)
        ? "logged_out"
        : whatsappStatusRaw || "initializing";
  const whatsappQr =
    typeof whatsappState?.qr === "string" && whatsappState.qr.trim().length > 0
      ? whatsappState.qr
      : "";
  const workerOnline = Boolean(whatsappState?.workerOnline);
  const workerHeartbeatAt =
    typeof whatsappState?.workerHeartbeatAt === "string" &&
    whatsappState.workerHeartbeatAt.trim().length > 0
      ? whatsappState.workerHeartbeatAt
      : null;

  const whatsappChipColor: "default" | "success" | "danger" | "warning" =
    whatsappStatus === "locked_elsewhere"
      ? "danger"
      : whatsappStatus === "logged_out" || whatsappStatus === "auth_failure"
        ? "warning"
        : !whatsappEnabled
          ? "default"
          : whatsappStatus === "ready"
            ? "success"
            : "warning";

  // --- Derived cancellation group settings ---
  const waCgsRaw = whatsappCancellationGroupSettingsData?.data ?? {};

  const whatsappCancellationGroupEnabled = Boolean(
    [
      waCgsRaw?.enabled,
      waCgsRaw?.cancellationGroupEnabled,
      waCgsRaw?.cancelationGroupEnabled,
      whatsappState?.cancellationGroupEnabled,
      whatsappState?.cancelationGroupEnabled,
      whatsappState?.groupCancellationAlertsEnabled,
      whatsappState?.cancelledBookingGroupEnabled,
    ].find((c) => typeof c === "boolean"),
  );
  const whatsappCancellationGroupId =
    (([
      waCgsRaw?.groupId,
      waCgsRaw?.cancellationGroupId,
      waCgsRaw?.cancelationGroupId,
      whatsappState?.cancellationGroupId,
      whatsappState?.cancelationGroupId,
      whatsappState?.groupCancellationAlertsId,
      whatsappState?.cancelledBookingGroupId,
    ].find((c) => typeof c === "string") as string | undefined) || "");
  const whatsappCancellationGroupName =
    (([
      waCgsRaw?.groupName,
      waCgsRaw?.cancellationGroupName,
      waCgsRaw?.cancelationGroupName,
      whatsappState?.groupName,
      whatsappState?.cancellationGroupName,
      whatsappState?.cancelationGroupName,
      whatsappState?.groupCancellationAlertsName,
      whatsappState?.cancelledBookingGroupName,
    ].find((c) => typeof c === "string") as string | undefined) || "");

  const whatsappDailyAvailabilityDigestEnabled = Boolean(
    [
      waCgsRaw?.dailyAvailabilityDigestEnabled,
      botAutomationSettingsData?.data?.dailyAvailabilityDigestEnabled,
      botAutomationSettingsData?.data?.dailyGroupAvailabilityEnabled,
      botAutomationSettingsData?.data?.groupDailyAvailabilityDigestEnabled,
      whatsappState?.dailyAvailabilityDigestEnabled,
      whatsappState?.dailyGroupAvailabilityEnabled,
      whatsappState?.groupDailyAvailabilityDigestEnabled,
    ].find((c) => typeof c === "boolean"),
  );
  const whatsappDailyAvailabilityDigestHour =
    ([
      waCgsRaw?.dailyAvailabilityDigestHour,
      waCgsRaw?.dailyGroupAvailabilityHour,
      waCgsRaw?.groupDailyAvailabilityDigestHour,
      botAutomationSettingsData?.data?.dailyAvailabilityDigestHour,
      botAutomationSettingsData?.data?.dailyGroupAvailabilityHour,
      botAutomationSettingsData?.data?.groupDailyAvailabilityDigestHour,
      whatsappState?.dailyAvailabilityDigestHour,
      whatsappState?.dailyGroupAvailabilityHour,
      whatsappState?.groupDailyAvailabilityDigestHour,
    ].find(
      (c) =>
        typeof c === "string" &&
        /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(c),
    ) as string | undefined) || "09:00";
  const whatsappDailyAvailabilityDigestNextDayEnabled = Boolean(
    [
      waCgsRaw?.dailyAvailabilityDigestNextDayEnabled,
      waCgsRaw?.dailyNextDayAvailabilityEnabled,
      waCgsRaw?.groupDailyAvailabilityNextDayEnabled,
      botAutomationSettingsData?.data?.dailyAvailabilityDigestNextDayEnabled,
      botAutomationSettingsData?.data?.dailyNextDayAvailabilityEnabled,
      botAutomationSettingsData?.data?.groupDailyAvailabilityNextDayEnabled,
      whatsappState?.dailyAvailabilityDigestNextDayEnabled,
      whatsappState?.dailyNextDayAvailabilityEnabled,
      whatsappState?.groupDailyAvailabilityNextDayEnabled,
    ].find((c) => typeof c === "boolean"),
  );
  const whatsappDailyAvailabilityDigestFormat: "text" | "image" =
    waCgsRaw?.dailyAvailabilityDigestFormat === "image"
      ? "image"
      : "text";

  const whatsappGroups = Array.isArray(whatsappGroupsData?.data)
    ? whatsappGroupsData.data
        .map((group: any) => ({
          id: String(group?.id || "").trim(),
          name: String(group?.name || group?.subject || group?.title || "").trim(),
        }))
        .filter((group: { id: string }) => group.id.endsWith("@g.us"))
    : [];

  // --- Sync effects ---
  useEffect(() => {
    if (isEditingCancellationGroupId) return;
    setCancellationGroupIdInput(whatsappCancellationGroupId);
  }, [whatsappCancellationGroupId, isEditingCancellationGroupId]);

  useEffect(() => {
    if (isEditingCancellationGroupName) return;
    setCancellationGroupNameInput(whatsappCancellationGroupName);
  }, [whatsappCancellationGroupName, isEditingCancellationGroupName]);

  useEffect(() => {
    setDailyAvailabilityDigestEnabledInput(whatsappDailyAvailabilityDigestEnabled);
  }, [whatsappDailyAvailabilityDigestEnabled]);

  useEffect(() => {
    setDailyAvailabilityDigestHourInput(whatsappDailyAvailabilityDigestHour);
  }, [whatsappDailyAvailabilityDigestHour]);

  useEffect(() => {
    setDailyAvailabilityDigestNextDayEnabledInput(
      whatsappDailyAvailabilityDigestNextDayEnabled,
    );
  }, [whatsappDailyAvailabilityDigestNextDayEnabled]);

  useEffect(() => {
    setDailyAvailabilityDigestFormatInput(whatsappDailyAvailabilityDigestFormat);
  }, [whatsappDailyAvailabilityDigestFormat]);

  // --- Helpers ---
  const ensureWhatsappWorkerOnline = (): boolean => {
    if (isLoadingWhatsapp) return true;
    if (workerOnline) return true;
    addToast({
      title: "Worker de WhatsApp offline",
      description: workerHeartbeatAt
        ? `Último heartbeat: ${new Date(workerHeartbeatAt).toLocaleString()}`
        : "Iniciá el servicio padel-proactive-wa-worker para aplicar acciones de WhatsApp.",
      color: "danger",
    });
    return false;
  };

  const persistWhatsappCancellationGroupSettings = async (
    nextEnabled: boolean,
    nextGroupIdRaw: string,
    nextGroupNameRaw: string,
    nextDailyAvailabilityDigestEnabled: boolean,
    nextDailyAvailabilityDigestHourRaw: string,
    nextDailyAvailabilityDigestNextDayEnabled: boolean,
    nextDailyAvailabilityDigestFormat: "text" | "image" = "text",
  ) => {
    const nextGroupId = nextGroupIdRaw.trim();
    const nextGroupName = nextGroupNameRaw.trim();
    const nextDailyAvailabilityDigestHour = nextDailyAvailabilityDigestHourRaw.trim();
    if (nextEnabled && !nextGroupId) {
      addToast({ title: "Seleccioná un grupo antes de activar avisos de cancelación", color: "warning" });
      return;
    }
    if (nextEnabled && !WHATSAPP_GROUP_ID_REGEX.test(nextGroupId)) {
      addToast({ title: "ID de grupo inválido. Debe terminar en @g.us.", color: "danger" });
      return;
    }
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(nextDailyAvailabilityDigestHour)) {
      addToast({ title: "Ingresá una hora válida en formato HH:mm.", color: "warning" });
      return;
    }

    try {
      setIsSavingDailyAvailabilityDigestSettings(true);
      const response = await updateWhatsappCancellationGroupSettings.mutateAsync({
        enabled: nextEnabled,
        groupId: nextGroupId,
        groupName: nextGroupName,
        dailyAvailabilityDigestEnabled: nextDailyAvailabilityDigestEnabled,
        dailyAvailabilityDigestHour: nextDailyAvailabilityDigestHour,
        dailyAvailabilityDigestNextDayEnabled: nextDailyAvailabilityDigestNextDayEnabled,
        dailyAvailabilityDigestFormat: nextDailyAvailabilityDigestFormat,
      });
      setCancellationGroupIdInput(nextGroupId);
      setCancellationGroupNameInput(nextGroupName);
      setDailyAvailabilityDigestEnabledInput(nextDailyAvailabilityDigestEnabled);
      setDailyAvailabilityDigestHourInput(nextDailyAvailabilityDigestHour);
      setDailyAvailabilityDigestNextDayEnabledInput(nextDailyAvailabilityDigestNextDayEnabled);
      setDailyAvailabilityDigestFormatInput(nextDailyAvailabilityDigestFormat);
      setIsEditingCancellationGroupId(false);
      setIsEditingCancellationGroupName(false);
      const persistedLocally = Boolean(response?.data?.persistedLocally);
      addToast({
        title: persistedLocally
          ? "Guardado solo localmente (sin persistir en backend)"
          : nextEnabled
            ? "Avisos de cancelación al grupo activados"
            : "Avisos de cancelación al grupo desactivados",
        description: persistedLocally
          ? "El backend no aceptó esta configuración. Los cambios pueden perderse al recargar."
          : undefined,
        color: persistedLocally ? "warning" : "success",
      });
    } catch (err: any) {
      addToast({
        title: err?.response?.data?.error || "No se pudo actualizar el grupo de avisos de cancelación",
        color: "danger",
      });
    } finally {
      setIsSavingDailyAvailabilityDigestSettings(false);
    }
  };

  const waitForWhatsappCommand = async (
    commandId: string,
    successTitle: string,
  ): Promise<void> => {
    const normalizedId = String(commandId || "").trim();
    if (!normalizedId) return;

    setIsWaitingWhatsappCommand(true);
    const maxAttempts = 45;
    const delayMs = 2000;

    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const response = await configService.getWhatsappCommandStatus(normalizedId);
        const status = String(response?.data?.status || "").toLowerCase();
        const errorMessage = String(response?.data?.lastError || "").trim();

        if (status === "done") {
          queryClient.invalidateQueries({ queryKey: ["whatsapp-status"] });
          addToast({ title: successTitle, color: "success" });
          return;
        }

        if (status === "failed") {
          queryClient.invalidateQueries({ queryKey: ["whatsapp-status"] });
          throw new Error(errorMessage || "El comando de WhatsApp falló.");
        }

        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      addToast({
        title: "WhatsApp sigue procesando el cambio",
        description: "Podés esperar unos segundos más y volver a intentar.",
        color: "warning",
      });
    } finally {
      setIsWaitingWhatsappCommand(false);
    }
  };

  // --- Handlers ---
  const handleToggleWhatsapp = (enabled: boolean) => {
    if (!ensureWhatsappWorkerOnline()) return;

    updateWhatsappStatus.mutate(enabled, {
      onSuccess: async (response: any) => {
        const commandId = String(response?.data?.commandId || "").trim();
        if (commandId) {
          addToast({
            title: "Comando enviado",
            description: "Aplicando cambios de WhatsApp...",
            color: "default",
          });
          try {
            await waitForWhatsappCommand(
              commandId,
              enabled ? "WhatsApp activado" : "WhatsApp desactivado",
            );
          } catch (error: any) {
            addToast({
              title:
                error?.message || "No se pudo completar el cambio de WhatsApp",
              color: "danger",
            });
          }
          return;
        }

        addToast({
          title: enabled ? "WhatsApp activado" : "WhatsApp desactivado",
          color: "success",
        });
      },
      onError: (err: any) => {
        addToast({
          title: err?.response?.data?.error || "No se pudo actualizar WhatsApp",
          color: "danger",
        });
      },
    });
  };

  const handleCloseWhatsappSession = async () => {
    if (!ensureWhatsappWorkerOnline()) return;

    const shouldClose = await confirm(
      "¿Seguro que querés cerrar la sesión de WhatsApp y dar de baja todas las sesiones/dispositivos activos?",
      { variant: "danger", title: "Cerrar sesión de WhatsApp" },
    );
    if (!shouldClose) return;

    try {
      const response = await closeWhatsappSession.mutateAsync();
      const commandId = String(response?.data?.commandId || "").trim();

      if (!commandId) {
        addToast({
          title: "Sesión de WhatsApp cerrada y dada de baja",
          color: "success",
        });
        return;
      }

      addToast({
        title: "Comando enviado",
        description: "Cerrando sesión de WhatsApp...",
        color: "default",
      });

      await waitForWhatsappCommand(commandId, "Sesión de WhatsApp cerrada y dada de baja");
    } catch (err: any) {
      addToast({
        title:
          err?.response?.data?.error ||
          err?.message ||
          "No se pudo cerrar la sesión de WhatsApp",
        color: "danger",
      });
    }
  };

  const handleSwitchWhatsappDevice = async () => {
    if (!ensureWhatsappWorkerOnline()) return;

    const shouldSwitch = await confirm(
      "¿Querés cambiar de dispositivo? Se va a cerrar la sesión actual y se regenerará un QR nuevo.",
      { variant: "danger", title: "Cambiar dispositivo" },
    );
    if (!shouldSwitch) return;

    try {
      const closeResponse = await closeWhatsappSession.mutateAsync();
      const closeCommandId = String(closeResponse?.data?.commandId || "").trim();

      if (closeCommandId) {
        await waitForWhatsappCommand(closeCommandId, "Sesión anterior cerrada");
      }

      const enableResponse = await updateWhatsappStatus.mutateAsync(true);
      const enableCommandId = String(enableResponse?.data?.commandId || "").trim();
      if (!enableCommandId) {
        addToast({
          title: "Listo: escaneá el nuevo QR para vincular otro dispositivo",
          color: "success",
        });
        return;
      }

      await waitForWhatsappCommand(
        enableCommandId,
        "Listo: escaneá el nuevo QR para vincular otro dispositivo",
      );
    } catch (err: any) {
      addToast({
        title:
          err?.response?.data?.error ||
          err?.message ||
          "No se pudo cambiar el dispositivo de WhatsApp",
        color: "danger",
      });
    }
  };

  const handleResetWhatsappSession = async () => {
    if (!ensureWhatsappWorkerOnline()) return;

    const shouldReset = await confirm(
      "¿Querés cerrar la sesión actual y generar un QR nuevo? Se eliminarán los datos de sesión guardados.",
      { variant: "danger", title: "Reiniciar sesión" },
    );
    if (!shouldReset) return;

    try {
      addToast({
        title: "Reiniciando sesión de WhatsApp...",
        description: "Esto puede tardar unos segundos.",
        color: "default",
      });

      const response = await resetWhatsappSession.mutateAsync();
      const commandId = String(response?.data?.commandId || "").trim();

      if (!commandId) {
        addToast({ title: "Sesión reiniciada. Esperá el nuevo QR.", color: "success" });
        return;
      }

      await waitForWhatsappCommand(
        commandId,
        "Sesión reiniciada",
      );
    } catch (err: any) {
      addToast({
        title:
          err?.response?.data?.error ||
          err?.message ||
          "No se pudo reiniciar la sesión de WhatsApp",
        color: "danger",
      });
    }
  };

  const handleToggleCancellationGroup = (enabled: boolean) => {
    persistWhatsappCancellationGroupSettings(
      enabled,
      cancellationGroupIdInput,
      cancellationGroupNameInput,
      dailyAvailabilityDigestEnabledInput,
      dailyAvailabilityDigestHourInput,
      dailyAvailabilityDigestNextDayEnabledInput,
      dailyAvailabilityDigestFormatInput,
    );
  };

  const handleSelectWhatsappGroup = (groupId: string) => {
    const selected = whatsappGroups.find((group: any) => group.id === groupId);
    if (!selected) return;
    if (!WHATSAPP_GROUP_ID_REGEX.test(selected.id)) {
      addToast({
        title: "Grupo inválido recibido desde backend.",
        color: "danger",
      });
      return;
    }

    setCancellationGroupIdInput(selected.id);
    setCancellationGroupNameInput(selected.name || "");
    setIsEditingCancellationGroupId(false);
    setIsEditingCancellationGroupName(false);
    persistWhatsappCancellationGroupSettings(
      whatsappCancellationGroupEnabled,
      selected.id,
      selected.name || "",
      dailyAvailabilityDigestEnabledInput,
      dailyAvailabilityDigestHourInput,
      dailyAvailabilityDigestNextDayEnabledInput,
      dailyAvailabilityDigestFormatInput,
    );
  };

  return {
    whatsappEnabled,
    whatsappStatus,
    whatsappQr,
    whatsappState,
    workerOnline,
    workerHeartbeatAt,
    isLoadingWhatsapp,
    updateWhatsappPending:
      updateWhatsappStatus.isPending ||
      closeWhatsappSession.isPending ||
      resetWhatsappSession.isPending ||
      isWaitingWhatsappCommand,
    whatsappChipColor,
    whatsappStatusLabelByKey: WHATSAPP_STATUS_LABEL_BY_KEY,
    cancellationGroupEnabled: whatsappCancellationGroupEnabled,
    cancellationGroupIdInput,
    cancellationGroupNameInput,
    whatsappGroups,
    isLoadingWhatsappGroups,
    updateCancellationGroupPending:
      updateWhatsappCancellationGroupSettings.isPending,
    isSavingDailyAvailabilityDigestSettings,
    dailyAvailabilityDigestEnabledInput,
    dailyAvailabilityDigestHourInput,
    dailyAvailabilityDigestNextDayEnabledInput,
    dailyAvailabilityDigestFormatInput,
    handleToggleWhatsapp,
    handleCloseWhatsappSession,
    handleSwitchWhatsappDevice,
    handleResetWhatsappSession,
    handleToggleCancellationGroup,
    handleSelectWhatsappGroup,
    persistWhatsappCancellationGroupSettings,
    refetchWhatsappGroups,
    whatsappEnabledForEffect: whatsappEnabled,
    workerOnlineForEffect: workerOnline,
    setDailyAvailabilityDigestEnabledInput,
    setDailyAvailabilityDigestHourInput,
    setDailyAvailabilityDigestNextDayEnabledInput,
    setDailyAvailabilityDigestFormatInput,
    setCancellationGroupIdInput,
    setCancellationGroupNameInput,
  };
};
