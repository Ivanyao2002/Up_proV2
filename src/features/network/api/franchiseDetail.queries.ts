"use client";

import { useQuery } from "@tanstack/react-query";
import { franchisesKeys } from "./franchises.keys";
import { franchiseDetailService } from "./franchiseDetail.service";

export function useFranchiseDetail(id: string) {
  return useQuery({
    queryKey: [...franchisesKeys.all, "detail", id],
    queryFn: () => franchiseDetailService.getById(id),
    enabled: Boolean(id),
  });
}
