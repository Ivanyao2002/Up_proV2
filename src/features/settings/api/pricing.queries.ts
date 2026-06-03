"use client";



import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { pricingKeys } from "./pricing.keys";

import { pricingService, type CreatePricingPayload, type UpdatePricingPayload } from "./pricing.service";

import { notificationService } from "@/core/http/notificationService";



export function usePricingList() {

  return useQuery({

    queryKey: pricingKeys.list(),

    queryFn: () => pricingService.list(),

  });

}



export function useCreatePricingRule() {

  const qc = useQueryClient();

  return useMutation({

    mutationFn: (payload: CreatePricingPayload) => pricingService.create(payload),

    onSuccess: () => {

      void qc.invalidateQueries({ queryKey: pricingKeys.all });

      notificationService.success("Grille tarifaire créée");

    },

  });

}

export function usePricingDetail(id: string) {
  return useQuery({
    queryKey: pricingKeys.detail(id),
    queryFn: () => pricingService.get(id),
    enabled: Boolean(id),
  });
}

export function useUpdatePricingRule(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePricingPayload) => pricingService.update(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: pricingKeys.all });
      void qc.invalidateQueries({ queryKey: pricingKeys.detail(id) });
      notificationService.success("Grille tarifaire mise à jour");
    },
  });
}

