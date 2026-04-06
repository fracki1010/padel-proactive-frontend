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
