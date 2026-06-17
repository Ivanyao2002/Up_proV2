"use client";

import { useQuery } from "@tanstack/react-query";
import { driverDetailKeys } from "./driverDetail.keys";
import { driverDispatchEligibilityService } from "./driverDispatchEligibility.service";

export function useDriverDispatchEligibility(driverId: string, enabled = true) {
  return useQuery({
    queryKey: driverDetailKeys.dispatchEligibility(driverId),
    queryFn: () => driverDispatchEligibilityService.getByDriverId(driverId),
    enabled: Boolean(driverId) && enabled,
    staleTime: 30_000,
  });
}
