"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
 * Compteur « en course » (on_trip) sur toute la flotte. Les totaux online/total/etc.
 * sont déjà fournis par `counters` de la réponse liste : seul on_trip nécessite un
 * appel léger (per_page:1) car non agrégé par le backend.
 */
export function usePartnerDriverOnTripCount() {
  const result = useQuery({
    queryKey: [...partnerDriversKeys.all, "count", "on_trip"] as const,
    queryFn: () =>
      partnerDriversService.list({ availability: "on_trip", page: 1, per_page: 1 }),
    staleTime: 30_000,
  });
  return { on_trip: result.data?.meta?.total, isLoading: result.isLoading };
}

export function usePartnerDriverDetail(id: string) {
  return useQuery({
    queryKey: partnerDriversKeys.detail(id),
    queryFn: () => partnerDriversService.getById(id),
    enabled: Boolean(id),
  });
}

/** Actions de statut sur la fiche d'un chauffeur (disponibilité, suspension, réactivation). */
export function useDriverStatusActions(driverId: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: partnerDriversKeys.detail(driverId) });
    void qc.invalidateQueries({ queryKey: partnerDriversKeys.all });
  };
  const setAvailability = useMutation({
    mutationFn: (availability: "online" | "offline") =>
      partnerDriversService.setAvailability(driverId, availability),
    onSuccess: invalidate,
  });
  const suspend = useMutation({
    mutationFn: () => partnerDriversService.suspend(driverId),
    onSuccess: invalidate,
  });
  const reactivate = useMutation({
    mutationFn: () => partnerDriversService.reactivate(driverId),
    onSuccess: invalidate,
  });
  return { setAvailability, suspend, reactivate };
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
