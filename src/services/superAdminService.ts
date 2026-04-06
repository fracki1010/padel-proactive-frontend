import { api } from "./httpClient";

export const superAdminService = {
  listCompanies: async (): Promise<any> => {
    const response = await api.get("/super-admin/companies");
    return response.data;
  },
  createCompany: async (data: { name: string; slug?: string }): Promise<any> => {
    const response = await api.post("/super-admin/companies", data);
    return response.data;
  },
  updateCompanyStatus: async (id: string, isActive: boolean): Promise<any> => {
    const response = await api.put(`/super-admin/companies/${id}/status`, {
      isActive,
    });
    return response.data;
  },
  listAdmins: async (): Promise<any> => {
    const response = await api.get("/super-admin/admins");
    return response.data;
  },
  createAdmin: async (data: {
    username: string;
    password: string;
    phone?: string;
    companyId: string;
    role?: "admin" | "manager";
  }): Promise<any> => {
    const response = await api.post("/super-admin/admins", data);
    return response.data;
  },
  updateAdminStatus: async (id: string, isActive: boolean): Promise<any> => {
    const response = await api.put(`/super-admin/admins/${id}/status`, {
      isActive,
    });
    return response.data;
  },
  bootstrapDefaultTenant: async (data: {
    name: string;
    slug?: string;
    assignAllUnassignedData?: boolean;
    assignAllUnassignedAdmins?: boolean;
  }): Promise<any> => {
    const response = await api.post("/super-admin/bootstrap/default-tenant", data);
    return response.data;
  },
};
