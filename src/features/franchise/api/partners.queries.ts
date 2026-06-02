"use client";

import { useQuery } from "@tanstack/react-query";
import { franchisePartnersService } from "./partners.service";

export const franchisePartnersKeys = {
  all: ["franchise", "partners"] as const,
  list: () => [...franchisePartnersKeys.all, "list"] as const,
  detail: (id: string) => [...franchisePartnersKeys.all, "detail", id] as const,
};

export function useFranchisePartnersList() {
  return useQuery({
    queryKey: franchisePartnersKeys.list(),
    queryFn: () => franchisePartnersService.list(),
  });
}

export function useFranchisePartnerDetail(id: string) {
  return useQuery({
    queryKey: franchisePartnersKeys.detail(id),
    queryFn: () => franchisePartnersService.getById(id),
    enabled: Boolean(id),
  });
}
