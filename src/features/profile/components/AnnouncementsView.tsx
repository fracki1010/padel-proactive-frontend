import {
  Button,
  Card,
  CardBody,
  Chip,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Input,
  Select,
  SelectItem,
  Spinner,
  Switch,
  Textarea,
} from "@heroui/react";
import {
  AlertTriangle,
  BellOff,
  ChevronLeft,
  Info,
  Megaphone,
  Pencil,
  Plus,
  Save,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

import type { Announcement, AnnouncementType } from "../../../types";
import type { AnnouncementFormData } from "../hooks/useAnnouncementsManagement";

type AnnouncementsViewProps = {
  announcements: Announcement[];
  isLoading: boolean;
  isError: boolean;
  createPending: boolean;
  updatePending: boolean;
  deletePendingId: string | null;
  togglePendingId: string | null;
  onBack: () => void;
  onCreate: (data: AnnouncementFormData) => Promise<boolean>;
  onUpdate: (id: string, data: AnnouncementFormData) => Promise<boolean>;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

const TYPE_META: Record<
  AnnouncementType,
  {
    label: string;
    chip: "primary" | "warning" | "success";
    iconClass: string;
    Icon: typeof Info;
  }
> = {
  info: {
    label: "Info",
    chip: "primary",
    iconClass: "bg-primary/10 text-primary",
    Icon: Info,
  },
  important: {
    label: "Importante",
    chip: "warning",
    iconClass: "bg-amber-500/10 text-amber-400",
    Icon: AlertTriangle,
  },
  promo: {
    label: "Promo",
    chip: "success",
    iconClass: "bg-green-500/10 text-green-400",
    Icon: Tag,
  },
};

const TYPE_OPTIONS: AnnouncementType[] = ["info", "important", "promo"];

const emptyForm: AnnouncementFormData = {
  title: "",
  message: "",
  type: "info",
  startsAt: null,
  endsAt: null,
};

const toFormData = (announcement: Announcement): AnnouncementFormData => ({
  title: announcement.title,
  message: announcement.message,
  type: announcement.type,
  startsAt: announcement.startsAt ? announcement.startsAt.slice(0, 10) : null,
  endsAt: announcement.endsAt ? announcement.endsAt.slice(0, 10) : null,
});

const formatDay = (iso: string): string => {
  const [year, month, day] = iso.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
};

const formatVigencia = (announcement: Announcement): string => {
  if (!announcement.startsAt && !announcement.endsAt) {
    return "Sin límite de vigencia";
  }
  if (announcement.startsAt && announcement.endsAt) {
    return `${formatDay(announcement.startsAt)} → ${formatDay(announcement.endsAt)}`;
  }
  if (announcement.startsAt) {
    return `Desde ${formatDay(announcement.startsAt)}`;
  }
  return `Hasta ${formatDay(announcement.endsAt as string)}`;
};

const inputClassNames = {
  inputWrapper: "bg-black/5 dark:bg-white/5 border-none rounded-md",
  input: "text-foreground font-bold",
  label: "text-[10px] font-black uppercase text-on-surface-variant",
};

type AnnouncementFormDrawerProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  initial: AnnouncementFormData | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (data: AnnouncementFormData) => Promise<boolean>;
};

const AnnouncementFormDrawer = ({
  isOpen,
  mode,
  initial,
  isPending,
  onClose,
  onSubmit,
}: AnnouncementFormDrawerProps) => {
  const seed = initial ?? emptyForm;
  const [title, setTitle] = useState(seed.title);
  const [message, setMessage] = useState(seed.message);
  const [type, setType] = useState<AnnouncementType>(seed.type);
  const [startsAt, setStartsAt] = useState(seed.startsAt ?? "");
  const [endsAt, setEndsAt] = useState(seed.endsAt ?? "");

  const invalidRange = Boolean(startsAt && endsAt && startsAt > endsAt);
  const canSave = Boolean(title.trim() && message.trim()) && !invalidRange;

  const handleSubmit = async () => {
    const ok = await onSubmit({
      title,
      message,
      type,
      startsAt: startsAt || null,
      endsAt: endsAt || null,
    });
    if (ok) onClose();
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="bottom">
      <DrawerContent>
        <DrawerHeader className="font-black uppercase text-foreground text-sm">
          {mode === "create" ? "Nuevo aviso" : "Editar aviso"}
        </DrawerHeader>
        <DrawerBody className="space-y-4 pb-2">
          <Input
            label="Título"
            placeholder="Ej: Torneo el sábado"
            value={title}
            onValueChange={setTitle}
            maxLength={120}
            classNames={inputClassNames}
          />
          <Textarea
            label="Mensaje"
            placeholder="Ej: Turnos hasta las 18h"
            value={message}
            onValueChange={setMessage}
            minRows={2}
            maxRows={5}
            classNames={inputClassNames}
          />
          <Select
            label="Tipo"
            selectedKeys={[type]}
            onSelectionChange={(keys) => {
              const next = Array.from(keys)[0] as AnnouncementType | undefined;
              if (next) setType(next);
            }}
            classNames={{
              trigger: "bg-black/5 dark:bg-white/5 border-none rounded-md",
              value: "text-foreground font-bold",
              label: "text-[10px] font-black uppercase text-on-surface-variant",
              popoverContent:
                "bg-dark-200 border border-black/10 dark:border-white/10 text-foreground",
              listbox: "text-foreground",
            }}
          >
            {TYPE_OPTIONS.map((option) => (
              <SelectItem key={option} textValue={TYPE_META[option].label}>
                {TYPE_META[option].label}
              </SelectItem>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Vigente desde"
              type="date"
              value={startsAt}
              onValueChange={setStartsAt}
              classNames={inputClassNames}
            />
            <Input
              label="Vigente hasta"
              type="date"
              value={endsAt}
              onValueChange={setEndsAt}
              classNames={inputClassNames}
            />
          </div>
          {invalidRange && (
            <p className="text-[11px] font-bold text-red-400">
              La fecha de inicio no puede ser posterior a la de fin.
            </p>
          )}
          <p className="text-[10px] font-bold uppercase text-on-surface-variant">
            Dejá las fechas vacías para publicar sin límite de vigencia.
          </p>
        </DrawerBody>
        <DrawerFooter className="gap-3">
          <Button
            variant="flat"
            className="rounded-md font-black uppercase"
            startContent={<X size={16} />}
            onPress={onClose}
          >
            Cancelar
          </Button>
          <Button
            className="bg-primary text-black dark:text-white rounded-md font-black uppercase"
            startContent={<Save size={16} />}
            isDisabled={!canSave}
            isLoading={isPending}
            onPress={handleSubmit}
          >
            Guardar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export const AnnouncementsView = ({
  announcements,
  isLoading,
  isError,
  createPending,
  updatePending,
  deletePendingId,
  togglePendingId,
  onBack,
  onCreate,
  onUpdate,
  onToggle,
  onDelete,
}: AnnouncementsViewProps) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Announcement | null>(null);

  return (
    <div className="space-y-6 pb-8 max-w-6xl mx-auto lg:max-w-none">
      <div className="flex items-center gap-4">
        <Button isIconOnly variant="flat" className="rounded-md" onPress={onBack}>
          <ChevronLeft size={20} />
        </Button>
        <div>
          <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
            Avisos del Club
          </h2>
          <p className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest">
            Mensajes que ven tus clientes en el portal de reservas
          </p>
        </div>
      </div>

      <Button
        className="w-full h-12 bg-primary text-black dark:text-white rounded-md font-black uppercase tracking-widest"
        startContent={<Plus size={18} />}
        onPress={() => setIsCreateOpen(true)}
      >
        Agregar aviso
      </Button>

      {isLoading ? (
        <Card className="bg-dark-100 border border-black/5 dark:border-white/5 rounded-md">
          <CardBody className="flex flex-col items-center gap-3 py-10">
            <Spinner color="primary" />
            <p className="text-sm font-bold text-on-surface-variant uppercase">
              Cargando avisos
            </p>
          </CardBody>
        </Card>
      ) : isError ? (
        <Card className="bg-dark-100 border border-red-500/20 rounded-md">
          <CardBody className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertTriangle size={32} className="text-red-400" />
            <p className="text-sm font-bold text-red-400 uppercase">
              No se pudieron cargar los avisos
            </p>
          </CardBody>
        </Card>
      ) : announcements.length === 0 ? (
        <Card className="bg-dark-100 border border-black/5 dark:border-white/5 rounded-md">
          <CardBody className="flex flex-col items-center gap-3 py-10 text-center">
            <BellOff size={32} className="text-on-surface-variant" />
            <p className="text-sm font-bold text-on-surface-variant uppercase">
              No hay avisos publicados
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => {
            const meta = TYPE_META[announcement.type] ?? TYPE_META.info;
            const { Icon } = meta;
            return (
              <Card
                key={announcement._id}
                className="bg-dark-100 border border-black/5 dark:border-white/5 rounded-md"
              >
                <CardBody className="p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.iconClass}`}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-foreground text-sm break-words">
                          {announcement.title}
                        </p>
                        <Chip color={meta.chip} size="sm" variant="flat" className="font-bold">
                          {meta.label}
                        </Chip>
                      </div>
                      <p className="text-[13px] text-on-surface-variant font-medium mt-1 break-words">
                        {announcement.message}
                      </p>
                      <p className="text-[10px] font-bold uppercase text-on-surface-variant mt-2 flex items-center gap-1">
                        <Megaphone size={12} />
                        {formatVigencia(announcement)}
                        {!announcement.isActive && " · Desactivado"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Switch
                      size="sm"
                      color="primary"
                      isSelected={announcement.isActive}
                      isDisabled={togglePendingId === announcement._id}
                      onValueChange={() => onToggle(announcement._id)}
                      aria-label="Activar o desactivar aviso"
                    />
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      className="rounded-xl text-on-surface-variant"
                      onPress={() => setEditTarget(announcement)}
                    >
                      <Pencil size={15} />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      className="rounded-xl text-red-400"
                      isLoading={deletePendingId === announcement._id}
                      onPress={() => onDelete(announcement._id)}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <AnnouncementFormDrawer
        key={`create-${isCreateOpen}`}
        isOpen={isCreateOpen}
        mode="create"
        initial={null}
        isPending={createPending}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={onCreate}
      />

      <AnnouncementFormDrawer
        key={`edit-${editTarget?._id ?? "closed"}`}
        isOpen={editTarget !== null}
        mode="edit"
        initial={editTarget ? toFormData(editTarget) : null}
        isPending={updatePending}
        onClose={() => setEditTarget(null)}
        onSubmit={(data) => onUpdate(editTarget?._id as string, data)}
      />
    </div>
  );
};
