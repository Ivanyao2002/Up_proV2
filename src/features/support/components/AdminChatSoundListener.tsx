"use client";

import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { env } from "@/core/config/env";
import { adminChatService } from "../api/adminChat.service";
import { adminChatKeys } from "../api/adminChat.keys";
import { ADMIN_CHAT_POLL_MS, ADMIN_CHAT_SOCKET_FALLBACK_POLL_MS } from "../api/adminChat.queries";
import { useChatIncomingSound } from "../hooks/useChatIncomingSound";
import { useChatSocketStore, useSupportChatSocket } from "../hooks/useSupportChatSocket";

const CHAT_LIST_PARAMS = { per_page: 50, type: "franchise" } as const;

export function AdminChatSoundListener() {
  const pathname = usePathname();
  const qc = useQueryClient();
  const socketConnected = useChatSocketStore((s) => s.connected);
  const activeChatId =
    pathname.match(/\/admin\/support\/chat\/([^/]+)/)?.[1] ?? null;

  useSupportChatSocket({
    enabled: env.useRealAuth,
    onMessage: ({ conversationId }) => {
      void qc.invalidateQueries({ queryKey: adminChatKeys.all });
      if (activeChatId && String(conversationId) === String(activeChatId)) {
        void qc.invalidateQueries({
          queryKey: adminChatKeys.detail(activeChatId),
        });
      }
    },
  });

  useChatIncomingSound({
    listQueryKey: adminChatKeys.list(CHAT_LIST_PARAMS),
    listQueryFn: () => adminChatService.listChats(CHAT_LIST_PARAMS),
    detailQueryKey: (id) => adminChatKeys.detail(id),
    detailQueryFn: (id) => adminChatService.getChat(id),
    activeChatId,
    isIncomingMessage: (role) => role === "reporter",
    pollIntervalMs: socketConnected
      ? ADMIN_CHAT_SOCKET_FALLBACK_POLL_MS
      : ADMIN_CHAT_POLL_MS,
  });

  return null;
}
