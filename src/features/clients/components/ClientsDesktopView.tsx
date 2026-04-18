import {
  Avatar,
  Button,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Spinner,
} from "@heroui/react";
import {
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Eye,
  History,
  MessageSquare,
  MoreVertical,
  Plus,
  Search,
  ShieldOff,
  Smartphone,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getAvatarColor, getInitials } from "../../../utils/avatarUtils";
import { formatPhoneForDisplay } from "../../../utils/formatters";
import type { User } from "../../../types";

type DesktopFilter = "all" | "fixed" | "debtors" | "inactive";

type ClientsDesktopViewProps = {
  users: User[];
  isLoading: boolean;
  filterValue: string;
  onFilterChange: (val: string) => void;
  penaltyLimit: number;
  pendingDeleteUserId: string | null;
  pendingClearPenaltyUserId: string | null;
  isBulkDeletingUsers: boolean;
  isBulkClearingPenalties: boolean;
  onCreate: () => void;
  onEdit: (user: User) => void;
  onHistory: (user: User) => void;
  onDetails: (user: User) => void;
  onDelete: (id: string) => void;
  onClearPenalties: (id: string) => void;
};

export const ClientsDesktopView = ({
  users,
  isLoading,
  filterValue,
  onFilterChange,
  penaltyLimit,
  pendingDeleteUserId,
  pendingClearPenaltyUserId,
  isBulkDeletingUsers,
  isBulkClearingPenalties,
  onCreate,
  onEdit,
  onHistory,
  onDetails,
  onDelete,
  onClearPenalties,
}: ClientsDesktopViewProps) => {
  const PAGE_SIZE = 10;
  const [desktopFilter, setDesktopFilter] = useState<DesktopFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredUsers = useMemo(() => {
    const text = filterValue.toLowerCase();
    return users
      .filter((user) => {
        const matchesSearch =
          user.name.toLowerCase().includes(text) || user.phoneNumber.includes(filterValue);
        if (!matchesSearch) return false;

        if (desktopFilter === "fixed") {
          return Boolean(user.fixedTurns && user.fixedTurns.length > 0);
        }
        if (desktopFilter === "debtors") {
          return (user.penalties || 0) > 0;
        }
        if (desktopFilter === "inactive") {
          return Boolean(user.isSuspended);
        }
        return true;
      })
      .sort((a, b) => (b.penalties || 0) - (a.penalties || 0));
  }, [users, filterValue, desktopFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const debtors = users.filter((user) => (user.penalties || 0) > 0).length;
    const suspended = users.filter((user) => user.isSuspended).length;
    return { total, debtors, suspended };
  }, [users]);

  useEffect(() => {
    setCurrentPage(1);
  }, [desktopFilter, filterValue, users.length]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, currentPage]);

  return (
    <div className="hidden lg:block space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-4 flex-1 min-w-0">
          <div className="flex items-center gap-5">
            <h2 className="text-xl font-black uppercase text-primary tracking-tight">
              Socios
            </h2>
            <Input
              isClearable
              placeholder="Buscar por nombre o teléfono..."
              startContent={<Search size={16} className="text-gray-500" />}
              value={filterValue}
              onValueChange={onFilterChange}
              className="max-w-xl"
              classNames={{
                inputWrapper:
                  "bg-dark-200/80 border border-black/10 dark:border-white/10 rounded-2xl h-12",
                input: "text-foreground",
              }}
            />
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-primary/80 mb-2">
              Gestión de Comunidad
            </p>
            <h1 className="text-3xl xl:text-4xl font-black text-foreground tracking-tight">
              Socios Registrados
            </h1>
          </div>

          <div className="inline-flex items-center gap-2 p-2 rounded-2xl bg-dark-200/70 border border-black/10 dark:border-white/10">
            {[
              { id: "all", label: "Todos" },
              { id: "fixed", label: "Fijos" },
              { id: "debtors", label: "Deudores" },
              { id: "inactive", label: "Inactivos" },
            ].map((item) => {
              const isActive = desktopFilter === item.id;
              return (
                <Button
                  key={item.id}
                  size="sm"
                  variant="light"
                  className={`rounded-xl px-4 uppercase text-[11px] font-black tracking-wider ${isActive ? "bg-primary text-black" : "text-gray-400 hover:text-foreground"}`}
                  onPress={() => setDesktopFilter(item.id as DesktopFilter)}
                >
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 space-y-4 pt-2">
          <Button
            color="primary"
            className="h-12 px-6 rounded-full text-black font-black text-base shadow-xl shadow-primary/25"
            startContent={<Plus size={20} />}
            onPress={onCreate}
          >
            Nuevo Socio
          </Button>
          <div className="grid grid-cols-3 gap-4 text-right">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                Total
              </p>
              <p className="text-3xl font-black text-foreground">{stats.total}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
                Deudores
              </p>
              <p className="text-3xl font-black text-amber-300">{stats.debtors}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400">
                Inactivos
              </p>
              <p className="text-3xl font-black text-red-300">{stats.suspended}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner color="primary" size="lg" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="rounded-3xl bg-dark-200/60 border border-black/10 dark:border-white/10 py-16 text-center">
            <p className="text-gray-500 font-bold">
              No se encontraron socios para este filtro.
            </p>
          </div>
        ) : (
          <>
            {paginatedUsers.map((client) => {
            const penalties = Math.max(0, client.penalties || 0);
            const attendanceCount = Number(client.attendanceConfirmedCount || 0);
            const trustedThreshold = Number(client.trustedClientConfirmationCount || 3);
            const isTrustedClient =
              typeof client.isTrustedClient === "boolean"
                ? client.isTrustedClient
                : attendanceCount >= trustedThreshold;
            const penaltyDots = Array.from({ length: penaltyLimit }).map((_, index) => (
              <span
                key={`${client._id}-penalty-${index}`}
                className={`h-2 w-6 rounded-full ${
                  index < penalties
                    ? penalties >= penaltyLimit
                      ? "bg-red-400"
                      : "bg-primary"
                    : "bg-black/15 dark:bg-white/10"
                }`}
              />
            ));

            return (
              <div
                key={client._id}
                className="rounded-3xl bg-dark-200/70 border border-black/10 dark:border-white/10 px-5 py-4 flex items-center gap-5"
              >
                <Avatar
                  name={getInitials(client.name)}
                  className="w-14 h-14 rounded-2xl text-foreground font-black text-lg shrink-0"
                  style={{ backgroundColor: getAvatarColor(client.name) }}
                />

                <div className="min-w-0 flex-1">
                  <p className="text-xl font-black text-foreground truncate leading-tight">
                    {client.name}
                  </p>
                  <p className="text-gray-400 font-semibold flex items-center gap-2 mt-1">
                    <Smartphone size={14} />
                    {formatPhoneForDisplay(client.phoneNumber)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {client.fixedTurns && client.fixedTurns.length > 0 && (
                    <Chip
                      size="sm"
                      className="bg-primary/20 text-primary border border-primary/30 font-black uppercase"
                    >
                      Fijo
                    </Chip>
                  )}
                  {(client.penalties || 0) > 0 && (
                    <Chip
                      size="sm"
                      className="bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black uppercase"
                    >
                      Deudor
                    </Chip>
                  )}
                  {client.isSuspended && (
                    <Chip
                      size="sm"
                      className="bg-red-500/20 text-red-300 border border-red-500/30 font-black uppercase"
                    >
                      Inactivo
                    </Chip>
                  )}
                  <Chip
                    size="sm"
                    color={isTrustedClient ? "success" : "warning"}
                    variant="flat"
                    className="font-black uppercase"
                    startContent={
                      isTrustedClient ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />
                    }
                  >
                    {isTrustedClient ? "Confiable" : "En seguimiento"}
                  </Chip>
                </div>

                <div className="min-w-[190px]">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">
                    Penalizaciones
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">{penaltyDots}</div>
                    <span className="font-black text-foreground text-lg">
                      {penalties}/{penaltyLimit}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 font-bold">
                    Asistencia: {attendanceCount}/{trustedThreshold}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    isIconOnly
                    variant="flat"
                    className="w-12 h-12 rounded-xl bg-black/10 dark:bg-white/10 text-gray-300"
                    onPress={() => onHistory(client)}
                  >
                    <History size={18} />
                  </Button>
                  <Dropdown
                    placement="bottom-end"
                    className="bg-dark-300 border border-black/10 dark:border-white/10"
                  >
                    <DropdownTrigger>
                      <Button
                        isIconOnly
                        variant="flat"
                        className="w-12 h-12 rounded-xl bg-black/10 dark:bg-white/10 text-gray-300"
                      >
                        <MoreVertical size={18} />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Acciones de socio" color="primary">
                      <DropdownItem
                        key="details"
                        startContent={<Eye size={16} />}
                        onClick={() => onDetails(client)}
                      >
                        Ver detalles
                      </DropdownItem>
                      <DropdownItem
                        key="edit"
                        startContent={<Edit2 size={16} />}
                        onClick={() => onEdit(client)}
                      >
                        Editar Perfil
                      </DropdownItem>
                      <DropdownItem
                        key="whatsapp"
                        startContent={<MessageSquare size={16} />}
                        onClick={() =>
                          window.open(
                            `https://wa.me/${client.phoneNumber.replace(/\D/g, "")}`,
                            "_blank",
                          )
                        }
                      >
                        Enviar WhatsApp
                      </DropdownItem>
                      <DropdownItem
                        key="delete"
                        className="text-danger"
                        color="danger"
                        startContent={<Trash2 size={16} />}
                        isDisabled={
                          isBulkDeletingUsers ||
                          isBulkClearingPenalties ||
                          pendingDeleteUserId === client._id ||
                          pendingClearPenaltyUserId === client._id
                        }
                        onClick={() => onDelete(client._id)}
                      >
                        {pendingDeleteUserId === client._id ? "Eliminando..." : "Eliminar Socio"}
                      </DropdownItem>
                      {client.isSuspended || (client.penalties || 0) > 0 ? (
                        <DropdownItem
                          key="clear-penalties"
                          color="success"
                          className="text-success"
                          startContent={<ShieldOff size={16} />}
                          isDisabled={
                            isBulkDeletingUsers ||
                            isBulkClearingPenalties ||
                            pendingDeleteUserId === client._id ||
                            pendingClearPenaltyUserId === client._id
                          }
                          onClick={() => onClearPenalties(client._id)}
                        >
                          {pendingClearPenaltyUserId === client._id
                            ? "Despenalizando..."
                            : "Despenalizar Socio"}
                        </DropdownItem>
                      ) : (
                        <DropdownItem key="no-clear-penalties" className="hidden" />
                      )}
                      {penalties >= penaltyLimit ? (
                        <DropdownItem
                          key="penalty-warning"
                          isReadOnly
                          className="text-warning"
                          startContent={<AlertTriangle size={16} />}
                        >
                          Al límite de penalización
                        </DropdownItem>
                      ) : (
                        <DropdownItem key="no-penalty-warning" className="hidden" />
                      )}
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </div>
            );
          })}

            {filteredUsers.length > 0 && (
              <div className="pt-3 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">
                  {filteredUsers.length} socios • página {currentPage}/{totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="flat"
                    className="bg-black/10 dark:bg-white/10 font-black uppercase text-[11px]"
                    isDisabled={currentPage === 1}
                    onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  >
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    className="bg-primary/20 text-primary border border-primary/30 font-black uppercase text-[11px]"
                    isDisabled={currentPage >= totalPages}
                    onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
