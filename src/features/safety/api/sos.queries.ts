"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sosKeys } from "./sos.keys";
import { sosService } from "./sos.service";
import type {
  AcknowledgeSosPayload,
  ResolveSosPayload,
  SosIncidentDetail,
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

const LIVE_REFETCH_ACTIVE_MS = 12_000;

export function useSosIncidentDetail(id: string) {
  return useQuery({
    queryKey: sosKeys.detail(id),
    queryFn: () => sosService.getIncidentById(id),
    enabled: Boolean(id),
    // Incident actif/escaladé = vie/mort → on rafraîchit plus vite (#11 audit UX).
    refetchInterval: (query) => {
      const status = query.state.data?.incident?.status;
      return status === "active" || status === "escalated"
        ? LIVE_REFETCH_ACTIVE_MS
        : LIVE_REFETCH_MS;
    },
  });
}

function invalidateSos(qc: ReturnType<typeof useQueryClient>, id?: string) {
  void qc.invalidateQueries({ queryKey: sosKeys.all });
  if (id) {
    void qc.invalidateQueries({ queryKey: sosKeys.detail(id) });
  }
}

interface SosDetailMutationContext {
  previous?: SosIncidentDetail;
}

/**
 * Optimistic update du détail SOS (#40 audit UX) : on reflète immédiatement le
 * nouveau statut dans le cache, on rollback en cas d'erreur, puis on invalide
 * pour resynchroniser avec le backend.
 */
async function applyOptimisticStatus(
  qc: ReturnType<typeof useQueryClient>,
  id: string,
  status: SosIncidentDetail["incident"]["status"]
): Promise<SosDetailMutationContext> {
  await qc.cancelQueries({ queryKey: sosKeys.detail(id) });
  const previous = qc.getQueryData<SosIncidentDetail>(sosKeys.detail(id));
  if (previous) {
    qc.setQueryData<SosIncidentDetail>(sosKeys.detail(id), {
      ...previous,
      incident: { ...previous.incident, status },
    });
  }
  return { previous };
}

export function useAcknowledgeSos(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload?: AcknowledgeSosPayload) =>
      sosService.acknowledge(id, payload),
    onMutate: () => applyOptimisticStatus(qc, id, "acknowledged"),
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        qc.setQueryData(sosKeys.detail(id), context.previous);
      }
    },
    onSettled: () => invalidateSos(qc, id),
  });
}

export function useResolveSos(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ResolveSosPayload) => sosService.resolve(id, payload),
    onMutate: () => applyOptimisticStatus(qc, id, "resolved"),
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        qc.setQueryData(sosKeys.detail(id), context.previous);
      }
    },
    onSettled: () => invalidateSos(qc, id),
  });
}
