"use client";

import { useQuery } from "@tanstack/react-query";
import { driversKeys } from "./drivers.keys";
import { driversService, type DriversListParams } from "./drivers.service";

export function useDriversList(params?: DriversListParams) {
  return useQuery({
    queryKey: driversKeys.list(params),
    queryFn: () => driversService.listAdmin(params),
  });
}
