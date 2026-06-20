"use client";

import { useQueryClient } from "@tanstack/react-query";
import { adminChatKeys } from "../api/adminChat.keys";
import { agentTicketKeys } from "../api/agentTicket.queries";
import { useSupportChatSocket } from "../hooks/useSupportChatSocket";

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
  });

  return null;
}
