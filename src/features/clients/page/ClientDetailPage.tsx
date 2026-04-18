import { useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Select,
  SelectItem,
  Spinner,
  addToast,
  useDisclosure,
} from "@heroui/react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  MessageSquare,
  ShieldAlert,
  Smartphone,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  useAdjustAttendanceCount,
  useClearPenalties,
  useCourts,
  useDeleteUser,
  useSlots,
  useUpdateUser,
  useUserById,
  useUserHistory,
} from "../../../hooks/useData";
import {
  formatCurrency,
  formatDate,
  formatPhoneForDisplay,
  toIsoDateKey,
} from "../../../utils/formatters";
import { UserModal } from "../components/UserModal";
import type { Booking, Court, TimeSlot, User } from "../../../types";

type ClientDetailPageProps = {
  clientId: string;
};

type BookingStatusFilter = "all" | Booking["status"];
type PaymentStatusFilter = "all" | "pagado" | "pendiente" | "none";

type EditableFixedTurn = {
  dayOfWeek: number;
  court: string;
  timeSlot: string;
};

type FixedTurnsEditorProps = {
  initialFixedTurns: User["fixedTurns"];
  courts: Court[];
  slots: TimeSlot[];
  onSave: (fixedTurns: EditableFixedTurn[]) => Promise<void>;
  isSaving: boolean;
};

const mapFixedTurnsToEditable = (fixedTurns: User["fixedTurns"]): EditableFixedTurn[] => {
  if (!Array.isArray(fixedTurns)) return [];

  return fixedTurns.map((fixedTurn) => ({
    dayOfWeek: Number.isInteger(fixedTurn.dayOfWeek) ? fixedTurn.dayOfWeek : 1,
    court: typeof fixedTurn.court === "string" ? fixedTurn.court : fixedTurn.court?._id || "",
    timeSlot:
      typeof fixedTurn.timeSlot === "string"
        ? fixedTurn.timeSlot
        : fixedTurn.timeSlot?._id || "",
  }));
};

