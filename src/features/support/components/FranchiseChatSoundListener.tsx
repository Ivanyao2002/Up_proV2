"use client";

import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { env } from "@/core/config/env";
import { franchiseSupportService } from "@/features/franchise/api/support.service";
import { franchiseSupportKeys } from "@/features/franchise/api/support.queries";
import { useChatIncomingSound } from "../hooks/useChatIncomingSound";
import {
  useChatSocketStore,
  useSupportChatSocket,
} from "../hooks/useSupportChatSocket";
import { ADMIN_CHAT_SOCKET_FALLBACK_POLL_MS } from "../api/adminChat.queries";

const CHAT_LIST_PARAMS = { per_page: 50 } as const;
const CHAT_POLL_MS = 5_000;

export function FranchiseChatSoundListener() {
  const pathname = usePathname();
  const qc = useQueryClient();
  const socketConnected = useChatSocketStore((s) => s.connected);
  const activeChatId =
    pathname.match(/\/franchise\/support\/chat\/([^/]+)/)?.[1] ?? null;

  useSupportChatSocket({
    enabled: env.useRealAuth,
    onMessage: ({ conversationId }) => {
      void qc.invalidateQueries({ queryKey: franchiseSupportKeys.all });
      if (activeChatId && String(conversationId) === String(activeChatId)) {
        void qc.invalidateQueries({
          queryKey: franchiseSupportKeys.chat(activeChatId),
        });
      }
    },
  });

  useChatIncomingSound({
    listQueryKey: franchiseSupportKeys.chats(CHAT_LIST_PARAMS),
    listQueryFn: () => franchiseSupportService.listChats(CHAT_LIST_PARAMS),
    detailQueryKey: (id) => franchiseSupportKeys.chat(id),
    detailQueryFn: (id) => franchiseSupportService.getChat(id),
    activeChatId,
    isIncomingMessage: (role) => role === "reporter",
    pollIntervalMs: socketConnected
      ? ADMIN_CHAT_SOCKET_FALLBACK_POLL_MS
      : CHAT_POLL_MS,
  });

  return null;
}
