import { Avatar, Button, Card, CardBody, Chip, Input, Switch } from "@heroui/react";
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
  "w-full bg-dark-100 p-4 rounded-3xl border border-black/5 dark:border-white/5 flex items-center justify-between group cursor-pointer hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all";

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
    <div className="space-y-8 pb-10 max-w-6xl mx-auto">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <Avatar
            src={avatarSrc}
            className="w-32 h-32 rounded-[2.5rem] border-4 border-primary shadow-2xl shadow-primary/20"
          />
          <div className="absolute -bottom-2 -right-2 bg-primary text-black p-2 rounded-2xl border-4 border-dark-200">
            <Shield size={20} fill="currentColor" />
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-black text-foreground italic tracking-tighter uppercase">
            {adminName}
          </h2>
          <p className="text-primary font-bold text-sm tracking-widest uppercase mt-1">
            {isSuperAdmin ? "Super Admin" : "Administrador"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-dark-100 border border-black/5 dark:border-white/5 rounded-3xl">
          <CardBody className="p-4 flex flex-col items-center border border-black/5 dark:border-white/5">
            <p className="text-[10px] font-black text-gray-500 uppercase">
              Canchas
            </p>
            <p className="text-2xl font-black text-foreground">{courtsCount}</p>
          </CardBody>
        </Card>
        <Card className="bg-dark-100 border border-black/5 dark:border-white/5 rounded-3xl">
          <CardBody className="p-4 flex flex-col items-center border border-black/5 dark:border-white/5">
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

      <section className="bg-dark-100 p-6 rounded-[2.5rem] border border-black/5 dark:border-white/5 space-y-4">
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

        <div className="flex gap-2">
          <Input
            value={phoneNumber}
            onValueChange={(value) =>
              onPhoneChange(value.replace(/[^\d]/g, "").slice(0, 15))
            }
            placeholder="549351..."
            className="flex-grow"
            type="tel"
            inputMode="numeric"
            classNames={{
              inputWrapper: "bg-black/5 dark:bg-white/5 border-none h-12 rounded-2xl px-4",
              input: "text-foreground font-bold",
            }}
          />
          <Button
            className="h-12 min-w-28 bg-primary text-black rounded-2xl font-black uppercase"
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

      <div className="space-y-6">
        <section>
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4 px-2">
            Gestión del Club
          </h3>
          <div className="space-y-3">
            <MenuItemButton
              onPress={onGoToCourts}
              title="Mis Canchas"
              subtitle={`${courtsCount} canchas activas`}
              icon={<MapPin size={20} />}
              iconClassName="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all"
            />

            <MenuItemButton
              onPress={onGoToWhatsapp}
              title="WhatsApp Web"
              subtitle={whatsappDisplayStatus}
              icon={<QrCode size={20} />}
              iconClassName="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all"
            />

            <MenuItemButton
              onPress={onGoToBotAutomation}
              title="Automatización del Bot"
              subtitle="Avisos, confianza y penalizaciones"
              icon={<Bot size={20} />}
              iconClassName="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-all"
            />

            <MenuItemButton
              onPress={onGoToSchedule}
              title="Precios y Horarios"
              subtitle="Configurar tarifas"
              icon={<Target size={20} />}
              iconClassName="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all"
            />

            {canManageClubData && (
              <MenuItemButton
                onPress={onGoToTenants}
                title={isSuperAdmin ? "Multiempresa" : "Datos del club"}
                subtitle={isSuperAdmin ? "Empresas y admins" : "Nombre, slug y dirección"}
                icon={<Building2 size={20} />}
                iconClassName="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all"
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
          <div className="bg-dark-100 p-2 rounded-[2rem] border border-black/5 dark:border-white/5 space-y-1">
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
          className="h-16 bg-red-500/10 text-red-500 font-black rounded-3xl uppercase tracking-widest border border-red-500/20"
          startContent={<LogOut size={20} />}
          onPress={onLogout}
        >
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
};
