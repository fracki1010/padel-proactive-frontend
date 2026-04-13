import { useEffect, useMemo, useState } from "react";
import { addToast } from "@heroui/react";

import {
  useBootstrapDefaultTenant,
  useCompanies,
  useCreateAdmin,
  useCreateCompany,
  useAdmins,
} from "../../../hooks/useData";
import { AdminStep } from "../components/AdminStep";
import { BootstrapStep } from "../components/BootstrapStep";
import { CompanyStep } from "../components/CompanyStep";
import { SetupHeader } from "../components/SetupHeader";
import { SetupProgress } from "../components/SetupProgress";

type SuperAdminSetupProps = {
  superAdminUsername?: string;
};

const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const isValidSlug = (value: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const isValidUsername = (value: string) => /^[a-zA-Z0-9._-]{4,24}$/.test(value);
const isStrongPassword = (value: string) =>
  value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
const isValidPhone = (value: string) => /^\+?\d{8,15}$/.test(value);

export const SuperAdminSetup = ({
  superAdminUsername = "superadmin",
}: SuperAdminSetupProps) => {
  const { data: companiesData } = useCompanies(true);
  const { data: adminsData } = useAdmins(true);
  const createCompany = useCreateCompany();
  const createAdmin = useCreateAdmin();
  const bootstrapTenant = useBootstrapDefaultTenant();

  const companies = companiesData?.data || [];
  const admins = adminsData?.data || [];
  const tenantAdmins = useMemo(
    () => admins.filter((admin: any) => admin.role !== "super_admin"),
    [admins],
  );

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [companyName, setCompanyName] = useState("");
  const [companySlug, setCompanySlug] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [shouldAssignData, setShouldAssignData] = useState(true);
  const [shouldAssignAdmins, setShouldAssignAdmins] = useState(true);
  const [bootstrapDone, setBootstrapDone] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPhone, setAdminPhone] = useState("");

  const selectedCompany = companies.find((company: any) => company._id === selectedCompanyId);

  useEffect(() => {
    if (!selectedCompanyId && companies.length > 0) {
      setSelectedCompanyId(companies[0]._id);
    }
  }, [companies, selectedCompanyId]);

  useEffect(() => {
    if (companies.length > 0 && step === 1) {
      setStep(2);
    }
  }, [companies.length, step]);

  const companyNameError =
    companyName.trim().length > 0 && companyName.trim().length < 3
      ? "El nombre debe tener al menos 3 caracteres."
      : "";

  const normalizedSuggestedSlug = normalizeSlug(companySlug || companyName);
  const slugError =
    companySlug.trim().length > 0 && !isValidSlug(companySlug.trim())
      ? "Slug inválido. Usá minúsculas, números y guiones."
      : "";

  const usernameError =
    adminUsername.trim().length > 0 && !isValidUsername(adminUsername.trim())
      ? "Usuario inválido (4-24 caracteres, letras/números/._-)."
      : "";

  const passwordError =
    adminPassword.length > 0 && !isStrongPassword(adminPassword)
      ? "Mínimo 8 caracteres, con letras y números."
      : "";

  const phoneError =
    adminPhone.trim().length > 0 && !isValidPhone(adminPhone.trim())
      ? "Teléfono inválido (8 a 15 dígitos, opcional +)."
      : "";

  const handleCreateCompany = () => {
    const name = companyName.trim();
    const slug = (companySlug.trim() || normalizedSuggestedSlug).trim();

    if (name.length < 3) {
      addToast({ title: "Nombre de empresa inválido", color: "danger" });
      return;
    }
    if (!slug || !isValidSlug(slug)) {
      addToast({ title: "Slug inválido", color: "danger" });
      return;
    }

    createCompany.mutate(
      { name, slug },
      {
        onSuccess: (response: any) => {
          addToast({ title: "Empresa creada", color: "success" });
          const created = response?.data;
          if (created?._id) setSelectedCompanyId(created._id);
          setCompanyName("");
          setCompanySlug("");
          setStep(2);
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

  const handleBootstrap = () => {
    const fallbackName = selectedCompany?.name || companyName.trim() || "Club Principal";
    const fallbackSlug = selectedCompany?.slug || normalizedSuggestedSlug || undefined;

    bootstrapTenant.mutate(
      {
        name: fallbackName,
        slug: fallbackSlug,
        assignAllUnassignedData: shouldAssignData,
        assignAllUnassignedAdmins: shouldAssignAdmins,
      },
      {
        onSuccess: () => {
          setBootstrapDone(true);
          addToast({
            title: "Bootstrap completado",
            color: "success",
          });
        },
        onError: (err: any) => {
          addToast({
            title: err?.response?.data?.error || "No se pudo ejecutar bootstrap",
            color: "danger",
          });
        },
      },
    );
  };

  const handleCreateAdmin = () => {
    if (!selectedCompanyId) {
      addToast({ title: "Seleccioná una empresa", color: "danger" });
      return;
    }

    const username = adminUsername.trim();
    const password = adminPassword;
    const phone = adminPhone.trim();

    if (!isValidUsername(username)) {
      addToast({ title: "Usuario inválido", color: "danger" });
      return;
    }
    if (!isStrongPassword(password)) {
      addToast({ title: "Contraseña demasiado débil", color: "danger" });
      return;
    }
    if (phone && !isValidPhone(phone)) {
      addToast({ title: "Teléfono inválido", color: "danger" });
      return;
    }

    createAdmin.mutate(
      {
        username,
        password,
        phone,
        companyId: selectedCompanyId,
        role: "admin",
      },
      {
        onSuccess: () => {
          addToast({ title: "Admin creado. Setup completo.", color: "success" });
          setAdminUsername("");
          setAdminPassword("");
          setAdminPhone("");
        },
        onError: (err: any) => {
          addToast({
            title: err?.response?.data?.error || "No se pudo crear el admin",
            color: "danger",
          });
        },
      },
    );
  };

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground px-4 py-6 sm:p-8 bg-[radial-gradient(circle_at_top_right,rgba(126,169,236,0.14),transparent),radial-gradient(circle_at_bottom_left,rgba(126,169,236,0.08),transparent)]">
      <div className="max-w-2xl mx-auto space-y-6">
        <SetupHeader superAdminUsername={superAdminUsername} />
        <SetupProgress step={step} progress={progress} />

        {step === 1 && (
          <CompanyStep
            companies={companies}
            selectedCompanyId={selectedCompanyId}
            companyName={companyName}
            companySlug={companySlug}
            normalizedSuggestedSlug={normalizedSuggestedSlug}
            companyNameError={companyNameError}
            slugError={slugError}
            createCompanyPending={createCompany.isPending}
            onSelectCompany={setSelectedCompanyId}
            onCompanyNameChange={setCompanyName}
            onCompanySlugChange={setCompanySlug}
            onCreateCompany={handleCreateCompany}
            onContinue={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <BootstrapStep
            shouldAssignData={shouldAssignData}
            shouldAssignAdmins={shouldAssignAdmins}
            selectedCompanyId={selectedCompanyId}
            bootstrapDone={bootstrapDone}
            bootstrapPending={bootstrapTenant.isPending}
            onAssignDataChange={setShouldAssignData}
            onAssignAdminsChange={setShouldAssignAdmins}
            onRunBootstrap={handleBootstrap}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <AdminStep
            companies={companies}
            selectedCompanyId={selectedCompanyId}
            adminUsername={adminUsername}
            adminPassword={adminPassword}
            adminPhone={adminPhone}
            usernameError={usernameError}
            passwordError={passwordError}
            phoneError={phoneError}
            createAdminPending={createAdmin.isPending}
            hasTenantAdmin={tenantAdmins.length > 0}
            onSelectCompany={setSelectedCompanyId}
            onUsernameChange={setAdminUsername}
            onPasswordChange={setAdminPassword}
            onPhoneChange={setAdminPhone}
            onBack={() => setStep(2)}
            onCreateAdmin={handleCreateAdmin}
          />
        )}
      </div>
    </div>
  );
};
