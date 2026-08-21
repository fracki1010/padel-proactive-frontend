import { addToast } from "@heroui/react";
import { useEffect, useState } from "react";

import {
  useSlots,
  useCreateSlot,
  useUpdateSlot,
  useUpdateBasePrice,
} from "../../../hooks/useData";

export const useScheduleManagement = () => {
  const { data: slotsData } = useSlots(true);
  const updateSlot = useUpdateSlot();
  const createSlot = useCreateSlot();
  const updateBasePrice = useUpdateBasePrice();

  const [newSlotStartTime, setNewSlotStartTime] = useState("");
  const [newSlotEndTime, setNewSlotEndTime] = useState("");
  const [newSlotPrice, setNewSlotPrice] = useState("");
  const [basePriceInput, setBasePriceInput] = useState("");
  const [slotTogglePendingId, setSlotTogglePendingId] = useState<string | null>(
    null,
  );

  const slots = slotsData?.data || [];

  useEffect(() => {
    if (!slots.length) return;

    const firstPrice = slots[0]?.price;
    if (typeof firstPrice !== "number") return;

    const allSame = slots.every(
      (slot: any) => Number(slot.price) === Number(firstPrice),
    );
    if (allSame) {
      setBasePriceInput(String(firstPrice));
      return;
    }

    setBasePriceInput("");
  }, [slots]);

  const handleCreateSlot = () => {
    if (!newSlotStartTime || !newSlotEndTime) {
      addToast({
        title: "Completá hora inicio y fin",
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
        endTime: newSlotEndTime,
        price: parsedPrice,
      },
      {
        onSuccess: () => {
          addToast({ title: "Turno creado", color: "success" });
          setNewSlotStartTime("");
          setNewSlotEndTime("");
          setNewSlotPrice("");
        },
        onError: (err: any) => {
          addToast({
            title: err?.response?.data?.error || "No se pudo crear el turno",
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
        onError: (err: any) => {
          addToast({
            title:
              err?.response?.data?.error || "No se pudo actualizar el turno",
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
      onError: (err: any) => {
        addToast({
          title:
            err?.response?.data?.error ||
            "No se pudo actualizar el precio base",
          color: "danger",
        });
      },
    });
  };

  return {
    slots,
    newSlotStartTime,
    newSlotEndTime,
    newSlotPrice,
    basePriceInput,
    createSlotPending: createSlot.isPending,
    updateBasePricePending: updateBasePrice.isPending,
    slotTogglePendingId,
    setNewSlotStartTime,
    setNewSlotEndTime,
    setNewSlotPrice,
    setBasePriceInput,
    handleCreateSlot,
    handleToggleSlot,
    handleSaveBasePrice,
  };
};
