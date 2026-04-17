import { Avatar, Button, Card, CardBody, Chip, Input, Select, SelectItem, Switch } from "@heroui/react";
import type { ReactNode } from "react";
import {
  Bot,
  Building2,
  ChevronRight,
  CreditCard,
  LogOut,
  MapPin,
  Phone,
  QrCode,
  Save,
  Shield,
  Target,
} from "lucide-react";
import {
  composePhoneForStorage,
  parseStoredPhone,
  PHONE_COUNTRY_OPTIONS,
  type PhoneCountryId,
} from "../../../utils/phone";

type ProfileMenuViewProps = {
  user: any;
  isSuperAdmin: boolean;
  canManageClubData: boolean;
  courtsCount: number;
  phoneNumber: string;
  savedPhoneNumber: string;
  whatsappEnabled: boolean;
  whatsappStatus: string;
  whatsappStatusLabelByKey: Record<string, string>;
  updateProfilePending: boolean;
  isDarkMode: boolean;
  onPhoneChange: (value: string) => void;
  onSavePhone: () => void;
  onToggleTheme: () => void;
  onGoToCourts: () => void;
  onGoToWhatsapp: () => void;
  onGoToSchedule: () => void;
  onGoToBotAutomation: () => void;
  onGoToTenants: () => void;
  onLogout: () => void;
};

type MenuItemButtonProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  iconClassName: string;
};

const menuItemBaseClass =
  "w-full bg-dark-100 p-4 rounded-2xl lg:rounded-xl border border-black/5 dark:border-white/5 flex items-center justify-between group cursor-pointer hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all";

const MenuItemButton = ({
  icon,
  title,
  subtitle,
  onPress,
  iconClassName,
}: MenuItemButtonProps) => (
  <button type="button" onClick={onPress} className={menuItemBaseClass}>
    <div className="flex items-center gap-4 text-left">
      <div className={iconClassName}>{icon}</div>
      <div>
        <p className="font-bold text-foreground uppercase text-sm">{title}</p>
        <p className="text-[10px] text-gray-500 font-bold uppercase">{subtitle}</p>
      </div>
    </div>
    <ChevronRight size={20} className="text-gray-600" />
  </button>
);

