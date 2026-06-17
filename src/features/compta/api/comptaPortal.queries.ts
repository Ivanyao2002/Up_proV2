"use client";

import { useQuery } from "@tanstack/react-query";
import { comptaPortalService } from "./comptaPortal.service";

export const comptaPortalKeys = {
  all: ["compta-portal"] as const,
  me: () => ["compta-portal", "me"] as const,
  dashboard: () => ["compta-portal", "dashboard"] as const,
};

export function useComptaMe() {
  return useQuery({
    queryKey: comptaPortalKeys.me(),
    queryFn: () => comptaPortalService.me(),
    staleTime: 60_000,
  });
}

export function useComptaDashboard() {
  return useQuery({
    queryKey: comptaPortalKeys.dashboard(),
    queryFn: () => comptaPortalService.dashboard(),
  });
}
