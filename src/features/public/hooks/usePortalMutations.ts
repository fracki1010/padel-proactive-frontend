import { useMutation, useQueryClient } from "@tanstack/react-query";

import { publicService } from "../../../services/publicService";

// Mutation hooks for the public portal. Each keeps the same service call the
// components used to run by hand and refreshes the TanStack queries that the
// write affects. Components keep their own optimistic state, toasts and error
// paths and read the mutation result (`res.data`) from `mutateAsync` exactly
// as before.

export const useAcquireSlotLock = (slug: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      courtId: string;
      slotId: string;
      date: string;
      holderId: string;
    }) => publicService.acquireSlotLock(slug!, payload),
    onSuccess: (_res, variables) => {
      // A fresh lock changes what the grid can offer for that slot.
      queryClient.invalidateQueries({
        queryKey: ["portal-availability", slug, variables.date, variables.holderId],
      });
    },
  });
};

export const useReleaseSlotLock = (slug: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: { lockId: string; holderId: string }) =>
      publicService.releaseSlotLock(slug!, args.lockId, args.holderId),
    onSuccess: () => {
      // The lock carries no date, so refresh the whole club availability.
      queryClient.invalidateQueries({ queryKey: ["portal-availability", slug] });
    },
  });
};

export const useCreateBooking = (slug: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      courtId: string;
      slotId: string;
      date: string;
      holderId?: string;
    }) => publicService.createBooking(slug!, payload),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["portal-availability", slug, variables.date, variables.holderId],
      });
      queryClient.invalidateQueries({ queryKey: ["portal-my-bookings", slug] });
    },
  });
};

export const useRegeneratePaymentLink = (slug: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) =>
      publicService.regeneratePaymentLink(slug!, bookingId),
    onSuccess: () => {
      // The list mirrors the deposit hold state, so keep it fresh.
      queryClient.invalidateQueries({ queryKey: ["portal-my-bookings", slug] });
    },
  });
};

export const useCancelBooking = (slug: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => publicService.cancelBooking(slug!, bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal-my-bookings", slug] });
      // A cancelled booking frees the court for that slot.
      queryClient.invalidateQueries({ queryKey: ["portal-availability", slug] });
    },
  });
};

// Auth mutations only drive the auth context state (set by the modal in its
// handlers), so they invalidate nothing.

export const useSendOtp = (slug: string | undefined) =>
  useMutation({
    mutationFn: (args: { countryCode: string; localNumber: string; googleFlow?: boolean }) =>
      publicService.sendOtp(slug!, args.countryCode, args.localNumber, args.googleFlow),
  });

export const useVerifyOtp = (slug: string | undefined) =>
  useMutation({
    mutationFn: (payload: { countryCode: string; localNumber: string; otp: string }) =>
      publicService.verifyOtp(slug!, payload),
  });

export const useCompleteRegistration = (slug: string | undefined) =>
  useMutation({
    mutationFn: (payload: {
      name: string;
      countryCode: string;
      localNumber: string;
      otp: string;
    }) => publicService.completeRegistration(slug!, payload),
  });

export const useGoogleAuth = (slug: string | undefined) =>
  useMutation({
    mutationFn: (args: {
      idToken: string;
      phonePayload?: { countryCode: string; localNumber: string; otp: string };
    }) => publicService.googleAuth(slug!, args.idToken, args.phonePayload),
  });