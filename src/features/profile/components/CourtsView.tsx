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
  Select,
  SelectItem,
  Switch,
} from "@heroui/react";
import { ChevronLeft, MapPin, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useState } from "react";

type CourtFormData = {
  name: string;
  courtType: string;
  surface: string;
  isIndoor: boolean;
};

const COURT_TYPE_OPTIONS = [
  "Estándar",
  "Techada",
  "Descubierta",
  "VIP",
  "Premium",
] as const;

const COURT_SURFACE_OPTIONS = [
  "Césped sintético",
  "Cemento",
  "Alfombra",
  "Polvo de ladrillo",
  "Hormigón",
] as const;

type CourtsViewProps = {
  courts: any[];
  createCourtPending: boolean;
  updateCourtPending: boolean;
  deleteCourtPendingId: string | null;
  onBack: () => void;
  onCreateCourt: (payload: CourtFormData) => Promise<boolean>;
  onToggleCourt: (id: string, isActive: boolean) => void;
  onSaveCourtName: (id: string, payload: CourtFormData) => Promise<boolean>;
  onDeleteCourt: (id: string, name: string) => void;
};

export const CourtsView = ({
  courts,
  createCourtPending,
  updateCourtPending,
  deleteCourtPendingId,
  onBack,
  onCreateCourt,
  onToggleCourt,
  onSaveCourtName,
  onDeleteCourt,
}: CourtsViewProps) => {
  const defaultSurface = COURT_SURFACE_OPTIONS[0];
  const defaultCourtType = COURT_TYPE_OPTIONS[0];
  const normalizeSurface = (value: string) =>
    COURT_SURFACE_OPTIONS.includes(value as (typeof COURT_SURFACE_OPTIONS)[number])
      ? value
      : defaultSurface;
  const normalizeCourtType = (value: string) =>
    COURT_TYPE_OPTIONS.includes(value as (typeof COURT_TYPE_OPTIONS)[number])
      ? value
      : defaultCourtType;
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [createCourtName, setCreateCourtName] = useState("");
  const [createCourtType, setCreateCourtType] = useState<string>(defaultCourtType);
  const [createCourtSurface, setCreateCourtSurface] = useState<string>(defaultSurface);
  const [createCourtIndoor, setCreateCourtIndoor] = useState(false);
  const [editingCourtId, setEditingCourtId] = useState<string | null>(null);
  const [editingCourtName, setEditingCourtName] = useState("");
  const [editingCourtType, setEditingCourtType] = useState<string>(defaultCourtType);
  const [editingCourtSurface, setEditingCourtSurface] = useState<string>(defaultSurface);
  const [editingCourtIndoor, setEditingCourtIndoor] = useState(false);

  const openEditDrawer = (court: any) => {
    setEditingCourtId(court._id);
    setEditingCourtName(String(court.name || ""));
    setEditingCourtType(normalizeCourtType(String(court.courtType || defaultCourtType)));
    setEditingCourtSurface(normalizeSurface(String(court.surface || defaultSurface)));
    setEditingCourtIndoor(Boolean(court.isIndoor));
    setIsEditDrawerOpen(true);
  };

  const closeEditDrawer = () => {
    setIsEditDrawerOpen(false);
    setEditingCourtId(null);
    setEditingCourtName("");
    setEditingCourtType(defaultCourtType);
    setEditingCourtSurface(defaultSurface);
    setEditingCourtIndoor(false);
  };

  const closeCreateDrawer = () => {
    setIsCreateDrawerOpen(false);
    setCreateCourtName("");
    setCreateCourtType(defaultCourtType);
    setCreateCourtSurface(defaultSurface);
    setCreateCourtIndoor(false);
  };

  const handleCreateFromDrawer = async () => {
    const wasCreated = await onCreateCourt({
      name: createCourtName,
      courtType: createCourtType,
      surface: createCourtSurface,
      isIndoor: createCourtIndoor,
    });
    if (!wasCreated) return;
    closeCreateDrawer();
  };

  const handleSaveFromDrawer = async () => {
    if (!editingCourtId) return;
    const wasUpdated = await onSaveCourtName(editingCourtId, {
      name: editingCourtName,
      courtType: editingCourtType,
      surface: editingCourtSurface,
      isIndoor: editingCourtIndoor,
    });
    if (!wasUpdated) return;
    closeEditDrawer();
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          isIconOnly
          variant="flat"
          onClick={onBack}
          className="bg-black/5 dark:bg-white/5 text-foreground rounded-2xl"
        >
          <ChevronLeft size={20} />
        </Button>
        <h3 className="text-xl font-black text-foreground uppercase italic">
          Mis Canchas
        </h3>
        <Button
          className="ml-auto bg-primary text-black font-black rounded-2xl uppercase"
          onPress={() => setIsCreateDrawerOpen(true)}
          startContent={<Plus size={16} />}
        >
          Nueva Cancha
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {courts.map((court: any) => (
          <Card
            key={court._id}
            className="bg-dark-100 border border-black/5 dark:border-white/5 rounded-[2rem]"
          >
            <CardBody className="p-6 space-y-4">
              <div className="flex flex-row items-start justify-between gap-3">
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`w-12 h-12 ${court.isActive ? "bg-primary/10 text-primary" : "bg-black/5 dark:bg-white/5 text-gray-500"} rounded-2xl flex items-center justify-center transition-colors`}
                  >
                    <MapPin size={24} />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`font-bold ${court.isActive ? "text-foreground" : "text-gray-500"} text-lg transition-colors truncate`}
                    >
                      {court.name}
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      Estado: {court.isActive ? "Activa" : "Inactiva"}
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      {court.courtType || defaultCourtType} · {court.surface || defaultSurface}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    isIconOnly
                    variant="flat"
                    className="bg-black/5 dark:bg-white/5 text-foreground rounded-xl"
                    onPress={() => openEditDrawer(court)}
                    isDisabled={updateCourtPending || deleteCourtPendingId === court._id}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    isIconOnly
                    variant="flat"
                    className="bg-red-500/20 text-red-300 rounded-xl"
                    onPress={() => onDeleteCourt(court._id, String(court.name || ""))}
                    isLoading={deleteCourtPendingId === court._id}
                    isDisabled={updateCourtPending}
                  >
                    <Trash2 size={16} />
                  </Button>
                  <Switch
                    isSelected={court.isActive}
                    onValueChange={(value) => onToggleCourt(court._id, value)}
                    color="primary"
                    size="sm"
                    isDisabled={updateCourtPending || deleteCourtPendingId === court._id}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Drawer
        isOpen={isCreateDrawerOpen}
        onOpenChange={(isOpen) => {
          if (isOpen) {
            setIsCreateDrawerOpen(true);
            return;
          }
          closeCreateDrawer();
        }}
        placement="right"
        hideCloseButton
        backdrop="blur"
        classNames={{
          base: "bg-dark-200 border-l border-black/10 dark:border-white/10",
        }}
      >
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="flex items-center justify-between gap-4 p-6 border-b border-black/10 dark:border-white/10">
                <h4 className="text-xl font-black text-foreground uppercase italic">
                  Nueva Cancha
                </h4>
                <Button
                  isIconOnly
                  variant="flat"
                  className="bg-black/5 dark:bg-white/5 text-foreground rounded-xl"
                  onPress={() => {
                    onClose();
                    closeCreateDrawer();
                  }}
                >
                  <X size={16} />
                </Button>
              </DrawerHeader>
              <DrawerBody className="p-6">
                <div className="space-y-4">
                  <Input
                    value={createCourtName}
                    onValueChange={setCreateCourtName}
                    placeholder="Ej: Cancha 3"
                    label="Nombre"
                    classNames={{
                      inputWrapper:
                        "bg-black/5 dark:bg-white/5 border-none h-14 rounded-2xl px-4",
                      input: "text-foreground font-bold",
                    }}
                  />
                  <Select
                    label="Tipo de cancha"
                    selectedKeys={[createCourtType]}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string | undefined;
                      if (!selected) return;
                      setCreateCourtType(selected);
                    }}
                    classNames={{
                      trigger:
                        "bg-black/5 dark:bg-white/5 border-none h-14 rounded-2xl px-4",
                      value: "text-foreground font-bold",
                      popoverContent:
                        "bg-dark-200 border border-black/10 dark:border-white/10 text-foreground",
                      listbox: "text-foreground",
                    }}
                  >
                    {COURT_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type} textValue={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="Superficie"
                    selectedKeys={[createCourtSurface]}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string | undefined;
                      if (!selected) return;
                      setCreateCourtSurface(selected);
                    }}
                    classNames={{
                      trigger:
                        "bg-black/5 dark:bg-white/5 border-none h-14 rounded-2xl px-4",
                      value: "text-foreground font-bold",
                      popoverContent:
                        "bg-dark-200 border border-black/10 dark:border-white/10 text-foreground",
                      listbox: "text-foreground",
                    }}
                  >
                    {COURT_SURFACE_OPTIONS.map((surface) => (
                      <SelectItem key={surface} textValue={surface}>
                        {surface}
                      </SelectItem>
                    ))}
                  </Select>
                  <div className="flex items-center justify-between rounded-2xl bg-black/5 dark:bg-white/5 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-foreground">¿Cancha techada?</p>
                      <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                        {createCourtIndoor ? "Sí" : "No"}
                      </p>
                    </div>
                    <Switch
                      isSelected={createCourtIndoor}
                      onValueChange={setCreateCourtIndoor}
                      color="primary"
                    />
                  </div>
                </div>
              </DrawerBody>
              <DrawerFooter className="p-6 pt-0">
                <Button
                  className="w-full h-12 bg-primary text-black rounded-2xl font-black uppercase"
                  onPress={handleCreateFromDrawer}
                  isLoading={createCourtPending}
                >
                  Crear Cancha
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>

      <Drawer
        isOpen={isEditDrawerOpen}
        onOpenChange={(isOpen) => {
          if (isOpen) {
            setIsEditDrawerOpen(true);
            return;
          }
          closeEditDrawer();
        }}
        placement="right"
        hideCloseButton
        backdrop="blur"
        classNames={{
          base: "bg-dark-200 border-l border-black/10 dark:border-white/10",
        }}
      >
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="flex items-center justify-between gap-4 p-6 border-b border-black/10 dark:border-white/10">
                <h4 className="text-xl font-black text-foreground uppercase italic">
                  Editar Cancha
                </h4>
                <Button
                  isIconOnly
                  variant="flat"
                  className="bg-black/5 dark:bg-white/5 text-foreground rounded-xl"
                  onPress={() => {
                    onClose();
                    closeEditDrawer();
                  }}
                >
                  <X size={16} />
                </Button>
              </DrawerHeader>
              <DrawerBody className="p-6">
                <div className="space-y-4">
                  <Input
                    value={editingCourtName}
                    onValueChange={setEditingCourtName}
                    placeholder="Nombre de la cancha"
                    label="Nombre"
                    classNames={{
                      inputWrapper:
                        "bg-black/5 dark:bg-white/5 border-none h-14 rounded-2xl px-4",
                      input: "text-foreground font-bold",
                    }}
                  />
                  <Select
                    label="Tipo de cancha"
                    selectedKeys={[editingCourtType]}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string | undefined;
                      if (!selected) return;
                      setEditingCourtType(selected);
                    }}
                    classNames={{
                      trigger:
                        "bg-black/5 dark:bg-white/5 border-none h-14 rounded-2xl px-4",
                      value: "text-foreground font-bold",
                      popoverContent:
                        "bg-dark-200 border border-black/10 dark:border-white/10 text-foreground",
                      listbox: "text-foreground",
                    }}
                  >
                    {COURT_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type} textValue={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="Superficie"
                    selectedKeys={[editingCourtSurface]}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string | undefined;
                      if (!selected) return;
                      setEditingCourtSurface(selected);
                    }}
                    classNames={{
                      trigger:
                        "bg-black/5 dark:bg-white/5 border-none h-14 rounded-2xl px-4",
                      value: "text-foreground font-bold",
                      popoverContent:
                        "bg-dark-200 border border-black/10 dark:border-white/10 text-foreground",
                      listbox: "text-foreground",
                    }}
                  >
                    {COURT_SURFACE_OPTIONS.map((surface) => (
                      <SelectItem key={surface} textValue={surface}>
                        {surface}
                      </SelectItem>
                    ))}
                  </Select>
                  <div className="flex items-center justify-between rounded-2xl bg-black/5 dark:bg-white/5 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-foreground">¿Cancha techada?</p>
                      <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                        {editingCourtIndoor ? "Sí" : "No"}
                      </p>
                    </div>
                    <Switch
                      isSelected={editingCourtIndoor}
                      onValueChange={setEditingCourtIndoor}
                      color="primary"
                    />
                  </div>
                </div>
              </DrawerBody>
              <DrawerFooter className="p-6 pt-0">
                <Button
                  className="w-full h-12 bg-primary text-black rounded-2xl font-black uppercase"
                  onPress={handleSaveFromDrawer}
                  isLoading={updateCourtPending}
                  startContent={<Save size={16} />}
                >
                  Guardar Cambios
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};
