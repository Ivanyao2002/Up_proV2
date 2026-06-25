"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useScope } from "@/core/auth/useScope";
import {
  partnerRentalService,
  type CreateRentalOfferPayload,
  type UpdateRentalOfferPayload,
  type RentalReschedulePayload,
} from "./rental.service";
import type { ListParams } from "@/shared/types/listParams";

export const partnerRentalKeys = {
  all: ["partner", "rental-offers"] as const,
  list: (filters?: ListParams) =>
    [...partnerRentalKeys.all, "list", filters] as const,
  detail: (id: string) => [...partnerRentalKeys.all, "detail", id] as const,
  stats: () => [...partnerRentalKeys.all, "stats"] as const,
};

export function usePartnerRentalOffers(params?: ListParams) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerRentalKeys.list(params),
    queryFn: () => partnerRentalService.list(ownerId!, params),
    enabled: ownerId != null,
  });
}

export function usePartnerRentalOfferDetail(offerId: string) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerRentalKeys.detail(offerId),
    queryFn: () => partnerRentalService.getById(ownerId!, offerId),
    enabled: ownerId != null && !!offerId,
  });
}

export function usePartnerRentalStats() {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerRentalKeys.stats(),
    queryFn: () => partnerRentalService.stats(ownerId!),
    enabled: ownerId != null,
  });
}

export function useCreateRentalOffer() {
  const qc = useQueryClient();
  const { ownerId } = useScope();
  return useMutation({
    mutationFn: (data: CreateRentalOfferPayload) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerRentalService.create(ownerId, data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerRentalKeys.all });
    },
  });
}

export function useUpdateRentalOffer() {
  const qc = useQueryClient();
  const { ownerId } = useScope();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateRentalOfferPayload;
    }) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerRentalService.update(ownerId, id, data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerRentalKeys.all });
    },
  });
}

export function useRescheduleRentalOffer() {
  const qc = useQueryClient();
  const { ownerId } = useScope();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RentalReschedulePayload }) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerRentalService.reschedule(ownerId, id, data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerRentalKeys.all });
    },
  });
}

export function useDeleteRentalOffer() {
  const qc = useQueryClient();
  const { ownerId } = useScope();
  return useMutation({
    mutationFn: (offerId: string) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerRentalService.delete(ownerId, offerId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerRentalKeys.all });
    },
  });
}
