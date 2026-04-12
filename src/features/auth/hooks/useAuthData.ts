import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authService } from "../../../services/api";

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-me"] });
    },
  });
};

export const useUpdateOwnCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.updateCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-me"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
};
