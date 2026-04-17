import { Button, Card, CardBody, Input, Select, SelectItem } from "@heroui/react";
import {
  composePhoneForStorage,
  parseStoredPhone,
  PHONE_COUNTRY_OPTIONS,
  type PhoneCountryId,
} from "../../../utils/phone";

type AdminStepProps = {
  companies: any[];
  selectedCompanyId: string;
  adminUsername: string;
  adminPassword: string;
  adminPhone: string;
  usernameError: string;
  passwordError: string;
  phoneError: string;
  createAdminPending: boolean;
  hasTenantAdmin: boolean;
  onSelectCompany: (id: string) => void;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onBack: () => void;
  onCreateAdmin: () => void;
};

export const AdminStep = ({
  companies,
  selectedCompanyId,
  adminUsername,
  adminPassword,
  adminPhone,
  usernameError,
  passwordError,
  phoneError,
  createAdminPending,
  hasTenantAdmin,
  onSelectCompany,
  onUsernameChange,
  onPasswordChange,
  onPhoneChange,
  onBack,
  onCreateAdmin,
}: AdminStepProps) => {
  const { countryId: phoneCountryId, localNumber: phoneLocalNumber } = parseStoredPhone(adminPhone);

  return (
    <Card className="bg-dark-100/70 border border-black/10 dark:border-white/10 rounded-[2rem]">
      <CardBody className="p-5 sm:p-6 space-y-4">
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
          Paso 3 • Primer admin de empresa
        </p>

        <select
          value={selectedCompanyId}
          onChange={(event) => onSelectCompany(event.target.value)}
          className="h-12 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 px-4 text-foreground font-bold w-full"
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
          onValueChange={onUsernameChange}
          isInvalid={Boolean(usernameError)}
          errorMessage={usernameError}
          classNames={{
            inputWrapper: "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 h-12 rounded-2xl",
            input: "text-foreground font-bold",
            label: "text-gray-400 text-[10px] font-black uppercase tracking-widest",
          }}
        />

        <Input
          label="Contraseña"
          labelPlacement="outside"
          placeholder="••••••••"
          type="password"
          value={adminPassword}
          onValueChange={onPasswordChange}
          isInvalid={Boolean(passwordError)}
          errorMessage={passwordError}
          classNames={{
            inputWrapper: "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 h-12 rounded-2xl",
            input: "text-foreground font-bold",
            label: "text-gray-400 text-[10px] font-black uppercase tracking-widest",
          }}
        />

        <div className="flex gap-2">
          <Select
            label="País"
            labelPlacement="outside"
            selectedKeys={[phoneCountryId]}
            onSelectionChange={(keys) => {
              const nextCountryId = Array.from(keys)[0] as PhoneCountryId;
              if (!nextCountryId) return;
              onPhoneChange(composePhoneForStorage(nextCountryId, phoneLocalNumber));
            }}
            className="w-44 shrink-0"
            classNames={{
              trigger: "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 h-12 rounded-2xl",
              value: "text-foreground font-bold",
              label: "text-gray-400 text-[10px] font-black uppercase tracking-widest",
            }}
          >
            {PHONE_COUNTRY_OPTIONS.map((country) => (
              <SelectItem key={country.id}>
                {country.label} ({country.dialCode})
              </SelectItem>
            ))}
          </Select>
          <Input
            label="Teléfono (opcional)"
            labelPlacement="outside"
            placeholder="Número (sin prefijo)"
            value={phoneLocalNumber}
            onValueChange={(value) => onPhoneChange(composePhoneForStorage(phoneCountryId, value))}
            isInvalid={Boolean(phoneError)}
            errorMessage={phoneError}
            className="flex-grow"
            classNames={{
              inputWrapper: "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 h-12 rounded-2xl",
              input: "text-foreground font-bold",
              label: "text-gray-400 text-[10px] font-black uppercase tracking-widest",
            }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            className="h-12 bg-black/10 dark:bg-white/10 text-foreground font-black uppercase rounded-2xl"
            onPress={onBack}
          >
            Volver
          </Button>
          <Button
            className="h-12 bg-primary text-black font-black uppercase rounded-2xl"
            isLoading={createAdminPending}
            onPress={onCreateAdmin}
            isDisabled={!selectedCompanyId || hasTenantAdmin}
          >
            Crear Admin
          </Button>
        </div>

        {hasTenantAdmin && (
          <p className="text-[10px] text-green-400 font-black uppercase tracking-widest">
            Setup completado: ya existe al menos un admin de empresa.
          </p>
        )}
      </CardBody>
    </Card>
  );
};
