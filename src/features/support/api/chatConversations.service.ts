import { apiClient } from "@/core/http/apiClient";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type { Paginated } from "@/shared/types";

export interface ChatConversation {
  id: string;
  participants: {
    id: string;
    name: string;
    role: string;
  }[];
  last_message_preview: string;
  last_message_at: string;
  unread_count: number;
  trip_ref?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  body: string;
  created_at: string;
}

export interface ChatConversationDetail extends ChatConversation {
  messages: ChatMessage[];
}

interface ConversationsApiResponse {
  status: string;
  items?: ChatConversation[];
  data?: ChatConversation[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

function mapConversationsResponse(response: ConversationsApiResponse): Paginated<ChatConversation> {
  const items = response.items ?? response.data ?? [];
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

export const chatConversationsService = {
  list: async (params?: ListParams) => {
    const response = await apiClient.get<ConversationsApiResponse>(
      `/v1/chat/conversations${buildListQuery(params)}`
    );
    return mapConversationsResponse(response);
  },

  get: (id: string) =>
    apiClient.get<ChatConversationDetail>(`/v1/chat/conversations/${id}/messages`),

  send: (id: string, body: string) =>
    apiClient.post<ChatMessage>(`/v1/chat/conversations/${id}/messages`, { body }),

  markRead: (id: string) =>
    apiClient.post<{ ok: boolean }>(`/v1/chat/conversations/${id}/read`, {}),
};
