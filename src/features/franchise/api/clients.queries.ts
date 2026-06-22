"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import type { ListParams } from "@/shared/types/listParams";
import { franchiseClientsService } from "./clients.service";

export const franchiseClientsKeys = {
  all: ["franchise", "clients"] as const,
  list: (filters?: ListParams) =>
    [...franchiseClientsKeys.all, "list", filters] as const,
  detail: (id: string) => [...franchiseClientsKeys.all, "detail", id] as const,
};

export function useFranchiseClientsList(params?: ListParams) {
  return useQuery({
    queryKey: franchiseClientsKeys.list(params),
    queryFn: () => franchiseClientsService.list(params),
  });
}

export function useFranchiseClientDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: franchiseClientsKeys.detail(id),
    queryFn: () => franchiseClientsService.get(id),
    enabled: enabled && Boolean(id),
  });
}

export function useFranchiseSuspendClient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => franchiseClientsService.suspend(id),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: franchiseClientsKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: franchiseClientsKeys.all });
      notificationService.success(data.message);
    },
  });
}

export function useFranchiseActivateClient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => franchiseClientsService.activate(id),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: franchiseClientsKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: franchiseClientsKeys.all });
      notificationService.success(data.message);
    },
  });
}
