import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { bookingService } from "../../../services/api";

export const useBookings = (date?: string, enabled = true) => {
  return useQuery({
    queryKey: ["bookings", date],
    queryFn: () => bookingService.getBookings(date),
    enabled,
    retry: 1,
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

// Marks a transfer seña as received from the booking detail. The transition
// also confirms the client by WhatsApp, so the bookings list and any other
// reads must refresh afterwards.
export const useConfirmDepositReceived = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => bookingService.confirmDepositReceived(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
};
