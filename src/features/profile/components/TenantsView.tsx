import { addToast, Button, Card, CardBody, Chip, Input, Switch } from "@heroui/react";
import {
  Building2,
  ChevronLeft,
  Copy,
  ExternalLink,
  Link2,
  MapPin,
  PencilLine,
  Save,
} from "lucide-react";
import { useEffect, useState } from "react";

type TenantsViewProps = {
  isSuperAdmin: boolean;
  companies: any[];
  admins: any[];
  companyNameInput: string;
  newAdminUsername: string;
  newAdminPassword: string;
  newAdminPhone: string;
  newAdminCompanyId: string;
  createCompanyPending: boolean;
  updateCompanyPending: boolean;
  bootstrapPending: boolean;
  createAdminPending: boolean;
  onBack: () => void;
  onCompanyNameChange: (value: string) => void;
  onAdminUsernameChange: (value: string) => void;
  onAdminPasswordChange: (value: string) => void;
  onAdminPhoneChange: (value: string) => void;
  onAdminCompanyChange: (value: string) => void;
  onCreateCompany: () => void;
  onBootstrapTenant: () => void;
  onCreateAdmin: () => void;
  onUpdateCompanyStatus: (id: string, isActive: boolean) => void;
  onUpdateCompany: (
    id: string,
    data: { name?: string; slug?: string; address?: string },
  ) => void;
  onUpdateAdminStatus: (id: string, isActive: boolean) => void;
};

