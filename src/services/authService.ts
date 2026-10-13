import { api } from "./httpClient";

export const authService = {
  updateProfile: async (data: { username?: string; phone?: string }) => {
    const response = await api.put("/auth/profile", data);
    return response.data;
  },
  updateCompany: async (data: { name?: string; slug?: string; address?: string; coverImage?: string }) => {
    const response = await api.put("/auth/company", data);
    return response.data;
  },
  uploadCoverImage: async (companyId: string, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("cover", file);
    formData.append("companyId", companyId);
    const response = await api.post("/auth/company/cover", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const url = response.data?.data?.coverImage;
    if (!url) {
      throw new Error(response.data?.error || "No se pudo guardar la imagen");
    }
    return url;
  },
};
