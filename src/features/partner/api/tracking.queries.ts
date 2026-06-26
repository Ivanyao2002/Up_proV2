"use client";

import { useQuery } from "@tanstack/react-query";
import { useScope } from "@/core/auth/useScope";
import { partnerTrackingService } from "./tracking.service";

export const partnerTrackingKeys = {
  all: ["partner", "tracking"] as const,
};

/**
 * Suivi de flotte partenaire en quasi temps réel.
 * Sockets non exposés côté backend (DB-05) → rafraîchissement par polling HTTP.
 */
export function usePartnerTracking() {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerTrackingKeys.all,
    queryFn: () => partnerTrackingService.get(ownerId!),
    enabled: ownerId != null,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
}
