"use client";

import { useQuery } from "@tanstack/react-query";
import { tripsKeys } from "./trips.keys";
import { tripsService } from "./trips.service";
import type { TripStatus } from "@/shared/types";

export function useTripsList(statusFilter?: TripStatus | "all") {
  return useQuery({
    queryKey: tripsKeys.list(statusFilter),
    queryFn: () => tripsService.listAdmin(),
  });
}
