import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { configService } from "../../../services/api";

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

export const useCreateCourt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string }) => configService.createCourt(data),
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
    queryFn: async () => {
      try {
        return await configService.getWhatsappStatus();
      } catch (error: any) {
        const status = error?.response?.status;
        const backendError =
          error?.response?.data?.error || error?.response?.data?.message || "";
        const normalizedError = String(backendError).toLowerCase();

        if (normalizedError.includes("ya está abierta en otro proceso")) {
          return {
            data: {
              enabled: true,
              status: "locked_elsewhere",
              qr: "",
              error: backendError,
              updatedAt: new Date().toISOString(),
            },
          };
        }

        if (status === 401 || status === 404) {
          return {
            data: {
              enabled: false,
              status: "logged_out",
              qr: "",
              updatedAt: new Date().toISOString(),
            },
          };
        }
        throw error;
      }
    },
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      if (status === "locked_elsewhere") return 30000;
      return 5000;
    },
    retry: 1,
  });
};

export const usePenaltySettings = () => {
  return useQuery({
    queryKey: ["penalty-settings"],
    queryFn: configService.getPenaltySettings,
  });
};

export const useOneHourReminderSetting = () => {
  return useQuery({
    queryKey: ["one-hour-reminder-setting"],
    queryFn: configService.getOneHourReminderSetting,
    retry: 1,
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

export const useCloseWhatsappSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: configService.closeWhatsappSession,
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

export const useCreateSlot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { startTime: string; endTime: string; price: number }) =>
      configService.createSlot(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
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

export const useUpdatePenaltySettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (penaltyLimit: number) =>
      configService.updatePenaltySettings(penaltyLimit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["penalty-settings"] });
    },
  });
};

export const useUpdateOneHourReminderSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (enabled: boolean) =>
      configService.updateOneHourReminderSetting(enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["one-hour-reminder-setting"] });
    },
  });
};

export const useWhatsappCancellationGroupSettings = () => {
  return useQuery({
    queryKey: ["whatsapp-cancellation-group-settings"],
    queryFn: configService.getWhatsappCancellationGroupSettings,
    retry: 1,
  });
};

export const useUpdateWhatsappCancellationGroupSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      enabled: boolean;
      groupId: string;
      groupName: string;
      dailyAvailabilityDigestEnabled: boolean;
    }) =>
      configService.updateWhatsappCancellationGroupSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-cancellation-group-settings"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-status"] });
    },
  });
};

export const useWhatsappGroups = () => {
  return useQuery({
    queryKey: ["whatsapp-groups"],
    queryFn: configService.getWhatsappGroups,
    retry: 1,
    staleTime: 60000,
  });
};
