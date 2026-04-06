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
  useWhatsappStatus,
  useUpdateBasePrice,
  useUpdateWhatsappStatus,
  useCompanies,
  useCreateCompany,
  useUpdateCompanyStatus,
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

  const { data: courtsData } = useCourts(true);
  const { data: slotsData } = useSlots(true);
  const { data: whatsappData, isLoading: isLoadingWhatsapp } = useWhatsappStatus();
  const { data: companiesData } = useCompanies(isSuperAdmin);
  const { data: adminsData } = useAdmins(isSuperAdmin);

  const updateCourt = useUpdateCourt();
  const createCourt = useCreateCourt();
  const updateSlot = useUpdateSlot();
  const createSlot = useCreateSlot();
  const updateBasePrice = useUpdateBasePrice();
  const updateProfile = useUpdateProfile();
  const updateWhatsappStatus = useUpdateWhatsappStatus();
  const createCompany = useCreateCompany();
  const updateCompanyStatus = useUpdateCompanyStatus();
  const createAdmin = useCreateAdmin();
  const updateAdminStatus = useUpdateAdminStatus();
  const bootstrapTenant = useBootstrapDefaultTenant();

  const courts = courtsData?.data || initialCourts;
  const slots = slotsData?.data || [];
  const whatsappState = whatsappData?.data;
  const whatsappEnabled = Boolean(whatsappState?.enabled);
  const whatsappStatus = whatsappState?.status || "initializing";
  const whatsappQr = whatsappState?.qr || "";
  const companies = companiesData?.data || [];
  const admins = adminsData?.data || [];

  const [phoneNumber, setPhoneNumber] = useState("");
  const [basePriceInput, setBasePriceInput] = useState("");
  const [companyNameInput, setCompanyNameInput] = useState("");
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminPhone, setNewAdminPhone] = useState("");
  const [newAdminCompanyId, setNewAdminCompanyId] = useState("");
  const [newCourtName, setNewCourtName] = useState("");
  const [newSlotStartTime, setNewSlotStartTime] = useState("");
  const [newSlotEndTime, setNewSlotEndTime] = useState("");
  const [newSlotPrice, setNewSlotPrice] = useState("");

  useEffect(() => {
    if (user?.phone) {
      setPhoneNumber(user.phone);
    }
  }, [user]);

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

  const whatsappStatusLabelByKey: Record<string, string> = {
    disabled: "Desactivado",
    ready: "Conectado",
    authenticated: "Autenticado",
    qr_pending: "Esperando escaneo",
    loading: "Iniciando",
    auth_failure: "Error de autenticación",
    initializing: "Inicializando",
  };

  const whatsappChipColor =
    !whatsappEnabled
      ? "default"
      : whatsappStatus === "ready"
        ? "success"
        : whatsappStatus === "auth_failure"
          ? "danger"
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
        updateWhatsappPending={updateWhatsappStatus.isPending}
        whatsappChipColor={whatsappChipColor}
        whatsappStatusLabelByKey={whatsappStatusLabelByKey}
        onBack={() => setView("menu")}
        onToggleWhatsapp={handleToggleWhatsapp}
      />
    );
  }

  if (view === "tenants" && isSuperAdmin) {
    return (
      <TenantsView
        companies={companies}
        admins={admins}
        companyNameInput={companyNameInput}
        newAdminUsername={newAdminUsername}
        newAdminPassword={newAdminPassword}
        newAdminPhone={newAdminPhone}
        newAdminCompanyId={newAdminCompanyId}
        createCompanyPending={createCompany.isPending}
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
          updateCompanyStatus.mutate({ id, isActive })
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
        createSlotPending={createSlot.isPending}
        updateBasePricePending={updateBasePrice.isPending}
        onBack={() => setView("menu")}
        onSlotStartTimeChange={setNewSlotStartTime}
        onSlotEndTimeChange={setNewSlotEndTime}
        onSlotPriceChange={setNewSlotPrice}
        onBasePriceChange={setBasePriceInput}
        onCreateSlot={handleCreateSlot}
        onSaveBasePrice={handleSaveBasePrice}
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
      courtsCount={courts.length}
      phoneNumber={phoneNumber}
      whatsappEnabled={whatsappEnabled}
      whatsappStatus={whatsappStatus}
      whatsappStatusLabelByKey={whatsappStatusLabelByKey}
      updateProfilePending={updateProfile.isPending}
      onPhoneChange={setPhoneNumber}
      onSavePhone={handleUpdatePhone}
      onGoToCourts={() => setView("courts")}
      onGoToWhatsapp={() => setView("whatsapp")}
      onGoToSchedule={() => setView("schedule")}
      onGoToTenants={() => setView("tenants")}
      onLogout={logout}
    />
  );
};
