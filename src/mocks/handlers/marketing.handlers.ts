import { http, HttpResponse } from "msw";
import marketingPromosSeed from "../data/marketing-promos.json";
import marketingCampaignsSeed from "../data/marketing-campaigns.json";
import marketingBannersSeed from "../data/marketing-banners.json";
import type { Paginated } from "@/shared/types";
import type {
  MarketingPromo,
  MarketingCampaign,
  MarketingBanner,
} from "@/features/marketing/api/marketing.service";

let promosState: Paginated<MarketingPromo> = {
  data: marketingPromosSeed.data as MarketingPromo[],
  meta: marketingPromosSeed.meta,
};

let campaignsState: Paginated<MarketingCampaign> = {
  data: marketingCampaignsSeed.data as MarketingCampaign[],
  meta: marketingCampaignsSeed.meta,
};

let bannersState: Paginated<MarketingBanner> = {
  data: marketingBannersSeed.data as MarketingBanner[],
  meta: marketingBannersSeed.meta,
};

export const marketingHandlers = [
  http.get("*/api/v2/admin/marketing/promos", () => {
    return HttpResponse.json(promosState);
  }),

  http.post("*/api/v2/admin/marketing/promos", async ({ request }) => {
    const body = (await request.json()) as Partial<MarketingPromo>;
    if (!body.code?.trim() || !body.label?.trim()) {
      return HttpResponse.json({ message: "Code et libellé requis" }, { status: 422 });
    }
    const ids = promosState.data.map((p) => p.id);
    const promo: MarketingPromo = {
      id: ids.length ? Math.max(...ids) + 1 : 1,
      code: body.code.trim().toUpperCase(),
      label: body.label.trim(),
      discount_pct: body.discount_pct ?? 0,
      fixed_discount_fcfa: body.fixed_discount_fcfa,
      uses_count: 0,
      max_uses: body.max_uses ?? 1000,
      status: body.status ?? "draft",
      expires_at: body.expires_at ?? new Date(Date.now() + 90 * 86400000).toISOString(),
    };
    promosState = {
      ...promosState,
      data: [promo, ...promosState.data],
      meta: { ...promosState.meta, total: promosState.data.length + 1 },
    };
    return HttpResponse.json(promo, { status: 201 });
  }),

  http.get("*/api/v2/admin/marketing/campaigns", () => {
    return HttpResponse.json(campaignsState);
  }),

  http.post("*/api/v2/admin/marketing/campaigns", async ({ request }) => {
    const body = (await request.json()) as Partial<MarketingCampaign>;
    if (!body.name?.trim()) {
      return HttpResponse.json({ message: "Nom requis" }, { status: 422 });
    }
    const campaign: MarketingCampaign = {
      id: `CMP-${Date.now()}`,
      name: body.name.trim(),
      channel: body.channel ?? "push",
      audience: body.audience?.trim() ?? "Tous les clients",
      status: body.status ?? "draft",
      sent_count: 0,
      open_rate_pct: 0,
      starts_at: body.starts_at ?? new Date().toISOString(),
      ends_at: body.ends_at ?? new Date(Date.now() + 30 * 86400000).toISOString(),
    };
    campaignsState = {
      ...campaignsState,
      data: [campaign, ...campaignsState.data],
      meta: { ...campaignsState.meta, total: campaignsState.data.length + 1 },
    };
    return HttpResponse.json(campaign, { status: 201 });
  }),

  http.get("*/api/v2/admin/marketing/banners", () => {
    return HttpResponse.json(bannersState);
  }),

  http.post("*/api/v2/admin/marketing/banners", async ({ request }) => {
    const body = (await request.json()) as Partial<MarketingBanner>;
    if (!body.title?.trim()) {
      return HttpResponse.json({ message: "Titre requis" }, { status: 422 });
    }
    const ids = bannersState.data.map((b) => b.id);
    const banner: MarketingBanner = {
      id: ids.length ? Math.max(...ids) + 1 : 1,
      title: body.title.trim(),
      placement: body.placement ?? "home_hero",
      status: body.status ?? "draft",
      impressions: 0,
      clicks: 0,
      starts_at: body.starts_at ?? new Date().toISOString(),
      ends_at: body.ends_at ?? new Date(Date.now() + 30 * 86400000).toISOString(),
    };
    bannersState = {
      ...bannersState,
      data: [banner, ...bannersState.data],
      meta: { ...bannersState.meta, total: bannersState.data.length + 1 },
    };
    return HttpResponse.json(banner, { status: 201 });
  }),
];
