import { addToast } from "@heroui/react";
import { useEffect, useState } from "react";

import {
  useSlots,
  useCreateSlot,
  useUpdateSlot,
  useUpdateBasePrice,
} from "../../../hooks/useData";
import { generalSlots } from "../../../utils/slots";

const DURATION_MIN = 15;
const DURATION_MAX = 480;

const errorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { response?: { data?: { error?: string } } })
    ?.response?.data?.error;
  return typeof message === "string" && message ? message : fallback;
};

export const useScheduleManagement = () => {
  const { data: slotsData } = useSlots(true);
  const updateSlot = useUpdateSlot();
  const createSlot = useCreateSlot();
  const updateBasePrice = useUpdateBasePrice();

  const [newSlotStartTime, setNewSlotStartTime] = useState("");
  const [newSlotDuration, setNewSlotDuration] = useState("");
  const [newSlotPrice, setNewSlotPrice] = useState("");
  const [basePriceInput, setBasePriceInput] = useState("");
  const [slotTogglePendingId, setSlotTogglePendingId] = useState<string | null>(
    null,
  );

  // The global schedule view only manages GENERAL slots (court == null);
  // per-court slots live inside each court's drawer.
  const slots = generalSlots(slotsData?.data || []);

  useEffect(() => {
    if (!slots.length) return;

    const firstPrice = slots[0]?.price;
    if (typeof firstPrice !== "number") return;

    const allSame = slots.every(
      (slot) => Number(slot.price) === Number(firstPrice),
    );
    if (allSame) {
      setBasePriceInput(String(firstPrice));
      return;
    }

    setBasePriceInput("");
  }, [slots]);

  const handleCreateSlot = () => {
    if (!newSlotStartTime) {
      addToast({ title: "Completá la hora de inicio", color: "danger" });
      return;
    }

    const parsedDuration = Number(newSlotDuration);
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

    const parsedPrice = Number(newSlotPrice);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      addToast({
        title: "Ingresá un precio válido",
        color: "danger",
      });
      return;
    }

    createSlot.mutate(
      {
        startTime: newSlotStartTime,
        durationMinutes: parsedDuration,
        price: parsedPrice,
      },
      {
        onSuccess: () => {
          addToast({ title: "Turno creado", color: "success" });
          setNewSlotStartTime("");
          setNewSlotDuration("");
          setNewSlotPrice("");
        },
        onError: (err) => {
          addToast({
            title: errorMessage(err, "No se pudo crear el turno"),
            color: "danger",
          });
        },
      },
    );
  };

  const handleToggleSlot = (id: string, isActive: boolean) => {
    setSlotTogglePendingId(id);
    updateSlot.mutate(
      { id, data: { isActive } },
      {
        onError: (err) => {
          addToast({
            title: errorMessage(err, "No se pudo actualizar el turno"),
            color: "danger",
          });
        },
        onSettled: () => {
          setSlotTogglePendingId((previousId) =>
            previousId === id ? null : previousId,
          );
        },
      },
    );
  };

  const handleSaveBasePrice = () => {
    const parsed = Number(basePriceInput);
    if (!Number.isFinite(parsed) || parsed < 0) {
      addToast({
        title: "Ingresá un precio válido (mayor o igual a 0).",
        color: "danger",
      });
      return;
    }

    updateBasePrice.mutate(parsed, {
      onSuccess: () => {
        addToast({
          title: "Precio base actualizado en todos los turnos",
          color: "success",
        });
      },
      onError: (err) => {
        addToast({
          title: errorMessage(err, "No se pudo actualizar el precio base"),
          color: "danger",
        });
      },
    });
  };

  return {
    slots,
    newSlotStartTime,
    newSlotDuration,
    newSlotPrice,
    basePriceInput,
    createSlotPending: createSlot.isPending,
    updateBasePricePending: updateBasePrice.isPending,
    slotTogglePendingId,
    setNewSlotStartTime,
    setNewSlotDuration,
    setNewSlotPrice,
    setBasePriceInput,
    handleCreateSlot,
    handleToggleSlot,
    handleSaveBasePrice,
  };
};
