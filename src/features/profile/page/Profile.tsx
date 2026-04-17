import { addToast } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
  useCourts,
  useCreateCourt,
  useDeleteCourt,
  useUpdateCourt,
  useSlots,
  useCreateSlot,
  useUpdateSlot,
  useUpdateProfile,
  useUpdateOwnCompany,
  useWhatsappStatus,
  useUpdateBasePrice,
  useBotAutomationSettings,
  useUpdateBotAutomationSettings,
  useUpdateWhatsappStatus,
  useCloseWhatsappSession,
  useWhatsappCancellationGroupSettings,
  useUpdateWhatsappCancellationGroupSettings,
  useWhatsappGroups,
  useCompanies,
  useCreateCompany,
  useUpdateCompanyStatus,
  useUpdateCompany,
  useAdmins,
  useCreateAdmin,
  useUpdateAdminStatus,
  useBootstrapDefaultTenant,
} from "../../../hooks/useData";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import { configService } from "../../../services/api";
import { CourtsView } from "../components/CourtsView";
import { BotAutomationSettingsView } from "../components/BotAutomationSettingsView";
import { ProfileMenuView } from "../components/ProfileMenuView";
import { ScheduleSettingsView } from "../components/ScheduleSettingsView";
import { TenantsView } from "../components/TenantsView";
import { WhatsappSettingsView } from "../components/WhatsappSettingsView";

interface ProfileProps {
  courts: any[];
}

