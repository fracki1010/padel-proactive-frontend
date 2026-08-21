import { addToast } from "@heroui/react";
import { useState } from "react";

import {
  useClubClosures,
  useCreateClubClosure,
  useUpdateClubClosure,
  useDeleteClubClosure,
} from "../../../hooks/useData";
import { useConfirm } from "../../../hooks/useConfirm";

export const useClubClosuresManagement = () => {
  const confirm = useConfirm();
  const { data: clubClosuresData } = useClubClosures();
  const createClubClosure = useCreateClubClosure();
  const updateClubClosure = useUpdateClubClosure();
  const deleteClubClosure = useDeleteClubClosure();
  const [deletingClosureId, setDeletingClosureId] = useState<string | null>(null);

  const closures = clubClosuresData?.data || [];

  const handleCreate = async (data: {
    startDate: string;
    endDate: string;
    reason: string;
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      createClubClosure.mutate(data, {
        onSuccess: () => {
          addToast({ title: "Cierre agregado", color: "success" });
          resolve(true);
        },
        onError: (err: any) => {
          addToast({
            title: err?.response?.data?.error || "No se pudo agregar el cierre",
            color: "danger",
          });
          resolve(false);
        },
      });
    });
  };

  const handleUpdate = async (
    id: string,
    data: { startDate: string; endDate: string; reason: string },
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      updateClubClosure.mutate(
        { id, data },
        {
          onSuccess: () => {
            addToast({ title: "Cierre actualizado", color: "success" });
            resolve(true);
          },
          onError: (err: any) => {
            addToast({
              title:
                err?.response?.data?.error || "No se pudo actualizar el cierre",
              color: "danger",
            });
            resolve(false);
          },
        },
      );
    });
  };

  const handleDelete = async (id: string) => {
    const shouldDelete = await confirm(
      "¿Seguro que querés eliminar este cierre? Esta acción no se puede deshacer.",
      { variant: "danger", title: "Eliminar cierre" },
    );
    if (!shouldDelete) return;

    setDeletingClosureId(id);
    deleteClubClosure.mutate(id, {
      onSuccess: () => {
        addToast({ title: "Cierre eliminado", color: "success" });
      },
      onError: (err: any) => {
        addToast({
          title: err?.response?.data?.error || "No se pudo eliminar el cierre",
          color: "danger",
        });
      },
      onSettled: () => {
        setDeletingClosureId(null);
      },
    });
  };

  return {
    closures,
    createPending: createClubClosure.isPending,
    updatePending: updateClubClosure.isPending,
    deletePendingId: deletingClosureId,
    handleCreate,
    handleUpdate,
    handleDelete,
  };
};
