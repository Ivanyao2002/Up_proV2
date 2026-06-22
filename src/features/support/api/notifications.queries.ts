import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ListParams } from "@/shared/types/listParams";
import { notificationsService } from "./notifications.service";

export const notificationsKeys = {
  all: ["notifications"] as const,
  list: (params?: ListParams) => [...notificationsKeys.all, "list", params] as const,
  unread: () => [...notificationsKeys.all, "unread"] as const,
};

export function useNotificationsList(params?: ListParams) {
  return useQuery({
    queryKey: notificationsKeys.list(params),
    queryFn: () => notificationsService.list(params),
  });
}

export function useNotificationsUnreadCount() {
  return useQuery({
    queryKey: notificationsKeys.unread(),
    queryFn: () => notificationsService.unreadCount(),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
    },
  });
}
