import {
  addToast,
  Button,
  Chip,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  Input,
  Spinner,
  Switch,
} from "@heroui/react";
import { Clock, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  MOBILE_DRAWER_CONTENT,
  MOBILE_DRAWER_MAX_HEIGHT,
} from "../../../components/ui/drawerClasses";
import { useConfirm } from "../../../hooks/useConfirm";
import {
  useCreateSlot,
  useDeleteSlot,
  useSlots,
  useUpdateSlot,
} from "../../../hooks/useData";
import { useIsDesktop } from "../../../hooks/useIsDesktop";
import { useRevealInputOnFocus } from "../../../hooks/useRevealInputOnFocus";
import type { TimeSlot } from "../../../types";
import { formatSlotRange, ownSlotsForCourt } from "../../../utils/slots";

type CourtRef = { _id: string; name: string } | null;

type CourtSchedulesDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  court: CourtRef;
};

const DURATION_MIN = 15;
const DURATION_MAX = 480;

const formatPrice = (value: unknown) => {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return "$0";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
};

const parseHourToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return Number.MAX_SAFE_INTEGER;
  }
  return hours * 60 + minutes;
};

const errorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { response?: { data?: { error?: string } } })
    ?.response?.data?.error;
  return typeof message === "string" && message ? message : fallback;
};

