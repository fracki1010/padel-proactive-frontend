import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { notificationService } from "../../../services/api";

export const useNotifications = (enabled = true) => {
  return useQuery({
    queryKey: ["notifications"],
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
