import type { Announcement, AnnouncementInput, ConfigResponse } from "../types";

import { api } from "./httpClient";

export type AnnouncementMutationResponse = {
  success: boolean;
  data?: unknown;
};

export const announcementService = {
  getAnnouncements: async (): Promise<ConfigResponse<Announcement>> => {
    const response = await api.get("/announcements");
    return response.data;
  },

  createAnnouncement: async (
    data: AnnouncementInput,
  ): Promise<AnnouncementMutationResponse> => {
    const response = await api.post("/announcements", data);
    return response.data;
  },

  updateAnnouncement: async (
    id: string,
    data: Partial<AnnouncementInput>,
  ): Promise<AnnouncementMutationResponse> => {
    const response = await api.put(`/announcements/${id}`, data);
    return response.data;
  },

  deleteAnnouncement: async (
    id: string,
  ): Promise<AnnouncementMutationResponse> => {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  },

  toggleAnnouncement: async (
    id: string,
  ): Promise<AnnouncementMutationResponse> => {
    const response = await api.patch(`/announcements/${id}/toggle`);
    return response.data;
  },
};
