"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import { clientsService } from "./clients.service";
import type { ListParams } from "@/shared/types/listParams";

export const clientsKeys = {
  all: ["fleet", "clients"] as const,
  list: (filters?: ListParams) => [...clientsKeys.all, "list", filters] as const,
  detail: (id: string) => [...clientsKeys.all, "detail", id] as const,
};

export function useClientsList(params?: ListParams) {
  return useQuery({
    queryKey: clientsKeys.list(params),
    queryFn: () => clientsService.list(params),
  });
}

export function useClientDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: clientsKeys.detail(id),
    queryFn: () => clientsService.get(id),
    enabled: enabled && Boolean(id),
  });
}

export function useSuspendClient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => clientsService.suspend(id),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: clientsKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: clientsKeys.all });
      notificationService.success(data.message);
    },
  });
}

export function useActivateClient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => clientsService.activate(id),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: clientsKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: clientsKeys.all });
      notificationService.success(data.message);
    },
  });
}