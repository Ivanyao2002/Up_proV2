"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { agentTicketService } from "./agentTicket.service";
import type { ApplySanctionPayload, ApplyCompensationPayload } from "./agentTicket.types";

export const agentTicketKeys = {
  all: ["support", "agent-tickets"] as const,
  detail: (id: string) => [...agentTicketKeys.all, id] as const,
  tripSummary: (tripId: string) => ["support", "trip-summary", tripId] as const,
};

function refreshTicketWorkflow(qc: QueryClient, id: string) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: agentTicketKeys.detail(id) }),
    qc.invalidateQueries({ queryKey: ["support", "tickets"] }),
    qc.invalidateQueries({ queryKey: ["support", "audit-log"] }),
    qc.invalidateQueries({ queryKey: ["support", "dashboard"] }),
  ]);
}

export function useAgentTicketDetail(id: string) {
  return useQuery({
    queryKey: agentTicketKeys.detail(id),
    queryFn: () => agentTicketService.getById(id),
    enabled: !!id,
  });
}

export function useAssignTicket(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => agentTicketService.assign(id),
    onSettled: () => refreshTicketWorkflow(qc, id),
  });
}

export function useSendMessage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => agentTicketService.sendMessage(id, content),
    onSuccess: () => refreshTicketWorkflow(qc, id),
  });
}

export function useAddNote(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => agentTicketService.addNote(id, content),
    onSuccess: () => refreshTicketWorkflow(qc, id),
  });
}

export function useRequestJustification(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => agentTicketService.requestJustification(id, content),
    onSuccess: () => refreshTicketWorkflow(qc, id),
  });
}

export function useApplySanction(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApplySanctionPayload) => agentTicketService.applySanction(id, payload),
    onSuccess: () => refreshTicketWorkflow(qc, id),
  });
}

export function useApplyCompensation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApplyCompensationPayload) =>
      agentTicketService.applyCompensation(id, payload),
    onSuccess: () => refreshTicketWorkflow(qc, id),
  });
}

export function useResolveTicket(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note?: string) => agentTicketService.resolve(id, note),
    onSuccess: () => refreshTicketWorkflow(qc, id),
  });
}

export function useCloseTicket(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note?: string) => agentTicketService.close(id, note),
    onSuccess: () => refreshTicketWorkflow(qc, id),
  });
}

export function useEscalateTicket(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note?: string) => agentTicketService.escalate(id, note),
    onSuccess: () => refreshTicketWorkflow(qc, id),
  });
}

export function useSupportTripSummary(tripId: string | null | undefined) {
  return useQuery({
    queryKey: agentTicketKeys.tripSummary(tripId ?? ""),
    queryFn: () => agentTicketService.getTripSummary(tripId!),
    enabled: !!tripId,
  });
}