export const CourtSchedulesDrawer = ({
  isOpen,
  onClose,
  court,
}: CourtSchedulesDrawerProps) => {
  const isDesktop = useIsDesktop();
  const revealInput = useRevealInputOnFocus();
  const confirm = useConfirm();
  const { data: slotsData, isLoading } = useSlots(true);
  const createSlot = useCreateSlot();
  const updateSlot = useUpdateSlot();
  const deleteSlot = useDeleteSlot();

  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [togglePendingId, setTogglePendingId] = useState<string | null>(null);
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStartTime("");
    setDuration("");
    setPrice("");
    setTogglePendingId(null);
    setDeletePendingId(null);
  }, [isOpen, court?._id]);

  const courtId = court?._id || "";
  const ownSlots = courtId
    ? ownSlotsForCourt(courtId, slotsData?.data ?? []).sort(
        (a, b) => parseHourToMinutes(a.startTime) - parseHourToMinutes(b.startTime),
      )
    : [];

  const handleCreate = () => {
    if (!courtId) return;
    if (!startTime) {
      addToast({ title: "Completá la hora de inicio", color: "danger" });
      return;
    }
    const parsedDuration = Number(duration);
    if (
      !Number.isInteger(parsedDuration) ||
      parsedDuration < DURATION_MIN ||
      parsedDuration > DURATION_MAX
    ) {
      addToast({
        title: `La duración debe estar entre ${DURATION_MIN} y ${DURATION_MAX} minutos`,
        color: "danger",
      });
      return;
    }
    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      addToast({ title: "Ingresá un precio válido", color: "danger" });
      return;
    }

    createSlot.mutate(
      {
        startTime,
        durationMinutes: parsedDuration,
        price: parsedPrice,
        court: courtId,
      },
      {
        onSuccess: () => {
          addToast({ title: "Horario creado", color: "success" });
          setStartTime("");
          setDuration("");
          setPrice("");
        },
        onError: (err) => {
          addToast({
            title: errorMessage(err, "No se pudo crear el horario"),
            color: "danger",
          });
        },
      },
    );
  };

  const handleToggle = (slot: TimeSlot, isActive: boolean) => {
    setTogglePendingId(slot._id);
    updateSlot.mutate(
      { id: slot._id, data: { isActive } },
      {
        onError: (err) => {
          addToast({
            title: errorMessage(err, "No se pudo actualizar el horario"),
            color: "danger",
          });
        },
        onSettled: () => {
          setTogglePendingId((previous) =>
            previous === slot._id ? null : previous,
          );
        },
      },
    );
  };

  const handleDelete = async (slot: TimeSlot) => {
    const shouldDelete = await confirm(
      `¿Eliminar el horario ${formatSlotRange(slot)} de ${court?.name || "esta cancha"}?`,
      { variant: "danger", title: "Eliminar horario" },
    );
    if (!shouldDelete) return;

    setDeletePendingId(slot._id);
    deleteSlot.mutate(slot._id, {
      onSuccess: () => {
        addToast({ title: "Horario eliminado", color: "success" });
      },
      onError: (err) => {
        addToast({
          title: errorMessage(err, "No se pudo eliminar el horario"),
          color: "danger",
        });
      },
      onSettled: () => {
        setDeletePendingId(null);
      },
    });
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      placement={isDesktop ? "right" : "bottom"}
      size={isDesktop ? "lg" : "3xl"}
      backdrop="blur"
      classNames={{
        base: isDesktop
          ? "bg-surface-container-high text-foreground dark border-l border-black/10 dark:border-white/10"
          : `${MOBILE_DRAWER_MAX_HEIGHT} rounded-t-[3rem] bg-surface-container-high text-foreground dark border-t border-black/10 dark:border-white/10`,
      }}
    >
      <DrawerContent className={isDesktop ? "" : MOBILE_DRAWER_CONTENT}>
        <DrawerHeader className="flex flex-col gap-1 border-b border-black/5 dark:border-white/5 pb-4">
          <h2 className="text-2xl font-black">
            Horarios de {court?.name || "la cancha"}
          </h2>
          <p className="text-sm text-on-surface-variant font-normal">
            Inicio, duración y precio por cancha.
          </p>
        </DrawerHeader>

        <DrawerBody className="py-6 space-y-6 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
          {ownSlots.length === 0 && (
            <div className="rounded-xl border border-dashed border-black/15 dark:border-white/15 bg-black/5 dark:bg-white/5 p-4">
              <p className="text-sm font-bold text-foreground">
                Esta cancha usa los horarios generales
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                Creá un horario propio para que esta cancha deje de usar la lista
                general.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Clock className="text-primary" size={18} />
              <p className="text-xs uppercase tracking-widest font-black text-on-surface-variant">
                Nuevo horario de la cancha
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                type="time"
                aria-label="Inicio"
                value={startTime}
                onValueChange={setStartTime}
                onFocus={revealInput}
                classNames={{
                  inputWrapper:
                    "bg-black/5 dark:bg-white/5 border-none h-12 rounded-md px-4",
                  input: "text-foreground font-bold",
                }}
              />
              <Input
                type="number"
                aria-label="Duración en minutos"
                value={duration}
                onValueChange={setDuration}
                onFocus={revealInput}
                min={DURATION_MIN}
                max={DURATION_MAX}
                placeholder="Duración (min)"
                classNames={{
                  inputWrapper:
                    "bg-black/5 dark:bg-white/5 border-none h-12 rounded-md px-4",
                  input: "text-foreground font-bold",
                }}
              />
              <Input
                type="number"
                aria-label="Precio"
                value={price}
                onValueChange={setPrice}
                onFocus={revealInput}
                placeholder="Precio"
                classNames={{
                  inputWrapper:
                    "bg-black/5 dark:bg-white/5 border-none h-12 rounded-md px-4",
                  input: "text-foreground font-bold",
                }}
              />
            </div>

            <Button
              className="h-12 w-full sm:w-auto px-8 bg-primary text-black dark:text-white font-black rounded-md uppercase text-[10px]"
              onPress={handleCreate}
              isLoading={createSlot.isPending}
              startContent={createSlot.isPending ? undefined : <Plus size={16} />}
            >
              Añadir Horario
            </Button>
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest font-black text-on-surface-variant">
              Horarios propios
            </p>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="sm" />
              </div>
            ) : ownSlots.length === 0 ? null : (
              <div className="flex flex-col gap-2">
                {ownSlots.map((slot) => (
                  <div
                    key={slot._id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-black/5 dark:border-white/5 bg-surface-container p-4"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-foreground text-base">
                        {formatSlotRange(slot)}
                      </p>
                      <p className="text-[10px] text-primary font-black uppercase tracking-widest">
                        {formatPrice(slot.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Chip
                        size="sm"
                        className={
                          slot.isActive
                            ? "bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20"
                            : "bg-black/10 dark:bg-white/10 text-on-surface-variant font-bold border border-black/10 dark:border-white/10"
                        }
                      >
                        {slot.isActive ? "Activo" : "Inactivo"}
                      </Chip>
                      <Switch
                        isSelected={slot.isActive !== false}
                        onValueChange={(value) => handleToggle(slot, value)}
                        color="primary"
                        size="sm"
                        isDisabled={togglePendingId === slot._id}
                      />
                      <Button
                        isIconOnly
                        variant="flat"
                        aria-label="Eliminar horario"
                        className="bg-red-500/20 text-red-300 rounded-xl"
                        onPress={() => handleDelete(slot)}
                        isLoading={deletePendingId === slot._id}
                        isDisabled={togglePendingId === slot._id}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};
