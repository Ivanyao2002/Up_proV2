"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { refreshListCachesAfterDelete } from "@/core/api/queryListCache";
import { notificationService } from "@/core/http/notificationService";
import { franchisesKeys } from "./franchises.keys";
import { partnersKeys } from "./partners.keys";
import {
  partnersService,
  type PartnerCreatePayload,
  type PartnerUpdatePayload,
} from "./partners.service";
import type { ListParams } from "@/shared/types/listParams";

export function usePartnersList(params?: ListParams) {
  return useQuery({
    queryKey: partnersKeys.list(params),
    queryFn: () => partnersService.listAdmin(params),
  });
}

export function useCreatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PartnerCreatePayload) => partnersService.create(payload),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: partnersKeys.all });
      void qc.invalidateQueries({ queryKey: franchisesKeys.all });
      const login = data.portal_login_email;
      notificationService.success(
        login
          ? `Partenaire créé. Connexion portail : ${login}`
          : "Partenaire créé"
      );
    },
    onError: (error: Error) =>
      notificationService.error(error.message || "Création impossible"),
  });
}

export function useActivatePartner(partnerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => partnersService.activate(partnerId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnersKeys.all });
      void qc.invalidateQueries({
        queryKey: [...partnersKeys.all, "detail", partnerId],
      });
    },
  });
}

export function useDeletePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => partnersService.delete(id),
    onSuccess: async (_data, partnerId) => {
      await refreshListCachesAfterDelete(qc, {
        listRootKeys: [partnersKeys.all, franchisesKeys.all],
        itemId: partnerId,
        detailKey: [...partnersKeys.all, "detail", partnerId],
      });
      notificationService.success("Partenaire supprimé.");
    },
    onError: (error: Error) =>
      notificationService.error(error.message || "Suppression impossible"),
  });
}

export function useSuspendPartner(partnerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => partnersService.suspend(partnerId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnersKeys.all });
      void qc.invalidateQueries({
        queryKey: [...partnersKeys.all, "detail", partnerId],
      });
    },
  });
}

export function useUpdatePartner(partnerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PartnerUpdatePayload) =>
      partnersService.update(partnerId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnersKeys.all });
      void qc.invalidateQueries({ queryKey: franchisesKeys.all });
      void qc.invalidateQueries({
        queryKey: [...partnersKeys.all, "detail", partnerId],
      });
      notificationService.success("Partenaire mis à jour.");
    },
    onError: (error: Error) =>
      notificationService.error(error.message || "Mise à jour impossible"),
  });
}
