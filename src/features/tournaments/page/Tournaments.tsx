import { addToast, Button, Chip, Spinner } from "@heroui/react";
import { CalendarRange, Pencil, Plus, Trash2, Trophy } from "lucide-react";
import { useState } from "react";

import { useConfirm } from "../../../hooks/useConfirm";
import type {
  Tournament,
  TournamentStatus,
} from "../../../services/tournamentService";
import { TournamentFormModal } from "../components/TournamentFormModal";
import { useDeleteTournament, useTournaments } from "../hooks/useTournaments";

const STATUS_META: Record<
  TournamentStatus,
  { label: string; color: "default" | "primary" | "success" | "danger" }
> = {
  draft: { label: "Borrador", color: "default" },
  in_progress: { label: "En curso", color: "primary" },
  finished: { label: "Finalizado", color: "success" },
  cancelled: { label: "Cancelado", color: "danger" },
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { response?: { data?: { error?: string } } })
    ?.response?.data?.error;
  return typeof message === "string" && message ? message : fallback;
};

const courtCountLabel = (count: number): string =>
  `${count} ${count === 1 ? "cancha" : "canchas"}`;

export const Tournaments = () => {
  const { data, isLoading, isError } = useTournaments();
  const deleteTournament = useDeleteTournament();
  const confirm = useConfirm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tournament | null>(null);

  const tournaments = data ?? [];

  const openCreate = () => {
    setEditing(null);
    setIsModalOpen(true);
  };

  const openEdit = (tournament: Tournament) => {
    setEditing(tournament);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
  };

  const handleDelete = async (tournament: Tournament) => {
    const confirmed = await confirm(
      "¿Eliminar este torneo? Se borrarán sus categorías, parejas y partidos. Las reservas no se modifican.",
      { title: "Eliminar torneo", variant: "danger", confirmText: "Eliminar" },
    );
    if (!confirmed) return;

    try {
      await deleteTournament.mutateAsync(tournament._id);
      addToast({ title: "Torneo eliminado", color: "success" });
    } catch (error) {
      addToast({
        title: getErrorMessage(error, "No se pudo eliminar el torneo"),
        color: "danger",
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Torneos
          </h1>
          <p className="text-sm text-on-surface-variant">
            Organizá torneos y bloqueá las canchas mientras están en curso.
          </p>
        </div>
        <Button
          color="primary"
          className="rounded-md font-black shadow-lg shadow-primary/20"
          startContent={<Plus size={18} />}
          onPress={openCreate}
        >
          Nuevo torneo
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner color="primary" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center min-h-[280px] text-center p-8 bg-dark-200 rounded-md border border-black/5 dark:border-white/5">
          <h3 className="text-lg font-bold mb-1 text-foreground">
            No pudimos cargar los torneos
          </h3>
          <p className="text-on-surface-variant text-sm">
            Reintentá en unos segundos.
          </p>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[280px] text-center p-8 bg-dark-200 rounded-md border border-black/5 dark:border-white/5">
          <Trophy size={48} className="text-on-surface-variant mb-4" />
          <h3 className="text-xl font-bold mb-1 text-foreground">
            Todavía no hay torneos
          </h3>
          <p className="text-on-surface-variant text-sm mb-5">
            Creá el primero para empezar a organizar categorías y parejas.
          </p>
          <Button
            color="primary"
            className="rounded-md font-black shadow-lg shadow-primary/20"
            startContent={<Plus size={18} />}
            onPress={openCreate}
          >
            Nuevo torneo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tournaments.map((tournament) => {
            const status = STATUS_META[tournament.status];
            return (
              <article
                key={tournament._id}
                className="rounded-lg border border-black/5 dark:border-white/5 bg-dark-200 p-4 sm:p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-black text-foreground truncate">
                      {tournament.name}
                    </h2>
                    {tournament.description?.trim() && (
                      <p className="text-sm text-on-surface-variant line-clamp-2">
                        {tournament.description}
                      </p>
                    )}
                  </div>
                  <Chip
                    size="sm"
                    variant="flat"
                    color={status.color}
                    className="font-bold shrink-0"
                  >
                    {status.label}
                  </Chip>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-on-surface-variant">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarRange size={15} />
                    {tournament.startDate} → {tournament.endDate}
                  </span>
                  <span>{courtCountLabel(tournament.courts?.length ?? 0)}</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="flat"
                    startContent={<Pencil size={14} />}
                    onPress={() => openEdit(tournament)}
                    className="font-bold"
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    color="danger"
                    startContent={<Trash2 size={14} />}
                    onPress={() => handleDelete(tournament)}
                    className="font-bold"
                  >
                    Eliminar
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <TournamentFormModal
        key={`${isModalOpen ? "open" : "closed"}-${editing?._id ?? "new"}`}
        isOpen={isModalOpen}
        onClose={closeModal}
        editing={editing}
      />
    </div>
  );
};
