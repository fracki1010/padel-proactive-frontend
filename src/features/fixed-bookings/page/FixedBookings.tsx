import { addToast, Button, Chip, Spinner } from "@heroui/react";
import { CalendarClock, Pause, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { useConfirm } from "../../../hooks/useConfirm";
import type { FixedBooking } from "../../../services/fixedBookingService";
import { FixedBookingModal } from "../components/FixedBookingModal";
import { WEEKDAYS } from "../constants";
import {
  useDeleteFixedBooking,
  useFixedBookings,
  useUpdateFixedBooking,
} from "../hooks/useFixedBookings";

const getCourtName = (fixedBooking: FixedBooking): string =>
  typeof fixedBooking.court === "string" ? "" : fixedBooking.court.name;

const getSlotTime = (fixedBooking: FixedBooking): string =>
  typeof fixedBooking.timeSlot === "string"
    ? ""
    : `${fixedBooking.timeSlot.startTime} – ${fixedBooking.timeSlot.endTime}`;

const getErrorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { response?: { data?: { error?: string } } })
    ?.response?.data?.error;
  return typeof message === "string" && message ? message : fallback;
};

export const FixedBookings = () => {
  const { data, isLoading, isError } = useFixedBookings();
  const updateFixedBooking = useUpdateFixedBooking();
  const deleteFixedBooking = useDeleteFixedBooking();
  const confirm = useConfirm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<FixedBooking | null>(null);

  const grouped = useMemo(() => {
    const items = data?.data ?? [];
    return WEEKDAYS.map((day) => ({
      day,
      items: items
        .filter((item) => item.weekday === day.value)
        .sort((a, b) => getSlotTime(a).localeCompare(getSlotTime(b))),
    })).filter((group) => group.items.length > 0);
  }, [data]);

  const openCreate = () => {
    setEditing(null);
    setIsModalOpen(true);
  };

  const openEdit = (fixedBooking: FixedBooking) => {
    setEditing(fixedBooking);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
  };

  const handleToggleStatus = async (fixedBooking: FixedBooking) => {
    const nextStatus = fixedBooking.status === "active" ? "paused" : "active";
    try {
      await updateFixedBooking.mutateAsync({
        id: fixedBooking._id,
        data: { status: nextStatus },
      });
      addToast({
        title: nextStatus === "active" ? "Turno fijo reanudado" : "Turno fijo pausado",
        color: "success",
      });
    } catch (error) {
      addToast({
        title: getErrorMessage(error, "No se pudo actualizar el turno fijo"),
        color: "danger",
      });
    }
  };

  const handleDelete = async (fixedBooking: FixedBooking) => {
    const confirmed = await confirm(
      "¿Eliminar este turno fijo? La cancha y el horario volverán a quedar libres.",
      { title: "Eliminar turno fijo", variant: "danger", confirmText: "Eliminar" },
    );
    if (!confirmed) return;

    try {
      await deleteFixedBooking.mutateAsync(fixedBooking._id);
      addToast({ title: "Turno fijo eliminado", color: "success" });
    } catch (error) {
      addToast({
        title: getErrorMessage(error, "No se pudo eliminar el turno fijo"),
        color: "danger",
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Turnos fijos
          </h1>
          <p className="text-sm text-on-surface-variant">
            Bloqueá canchas y horarios que se repiten todas las semanas.
          </p>
        </div>
        <Button
          color="primary"
          className="rounded-md font-black shadow-lg shadow-primary/20"
          startContent={<Plus size={18} />}
          onPress={openCreate}
        >
          Nuevo turno fijo
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner color="primary" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center min-h-[280px] text-center p-8 bg-dark-200 rounded-md border border-black/5 dark:border-white/5">
          <h3 className="text-lg font-bold mb-1 text-foreground">
            No pudimos cargar los turnos fijos
          </h3>
          <p className="text-on-surface-variant text-sm">
            Reintentá en unos segundos.
          </p>
        </div>
      ) : grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[280px] text-center p-8 bg-dark-200 rounded-md border border-black/5 dark:border-white/5">
          <CalendarClock size={48} className="text-on-surface-variant mb-4" />
          <h3 className="text-xl font-bold mb-1 text-foreground">
            Todavía no hay turnos fijos
          </h3>
          <p className="text-on-surface-variant text-sm mb-5">
            Creá el primero para reservar una cancha todas las semanas.
          </p>
          <Button
            color="primary"
            className="rounded-md font-black shadow-lg shadow-primary/20"
            startContent={<Plus size={18} />}
            onPress={openCreate}
          >
            Nuevo turno fijo
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          {grouped.map(({ day, items }) => (
            <section key={day.value} className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-black text-foreground tracking-tight">
                  {day.label}
                </h2>
                <div className="h-px flex-grow bg-black/5 dark:bg-white/5" />
                <span className="text-xs font-semibold text-on-surface-variant tracking-wider">
                  {items.length}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {items.map((fixedBooking) => {
                  const isActive = fixedBooking.status === "active";
                  return (
                    <div
                      key={fixedBooking._id}
                      className="rounded-lg border border-black/5 dark:border-white/5 bg-dark-200 p-4 sm:p-5 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-black text-foreground truncate">
                            {getCourtName(fixedBooking) || "Cancha"}
                          </p>
                          <p className="text-sm text-on-surface-variant">
                            {getSlotTime(fixedBooking)}
                          </p>
                        </div>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={isActive ? "success" : "default"}
                          className="font-bold shrink-0"
                        >
                          {isActive ? "Activo" : "Pausado"}
                        </Chip>
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                          Cliente
                        </p>
                        <p className="text-foreground font-medium">
                          {fixedBooking.clientName?.trim() || "—"}
                        </p>
                      </div>

                      {fixedBooking.notes?.trim() && (
                        <p className="text-sm text-on-surface-variant">
                          {fixedBooking.notes}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="flat"
                          startContent={
                            isActive ? <Pause size={14} /> : <Play size={14} />
                          }
                          onPress={() => handleToggleStatus(fixedBooking)}
                          className="font-bold"
                        >
                          {isActive ? "Pausar" : "Reanudar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          startContent={<Pencil size={14} />}
                          onPress={() => openEdit(fixedBooking)}
                          className="font-bold"
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          color="danger"
                          startContent={<Trash2 size={14} />}
                          onPress={() => handleDelete(fixedBooking)}
                          className="font-bold"
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <FixedBookingModal
        key={editing?._id ?? "new"}
        isOpen={isModalOpen}
        onClose={closeModal}
        editing={editing}
      />
    </div>
  );
};
