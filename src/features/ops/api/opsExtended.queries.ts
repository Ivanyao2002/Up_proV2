"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import {
  opsExtendedService,
  type CrisisModeState,
} from "./opsExtended.service";

export function useTripForensic(tripId: string) {
  return useQuery({
    queryKey: ["ops", "trips", tripId, "forensic"],
    queryFn: () => opsExtendedService.getTripForensic(tripId),
    enabled: Boolean(tripId),
  });
}

export function useCrisisMode() {
  return useQuery({
    queryKey: ["ops", "crisis"],
    queryFn: () => opsExtendedService.getCrisisMode(),
  });
}

export function useUpdateCrisisMode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CrisisModeState>) =>
      opsExtendedService.updateCrisisMode(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ops", "crisis"] });
      notificationService.success("Mode crise mis à jour");
    },
  });
}
