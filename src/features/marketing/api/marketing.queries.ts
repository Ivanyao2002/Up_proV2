"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import {
  marketingService,
  type MarketingBanner,
  type MarketingCampaign,
  type MarketingPromo,
} from "./marketing.service";

export function useMarketingPromos() {
  return useQuery({
    queryKey: ["marketing", "promos"],
    queryFn: () => marketingService.promos(),
  });
}

export function useCreateMarketingPromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<MarketingPromo, "id" | "uses_count">) =>
      marketingService.createPromo(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["marketing", "promos"] });
      notificationService.success("Code promo créé");
    },
  });
}

export function useMarketingCampaigns() {
  return useQuery({
    queryKey: ["marketing", "campaigns"],
    queryFn: () => marketingService.campaigns(),
  });
}

export function useCreateMarketingCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<MarketingCampaign, "id" | "sent_count" | "open_rate_pct">) =>
      marketingService.createCampaign(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["marketing", "campaigns"] });
      notificationService.success("Campagne créée");
    },
  });
}

export function useMarketingBanners() {
  return useQuery({
    queryKey: ["marketing", "banners"],
    queryFn: () => marketingService.banners(),
  });
}

export function useCreateMarketingBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<MarketingBanner, "id" | "impressions" | "clicks">) =>
      marketingService.createBanner(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["marketing", "banners"] });
      notificationService.success("Bannière créée");
    },
  });
}
