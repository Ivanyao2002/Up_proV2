"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useScope } from "@/core/auth/useScope";
import { partnerSosService } from "./partnerSos.service";
import type {
  AcknowledgeSosPayload,
  ResolveSosPayload,
  SosListParams,
} from "@/features/safety/api/sos.types";

const LIVE_REFETCH_MS = 30_000;

export const partnerSosKeys = {
  all: ["partner", "sos"] as const,
  dashboard: () => [...partnerSosKeys.all, "dashboard"] as const,
  list: (params?: SosListParams) =>
    [...partnerSosKeys.all, "list", params] as const,
  detail: (id: string) => [...partnerSosKeys.all, "detail", id] as const,
};

export function usePartnerSosDashboard() {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerSosKeys.dashboard(),
    queryFn: () => partnerSosService.getDashboard(ownerId!),
    enabled: ownerId != null,
    refetchInterval: LIVE_REFETCH_MS,
  });
}

export function usePartnerSosIncidentsList(params?: SosListParams) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerSosKeys.list(params),
    queryFn: () => partnerSosService.listIncidents(ownerId!, params),
    enabled: ownerId != null,
  });
}

export function usePartnerSosIncidentDetail(id: string) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerSosKeys.detail(id),
    queryFn: () => partnerSosService.getIncidentById(ownerId!, id),
    enabled: ownerId != null && Boolean(id),
    refetchInterval: LIVE_REFETCH_MS,
  });
}

function invalidatePartnerSos(qc: ReturnType<typeof useQueryClient>, id?: string) {
  void qc.invalidateQueries({ queryKey: partnerSosKeys.all });
  if (id) {
    void qc.invalidateQueries({ queryKey: partnerSosKeys.detail(id) });
  }
}

export function usePartnerAcknowledgeSos(id: string) {
  const qc = useQueryClient();
  const { ownerId } = useScope();

  return useMutation({
    mutationFn: (payload?: AcknowledgeSosPayload) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerSosService.acknowledge(ownerId, id, payload);
    },
    onSuccess: () => invalidatePartnerSos(qc, id),
  });
}

export function usePartnerResolveSos(id: string) {
  const qc = useQueryClient();
  const { ownerId } = useScope();

  return useMutation({
    mutationFn: (payload: ResolveSosPayload) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerSosService.resolve(ownerId, id, payload);
    },
    onSuccess: () => invalidatePartnerSos(qc, id),
  });
}
