import { useQuery } from "@tanstack/react-query";

import { publicService, type BookingDeposit } from "../../../services/publicService";
import type { Announcement } from "../../../types";

export interface PortalCourt {
  _id: string;
  name: string;
  courtType?: string;
  surface?: string;
}

export interface PortalSlot {
  _id: string;
  startTime: string;
  endTime: string;
  price: number;
  label?: string;
  order?: number;
}

export interface PortalAvailabilityItem {
  courtId: string;
  slotId: string;
  available: boolean;
  locked?: boolean;
}

export interface PortalClubInfo {
  club: {
    name: string;
    address?: string;
    coverImage?: string;
    companyId?: string;
    contactPhone?: string;
  };
  courts: PortalCourt[];
  slots: PortalSlot[];
  cancellationLockHours: number;
}

export interface PortalAvailabilityData {
  closed: boolean;
  closureReason?: string;
  courts: PortalCourt[];
  slots: PortalSlot[];
  availability: PortalAvailabilityItem[];
}

export interface PortalBooking {
  _id: string;
  date: string;
  status: string;
  court: { name: string };
  timeSlot: { startTime: string; endTime: string; label?: string };
  deposit?: BookingDeposit;
}

export interface PortalMyBookings {
  upcoming: PortalBooking[];
  history: PortalBooking[];
}

// Club info (name, courts, schedule) changes rarely: cache it generously.
const CLUB_INFO_STALE_TIME = 5 * 60 * 1000;
// Announcements are edited occasionally; a short window avoids refetching on
// every mount while still picking up changes.
const ANNOUNCEMENTS_STALE_TIME = 60 * 1000;
// Availability is the slot grid, so it must stay close to real time.
const AVAILABILITY_STALE_TIME = 10 * 1000;

export const useClubInfo = (slug: string | undefined) =>
  useQuery({
    queryKey: ["portal-club", slug],
    queryFn: async () => {
      const res = await publicService.getClubInfo(slug!);
      return res.data as PortalClubInfo;
    },
    enabled: Boolean(slug),
    staleTime: CLUB_INFO_STALE_TIME,
    retry: 1,
  });

export const usePortalAnnouncements = (slug: string | undefined) =>
  useQuery({
    queryKey: ["portal-announcements", slug],
    queryFn: async () => {
      const res = await publicService.getAnnouncements(slug!);
      return (res.data || []) as Announcement[];
    },
    enabled: Boolean(slug),
    staleTime: ANNOUNCEMENTS_STALE_TIME,
    retry: 1,
  });

export const usePortalAvailability = (
  slug: string | undefined,
  date: string,
  holderId: string,
) =>
  useQuery({
    queryKey: ["portal-availability", slug, date, holderId],
    queryFn: async () => {
      const res = await publicService.getAvailability(slug!, date, holderId);
      return res.data as PortalAvailabilityData;
    },
    enabled: Boolean(slug),
    staleTime: AVAILABILITY_STALE_TIME,
    retry: 1,
  });

export const useMyBookings = (slug: string | undefined, enabled: boolean) =>
  useQuery({
    queryKey: ["portal-my-bookings", slug],
    queryFn: async () => {
      const res = await publicService.getMyBookings(slug!);
      return res.data as PortalMyBookings;
    },
    enabled: enabled && Boolean(slug),
    retry: 1,
  });
