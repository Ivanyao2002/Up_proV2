"use client";

import { usePathname } from "next/navigation";
import { franchiseSupportService } from "@/features/franchise/api/support.service";
import { franchiseSupportKeys } from "@/features/franchise/api/support.queries";
import { useChatIncomingSound } from "../hooks/useChatIncomingSound";

const CHAT_LIST_PARAMS = { per_page: 50 } as const;

export function FranchiseChatSoundListener() {
  const pathname = usePathname();
  const activeChatId =
    pathname.match(/\/franchise\/support\/chat\/([^/]+)/)?.[1] ?? null;

  useChatIncomingSound({
    listQueryKey: franchiseSupportKeys.chats(CHAT_LIST_PARAMS),
    listQueryFn: () => franchiseSupportService.listChats(CHAT_LIST_PARAMS),
    detailQueryKey: (id) => franchiseSupportKeys.chat(id),
    detailQueryFn: (id) => franchiseSupportService.getChat(id),
    activeChatId,
    isIncomingMessage: (role) => role === "reporter",
  });

  return null;
}
