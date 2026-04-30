import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { configService } from "../../../services/api";
import type { CompanyImage, DigestBackground } from "../../../services/configService";

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
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
};

export const useCreateCourt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; courtType?: string; surface?: string; isIndoor?: boolean }) =>
      configService.createCourt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courts"] });
    },
  });
};

export const useDeleteCourt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => configService.deleteCourt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courts"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
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

        if (status === 401) {
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

export const useResetWhatsappSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: configService.resetWhatsappSession,
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

export const useBotAutomationSettings = () => {
  return useQuery({
    queryKey: ["bot-automation-settings"],
    queryFn: configService.getBotAutomationSettings,
    retry: 1,
  });
};

export const useUpdateBotAutomationSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      oneHourReminderEnabled?: boolean;
      attendanceReminderLeadMinutes?: number;
      attendanceResponseTimeoutMinutes?: number;
      cancellationLockHours?: number;
      trustedClientConfirmationCount?: number;
      penaltyEnabled?: boolean;
      penaltySystemEnabled?: boolean;
      penaltyLimit?: number;
    }) => configService.updateBotAutomationSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bot-automation-settings"] });
      queryClient.invalidateQueries({ queryKey: ["penalty-settings"] });
      queryClient.invalidateQueries({ queryKey: ["one-hour-reminder-setting"] });
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
      dailyAvailabilityDigestHour: string;
      dailyAvailabilityDigestNextDayEnabled: boolean;
      dailyAvailabilityDigestFormat?: "text" | "image";
    }) =>
      configService.updateWhatsappCancellationGroupSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-cancellation-group-settings"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-status"] });
      queryClient.invalidateQueries({ queryKey: ["bot-automation-settings"] });
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

export const useClubClosures = () => {
  return useQuery({
    queryKey: ["club-closures"],
    queryFn: configService.getClubClosures,
    retry: 1,
  });
};

export const useCreateClubClosure = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { startDate: string; endDate: string; reason: string }) =>
      configService.createClubClosure(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["club-closures"] });
    },
  });
};

export const useUpdateClubClosure = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ startDate: string; endDate: string; reason: string }> }) =>
      configService.updateClubClosure(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["club-closures"] });
    },
  });
};

export const useDeleteClubClosure = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => configService.deleteClubClosure(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["club-closures"] });
    },
  });
};

export const useWhatsappCommands = ({
  limit = 20,
  status = "",
  type = "",
}: {
  limit?: number;
  status?: string;
  type?: string;
} = {}) => {
  return useQuery({
    queryKey: ["whatsapp-commands", limit, status, type],
    queryFn: () => configService.getWhatsappCommands({ limit, status, type }),
    retry: 1,
    refetchInterval: 5000,
  });
};

export const useCompanyImages = (type?: "portal_cover" | "digest_background") => {
  return useQuery<CompanyImage[]>({
    queryKey: ["company-images", type],
    queryFn: () => configService.getCompanyImages(type),
    retry: 1,
  });
};

export const useUploadCompanyImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, type, order }: { file: File; type: "portal_cover" | "digest_background"; order?: number }) =>
      configService.uploadCompanyImage(file, type, order),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["company-images", variables.type] });
      queryClient.invalidateQueries({ queryKey: ["company-images"] });
    },
  });
};

export const useDeleteCompanyImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => configService.deleteCompanyImage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-images"] });
    },
  });
};

export const useSendDigestNow = () =>
  useMutation({ mutationFn: configService.sendDigestNow });

export const useDigestBackgrounds = () => {
  return useQuery<DigestBackground[]>({
    queryKey: ["company-images", "digest_background"],
    queryFn: configService.getDigestBackgrounds,
    retry: 1,
  });
};

export const useUploadDigestBackground = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, order }: { file: File; order: number }) =>
      configService.uploadDigestBackground(file, order),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["company-images"] }),
  });
};

export const useDeleteDigestBackground = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => configService.deleteDigestBackground(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["company-images"] }),
  });
};
