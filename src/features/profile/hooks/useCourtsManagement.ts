import { addToast } from "@heroui/react";
import { useState } from "react";

import {
  useCourts,
  useCreateCourt,
  useDeleteCourt,
  useUpdateCourt,
} from "../../../hooks/useData";
import { useConfirm } from "../../../hooks/useConfirm";

type CourtFormData = {
  name: string;
  courtType: string;
  surface: string;
};

export const useCourtsManagement = (initialCourts?: any[]) => {
  const confirm = useConfirm();
  const { data: courtsData } = useCourts(true);
  const updateCourt = useUpdateCourt();
  const createCourt = useCreateCourt();
  const deleteCourt = useDeleteCourt();
  const [deleteCourtPendingId, setDeleteCourtPendingId] = useState<string | null>(
    null,
  );

  const courts = courtsData?.data || initialCourts || [];

  const handleCreateCourt = async ({
    name: rawName,
    courtType,
    surface: rawSurface,
  }: CourtFormData): Promise<boolean> => {
    const name = rawName.trim();
    const surface = rawSurface.trim();
    if (!name) {
      addToast({ title: "Ingresá un nombre de cancha", color: "danger" });
      return false;
    }
    if (!surface) {
      addToast({ title: "Ingresá la superficie de la cancha", color: "danger" });
      return false;
    }

    try {
      await createCourt.mutateAsync({ name, courtType, surface });
      addToast({ title: "Cancha creada", color: "success" });
      return true;
    } catch (err: any) {
      addToast({
        title: err?.response?.data?.error || "No se pudo crear la cancha",
        color: "danger",
      });
      return false;
    }
  };

  const handleToggleCourt = (id: string, isActive: boolean) => {
    updateCourt.mutate(
      { id, data: { isActive } },
      {
        onError: (err: any) => {
          addToast({
            title:
              err?.response?.data?.error || "No se pudo actualizar la cancha",
            color: "danger",
          });
        },
      },
    );
  };

  const handleSaveCourtName = async (
    id: string,
    payload: CourtFormData,
  ): Promise<boolean> => {
    const name = payload.name.trim();
    const surface = payload.surface.trim();
    if (!name) {
      addToast({ title: "Ingresá un nombre de cancha", color: "danger" });
      return false;
    }
    if (!surface) {
      addToast({ title: "Ingresá la superficie de la cancha", color: "danger" });
      return false;
    }

    try {
      await updateCourt.mutateAsync({
        id,
        data: { name, courtType: payload.courtType, surface },
      });
      addToast({ title: "Cancha actualizada", color: "success" });
      return true;
    } catch (err: any) {
      addToast({
        title: err?.response?.data?.error || "No se pudo actualizar la cancha",
        color: "danger",
      });
      return false;
    }
  };

  const handleDeleteCourt = async (id: string, courtName: string) => {
    const normalizedName = courtName.trim() || "esta cancha";
    const shouldDelete = await confirm(
      `¿Seguro que querés eliminar ${normalizedName}? Esta acción no se puede deshacer.`,
      { variant: "danger", title: "Eliminar cancha" },
    );
    if (!shouldDelete) return;

    setDeleteCourtPendingId(id);
    deleteCourt.mutate(id, {
      onSuccess: () => {
        addToast({ title: "Cancha eliminada", color: "success" });
      },
      onError: (err: any) => {
        addToast({
          title: err?.response?.data?.error || "No se pudo eliminar la cancha",
          color: "danger",
        });
      },
      onSettled: () => {
        setDeleteCourtPendingId(null);
      },
    });
  };

  return {
    courts,
    createCourtPending: createCourt.isPending,
    updateCourtPending: updateCourt.isPending,
    deleteCourtPendingId,
    handleCreateCourt,
    handleToggleCourt,
    handleSaveCourtName,
    handleDeleteCourt,
  };
};
