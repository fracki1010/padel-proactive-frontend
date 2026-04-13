import { addToast } from "@heroui/react";
import { useEffect, useState } from "react";

import {
  useCourts,
  useCreateCourt,
  useUpdateCourt,
  useSlots,
  useCreateSlot,
  useUpdateSlot,
  useUpdateProfile,
  useUpdateOwnCompany,
  useWhatsappStatus,
  useUpdateBasePrice,
  usePenaltySettings,
  useUpdatePenaltySettings,
  useOneHourReminderSetting,
  useUpdateOneHourReminderSetting,
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
import { CourtsView } from "../components/CourtsView";
import { ProfileMenuView } from "../components/ProfileMenuView";
import { ScheduleSettingsView } from "../components/ScheduleSettingsView";
import { TenantsView } from "../components/TenantsView";
import { WhatsappSettingsView } from "../components/WhatsappSettingsView";

interface ProfileProps {
  courts: any[];
}

export const Profile = ({ courts: initialCourts }: ProfileProps) => {
  const { logout, user, updateUser } = useAuth();
  const [view, setView] = useState<
    "menu" | "courts" | "schedule" | "whatsapp" | "tenants"
  >("menu");
  const isSuperAdmin = user?.role === "super_admin";
  const canManageClubData = isSuperAdmin || Boolean(user?.companyId);

  const { data: courtsData } = useCourts(true);
  const { data: slotsData } = useSlots(true);
  const { data: whatsappData, isLoading: isLoadingWhatsapp } = useWhatsappStatus();
  const { data: whatsappCancellationGroupSettingsData } =
    useWhatsappCancellationGroupSettings();
  const { data: whatsappGroupsData, isLoading: isLoadingWhatsappGroups } =
    useWhatsappGroups();
  const { data: penaltySettingsData } = usePenaltySettings();
  const { data: oneHourReminderData } = useOneHourReminderSetting();
  const { data: companiesData } = useCompanies(isSuperAdmin);
  const { data: adminsData } = useAdmins(isSuperAdmin);

  const updateCourt = useUpdateCourt();
  const createCourt = useCreateCourt();
  const updateSlot = useUpdateSlot();
  const createSlot = useCreateSlot();
  const updateBasePrice = useUpdateBasePrice();
  const updatePenaltySettings = useUpdatePenaltySettings();
  const updateOneHourReminderSetting = useUpdateOneHourReminderSetting();
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
  const oneHourReminderEnabled = Boolean(
    oneHourReminderData?.data?.oneHourReminderEnabled,
  );

  const [phoneNumber, setPhoneNumber] = useState("");
  const [basePriceInput, setBasePriceInput] = useState("");
  const [penaltyLimitInput, setPenaltyLimitInput] = useState("");
  const [companyNameInput, setCompanyNameInput] = useState("");
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminPhone, setNewAdminPhone] = useState("");
  const [newAdminCompanyId, setNewAdminCompanyId] = useState("");
  const [newCourtName, setNewCourtName] = useState("");
  const [newSlotStartTime, setNewSlotStartTime] = useState("");
  const [newSlotEndTime, setNewSlotEndTime] = useState("");
  const [newSlotPrice, setNewSlotPrice] = useState("");
  const [cancellationGroupIdInput, setCancellationGroupIdInput] = useState("");
  const [cancellationGroupNameInput, setCancellationGroupNameInput] = useState("");
  const [isEditingCancellationGroupId, setIsEditingCancellationGroupId] =
    useState(false);
  const [isEditingCancellationGroupName, setIsEditingCancellationGroupName] =
    useState(false);

  useEffect(() => {
    if (user?.phone) {
      setPhoneNumber(user.phone);
    }
  }, [user]);

  useEffect(() => {
    const backendLimit = penaltySettingsData?.data?.penaltyLimit;
    if (!backendLimit) return;
    setPenaltyLimitInput(String(backendLimit));
  }, [penaltySettingsData]);

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
    updateWhatsappStatus.mutate(enabled, {
      onSuccess: () => {
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
    const shouldClose = window.confirm(
      "¿Seguro que querés cerrar la sesión de WhatsApp y dar de baja todas las sesiones/dispositivos activos?",
    );
    if (!shouldClose) return;

    try {
      await closeWhatsappSession.mutateAsync();
      addToast({
        title: "Sesión de WhatsApp cerrada y dada de baja",
        color: "success",
      });
    } catch (err: any) {
      addToast({
        title: err?.response?.data?.error || "No se pudo cerrar la sesión de WhatsApp",
        color: "danger",
      });
    }
  };

  const handleSwitchWhatsappDevice = async () => {
    const shouldSwitch = window.confirm(
      "¿Querés cambiar de dispositivo? Se va a cerrar la sesión actual y se regenerará un QR nuevo.",
    );
    if (!shouldSwitch) return;

    try {
      await closeWhatsappSession.mutateAsync();
      await updateWhatsappStatus.mutateAsync(true);
      addToast({
        title: "Listo: escaneá el nuevo QR para vincular otro dispositivo",
        color: "success",
      });
    } catch (err: any) {
      addToast({
        title:
          err?.response?.data?.error ||
          "No se pudo cambiar el dispositivo de WhatsApp",
        color: "danger",
      });
    }
  };

  const persistWhatsappCancellationGroupSettings = async (
    nextEnabled: boolean,
    nextGroupIdRaw: string,
    nextGroupNameRaw: string,
  ) => {
    const nextGroupId = nextGroupIdRaw.trim();
    const nextGroupName = nextGroupNameRaw.trim();
    if (nextEnabled && !nextGroupId) {
      addToast({
        title: "Ingresá el ID del grupo antes de activar avisos de cancelación",
        color: "warning",
      });
      return;
    }

    try {
      const response = await updateWhatsappCancellationGroupSettings.mutateAsync({
        enabled: nextEnabled,
        groupId: nextGroupId,
        groupName: nextGroupName,
      });
      setCancellationGroupIdInput(nextGroupId);
      setCancellationGroupNameInput(nextGroupName);
      setIsEditingCancellationGroupId(false);
      setIsEditingCancellationGroupName(false);
      addToast({
        title: nextEnabled
          ? "Avisos de cancelación al grupo activados"
          : "Avisos de cancelación al grupo desactivados",
        description: response?.data?.persistedLocally
          ? "Guardado localmente (pendiente de soporte en backend)."
          : undefined,
        color: "success",
      });
    } catch (err: any) {
      addToast({
        title:
          err?.response?.data?.error ||
          "No se pudo actualizar el grupo de avisos de cancelación",
        color: "danger",
      });
    }
  };

  const handleToggleCancellationGroup = (enabled: boolean) => {
    persistWhatsappCancellationGroupSettings(
      enabled,
      cancellationGroupIdInput,
      cancellationGroupNameInput,
    );
  };

  const handleSaveCancellationGroupId = () => {
    persistWhatsappCancellationGroupSettings(
      whatsappCancellationGroupEnabled,
      cancellationGroupIdInput,
      cancellationGroupNameInput,
    );
  };

  const handleSelectWhatsappGroup = (groupId: string) => {
    const selected = whatsappGroups.find((group: any) => group.id === groupId);
    if (!selected) return;

    setCancellationGroupIdInput(selected.id);
    setCancellationGroupNameInput(selected.name || "");
    setIsEditingCancellationGroupId(true);
    setIsEditingCancellationGroupName(true);
  };

  const handleSavePenaltyLimit = () => {
    const parsed = Number(penaltyLimitInput);
    if (!Number.isInteger(parsed) || parsed < 1) {
      addToast({
        title: "Ingresá un límite válido (entero mayor o igual a 1).",
        color: "danger",
      });
      return;
    }

    updatePenaltySettings.mutate(parsed, {
      onSuccess: () => {
        addToast({ title: "Límite de penalizaciones actualizado", color: "success" });
      },
      onError: (err: any) => {
        addToast({
          title:
            err?.response?.data?.error ||
            "No se pudo actualizar el límite de penalizaciones",
          color: "danger",
        });
      },
    });
  };

  const handleToggleOneHourReminder = (enabled: boolean) => {
    updateOneHourReminderSetting.mutate(enabled, {
      onSuccess: (response: any) => {
        addToast({
          title: enabled
            ? "Recordatorio de 1 hora activado"
            : "Recordatorio de 1 hora desactivado",
          description: response?.data?.persistedLocally
            ? "Guardado localmente (pendiente de soporte en backend)."
            : undefined,
          color: "success",
        });
      },
      onError: (err: any) => {
        addToast({
          title:
            err?.response?.data?.error ||
            "No se pudo actualizar el recordatorio de 1 hora",
          color: "danger",
        });
      },
    });
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

  if (view === "whatsapp") {
    return (
      <WhatsappSettingsView
        whatsappEnabled={whatsappEnabled}
        whatsappStatus={whatsappStatus}
        whatsappQr={whatsappQr}
        whatsappState={whatsappState}
        isLoadingWhatsapp={isLoadingWhatsapp}
        updateWhatsappPending={
          updateWhatsappStatus.isPending || closeWhatsappSession.isPending
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
        onCancellationGroupIdChange={(value) => {
          setCancellationGroupIdInput(value);
          setIsEditingCancellationGroupId(true);
        }}
        onCancellationGroupNameChange={(value) => {
          setCancellationGroupNameInput(value);
          setIsEditingCancellationGroupName(true);
        }}
        onSelectWhatsappGroup={handleSelectWhatsappGroup}
        onSaveCancellationGroup={handleSaveCancellationGroupId}
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

  if (view === "courts") {
    return (
      <CourtsView
        courts={courts}
        newCourtName={newCourtName}
        createCourtPending={createCourt.isPending}
        onBack={() => setView("menu")}
        onCourtNameChange={setNewCourtName}
        onCreateCourt={handleCreateCourt}
        onToggleCourt={(id, isActive) =>
          updateCourt.mutate({ id, data: { isActive } })
        }
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
        penaltyLimitInput={penaltyLimitInput}
        createSlotPending={createSlot.isPending}
        updateBasePricePending={updateBasePrice.isPending}
        updatePenaltySettingsPending={updatePenaltySettings.isPending}
        onBack={() => setView("menu")}
        onSlotStartTimeChange={setNewSlotStartTime}
        onSlotEndTimeChange={setNewSlotEndTime}
        onSlotPriceChange={setNewSlotPrice}
        onBasePriceChange={setBasePriceInput}
        onPenaltyLimitChange={setPenaltyLimitInput}
        onCreateSlot={handleCreateSlot}
        onSaveBasePrice={handleSaveBasePrice}
        onSavePenaltyLimit={handleSavePenaltyLimit}
        onToggleSlot={(id, isActive) =>
          updateSlot.mutate({ id, data: { isActive } })
        }
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
      whatsappEnabled={whatsappEnabled}
      whatsappStatus={whatsappStatus}
      whatsappStatusLabelByKey={whatsappStatusLabelByKey}
      updateProfilePending={updateProfile.isPending}
      oneHourReminderEnabled={oneHourReminderEnabled}
      updateOneHourReminderPending={updateOneHourReminderSetting.isPending}
      onPhoneChange={setPhoneNumber}
      onSavePhone={handleUpdatePhone}
      onToggleOneHourReminder={handleToggleOneHourReminder}
      onGoToCourts={() => setView("courts")}
      onGoToWhatsapp={() => setView("whatsapp")}
      onGoToSchedule={() => setView("schedule")}
      onGoToTenants={() => setView("tenants")}
      onLogout={logout}
    />
  );
};
