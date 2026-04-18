import {
  Spinner,
  Avatar,
  Chip,
  Button,
  Input,
  useDisclosure,
  Card,
  CardBody,
  addToast,
} from "@heroui/react";
import {
  Plus,
  Smartphone,
  User as UserIcon,
  AlertTriangle,
  CheckCircle2,
  ShieldOff,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { GlobalActionOverlay } from "../../../components/GlobalActionOverlay";
import { useInfiniteScroll } from "../../../hooks/useInfiniteScroll";
import {
  useUsers,
  useUserHistory,
  useDeleteUser,
  useClearPenalties,
  usePenaltySettings,
} from "../../../hooks/useData";
import { getInitials, getAvatarColor } from "../../../utils/avatarUtils";
import { formatPhoneForDisplay } from "../../../utils/formatters";
import type { User, Booking } from "../../../types";
import { HistoryModal } from "../components/HistoryModal";
import { UserModal } from "../components/UserModal";
import { ClientsDesktopView } from "../components/ClientsDesktopView";

interface ClientsProps {
  filterValue: string;
  onFilterChange: (val: string) => void;
}

export const Clients = ({ filterValue, onFilterChange }: ClientsProps) => {
  const navigate = useNavigate();
  const { data: usersData, isLoading: isLoadingUsers } = useUsers();
  const { data: penaltySettingsData } = usePenaltySettings();
  const users = usersData?.data || [];
  const penaltyLimit = Number(penaltySettingsData?.data?.penaltyLimit) || 2;

  const {
    isOpen: isModalOpen,
    onOpen: onModalOpen,
    onClose: onModalClose,
  } = useDisclosure();

  const {
    isOpen: isHistoryOpen,
    onOpen: onHistoryOpen,
    onClose: onHistoryClose,
  } = useDisclosure();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [pendingDeleteUserId, setPendingDeleteUserId] = useState<string | null>(null);
  const [pendingClearPenaltyUserId, setPendingClearPenaltyUserId] = useState<string | null>(null);
  const [isBulkDeletingUsers, setIsBulkDeletingUsers] = useState(false);
  const [isBulkClearingPenalties, setIsBulkClearingPenalties] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);

  const deleteUser = useDeleteUser();
  const clearPenalties = useClearPenalties();

  const { data: historyData, isLoading: isLoadingHistory } = useUserHistory(
    selectedUser?._id || null,
  );
  const history: Booking[] = historyData?.data || [];
  const isSelectionMode = selectedClientIds.length > 0;

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user: User) =>
        user.name.toLowerCase().includes(filterValue.toLowerCase()) ||
        user.phoneNumber.includes(filterValue),
    );
  }, [users, filterValue]);

  const { visibleCount, sentinelRef, hasMore } = useInfiniteScroll(
    12,
    9,
    filteredUsers.length,
  );

  const visibleUsers = filteredUsers.slice(0, visibleCount);

  const handleCreate = () => {
    setFormMode("create");
    setSelectedUser(null);
    onModalOpen();
  };

  const handleEdit = (user: User) => {
    setFormMode("edit");
    setSelectedUser(user);
    onModalOpen();
  };

  const handleHistory = (user: User) => {
    setSelectedUser(user);
    onHistoryOpen();
  };

  const handleDetails = (user: User) => {
    navigate(`/socios/${user._id}`);
  };

  const handleDelete = async (id: string) => {
    if (pendingDeleteUserId || pendingClearPenaltyUserId) return;
    if (confirm("¿Estás seguro de eliminar este socio?")) {
      setPendingDeleteUserId(id);
      try {
        await deleteUser.mutateAsync(id);
        addToast({ title: "Socio eliminado", color: "success" });
      } catch (_error) {
        addToast({ title: "Error al eliminar socio", color: "danger" });
      } finally {
        setPendingDeleteUserId(null);
      }
    }
  };

  const handleClearPenalties = async (id: string) => {
    if (pendingDeleteUserId || pendingClearPenaltyUserId) return;
    if (confirm("¿Deseas limpiar las penalizaciones y rehabilitar a este socio?")) {
      setPendingClearPenaltyUserId(id);
      try {
        await clearPenalties.mutateAsync(id);
        addToast({ title: "Penalizaciones eliminadas", color: "success" });
      } catch (_error) {
        addToast({ title: "Error al limpiar penalizaciones", color: "danger" });
      } finally {
        setPendingClearPenaltyUserId(null);
      }
    }
  };

  const toggleClientSelection = (clientId: string) => {
    setSelectedClientIds((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId],
    );
  };

  const clearSelection = () => {
    setSelectedClientIds([]);
  };

  const startLongPress = (clientId: string) => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
    }

    longPressTimerRef.current = window.setTimeout(() => {
      suppressClickRef.current = true;
      toggleClientSelection(clientId);
    }, 450);
  };

  const endLongPress = () => {
    if (!longPressTimerRef.current) return;
    window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  };

  const handleClientTap = (client: User) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    if (isSelectionMode) {
      toggleClientSelection(client._id);
      return;
    }

    handleDetails(client);
  };

  const selectedUsers = users.filter((user: User) => selectedClientIds.includes(user._id));

  const handleSelectionOpenDetails = () => {
    if (selectedUsers.length !== 1) return;
    handleDetails(selectedUsers[0]);
  };

  const handleSelectionEdit = () => {
    if (selectedUsers.length !== 1) return;
    handleEdit(selectedUsers[0]);
  };

  const handleSelectionHistory = () => {
    if (selectedUsers.length !== 1) return;
    handleHistory(selectedUsers[0]);
  };

  const handleSelectionWhatsapp = () => {
    if (selectedUsers.length !== 1) return;
    window.open(
      `https://wa.me/${selectedUsers[0].phoneNumber.replace(/\D/g, "")}`,
      "_blank",
    );
  };

  const handleSelectionClearPenalties = async () => {
    if (selectedUsers.length === 0) return;
    if (isBulkDeletingUsers || isBulkClearingPenalties) return;

    if (!confirm("¿Deseas despenalizar los socios seleccionados?")) return;

    setIsBulkClearingPenalties(true);
    try {
      await Promise.all(
        selectedUsers.map((selectedUser: User) =>
          clearPenalties.mutateAsync(selectedUser._id),
        ),
      );
      addToast({ title: "Penalizaciones limpiadas", color: "success" });
      clearSelection();
    } catch (_error) {
      addToast({ title: "Error al limpiar penalizaciones", color: "danger" });
    } finally {
      setIsBulkClearingPenalties(false);
    }
  };

  const handleSelectionDelete = async () => {
    if (selectedUsers.length === 0) return;
    if (isBulkDeletingUsers || isBulkClearingPenalties) return;

    if (!confirm("¿Estás seguro de eliminar los socios seleccionados?")) return;

    setIsBulkDeletingUsers(true);
    try {
      await Promise.all(
        selectedUsers.map((selectedUser: User) =>
          deleteUser.mutateAsync(selectedUser._id),
        ),
      );
      addToast({ title: "Socios eliminados", color: "success" });
      clearSelection();
    } catch (_error) {
      addToast({ title: "Error al eliminar socios", color: "danger" });
    } finally {
      setIsBulkDeletingUsers(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-10 duration-500">
      <ClientsDesktopView
        users={users}
        isLoading={isLoadingUsers}
        filterValue={filterValue}
        onFilterChange={onFilterChange}
        penaltyLimit={penaltyLimit}
        pendingDeleteUserId={pendingDeleteUserId}
        pendingClearPenaltyUserId={pendingClearPenaltyUserId}
        isBulkDeletingUsers={isBulkDeletingUsers}
        isBulkClearingPenalties={isBulkClearingPenalties}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onHistory={handleHistory}
        onDetails={handleDetails}
        onDelete={handleDelete}
        onClearPenalties={handleClearPenalties}
      />

      <div className="lg:hidden space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">
              Gestión de Socios
            </h1>
            <p className="text-gray-500 text-sm sm:text-base">
              Administra tus clientes, historial y turnos fijos
            </p>
          </div>
          <Button
            color="primary"
            className="rounded-2xl font-bold px-6 shadow-lg shadow-primary/20 w-full sm:w-auto"
            startContent={<Plus size={20} />}
            onClick={handleCreate}
          >
            Nuevo Socio
          </Button>
        </div>

        <div className="bg-dark-200 p-2 rounded-3xl border border-black/5 dark:border-white/5 shadow-2xl">
          <Input
            isClearable
            className="w-full"
            placeholder="Buscar por nombre o teléfono..."
            startContent={<UserIcon className="text-gray-400" size={18} />}
            value={filterValue}
            onValueChange={onFilterChange}
            variant="flat"
            classNames={{
              inputWrapper: "bg-transparent border-none",
              input: "text-foreground",
            }}
          />
        </div>

        {isSelectionMode && (
          <div className="rounded-3xl bg-primary/10 border border-primary/30 p-3 space-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-primary">
              {selectedClientIds.length} socio(s) seleccionado(s)
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="flat"
                className="font-black"
                isDisabled={selectedUsers.length !== 1}
                onPress={handleSelectionOpenDetails}
              >
                Ver detalle
              </Button>
              <Button
                size="sm"
                variant="flat"
                className="font-black"
                isDisabled={selectedUsers.length !== 1}
                onPress={handleSelectionEdit}
              >
                Editar
              </Button>
              <Button
                size="sm"
                variant="flat"
                className="font-black"
                isDisabled={selectedUsers.length !== 1}
                onPress={handleSelectionHistory}
              >
                Historial
              </Button>
              <Button
                size="sm"
                variant="flat"
                className="font-black"
                isDisabled={selectedUsers.length !== 1}
                onPress={handleSelectionWhatsapp}
              >
                WhatsApp
              </Button>
              <Button
                size="sm"
                color="success"
                variant="flat"
                className="font-black"
                isLoading={isBulkClearingPenalties}
                isDisabled={isBulkDeletingUsers}
                onPress={handleSelectionClearPenalties}
              >
                Despenalizar
              </Button>
              <Button
                size="sm"
                color="danger"
                variant="flat"
                className="font-black"
                isLoading={isBulkDeletingUsers}
                isDisabled={isBulkClearingPenalties}
                onPress={handleSelectionDelete}
              >
                Eliminar
              </Button>
              <Button
                size="sm"
                variant="light"
                className="font-black"
                onPress={clearSelection}
              >
                Cancelar selección
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoadingUsers ? (
            <div className="col-span-full flex justify-center p-12">
              <Spinner color="primary" size="lg" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="col-span-full bg-dark-200/50 rounded-3xl p-12 text-center border border-dashed border-black/10 dark:border-white/10">
              <UserIcon size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 font-medium">
                No se encontraron socios que coincidan con la búsqueda.
              </p>
            </div>
          ) : (
            <>
              {visibleUsers.map((client: User) => (
                <Card
                  key={client._id}
                  className={`bg-dark-200 border-black/5 dark:border-white/5 hover:border-primary/30 transition-all duration-300 rounded-3xl group ${
                    selectedClientIds.includes(client._id)
                      ? "ring-2 ring-primary/70 border-primary/40"
                      : ""
                  }`}
                  shadow="sm"
                  isPressable
                  onPress={() => handleClientTap(client)}
                  onMouseDown={() => startLongPress(client._id)}
                  onMouseUp={endLongPress}
                  onMouseLeave={endLongPress}
                  onTouchStart={() => startLongPress(client._id)}
                  onTouchEnd={endLongPress}
                  onTouchCancel={endLongPress}
                >
                  <CardBody className="p-5 flex flex-row items-center gap-4">
                    <Avatar
                      name={getInitials(client.name)}
                      className="w-16 h-16 rounded-2xl text-foreground font-black text-xl shrink-0"
                      style={{ backgroundColor: getAvatarColor(client.name) }}
                    />

                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-lg text-foreground truncate">
                          {client.name}
                        </h4>
                        {client.fixedTurns && client.fixedTurns.length > 0 && (
                          <Chip
                            size="sm"
                            color="success"
                            variant="flat"
                            className="h-5 px-1 bg-success/10 text-[10px] font-black uppercase"
                          >
                            Fijo
                          </Chip>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-0.5">
                        <Smartphone size={14} />
                        <span>{formatPhoneForDisplay(client.phoneNumber)}</span>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-2.5">
                        {(() => {
                          const attendanceCount = Number(
                            client.attendanceConfirmedCount || 0,
                          );
                          const trustedThreshold = Number(
                            client.trustedClientConfirmationCount || 3,
                          );
                          const isTrustedClient =
                            typeof client.isTrustedClient === "boolean"
                              ? client.isTrustedClient
                              : attendanceCount >= trustedThreshold;

                          return (
                            <Chip
                              size="sm"
                              color={isTrustedClient ? "success" : "warning"}
                              variant="flat"
                              className="h-5 px-1 text-[10px] font-black uppercase"
                              startContent={
                                isTrustedClient ? (
                                  <CheckCircle2 size={9} className="ml-1" />
                                ) : (
                                  <AlertTriangle size={9} className="ml-1" />
                                )
                              }
                            >
                              {isTrustedClient ? "CONFIABLE" : "SEGUIMIENTO"}{" "}
                              {attendanceCount}/{trustedThreshold}
                            </Chip>
                          );
                        })()}
                        <Chip
                          size="sm"
                          color={
                            client.isSuspended
                              ? "danger"
                              : (client.penalties || 0) > 0
                                ? "warning"
                                : "default"
                          }
                          variant="flat"
                          className="h-5 px-1 text-[10px] font-black uppercase"
                          startContent={<AlertTriangle size={9} className="ml-1" />}
                        >
                          PENAL. {client.penalties || 0}/{penaltyLimit}
                        </Chip>
                        {client.isSuspended && (
                          <Chip
                            size="sm"
                            color="danger"
                            variant="flat"
                            className="h-5 px-1 text-[10px] font-black uppercase"
                            startContent={<ShieldOff size={9} className="ml-1" />}
                          >
                            SUSPENDIDO
                          </Chip>
                        )}
                      </div>
                    </div>

                    {selectedClientIds.includes(client._id) && (
                      <Chip color="primary" variant="flat" className="font-black uppercase">
                        Seleccionado
                      </Chip>
                    )}
                  </CardBody>
                </Card>
              ))}

              <div ref={sentinelRef} className="col-span-full">
                {hasMore && (
                  <div className="flex justify-center py-6">
                    <Spinner color="primary" size="sm" />
                  </div>
                )}
                {!hasMore && filteredUsers.length > 12 && (
                  <p className="text-center text-gray-600 text-xs font-bold uppercase tracking-widest py-4">
                    {filteredUsers.length} socios cargados
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <UserModal
        key={`${formMode}-${selectedUser?._id || "new"}-${isModalOpen ? "open" : "closed"}`}
        isOpen={isModalOpen}
        onClose={onModalClose}
        user={selectedUser}
        mode={formMode}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={onHistoryClose}
        user={selectedUser}
        history={history}
        isLoading={isLoadingHistory}
      />

      <GlobalActionOverlay
        isOpen={isBulkDeletingUsers || isBulkClearingPenalties}
        title={isBulkDeletingUsers ? "Eliminando socios..." : "Limpiando penalizaciones..."}
        zIndexClassName="z-[130]"
      />
    </div>
  );
};
