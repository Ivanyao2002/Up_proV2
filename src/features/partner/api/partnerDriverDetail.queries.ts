"use client";

import { useQuery } from "@tanstack/react-query";
import { useScope } from "@/core/auth/useScope";
import {
  partnerDriverDetailService,
  partnerLiveMapService,
} from "./partnerDriverDetail.service";

export const partnerDriverDetailKeys = {
  all: ["partner", "drivers"] as const,
  trips: (id: string) => [...partnerDriverDetailKeys.all, id, "trips"] as const,
  wallet: (id: string) =>
    [...partnerDriverDetailKeys.all, id, "wallet"] as const,
  live: (id: string) => [...partnerDriverDetailKeys.all, id, "live"] as const,
};

export const partnerLiveMapKeys = {
  all: ["partner", "ops", "map"] as const,
};

export function usePartnerDriverTrips(id: string) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerDriverDetailKeys.trips(id),
    queryFn: () => partnerDriverDetailService.getTrips(ownerId!, id),
    enabled: Boolean(id) && ownerId != null,
  });
}

export function usePartnerDriverWalletTransactions(id: string, enabled = true) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerDriverDetailKeys.wallet(id),
    queryFn: () => partnerDriverDetailService.getWalletTransactions(ownerId!, id),
    enabled: Boolean(id) && enabled && ownerId != null,
  });
}

export function usePartnerDriverLive(id: string, enabled = true) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerDriverDetailKeys.live(id),
    queryFn: () => partnerDriverDetailService.getLivePosition(ownerId!, id),
    enabled: Boolean(id) && enabled && ownerId != null,
    refetchInterval: 30_000,
  });
}

export function usePartnerLiveMap(options?: { pollSnapshot?: boolean }) {
  const { ownerId } = useScope();
  const pollSnapshot = options?.pollSnapshot ?? true;
  return useQuery({
    queryKey: partnerLiveMapKeys.all,
    queryFn: () => partnerLiveMapService.get(ownerId!),
    enabled: ownerId != null,
    refetchInterval: pollSnapshot ? 30_000 : false,
  });
}
