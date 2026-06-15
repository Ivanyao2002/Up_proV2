"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { franchiseSosService } from "./franchiseSos.service";
import type {
  AcknowledgeSosPayload,
  ResolveSosPayload,
  SosListParams,
} from "@/features/safety/api/sos.types";

const LIVE_REFETCH_MS = 30_000;

export const franchiseSosKeys = {
  all: ["franchise", "sos"] as const,
  dashboard: () => [...franchiseSosKeys.all, "dashboard"] as const,
  list: (params?: SosListParams) =>
    [...franchiseSosKeys.all, "list", params] as const,
  detail: (id: string) => [...franchiseSosKeys.all, "detail", id] as const,
};

export function useFranchiseSosDashboard() {
  return useQuery({
    queryKey: franchiseSosKeys.dashboard(),
    queryFn: () => franchiseSosService.getDashboard(),
    refetchInterval: LIVE_REFETCH_MS,
  });
}

export function useFranchiseSosIncidentsList(params?: SosListParams) {
  return useQuery({
    queryKey: franchiseSosKeys.list(params),
    queryFn: () => franchiseSosService.listIncidents(params),
  });
}

export function useFranchiseSosIncidentDetail(id: string) {
  return useQuery({
    queryKey: franchiseSosKeys.detail(id),
    queryFn: () => franchiseSosService.getIncidentById(id),
    enabled: Boolean(id),
    refetchInterval: LIVE_REFETCH_MS,
  });
}

function invalidateFranchiseSos(qc: ReturnType<typeof useQueryClient>, id?: string) {
  void qc.invalidateQueries({ queryKey: franchiseSosKeys.all });
  if (id) {
    void qc.invalidateQueries({ queryKey: franchiseSosKeys.detail(id) });
  }
}

export function useFranchiseAcknowledgeSos(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload?: AcknowledgeSosPayload) =>
      franchiseSosService.acknowledge(id, payload),
    onSuccess: () => invalidateFranchiseSos(qc, id),
  });
}

export function useFranchiseResolveSos(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ResolveSosPayload) =>
      franchiseSosService.resolve(id, payload),
    onSuccess: () => invalidateFranchiseSos(qc, id),
  });
}
