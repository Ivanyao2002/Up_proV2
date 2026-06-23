import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ListParams } from "@/shared/types/listParams";
import { chatConversationsService } from "./chatConversations.service";

export const chatConversationsKeys = {
  all: ["chat-conversations"] as const,
  list: (params?: ListParams) => [...chatConversationsKeys.all, "list", params] as const,
  detail: (id: string) => [...chatConversationsKeys.all, "detail", id] as const,
};

export function useChatConversationsList(params?: ListParams) {
  return useQuery({
    queryKey: chatConversationsKeys.list(params),
    queryFn: () => chatConversationsService.list(params),
  });
}

export function useChatConversation(id: string) {
  return useQuery({
    queryKey: chatConversationsKeys.detail(id),
    queryFn: () => chatConversationsService.get(id),
    enabled: !!id,
    // Pas de socket côté backend (cf. DB-05) : polling court pour la réception quasi temps réel.
    refetchInterval: 12_000,
  });
}

export function useSendChatMessage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => chatConversationsService.send(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatConversationsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: chatConversationsKeys.all });
    },
  });
}

export function useMarkChatRead(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chatConversationsService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatConversationsKeys.all });
    },
  });
}
