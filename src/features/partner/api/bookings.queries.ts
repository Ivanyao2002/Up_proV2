"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import {
  partnerBookingsService,
  type CreateBookingPayload,
} from "./bookings.service";

export const partnerBookingsKeys = {
  all: ["partner", "bookings"] as const,
  list: () => [...partnerBookingsKeys.all, "list"] as const,
  detail: (id: string) => [...partnerBookingsKeys.all, "detail", id] as const,
};

export function usePartnerBookingsList() {
  return useQuery({
    queryKey: partnerBookingsKeys.list(),
    queryFn: () => partnerBookingsService.list(),
  });
}

export function usePartnerBookingDetail(id: string) {
  return useQuery({
    queryKey: partnerBookingsKeys.detail(id),
    queryFn: () => partnerBookingsService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreatePartnerBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBookingPayload) => partnerBookingsService.create(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerBookingsKeys.all });
    },
  });
}

export function useCancelPartnerBooking(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => partnerBookingsService.cancel(id),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: partnerBookingsKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: partnerBookingsKeys.list() });
      notificationService.success(data.message);
    },
  });
}
