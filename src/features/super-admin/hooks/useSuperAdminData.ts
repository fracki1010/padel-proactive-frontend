import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { superAdminService } from "../../../services/api";

export const useCompanies = (enabled = true) => {
  return useQuery({
    queryKey: ["companies"],
    queryFn: superAdminService.listCompanies,
    enabled,
    retry: 1,
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: superAdminService.createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
};

export const useUpdateCompanyStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      superAdminService.updateCompanyStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },
  });
};

export const useAdmins = (enabled = true) => {
  return useQuery({
    queryKey: ["admins"],
    queryFn: superAdminService.listAdmins,
    enabled,
    retry: 1,
  });
};

export const useCreateAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: superAdminService.createAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },
  });
};

export const useUpdateAdminStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      superAdminService.updateAdminStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },
  });
};

export const useBootstrapDefaultTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: superAdminService.bootstrapDefaultTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },
  });
};
