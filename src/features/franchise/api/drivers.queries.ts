"use client";

import { useQuery } from "@tanstack/react-query";
import { franchiseDriversService } from "./drivers.service";

export const franchiseDriversKeys = {
  all: ["franchise", "drivers"] as const,
  list: () => [...franchiseDriversKeys.all, "list"] as const,
  detail: (id: string) => [...franchiseDriversKeys.all, "detail", id] as const,
};

export function useFranchiseDriversList() {
  return useQuery({
    queryKey: franchiseDriversKeys.list(),
    queryFn: () => franchiseDriversService.list(),
  });
}

export function useFranchiseDriverDetail(id: string) {
  return useQuery({
    queryKey: franchiseDriversKeys.detail(id),
    queryFn: () => franchiseDriversService.getById(id),
    enabled: Boolean(id),
  });
}
