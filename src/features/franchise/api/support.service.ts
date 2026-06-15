import { apiClient } from "@/core/http/apiClient";
import { LINKS, appendQuery } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

function mapV1TicketsPage(raw: Record<string, any>, params?: ListParams): Paginated<FranchiseSupportTicket> {
  const items: any[] = raw.items ?? raw.tickets ?? [];
  const pg = raw.pagination ?? {};
  return {
    data: items.map((t) => ({
      id: t.id,
      subject: t.subject ?? t.title ?? "—",
      category: t.category ?? "general",
      priority: t.priority ?? "normal",
      status: t.status ?? "open",
      reporter_type: t.reporter_type ?? t.reporterType ?? "client",
      reporter_name: t.reporter_name ?? t.reporterName ?? t.user_name ?? "—",
      created_at: t.created_at ?? t.createdAt ?? new Date().toISOString(),
      updated_at: t.updated_at ?? t.updatedAt ?? new Date().toISOString(),
    })),
    meta: {
      total: pg.total ?? items.length,
      per_page: pg.limit ?? params?.per_page ?? 20,
      current_page: pg.page ?? params?.page ?? 1,
      last_page: Math.max(1, Math.ceil((pg.total ?? items.length) / (pg.limit ?? 20))),
    },
  };
}

function mapV1ChatsPage(raw: Record<string, any>, params?: ListParams): Paginated<FranchiseSupportChat> {
  const items: any[] = raw.items ?? raw.chats ?? raw.data ?? [];
  const pg = raw.pagination ?? {};
  return {
    data: items.map((c) => ({
      id: c.id,
      participant_name: c.participant_name ?? c.participantName ?? c.user_name ?? "—",
      participant_type: c.participant_type ?? c.participantType ?? "client",
      subject: c.subject ?? undefined,
      last_message_preview: c.last_message_preview ?? c.lastMessage ?? "",
      unread_count: c.unread_count ?? c.unreadCount ?? 0,
      status: c.status ?? "open",
      updated_at: c.updated_at ?? c.updatedAt ?? new Date().toISOString(),
    })),
    meta: {
      total: pg.total ?? items.length,
      per_page: pg.limit ?? params?.per_page ?? 20,
      current_page: pg.page ?? params?.page ?? 1,
      last_page: Math.max(1, Math.ceil((pg.total ?? items.length) / (pg.limit ?? 20))),
    },
  };
}

export type SupportReporterType = "partner" | "driver" | "client";

export interface FranchiseSupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: "low" | "normal" | "high";
  status: "open" | "in_progress" | "resolved";
  reporter_type: SupportReporterType;
  reporter_name: string;
  created_at: string;
  updated_at: string;
}

export interface FranchiseSupportMessage {
  id: string;
  author: string;
  role: "reporter" | "agent" | "system";
  body: string;
  at: string;
}

export interface FranchiseSupportTicketDetail extends FranchiseSupportTicket {
  messages: FranchiseSupportMessage[];
}

export interface FranchiseSupportChat {
  id: string;
  participant_name: string;
  participant_type: SupportReporterType;
  subject?: string;
  last_message_preview: string;
  unread_count: number;
  status: "open" | "closed";
  updated_at: string;
}

export interface FranchiseSupportChatDetail extends FranchiseSupportChat {
  messages: FranchiseSupportMessage[];
}


export const franchiseSupportService = {
  listTickets: async (params?: ListParams): Promise<Paginated<FranchiseSupportTicket>> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<Paginated<FranchiseSupportTicket>>(
        `/franchise/support/tickets${buildListQuery(params)}`
      );
    }
    const raw = await apiClient.get<Record<string, any>>(
      appendQuery(LINKS.franchise.v1.supportTickets, buildV1ListQuery(params))
    );
    return mapV1TicketsPage(raw, params);
  },

  getTicket: (id: string): Promise<FranchiseSupportTicketDetail> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<FranchiseSupportTicketDetail>(`/franchise/support/tickets/${id}`);
    }
    return apiClient.get<FranchiseSupportTicketDetail>(LINKS.franchise.v1.supportTicketById(id));
  },

  replyTicket: (id: string, body: string) =>
    useLegacyPortalApi()
      ? apiClient.post<FranchiseSupportMessage>(`/franchise/support/tickets/${id}/messages`, { body })
      : apiClient.post<FranchiseSupportMessage>(LINKS.franchise.v1.supportTicketReply(id), { body }),

  listChats: async (params?: ListParams): Promise<Paginated<FranchiseSupportChat>> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<Paginated<FranchiseSupportChat>>(
        `${LINKS.franchise.support.chat.list}${buildListQuery(params)}`
      );
    }
    const raw = await apiClient.get<Record<string, any>>(
      appendQuery(LINKS.franchise.v1.supportChats, buildV1ListQuery(params))
    );
    return mapV1ChatsPage(raw, params);
  },

  getChat: (id: string): Promise<FranchiseSupportChatDetail> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<FranchiseSupportChatDetail>(LINKS.franchise.support.chat.getById(id));
    }
    return apiClient.get<FranchiseSupportChatDetail>(LINKS.franchise.v1.supportChatById(id));
  },

  replyChat: (id: string, body: string) =>
    useLegacyPortalApi()
      ? apiClient.post<FranchiseSupportMessage>(LINKS.franchise.support.chat.reply(id), { body })
      : apiClient.post<FranchiseSupportMessage>(LINKS.franchise.v1.supportChatReply(id), { body }),
};