export const TenantsView = ({
  isSuperAdmin,
  companies,
  admins,
  companyNameInput,
  newAdminUsername,
  newAdminPassword,
  newAdminPhone,
  newAdminCompanyId,
  createCompanyPending,
  updateCompanyPending,
  bootstrapPending,
  createAdminPending,
  onBack,
  onCompanyNameChange,
  onAdminUsernameChange,
  onAdminPasswordChange,
  onAdminPhoneChange,
  onAdminCompanyChange,
  onCreateCompany,
  onBootstrapTenant,
  onCreateAdmin,
  onUpdateCompanyStatus,
  onUpdateCompany,
  onUpdateAdminStatus,
}: TenantsViewProps) => {
  const [nameDraftByCompany, setNameDraftByCompany] = useState<Record<string, string>>({});
  const [slugDraftByCompany, setSlugDraftByCompany] = useState<Record<string, string>>({});
  const [addressDraftByCompany, setAddressDraftByCompany] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    setNameDraftByCompany((prev) =>
      companies.reduce((acc: Record<string, string>, company: any) => {
        const hasDraft = Object.prototype.hasOwnProperty.call(prev, company._id);
        acc[company._id] = hasDraft ? prev[company._id] : String(company.name || "");
        return acc;
      }, {}),
    );
    setSlugDraftByCompany((prev) =>
      companies.reduce((acc: Record<string, string>, company: any) => {
        const hasDraft = Object.prototype.hasOwnProperty.call(prev, company._id);
        acc[company._id] = hasDraft ? prev[company._id] : String(company.slug || "");
        return acc;
      }, {}),
    );
    setAddressDraftByCompany((prev) =>
      companies.reduce((acc: Record<string, string>, company: any) => {
        const hasDraft = Object.prototype.hasOwnProperty.call(prev, company._id);
        acc[company._id] = hasDraft ? prev[company._id] : String(company.address || "");
        return acc;
      }, {}),
    );
  }, [companies]);

  const updateAddressDraft = (companyId: string, value: string) => {
    setAddressDraftByCompany((prev) => ({ ...prev, [companyId]: value }));
  };

  const updateNameDraft = (companyId: string, value: string) => {
    setNameDraftByCompany((prev) => ({ ...prev, [companyId]: value }));
  };

  const updateSlugDraft = (companyId: string, value: string) => {
    setSlugDraftByCompany((prev) => ({ ...prev, [companyId]: value }));
  };

  const handleSaveCompany = (company: any) => {
    const nextName = String(nameDraftByCompany[company._id] || "").trim();
    const nextSlug = String(slugDraftByCompany[company._id] || "").trim();
    const nextAddress = String(addressDraftByCompany[company._id] || "").trim();
    const currentName = String(company.name || "").trim();
    const currentSlug = String(company.slug || "").trim();
    const currentAddress = String(company.address || "").trim();

    if (!nextName) {
      addToast({ title: "El nombre del club es obligatorio", color: "danger" });
      return;
    }

    if (nextSlug && !/^[a-z0-9-]+$/.test(nextSlug)) {
      addToast({
        title: "El slug solo puede tener minúsculas, números y guiones",
        color: "danger",
      });
      return;
    }

    if (
      nextName === currentName &&
      nextSlug === currentSlug &&
      nextAddress === currentAddress
    ) {
      addToast({ title: "No hay cambios para guardar", color: "warning" });
      return;
    }

    onUpdateCompany(company._id, {
      name: nextName,
      slug: nextSlug || undefined,
      address: nextAddress,
    });
  };

  const handleCopyAddress = async (company: any) => {
    const address = String(addressDraftByCompany[company._id] || company.address || "").trim();
    if (!address) {
      addToast({ title: "Este club no tiene dirección cargada", color: "warning" });
      return;
    }
    try {
      await navigator.clipboard.writeText(address);
      addToast({ title: "Dirección copiada", color: "success" });
    } catch {
      addToast({ title: "No se pudo copiar la dirección", color: "danger" });
    }
  };

  const handleOpenMaps = (company: any) => {
    const address = String(addressDraftByCompany[company._id] || company.address || "").trim();
    if (!address) {
      addToast({ title: "Este club no tiene dirección cargada", color: "warning" });
      return;
    }
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  };

  const hasCompanyChanges = (company: any) => {
    const nextName = String(nameDraftByCompany[company._id] || "").trim();
    const nextSlug = String(slugDraftByCompany[company._id] || "").trim();
    const nextAddress = String(addressDraftByCompany[company._id] || "").trim();
    const currentName = String(company.name || "").trim();
    const currentSlug = String(company.slug || "").trim();
    const currentAddress = String(company.address || "").trim();

    return (
      nextName !== currentName ||
      nextSlug !== currentSlug ||
      nextAddress !== currentAddress
    );
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-8">
      <div className="flex items-center gap-4">
        <Button
          isIconOnly
          variant="flat"
          onClick={onBack}
          className="bg-white/5 text-white rounded-2xl"
        >
          <ChevronLeft size={20} />
        </Button>
        <div>
          <h3 className="text-xl font-black text-white uppercase italic">
            {isSuperAdmin ? "Multiempresa" : "Datos del club"}
          </h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
            {isSuperAdmin
              ? "Gestioná empresas y administradores"
              : "Editá nombre, slug y dirección de tu club"}
          </p>
        </div>
      </div>

      {isSuperAdmin && (
        <Card className="bg-dark-100 border border-white/5 rounded-[2rem]">
          <CardBody className="p-6 space-y-3">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              Crear Empresa / Bootstrap
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={companyNameInput}
                onValueChange={onCompanyNameChange}
                placeholder="Nombre de empresa"
                className="flex-grow"
                classNames={{
                  inputWrapper: "bg-white/5 border-none h-12 rounded-2xl px-4",
                  input: "text-white font-bold",
                }}
              />
              <Button
                className="h-12 bg-primary text-black font-black rounded-2xl uppercase text-[10px]"
                onPress={onCreateCompany}
                isLoading={createCompanyPending}
              >
                Crear
              </Button>
              <Button
                className="h-12 bg-blue-500 text-white font-black rounded-2xl uppercase text-[10px]"
                onPress={onBootstrapTenant}
                isLoading={bootstrapPending}
              >
                Bootstrap
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {isSuperAdmin && (
        <Card className="bg-dark-100 border border-white/5 rounded-[2rem]">
          <CardBody className="p-6 space-y-3">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              Crear Admin de Empresa
            </p>
            <Input
              value={newAdminUsername}
              onValueChange={onAdminUsernameChange}
              placeholder="Usuario admin"
              classNames={{
                inputWrapper: "bg-white/5 border-none h-12 rounded-2xl px-4",
                input: "text-white font-bold",
              }}
            />
            <Input
              value={newAdminPassword}
              onValueChange={onAdminPasswordChange}
              placeholder="Contraseña"
              type="password"
              classNames={{
                inputWrapper: "bg-white/5 border-none h-12 rounded-2xl px-4",
                input: "text-white font-bold",
              }}
            />
            <Input
              value={newAdminPhone}
              onValueChange={onAdminPhoneChange}
              placeholder="Teléfono (opcional)"
              classNames={{
                inputWrapper: "bg-white/5 border-none h-12 rounded-2xl px-4",
                input: "text-white font-bold",
              }}
            />
            <select
              value={newAdminCompanyId}
              onChange={(event) => onAdminCompanyChange(event.target.value)}
              className="h-12 rounded-2xl bg-white/5 border-none px-4 text-white font-bold"
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
            <Button
              className="h-12 bg-primary text-black font-black rounded-2xl uppercase text-[10px]"
              onPress={onCreateAdmin}
              isLoading={createAdminPending}
            >
              Crear Admin
            </Button>
          </CardBody>
        </Card>
      )}

      <div className="space-y-3">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">
          {isSuperAdmin ? "Empresas" : "Mi club"}
        </p>
        {companies.length === 0 && (
          <Card className="bg-dark-100 border border-white/5 rounded-[1.5rem]">
            <CardBody className="p-6 text-center">
              <p className="text-sm font-bold text-white">No hay clubes para mostrar</p>
              <p className="text-[11px] text-gray-500 mt-1">
                Cuando exista una empresa asignada, va a aparecer acá.
              </p>
            </CardBody>
          </Card>
        )}
        {companies.map((company: any) => (
          <Card
            key={company._id}
            className="bg-dark-100 border border-white/5 rounded-[1.8rem] overflow-hidden"
          >
            <CardBody className="p-0">
              <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-r from-white/[0.06] to-transparent">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                        <Building2 size={16} />
                      </div>
                      <p className="font-black text-white text-base truncate">
                        {company.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Chip
                        size="sm"
                        variant="flat"
                        className="bg-white/10 text-gray-200 font-bold uppercase text-[10px]"
                      >
                        {company.slug || "sin-slug"}
                      </Chip>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={company.isActive ? "success" : "danger"}
                        className="font-black uppercase text-[10px]"
                      >
                        {company.isActive ? "Activo" : "Inactivo"}
                      </Chip>
                    </div>
                  </div>
                  <Switch
                    isSelected={Boolean(company.isActive)}
                    onValueChange={(value) => onUpdateCompanyStatus(company._id, value)}
                    isDisabled={!isSuperAdmin}
                    color="primary"
                    size="sm"
                  />
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider mb-1.5">
                      Nombre del club
                    </p>
                    <Input
                      value={nameDraftByCompany[company._id] ?? String(company.name || "")}
                      onValueChange={(value) => updateNameDraft(company._id, value)}
                      placeholder="Ej: Padel Center Norte"
                      startContent={<PencilLine size={14} className="text-gray-500" />}
                      classNames={{
                        inputWrapper:
                          "bg-white/5 border-white/10 data-[hover=true]:border-white/20 rounded-xl h-11",
                        input: "text-sm text-white font-bold",
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider mb-1.5">
                      Slug
                    </p>
                    <Input
                      value={slugDraftByCompany[company._id] ?? String(company.slug || "")}
                      onValueChange={(value) => updateSlugDraft(company._id, value)}
                      placeholder="padel-center-norte"
                      startContent={<Link2 size={14} className="text-gray-500" />}
                      classNames={{
                        inputWrapper:
                          "bg-white/5 border-white/10 data-[hover=true]:border-white/20 rounded-xl h-11",
                        input: "text-sm text-white",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider mb-1.5">
                    Dirección
                  </p>
                  <Input
                    value={addressDraftByCompany[company._id] ?? String(company.address || "")}
                    onValueChange={(value) => updateAddressDraft(company._id, value)}
                    placeholder="Dirección del club"
                    startContent={<MapPin size={14} className="text-gray-500" />}
                    classNames={{
                      inputWrapper:
                        "bg-white/5 border-white/10 data-[hover=true]:border-white/20 rounded-xl h-11",
                      input: "text-sm text-white",
                    }}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <Button
                    className="h-11 bg-primary text-black font-black rounded-xl uppercase text-[10px] sm:min-w-[160px]"
                    isLoading={updateCompanyPending}
                    onPress={() => handleSaveCompany(company)}
                    startContent={<Save size={14} />}
                    isDisabled={!hasCompanyChanges(company)}
                  >
                    Guardar Info
                  </Button>
                  <Button
                    className="h-11 bg-white/10 text-white font-black rounded-xl uppercase text-[10px]"
                    variant="flat"
                    onPress={() => handleCopyAddress(company)}
                    startContent={<Copy size={14} />}
                  >
                    Copiar
                  </Button>
                  <Button
                    className="h-11 bg-white/10 text-white font-black rounded-xl uppercase text-[10px]"
                    variant="flat"
                    onPress={() => handleOpenMaps(company)}
                    startContent={<ExternalLink size={14} />}
                  >
                    Maps
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {isSuperAdmin && (
        <div className="space-y-3">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">
            Admins
          </p>
          {admins.map((admin: any) => (
            <Card
              key={admin._id}
              className="bg-dark-100 border border-white/5 rounded-[1.5rem]"
            >
              <CardBody className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-white">{admin.username}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">
                    {admin.companyId?.name || "Sin empresa"} • {admin.role}
                  </p>
                </div>
                <Switch
                  isSelected={Boolean(admin.isActive)}
                  onValueChange={(value) => onUpdateAdminStatus(admin._id, value)}
                  color="primary"
                  size="sm"
                />
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
