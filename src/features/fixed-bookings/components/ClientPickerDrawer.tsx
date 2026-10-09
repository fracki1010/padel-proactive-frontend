import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  Input,
  Spinner,
} from "@heroui/react";
import { Search, User as UserIcon, X } from "lucide-react";
import { useMemo, useState } from "react";

import { fieldInputClassNames } from "../../../components/ui/fieldStyles";
import { useUsers } from "../../../hooks/useData";
import { useInfiniteScroll } from "../../../hooks/useInfiniteScroll";
import { useIsDesktop } from "../../../hooks/useIsDesktop";
import type { User } from "../../../types";
import { formatPhoneForDisplay } from "../../../utils/formatters";

type ClientPickerDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectClient: (user: User) => void;
};

export const ClientPickerDrawer = ({
  isOpen,
  onClose,
  onSelectClient,
}: ClientPickerDrawerProps) => {
  const isDesktop = useIsDesktop();
  const { data: usersData, isLoading: isLoadingUsers } = useUsers();
  const [searchQuery, setSearchQuery] = useState("");

  const users = useMemo(() => usersData?.data ?? [], [usersData]);

  // Reiniciar la búsqueda cada vez que se abre el picker. Es el patrón de
  // "adjusting state during render" (react.dev/learn/you-might-not-need-an-effect)
  // en lugar de un effect con setState sincrónico.
  const [previousOpen, setPreviousOpen] = useState(isOpen);
  if (previousOpen !== isOpen) {
    setPreviousOpen(isOpen);
    if (isOpen) setSearchQuery("");
  }

  const query = searchQuery.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    if (!query) return users;
    return users.filter(
      (user: User) =>
        user.name.toLowerCase().includes(query) ||
        user.phoneNumber.includes(query),
    );
  }, [users, query]);

  const { visibleCount, sentinelRef, hasMore } = useInfiniteScroll(
    12,
    12,
    filteredUsers.length,
  );

  const visibleUsers = filteredUsers.slice(0, visibleCount);

  const handleSelect = (user: User) => {
    onSelectClient(user);
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      placement={isDesktop ? "right" : "bottom"}
      size={isDesktop ? "sm" : "3xl"}
      backdrop="blur"
      classNames={{
        base: isDesktop
          ? "bg-surface-container-high text-foreground dark border-l border-black/10 dark:border-white/10"
          : "rounded-t-[3rem] bg-surface-container-high text-foreground dark border-t border-black/10 dark:border-white/10",
      }}
    >
      <DrawerContent>
        <DrawerHeader className="flex items-center justify-between gap-4 border-b border-black/5 dark:border-white/5 pb-4">
          <h2 className="text-2xl font-black">Elegir cliente</h2>
          <Button
            isIconOnly
            variant="light"
            aria-label="Cerrar"
            onPress={onClose}
            className="rounded-full text-on-surface-variant"
          >
            <X size={22} />
          </Button>
        </DrawerHeader>

        <DrawerBody className="py-6 space-y-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
          <Input
            isClearable
            placeholder="Buscar cliente..."
            aria-label="Buscar cliente"
            startContent={<Search size={18} className="text-on-surface-variant" />}
            value={searchQuery}
            onValueChange={setSearchQuery}
            variant="bordered"
            size="lg"
            classNames={fieldInputClassNames.lg}
          />

          {isLoadingUsers ? (
            <div className="flex justify-center py-12">
              <Spinner color="primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-dark-200/50 rounded-md p-10 text-center border border-dashed border-black/10 dark:border-white/10">
              <UserIcon
                size={40}
                className="mx-auto text-on-surface-variant mb-3"
              />
              <p className="text-on-surface-variant font-medium">
                {users.length === 0
                  ? "No hay clientes cargados"
                  : "Sin resultados"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {visibleUsers.map((user: User) => (
                <Button
                  key={user._id}
                  fullWidth
                  variant="light"
                  onPress={() => handleSelect(user)}
                  className="!justify-start h-auto py-3 px-4 rounded-lg !bg-black/5 dark:!bg-white/5 gap-3"
                >
                  <UserIcon
                    size={18}
                    className="text-on-surface-variant shrink-0"
                  />
                  <span className="flex-1 min-w-0 text-left">
                    <span className="block font-medium text-foreground truncate">
                      {user.name}
                    </span>
                    <span className="block text-sm text-on-surface-variant truncate">
                      {formatPhoneForDisplay(user.phoneNumber)}
                    </span>
                  </span>
                </Button>
              ))}

              <div ref={sentinelRef}>
                {hasMore && (
                  <div className="flex justify-center py-6">
                    <Spinner color="primary" size="sm" />
                  </div>
                )}
                {!hasMore && filteredUsers.length > 12 && (
                  <p className="text-center text-on-surface-variant text-xs font-bold uppercase tracking-wide py-4">
                    {filteredUsers.length} clientes cargados
                  </p>
                )}
              </div>
            </div>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};