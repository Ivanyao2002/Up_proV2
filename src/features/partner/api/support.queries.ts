"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useScope } from "@/core/auth/useScope";
import { notificationService } from "@/core/http/notificationService";
import { partnerSupportService } from "./support.service";
import type { ListParams } from "@/shared/types/listParams";

export const partnerSupportKeys = {
  all: ["partner", "support"] as const,
  chats: (filters?: ListParams) =>
    [...partnerSupportKeys.all, "chats", filters] as const,
  chat: (id: string) => [...partnerSupportKeys.all, "chat", id] as const,
};

export function usePartnerSupportChats(params?: ListParams) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerSupportKeys.chats(params),
    queryFn: () => partnerSupportService.listChats(ownerId!, params),
    enabled: ownerId != null,
  });
}

export function usePartnerSupportChat(chatId: string) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerSupportKeys.chat(chatId),
    queryFn: () => partnerSupportService.getChat(ownerId!, chatId),
    enabled: Boolean(chatId) && ownerId != null,
    // Pas de socket côté backend (cf. DB-05) : polling court pour la réception quasi temps réel.
    refetchInterval: 12_000,
  });
}

export function useReplyPartnerChat(chatId: string) {
  const qc = useQueryClient();
  const { ownerId } = useScope();
  return useMutation({
    mutationFn: (body: string) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerSupportService.replyChat(ownerId, chatId, body);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerSupportKeys.chat(chatId) });
      void qc.invalidateQueries({ queryKey: partnerSupportKeys.all });
      notificationService.success("Message envoyé");
    },
    onError: () => notificationService.error("Envoi impossible"),
  });
}
