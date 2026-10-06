import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { notificationService } from "../../../services/api";

export type NotificationItem = {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead?: boolean;
  createdAt: string;
  bookingId?: string;
  booking?: { _id?: string };
  data?: { bookingId?: string };
  metadata?: { bookingId?: string };
};

export type NotificationsResponse = {
  data: NotificationItem[];
};

const NOTIFICATIONS_QUERY_KEY = ["notifications"];

const markAllReadInCache = (
  current: NotificationsResponse | undefined,
): NotificationsResponse | undefined => {
  if (!current?.data) return current;
  return {
    ...current,
    data: current.data.map((notification) => ({ ...notification, isRead: true })),
  };
};

const markOneReadInCache = (
  current: NotificationsResponse | undefined,
  id: string,
): NotificationsResponse | undefined => {
  if (!current?.data) return current;
  return {
    ...current,
    data: current.data.map((notification) =>
      notification._id === id ? { ...notification, isRead: true } : notification,
    ),
  };
};

export const useNotifications = (enabled = true) => {
  return useQuery<NotificationsResponse>({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: notificationService.getNotifications,
    enabled,
    retry: 1,
    refetchInterval: enabled ? 10000 : false,
  });
};

export const useMarkAllRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.markAllRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      const previous = queryClient.getQueryData<NotificationsResponse>(
        NOTIFICATIONS_QUERY_KEY,
      );
      queryClient.setQueryData<NotificationsResponse>(
        NOTIFICATIONS_QUERY_KEY,
        markAllReadInCache,
      );
      return { previous };
    },
    onError: (error, _variables, context) => {
      // Keep the UI forgiving: revert to the last server snapshot and log in
      // the background instead of surfacing a blocking error state.
      console.error("[notifications] mark-all-read failed", error);
      if (context?.previous) {
        queryClient.setQueryData<NotificationsResponse>(
          NOTIFICATIONS_QUERY_KEY,
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      const previous = queryClient.getQueryData<NotificationsResponse>(
        NOTIFICATIONS_QUERY_KEY,
      );
      queryClient.setQueryData<NotificationsResponse>(
        NOTIFICATIONS_QUERY_KEY,
        (current) => markOneReadInCache(current, id),
      );
      return { previous };
    },
    onError: (error, _id, context) => {
      console.error("[notifications] mark-as-read failed", error);
      if (context?.previous) {
        queryClient.setQueryData<NotificationsResponse>(
          NOTIFICATIONS_QUERY_KEY,
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
};
