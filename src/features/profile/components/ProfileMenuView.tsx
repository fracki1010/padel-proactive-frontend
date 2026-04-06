import { Avatar, Button, Card, CardBody, Chip, Divider, Input, Switch } from "@heroui/react";
import {
  Bell,
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
  courtsCount: number;
  phoneNumber: string;
  whatsappEnabled: boolean;
  whatsappStatus: string;
  whatsappStatusLabelByKey: Record<string, string>;
  updateProfilePending: boolean;
  onPhoneChange: (value: string) => void;
  onSavePhone: () => void;
  onGoToCourts: () => void;
  onGoToWhatsapp: () => void;
  onGoToSchedule: () => void;
  onGoToTenants: () => void;
  onLogout: () => void;
};

export const ProfileMenuView = ({
  user,
  isSuperAdmin,
  courtsCount,
  phoneNumber,
  whatsappEnabled,
  whatsappStatus,
  whatsappStatusLabelByKey,
  updateProfilePending,
  onPhoneChange,
  onSavePhone,
  onGoToCourts,
  onGoToWhatsapp,
  onGoToSchedule,
  onGoToTenants,
  onLogout,
}: ProfileMenuViewProps) => {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <Avatar
            src="https://api.dicebear.com/9.x/fun-emoji/svg?seed=AdminPadel"
            className="w-32 h-32 rounded-[2.5rem] border-4 border-primary shadow-2xl shadow-primary/20"
          />
          <div className="absolute -bottom-2 -right-2 bg-primary text-black p-2 rounded-2xl border-4 border-dark-200">
            <Shield size={20} fill="currentColor" />
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">
            {user?.username || "Admin Padel"}
          </h2>
          <p className="text-primary font-bold text-sm tracking-widest uppercase mt-1">
            {isSuperAdmin ? "Super Admin" : "Administrador"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-dark-100 border border-white/5 rounded-3xl">
          <CardBody className="p-4 flex flex-col items-center border border-white/5">
            <p className="text-[10px] font-black text-gray-500 uppercase">
              Canchas
            </p>
            <p className="text-2xl font-black text-white">{courtsCount}</p>
          </CardBody>
        </Card>
        <Card className="bg-dark-100 border border-white/5 rounded-3xl">
          <CardBody className="p-4 flex flex-col items-center border border-white/5">
            <p className="text-[10px] font-black text-gray-500 uppercase">
              Estado
            </p>
            <Chip
              color="success"
              size="sm"
              variant="flat"
              className="font-bold border border-white/5"
            >
              Online
            </Chip>
          </CardBody>
        </Card>
      </div>

      <section className="bg-dark-100 p-6 rounded-[2.5rem] border border-white/5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Phone size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              WhatsApp Admin
            </p>
            <p className="text-white font-bold text-sm">Para notificaciones</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            value={phoneNumber}
            onValueChange={onPhoneChange}
            placeholder="549351..."
            className="flex-grow"
            classNames={{
              inputWrapper: "bg-white/5 border-none h-12 rounded-2xl px-4",
              input: "text-white font-bold",
            }}
          />
          <Button
            isIconOnly
            className="h-12 w-12 bg-primary text-black rounded-2xl"
            onPress={onSavePhone}
            isLoading={updateProfilePending}
          >
            <Save size={20} />
          </Button>
        </div>
        <p className="text-[10px] text-gray-500 font-bold italic">
          * Este número recibirá las alertas de nuevos turnos vía WhatsApp.
        </p>
      </section>

      <div className="space-y-6">
        <section>
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4 px-2">
            Gestión del Club
          </h3>
          <div className="space-y-3">
            <div
              onClick={onGoToCourts}
              className="bg-dark-100 p-4 rounded-3xl border border-white/5 flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="font-bold text-white uppercase text-sm">
                    Mis Canchas
                  </p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">
                    {courtsCount} canchas activas
                  </p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-600" />
            </div>

            <div
              onClick={onGoToWhatsapp}
              className="bg-dark-100 p-4 rounded-3xl border border-white/5 flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all">
                  <QrCode size={20} />
                </div>
                <div>
                  <p className="font-bold text-white uppercase text-sm">
                    WhatsApp Web
                  </p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">
                    {!whatsappEnabled
                      ? "Desactivado"
                      : whatsappStatus === "ready"
                        ? "Conectado"
                        : whatsappStatus === "qr_pending"
                          ? "QR pendiente"
                          : "Estado: " + (whatsappStatusLabelByKey[whatsappStatus] || whatsappStatus)}
                  </p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-600" />
            </div>

            <div
              onClick={onGoToSchedule}
              className="bg-dark-100 p-4 rounded-3xl border border-white/5 flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all font-bold"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                  <Target size={20} />
                </div>
                <div>
                  <p className="font-bold text-white uppercase text-sm">
                    Precios y Horarios
                  </p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">
                    Configurar tarifas
                  </p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-600" />
            </div>

            {isSuperAdmin && (
              <div
                onClick={onGoToTenants}
                className="bg-dark-100 p-4 rounded-3xl border border-white/5 flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all font-bold"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-white uppercase text-sm">
                      Multiempresa
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">
                      Empresas y admins
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-600" />
              </div>
            )}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4 px-2">
            Preferencias
          </h3>
          <div className="bg-dark-100 p-2 rounded-[2rem] border border-white/5 space-y-1">
            <div className="flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-colors">
              <div className="flex items-center gap-4">
                <Bell size={18} className="text-gray-400" />
                <span className="font-bold text-white text-sm">
                  Notificaciones Push
                </span>
              </div>
              <Switch defaultSelected color="primary" size="sm" />
            </div>
            <Divider className="bg-white/5 mx-4" />
            <div className="flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-colors">
              <div className="flex items-center gap-4">
                <CreditCard size={18} className="text-gray-400" />
                <span className="font-bold text-white text-sm">
                  Pagos Online
                </span>
              </div>
              <Switch defaultSelected color="primary" size="sm" />
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
