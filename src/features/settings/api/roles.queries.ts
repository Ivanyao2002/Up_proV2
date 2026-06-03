"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rolesKeys } from "./roles.keys";
import {
  rolesService,
  type CreateRolePayload,
  type UpdateRolePayload,
} from "./roles.service";
import { notificationService } from "@/core/http/notificationService";

export function useRolesList() {
  return useQuery({
    queryKey: rolesKeys.list(),
    queryFn: () => rolesService.list(),
  });
}

export function useRoleDetail(id: string) {
  return useQuery({
    queryKey: rolesKeys.detail(id),
    queryFn: () => rolesService.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRolePayload) => rolesService.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: rolesKeys.all });
      notificationService.success("Rôle créé");
    },
  });
}

export function useUpdateRole(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateRolePayload) => rolesService.update(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: rolesKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: rolesKeys.list() });
      notificationService.success("Rôle mis à jour");
    },
  });
}
