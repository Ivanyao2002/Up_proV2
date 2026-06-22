import type { ApiChatMessageItem } from "./adminChat.api.types";

/** Event Socket.IO documenté Swagger — room `user:{userId}`. */
export const CHAT_SOCKET_EVENT = "chat:message" as const;

export type ChatSocketStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface ChatSocketMessagePayload {
  conversationId: string;
  message?: ApiChatMessageItem;
}

export function parseChatSocketPayload(raw: unknown): ChatSocketMessagePayload | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const conversationId = String(
    record.conversationId ?? record.conversation_id ?? ""
  ).trim();
  if (!conversationId) return null;

  const message = record.message;
  return {
    conversationId,
    message:
      message && typeof message === "object"
        ? (message as ApiChatMessageItem)
        : undefined,
  };
}
