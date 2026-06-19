"use client";

import { useQuery } from "@tanstack/react-query";
import { useScope } from "@/core/auth/useScope";
import { partnerPerformanceService } from "./performance.service";
import type { ListParams } from "@/shared/types/listParams";

export const partnerPerformanceKeys = {
  all: ["partner", "performance"] as const,
  vehicles: (filters?: ListParams) => [...partnerPerformanceKeys.all, "vehicles", filters] as const,
  drivers: (filters?: ListParams) => [...partnerPerformanceKeys.all, "drivers", filters] as const,
  fleet: (filters?: ListParams) => [...partnerPerformanceKeys.all, "fleet", filters] as const,
};

export function useVehiclePerformance(params?: ListParams) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerPerformanceKeys.vehicles(params),
    queryFn: () => partnerPerformanceService.vehicles(ownerId!, params),
    enabled: ownerId != null,
  });
}

export function useDriverPerformance(params?: ListParams) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerPerformanceKeys.drivers(params),
    queryFn: () => partnerPerformanceService.drivers(ownerId!, params),
    enabled: ownerId != null,
  });
}

export function useFleetPerformance(params?: ListParams) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerPerformanceKeys.fleet(params),
    queryFn: () => partnerPerformanceService.fleet(ownerId!, params),
    enabled: ownerId != null,
  });
}
