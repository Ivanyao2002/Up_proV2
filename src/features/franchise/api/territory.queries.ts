"use client";

import { useQuery } from "@tanstack/react-query";
import { franchiseTerritoryService } from "./territory.service";

export const franchiseTerritoryKeys = {
  all: ["franchise", "territory"] as const,
};

export function useFranchiseTerritory() {
  return useQuery({
    queryKey: franchiseTerritoryKeys.all,
    queryFn: () => franchiseTerritoryService.get(),
  });
}