export const ProfileMenuView = ({
  user,
  isSuperAdmin,
  canManageClubData,
  courtsCount,
  phoneNumber,
  savedPhoneNumber,
  whatsappEnabled,
  whatsappStatus,
  whatsappStatusLabelByKey,
  updateProfilePending,
  isDarkMode,
  onPhoneChange,
  onSavePhone,
  onToggleTheme,
  onGoToCourts,
  onGoToWhatsapp,
  onGoToSchedule,
  onGoToBotAutomation,
  onGoToTenants,
  onLogout,
}: ProfileMenuViewProps) => {
  const adminName = (user?.name || user?.username || "Admin PADEXA").trim();
  const avatarSeed = encodeURIComponent(adminName || user?.id || "AdminPADEXA");
  const avatarSrc = `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${avatarSeed}`;
  const normalizedPhoneNumber = phoneNumber.replace(/\D/g, "");
  const normalizedSavedPhoneNumber = savedPhoneNumber.replace(/\D/g, "");
  const { countryId: phoneCountryId, localNumber: phoneLocalNumber } = parseStoredPhone(phoneNumber);
  const phoneHasEnoughDigits = normalizedPhoneNumber.length >= 10;
  const phoneHasChanges = normalizedPhoneNumber !== normalizedSavedPhoneNumber;
  const canSavePhone = phoneHasEnoughDigits && phoneHasChanges && !updateProfilePending;
  const whatsappDisplayStatus = !whatsappEnabled
    ? "Desactivado"
    : whatsappStatusLabelByKey[whatsappStatus] || whatsappStatus;
  const whatsappStatusClass = !whatsappEnabled
    ? "text-gray-500"
    : whatsappStatus === "ready"
      ? "text-emerald-400"
      : whatsappStatus === "qr_pending"
        ? "text-amber-300"
        : "text-gray-400";

  return (
    <div className="space-y-6 pb-8 max-w-6xl mx-auto lg:max-w-none">
      <div className="flex flex-col items-center text-center gap-4 lg:flex-row lg:items-center lg:justify-between lg:text-left">
        <div className="flex items-center gap-4">
          <div className="relative">
          <Avatar
            src={avatarSrc}
            className="w-24 h-24 lg:w-16 lg:h-16 rounded-[2rem] lg:rounded-xl border-4 border-primary shadow-2xl shadow-primary/20"
          />
          <div className="absolute -bottom-2 -right-2 bg-primary text-black p-2 rounded-2xl border-4 border-dark-200">
            <Shield size={16} fill="currentColor" />
          </div>
          </div>
          <div>
            <h2 className="text-2xl lg:text-xl font-black text-foreground italic tracking-tighter uppercase">
              {adminName}
            </h2>
            <p className="text-primary font-bold text-xs tracking-widest uppercase mt-1">
              {isSuperAdmin ? "Super Admin" : "Administrador"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full lg:w-auto lg:min-w-[260px]">
        <Card className="bg-dark-100 border border-black/5 dark:border-white/5 rounded-3xl">
          <CardBody className="p-3 flex flex-col items-center border border-black/5 dark:border-white/5">
            <p className="text-[10px] font-black text-gray-500 uppercase">
              Canchas
            </p>
            <p className="text-xl font-black text-foreground">{courtsCount}</p>
          </CardBody>
        </Card>
        <Card className="bg-dark-100 border border-black/5 dark:border-white/5 rounded-3xl">
          <CardBody className="p-3 flex flex-col items-center border border-black/5 dark:border-white/5">
            <p className="text-[10px] font-black text-gray-500 uppercase">
              WhatsApp
            </p>
            <Chip
              color={!whatsappEnabled ? "default" : whatsappStatus === "ready" ? "success" : "warning"}
              size="sm"
              variant="flat"
              className="font-bold border border-black/5 dark:border-white/5"
            >
              {whatsappDisplayStatus}
            </Chip>
          </CardBody>
        </Card>
        </div>
      </div>

      <section className="bg-dark-100 p-5 rounded-[2rem] lg:rounded-xl border border-black/5 dark:border-white/5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Phone size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              WhatsApp Admin
            </p>
            <p className="text-foreground font-bold text-sm">Para notificaciones</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[176px_minmax(0,1fr)_auto]">
          <Select
            selectedKeys={[phoneCountryId]}
            onSelectionChange={(keys) => {
              const nextCountryId = Array.from(keys)[0] as PhoneCountryId;
              if (!nextCountryId) return;
              onPhoneChange(composePhoneForStorage(nextCountryId, phoneLocalNumber));
            }}
            className="w-full"
            classNames={{
              trigger: "bg-black/5 dark:bg-white/5 border-none h-12 rounded-2xl px-2",
              value: "text-foreground font-bold",
              popoverContent:
                "bg-dark-200 border border-black/10 dark:border-white/10 text-foreground",
              listbox: "text-foreground",
            }}
          >
            {PHONE_COUNTRY_OPTIONS.map((country) => (
              <SelectItem key={country.id} textValue={`${country.label} (${country.dialCode})`}>
                {country.label} ({country.dialCode})
              </SelectItem>
            ))}
          </Select>
          <Input
            value={phoneLocalNumber}
            onValueChange={(value) => {
              onPhoneChange(composePhoneForStorage(phoneCountryId, value));
            }}
            placeholder="Número (sin prefijo)"
            className="w-full"
            type="tel"
            inputMode="numeric"
            classNames={{
              inputWrapper: "bg-black/5 dark:bg-white/5 border-none h-12 rounded-2xl px-4",
              input: "text-foreground font-bold",
            }}
          />
          <Button
            className="h-12 w-full sm:w-auto sm:min-w-28 bg-primary text-black rounded-2xl font-black uppercase"
            onPress={onSavePhone}
            isDisabled={!canSavePhone}
            isLoading={updateProfilePending}
            startContent={<Save size={16} />}
          >
            Guardar
          </Button>
        </div>
        <p
          className={`text-[10px] font-bold italic ${
            !phoneHasEnoughDigits
              ? "text-amber-300"
              : phoneHasChanges
                ? "text-emerald-300"
                : "text-gray-500"
          }`}
        >
          {!phoneHasEnoughDigits
            ? "* Ingresá al menos 10 dígitos para recibir alertas."
            : phoneHasChanges
              ? "* Número listo para guardar."
              : "* Este número recibirá las alertas de nuevos turnos vía WhatsApp."}
        </p>
      </section>

      <div className="space-y-6 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6 lg:space-y-0">
        <section className="min-w-0">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4 px-2">
            Gestión del Club
          </h3>
          <div className="space-y-3">
            <MenuItemButton
              onPress={onGoToCourts}
              title="Mis Canchas"
              subtitle={`${courtsCount} canchas activas`}
              icon={<MapPin size={18} />}
              iconClassName="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all"
            />

            <MenuItemButton
              onPress={onGoToWhatsapp}
              title="WhatsApp Web"
              subtitle={whatsappDisplayStatus}
              icon={<QrCode size={18} />}
              iconClassName="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all"
            />

            <MenuItemButton
              onPress={onGoToBotAutomation}
              title="Automatización del Bot"
              subtitle="Avisos, confianza y penalizaciones"
              icon={<Bot size={18} />}
              iconClassName="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-all"
            />

            <MenuItemButton
              onPress={onGoToSchedule}
              title="Precios y Horarios"
              subtitle="Configurar tarifas"
              icon={<Target size={18} />}
              iconClassName="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all"
            />

            {canManageClubData && (
              <MenuItemButton
                onPress={onGoToTenants}
                title={isSuperAdmin ? "Multiempresa" : "Datos del club"}
                subtitle={isSuperAdmin ? "Empresas y admins" : "Nombre, slug y dirección"}
                icon={<Building2 size={18} />}
                iconClassName="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all"
              />
            )}
            <p className={`text-[10px] font-bold uppercase px-2 ${whatsappStatusClass}`}>
              WhatsApp actual: {whatsappDisplayStatus}
            </p>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4 px-2">
            Preferencias
          </h3>
          <div className="bg-dark-100 p-2 rounded-2xl border border-black/5 dark:border-white/5 space-y-1">
            <div className="flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-colors">
              <div className="flex items-center gap-4">
                <CreditCard size={18} className="text-gray-400" />
                <div>
                  <span className="font-bold text-foreground text-sm">Tema</span>
                  <p className="text-[10px] font-bold uppercase text-gray-500 tracking-wide">
                    {isDarkMode ? "Dark" : "Light"}
                  </p>
                </div>
              </div>
              <Switch
                isSelected={isDarkMode}
                onValueChange={onToggleTheme}
                color="primary"
                size="sm"
              />
            </div>
          </div>
        </section>

        <Button
          fullWidth
          className="h-14 bg-red-500/10 text-red-500 font-black rounded-2xl uppercase tracking-widest border border-red-500/20"
          startContent={<LogOut size={18} />}
          onPress={onLogout}
        >
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
};
