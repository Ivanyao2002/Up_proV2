"use client";

import { useQuery } from "@tanstack/react-query";
import { tripDetailKeys } from "./tripDetail.keys";
import { tripDetailService } from "./tripDetail.service";

export function useTripDetail(id: string) {
  return useQuery({
    queryKey: tripDetailKeys.detail(id),
    queryFn: () => tripDetailService.getById(id),
    enabled: Boolean(id),
  });
}
