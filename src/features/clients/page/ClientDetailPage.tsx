import { useMemo } from "react";
import {
  Button,
  Card,
  CardBody,
  Chip,
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
  useDeleteUser,
  useUserById,
  useUserHistory,
} from "../../../hooks/useData";
import { formatDate, formatPhoneForDisplay } from "../../../utils/formatters";
import { UserModal } from "../components/UserModal";
import type { Booking, User } from "../../../types";

type ClientDetailPageProps = {
  clientId: string;
};

export const ClientDetailPage = ({ clientId }: ClientDetailPageProps) => {
  const navigate = useNavigate();
  const { data: userDetailData, isLoading: isLoadingUser } = useUserById(clientId);
  const { data: historyData, isLoading: isLoadingHistory } = useUserHistory(clientId);
  const adjustAttendanceCount = useAdjustAttendanceCount();
  const clearPenalties = useClearPenalties();
  const deleteUser = useDeleteUser();

  const {
    isOpen: isEditModalOpen,
    onOpen: onEditModalOpen,
    onClose: onEditModalClose,
  } = useDisclosure();

  const user: User | null = userDetailData?.data || null;
  const history: Booking[] = historyData?.data || [];

  const attendanceCount = Number(user?.attendanceConfirmedCount || 0);
  const trustedThreshold = Number(user?.trustedClientConfirmationCount || 3);
  const isTrusted =
    typeof user?.isTrustedClient === "boolean"
      ? user.isTrustedClient
      : attendanceCount >= trustedThreshold;

  const nextFixedTurns = useMemo(() => {
    if (!Array.isArray(user?.fixedTurns)) return [];

    return user.fixedTurns.map((fixedTurn) => ({
      dayOfWeek: fixedTurn.dayOfWeek,
      courtName:
        typeof fixedTurn.court === "string"
          ? fixedTurn.court
          : fixedTurn.court?.name || "Cancha",
      startTime:
        typeof fixedTurn.timeSlot === "string"
          ? fixedTurn.timeSlot
          : fixedTurn.timeSlot?.startTime || "--:--",
    }));
  }, [user]);

  const dayLabels = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];

  const handleAdjustAttendance = async (delta: number) => {
    if (!user?._id) return;

    try {
      await adjustAttendanceCount.mutateAsync({ id: user._id, delta });
      addToast({
        title: delta > 0 ? "Asistencia sumada" : "Asistencia restada",
        color: "success",
      });
    } catch (_error) {
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
    } catch (_error) {
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
    } catch (_error) {
      addToast({ title: "Error al eliminar socio", color: "danger" });
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
          <Button color="success" variant="flat" className="font-black" onPress={handleClearPenalties}>
            Despenalizar
          </Button>
          <Button color="danger" variant="flat" className="font-black" startContent={<Trash2 size={16} />} onPress={handleDeleteUser}>
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
              isDisabled={attendanceCount <= 0}
              isLoading={adjustAttendanceCount.isPending}
              className="font-black"
            >
              Restar 1 asistencia
            </Button>
            <Button
              color="success"
              variant="flat"
              onPress={() => handleAdjustAttendance(1)}
              isLoading={adjustAttendanceCount.isPending}
              className="font-black"
            >
              Sumar 1 asistencia
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card className="bg-dark-200 border border-black/10 dark:border-white/10 rounded-3xl">
        <CardBody className="p-6 space-y-4">
          <h3 className="text-xl font-black text-foreground flex items-center gap-2">
            <Calendar size={18} /> Turnos Fijos
          </h3>
          {nextFixedTurns.length === 0 ? (
            <p className="text-gray-500">No tiene turnos fijos asignados.</p>
          ) : (
            <div className="space-y-2">
              {nextFixedTurns.map((fixedTurn, index) => (
                <div key={`${fixedTurn.courtName}-${fixedTurn.startTime}-${index}`} className="rounded-2xl bg-black/10 dark:bg-white/5 px-4 py-3 flex items-center justify-between">
                  <p className="font-bold text-foreground">{dayLabels[fixedTurn.dayOfWeek] || "Día"}</p>
                  <p className="text-gray-400 font-semibold">{fixedTurn.courtName} · {fixedTurn.startTime}</p>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card className="bg-dark-200 border border-black/10 dark:border-white/10 rounded-3xl">
        <CardBody className="p-6 space-y-4">
          <h3 className="text-xl font-black text-foreground">Historial</h3>
          {isLoadingHistory ? (
            <div className="flex justify-center py-6">
              <Spinner color="primary" size="sm" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-gray-500">No hay historial para este socio.</p>
          ) : (
            <div className="space-y-2">
                  {history.slice(0, 20).map((booking) => (
                <div key={booking._id} className="rounded-2xl bg-black/10 dark:bg-white/5 px-4 py-3 flex items-center justify-between gap-3">
                  <p className="font-bold text-foreground">{formatDate(booking.date)} · {booking.timeSlot?.startTime || "--:--"}</p>
                  <Chip size="sm" variant="flat" className="font-black uppercase">
                    {booking.status}
                  </Chip>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <UserModal
        isOpen={isEditModalOpen}
        onClose={onEditModalClose}
        user={user}
        mode="edit"
      />
    </div>
  );
};
