import { Button, Drawer, DrawerBody, DrawerContent, DrawerHeader } from "@heroui/react";
import { Bell, CheckCheck, X } from "lucide-react";

type NotificationsDrawerProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  notificationsData: any;
  markAllRead: any;
};

export const NotificationsDrawer = ({
  isOpen,
  onOpenChange,
  notificationsData,
  markAllRead,
}: NotificationsDrawerProps) => {
  const getNotificationBadge = (type: string) => {
    if (type === "new_booking") {
      return { label: "Nueva Reserva", className: "bg-primary text-black" };
    }
    if (type === "fixed_turn_request") {
      return { label: "Turno Fijo", className: "bg-amber-500 text-black" };
    }
    return { label: "Sistema", className: "bg-blue-500 text-white" };
  };

  return (
    <Drawer
      isOpen={isOpen}
      size="full"
      hideCloseButton
      onOpenChange={onOpenChange}
      placement="bottom"
      backdrop="blur"
      classNames={{
        base: "rounded-t-[3rem] bg-dark-200 border-t border-white/10",
      }}
    >
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader className="flex flex-row items-center justify-between p-4 sm:p-8 text-center pb-0 pt-safe">
              <div className="flex flex-col items-start">
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Notificaciones
                </h2>
                <p className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase">
                  Alertas del Sistema
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  isIconOnly
                  variant="flat"
                  className="bg-white/5 text-white rounded-2xl"
                  onPress={() => markAllRead.mutate()}
                >
                  <CheckCheck size={20} />
                </Button>
                <Button
                  isIconOnly
                  variant="flat"
                  className="bg-white/5 text-white rounded-2xl"
                  onPress={onClose}
                >
                  <X size={20} />
                </Button>
              </div>
            </DrawerHeader>
            <DrawerBody className="p-4 sm:p-8 pb-28 sm:pb-32 overflow-y-auto">
              <div className="flex flex-col gap-4">
                {!notificationsData?.data?.length && (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                    <Bell size={48} className="mb-4" />
                    <p className="font-bold uppercase tracking-widest text-xs">
                      No hay notificaciones
                    </p>
                  </div>
                )}
                {notificationsData?.data?.map((notification: any) => {
                  const badge = getNotificationBadge(notification.type);
                  return (
                  <div
                    key={notification._id}
                    className={`p-6 rounded-[2rem] border transition-all ${
                      notification.isRead
                        ? "bg-white/5 border-white/5 opacity-60"
                        : "bg-primary/10 border-primary/20 shadow-[0_0_20px_rgba(255,122,0,0.12)]"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-[10px] font-bold text-white/30">
                        {new Date(notification.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-white mb-1 tracking-tight">
                      {notification.title}
                    </h4>
                    <p className="text-sm font-medium text-white/60 leading-relaxed whitespace-pre-line">
                      {notification.message}
                    </p>
                  </div>
                  );
                })}
              </div>
            </DrawerBody>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};
