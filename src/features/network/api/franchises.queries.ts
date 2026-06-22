"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { refreshListCachesAfterDelete } from "@/core/api/queryListCache";
import { notificationService } from "@/core/http/notificationService";
import {
  fetchBootstrapCountries,
  fetchCitiesByCountryCode,
} from "@/core/api/catalogLookup.service";
import { franchisesKeys } from "./franchises.keys";
import { partnersKeys } from "./partners.keys";
import {
  franchisesService,
  type FranchiseCreatePayload,
  type FranchiseUpdatePayload,
} from "./franchises.service";
import type { ListParams } from "@/shared/types/listParams";

export function useBootstrapCountries(enabled = true) {
  return useQuery({
    queryKey: franchisesKeys.bootstrapCountries,
    queryFn: fetchBootstrapCountries,
    enabled,
    staleTime: 10 * 60_000,
  });
}

export function useCountryCities(countryCode: string, enabled = true) {
  return useQuery({
    queryKey: franchisesKeys.countryCities(countryCode),
    queryFn: () => fetchCitiesByCountryCode(countryCode),
    enabled: enabled && Boolean(countryCode.trim()),
    staleTime: 5 * 60_000,
  });
}

export function useFranchisesList(params?: ListParams) {
  return useQuery({
    queryKey: franchisesKeys.list(params),
    queryFn: () => franchisesService.listAdmin(params),
  });
}

export function useCreateFranchise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FranchiseCreatePayload) => franchisesService.create(payload),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: franchisesKeys.all });
      notificationService.success(
        `Franchise créée. Connexion portail : ${data.portal_login_email}`
      );
    },
    onError: (error: Error) =>
      notificationService.error(error.message || "Création impossible"),
  });
}

export function useUpdateFranchise(franchiseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FranchiseUpdatePayload) =>
      franchisesService.update(franchiseId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: franchisesKeys.all });
      notificationService.success("Franchise mise à jour.");
    },
    onError: (error: Error) =>
      notificationService.error(error.message || "Mise à jour impossible"),
  });
}

export function useDeleteFranchise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => franchisesService.delete(id),
    onSuccess: async (_data, franchiseId) => {
      await refreshListCachesAfterDelete(qc, {
        listRootKeys: [franchisesKeys.all, partnersKeys.all],
        itemId: franchiseId,
        detailKey: [...franchisesKeys.all, "detail", franchiseId],
      });
      notificationService.success("Franchise supprimée.");
    },
    onError: (error: Error) =>
      notificationService.error(error.message || "Suppression impossible"),
  });
}
