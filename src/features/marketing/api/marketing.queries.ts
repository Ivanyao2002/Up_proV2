"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import {
  marketingService,
  type MarketingBanner,
  type MarketingCampaign,
  type MarketingPromo,
} from "./marketing.service";
import type { ListParams } from "@/shared/types/listParams";

export const marketingKeys = {
  all: ["marketing"] as const,
  promos: (filters?: ListParams) => [...marketingKeys.all, "promos", filters] as const,
  campaigns: (filters?: ListParams) =>
    [...marketingKeys.all, "campaigns", filters] as const,
  banners: (filters?: ListParams) => [...marketingKeys.all, "banners", filters] as const,
};

export function useMarketingPromos(params?: ListParams) {
  return useQuery({
    queryKey: marketingKeys.promos(params),
    queryFn: () => marketingService.promos(params),
  });
}

export function useCreateMarketingPromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<MarketingPromo, "id" | "uses_count">) =>
      marketingService.createPromo(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...marketingKeys.all, "promos"] });
      notificationService.success("Code promo créé");
    },
    onError: (error) => {
      notificationService.error(
        error instanceof Error ? error.message : "Création du code promo impossible."
      );
    },
  });
}

export function useMarketingCampaigns(params?: ListParams) {
  return useQuery({
    queryKey: marketingKeys.campaigns(params),
    queryFn: () => marketingService.campaigns(params),
  });
}

export function useCreateMarketingCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<MarketingCampaign, "id" | "sent_count" | "open_rate_pct">) =>
      marketingService.createCampaign(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...marketingKeys.all, "campaigns"] });
      notificationService.success("Campagne créée");
    },
    onError: (error) => {
      notificationService.error(
        error instanceof Error ? error.message : "Création de la campagne impossible."
      );
    },
  });
}

export function useMarketingBanners(params?: ListParams) {
  return useQuery({
    queryKey: marketingKeys.banners(params),
    queryFn: () => marketingService.banners(params),
  });
}

export function useCreateMarketingBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<MarketingBanner, "id" | "impressions" | "clicks">) =>
      marketingService.createBanner(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...marketingKeys.all, "banners"] });
      notificationService.success("Bannière créée");
    },
    onError: (error) => {
      notificationService.error(
        error instanceof Error ? error.message : "Création de la bannière impossible."
      );
    },
  });
}
