import type { ApiChatMessageItem } from "./adminChat.api.types";

/** Event Socket.IO documenté Swagger — room `user:{userId}`. */
export const CHAT_SOCKET_EVENT = "chat:message" as const;
export const TICKET_SOCKET_EVENT = "ticket:updated" as const;

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

export interface TicketSocketUpdatedPayload {
  ticketId: string;
  status?: string;
  assignedToId?: string | null;
  assignedToName?: string | null;
  updatedAt?: string;
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

export function parseTicketSocketPayload(
  raw: unknown
): TicketSocketUpdatedPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const ticketId = String(record.ticketId ?? record.ticket_id ?? "").trim();
  if (!ticketId) return null;

  const assignedToId = record.assignedToId ?? record.assigned_to_id;
  const assignedToName = record.assignedToName ?? record.assigned_to_name;

  return {
    ticketId,
    status: typeof record.status === "string" ? record.status : undefined,
    assignedToId:
      assignedToId == null ? null : String(assignedToId),
    assignedToName:
      assignedToName == null ? null : String(assignedToName),
    updatedAt:
      typeof (record.updatedAt ?? record.updated_at) === "string"
        ? String(record.updatedAt ?? record.updated_at)
        : undefined,
  };
}
