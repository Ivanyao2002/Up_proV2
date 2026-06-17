"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ListParams } from "@/shared/types/listParams";
import { adminAccountantsKeys } from "./adminAccountants.keys";
import { adminAccountantsService } from "./adminAccountants.service";
import type { AccountantCreatePayload } from "./adminAccountants.types";

export function useAccountantsList(params?: ListParams) {
  return useQuery({
    queryKey: adminAccountantsKeys.list(params),
    queryFn: () => adminAccountantsService.list(params),
  });
}

export function useAccountantDetail(id: string) {
  return useQuery({
    queryKey: adminAccountantsKeys.detail(id),
    queryFn: () => adminAccountantsService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateAccountant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AccountantCreatePayload) => adminAccountantsService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminAccountantsKeys.all });
    },
  });
}

export function useSuspendAccountant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminAccountantsService.suspend(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminAccountantsKeys.all });
    },
  });
}

export function useActivateAccountant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminAccountantsService.activate(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminAccountantsKeys.all });
    },
  });
}
