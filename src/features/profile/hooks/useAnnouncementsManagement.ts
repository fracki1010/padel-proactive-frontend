import { addToast } from "@heroui/react";
import { useState } from "react";

import {
  useAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
  useToggleAnnouncement,
} from "../../../hooks/useData";
import { useConfirm } from "../../../hooks/useConfirm";
import type { Announcement, AnnouncementInput, AnnouncementType } from "../../../types";

export type AnnouncementFormData = {
  title: string;
  message: string;
  type: AnnouncementType;
  startsAt: string | null;
  endsAt: string | null;
};

const toInput = (data: AnnouncementFormData): AnnouncementInput => ({
  title: data.title,
  message: data.message,
  type: data.type,
  startsAt: data.startsAt || null,
  endsAt: data.endsAt || null,
});

const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (typeof err === "object" && err !== null && "response" in err) {
    const response = (err as { response?: { data?: { error?: string } } }).response;
    return response?.data?.error || fallback;
  }
  return fallback;
};

export const useAnnouncementsManagement = () => {
  const confirm = useConfirm();
  const { data, isLoading, isError } = useAnnouncements();
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();
  const toggleAnnouncement = useToggleAnnouncement();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const announcements: Announcement[] = data?.data || [];

  const handleCreate = async (input: AnnouncementFormData): Promise<boolean> => {
    return new Promise((resolve) => {
      createAnnouncement.mutate(toInput(input), {
        onSuccess: () => {
          addToast({ title: "Aviso publicado", color: "success" });
          resolve(true);
        },
        onError: (err: unknown) => {
          addToast({
            title: extractErrorMessage(err, "No se pudo publicar el aviso"),
            color: "danger",
          });
          resolve(false);
        },
      });
    });
  };

  const handleUpdate = async (
    id: string,
    input: AnnouncementFormData,
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      updateAnnouncement.mutate(
        { id, data: toInput(input) },
        {
          onSuccess: () => {
            addToast({ title: "Aviso actualizado", color: "success" });
            resolve(true);
          },
          onError: (err: unknown) => {
            addToast({
              title: extractErrorMessage(err, "No se pudo actualizar el aviso"),
              color: "danger",
            });
            resolve(false);
          },
        },
      );
    });
  };

  const handleToggle = (id: string) => {
    setTogglingId(id);
    toggleAnnouncement.mutate(id, {
      onSuccess: () => {
        addToast({ title: "Estado del aviso actualizado", color: "success" });
      },
      onError: (err: unknown) => {
        addToast({
          title: extractErrorMessage(err, "No se pudo cambiar el estado"),
          color: "danger",
        });
      },
      onSettled: () => {
        setTogglingId(null);
      },
    });
  };

  const handleDelete = async (id: string) => {
    const shouldDelete = await confirm(
      "¿Seguro que querés eliminar este aviso? Esta acción no se puede deshacer.",
      { variant: "danger", title: "Eliminar aviso" },
    );
    if (!shouldDelete) return;

    setDeletingId(id);
    deleteAnnouncement.mutate(id, {
      onSuccess: () => {
        addToast({ title: "Aviso eliminado", color: "success" });
      },
      onError: (err: unknown) => {
        addToast({
          title: extractErrorMessage(err, "No se pudo eliminar el aviso"),
          color: "danger",
        });
      },
      onSettled: () => {
        setDeletingId(null);
      },
    });
  };

  return {
    announcements,
    isLoading,
    isError,
    createPending: createAnnouncement.isPending,
    updatePending: updateAnnouncement.isPending,
    deletePendingId: deletingId,
    togglePendingId: togglingId,
    handleCreate,
    handleUpdate,
    handleToggle,
    handleDelete,
  };
};