const getBookingSortTimestamp = (booking: Booking) => {
  const isoDate = toIsoDateKey(booking.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return 0;

  const [year, month, day] = isoDate.split("-").map(Number);
  const [hourRaw, minuteRaw] = String(booking.timeSlot?.startTime || "00:00").split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  return Date.UTC(
    year,
    month - 1,
    day,
    Number.isFinite(hour) ? hour : 0,
    Number.isFinite(minute) ? minute : 0,
    0,
  );
};

const toShortDate = (value: string) => {
  const isoDate = toIsoDateKey(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return String(value || "--");
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
};

const getStatusChipColor = (status: Booking["status"]) => {
  if (status === "confirmado") return "success";
  if (status === "cancelado") return "danger";
  if (status === "suspendido") return "warning";
  if (status === "reservado") return "primary";
  return "default";
};

const getPaymentChipColor = (paymentStatus?: Booking["paymentStatus"]) => {
  if (paymentStatus === "pagado") return "success";
  if (paymentStatus === "pendiente") return "warning";
  return "default";
};

const FixedTurnsEditor = ({
  initialFixedTurns,
  courts,
  slots,
  onSave,
  isSaving,
}: FixedTurnsEditorProps) => {
  const [fixedTurns, setFixedTurns] = useState<EditableFixedTurn[]>(
    mapFixedTurnsToEditable(initialFixedTurns),
  );

  const handleAddFixedTurn = () => {
    setFixedTurns((prevTurns) => [
      ...prevTurns,
      { dayOfWeek: 1, court: "", timeSlot: "" },
    ]);
  };

  const handleRemoveFixedTurn = (index: number) => {
    setFixedTurns((prevTurns) => prevTurns.filter((_, i) => i !== index));
  };

  const handleUpdateFixedTurn = (
    index: number,
    field: keyof EditableFixedTurn,
    value: string | number,
  ) => {
    setFixedTurns((prevTurns) =>
      prevTurns.map((fixedTurn, turnIndex) =>
        turnIndex === index ? { ...fixedTurn, [field]: value } : fixedTurn,
      ),
    );
  };

  return (
    <Card className="bg-dark-200 border border-black/10 dark:border-white/10 rounded-3xl">
      <CardBody className="p-6 space-y-4">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <h3 className="text-xl font-black text-foreground flex items-center gap-2">
            <Calendar size={18} /> Turnos Fijos
          </h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="flat"
              color="primary"
              className="font-black"
              onPress={handleAddFixedTurn}
            >
              Agregar
            </Button>
            <Button
              size="sm"
              color="primary"
              className="font-black"
              onPress={() => onSave(fixedTurns)}
              isLoading={isSaving}
            >
              Guardar
            </Button>
          </div>
        </div>

        {fixedTurns.length === 0 ? (
          <p className="text-gray-500">No tiene turnos fijos asignados.</p>
        ) : (
          <div className="space-y-3">
            {fixedTurns.map((fixedTurn, index) => (
              <div
                key={`${fixedTurn.court}-${fixedTurn.timeSlot}-${index}`}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end bg-black/10 dark:bg-white/5 p-3 rounded-2xl border border-black/5 dark:border-white/5"
              >
                <div className="sm:col-span-4">
                  <Select
                    label="Día"
                    size="sm"
                    variant="flat"
                    className="dark"
                    classNames={{
                      trigger: "bg-dark-100/50 border-black/10 dark:border-white/10 h-14 rounded-xl",
                      label: "text-gray-400 font-bold mb-2",
                      value: "text-foreground font-bold",
                      popoverContent:
                        "bg-dark-200 border border-black/10 dark:border-white/10 text-foreground",
                      listbox: "text-foreground",
                    }}
                    selectedKeys={[fixedTurn.dayOfWeek.toString()]}
                    onSelectionChange={(keys) =>
                      handleUpdateFixedTurn(
                        index,
                        "dayOfWeek",
                        parseInt(Array.from(keys)[0] as string, 10),
                      )
                    }
                  >
                    <SelectItem key="1">Lunes</SelectItem>
                    <SelectItem key="2">Martes</SelectItem>
                    <SelectItem key="3">Miércoles</SelectItem>
                    <SelectItem key="4">Jueves</SelectItem>
                    <SelectItem key="5">Viernes</SelectItem>
                    <SelectItem key="6">Sábado</SelectItem>
                    <SelectItem key="0">Domingo</SelectItem>
                  </Select>
                </div>
                <div className="sm:col-span-4">
                  <Select
                    label="Cancha"
                    size="sm"
                    variant="flat"
                    className="dark"
                    classNames={{
                      trigger: "bg-dark-100/50 border-black/10 dark:border-white/10 h-14 rounded-xl",
                      label: "text-gray-400 font-bold mb-2",
                      value: "text-foreground font-bold",
                      popoverContent:
                        "bg-dark-200 border border-black/10 dark:border-white/10 text-foreground",
                      listbox: "text-foreground",
                    }}
                    selectedKeys={[fixedTurn.court]}
                    onSelectionChange={(keys) =>
                      handleUpdateFixedTurn(index, "court", Array.from(keys)[0] as string)
                    }
                  >
                    {courts.map((court) => (
                      <SelectItem key={court._id}>{court.name}</SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="sm:col-span-3">
                  <Select
                    label="Hora"
                    size="sm"
                    variant="flat"
                    className="dark"
                    classNames={{
                      trigger: "bg-dark-100/50 border-black/10 dark:border-white/10 h-14 rounded-xl",
                      label: "text-gray-400 font-bold mb-2",
                      value: "text-foreground font-bold",
                      popoverContent:
                        "bg-dark-200 border border-black/10 dark:border-white/10 text-foreground",
                      listbox: "text-foreground",
                    }}
                    selectedKeys={[fixedTurn.timeSlot]}
                    onSelectionChange={(keys) =>
                      handleUpdateFixedTurn(index, "timeSlot", Array.from(keys)[0] as string)
                    }
                  >
                    {slots.map((slot) => (
                      <SelectItem key={slot._id}>{slot.startTime}</SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="sm:col-span-1 pb-1 text-right sm:text-center">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => handleRemoveFixedTurn(index)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export const ClientDetailPage = ({ clientId }: ClientDetailPageProps) => {
  const navigate = useNavigate();
  const { data: userDetailData, isLoading: isLoadingUser } = useUserById(clientId);
  const { data: historyData, isLoading: isLoadingHistory } = useUserHistory(clientId);
  const adjustAttendanceCount = useAdjustAttendanceCount();
  const clearPenalties = useClearPenalties();
  const deleteUser = useDeleteUser();
  const updateUser = useUpdateUser();
  const isClientActionPending = clearPenalties.isPending || deleteUser.isPending;
  const { data: courtsData } = useCourts();
  const { data: slotsData } = useSlots();

  const {
    isOpen: isEditModalOpen,
    onOpen: onEditModalOpen,
    onClose: onEditModalClose,
  } = useDisclosure();

  const user: User | null = userDetailData?.data || null;
  const history: Booking[] = useMemo(
    () => (Array.isArray(historyData?.data) ? historyData.data : []),
    [historyData],
  );
  const courts: Court[] = courtsData?.data || [];
  const slots: TimeSlot[] = slotsData?.data || [];
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<BookingStatusFilter>("all");
  const [historyPaymentFilter, setHistoryPaymentFilter] = useState<PaymentStatusFilter>("all");
  const [historyPageSize, setHistoryPageSize] = useState<"25" | "50" | "100">("25");
  const [historyPage, setHistoryPage] = useState(1);

  const attendanceCount = Number(user?.attendanceConfirmedCount || 0);
  const trustedThreshold = Number(user?.trustedClientConfirmationCount || 3);
  const isTrusted =
    typeof user?.isTrustedClient === "boolean"
      ? user.isTrustedClient
      : attendanceCount >= trustedThreshold;

  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => getBookingSortTimestamp(b) - getBookingSortTimestamp(a)),
    [history],
  );

  const filteredHistory = useMemo(() => {
    const normalizedQuery = historyQuery.trim().toLowerCase();

    return sortedHistory.filter((booking) => {
      const bookingPaymentStatus = booking.paymentStatus || "none";
      const statusMatches =
        historyStatusFilter === "all" || booking.status === historyStatusFilter;
      const paymentMatches =
        historyPaymentFilter === "all" || bookingPaymentStatus === historyPaymentFilter;

      if (!statusMatches || !paymentMatches) return false;
      if (!normalizedQuery) return true;

      const searchableText = [
        toShortDate(booking.date),
        booking.timeSlot?.startTime || "",
        booking.court?.name || "",
        booking.status,
        booking.paymentStatus || "sin dato",
        booking.isFixed ? "fijo" : "manual",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [sortedHistory, historyQuery, historyStatusFilter, historyPaymentFilter]);

  const totalPaid = useMemo(
    () => filteredHistory.filter((booking) => booking.paymentStatus === "pagado").length,
    [filteredHistory],
  );
  const totalPending = useMemo(
    () => filteredHistory.filter((booking) => booking.paymentStatus === "pendiente").length,
    [filteredHistory],
  );
  const totalCancelled = useMemo(
    () => filteredHistory.filter((booking) => booking.status === "cancelado").length,
    [filteredHistory],
  );

  const pageSize = Number(historyPageSize);
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));
  const safePage = Math.min(historyPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pagedHistory = filteredHistory.slice(startIndex, startIndex + pageSize);

  const handleAdjustAttendance = async (delta: number) => {
    if (!user?._id) return;

    try {
      await adjustAttendanceCount.mutateAsync({ id: user._id, delta });
      addToast({
        title: delta > 0 ? "Asistencia sumada" : "Asistencia restada",
        color: "success",
      });
    } catch {
      addToast({ title: "Error al ajustar asistencias", color: "danger" });
    }
  };

  const handleClearPenalties = async () => {
    if (!user?._id) return;
    if (!confirm("¿Deseas limpiar las penalizaciones y rehabilitar a este socio?")) {
      return;
    }

    try {
      await clearPenalties.mutateAsync(user._id);
      addToast({ title: "Penalizaciones eliminadas", color: "success" });
    } catch {
      addToast({ title: "Error al limpiar penalizaciones", color: "danger" });
    }
  };

  const handleDeleteUser = async () => {
    if (!user?._id) return;
    if (!confirm("¿Estás seguro de eliminar este socio?")) return;

    try {
      await deleteUser.mutateAsync(user._id);
      addToast({ title: "Socio eliminado", color: "success" });
      navigate("/socios");
    } catch {
      addToast({ title: "Error al eliminar socio", color: "danger" });
    }
  };

  const handleSaveFixedTurns = async (nextFixedTurns: EditableFixedTurn[]) => {
    if (!user?._id) return;

    try {
      await updateUser.mutateAsync({
        id: user._id,
        data: {
          fixedTurns: nextFixedTurns.filter(
            (fixedTurn) => fixedTurn.court && fixedTurn.timeSlot,
          ),
        },
      });
      addToast({ title: "Turnos fijos guardados", color: "success" });
    } catch {
      addToast({ title: "Error al guardar turnos fijos", color: "danger" });
    }
  };

  if (isLoadingUser) {
    return (
      <div className="flex justify-center py-16">
        <Spinner color="primary" size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <Button variant="light" onPress={() => navigate("/socios")}>Volver</Button>
        <p className="text-gray-400">No encontramos el socio solicitado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <Button
          variant="flat"
          startContent={<ArrowLeft size={16} />}
          onPress={() => navigate("/socios")}
          className="font-black"
        >
          Volver a socios
        </Button>

        <div className="flex flex-wrap gap-2">
          <Button variant="flat" className="font-black" onPress={onEditModalOpen}>
            Editar perfil
          </Button>
          <Button
            variant="flat"
            className="font-black"
            startContent={<MessageSquare size={16} />}
            onPress={() =>
              window.open(`https://wa.me/${user.phoneNumber.replace(/\D/g, "")}`, "_blank")
            }
          >
            WhatsApp
          </Button>
          <Button
            color="success"
            variant="flat"
            className="font-black"
            isLoading={clearPenalties.isPending}
            isDisabled={deleteUser.isPending}
            onPress={handleClearPenalties}
          >
            Despenalizar
          </Button>
          <Button
            color="danger"
            variant="flat"
            className="font-black"
            startContent={<Trash2 size={16} />}
            isLoading={deleteUser.isPending}
            isDisabled={clearPenalties.isPending}
            onPress={handleDeleteUser}
          >
            Eliminar
          </Button>
        </div>
      </div>

      <Card className="bg-dark-200 border border-black/10 dark:border-white/10 rounded-3xl">
        <CardBody className="p-6 space-y-5">
          <div>
            <p className="text-3xl font-black text-foreground">{user.name}</p>
            <p className="text-gray-400 font-semibold flex items-center gap-2 mt-1">
              <Smartphone size={14} />
              {formatPhoneForDisplay(user.phoneNumber)}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-black/10 dark:bg-white/5 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">Asistencias</p>
              <p className="text-2xl font-black text-foreground mt-1">{attendanceCount}</p>
            </div>
            <div className="rounded-2xl bg-black/10 dark:bg-white/5 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">Umbral</p>
              <p className="text-2xl font-black text-foreground mt-1">{trustedThreshold}</p>
            </div>
            <div className="rounded-2xl bg-black/10 dark:bg-white/5 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">Penalizaciones</p>
              <p className="text-2xl font-black text-foreground mt-1">{Number(user.penalties || 0)}</p>
            </div>
            <div className="rounded-2xl bg-black/10 dark:bg-white/5 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">Turnos fijos</p>
              <p className="text-2xl font-black text-foreground mt-1">{Array.isArray(user.fixedTurns) ? user.fixedTurns.length : 0}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Chip
              color={isTrusted ? "success" : "warning"}
              variant="flat"
              className="font-black uppercase"
              startContent={isTrusted ? <CheckCircle2 size={14} /> : <ShieldAlert size={14} />}
            >
              {isTrusted ? "Cliente Confiable" : "En Seguimiento"}
            </Chip>
            {user.isSuspended && (
              <Chip color="danger" variant="flat" className="font-black uppercase">
                Suspendido
              </Chip>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              color="danger"
              variant="flat"
              onPress={() => handleAdjustAttendance(-1)}
              isDisabled={attendanceCount <= 0 || isClientActionPending}
              isLoading={adjustAttendanceCount.isPending}
              className="font-black"
            >
              Restar 1 asistencia
            </Button>
            <Button
              color="success"
              variant="flat"
              onPress={() => handleAdjustAttendance(1)}
              isDisabled={isClientActionPending}
              isLoading={adjustAttendanceCount.isPending}
              className="font-black"
            >
              Sumar 1 asistencia
            </Button>
          </div>
        </CardBody>
      </Card>

      <FixedTurnsEditor
        key={user._id}
        initialFixedTurns={user.fixedTurns}
        courts={courts}
        slots={slots}
        onSave={handleSaveFixedTurns}
        isSaving={updateUser.isPending}
      />

      <Card className="bg-dark-200 border border-black/10 dark:border-white/10 rounded-3xl">
        <CardBody className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-black text-foreground">Historial Detallado</h3>
            <Chip variant="flat" className="font-black">
              {filteredHistory.length} turnos
            </Chip>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-black/10 dark:bg-white/5 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500">
                Mostrando
              </p>
              <p className="text-xl font-black mt-1">
                {filteredHistory.length === 0 ? 0 : startIndex + 1}-
                {Math.min(startIndex + pageSize, filteredHistory.length)}
              </p>
            </div>
            <div className="rounded-2xl bg-black/10 dark:bg-white/5 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500">
                Pagados
              </p>
              <p className="text-xl font-black mt-1 text-success">{totalPaid}</p>
            </div>
            <div className="rounded-2xl bg-black/10 dark:bg-white/5 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500">
                Pendientes
              </p>
              <p className="text-xl font-black mt-1 text-warning">{totalPending}</p>
            </div>
            <div className="rounded-2xl bg-black/10 dark:bg-white/5 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500">
                Cancelados
              </p>
              <p className="text-xl font-black mt-1 text-danger">{totalCancelled}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            <Input
              label="Buscar"
              placeholder="Fecha, cancha, hora, estado..."
              value={historyQuery}
              onValueChange={(value) => {
                setHistoryQuery(value);
                setHistoryPage(1);
              }}
              variant="bordered"
              className="lg:col-span-2"
            />
            <Select
              label="Estado turno"
              selectedKeys={[historyStatusFilter]}
              onSelectionChange={(keys) => {
                const nextFilter = String(Array.from(keys)[0] || "all") as BookingStatusFilter;
                setHistoryStatusFilter(nextFilter);
                setHistoryPage(1);
              }}
              variant="bordered"
            >
              <SelectItem key="all">Todos</SelectItem>
              <SelectItem key="confirmado">Confirmado</SelectItem>
              <SelectItem key="reservado">Reservado</SelectItem>
              <SelectItem key="cancelado">Cancelado</SelectItem>
              <SelectItem key="suspendido">Suspendido</SelectItem>
              <SelectItem key="disponible">Disponible</SelectItem>
            </Select>
            <Select
              label="Estado pago"
              selectedKeys={[historyPaymentFilter]}
              onSelectionChange={(keys) => {
                const nextFilter = String(Array.from(keys)[0] || "all") as PaymentStatusFilter;
                setHistoryPaymentFilter(nextFilter);
                setHistoryPage(1);
              }}
              variant="bordered"
            >
              <SelectItem key="all">Todos</SelectItem>
              <SelectItem key="pagado">Pagado</SelectItem>
              <SelectItem key="pendiente">Pendiente</SelectItem>
              <SelectItem key="none">Sin dato</SelectItem>
            </Select>
          </div>

          {isLoadingHistory ? (
            <div className="flex justify-center py-6">
              <Spinner color="primary" size="sm" />
            </div>
          ) : filteredHistory.length === 0 ? (
            <p className="text-gray-500">No hay historial para este socio.</p>
          ) : (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10">
                <table className="w-full min-w-[860px]">
                  <thead className="bg-black/10 dark:bg-white/5">
                    <tr className="text-left">
                      <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">Fecha</th>
                      <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">Hora</th>
                      <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">Cancha</th>
                      <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">Turno</th>
                      <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">Pago</th>
                      <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">Monto</th>
                      <th className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">Origen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedHistory.map((booking) => (
                      <tr key={booking._id} className="border-t border-black/10 dark:border-white/10">
                        <td className="px-3 py-3 align-top">
                          <p className="font-bold">{toShortDate(booking.date)}</p>
                          <p className="text-xs text-gray-500">{formatDate(booking.date)}</p>
                        </td>
                        <td className="px-3 py-3 align-top font-semibold">{booking.timeSlot?.startTime || "--:--"}</td>
                        <td className="px-3 py-3 align-top font-semibold">{booking.court?.name || "Sin cancha"}</td>
                        <td className="px-3 py-3 align-top">
                          <Chip
                            size="sm"
                            variant="flat"
                            className="font-black uppercase"
                            color={getStatusChipColor(booking.status)}
                          >
                            {booking.status}
                          </Chip>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <Chip
                            size="sm"
                            variant="flat"
                            className="font-black uppercase"
                            color={getPaymentChipColor(booking.paymentStatus)}
                          >
                            {booking.paymentStatus || "sin dato"}
                          </Chip>
                        </td>
                        <td className="px-3 py-3 align-top font-black">{formatCurrency(Number(booking.finalPrice || 0))}</td>
                        <td className="px-3 py-3 align-top">
                          <Chip size="sm" variant="flat" className="font-black uppercase">
                            {booking.isFixed ? "fijo" : "manual"}
                          </Chip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="w-28">
                  <Select
                    label="Por página"
                    selectedKeys={[historyPageSize]}
                    onSelectionChange={(keys) => {
                      const nextSize = String(Array.from(keys)[0] || "25") as "25" | "50" | "100";
                      setHistoryPageSize(nextSize);
                      setHistoryPage(1);
                    }}
                    variant="bordered"
                    size="sm"
                  >
                    <SelectItem key="25">25</SelectItem>
                    <SelectItem key="50">50</SelectItem>
                    <SelectItem key="100">100</SelectItem>
                  </Select>
                </div>

                <p className="text-sm text-gray-500">
                  Página {safePage} de {totalPages}
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                    isDisabled={safePage <= 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={() => setHistoryPage((prev) => Math.min(totalPages, prev + 1))}
                    isDisabled={safePage >= totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <UserModal
        key={`edit-${user._id}-${isEditModalOpen ? "open" : "closed"}`}
        isOpen={isEditModalOpen}
        onClose={onEditModalClose}
        user={user}
        mode="edit"
      />
    </div>
  );
};
