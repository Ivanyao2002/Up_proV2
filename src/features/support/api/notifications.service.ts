import { apiClient } from "@/core/http/apiClient";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type { Paginated } from "@/shared/types";

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  read: boolean;
  type: string;
  data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface NotificationsApiResponse {
  status: string;
  items?: NotificationItem[];
  data?: NotificationItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

interface UnreadCountResponse {
  count: number;
  unread_count?: number;
}

function mapNotificationsResponse(response: NotificationsApiResponse): Paginated<NotificationItem> {
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

export const notificationsService = {
  list: async (params?: ListParams) => {
    const response = await apiClient.get<NotificationsApiResponse>(
      `/v1/notifications${buildListQuery(params)}`
    );
    return mapNotificationsResponse(response);
  },

  unreadCount: () => apiClient.get<UnreadCountResponse>("/v1/notifications/unread-count"),

  markRead: (id: string) => apiClient.patch<{ ok: boolean }>(`/v1/notifications/${id}/read`, {}),

  markAllRead: () => apiClient.patch<{ ok: boolean }>("/v1/notifications/read-all", {}),
};
