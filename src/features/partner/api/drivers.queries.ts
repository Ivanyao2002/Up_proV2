"use client";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { partnersKeys } from "@/features/network/api/partners.keys";
import { useScope } from "@/core/auth/useScope";
import { partnerDriversService } from "./drivers.service";
import type { CreateDriverPayload } from "./drivers.service";
import type { DriverDocumentFile } from "@/shared/types/driverDocuments";
import type { DriverKycDocumentType } from "@/shared/types/driverDocuments";
import type { ListParams } from "@/shared/types/listParams";

export const partnerDriversKeys = {
  all: ["partner", "drivers"] as const,
  list: (filters?: ListParams) => [...partnerDriversKeys.all, "list", filters] as const,
  detail: (id: string) => [...partnerDriversKeys.all, "detail", id] as const,
};

export function usePartnerDriversList(params?: ListParams) {
  return useQuery({
    queryKey: partnerDriversKeys.list(params),
    queryFn: () => partnerDriversService.list(params),
  });
}

/**
 * Compteurs de disponibilité sur TOUTE la flotte (pas seulement la page courante).
 * L'API ne renvoyant pas d'agrégat, on lit meta.total via un appel léger (per_page:1)
 * par disponibilité.
 */
export function usePartnerDriverAvailabilityCounts() {
  const availabilities = ["online", "on_trip", "offline"] as const;
  const results = useQueries({
    queries: availabilities.map((availability) => ({
      queryKey: [...partnerDriversKeys.all, "count", availability] as const,
      queryFn: () =>
        partnerDriversService.list({ availability, page: 1, per_page: 1 }),
      staleTime: 30_000,
    })),
  });

  return {
    online: results[0].data?.meta?.total,
    on_trip: results[1].data?.meta?.total,
    offline: results[2].data?.meta?.total,
    isLoading: results.some((r) => r.isLoading),
  };
}

export function usePartnerDriverDetail(id: string) {
  return useQuery({
    queryKey: partnerDriversKeys.detail(id),
    queryFn: () => partnerDriversService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreatePartnerDriver() {
  const qc = useQueryClient();
  const { ownerId } = useScope();
  return useMutation({
    mutationFn: ({
      data,
      documents = [],
      partnerId,
    }: {
      data: CreateDriverPayload;
      documents?: DriverDocumentFile[];
      partnerId?: string;
    }) =>
      partnerDriversService.createWithDocuments(data, documents, {
        partnerId,
      }),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: partnerDriversKeys.all });
      if (variables.partnerId) {
        void qc.invalidateQueries({ queryKey: partnersKeys.all });
      }
    },
  });
}

export function useUploadPartnerDriverDocument(driverId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, file }: { type: DriverKycDocumentType; file: File }) =>
      partnerDriversService.uploadDocument(driverId, type, file),
    onSuccess: (data) => {
      qc.setQueryData(partnerDriversKeys.detail(driverId), data);
      void qc.invalidateQueries({ queryKey: partnerDriversKeys.all });
    },
  });
}

export function useUpdatePartnerDriver(driverId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateDriverPayload>) =>
      partnerDriversService.update(driverId, data),
    onSuccess: (data) => {
      qc.setQueryData(partnerDriversKeys.detail(driverId), data);
      void qc.invalidateQueries({ queryKey: partnerDriversKeys.all });
    },
  });
}
