import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export interface PartnerSupportMessage {
  id: string;
  author: string;
  role: "reporter" | "agent" | "system";
  body: string;
  at: string;
}

export interface PartnerSupportChat {
  id: string;
  subject?: string;
  last_message_preview: string;
  unread_count: number;
  status: "open" | "closed";
  updated_at: string;
}

export interface PartnerSupportChatDetail extends PartnerSupportChat {
  messages: PartnerSupportMessage[];
}

interface SupportChatApiResponse {
  status: string;
  items?: PartnerSupportChat[];
  chats?: PartnerSupportChat[];
  data?: PartnerSupportChat[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

function mapSupportListResponse(response: SupportChatApiResponse): Paginated<PartnerSupportChat> {
  const items = response.items ?? response.chats ?? response.data ?? [];
  const pagination = response.pagination;
  return {
    data: items,
    meta: pagination
      ? {
          current_page: pagination.page,
          per_page: pagination.limit,
          total: pagination.total,
          last_page: pagination.hasMore ? pagination.page + 1 : pagination.page,
        }
      : {
          current_page: 1,
          per_page: 20,
          total: 0,
          last_page: 1,
        },
  };
}

export const partnerSupportService = {
  listChats: async (partnerId: string | number, params?: ListParams) => {
    const response = await apiClient.get<SupportChatApiResponse>(
      `${LINKS.partner.support.chat.list(partnerId)}${buildListQuery(params)}`
    );
    return mapSupportListResponse(response);
  },

  getChat: (partnerId: string | number, chatId: string) =>
    apiClient.get<PartnerSupportChatDetail>(
      LINKS.partner.support.chat.getById(partnerId, chatId)
    ),

  replyChat: (partnerId: string | number, chatId: string, body: string) =>
    apiClient.post<PartnerSupportMessage>(
      LINKS.partner.support.chat.reply(partnerId, chatId),
      { body }
    ),
};
