"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminChatKeys } from "./adminChat.keys";
import { adminChatService } from "./adminChat.service";
import type { ListParams } from "@/shared/types/listParams";
import { useChatSocketStore } from "../hooks/useSupportChatSocket";

/** Polling actif si le socket chat est indisponible. */
export const ADMIN_CHAT_POLL_MS = 5_000;

/** Filet de sécurité quand le socket `chat:message` est connecté. */
export const ADMIN_CHAT_SOCKET_FALLBACK_POLL_MS = 60_000;

function useAdminChatRefetchInterval(): number | false {
  const socketConnected = useChatSocketStore((s) => s.connected);
  return socketConnected ? ADMIN_CHAT_SOCKET_FALLBACK_POLL_MS : ADMIN_CHAT_POLL_MS;
}

export function useAdminSupportChats(params?: ListParams) {
  const refetchInterval = useAdminChatRefetchInterval();
  return useQuery({
    queryKey: adminChatKeys.list(params),
    queryFn: () => adminChatService.listChats(params),
    refetchInterval,
    refetchIntervalInBackground: true,
  });
}

export function useAdminSupportChat(chatId: string) {
  const refetchInterval = useAdminChatRefetchInterval();
  return useQuery({
    queryKey: adminChatKeys.detail(chatId),
    queryFn: () => adminChatService.getChat(chatId),
    refetchInterval,
    refetchIntervalInBackground: true,
  });
}

export function useReplyAdminChat(chatId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => adminChatService.replyChat(chatId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminChatKeys.detail(chatId) });
      void qc.invalidateQueries({ queryKey: adminChatKeys.all });
    },
  });
}
