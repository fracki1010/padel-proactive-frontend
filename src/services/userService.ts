import { api } from "./httpClient";

export const userService = {
  getUsers: async (): Promise<any> => {
    const response = await api.get("/users");
    return response.data;
  },
  createUser: async (data: any): Promise<any> => {
    const response = await api.post("/users", data);
    return response.data;
  },
  updateUser: async (id: string, data: any): Promise<any> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  deleteUser: async (id: string): Promise<any> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
  getUserHistory: async (id: string): Promise<any> => {
    const response = await api.get(`/users/${id}/history`);
    return response.data;
  },
  clearPenalties: async (id: string): Promise<any> => {
    const response = await api.post(`/users/${id}/clear-penalties`);
    return response.data;
  },
};
