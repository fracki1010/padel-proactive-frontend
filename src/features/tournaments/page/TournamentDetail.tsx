import {
  addToast, Button, Chip, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader,
  Select, SelectItem, Spinner, Tab, Tabs,
} from "@heroui/react";
import { ArrowLeft, CalendarRange, CheckCircle2, MapPin, Trophy, XCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { fieldSelectClassNames } from "../../../components/ui/fieldStyles";
import { useConfirm } from "../../../hooks/useConfirm";
import { useCourts } from "../../../hooks/useData";
import type { TournamentConflict, TournamentStatus } from "../../../services/tournamentService";
import { CategoryList } from "../components/CategoryList";
import { TeamList } from "../components/TeamList";
import {
  useActivateTournament, useCancelTournament, useCategories, useCompleteTournament,
  useTournament,
} from "../hooks/useTournaments";

type TournamentDetailProps = { tournamentId: string };

const STATUS_META: Record<TournamentStatus, { label: string; color: "default" | "primary" | "success" | "danger" }> = {
  draft: { label: "Borrador", color: "default" }, in_progress: { label: "En curso", color: "primary" },
  finished: { label: "Finalizado", color: "success" }, cancelled: { label: "Cancelado", color: "danger" },
};
const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const TABS = ["resumen:Resumen", "categorias:Categorías", "parejas:Parejas", "llaves:Llaves", "programacion:Programación", "resultados:Resultados"]
  .map((entry) => { const [key, label] = entry.split(":"); return { key, label }; });
const PLACEHOLDER_COPY: Record<string, string> = {
  llaves: "La generación y visualización de llaves llega en la próxima entrega.",
  programacion: "La programación de partidos llega en la próxima entrega.", resultados: "La carga de resultados llega en la próxima entrega.",
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
  return typeof message === "string" && message ? message : fallback;
};
const getConflicts = (error: unknown): TournamentConflict[] | null => {
  const conflicts = (error as { response?: { data?: { conflicts?: TournamentConflict[] } } })?.response?.data?.conflicts;
  return Array.isArray(conflicts) && conflicts.length > 0 ? conflicts : null;
};

export const TournamentDetail = ({ tournamentId }: TournamentDetailProps) => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { data: tournament, isLoading, isError } = useTournament(tournamentId);
  const { data: categoriesData } = useCategories(tournamentId);
  const { data: courtsData } = useCourts();
  const activateTournament = useActivateTournament();
  const completeTournament = useCompleteTournament();
  const cancelTournament = useCancelTournament();
  const [selectedTab, setSelectedTab] = useState("resumen");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [conflicts, setConflicts] = useState<TournamentConflict[] | null>(null);

  const categories = categoriesData ?? [];
  const courts = courtsData?.data ?? [];
  const activeCategoryId = categories.some((category) => category._id === selectedCategoryId) ? selectedCategoryId : categories[0]?._id || "";
  const activeCategory = categories.find((category) => category._id === activeCategoryId);
  const courtName = (courtId: string) =>
    courts.find((court) => court._id === courtId)?.name ?? "Cancha";

  const handleActivate = async () => {
    const confirmed = await confirm("Al activar el torneo sus canchas quedarán bloqueadas. Las reservas existentes no se cancelan.", { title: "Activar torneo", confirmText: "Activar" });
    if (!confirmed) return;
    try {
      await activateTournament.mutateAsync({ id: tournamentId });
      addToast({ title: "Torneo activado", color: "success" });
    } catch (error) {
      const conflictList = getConflicts(error);
      if (conflictList) return setConflicts(conflictList);
      addToast({ title: getErrorMessage(error, "No se pudo activar el torneo"), color: "danger" });
    }
  };

  const handleConfirmConflicts = async () => {
    try {
      await activateTournament.mutateAsync({ id: tournamentId, confirmConflicts: true });
      setConflicts(null);
      addToast({ title: "Torneo activado", color: "success" });
    } catch (error) {
      addToast({ title: getErrorMessage(error, "No se pudo activar el torneo"), color: "danger" });
    }
  };

  const handleComplete = async () => {
    const confirmed = await confirm("¿Finalizar el torneo? Las canchas se liberan y el torneo queda cerrado.", { title: "Finalizar torneo", confirmText: "Finalizar" });
    if (!confirmed) return;
    try {
      await completeTournament.mutateAsync(tournamentId);
      addToast({ title: "Torneo finalizado", color: "success" });
    } catch (error) {
      addToast({ title: getErrorMessage(error, "No se pudo finalizar el torneo"), color: "danger" });
    }
  };

  const handleCancel = async () => {
    const confirmed = await confirm("¿Cancelar el torneo? Se liberan las canchas y no se puede reactivar.", { title: "Cancelar torneo", variant: "danger", confirmText: "Cancelar torneo", cancelText: "Volver" });
    if (!confirmed) return;
    try {
      await cancelTournament.mutateAsync(tournamentId);
      addToast({ title: "Torneo cancelado", color: "success" });
    } catch (error) {
      addToast({ title: getErrorMessage(error, "No se pudo cancelar el torneo"), color: "danger" });
    }
  };

  const handleManageTeams = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedTab("parejas");
  };

  if (isLoading) return <div className="flex justify-center py-20"><Spinner color="primary" /></div>;

  if (isError || !tournament) {
    return (
      <div className="space-y-4">
        <Button variant="flat" startContent={<ArrowLeft size={16} />} onPress={() => navigate("/torneos")} className="font-bold">Volver a torneos</Button>
        <div className="flex flex-col items-center justify-center min-h-[240px] text-center p-8 bg-dark-200 rounded-md border border-black/5 dark:border-white/5">
          <Trophy size={44} className="text-on-surface-variant mb-3" />
          <h3 className="text-lg font-bold text-foreground">No encontramos el torneo</h3>
          <p className="text-sm text-on-surface-variant">Puede que se haya eliminado o no tengas acceso.</p>
        </div>
      </div>
    );
  }

  const status = STATUS_META[tournament.status];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Button variant="flat" startContent={<ArrowLeft size={16} />} onPress={() => navigate("/torneos")} className="font-bold">
        Volver a torneos
      </Button>

      <header className="space-y-4 rounded-lg border border-black/5 dark:border-white/5 bg-dark-200 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-foreground tracking-tight">{tournament.name}</h1>
            {tournament.description?.trim() && <p className="text-sm text-on-surface-variant">{tournament.description}</p>}
          </div>
          <Chip size="sm" variant="flat" color={status.color} className="font-bold">{status.label}</Chip>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-on-surface-variant">
          <span className="inline-flex items-center gap-1.5"><CalendarRange size={15} />{tournament.startDate} → {tournament.endDate}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin size={15} />{tournament.courts.map(courtName).join(", ") || "Sin canchas asignadas"}</span>
        </div>
        {(tournament.status === "draft" || tournament.status === "in_progress") && (
          <div className="flex flex-wrap gap-2 pt-1">
            {tournament.status === "draft" && (
              <Button color="primary" startContent={<CheckCircle2 size={16} />} onPress={handleActivate} isLoading={activateTournament.isPending} className="font-black">
                Activar torneo
              </Button>
            )}
            {tournament.status === "in_progress" && (
              <Button color="success" startContent={<CheckCircle2 size={16} />} onPress={handleComplete} isLoading={completeTournament.isPending} className="font-black">
                Finalizar torneo
              </Button>
            )}
            <Button variant="flat" color="danger" startContent={<XCircle size={16} />} onPress={handleCancel} isLoading={cancelTournament.isPending} className="font-bold">
              Cancelar torneo
            </Button>
          </div>
        )}
      </header>

      <Tabs
        aria-label="Secciones del torneo"
        variant="underlined"
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(String(key))}
        classNames={{
          base: "w-full overflow-x-auto",
          tabList: "gap-5 w-full relative rounded-none p-0 border-b border-black/5 dark:border-white/5",
          cursor: "w-full bg-primary",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:text-primary font-bold text-on-surface-variant uppercase text-xs tracking-wider",
        }}
      >
        {TABS.map((tab) => (
          <Tab key={tab.key} title={tab.label}>
            {tab.key === "resumen" ? (
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {[["Categorías", String(categories.length)], ["Canchas", String(tournament.courts.length)], ["Fechas", `${tournament.startDate} → ${tournament.endDate}`]].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-black/5 dark:border-white/5 bg-dark-200 p-4">
                    <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</dt><dd className="text-lg font-black text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : tab.key === "categorias" ? (
              <div className="pt-2"><CategoryList tournamentId={tournamentId} onManageTeams={handleManageTeams} /></div>
            ) : tab.key === "parejas" ? (
              <div className="pt-2 space-y-4">
                {categories.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">Creá una categoría para registrar parejas.</p>
                ) : (
                  <>
                    <Select
                      aria-label="Categoría"
                      selectedKeys={activeCategoryId ? [activeCategoryId] : []}
                      onSelectionChange={(keys) => { const [key] = Array.from(keys); if (key) setSelectedCategoryId(String(key)); }}
                      variant="bordered" size="lg" classNames={fieldSelectClassNames.lg}
                    >
                      {categories.map((category) => <SelectItem key={category._id}>{category.name}</SelectItem>)}
                    </Select>
                    {activeCategoryId && (
                      <TeamList
                        key={activeCategoryId} tournamentId={tournamentId} categoryId={activeCategoryId}
                        categoryName={activeCategory?.name ?? "la categoría"} maxTeams={activeCategory?.maxTeams}
                      />
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="pt-2">
                <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-8 bg-dark-200 rounded-md border border-dashed border-black/10 dark:border-white/10">
                  <Trophy size={36} className="text-on-surface-variant mb-3" />
                  <p className="text-sm text-on-surface-variant">{PLACEHOLDER_COPY[tab.key]}</p>
                </div>
              </div>
            )}
          </Tab>
        ))}
      </Tabs>

      <Modal isOpen={Boolean(conflicts)} onClose={() => setConflicts(null)} size="xl" backdrop="blur" className="bg-surface-container-high text-foreground dark">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-xl font-black">Hay reservas en esas fechas</h2>
            <p className="text-sm font-normal text-on-surface-variant">
              Activar el torneo bloqueará las canchas, pero no cancelará estas reservas. Revisalas antes de continuar.
            </p>
          </ModalHeader>
          <ModalBody>
            <ul className="space-y-2">
              {(conflicts ?? []).map((conflict, index) => (
                <li key={`${conflict.type}-${conflict.courtId}-${conflict.date ?? conflict.weekday}-${index}`}
                  className="rounded-md border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 p-3 text-sm">
                  <p className="font-bold text-foreground">
                    {conflict.type === "booking" ? `Reserva de ${conflict.clientName || "un cliente"}` : "Turno fijo activo"}
                  </p>
                  <p className="text-on-surface-variant">
                    {courtName(conflict.courtId)}
                    {conflict.date ? ` · ${conflict.date}` : ""}
                    {conflict.weekday !== undefined ? ` · ${WEEKDAYS[conflict.weekday] ?? "Día"}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setConflicts(null)}>Cancelar</Button>
            <Button color="warning" onPress={handleConfirmConflicts} isLoading={activateTournament.isPending} className="font-black">
              Activar de todos modos
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};
