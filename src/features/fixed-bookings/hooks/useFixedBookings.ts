import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fixedBookingService,
  type FixedBookingListParams,
  type FixedBookingPayload,
} from "../../../services/fixedBookingService";

const FIXED_BOOKINGS_KEY = ["fixed-bookings"];

export const useFixedBookings = (params: FixedBookingListParams = {}) => {
  return useQuery({
    queryKey: [...FIXED_BOOKINGS_KEY, params],
    queryFn: () => fixedBookingService.listFixedBookings(params),
    retry: 1,
  });
};

export const useCreateFixedBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FixedBookingPayload) =>
      fixedBookingService.createFixedBooking(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FIXED_BOOKINGS_KEY });
    },
  });
};

export const useUpdateFixedBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<FixedBookingPayload>;
    }) => fixedBookingService.updateFixedBooking(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FIXED_BOOKINGS_KEY });
    },
  });
};

export const useDeleteFixedBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => fixedBookingService.deleteFixedBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FIXED_BOOKINGS_KEY });
    },
  });
};
