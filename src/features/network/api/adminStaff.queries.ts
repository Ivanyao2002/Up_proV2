"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ListParams } from "@/shared/types/listParams";
import type { AdminStaffKind } from "./adminStaff.config";
import { adminStaffKeys } from "./adminStaff.keys";
import { adminStaffService } from "./adminStaff.service";
import type { StaffCreatePayload } from "./adminStaff.types";

export function useStaffList(kind: AdminStaffKind, params?: ListParams) {
  return useQuery({
    queryKey: adminStaffKeys.list(kind, params),
    queryFn: () => adminStaffService.list(kind, params),
  });
}

export function useStaffDetail(kind: AdminStaffKind, id: string) {
  return useQuery({
    queryKey: adminStaffKeys.detail(kind, id),
    queryFn: () => adminStaffService.getById(kind, id),
    enabled: Boolean(id),
  });
}

export function useCreateStaff(kind: AdminStaffKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: StaffCreatePayload) => adminStaffService.create(kind, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminStaffKeys.all(kind) });
    },
  });
}

export function useSuspendStaff(kind: AdminStaffKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminStaffService.suspend(kind, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminStaffKeys.all(kind) });
    },
  });
}

export function useActivateStaff(kind: AdminStaffKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminStaffService.activate(kind, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminStaffKeys.all(kind) });
    },
  });
}