export const Profile = ({ courts: initialCourts }: ProfileProps) => {
  const queryClient = useQueryClient();
  const { logout, user, updateUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [view, setView] = useState<
    "menu" | "courts" | "schedule" | "whatsapp" | "bot-automation" | "tenants"
  >("menu");
  const isSuperAdmin = user?.role === "super_admin";
  const canManageClubData = isSuperAdmin || Boolean(user?.companyId);

  const { data: courtsData } = useCourts(true);
  const { data: slotsData } = useSlots(true);
  const { data: whatsappData, isLoading: isLoadingWhatsapp } = useWhatsappStatus();
  const { data: whatsappCancellationGroupSettingsData } =
    useWhatsappCancellationGroupSettings();
  const {
    data: whatsappGroupsData,
    isLoading: isLoadingWhatsappGroups,
    refetch: refetchWhatsappGroups,
  } = useWhatsappGroups();
  const { data: botAutomationSettingsData } = useBotAutomationSettings();
  const { data: companiesData } = useCompanies(isSuperAdmin);
  const { data: adminsData } = useAdmins(isSuperAdmin);

  const updateCourt = useUpdateCourt();
  const createCourt = useCreateCourt();
  const deleteCourt = useDeleteCourt();
  const updateSlot = useUpdateSlot();
  const createSlot = useCreateSlot();
  const updateBasePrice = useUpdateBasePrice();
  const updateBotAutomationSettings = useUpdateBotAutomationSettings();
  const updateProfile = useUpdateProfile();
  const updateOwnCompany = useUpdateOwnCompany();
  const updateWhatsappStatus = useUpdateWhatsappStatus();
  const closeWhatsappSession = useCloseWhatsappSession();
  const updateWhatsappCancellationGroupSettings =
    useUpdateWhatsappCancellationGroupSettings();
  const createCompany = useCreateCompany();
  const updateCompanyStatus = useUpdateCompanyStatus();
  const updateCompany = useUpdateCompany();
  const createAdmin = useCreateAdmin();
  const updateAdminStatus = useUpdateAdminStatus();
  const bootstrapTenant = useBootstrapDefaultTenant();

  const courts = courtsData?.data || initialCourts;
  const slots = slotsData?.data || [];
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
  const whatsappCancellationGroupSettingsRaw =
    whatsappCancellationGroupSettingsData?.data ?? {};
  const cancellationGroupEnabledCandidates = [
    whatsappCancellationGroupSettingsRaw?.enabled,
    whatsappCancellationGroupSettingsRaw?.cancellationGroupEnabled,
    whatsappCancellationGroupSettingsRaw?.cancelationGroupEnabled,
    whatsappState?.cancellationGroupEnabled,
    whatsappState?.cancelationGroupEnabled,
    whatsappState?.groupCancellationAlertsEnabled,
    whatsappState?.cancelledBookingGroupEnabled,
  ];
  const cancellationGroupIdCandidates = [
    whatsappCancellationGroupSettingsRaw?.groupId,
    whatsappCancellationGroupSettingsRaw?.cancellationGroupId,
    whatsappCancellationGroupSettingsRaw?.cancelationGroupId,
    whatsappState?.cancellationGroupId,
    whatsappState?.cancelationGroupId,
    whatsappState?.groupCancellationAlertsId,
    whatsappState?.cancelledBookingGroupId,
  ];
  const cancellationGroupNameCandidates = [
    whatsappCancellationGroupSettingsRaw?.groupName,
    whatsappCancellationGroupSettingsRaw?.cancellationGroupName,
    whatsappCancellationGroupSettingsRaw?.cancelationGroupName,
    whatsappState?.groupName,
    whatsappState?.cancellationGroupName,
    whatsappState?.cancelationGroupName,
    whatsappState?.groupCancellationAlertsName,
    whatsappState?.cancelledBookingGroupName,
  ];
  const dailyAvailabilityDigestEnabledCandidates = [
    whatsappCancellationGroupSettingsRaw?.dailyAvailabilityDigestEnabled,
    botAutomationSettingsData?.data?.dailyAvailabilityDigestEnabled,
    botAutomationSettingsData?.data?.dailyGroupAvailabilityEnabled,
    botAutomationSettingsData?.data?.groupDailyAvailabilityDigestEnabled,
    whatsappState?.dailyAvailabilityDigestEnabled,
    whatsappState?.dailyGroupAvailabilityEnabled,
    whatsappState?.groupDailyAvailabilityDigestEnabled,
  ];
  const dailyAvailabilityDigestHourCandidates = [
    whatsappCancellationGroupSettingsRaw?.dailyAvailabilityDigestHour,
    whatsappCancellationGroupSettingsRaw?.dailyGroupAvailabilityHour,
    whatsappCancellationGroupSettingsRaw?.groupDailyAvailabilityDigestHour,
    botAutomationSettingsData?.data?.dailyAvailabilityDigestHour,
    botAutomationSettingsData?.data?.dailyGroupAvailabilityHour,
    botAutomationSettingsData?.data?.groupDailyAvailabilityDigestHour,
    whatsappState?.dailyAvailabilityDigestHour,
    whatsappState?.dailyGroupAvailabilityHour,
    whatsappState?.groupDailyAvailabilityDigestHour,
  ];
  const dailyAvailabilityDigestNextDayCandidates = [
    whatsappCancellationGroupSettingsRaw?.dailyAvailabilityDigestNextDayEnabled,
    whatsappCancellationGroupSettingsRaw?.dailyNextDayAvailabilityEnabled,
    whatsappCancellationGroupSettingsRaw?.groupDailyAvailabilityNextDayEnabled,
    botAutomationSettingsData?.data?.dailyAvailabilityDigestNextDayEnabled,
    botAutomationSettingsData?.data?.dailyNextDayAvailabilityEnabled,
    botAutomationSettingsData?.data?.groupDailyAvailabilityNextDayEnabled,
    whatsappState?.dailyAvailabilityDigestNextDayEnabled,
    whatsappState?.dailyNextDayAvailabilityEnabled,
    whatsappState?.groupDailyAvailabilityNextDayEnabled,
  ];
  const whatsappCancellationGroupEnabled = Boolean(
    cancellationGroupEnabledCandidates.find((candidate) => typeof candidate === "boolean"),
  );
  const whatsappCancellationGroupId =
    (cancellationGroupIdCandidates.find((candidate) => typeof candidate === "string") as
      | string
      | undefined) || "";
  const whatsappCancellationGroupName =
    (cancellationGroupNameCandidates.find((candidate) => typeof candidate === "string") as
      | string
      | undefined) || "";
  const whatsappDailyAvailabilityDigestEnabled = Boolean(
    dailyAvailabilityDigestEnabledCandidates.find(
      (candidate) => typeof candidate === "boolean",
    ),
  );
  const whatsappDailyAvailabilityDigestHour =
    (dailyAvailabilityDigestHourCandidates.find(
      (candidate) =>
        typeof candidate === "string" &&
        /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(candidate),
    ) as string | undefined) || "09:00";
  const whatsappDailyAvailabilityDigestNextDayEnabled = Boolean(
    dailyAvailabilityDigestNextDayCandidates.find(
      (candidate) => typeof candidate === "boolean",
    ),
  );
  const whatsappGroups = Array.isArray(whatsappGroupsData?.data)
    ? whatsappGroupsData.data
        .map((group: any) => ({
          id: String(group?.id || "").trim(),
          name: String(group?.name || group?.subject || group?.title || "").trim(),
        }))
        .filter((group: { id: string }) => group.id.endsWith("@g.us"))
    : [];
  const userCompany =
    user?.companyId && typeof user.companyId === "object"
      ? {
          _id: user.companyId._id,
          name: user.companyId.name || "",
          slug: user.companyId.slug || "",
          address: user.companyId.address || "",
          isActive:
            typeof user.companyId.isActive === "boolean"
              ? user.companyId.isActive
              : true,
        }
      : null;
  const companies = isSuperAdmin
    ? companiesData?.data || []
    : userCompany?._id
      ? [userCompany]
      : [];
  const admins = adminsData?.data || [];
  const botAutomationSettings = botAutomationSettingsData?.data || {};

  const [phoneNumber, setPhoneNumber] = useState("");
  const [basePriceInput, setBasePriceInput] = useState("");
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
  const [companyNameInput, setCompanyNameInput] = useState("");
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminPhone, setNewAdminPhone] = useState("");
  const [newAdminCompanyId, setNewAdminCompanyId] = useState("");
  const [newCourtName, setNewCourtName] = useState("");
  const [newSlotStartTime, setNewSlotStartTime] = useState("");
  const [newSlotEndTime, setNewSlotEndTime] = useState("");
  const [newSlotPrice, setNewSlotPrice] = useState("");
  const [slotTogglePendingId, setSlotTogglePendingId] = useState<string | null>(null);
  const [deleteCourtPendingId, setDeleteCourtPendingId] = useState<string | null>(null);
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
  const [isEditingCancellationGroupId, setIsEditingCancellationGroupId] =
    useState(false);
  const [isEditingCancellationGroupName, setIsEditingCancellationGroupName] =
    useState(false);
  const [isSavingReminderToggle, setIsSavingReminderToggle] = useState(false);
  const [isSavingPenaltyToggle, setIsSavingPenaltyToggle] = useState(false);
  const [isSavingReminderMinutes, setIsSavingReminderMinutes] = useState(false);
  const [isSavingResponseTimeoutMinutes, setIsSavingResponseTimeoutMinutes] =
    useState(false);
  const [isSavingCancellationLockHours, setIsSavingCancellationLockHours] =
    useState(false);
  const [isSavingTrustedCount, setIsSavingTrustedCount] = useState(false);
  const [isSavingPenaltyLimit, setIsSavingPenaltyLimit] = useState(false);
  const [isSavingDailyAvailabilityDigestSettings, setIsSavingDailyAvailabilityDigestSettings] =
    useState(false);
  const [isWaitingWhatsappCommand, setIsWaitingWhatsappCommand] = useState(false);

  useEffect(() => {
    if (user?.phone) {
      setPhoneNumber(user.phone);
    }
  }, [user]);

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
    const fromBotConfig = botAutomationSettings?.oneHourReminderEnabled;
    if (typeof fromBotConfig === "boolean") {
      setBotOneHourReminderEnabledInput(fromBotConfig);
      return;
    }
    setBotOneHourReminderEnabledInput(true);
  }, [botAutomationSettings]);

  useEffect(() => {
    if (!slots.length) return;

    const firstPrice = slots[0]?.price;
    if (typeof firstPrice !== "number") return;

    const allSame = slots.every((slot: any) => Number(slot.price) === Number(firstPrice));
    if (allSame) {
      setBasePriceInput(String(firstPrice));
      return;
    }

    setBasePriceInput("");
  }, [slots]);

  useEffect(() => {
    const profileScrollContainer = document.getElementById("profile-drawer-body");
    profileScrollContainer?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [view]);

  useEffect(() => {
    if (view !== "whatsapp") return;

    void refetchWhatsappGroups();

    if (!whatsappEnabled || !workerOnline) return;
    const retryTimer = window.setTimeout(() => {
      void refetchWhatsappGroups();
    }, 3500);

    return () => window.clearTimeout(retryTimer);
  }, [view, whatsappEnabled, workerOnline, refetchWhatsappGroups]);

  useEffect(() => {
    if (!newAdminCompanyId && companies.length > 0) {
      setNewAdminCompanyId(companies[0]._id);
    }
  }, [companies, newAdminCompanyId]);

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

  const whatsappStatusLabelByKey: Record<string, string> = {
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

  const whatsappChipColor =
    whatsappStatus === "locked_elsewhere"
      ? "danger"
      : whatsappStatus === "logged_out" || whatsappStatus === "auth_failure"
        ? "warning"
      : !whatsappEnabled
        ? "default"
        : whatsappStatus === "ready"
          ? "success"
          : "warning";

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

  const handleUpdatePhone = () => {
    updateProfile.mutate(
      { phone: phoneNumber },
      {
        onSuccess: (response) => {
          updateUser(response.data);
        },
      },
    );
  };

  const handleSaveBasePrice = () => {
    const parsed = Number(basePriceInput);
    if (!Number.isFinite(parsed) || parsed < 0) {
      addToast({
        title: "Ingresá un precio válido (mayor o igual a 0).",
        color: "danger",
      });
      return;
    }

    updateBasePrice.mutate(parsed, {
      onSuccess: () => {
        addToast({ title: "Precio base actualizado en todos los turnos", color: "success" });
      },
      onError: (err: any) => {
        addToast({
          title: err?.response?.data?.error || "No se pudo actualizar el precio base",
          color: "danger",
        });
      },
    });
  };

  const handleToggleWhatsapp = (enabled: boolean) => {
    if (!ensureWhatsappWorkerOnline()) return;

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

    const shouldClose = window.confirm(
      "¿Seguro que querés cerrar la sesión de WhatsApp y dar de baja todas las sesiones/dispositivos activos?",
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

      setIsWaitingWhatsappCommand(true);
      try {
        const maxAttempts = 45;
        const delayMs = 2000;
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          const statusResponse = await configService.getWhatsappCommandStatus(commandId);
          const status = String(statusResponse?.data?.status || "").toLowerCase();
          const errorMessage = String(statusResponse?.data?.lastError || "").trim();

          if (status === "done") {
            queryClient.invalidateQueries({ queryKey: ["whatsapp-status"] });
            addToast({
              title: "Sesión de WhatsApp cerrada y dada de baja",
              color: "success",
            });
            return;
          }

          if (status === "failed") {
            throw new Error(errorMessage || "No se pudo cerrar la sesión de WhatsApp");
          }

          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        addToast({
          title: "WhatsApp sigue procesando el cierre",
          description: "Podés esperar unos segundos más y volver a intentar.",
          color: "warning",
        });
      } finally {
        setIsWaitingWhatsappCommand(false);
      }
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

    const shouldSwitch = window.confirm(
      "¿Querés cambiar de dispositivo? Se va a cerrar la sesión actual y se regenerará un QR nuevo.",
    );
    if (!shouldSwitch) return;

    try {
      const closeResponse = await closeWhatsappSession.mutateAsync();
      const closeCommandId = String(closeResponse?.data?.commandId || "").trim();

      if (closeCommandId) {
        setIsWaitingWhatsappCommand(true);
        try {
          const maxAttempts = 45;
          const delayMs = 2000;
          for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            const statusResponse =
              await configService.getWhatsappCommandStatus(closeCommandId);
            const status = String(statusResponse?.data?.status || "").toLowerCase();
            const errorMessage = String(statusResponse?.data?.lastError || "").trim();

            if (status === "done") {
              break;
            }

            if (status === "failed") {
              throw new Error(
                errorMessage || "No se pudo cerrar la sesión actual de WhatsApp",
              );
            }

            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        } finally {
          setIsWaitingWhatsappCommand(false);
        }
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

      setIsWaitingWhatsappCommand(true);
      try {
        const maxAttempts = 45;
        const delayMs = 2000;
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          const statusResponse = await configService.getWhatsappCommandStatus(enableCommandId);
          const status = String(statusResponse?.data?.status || "").toLowerCase();
          const errorMessage = String(statusResponse?.data?.lastError || "").trim();

          if (status === "done") {
            queryClient.invalidateQueries({ queryKey: ["whatsapp-status"] });
            addToast({
              title: "Listo: escaneá el nuevo QR para vincular otro dispositivo",
              color: "success",
            });
            return;
          }

          if (status === "failed") {
            throw new Error(
              errorMessage || "No se pudo iniciar la nueva sesión de WhatsApp",
            );
          }

          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        addToast({
          title: "WhatsApp sigue procesando el cambio de dispositivo",
          description: "El QR debería aparecer en breve.",
          color: "warning",
        });
      } finally {
        setIsWaitingWhatsappCommand(false);
      }
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

  const persistWhatsappCancellationGroupSettings = async (
    nextEnabled: boolean,
    nextGroupIdRaw: string,
    nextGroupNameRaw: string,
    nextDailyAvailabilityDigestEnabled: boolean,
    nextDailyAvailabilityDigestHourRaw: string,
    nextDailyAvailabilityDigestNextDayEnabled: boolean,
  ) => {
    const nextGroupId = nextGroupIdRaw.trim();
    const nextGroupName = nextGroupNameRaw.trim();
    const nextDailyAvailabilityDigestHour = nextDailyAvailabilityDigestHourRaw.trim();
    if (nextEnabled && !nextGroupId) {
      addToast({
        title: "Seleccioná un grupo antes de activar avisos de cancelación",
        color: "warning",
      });
      return;
    }

    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(nextDailyAvailabilityDigestHour)) {
      addToast({
        title: "Ingresá una hora válida en formato HH:mm.",
        color: "warning",
      });
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
        dailyAvailabilityDigestNextDayEnabled:
          nextDailyAvailabilityDigestNextDayEnabled,
      });
      setCancellationGroupIdInput(nextGroupId);
      setCancellationGroupNameInput(nextGroupName);
      setDailyAvailabilityDigestEnabledInput(nextDailyAvailabilityDigestEnabled);
      setDailyAvailabilityDigestHourInput(nextDailyAvailabilityDigestHour);
      setDailyAvailabilityDigestNextDayEnabledInput(
        nextDailyAvailabilityDigestNextDayEnabled,
      );
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
        title:
          err?.response?.data?.error ||
          "No se pudo actualizar el grupo de avisos de cancelación",
        color: "danger",
      });
    } finally {
      setIsSavingDailyAvailabilityDigestSettings(false);
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
    );
  };

  const handleToggleDailyAvailabilityDigestFromBot = (enabled: boolean) => {
    if (enabled && !cancellationGroupIdInput.trim()) {
      addToast({
        title: "Primero seleccioná un grupo para enviar el resumen diario",
        color: "warning",
      });
      return;
    }

    persistWhatsappCancellationGroupSettings(
      whatsappCancellationGroupEnabled,
      cancellationGroupIdInput,
      cancellationGroupNameInput,
      enabled,
      dailyAvailabilityDigestHourInput,
      dailyAvailabilityDigestNextDayEnabledInput,
    );
  };

  const handleToggleDailyAvailabilityDigestNextDayFromBot = (enabled: boolean) => {
    if (enabled && !cancellationGroupIdInput.trim()) {
      addToast({
        title: "Primero seleccioná un grupo para enviar la disponibilidad de mañana",
        color: "warning",
      });
      return;
    }

    persistWhatsappCancellationGroupSettings(
      whatsappCancellationGroupEnabled,
      cancellationGroupIdInput,
      cancellationGroupNameInput,
      dailyAvailabilityDigestEnabledInput,
      dailyAvailabilityDigestHourInput,
      enabled,
    );
  };

  const handleSaveDailyAvailabilityDigestSchedule = () => {
    if (!cancellationGroupIdInput.trim()) {
      addToast({
        title: "Primero configurá un grupo en WhatsApp Web para usar estos avisos",
        color: "warning",
      });
      return;
    }

    persistWhatsappCancellationGroupSettings(
      whatsappCancellationGroupEnabled,
      cancellationGroupIdInput,
      cancellationGroupNameInput,
      dailyAvailabilityDigestEnabledInput,
      dailyAvailabilityDigestHourInput,
      dailyAvailabilityDigestNextDayEnabledInput,
    );
  };

  const handleSelectWhatsappGroup = (groupId: string) => {
    const selected = whatsappGroups.find((group: any) => group.id === groupId);
    if (!selected) return;

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
    );
  };

  const getServerBotAutomationSnapshot = () => {
    const rawPenaltyEnabled = [
      botAutomationSettings?.penaltyEnabled,
      botAutomationSettings?.penaltySystemEnabled,
    ].find((value) => typeof value === "boolean");

    return {
      oneHourReminderEnabled:
        typeof botAutomationSettings?.oneHourReminderEnabled === "boolean"
          ? botAutomationSettings.oneHourReminderEnabled
          : true,
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
    if (typeof data?.oneHourReminderEnabled === "boolean") {
      setBotOneHourReminderEnabledInput(data.oneHourReminderEnabled);
    }
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

  const handleCreateCompany = () => {
    const name = companyNameInput.trim();
    if (!name) {
      addToast({ title: "Ingresá nombre de empresa", color: "danger" });
      return;
    }

    createCompany.mutate(
      { name },
      {
        onSuccess: () => {
          addToast({ title: "Empresa creada", color: "success" });
          setCompanyNameInput("");
        },
        onError: (err: any) => {
          addToast({
            title: err?.response?.data?.error || "No se pudo crear la empresa",
            color: "danger",
          });
        },
      },
    );
  };

  const handleCreateAdmin = () => {
    if (!newAdminCompanyId) {
      addToast({ title: "Seleccioná una empresa", color: "danger" });
      return;
    }
    if (!newAdminUsername.trim() || !newAdminPassword.trim()) {
      addToast({
        title: "Usuario y contraseña son obligatorios",
        color: "danger",
      });
      return;
    }

    createAdmin.mutate(
      {
        username: newAdminUsername.trim(),
        password: newAdminPassword,
        phone: newAdminPhone.trim(),
        companyId: newAdminCompanyId,
        role: "admin",
      },
      {
        onSuccess: () => {
          addToast({ title: "Admin creado", color: "success" });
          setNewAdminUsername("");
          setNewAdminPassword("");
          setNewAdminPhone("");
        },
        onError: (err: any) => {
          addToast({
            title: err?.response?.data?.error || "No se pudo crear admin",
            color: "danger",
          });
        },
      },
    );
  };

  const handleBootstrapTenant = () => {
    const name = companyNameInput.trim() || "Club Principal";
    bootstrapTenant.mutate(
      {
        name,
        assignAllUnassignedData: true,
        assignAllUnassignedAdmins: true,
      },
      {
        onSuccess: (response: any) => {
          const migrated =
            response?.data?.summary?.data?.bookings ??
            response?.data?.summary?.admins?.assigned ??
            0;
          addToast({
            title: `Bootstrap listo (${migrated} registros movidos)`,
            color: "success",
          });
          setCompanyNameInput("");
        },
        onError: (err: any) => {
          addToast({
            title: err?.response?.data?.error || "No se pudo hacer bootstrap",
            color: "danger",
          });
        },
      },
    );
  };

  const handleCreateCourt = () => {
    const name = newCourtName.trim();
    if (!name) {
      addToast({ title: "Ingresá un nombre de cancha", color: "danger" });
      return;
    }

    createCourt.mutate(
      { name },
      {
        onSuccess: () => {
          addToast({ title: "Cancha creada", color: "success" });
          setNewCourtName("");
        },
        onError: (err: any) => {
          addToast({
            title: err?.response?.data?.error || "No se pudo crear la cancha",
            color: "danger",
          });
        },
      },
    );
  };

  const handleToggleCourt = (id: string, isActive: boolean) => {
    updateCourt.mutate(
      { id, data: { isActive } },
      {
        onError: (err: any) => {
          addToast({
            title: err?.response?.data?.error || "No se pudo actualizar la cancha",
            color: "danger",
          });
        },
      },
    );
  };

  const handleSaveCourtName = (id: string, rawName: string) => {
    const name = rawName.trim();
    if (!name) {
      addToast({ title: "Ingresá un nombre de cancha", color: "danger" });
      return;
    }

    updateCourt.mutate(
      { id, data: { name } },
      {
        onSuccess: () => {
          addToast({ title: "Cancha actualizada", color: "success" });
        },
        onError: (err: any) => {
          addToast({
            title: err?.response?.data?.error || "No se pudo actualizar la cancha",
            color: "danger",
          });
        },
      },
    );
  };

  const handleDeleteCourt = (id: string, courtName: string) => {
    const normalizedName = courtName.trim() || "esta cancha";
    const shouldDelete = window.confirm(
      `¿Seguro que querés eliminar ${normalizedName}? Esta acción no se puede deshacer.`,
    );
    if (!shouldDelete) return;

    setDeleteCourtPendingId(id);
    deleteCourt.mutate(id, {
      onSuccess: () => {
        addToast({ title: "Cancha eliminada", color: "success" });
      },
      onError: (err: any) => {
        addToast({
          title: err?.response?.data?.error || "No se pudo eliminar la cancha",
          color: "danger",
        });
      },
      onSettled: () => {
        setDeleteCourtPendingId(null);
      },
    });
  };

  const handleCreateSlot = () => {
    if (!newSlotStartTime || !newSlotEndTime) {
      addToast({
        title: "Completá hora inicio y fin",
        color: "danger",
      });
      return;
    }

    const parsedPrice = Number(newSlotPrice);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      addToast({
        title: "Ingresá un precio válido",
        color: "danger",
      });
      return;
    }

    createSlot.mutate(
      {
        startTime: newSlotStartTime,
        endTime: newSlotEndTime,
        price: parsedPrice,
      },
      {
        onSuccess: () => {
          addToast({ title: "Turno creado", color: "success" });
          setNewSlotStartTime("");
          setNewSlotEndTime("");
          setNewSlotPrice("");
        },
        onError: (err: any) => {
          addToast({
            title: err?.response?.data?.error || "No se pudo crear el turno",
            color: "danger",
          });
        },
      },
    );
  };

  const handleToggleSlot = (id: string, isActive: boolean) => {
    setSlotTogglePendingId(id);
    updateSlot.mutate(
      { id, data: { isActive } },
      {
        onError: (err: any) => {
          addToast({
            title: err?.response?.data?.error || "No se pudo actualizar el turno",
            color: "danger",
          });
        },
        onSettled: () => {
          setSlotTogglePendingId((previousId) => (previousId === id ? null : previousId));
        },
      },
    );
  };

  if (view === "whatsapp") {
    return (
      <WhatsappSettingsView
        whatsappEnabled={whatsappEnabled}
        whatsappStatus={whatsappStatus}
        whatsappQr={whatsappQr}
        whatsappState={whatsappState}
        workerOnline={workerOnline}
        workerHeartbeatAt={workerHeartbeatAt}
        isLoadingWhatsapp={isLoadingWhatsapp}
        updateWhatsappPending={
          updateWhatsappStatus.isPending ||
          closeWhatsappSession.isPending ||
          isWaitingWhatsappCommand
        }
        whatsappChipColor={whatsappChipColor}
        whatsappStatusLabelByKey={whatsappStatusLabelByKey}
        cancellationGroupEnabled={whatsappCancellationGroupEnabled}
        cancellationGroupIdInput={cancellationGroupIdInput}
        cancellationGroupNameInput={cancellationGroupNameInput}
        whatsappGroups={whatsappGroups}
        isLoadingWhatsappGroups={isLoadingWhatsappGroups}
        updateCancellationGroupPending={
          updateWhatsappCancellationGroupSettings.isPending
        }
        onBack={() => setView("menu")}
        onToggleWhatsapp={handleToggleWhatsapp}
        onCloseWhatsappSession={handleCloseWhatsappSession}
        onSwitchWhatsappDevice={handleSwitchWhatsappDevice}
        onCancellationGroupEnabledChange={handleToggleCancellationGroup}
        onSelectWhatsappGroup={handleSelectWhatsappGroup}
      />
    );
  }

  if (view === "tenants" && canManageClubData) {
    return (
      <TenantsView
        isSuperAdmin={isSuperAdmin}
        companies={companies}
        admins={admins}
        companyNameInput={companyNameInput}
        newAdminUsername={newAdminUsername}
        newAdminPassword={newAdminPassword}
        newAdminPhone={newAdminPhone}
        newAdminCompanyId={newAdminCompanyId}
        createCompanyPending={createCompany.isPending}
        updateCompanyPending={updateCompany.isPending || updateOwnCompany.isPending}
        bootstrapPending={bootstrapTenant.isPending}
        createAdminPending={createAdmin.isPending}
        onBack={() => setView("menu")}
        onCompanyNameChange={setCompanyNameInput}
        onAdminUsernameChange={setNewAdminUsername}
        onAdminPasswordChange={setNewAdminPassword}
        onAdminPhoneChange={setNewAdminPhone}
        onAdminCompanyChange={setNewAdminCompanyId}
        onCreateCompany={handleCreateCompany}
        onBootstrapTenant={handleBootstrapTenant}
        onCreateAdmin={handleCreateAdmin}
        onUpdateCompanyStatus={(id, isActive) =>
          isSuperAdmin
            ? updateCompanyStatus.mutate({ id, isActive })
            : addToast({
                title: "Solo superadmin puede activar/desactivar empresas",
                color: "warning",
              })
        }
        onUpdateCompany={(id, data) =>
          isSuperAdmin
            ? updateCompany.mutate(
                { id, data },
                {
                  onSuccess: () => {
                    addToast({ title: "Empresa actualizada", color: "success" });
                  },
                  onError: (err: any) => {
                    addToast({
                      title:
                        err?.response?.data?.error || "No se pudo actualizar la empresa",
                      color: "danger",
                    });
                  },
                },
              )
            : updateOwnCompany.mutate(data, {
                onSuccess: (response: any) => {
                  if (response?.data?.user) {
                    updateUser(response.data.user);
                  }
                  addToast({ title: "Datos del club actualizados", color: "success" });
                },
                onError: (err: any) => {
                  addToast({
                    title:
                      err?.response?.data?.error || "No se pudo actualizar el club",
                    color: "danger",
                  });
                },
              })
        }
        onUpdateAdminStatus={(id, isActive) =>
          updateAdminStatus.mutate({ id, isActive })
        }
      />
    );
  }

  if (view === "bot-automation") {
    return (
      <BotAutomationSettingsView
        oneHourReminderEnabled={botOneHourReminderEnabledInput}
        penaltyEnabled={penaltyEnabledInput}
        attendanceReminderLeadMinutesInput={attendanceReminderLeadMinutesInput}
        attendanceResponseTimeoutMinutesInput={
          attendanceResponseTimeoutMinutesInput
        }
        cancellationLockHoursInput={cancellationLockHoursInput}
        trustedClientConfirmationCountInput={trustedClientConfirmationCountInput}
        penaltyLimitInput={penaltyLimitInput}
        dailyAvailabilityDigestEnabled={dailyAvailabilityDigestEnabledInput}
        dailyAvailabilityDigestHourInput={dailyAvailabilityDigestHourInput}
        dailyAvailabilityDigestNextDayEnabled={
          dailyAvailabilityDigestNextDayEnabledInput
        }
        cancellationGroupConfigured={Boolean(cancellationGroupIdInput.trim())}
        isSavingReminderToggle={isSavingReminderToggle}
        isSavingPenaltyToggle={isSavingPenaltyToggle}
        isSavingReminderMinutes={isSavingReminderMinutes}
        isSavingResponseTimeoutMinutes={isSavingResponseTimeoutMinutes}
        isSavingCancellationLockHours={isSavingCancellationLockHours}
        isSavingTrustedCount={isSavingTrustedCount}
        isSavingPenaltyLimit={isSavingPenaltyLimit}
        isSavingDailyAvailabilityDigestSettings={
          isSavingDailyAvailabilityDigestSettings
        }
        onBack={() => setView("menu")}
        onToggleOneHourReminder={handleToggleBotOneHourReminderRealtime}
        onTogglePenaltyEnabled={handleTogglePenaltyEnabledRealtime}
        onAttendanceReminderLeadMinutesChange={setAttendanceReminderLeadMinutesInput}
        onAttendanceResponseTimeoutMinutesChange={
          setAttendanceResponseTimeoutMinutesInput
        }
        onCancellationLockHoursChange={setCancellationLockHoursInput}
        onTrustedClientConfirmationCountChange={
          setTrustedClientConfirmationCountInput
        }
        onPenaltyLimitChange={setPenaltyLimitInput}
        onToggleDailyAvailabilityDigest={handleToggleDailyAvailabilityDigestFromBot}
        onDailyAvailabilityDigestHourChange={setDailyAvailabilityDigestHourInput}
        onToggleDailyAvailabilityDigestNextDay={
          handleToggleDailyAvailabilityDigestNextDayFromBot
        }
        onSaveReminderMinutes={handleSaveReminderMinutes}
        onSaveAttendanceResponseTimeoutMinutes={
          handleSaveAttendanceResponseTimeoutMinutes
        }
        onSaveCancellationLockHours={handleSaveCancellationLockHours}
        onSaveTrustedCount={handleSaveTrustedConfirmationCount}
        onSavePenaltyLimit={handleSavePenaltyLimit}
        onSaveDailyAvailabilityDigestSettings={
          handleSaveDailyAvailabilityDigestSchedule
        }
      />
    );
  }

  if (view === "courts") {
    return (
      <CourtsView
        courts={courts}
        newCourtName={newCourtName}
        createCourtPending={createCourt.isPending}
        updateCourtPending={updateCourt.isPending}
        deleteCourtPendingId={deleteCourtPendingId}
        onBack={() => setView("menu")}
        onCourtNameChange={setNewCourtName}
        onCreateCourt={handleCreateCourt}
        onToggleCourt={handleToggleCourt}
        onSaveCourtName={handleSaveCourtName}
        onDeleteCourt={handleDeleteCourt}
      />
    );
  }

  if (view === "schedule") {
    return (
      <ScheduleSettingsView
        slots={slots}
        newSlotStartTime={newSlotStartTime}
        newSlotEndTime={newSlotEndTime}
        newSlotPrice={newSlotPrice}
        basePriceInput={basePriceInput}
        createSlotPending={createSlot.isPending}
        updateBasePricePending={updateBasePrice.isPending}
        slotTogglePendingId={slotTogglePendingId}
        onBack={() => setView("menu")}
        onSlotStartTimeChange={setNewSlotStartTime}
        onSlotEndTimeChange={setNewSlotEndTime}
        onSlotPriceChange={setNewSlotPrice}
        onBasePriceChange={setBasePriceInput}
        onCreateSlot={handleCreateSlot}
        onSaveBasePrice={handleSaveBasePrice}
        onToggleSlot={handleToggleSlot}
      />
    );
  }

  return (
    <ProfileMenuView
      user={user}
      isSuperAdmin={isSuperAdmin}
      canManageClubData={canManageClubData}
      courtsCount={courts.length}
      phoneNumber={phoneNumber}
      savedPhoneNumber={String(user?.phone || "")}
      whatsappEnabled={whatsappEnabled}
      whatsappStatus={whatsappStatus}
      whatsappStatusLabelByKey={whatsappStatusLabelByKey}
      updateProfilePending={updateProfile.isPending}
      isDarkMode={isDark}
      onPhoneChange={setPhoneNumber}
      onSavePhone={handleUpdatePhone}
      onToggleTheme={toggleTheme}
      onGoToCourts={() => setView("courts")}
      onGoToWhatsapp={() => setView("whatsapp")}
      onGoToSchedule={() => setView("schedule")}
      onGoToBotAutomation={() => setView("bot-automation")}
      onGoToTenants={() => setView("tenants")}
      onLogout={logout}
    />
  );
};
