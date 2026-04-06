import type { BookingsResponse } from "../types";

import { api } from "./httpClient";

export const bookingService = {
  getBookings: async (date?: string): Promise<BookingsResponse> => {
    const url = date ? `/bookings?date=${date}` : "/bookings";
    const response = await api.get(url);
    return response.data;
  },

  createBooking: async (bookingData: any) => {
    const response = await api.post("/bookings", bookingData);
    return response.data;
  },

  deleteBooking: async (id: string) => {
    const response = await api.delete(`/bookings/${id}`);
    return response.data;
  },

  updateBooking: async (id: string, data: any) => {
    const response = await api.put(`/bookings/${id}`, data);
    return response.data;
  },
};
