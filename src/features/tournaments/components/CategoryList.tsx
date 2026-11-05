import {
  addToast, Button, Chip, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader,
  Select, SelectItem, Spinner,
} from "@heroui/react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";

import { fieldInputClassNames, fieldSelectClassNames } from "../../../components/ui/fieldStyles";
import { useConfirm } from "../../../hooks/useConfirm";
import { getErrorMessage } from "../../../services/apiError";
import type { CategoryPayload, CategorySeeding, TournamentCategory } from "../../../services/tournamentService";
import { MAX_CATEGORY_TEAMS, MIN_CATEGORY_TEAMS } from "../constants";
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from "../hooks/useTournaments";

type CategoryListProps = { tournamentId: string; onManageTeams: (categoryId: string) => void };
type CategoryFormModalProps = { isOpen: boolean; onClose: () => void; tournamentId: string; editing: TournamentCategory | null };

const labelClass = "text-sm font-semibold text-on-surface-variant uppercase tracking-wider";
const seedingLabel = (seeding: CategorySeeding) => (seeding === "manual" ? "Siembra manual" : "Sorteo");
const CategoryFormModal = ({ isOpen, onClose, tournamentId, editing }: CategoryFormModalProps) => {
  const createCategory = useCreateCategory(tournamentId);
  const updateCategory = useUpdateCategory(tournamentId);
  // Parent remounts the modal on open/edit changes, so props seed the state.
  const [name, setName] = useState(editing?.name ?? "");
  const [maxTeams, setMaxTeams] = useState(editing?.maxTeams != null ? String(editing.maxTeams) : "");
  const [seeding, setSeeding] = useState<CategorySeeding>(editing?.seeding ?? "shuffle");
  const isSaving = createCategory.isPending || updateCategory.isPending;

  const handleSubmit = async () => {
    if (!name.trim()) return addToast({ title: "El nombre de la categoría es obligatorio.", color: "warning" });
    let parsedMaxTeams: number | null = null;
    if (maxTeams.trim()) {
      const value = Number(maxTeams);
      if (!Number.isInteger(value) || value < MIN_CATEGORY_TEAMS || value > MAX_CATEGORY_TEAMS) {
        return addToast({ title: `El máximo de parejas debe ser un entero entre ${MIN_CATEGORY_TEAMS} y ${MAX_CATEGORY_TEAMS}.`, color: "warning" });
      }
      parsedMaxTeams = value;
    }
    const payload: CategoryPayload = { name: name.trim(), maxTeams: parsedMaxTeams, seeding };
    try {
      if (editing) {
        await updateCategory.mutateAsync({ categoryId: editing._id, data: payload });
        addToast({ title: "Categoría actualizada", color: "success" });
      } else {
        await createCategory.mutateAsync(payload);
        addToast({ title: "Categoría creada", color: "success" });
      }
      onClose();
    } catch (error) {
      addToast({ title: getErrorMessage(error, "No se pudo guardar la categoría"), color: "danger" });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" backdrop="blur" className="bg-surface-container-high text-foreground dark">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-black">{editing ? "Editar categoría" : "Nueva categoría"}</h2>
          <p className="text-sm font-normal text-on-surface-variant">Definí el cupo y cómo se ordenan las parejas en la llave.</p>
        </ModalHeader>
        <ModalBody className="space-y-5">
          <div className="space-y-2"><label htmlFor="category-name" className={labelClass}>Nombre</label>
            <Input id="category-name" value={name} onValueChange={setName} placeholder="Primera" variant="bordered" size="lg" classNames={fieldInputClassNames.lg} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><label htmlFor="category-max-teams" className={labelClass}>Máximo de parejas</label>
              <Input id="category-max-teams" type="number" min={MIN_CATEGORY_TEAMS} max={MAX_CATEGORY_TEAMS} value={maxTeams} onValueChange={setMaxTeams} placeholder="Sin límite" variant="bordered" size="lg" classNames={fieldInputClassNames.lg} /></div>
            <div className="space-y-2"><label id="category-seeding-label" className={labelClass}>Siembra</label>
              <Select
                aria-labelledby="category-seeding-label" selectedKeys={[seeding]}
                onSelectionChange={(keys) => { const [key] = Array.from(keys); if (key) setSeeding(String(key) as CategorySeeding); }}
                variant="bordered" size="lg" classNames={fieldSelectClassNames.lg}
              ><SelectItem key="shuffle">Sorteo</SelectItem><SelectItem key="manual">Siembra manual</SelectItem></Select>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={isSaving}>Cancelar</Button>
          <Button color="primary" onPress={handleSubmit} isLoading={isSaving} className="font-black">
            {editing ? "Guardar cambios" : "Crear categoría"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export const CategoryList = ({ tournamentId, onManageTeams }: CategoryListProps) => {
  const { data, isLoading, isError } = useCategories(tournamentId);
  const deleteCategory = useDeleteCategory(tournamentId);
  const confirm = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<TournamentCategory | null>(null);
  const categories = data ?? [];
  const closeModal = () => { setIsModalOpen(false); setEditing(null); };
  const openCreate = () => { setEditing(null); setIsModalOpen(true); };
  const openEdit = (category: TournamentCategory) => { setEditing(category); setIsModalOpen(true); };

  const handleDelete = async (category: TournamentCategory) => {
    const confirmed = await confirm(`¿Eliminar la categoría "${category.name}"? Se borran sus parejas y partidos.`, { title: "Eliminar categoría", variant: "danger", confirmText: "Eliminar" });
    if (!confirmed) return;
    try {
      await deleteCategory.mutateAsync(category._id);
      addToast({ title: "Categoría eliminada", color: "success" });
    } catch (error) {
      addToast({ title: getErrorMessage(error, "No se pudo eliminar la categoría"), color: "danger" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-on-surface-variant">Categorías del torneo y su cupo de parejas.</p>
        <Button color="primary" size="sm" startContent={<Plus size={16} />} onPress={openCreate} className="rounded-md font-black">
          Nueva categoría
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner color="primary" /></div>
      ) : isError ? (
        <div className="rounded-md border border-black/5 dark:border-white/5 bg-dark-200 p-6 text-center">
          <p className="font-bold text-foreground">No pudimos cargar las categorías</p>
          <p className="text-sm text-on-surface-variant">Reintentá en unos segundos.</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-md border border-dashed border-black/10 dark:border-white/10 bg-dark-200 p-8 text-center">
          <p className="font-bold text-foreground">Todavía no hay categorías</p>
          <p className="text-sm text-on-surface-variant">Creá la primera para empezar a registrar parejas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {categories.map((category) => (
            <article key={category._id} className="rounded-lg border border-black/5 dark:border-white/5 bg-dark-200 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-black text-foreground truncate">{category.name}</h3>
                  <p className="text-sm text-on-surface-variant">
                    {seedingLabel(category.seeding)}{category.maxTeams != null ? ` · máx. ${category.maxTeams} parejas` : " · sin cupo máximo"}
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  {category.bracketSize != null && <Chip size="sm" variant="flat" color="primary" className="font-bold">Llave {category.bracketSize}</Chip>}
                  {category.bracketStale && <Chip size="sm" variant="flat" color="warning" className="font-bold">Regenerar</Chip>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="flat" startContent={<Users size={14} />} onPress={() => onManageTeams(category._id)} className="font-bold">Parejas</Button>
                <Button size="sm" variant="flat" startContent={<Pencil size={14} />} onPress={() => openEdit(category)} className="font-bold">Editar</Button>
                <Button size="sm" variant="flat" color="danger" startContent={<Trash2 size={14} />} onPress={() => handleDelete(category)} className="font-bold">Eliminar</Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <CategoryFormModal
        key={`${isModalOpen ? "open" : "closed"}-${editing?._id ?? "new"}`}
        isOpen={isModalOpen} onClose={closeModal} tournamentId={tournamentId} editing={editing}
      />
    </div>
  );
};
