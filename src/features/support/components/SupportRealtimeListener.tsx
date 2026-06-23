"use client";

import { useQueryClient } from "@tanstack/react-query";
import { adminChatKeys } from "../api/adminChat.keys";
import { agentTicketKeys } from "../api/agentTicket.queries";
import { useSupportChatSocket } from "../hooks/useSupportChatSocket";
import { disputeKeys } from "@/features/disputes/api/dispute.keys";
import type {
  DisputeDetail,
  DisputeMessage,
} from "@/features/disputes/api/dispute.types";

export function SupportRealtimeListener() {
  const queryClient = useQueryClient();

  useSupportChatSocket({
    onMessage: ({ conversationId }) => {
      void queryClient.invalidateQueries({ queryKey: adminChatKeys.all });
      void queryClient.invalidateQueries({
        queryKey: adminChatKeys.detail(conversationId),
      });
      void queryClient.invalidateQueries({
        queryKey: agentTicketKeys.detail(conversationId),
      });
    },
    onTicketUpdated: ({ ticketId }) => {
      void queryClient.invalidateQueries({ queryKey: ["support", "tickets"] });
      void queryClient.invalidateQueries({
        queryKey: agentTicketKeys.detail(ticketId),
      });
      void queryClient.invalidateQueries({ queryKey: ["support", "audit-log"] });
      void queryClient.invalidateQueries({ queryKey: ["support", "dashboard"] });
    },
    onDisputeMessage: ({ disputeId, message }) => {
      // `GET /v1/disputes/:id` ne renvoie pas `messages` (cf. BACKEND_DISPUTES_FIXES.md),
      // donc on insère le message du socket directement dans le cache — surtout pas
      // d'invalidation du détail, qui rejouerait le GET et viderait le fil.
      const incoming = message as DisputeMessage | undefined;
      if (incoming?.id) {
        queryClient.setQueryData<DisputeDetail>(
          disputeKeys.detail(disputeId),
          (prev) =>
            prev && !prev.messages.some((m) => m.id === incoming.id)
              ? { ...prev, messages: [...prev.messages, incoming] }
              : prev
        );
      }
      void queryClient.invalidateQueries({ queryKey: ["disputes", "list"] });
    },
    onDisputeUpdated: ({ disputeId, status, assignedToId, assignedToName, updatedAt }) => {
      // Même raison : on patche le statut/l'assignation en place plutôt que
      // d'invalider le détail (qui perdrait les messages tant que Bug 1 backend persiste).
      queryClient.setQueryData<DisputeDetail>(
        disputeKeys.detail(disputeId),
        (prev) =>
          prev
            ? {
                ...prev,
                status: (status as DisputeDetail["status"]) ?? prev.status,
                assigned_to: assignedToName ?? prev.assigned_to,
                assigned_to_id: assignedToId ?? prev.assigned_to_id,
                updated_at: updatedAt ?? prev.updated_at,
              }
            : prev
      );
      void queryClient.invalidateQueries({ queryKey: ["disputes", "list"] });
    },
  });

  return null;
}
