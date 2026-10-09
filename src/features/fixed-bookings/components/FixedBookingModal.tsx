import {
  addToast,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { useEffect, useState } from "react";

import { fieldInputClassNames, fieldSelectClassNames } from "../../../components/ui/fieldStyles";
import { useCourts, useSlots } from "../../../hooks/useData";
import type { FixedBooking } from "../../../services/fixedBookingService";
import { WEEKDAYS } from "../constants";
import {
  useCreateFixedBooking,
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
  const { data: courtsData, isLoading: isLoadingCourts } = useCourts();
  const { data: slotsData, isLoading: isLoadingSlots } = useSlots();
  const createFixedBooking = useCreateFixedBooking();
  const updateFixedBooking = useUpdateFixedBooking();

  const [court, setCourt] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [weekday, setWeekday] = useState("");
  const [clientName, setClientName] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setCourt(refId(editing?.court));
    setTimeSlot(refId(editing?.timeSlot));
    setWeekday(editing ? String(editing.weekday) : "");
    setClientName(editing?.clientName || "");
    setNotes(editing?.notes || "");
  }, [isOpen, editing]);

  const courts = courtsData?.data ?? [];
  const slots = slotsData?.data ?? [];
  const isSaving =
    createFixedBooking.isPending || updateFixedBooking.isPending;

  const handleSubmit = async () => {
    if (!court || !timeSlot || weekday === "") {
      addToast({
        title: "Completá cancha, día y horario",
        color: "warning",
      });
      return;
    }

    const payload = {
      court,
      timeSlot,
      weekday: Number(weekday),
      clientName: clientName.trim(),
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement="center"
      backdrop="blur"
      size="lg"
      className="bg-surface-container-high text-foreground dark rounded-md"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 border-b border-black/5 dark:border-white/5 pb-4">
          <h2 className="text-2xl font-black">
            {editing ? "Editar turno fijo" : "Nuevo turno fijo"}
          </h2>
          <p className="text-sm text-on-surface-variant font-normal">
            Se repite todas las semanas el mismo día y horario.
          </p>
        </ModalHeader>

        <ModalBody className="py-6 space-y-5">
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
                {slots.map((slot) => (
                  <SelectItem key={slot._id}>
                    {`${slot.startTime} – ${slot.endTime}`}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Cliente (opcional)</label>
            <Input
              placeholder="Ej: Juan Pérez"
              value={clientName}
              onValueChange={setClientName}
              variant="bordered"
              size="lg"
              classNames={fieldInputClassNames.lg}
            />
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
        </ModalBody>

        <ModalFooter className="border-t border-black/5 dark:border-white/5 pt-4">
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
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
