"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { agentTicketService } from "./agentTicket.service";
import { notificationService } from "@/core/http/notificationService";
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
    onSuccess: () => {
      refreshTicketWorkflow(qc, id);
      notificationService.success("Réclamation prise en charge.");
    },
    onError: () => notificationService.error("Impossible de prendre en charge cette réclamation."),
  });
}

export function useSendMessage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => agentTicketService.sendMessage(id, content),
    onSuccess: () => refreshTicketWorkflow(qc, id),
    onError: () => notificationService.error("Échec de l'envoi du message."),
  });
}

export function useAddNote(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => agentTicketService.addNote(id, content),
    onSuccess: () => {
      refreshTicketWorkflow(qc, id);
      notificationService.success("Note interne ajoutée.");
    },
    onError: () => notificationService.error("Impossible d'ajouter la note."),
  });
}

export function useRequestJustification(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => agentTicketService.requestJustification(id, content),
    onSuccess: () => {
      refreshTicketWorkflow(qc, id);
      notificationService.success("Demande de justificatif envoyée.");
    },
    onError: () => notificationService.error("Impossible d'envoyer la demande de justificatif."),
  });
}

export function useApplySanction(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApplySanctionPayload) => agentTicketService.applySanction(id, payload),
    onSuccess: () => {
      refreshTicketWorkflow(qc, id);
      notificationService.success("Sanction appliquée.");
    },
    onError: (err: unknown) => {
      const msg = (err as { message?: string })?.message ?? "Impossible d'appliquer la sanction.";
      notificationService.error(msg);
    },
  });
}

export function useApplyCompensation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApplyCompensationPayload) =>
      agentTicketService.applyCompensation(id, payload),
    onSuccess: () => {
      refreshTicketWorkflow(qc, id);
      notificationService.success("Geste commercial appliqué.");
    },
    onError: (err: unknown) => {
      const msg = (err as { message?: string })?.message ?? "Impossible d'appliquer le geste commercial.";
      notificationService.error(msg);
    },
  });
}

export function useCancelCompensation(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (compId: string) => agentTicketService.cancelCompensation(ticketId, compId),
    onSuccess: () => {
      refreshTicketWorkflow(qc, ticketId);
      notificationService.success("Geste commercial annulé.");
    },
    onError: (err: unknown) => {
      const msg = (err as { message?: string })?.message ?? "Impossible d'annuler le geste commercial.";
      notificationService.error(msg);
    },
  });
}

export function useResolveTicket(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note?: string) => agentTicketService.resolve(id, note),
    onSuccess: () => {
      refreshTicketWorkflow(qc, id);
      notificationService.success("Réclamation marquée comme résolue.");
    },
    onError: (err: unknown) => {
      const msg = (err as { message?: string })?.message ?? "Impossible de résoudre la réclamation.";
      notificationService.error(msg);
    },
  });
}

export function useCloseTicket(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note?: string) => agentTicketService.close(id, note),
    onSuccess: () => {
      refreshTicketWorkflow(qc, id);
      notificationService.success("Réclamation clôturée.");
    },
    onError: (err: unknown) => {
      const msg = (err as { message?: string })?.message ?? "Impossible de clôturer la réclamation.";
      notificationService.error(msg);
    },
  });
}

export function useEscalateTicket(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note?: string) => agentTicketService.escalate(id, note),
    onSuccess: () => {
      refreshTicketWorkflow(qc, id);
      notificationService.success("Réclamation escaladée vers l'administration.");
    },
    onError: (err: unknown) => {
      const msg = (err as { message?: string })?.message ?? "Impossible d'escalader la réclamation.";
      notificationService.error(msg);
    },
  });
}

export function useSupportTripSummary(tripId: string | null | undefined) {
  return useQuery({
    queryKey: agentTicketKeys.tripSummary(tripId ?? ""),
    queryFn: () => agentTicketService.getTripSummary(tripId!),
    enabled: !!tripId,
  });
}
