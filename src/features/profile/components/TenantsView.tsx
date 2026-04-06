import { Button, Card, CardBody, Input, Switch } from "@heroui/react";
import { ChevronLeft } from "lucide-react";

type TenantsViewProps = {
  companies: any[];
  admins: any[];
  companyNameInput: string;
  newAdminUsername: string;
  newAdminPassword: string;
  newAdminPhone: string;
  newAdminCompanyId: string;
  createCompanyPending: boolean;
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
  onUpdateAdminStatus: (id: string, isActive: boolean) => void;
};

export const TenantsView = ({
  companies,
  admins,
  companyNameInput,
  newAdminUsername,
  newAdminPassword,
  newAdminPhone,
  newAdminCompanyId,
  createCompanyPending,
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
  onUpdateAdminStatus,
}: TenantsViewProps) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4">
        <Button
          isIconOnly
          variant="flat"
          onClick={onBack}
          className="bg-white/5 text-white rounded-2xl"
        >
          <ChevronLeft size={20} />
        </Button>
        <h3 className="text-xl font-black text-white uppercase italic">
          Multiempresa
        </h3>
      </div>

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

      <div className="space-y-3">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">
          Empresas
        </p>
        {companies.map((company: any) => (
          <Card
            key={company._id}
            className="bg-dark-100 border border-white/5 rounded-[1.5rem]"
          >
            <CardBody className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-white">{company.name}</p>
                <p className="text-[10px] text-gray-500 uppercase font-bold">
                  {company.slug}
                </p>
              </div>
              <Switch
                isSelected={Boolean(company.isActive)}
                onValueChange={(value) => onUpdateCompanyStatus(company._id, value)}
                color="primary"
                size="sm"
              />
            </CardBody>
          </Card>
        ))}
      </div>

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
    </div>
  );
};
