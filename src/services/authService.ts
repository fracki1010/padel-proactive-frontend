import { api } from "./httpClient";

export const authService = {
  updateProfile: async (data: { username?: string; phone?: string }) => {
    const response = await api.put("/auth/profile", data);
    return response.data;
  },
};
