import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@heroui/react";
import { Bell, CheckCheck, X } from "lucide-react";

import type {
  NotificationItem,
  NotificationsResponse,
} from "../../notifications/hooks/useNotificationsData";

type NotificationsMutation<Variables = void> = {
  mutate: (variables: Variables) => void;
};

type NotificationsDrawerProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  notificationsData?: NotificationsResponse;
  markAllRead: NotificationsMutation;
  markAsRead: NotificationsMutation<string>;
  onOpenRelatedBooking?: (notification: NotificationItem) => void;
  isDesktop?: boolean;
};

export const NotificationsDrawer = ({
  isOpen,
  onOpenChange,
  notificationsData,
  markAllRead,
  markAsRead,
  onOpenRelatedBooking,
  isDesktop = false,
}: NotificationsDrawerProps) => {
  const notifications = notificationsData?.data ?? [];
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

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

  const hasRelatedBooking = (notification: NotificationItem) =>
    Boolean(
      notification?.bookingId ||
        notification?.booking?._id ||
        notification?.data?.bookingId ||
        notification?.metadata?.bookingId,
    );

  const getNotificationBadge = (type: string) => {
    if (type === "new_booking") {
      return { label: "Nueva Reserva", className: "bg-primary text-on-primary" };
    }
    if (type === "fixed_turn_request") {
      return { label: "Turno Fijo", className: "bg-amber-500 text-black" };
    }
    return { label: "Sistema", className: "bg-blue-500 text-white" };
  };

  // Optimistic: the cache is updated instantly by the mutation, so this only
  // fires the background sync — no loading state is awaited.
  const handleMarkAsRead = (notification: NotificationItem) => {
    if (notification.isRead) return;
    markAsRead.mutate(notification._id);
  };

  return (
    <Drawer
      isOpen={isOpen}
      size={isDesktop ? "3xl" : "full"}
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
              className={`flex flex-row items-center justify-between p-4 sm:p-8 text-center pb-0 border-b border-black/10 dark:border-white/10 ${isDesktop ? "pt-4 sm:pt-6" : "pt-safe"}`}
            >
              <div className="flex flex-col items-start">
                <h2 className="text-2xl font-black text-foreground tracking-tight">
                  Notificaciones
                </h2>
                <p className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase">
                  Alertas del Sistema
                  {unreadCount > 0 && ` · ${unreadCount} sin leer`}
                </p>
              </div>
              <Button
                isIconOnly
                variant="flat"
                className="bg-black/5 dark:bg-white/5 text-foreground rounded-md"
                aria-label="Cerrar notificaciones"
                onPress={onClose}
              >
                <X size={20} />
              </Button>
            </DrawerHeader>
            <DrawerBody className="p-4 sm:p-8 overflow-y-auto pb-8">
              <div className="flex flex-col gap-4">
                {!notifications.length && (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                    <Bell size={48} className="mb-4" />
                    <p className="font-bold uppercase tracking-widest text-xs">
                      No hay notificaciones
                    </p>
                  </div>
                )}
                {notifications.map((notification) => {
                  const badge = getNotificationBadge(notification.type);
                  const isUnread = !notification.isRead;
                  const canOpenBooking = hasRelatedBooking(notification) && onOpenRelatedBooking;
                  return (
                    <div
                      key={notification._id}
                      className={`relative p-6 rounded-lg border transition-all ${
                        isUnread
                          ? "bg-primary/10 border-primary/20 shadow-[0_0_20px_rgba(126,169,236,0.18)]"
                          : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 opacity-60"
                      }`}
                    >
                      {isUnread && (
                        <button
                          type="button"
                          aria-label={`Marcar como leída: ${notification.title}`}
                          onClick={() => handleMarkAsRead(notification)}
                          className="absolute inset-0 z-0 cursor-pointer rounded-lg transition-colors active:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                        />
                      )}
                      <div className="relative z-10 pointer-events-none">
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
                        {canOpenBooking && (
                          <Button
                            size="sm"
                            className="pointer-events-auto mt-4 bg-primary/20 text-primary border border-primary/30 font-black uppercase tracking-wide"
                            onPress={() => {
                              handleMarkAsRead(notification);
                              onOpenRelatedBooking(notification);
                              onClose();
                            }}
                          >
                            Ver turno
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </DrawerBody>
            {unreadCount > 0 && (
              <DrawerFooter className="px-4 sm:px-8 pt-3 pb-safe border-t border-black/10 dark:border-white/10">
                <Button
                  fullWidth
                  size="lg"
                  aria-label="Marcar todas las notificaciones como leídas"
                  onPress={() => markAllRead.mutate()}
                  className="h-control-lg min-h-control-lg bg-primary text-on-primary font-black uppercase tracking-wide rounded-md"
                  startContent={<CheckCheck size={20} />}
                >
                  Marcar todo como leído
                </Button>
              </DrawerFooter>
            )}
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};
