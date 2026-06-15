"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { franchiseTerritoryService, type ExtensionRequestPayload } from "./territory.service";

export const franchiseTerritoryKeys = {
  all: ["franchise", "territory"] as const,
};

export function useFranchiseTerritory() {
  return useQuery({
    queryKey: franchiseTerritoryKeys.all,
    queryFn: () => franchiseTerritoryService.get(),
  });
}

export function useRequestExtension() {
  return useMutation({
    mutationFn: (payload: ExtensionRequestPayload) =>
      franchiseTerritoryService.requestExtension(payload),
  });
}
