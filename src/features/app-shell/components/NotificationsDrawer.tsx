import { Button, Drawer, DrawerBody, DrawerContent, DrawerHeader } from "@heroui/react";
import { Bell, CheckCheck, X } from "lucide-react";

type NotificationsDrawerProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  notificationsData: any;
  markAllRead: any;
  onOpenRelatedBooking?: (notification: any) => void;
  isDesktop?: boolean;
};

export const NotificationsDrawer = ({
  isOpen,
  onOpenChange,
  notificationsData,
  markAllRead,
  onOpenRelatedBooking,
  isDesktop = false,
}: NotificationsDrawerProps) => {
  const getRelativeDateLabel = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);

    if (diffDays === 0) return "Hoy";
    if (diffDays === -1) return "Ayer";
    return date.toLocaleDateString();
  };

  const hasRelatedBooking = (notification: any) =>
    Boolean(
      notification?.bookingId ||
        notification?.booking?._id ||
        notification?.data?.bookingId ||
        notification?.metadata?.bookingId,
    );

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
      size={isDesktop ? "2xl" : "full"}
      hideCloseButton
      onOpenChange={onOpenChange}
      placement={isDesktop ? "right" : "bottom"}
      backdrop="blur"
      classNames={{
        base: isDesktop
          ? "bg-dark-200 border-l border-black/10 dark:border-white/10"
          : "rounded-t-[3rem] bg-dark-200 border-t border-black/10 dark:border-white/10",
      }}
    >
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader
              className={`flex flex-row items-center justify-between p-4 sm:p-8 text-center pb-0 ${isDesktop ? "pt-4 sm:pt-6" : "pt-safe"}`}
            >
              <div className="flex flex-col items-start">
                <h2 className="text-2xl font-black text-foreground tracking-tight">
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
                  className="bg-black/5 dark:bg-white/5 text-foreground rounded-2xl"
                  onPress={() => markAllRead.mutate()}
                >
                  <CheckCheck size={20} />
                </Button>
                <Button
                  isIconOnly
                  variant="flat"
                  className="bg-black/5 dark:bg-white/5 text-foreground rounded-2xl"
                  onPress={onClose}
                >
                  <X size={20} />
                </Button>
              </div>
            </DrawerHeader>
            <DrawerBody
              className={`p-4 sm:p-8 overflow-y-auto ${isDesktop ? "pb-8" : "pb-28 sm:pb-32"}`}
            >
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
                        ? "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 opacity-60"
                        : "bg-primary/10 border-primary/20 shadow-[0_0_20px_rgba(126,169,236,0.18)]"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-[10px] font-bold text-foreground/30 text-right">
                        {getRelativeDateLabel(notification.createdAt)}
                        <br />
                        {new Date(notification.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-foreground mb-1 tracking-tight">
                      {notification.title}
                    </h4>
                    <p className="text-sm font-medium text-foreground/60 leading-relaxed whitespace-pre-line">
                      {notification.message}
                    </p>
                    {hasRelatedBooking(notification) && onOpenRelatedBooking && (
                      <Button
                        size="sm"
                        className="mt-4 bg-primary/20 text-primary border border-primary/30 font-black uppercase tracking-wide"
                        onPress={() => {
                          onOpenRelatedBooking(notification);
                          onClose();
                        }}
                      >
                        Ver turno
                      </Button>
                    )}
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
