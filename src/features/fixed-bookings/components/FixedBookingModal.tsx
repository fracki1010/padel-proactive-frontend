import {
  addToast,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { ChevronDown, User as UserIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { fieldSelectClassNames } from "../../../components/ui/fieldStyles";
import { useCourts, useSlots } from "../../../hooks/useData";
import { useIsDesktop } from "../../../hooks/useIsDesktop";
import type { FixedBooking } from "../../../services/fixedBookingService";
import { WEEKDAYS } from "../constants";
import { ClientPickerDrawer } from "./ClientPickerDrawer";
import {
  useCreateFixedBooking,
  useFixedBookings,
  useUpdateFixedBooking,
} from "../hooks/useFixedBookings";

type FixedBookingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  editing: FixedBooking | null;
};

const refId = (ref: { _id: string } | string | null | undefined): string => {
  if (!ref) return "";
  return typeof ref === "string" ? ref : ref._id;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { response?: { data?: { error?: string } } })
    ?.response?.data?.error;
  return typeof message === "string" && message ? message : fallback;
};

const labelClass =
  "text-sm font-semibold text-on-surface-variant uppercase tracking-wider";

export const FixedBookingModal = ({
  isOpen,
  onClose,
  editing,
}: FixedBookingModalProps) => {
  const isDesktop = useIsDesktop();
  const { data: courtsData, isLoading: isLoadingCourts } = useCourts();
  const { data: slotsData, isLoading: isLoadingSlots } = useSlots();
  const { data: fixedBookingsData } = useFixedBookings();
  const createFixedBooking = useCreateFixedBooking();
  const updateFixedBooking = useUpdateFixedBooking();

  const [court, setCourt] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [weekday, setWeekday] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientNameError, setClientNameError] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setCourt(refId(editing?.court));
    setTimeSlot(refId(editing?.timeSlot));
    setWeekday(editing ? String(editing.weekday) : "");
    setClientName(editing?.clientName || "");
    setClientNameError(false);
    setNotes(editing?.notes || "");
  }, [isOpen, editing]);

  const courts = courtsData?.data ?? [];
  const slots = useMemo(() => slotsData?.data ?? [], [slotsData]);
  const isSaving =
    createFixedBooking.isPending || updateFixedBooking.isPending;

  // Slots already taken by another active fixed turn on the selected
  // court + weekday. When editing, the edited turn's own slot stays
  // selectable so the user can re-save it unchanged.
  const occupiedSlotIds = useMemo(() => {
    const occupied = new Set<string>();
    if (!court || weekday === "") return occupied;

    const day = Number(weekday);
    for (const fixed of fixedBookingsData?.data ?? []) {
      if (fixed.status !== "active") continue;
      if (fixed.weekday !== day) continue;
      if (refId(fixed.court) !== court) continue;
      if (editing && fixed._id === editing._id) continue;
      const slotId = refId(fixed.timeSlot);
      if (slotId) occupied.add(slotId);
    }

    return occupied;
  }, [court, weekday, fixedBookingsData, editing]);

  const availableSlots = useMemo(
    () => slots.filter((slot) => !occupiedSlotIds.has(slot._id)),
    [slots, occupiedSlotIds],
  );

  const handleSubmit = async () => {
    if (!court || !timeSlot || weekday === "") {
      addToast({
        title: "Completá cancha, día y horario",
        color: "warning",
      });
      return;
    }

    const trimmedClientName = clientName.trim();
    if (!trimmedClientName) {
      setClientNameError(true);
      return;
    }

    const payload = {
      court,
      timeSlot,
      weekday: Number(weekday),
      clientName: trimmedClientName,
      notes: notes.trim(),
    };

    try {
      if (editing) {
        await updateFixedBooking.mutateAsync({
          id: editing._id,
          data: payload,
        });
        addToast({ title: "Turno fijo actualizado", color: "success" });
      } else {
        await createFixedBooking.mutateAsync(payload);
        addToast({ title: "Turno fijo creado", color: "success" });
      }
      onClose();
    } catch (error) {
      addToast({
        title: getErrorMessage(error, "No se pudo guardar el turno fijo"),
        color: "danger",
      });
    }
  };

  return (
    <>
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      placement={isDesktop ? "right" : "bottom"}
      size={isDesktop ? "lg" : "3xl"}
      backdrop="blur"
      classNames={{
        base: isDesktop
          ? "bg-surface-container-high text-foreground dark border-l border-black/10 dark:border-white/10"
          : "rounded-t-[3rem] bg-surface-container-high text-foreground dark border-t border-black/10 dark:border-white/10",
      }}
    >
      <DrawerContent>
        <DrawerHeader className="flex flex-col gap-1 border-b border-black/5 dark:border-white/5 pb-4">
          <h2 className="text-2xl font-black">
            {editing ? "Editar turno fijo" : "Nuevo turno fijo"}
          </h2>
          <p className="text-sm text-on-surface-variant font-normal">
            Se repite todas las semanas el mismo día y horario.
          </p>
        </DrawerHeader>

        <DrawerBody className="py-6 space-y-5">
          <div className="space-y-2">
            <label className={labelClass}>Cancha</label>
            <Select
              aria-label="Cancha"
              placeholder="Elegí una cancha"
              selectedKeys={court ? [court] : []}
              onSelectionChange={(keys) =>
                setCourt(String(Array.from(keys)[0] ?? ""))
              }
              isDisabled={isLoadingCourts}
              variant="bordered"
              size="lg"
              classNames={fieldSelectClassNames.lg}
            >
              {courts.map((c) => (
                <SelectItem key={c._id}>{c.name}</SelectItem>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className={labelClass}>Día</label>
              <Select
                aria-label="Día"
                placeholder="Elegí un día"
                selectedKeys={weekday ? [weekday] : []}
                onSelectionChange={(keys) =>
                  setWeekday(String(Array.from(keys)[0] ?? ""))
                }
                variant="bordered"
                size="lg"
                classNames={fieldSelectClassNames.lg}
              >
                {WEEKDAYS.map((day) => (
                  <SelectItem key={String(day.value)}>
                    {day.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Horario</label>
              <Select
                aria-label="Horario"
                placeholder="Elegí un horario"
                selectedKeys={timeSlot ? [timeSlot] : []}
                onSelectionChange={(keys) =>
                  setTimeSlot(String(Array.from(keys)[0] ?? ""))
                }
                isDisabled={isLoadingSlots}
                variant="bordered"
                size="lg"
                classNames={fieldSelectClassNames.lg}
              >
                {availableSlots.map((slot) => (
                  <SelectItem key={slot._id}>
                    {`${slot.startTime} – ${slot.endTime}`}
                  </SelectItem>
                ))}
              </Select>
              {!!court &&
                weekday !== "" &&
                slots.length > 0 &&
                availableSlots.length === 0 && (
                  <p className="text-sm text-on-surface-variant">
                    No hay horarios disponibles para esta cancha ese día.
                  </p>
                )}
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Cliente</label>
            <Button
              fullWidth
              variant="bordered"
              color={clientNameError ? "danger" : "default"}
              onPress={() => setIsPickerOpen(true)}
              aria-label="Cliente"
              className="!justify-start h-14 px-4 rounded-lg gap-3 !bg-black/5 dark:!bg-white/5 font-normal"
            >
              <UserIcon
                size={18}
                className={`shrink-0 ${
                  clientNameError ? "text-danger" : "text-on-surface-variant"
                }`}
              />
              <span
                className={`flex-1 min-w-0 text-left truncate ${
                  clientName.trim() ? "font-medium text-foreground" : "text-gray-500"
                }`}
              >
                {clientName.trim() ? clientName : "Elegir cliente..."}
              </span>
              <ChevronDown
                size={18}
                className={`shrink-0 ${
                  clientNameError ? "text-danger" : "text-on-surface-variant"
                }`}
              />
            </Button>
            {clientNameError && (
              <p className="text-sm text-danger">El cliente es obligatorio</p>
            )}
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Notas (opcional)</label>
            <Textarea
              placeholder="Ej: Torneo interno, clase, etc."
              value={notes}
              onValueChange={setNotes}
              variant="bordered"
              minRows={3}
            />
          </div>
        </DrawerBody>

        <DrawerFooter className="border-t border-black/5 dark:border-white/5 pt-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
          <Button
            variant="light"
            onPress={onClose}
            className="rounded-md font-bold"
            isDisabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            className="rounded-md font-black px-6"
            isLoading={isSaving}
          >
            {editing ? "Guardar cambios" : "Crear turno fijo"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>

    <ClientPickerDrawer
      isOpen={isPickerOpen}
      onClose={() => setIsPickerOpen(false)}
      onSelectClient={(user) => {
        setClientName(user.name);
        setClientNameError(false);
        setIsPickerOpen(false);
      }}
    />
    </>
  );
};
