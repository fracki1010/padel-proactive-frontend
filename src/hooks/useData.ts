import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  bookingService,
  configService,
  userService,
  notificationService,
  authService,
} from "../services/api";

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-me"] });
    },
  });
};

export const useBookings = (date?: string, enabled = true) => {
  return useQuery({
    queryKey: ["bookings", date],
    queryFn: () => bookingService.getBookings(date),
    enabled,
    retry: 1,
  });
};

export const useCourts = (all = false, enabled = true) => {
  return useQuery({
    queryKey: ["courts", all],
    queryFn: () => configService.getCourts(all),
    enabled,
    retry: 1,
  });
};

export const useUpdateCourt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      configService.updateCourt(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courts"] });
    },
  });
};

export const useSlots = (all = false) => {
  return useQuery({
    queryKey: ["slots", all],
    queryFn: () => configService.getSlots(all),
  });
};

export const useWhatsappStatus = () => {
  return useQuery({
    queryKey: ["whatsapp-status"],
    queryFn: configService.getWhatsappStatus,
    refetchInterval: 5000,
  });
};

export const useUpdateWhatsappStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) => configService.updateWhatsappStatus(enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-status"] });
    },
  });
};

export const useUpdateSlot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      configService.updateSlot(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    },
  });
};

export const useUpdateBasePrice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (price: number) => configService.updateBasePrice(price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
};

export const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: userService.getUsers,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      userService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useClearPenalties = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userService.clearPenalties(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useUserHistory = (userId: string | null) => {
  return useQuery({
    queryKey: ["user-history", userId],
    queryFn: () => (userId ? userService.getUserHistory(userId) : null),
    enabled: !!userId,
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingService.createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useDeleteBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookingService.deleteBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
};

export const useUpdateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      bookingService.updateBooking(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
};

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
