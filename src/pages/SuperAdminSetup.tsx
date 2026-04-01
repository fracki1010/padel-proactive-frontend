import { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, Input, Switch, addToast } from "@heroui/react";
import {
  useBootstrapDefaultTenant,
  useCompanies,
  useCreateAdmin,
  useCreateCompany,
  useAdmins,
} from "../hooks/useData";

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
    () => admins.filter((a: any) => a.role !== "super_admin"),
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

  const selectedCompany = companies.find((c: any) => c._id === selectedCompanyId);

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
    <div className="min-h-[100dvh] bg-background text-foreground px-4 py-6 sm:p-8 bg-[radial-gradient(circle_at_top_right,rgba(255,122,0,0.12),transparent),radial-gradient(circle_at_bottom_left,rgba(255,122,0,0.08),transparent)]">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter uppercase">
            Setup Inicial
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
            Bienvenido {superAdminUsername}. Configurá tu primer tenant.
          </p>
        </div>

        <Card className="bg-dark-100/70 border border-white/10 rounded-[2rem]">
          <CardBody className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
              <span className="text-gray-500">Paso {step} de 3</span>
              <span className="text-primary">{progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardBody>
        </Card>

        {step === 1 && (
          <Card className="bg-dark-100/70 border border-white/10 rounded-[2rem]">
            <CardBody className="p-5 sm:p-6 space-y-4">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                Paso 1 • Empresa
              </p>

              {companies.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-300 font-bold">
                    Ya existen empresas. Seleccioná una para continuar o creá otra.
                  </p>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="h-12 rounded-2xl bg-white/5 border border-white/10 px-4 text-white font-bold w-full"
                  >
                    <option value="" disabled>
                      Seleccionar empresa
                    </option>
                    {companies.map((company: any) => (
                      <option key={company._id} value={company._id} className="text-black">
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <Input
                label="Nombre de empresa"
                labelPlacement="outside"
                placeholder="Ej: Padel Proactive Centro"
                value={companyName}
                onValueChange={setCompanyName}
                isInvalid={Boolean(companyNameError)}
                errorMessage={companyNameError}
                classNames={{
                  inputWrapper: "bg-white/5 border-white/10 h-12 rounded-2xl",
                  input: "text-white font-bold",
                  label: "text-gray-400 text-[10px] font-black uppercase tracking-widest",
                }}
              />

              <Input
                label="Slug"
                labelPlacement="outside"
                placeholder="padel-proactive-centro"
                value={companySlug}
                onValueChange={setCompanySlug}
                isInvalid={Boolean(slugError)}
                errorMessage={slugError}
                description={`Sugerido: ${normalizedSuggestedSlug || "(ingresá nombre)"}`}
                classNames={{
                  inputWrapper: "bg-white/5 border-white/10 h-12 rounded-2xl",
                  input: "text-white font-bold",
                  label: "text-gray-400 text-[10px] font-black uppercase tracking-widest",
                  description: "text-gray-500 text-[10px]",
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  className="h-12 bg-primary text-black font-black uppercase rounded-2xl"
                  isLoading={createCompany.isPending}
                  onPress={handleCreateCompany}
                >
                  Crear Empresa
                </Button>
                <Button
                  className="h-12 bg-white/10 text-white font-black uppercase rounded-2xl"
                  onPress={() => setStep(2)}
                  isDisabled={!selectedCompanyId}
                >
                  Continuar
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {step === 2 && (
          <Card className="bg-dark-100/70 border border-white/10 rounded-[2rem]">
            <CardBody className="p-5 sm:p-6 space-y-4">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                Paso 2 • Migración inicial
              </p>
              <p className="text-xs text-gray-300 font-bold leading-relaxed">
                Podés migrar datos viejos sin tenant (reservas, usuarios, canchas, etc.) a la
                empresa seleccionada.
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white/5 rounded-2xl p-3 border border-white/10">
                  <p className="text-xs text-white font-bold">Asignar datos operativos sin empresa</p>
                  <Switch
                    isSelected={shouldAssignData}
                    onValueChange={setShouldAssignData}
                    color="primary"
                    size="sm"
                  />
                </div>
                <div className="flex items-center justify-between bg-white/5 rounded-2xl p-3 border border-white/10">
                  <p className="text-xs text-white font-bold">Asignar admins sin empresa</p>
                  <Switch
                    isSelected={shouldAssignAdmins}
                    onValueChange={setShouldAssignAdmins}
                    color="primary"
                    size="sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button
                  className="h-12 bg-blue-500 text-white font-black uppercase rounded-2xl"
                  isLoading={bootstrapTenant.isPending}
                  onPress={handleBootstrap}
                  isDisabled={!selectedCompanyId}
                >
                  Ejecutar
                </Button>
                <Button
                  className="h-12 bg-white/10 text-white font-black uppercase rounded-2xl"
                  onPress={() => setStep(1)}
                >
                  Volver
                </Button>
                <Button
                  className="h-12 bg-primary text-black font-black uppercase rounded-2xl"
                  onPress={() => setStep(3)}
                >
                  Continuar
                </Button>
              </div>

              {bootstrapDone && (
                <p className="text-[10px] text-green-400 font-black uppercase tracking-widest">
                  Bootstrap completado correctamente.
                </p>
              )}
            </CardBody>
          </Card>
        )}

        {step === 3 && (
          <Card className="bg-dark-100/70 border border-white/10 rounded-[2rem]">
            <CardBody className="p-5 sm:p-6 space-y-4">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                Paso 3 • Primer admin de empresa
              </p>

              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="h-12 rounded-2xl bg-white/5 border border-white/10 px-4 text-white font-bold w-full"
              >
                <option value="" disabled>
                  Seleccionar empresa
                </option>
                {companies.map((company: any) => (
                  <option key={company._id} value={company._id} className="text-black">
                    {company.name}
                  </option>
                ))}
              </select>

              <Input
                label="Usuario"
                labelPlacement="outside"
                placeholder="admin_club"
                value={adminUsername}
                onValueChange={setAdminUsername}
                isInvalid={Boolean(usernameError)}
                errorMessage={usernameError}
                classNames={{
                  inputWrapper: "bg-white/5 border-white/10 h-12 rounded-2xl",
                  input: "text-white font-bold",
                  label: "text-gray-400 text-[10px] font-black uppercase tracking-widest",
                }}
              />

              <Input
                label="Contraseña"
                labelPlacement="outside"
                placeholder="••••••••"
                type="password"
                value={adminPassword}
                onValueChange={setAdminPassword}
                isInvalid={Boolean(passwordError)}
                errorMessage={passwordError}
                classNames={{
                  inputWrapper: "bg-white/5 border-white/10 h-12 rounded-2xl",
                  input: "text-white font-bold",
                  label: "text-gray-400 text-[10px] font-black uppercase tracking-widest",
                }}
              />

              <Input
                label="Teléfono (opcional)"
                labelPlacement="outside"
                placeholder="54911..."
                value={adminPhone}
                onValueChange={setAdminPhone}
                isInvalid={Boolean(phoneError)}
                errorMessage={phoneError}
                classNames={{
                  inputWrapper: "bg-white/5 border-white/10 h-12 rounded-2xl",
                  input: "text-white font-bold",
                  label: "text-gray-400 text-[10px] font-black uppercase tracking-widest",
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  className="h-12 bg-white/10 text-white font-black uppercase rounded-2xl"
                  onPress={() => setStep(2)}
                >
                  Volver
                </Button>
                <Button
                  className="h-12 bg-primary text-black font-black uppercase rounded-2xl"
                  isLoading={createAdmin.isPending}
                  onPress={handleCreateAdmin}
                  isDisabled={!selectedCompanyId || tenantAdmins.length > 0}
                >
                  Crear Admin
                </Button>
              </div>

              {tenantAdmins.length > 0 && (
                <p className="text-[10px] text-green-400 font-black uppercase tracking-widest">
                  Setup completado: ya existe al menos un admin de empresa.
                </p>
              )}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
};
