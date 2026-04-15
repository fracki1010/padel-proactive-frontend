import { useState, useEffect } from "react";
import {
  Input,
  Select,
  SelectItem,
  Button,
  Card,
  CardBody,
  Autocomplete,
  AutocompleteItem,
  Avatar,
  addToast,
} from "@heroui/react";
import {
  useCourts,
  useSlots,
  useCreateBooking,
  useUsers,
} from "../hooks/useData";
import {
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Save,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User as UserIcon,
} from "lucide-react";
import { getInitials, getAvatarColor } from "../utils/avatarUtils";

const normalizePhone = (phone: string) => phone.replace(/\D/g, "");

const hasFullName = (value: string) => {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter((part) => part.length >= 2);

  return parts.length >= 2;
};

const normalizeName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

export const BookingForm = ({
  initialData,
  onCancel,
}: {
  initialData?: any;
  onCancel?: () => void;
}) => {
  const { data: courtsData } = useCourts();
  const { data: slotsData } = useSlots();
  const { data: usersData } = useUsers();
  const createMutation = useCreateBooking();

  const [courtId, setCourtId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("pagado");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const courts = courtsData?.data || [];
  const slots = slotsData?.data || [];
  const users = usersData?.data || [];

  useEffect(() => {
    if (initialData) {
      if (initialData.court?._id) setCourtId(initialData.court._id);
      if (initialData.date) setDate(initialData.date);
      if (initialData.timeSlot?.startTime)
        setTime(initialData.timeSlot.startTime);
      if (initialData.clientName) setClientName(initialData.clientName);
      if (initialData.clientPhone) setClientPhone(initialData.clientPhone);
      if (initialData.paymentStatus)
        setPaymentStatus(initialData.paymentStatus);
    }
  }, [initialData]);

  const handleUserSelect = (name: string) => {
    setClientName(name);
    const existingUser = users.find((u: any) => u.name === name);
    if (existingUser) {
      setClientPhone(existingUser.phoneNumber);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmedClientPhone = clientPhone.trim();
    const trimmedClientName = clientName.trim();
    const normalizedClientPhone = normalizePhone(trimmedClientPhone);
    const normalizedClientName = normalizeName(trimmedClientName);
    const existingUserByName = users.find(
      (u: any) => normalizeName(u.name || "") === normalizedClientName,
    );
    const existingUserByPhone = users.find(
      (u: any) => normalizePhone(u.phoneNumber || "") === normalizedClientPhone,
    );
    const existingUser = existingUserByName || existingUserByPhone;

    if (!courtId || !date || !time || !trimmedClientPhone) {
      const msg = "Completá cancha, fecha, turno y teléfono para continuar.";
      setError(msg);
      addToast({ title: msg, color: "warning" });
      return;
    }

    if (!existingUserByName && !hasFullName(trimmedClientName)) {
      const msg =
        "Ese nombre no está en clientes. Ingresá nombre completo (nombre y apellido) para reservar.";
      setError(msg);
      addToast({ title: msg, color: "warning" });
      return;
    }

    createMutation.mutate(
      {
        courtId,
        date,
        time,
        clientName: existingUser?.name || trimmedClientName,
        clientPhone: trimmedClientPhone,
        paymentStatus,
      },
      {
        onSuccess: () => {
          setSuccess("¡Reserva guardada!");
          addToast({ title: "Turno guardado correctamente", color: "success" });
          setTimeout(() => onCancel?.(), 1500);
        },
        onError: (err: any) => {
          const msg = err.response?.data?.error || "Error al guardar";
          setError(msg);
          addToast({ title: msg, color: "danger" });
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-right-10 duration-500 w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          isIconOnly
          variant="light"
          onPress={onCancel}
          className="text-foreground"
        >
          <ArrowLeft size={24} />
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          {initialData?._id ? "Editar Turno" : "Nueva Reserva"}
        </h1>
      </div>

      {/* Hero Card */}
      <Card className="bg-dark-200 border border-black/5 dark:border-white/5 overflow-hidden rounded-[2rem]">
        <div className="relative h-40 bg-[url('https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
          <CardBody className="relative z-10 p-5 sm:p-6 flex flex-col justify-end h-full">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">
              ID RESERVA: #PDL-882
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              Reserva de Cancha
            </h2>
          </CardBody>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-8 px-0 sm:px-2">
        {error && (
          <div className="bg-red-500/10 text-red-500 p-4 rounded-xl flex items-center gap-3 text-sm font-bold">
            <AlertCircle size={18} /> {error}
          </div>
        )}
        {success && (
          <div className="bg-primary/10 text-primary p-4 rounded-xl flex items-center gap-3 text-sm font-bold">
            <CheckCircle2 size={18} /> {success}
          </div>
        )}

        {/* Client Info Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <UserIcon size={16} className="text-primary" />
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest">
              Información del Cliente
            </h3>
          </div>

          <div className="space-y-6 bg-dark-100/30 p-4 sm:p-6 rounded-3xl border border-black/5 dark:border-white/5">
            <Autocomplete
              label="Nombre del Socio"
              placeholder="Escribe o selecciona un socio"
              labelPlacement="outside"
              inputValue={clientName}
              onInputChange={(value) => {
                setClientName(value);
                if (error) setError("");
              }}
              onSelectionChange={(key) => handleUserSelect(key as string)}
              allowsCustomValue={true}
              classNames={{
                base: "max-w-full",
                popoverContent: "bg-dark-200 border border-black/10 dark:border-white/10 text-foreground",
                listboxWrapper: "bg-dark-200 border border-black/10 dark:border-white/10",
                listbox: "text-foreground",
              }}
              inputProps={{
                classNames: {
                  inputWrapper:
                    "bg-dark-100/50 border-black/10 dark:border-white/10 h-14 rounded-xl",
                  label: "text-gray-400 font-bold mb-2",
                  input: "text-foreground font-bold",
                },
              }}
            >
              {users.map((u: any) => (
                <AutocompleteItem
                  key={u.name}
                  textValue={u.name}
                  className="text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={getInitials(u.name)}
                      className="w-6 h-6 text-[10px]"
                      style={{ backgroundColor: getAvatarColor(u.name) }}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{u.name}</span>
                      <span className="text-xs text-gray-500">
                        {u.phoneNumber}
                      </span>
                    </div>
                  </div>
                </AutocompleteItem>
              ))}
            </Autocomplete>

            <div className="flex gap-2">
              <Input
                label="Teléfono (WhatsApp)"
                placeholder="+54..."
                labelPlacement="outside"
                value={clientPhone}
                onValueChange={(value) => {
                  setClientPhone(value);
                  if (error) setError("");
                }}
                className="flex-grow"
                classNames={{
                  inputWrapper:
                    "bg-dark-100/50 border-black/10 dark:border-white/10 h-14 rounded-xl",
                  label: "text-gray-400 font-bold mb-2",
                  input: "text-foreground font-bold",
                }}
                startContent={
                  <MessageSquare size={18} className="text-gray-500" />
                }
              />
            </div>
            {!!clientName.trim() &&
              !users.some(
                (u: any) => normalizeName(u.name || "") === normalizeName(clientName),
              ) &&
              !hasFullName(clientName) && (
                <p className="text-xs text-orange-400 font-semibold px-1">
                  Cliente no registrado por nombre. Para continuar, ingresá nombre completo
                  (nombre y apellido).
                </p>
              )}
          </div>
        </section>

        {/* Court & Time Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <Calendar size={16} className="text-primary" />
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest">
              Cancha y Horario
            </h3>
          </div>

          <div className="space-y-6 bg-dark-100/30 p-4 sm:p-6 rounded-3xl border border-black/5 dark:border-white/5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Cancha de Padel"
                placeholder="Seleccionar cancha"
                labelPlacement="outside"
                selectedKeys={courtId ? [courtId] : []}
                onSelectionChange={(keys) =>
                  setCourtId(Array.from(keys)[0] as string)
                }
                classNames={{
                  trigger: "bg-dark-100/50 border-black/10 dark:border-white/10 h-14 rounded-xl",
                  label: "text-gray-400 font-bold mb-2",
                  value: "text-foreground font-bold",
                  popoverContent:
                    "bg-dark-200 border border-black/10 dark:border-white/10 text-foreground",
                  listbox: "text-foreground",
                }}
                startContent={<MapPin size={18} className="text-gray-500" />}
              >
                {courts.map((c) => (
                  <SelectItem key={c._id} className="text-foreground">
                    {c.name}
                  </SelectItem>
                ))}
              </Select>
              <Input
                type="date"
                label="Fecha"
                labelPlacement="outside"
                value={date}
                onValueChange={setDate}
                classNames={{
                  inputWrapper:
                    "bg-dark-100/50 border-black/10 dark:border-white/10 h-14 rounded-xl",
                  label: "text-gray-400 font-bold mb-2",
                  input: "text-foreground font-bold",
                }}
              />
            </div>

            <Select
              label="Turno (Horario)"
              placeholder="Seleccionar turno"
              labelPlacement="outside"
              selectedKeys={time ? [time] : []}
              onSelectionChange={(keys) =>
                setTime(Array.from(keys)[0] as string)
              }
              classNames={{
                trigger: "bg-dark-100/50 border-black/10 dark:border-white/10 h-14 rounded-xl",
                label: "text-gray-400 font-bold mb-2",
                value: "text-foreground font-bold",
                popoverContent: "bg-dark-200 border border-black/10 dark:border-white/10 text-foreground",
                listbox: "text-foreground",
              }}
              startContent={<Clock size={18} className="text-gray-500" />}
            >
              {slots.map((s) => (
                <SelectItem
                  key={s.startTime}
                  textValue={s.startTime}
                  className="text-foreground"
                >
                  {s.startTime} - {s.endTime}
                </SelectItem>
              ))}
            </Select>
          </div>
        </section>

        {/* Payment Status */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <CheckCircle2 size={16} className="text-primary" />
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest">
              Estado del Pago
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-dark-100/30 p-4 rounded-[2rem] border border-black/5 dark:border-white/5">
            <Button
              type="button"
              className={`h-14 rounded-2xl font-bold transition-all ${
                paymentStatus === "pagado"
                  ? "bg-primary text-black shadow-lg shadow-primary/20"
                  : "bg-dark-100/50 text-gray-500 border border-black/5 dark:border-white/5"
              }`}
              onClick={() => setPaymentStatus("pagado")}
            >
              <CheckCircle2 size={18} /> Pagado
            </Button>
            <Button
              type="button"
              className={`h-14 rounded-2xl font-bold transition-all ${
                paymentStatus === "pendiente"
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "bg-dark-100/50 text-gray-500 border border-black/5 dark:border-white/5"
              }`}
              onClick={() => setPaymentStatus("pendiente")}
            >
              <AlertCircle size={18} /> Pendiente
            </Button>
          </div>
        </section>

        <Button
          type="submit"
          isLoading={createMutation.isPending}
          className="w-full h-16 bg-primary text-black font-black text-lg rounded-2xl shadow-xl shadow-primary/20 mt-8"
        >
          <Save size={20} /> Guardar Reserva
        </Button>
      </form>
    </div>
  );
};
