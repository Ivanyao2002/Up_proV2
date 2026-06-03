"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import { tripsKeys } from "./trips.keys";
import { tripDetailKeys } from "./tripDetail.keys";
import { tripDetailService } from "./tripDetail.service";

export function useTripDetail(id: string) {
  return useQuery({
    queryKey: tripDetailKeys.detail(id),
    queryFn: () => tripDetailService.getById(id),
    enabled: Boolean(id),
  });
}

export function useReassignCandidates(tripId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...tripDetailKeys.detail(tripId), "candidates"],
    queryFn: () => tripDetailService.getReassignCandidates(tripId),
    enabled: enabled && Boolean(tripId),
  });
}

export function useReassignTrip(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (driverId: number) => tripDetailService.reassign(tripId, driverId),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: tripDetailKeys.detail(tripId) });
      void qc.invalidateQueries({ queryKey: tripsKeys.all });
      notificationService.success(data.message);
    },
    onError: () => notificationService.error("Réassignation impossible"),
  });
}
