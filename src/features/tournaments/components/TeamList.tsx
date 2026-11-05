import {
  addToast, Button, Chip, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader,
  Select, SelectItem, Spinner,
} from "@heroui/react";
import { Pencil, Plus, Trash2, UserMinus } from "lucide-react";
import { useState } from "react";

import { fieldInputClassNames, fieldSelectClassNames } from "../../../components/ui/fieldStyles";
import { useConfirm } from "../../../hooks/useConfirm";
import { useUsers } from "../../../hooks/useData";
import type { TeamPayload, TournamentTeam } from "../../../services/tournamentService";
import type { User } from "../../../types";
import { useCreateTeam, useDeleteTeam, useTeams, useUpdateTeam, useWithdrawTeam } from "../hooks/useTournaments";

type TeamListProps = { tournamentId: string; categoryId: string; categoryName: string; maxTeams?: number | null };
type TeamFormModalProps = { isOpen: boolean; onClose: () => void; tournamentId: string; categoryId: string; editing: TournamentTeam | null };
type PlayerFieldsProps = { label: string; name: string; phone: string; userId: string; users: User[]; onNameChange: (value: string) => void; onPhoneChange: (value: string) => void; onUserChange: (value: string) => void };

const labelClass = "text-sm font-semibold text-on-surface-variant uppercase tracking-wider";
const getErrorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
  return typeof message === "string" && message ? message : fallback;
};

const PlayerFields = ({ label, name, phone, userId, users, onNameChange, onPhoneChange, onUserChange }: PlayerFieldsProps) => (
  <div className="space-y-3 rounded-md border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 p-3">
    <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
    <div className="space-y-2"><label className={labelClass}>Nombre</label>
      <Input value={name} onValueChange={onNameChange} placeholder="Nombre y apellido" variant="bordered" size="lg" classNames={fieldInputClassNames.lg} /></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-2"><label className={labelClass}>Teléfono</label>
        <Input value={phone} onValueChange={onPhoneChange} placeholder="Opcional" variant="bordered" size="lg" classNames={fieldInputClassNames.lg} /></div>
      <div className="space-y-2"><label className={labelClass}>Cliente</label>
        <Select
          aria-label={`Cliente ${label}`}
          items={[{ _id: "none", name: "Sin vincular" }, ...users]}
          selectedKeys={userId ? [userId] : []}
          placeholder="Sin vincular"
          onSelectionChange={(keys) => { const [key] = Array.from(keys); onUserChange(key && key !== "none" ? String(key) : ""); }}
          variant="bordered" size="lg" classNames={fieldSelectClassNames.lg}
        >{(item) => <SelectItem key={item._id}>{item.name}</SelectItem>}</Select>
      </div>
    </div>
  </div>
);

