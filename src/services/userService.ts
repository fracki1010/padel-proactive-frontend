import { api } from "./httpClient";
import type { User } from "../types";

export const userService = {
  getUsers: async (): Promise<any> => {
    const response = await api.get("/users");
    return response.data;
  },
  /**
   * Server-side search + pagination for the client picker.
   * `search` matches name (case-insensitive) and phone digits; results come
   * sorted by name, `limit` per page (1..50, default 10). When no `search` is
   * given, returns the first page of the full list. Same item shape as
   * `getUsers`, plus a `total` of matching entries.
   */
  searchUsers: async (
    params: { search?: string; page?: number; limit?: number } = {},
  ): Promise<{ success: boolean; data: User[]; total?: number }> => {
    const { search = "", page = 1, limit = 10 } = params;
    const response = await api.get("/users", {
      params: { search: search.trim(), page, limit },
    });
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
  getUserById: async (id: string): Promise<any> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  clearPenalties: async (id: string): Promise<any> => {
    const response = await api.post(`/users/${id}/clear-penalties`);
    return response.data;
  },
  adjustAttendanceCount: async (id: string, delta: number): Promise<any> => {
    const response = await api.post(`/users/${id}/attendance/adjust`, { delta });
    return response.data;
  },
  setDepositExemption: async (
    id: string,
    enabled: boolean,
  ): Promise<{ success: boolean; data: { depositExempt: boolean } }> => {
    const response = await api.put(`/users/${id}/deposit-exempt`, { enabled });
    return response.data;
  },
};
