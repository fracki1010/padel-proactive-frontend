import {
  Button,
  Card,
  CardBody,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Input,
} from "@heroui/react";
import { CalendarOff, ChevronLeft, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useState } from "react";

import type { ClubClosure } from "../../../types";

type ClubClosuresViewProps = {
  closures: ClubClosure[];
  createPending: boolean;
  updatePending: boolean;
  deletePendingId: string | null;
  onBack: () => void;
  onCreate: (data: { startDate: string; endDate: string; reason: string }) => Promise<boolean>;
  onUpdate: (id: string, data: { startDate: string; endDate: string; reason: string }) => Promise<boolean>;
  onDelete: (id: string) => void;
};

const formatDate = (iso: string): string => {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
};

export const ClubClosuresView = ({
  closures,
  createPending,
  updatePending,
  deletePendingId,
  onBack,
  onCreate,
  onUpdate,
  onDelete,
}: ClubClosuresViewProps) => {
  const today = new Date().toISOString().slice(0, 10);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createStart, setCreateStart] = useState(today);
  const [createEnd, setCreateEnd] = useState(today);
  const [createReason, setCreateReason] = useState("");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editReason, setEditReason] = useState("");

  const handleCreate = async () => {
    const ok = await onCreate({ startDate: createStart, endDate: createEnd, reason: createReason });
    if (ok) {
      setIsCreateOpen(false);
      setCreateStart(today);
      setCreateEnd(today);
      setCreateReason("");
    }
  };

  const openEdit = (closure: ClubClosure) => {
    setEditId(closure._id);
    setEditStart(closure.startDate);
    setEditEnd(closure.endDate);
    setEditReason(closure.reason || "");
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editId) return;
    const ok = await onUpdate(editId, { startDate: editStart, endDate: editEnd, reason: editReason });
    if (ok) {
      setIsEditOpen(false);
      setEditId(null);
    }
  };

  const createDateError =
    createStart && createEnd && createStart > createEnd
      ? "La fecha de inicio no puede ser posterior a la fecha de fin."
      : null;

  const editDateError =
    editStart && editEnd && editStart > editEnd
      ? "La fecha de inicio no puede ser posterior a la fecha de fin."
      : null;

  return (
    <div className="space-y-6 pb-8 max-w-6xl mx-auto lg:max-w-none">
      <div className="flex items-center gap-4">
        <Button
          isIconOnly
          variant="flat"
          className="rounded-2xl"
          onPress={onBack}
        >
          <ChevronLeft size={20} />
        </Button>
        <div>
          <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
            Cierres del Club
          </h2>
          <p className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">
            Períodos en los que el club estará cerrado
          </p>
        </div>
      </div>

      <Button
        className="w-full h-12 bg-primary text-black rounded-2xl font-black uppercase tracking-widest"
        startContent={<Plus size={18} />}
        onPress={() => setIsCreateOpen(true)}
      >
        Agregar cierre
      </Button>

      {closures.length === 0 ? (
        <Card className="bg-dark-100 border border-black/5 dark:border-white/5 rounded-2xl">
          <CardBody className="flex flex-col items-center gap-3 py-10 text-center">
            <CalendarOff size={32} className="text-gray-500" />
            <p className="text-sm font-bold text-gray-500 uppercase">
              No hay cierres programados
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {closures.map((closure) => (
            <Card
              key={closure._id}
              className="bg-dark-100 border border-black/5 dark:border-white/5 rounded-2xl"
            >
              <CardBody className="p-4 flex flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400 shrink-0">
                    <CalendarOff size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-foreground text-sm">
                      {formatDate(closure.startDate)}
                      {closure.startDate !== closure.endDate && (
                        <> &rarr; {formatDate(closure.endDate)}</>
                      )}
                    </p>
                    {closure.reason ? (
                      <p className="text-[11px] text-gray-400 font-bold truncate">
                        {closure.reason}
                      </p>
                    ) : (
                      <p className="text-[11px] text-gray-600 italic">Sin motivo</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    className="rounded-xl text-gray-400"
                    onPress={() => openEdit(closure)}
                  >
                    <Pencil size={15} />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    className="rounded-xl text-red-400"
                    isLoading={deletePendingId === closure._id}
                    onPress={() => onDelete(closure._id)}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Create drawer */}
      <Drawer isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} placement="bottom">
        <DrawerContent>
          <DrawerHeader className="font-black uppercase text-foreground text-sm">
            Nuevo cierre
          </DrawerHeader>
          <DrawerBody className="space-y-4 pb-2">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Fecha inicio"
                type="date"
                value={createStart}
                onValueChange={setCreateStart}
                classNames={{
                  inputWrapper: "bg-black/5 dark:bg-white/5 border-none rounded-2xl",
                  input: "text-foreground font-bold",
                  label: "text-[10px] font-black uppercase text-gray-500",
                }}
              />
              <Input
                label="Fecha fin"
                type="date"
                value={createEnd}
                onValueChange={setCreateEnd}
                classNames={{
                  inputWrapper: "bg-black/5 dark:bg-white/5 border-none rounded-2xl",
                  input: "text-foreground font-bold",
                  label: "text-[10px] font-black uppercase text-gray-500",
                }}
              />
            </div>
            {createDateError && (
              <p className="text-[11px] font-bold text-red-400">{createDateError}</p>
            )}
            <Input
              label="Motivo (opcional)"
              placeholder="Ej: Cerrado por torneo"
              value={createReason}
              onValueChange={setCreateReason}
              classNames={{
                inputWrapper: "bg-black/5 dark:bg-white/5 border-none rounded-2xl",
                input: "text-foreground font-bold",
                label: "text-[10px] font-black uppercase text-gray-500",
              }}
            />
          </DrawerBody>
          <DrawerFooter className="gap-3">
            <Button
              variant="flat"
              className="rounded-2xl font-black uppercase"
              startContent={<X size={16} />}
              onPress={() => setIsCreateOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-primary text-black rounded-2xl font-black uppercase"
              startContent={<Save size={16} />}
              isDisabled={!createStart || !createEnd || Boolean(createDateError)}
              isLoading={createPending}
              onPress={handleCreate}
            >
              Guardar
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Edit drawer */}
      <Drawer isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} placement="bottom">
        <DrawerContent>
          <DrawerHeader className="font-black uppercase text-foreground text-sm">
            Editar cierre
          </DrawerHeader>
          <DrawerBody className="space-y-4 pb-2">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Fecha inicio"
                type="date"
                value={editStart}
                onValueChange={setEditStart}
                classNames={{
                  inputWrapper: "bg-black/5 dark:bg-white/5 border-none rounded-2xl",
                  input: "text-foreground font-bold",
                  label: "text-[10px] font-black uppercase text-gray-500",
                }}
              />
              <Input
                label="Fecha fin"
                type="date"
                value={editEnd}
                onValueChange={setEditEnd}
                classNames={{
                  inputWrapper: "bg-black/5 dark:bg-white/5 border-none rounded-2xl",
                  input: "text-foreground font-bold",
                  label: "text-[10px] font-black uppercase text-gray-500",
                }}
              />
            </div>
            {editDateError && (
              <p className="text-[11px] font-bold text-red-400">{editDateError}</p>
            )}
            <Input
              label="Motivo (opcional)"
              placeholder="Ej: Cerrado por torneo"
              value={editReason}
              onValueChange={setEditReason}
              classNames={{
                inputWrapper: "bg-black/5 dark:bg-white/5 border-none rounded-2xl",
                input: "text-foreground font-bold",
                label: "text-[10px] font-black uppercase text-gray-500",
              }}
            />
          </DrawerBody>
          <DrawerFooter className="gap-3">
            <Button
              variant="flat"
              className="rounded-2xl font-black uppercase"
              startContent={<X size={16} />}
              onPress={() => setIsEditOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-primary text-black rounded-2xl font-black uppercase"
              startContent={<Save size={16} />}
              isDisabled={!editStart || !editEnd || Boolean(editDateError)}
              isLoading={updatePending}
              onPress={handleUpdate}
            >
              Guardar
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
