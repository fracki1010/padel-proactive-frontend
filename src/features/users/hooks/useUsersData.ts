import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { userService } from "../../../services/api";
import type { User } from "../../../types";

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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
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

export const useUserById = (userId: string | null) => {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: () => (userId ? userService.getUserById(userId) : null),
    enabled: !!userId,
  });
};

export const useAdjustAttendanceCount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, delta }: { id: string; delta: number }) =>
      userService.adjustAttendanceCount(id, delta),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
    },
  });
};

export const useSetDepositExemption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      userService.setDepositExemption(id, enabled),
    onSuccess: (data, variables) => {
      const { depositExempt } = data.data;

      queryClient.setQueryData<{ success: boolean; data: User }>(
        ["user", variables.id],
        (previous) => {
          if (!previous) return previous;
          return { ...previous, data: { ...previous.data, depositExempt } };
        },
      );

      queryClient.setQueryData<{ success: boolean; count?: number; data: User[] }>(
        ["users"],
        (previous) => {
          if (!previous || !Array.isArray(previous.data)) return previous;
          return {
            ...previous,
            data: previous.data.map((user) =>
              user._id === variables.id ? { ...user, depositExempt } : user,
            ),
          };
        },
      );

      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
    },
  });
};
