import { addToast, Button, Chip, Input, Spinner } from "@heroui/react";
import { CalendarClock, Pause, Pencil, Play, Plus, Search, Trash2 } from "lucide-react";
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
  fixedBooking.court && typeof fixedBooking.court !== "string"
    ? fixedBooking.court.name
    : "Cancha no disponible";

const getSlotTime = (fixedBooking: FixedBooking): string =>
  // `null` happens for legacy rows whose slot was deleted: never crash the page.
  fixedBooking.timeSlot && typeof fixedBooking.timeSlot !== "string"
    ? `${fixedBooking.timeSlot.startTime} – ${fixedBooking.timeSlot.endTime}`
    : "Horario no disponible";

const getErrorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { response?: { data?: { error?: string } } })
    ?.response?.data?.error;
  return typeof message === "string" && message ? message : fallback;
};

type DayFilter = number | "all";
type StatusFilter = "all" | "active" | "paused";

type FilterChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

const FilterChip = ({ label, active, onPress }: FilterChipProps) => (
  <button
    type="button"
    onClick={onPress}
    aria-pressed={active}
    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
      active
        ? "border-transparent bg-primary text-on-primary"
        : "border-outline-variant bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
    }`}
  >
    {label}
  </button>
);

export const FixedBookings = () => {
  const { data, isLoading, isError } = useFixedBookings();
  const updateFixedBooking = useUpdateFixedBooking();
  const deleteFixedBooking = useDeleteFixedBooking();
  const confirm = useConfirm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<FixedBooking | null>(null);
  const [dayFilter, setDayFilter] = useState<DayFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const total = data?.data?.length ?? 0;

  const filtered = useMemo(() => {
    const items = data?.data ?? [];
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (dayFilter !== "all" && item.weekday !== dayFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (term) {
        const clientMatch = (item.clientName ?? "").toLowerCase().includes(term);
        const courtMatch = getCourtName(item).toLowerCase().includes(term);
        if (!clientMatch && !courtMatch) return false;
      }
      return true;
    });
  }, [data, dayFilter, statusFilter, search]);

  const grouped = useMemo(() => {
    return WEEKDAYS.map((day) => ({
      day,
      items: filtered
        .filter((item) => item.weekday === day.value)
        .sort((a, b) => getSlotTime(a).localeCompare(getSlotTime(b))),
    })).filter((group) => group.items.length > 0);
  }, [filtered]);

  const countLabel = `${filtered.length} ${filtered.length === 1 ? "turno" : "turnos"}`;

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

      {!isLoading && !isError && total > 0 && (
        <div className="space-y-4 rounded-lg border border-outline-variant bg-surface-container p-4">
          <Input
            size="sm"
            isClearable
            value={search}
            onValueChange={setSearch}
            placeholder="Buscar cliente o cancha..."
            startContent={<Search size={16} className="text-on-surface-variant" />}
            classNames={{
              inputWrapper:
                "bg-surface-container-high border border-outline-variant",
              input: "text-foreground",
            }}
          />

          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Día
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <FilterChip
                label="Todos"
                active={dayFilter === "all"}
                onPress={() => setDayFilter("all")}
              />
              {WEEKDAYS.map((day) => (
                <FilterChip
                  key={day.value}
                  label={day.short}
                  active={dayFilter === day.value}
                  onPress={() => setDayFilter(day.value)}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Estado
              </p>
              <div className="flex gap-2">
                <FilterChip
                  label="Todos"
                  active={statusFilter === "all"}
                  onPress={() => setStatusFilter("all")}
                />
                <FilterChip
                  label="Activos"
                  active={statusFilter === "active"}
                  onPress={() => setStatusFilter("active")}
                />
                <FilterChip
                  label="Pausados"
                  active={statusFilter === "paused"}
                  onPress={() => setStatusFilter("paused")}
                />
              </div>
            </div>
            <span className="text-xs font-semibold text-on-surface-variant">
              {countLabel}
            </span>
          </div>
        </div>
      )}

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
      ) : total === 0 ? (
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
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[280px] text-center p-8 bg-dark-200 rounded-md border border-black/5 dark:border-white/5">
          <Search size={40} className="text-on-surface-variant mb-4" />
          <h3 className="text-lg font-bold mb-1 text-foreground">
            No hay turnos fijos con esos filtros.
          </h3>
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