const TeamFormModal = ({ isOpen, onClose, tournamentId, categoryId, editing }: TeamFormModalProps) => {
  const { data: usersData } = useUsers();
  const createTeam = useCreateTeam(tournamentId, categoryId);
  const updateTeam = useUpdateTeam(tournamentId, categoryId);
  // Parent remounts the modal on open/edit changes, so props seed the state.
  const [player1Name, setPlayer1Name] = useState(editing?.player1Name ?? "");
  const [player1Phone, setPlayer1Phone] = useState(editing?.player1Phone ?? "");
  const [player1UserId, setPlayer1UserId] = useState(editing?.player1UserId ?? "");
  const [player2Name, setPlayer2Name] = useState(editing?.player2Name ?? "");
  const [player2Phone, setPlayer2Phone] = useState(editing?.player2Phone ?? "");
  const [player2UserId, setPlayer2UserId] = useState(editing?.player2UserId ?? "");
  const [seed, setSeed] = useState(editing?.seed != null ? String(editing.seed) : "");
  const users = (usersData?.data ?? []) as User[];
  const isSaving = createTeam.isPending || updateTeam.isPending;

  const handleSubmit = async () => {
    if (!player1Name.trim() || !player2Name.trim()) {
      return addToast({ title: "Completá el nombre de ambos jugadores.", color: "warning" });
    }
    let parsedSeed: number | null = null;
    if (seed.trim()) {
      const value = Number(seed);
      if (!Number.isInteger(value) || value < 1) {
        return addToast({ title: "La semilla debe ser un entero positivo.", color: "warning" });
      }
      parsedSeed = value;
    }
    const payload: TeamPayload = {
      name: `${player1Name.trim()} / ${player2Name.trim()}`,
      player1Name: player1Name.trim(), player2Name: player2Name.trim(),
      player1Phone: player1Phone.trim(), player2Phone: player2Phone.trim(),
      player1UserId: player1UserId || null, player2UserId: player2UserId || null,
      seed: parsedSeed,
    };
    try {
      if (editing) {
        await updateTeam.mutateAsync({ teamId: editing._id, data: payload });
        addToast({ title: "Pareja actualizada", color: "success" });
      } else {
        await createTeam.mutateAsync(payload);
        addToast({ title: "Pareja registrada", color: "success" });
      }
      onClose();
    } catch (error) {
      addToast({ title: getErrorMessage(error, "No se pudo guardar la pareja"), color: "danger" });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" backdrop="blur" className="bg-surface-container-high text-foreground dark">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-black">{editing ? "Editar pareja" : "Nueva pareja"}</h2>
          <p className="text-sm font-normal text-on-surface-variant">Cargá los dos jugadores. El cliente y el teléfono son opcionales.</p>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <PlayerFields
            label="Jugador 1" name={player1Name} phone={player1Phone} userId={player1UserId} users={users}
            onNameChange={setPlayer1Name} onPhoneChange={setPlayer1Phone} onUserChange={setPlayer1UserId}
          />
          <PlayerFields
            label="Jugador 2" name={player2Name} phone={player2Phone} userId={player2UserId} users={users}
            onNameChange={setPlayer2Name} onPhoneChange={setPlayer2Phone} onUserChange={setPlayer2UserId}
          />
          <div className="space-y-2"><label className={labelClass}>Semilla</label>
            <Input type="number" min={1} value={seed} onValueChange={setSeed} placeholder="Opcional" variant="bordered" size="lg" classNames={fieldInputClassNames.lg} /></div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={isSaving}>Cancelar</Button>
          <Button color="primary" onPress={handleSubmit} isLoading={isSaving} className="font-black">
            {editing ? "Guardar cambios" : "Registrar pareja"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export const TeamList = ({ tournamentId, categoryId, categoryName, maxTeams }: TeamListProps) => {
  const { data, isLoading, isError } = useTeams(tournamentId, categoryId);
  const withdrawTeam = useWithdrawTeam(tournamentId, categoryId);
  const deleteTeam = useDeleteTeam(tournamentId, categoryId);
  const confirm = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<TournamentTeam | null>(null);
  const teams = data ?? [];
  const registeredCount = teams.filter((team) => team.status !== "withdrawn").length;
  const closeModal = () => { setIsModalOpen(false); setEditing(null); };
  const openCreate = () => { setEditing(null); setIsModalOpen(true); };
  const openEdit = (team: TournamentTeam) => { setEditing(team); setIsModalOpen(true); };

  const handleWithdraw = async (team: TournamentTeam) => {
    const confirmed = await confirm(`¿Retirar a "${team.name}" de ${categoryName}? Libera su cupo y no participará de la llave.`, { title: "Retirar pareja", variant: "danger", confirmText: "Retirar" });
    if (!confirmed) return;
    try {
      await withdrawTeam.mutateAsync(team._id);
      addToast({ title: "Pareja retirada", color: "success" });
    } catch (error) {
      addToast({ title: getErrorMessage(error, "No se pudo retirar la pareja"), color: "danger" });
    }
  };

  const handleDelete = async (team: TournamentTeam) => {
    const confirmed = await confirm(`¿Eliminar a "${team.name}" de ${categoryName}?`, { title: "Eliminar pareja", variant: "danger", confirmText: "Eliminar" });
    if (!confirmed) return;
    try {
      await deleteTeam.mutateAsync(team._id);
      addToast({ title: "Pareja eliminada", color: "success" });
    } catch (error) {
      addToast({ title: getErrorMessage(error, "No se pudo eliminar la pareja"), color: "danger" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-on-surface-variant">
          {registeredCount}{maxTeams != null ? ` / ${maxTeams}` : ""} parejas registradas en {categoryName}.
        </p>
        <Button color="primary" size="sm" startContent={<Plus size={16} />} onPress={openCreate} className="rounded-md font-black">
          Nueva pareja
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner color="primary" /></div>
      ) : isError ? (
        <div className="rounded-md border border-black/5 dark:border-white/5 bg-dark-200 p-6 text-center">
          <p className="font-bold text-foreground">No pudimos cargar las parejas</p>
          <p className="text-sm text-on-surface-variant">Reintentá en unos segundos.</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="rounded-md border border-dashed border-black/10 dark:border-white/10 bg-dark-200 p-8 text-center">
          <p className="font-bold text-foreground">Todavía no hay parejas</p>
          <p className="text-sm text-on-surface-variant">Registrá la primera pareja de esta categoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {teams.map((team) => (
            <article key={team._id} className="rounded-lg border border-black/5 dark:border-white/5 bg-dark-200 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-black text-foreground truncate">{team.name}</h3>
                  <p className="text-sm text-on-surface-variant truncate">{team.player1Name} / {team.player2Name}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  {team.seed != null && <Chip size="sm" variant="flat" color="primary" className="font-bold">Semilla {team.seed}</Chip>}
                  {team.status === "withdrawn" && <Chip size="sm" variant="flat" color="danger" className="font-bold">Retirada</Chip>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="flat" startContent={<Pencil size={14} />} onPress={() => openEdit(team)} className="font-bold">Editar</Button>
                {team.status !== "withdrawn" && (
                  <Button size="sm" variant="flat" color="warning" startContent={<UserMinus size={14} />} onPress={() => handleWithdraw(team)} className="font-bold">Retirar</Button>
                )}
                <Button size="sm" variant="flat" color="danger" startContent={<Trash2 size={14} />} onPress={() => handleDelete(team)} className="font-bold">Eliminar</Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <TeamFormModal
        key={`${isModalOpen ? "open" : "closed"}-${editing?._id ?? "new"}`}
        isOpen={isModalOpen} onClose={closeModal} tournamentId={tournamentId}
        categoryId={categoryId} editing={editing}
      />
    </div>
  );
};
