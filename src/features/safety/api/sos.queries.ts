"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sosKeys } from "./sos.keys";
import { sosService } from "./sos.service";
import type {
  AcknowledgeSosPayload,
  ResolveSosPayload,
  SosListParams,
} from "./sos.types";

const LIVE_REFETCH_MS = 30_000;

export function useSosDashboard() {
  return useQuery({
    queryKey: sosKeys.dashboard(),
    queryFn: () => sosService.getDashboard(),
    refetchInterval: LIVE_REFETCH_MS,
  });
}

export function useSosIncidentsList(params?: SosListParams) {
  return useQuery({
    queryKey: sosKeys.list(params),
    queryFn: () => sosService.listIncidents(params),
  });
}

export function useSosIncidentDetail(id: string) {
  return useQuery({
    queryKey: sosKeys.detail(id),
    queryFn: () => sosService.getIncidentById(id),
    enabled: Boolean(id),
    refetchInterval: LIVE_REFETCH_MS,
  });
}

function invalidateSos(qc: ReturnType<typeof useQueryClient>, id?: string) {
  void qc.invalidateQueries({ queryKey: sosKeys.all });
  if (id) {
    void qc.invalidateQueries({ queryKey: sosKeys.detail(id) });
  }
}

export function useAcknowledgeSos(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload?: AcknowledgeSosPayload) =>
      sosService.acknowledge(id, payload),
    onSuccess: () => invalidateSos(qc, id),
  });
}

export function useResolveSos(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ResolveSosPayload) => sosService.resolve(id, payload),
    onSuccess: () => invalidateSos(qc, id),
  });
}
