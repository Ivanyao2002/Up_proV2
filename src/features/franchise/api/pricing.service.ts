import { apiClient } from "@/core/http/apiClient";
import { ApiError } from "@/core/http/errorHandler";
import { resolveFranchiseId } from "@/core/api/franchiseContext.service";
import { LINKS, withListQuery } from "@/core/api/links";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import type { Paginated, PricingRule } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import type { ApiV1PricingRulesListResponse } from "@/features/settings/api/adminPricing.api.types";
import {
  mapApiPricingRuleToUi,
  mapApiPricingRulesToPaginated,
  type PricingLookupMaps,
} from "@/features/settings/api/adminPricing.mapper";
import {
  fetchCityLabelById,
  fetchFranchiseNameById,
} from "@/core/api/catalogLookup.service";
import type { ApiV1ZonesListResponse } from "@/features/network/api/adminZones.api.types";

export interface FranchisePricingSummary {
  franchise_name: string;
  active_count: number;
  draft_count: number;
}

export interface FranchisePricingListResponse extends Paginated<PricingRule> {
  summary: FranchisePricingSummary;
}

export interface FranchiseCreatePricingPayload {
  zone_name: string;
  zone_id?: string | number | null;
  rule_name?: string;
  category_code?: string;
  service?: PricingRule["service"];
  base_fare_fcfa?: number;
  per_km_fcfa?: number;
  min_fare_fcfa?: number;
  surge_multiplier?: number;
  status?: PricingRule["status"];
}

export type FranchiseUpdatePricingPayload = Omit<
  FranchiseCreatePricingPayload,
  "zone_name"
>;

async function resolvePricingLookups(): Promise<PricingLookupMaps> {
  const [franchiseNameById, cityById, zonesRes] = await Promise.all([
    fetchFranchiseNameById(),
    fetchCityLabelById(),
    apiClient
      .get<ApiV1ZonesListResponse>(`${LINKS.admin.zones.list}?limit=200`)
      .catch(() => ({ zones: [] } as ApiV1ZonesListResponse)),
  ]);
  const zoneNameById = new Map<string, string>();
  for (const zone of zonesRes.zones ?? []) {
    if (zone.id && zone.label) {
      zoneNameById.set(zone.id, zone.label.trim());
    }
  }
  return { franchiseNameById, cityById, zoneNameById };
}

function buildSummary(
  rules: PricingRule[],
  franchiseName: string
): FranchisePricingSummary {
  return {
    franchise_name: franchiseName,
    active_count: rules.filter((r) => r.status === "active").length,
    draft_count: rules.filter((r) => r.status === "draft").length,
  };
}

async function fetchV1FranchisePricing(
  params?: ListParams
): Promise<FranchisePricingListResponse> {
  const franchiseId = await resolveFranchiseId();
  const [response, lookups] = await Promise.all([
    apiClient.get<ApiV1PricingRulesListResponse>(
      LINKS.franchise.v1.pricingRules(franchiseId)
    ),
    resolvePricingLookups(),
  ]);
  const paginated = mapApiPricingRulesToPaginated(response, lookups, params);
  const franchiseName =
    lookups.franchiseNameById.get(franchiseId) ??
    paginated.data[0]?.franchise_name ??
    "Franchise";
  return {
    ...paginated,
    summary: buildSummary(
      (response.items ?? []).map((item) =>
        mapApiPricingRuleToUi(item, lookups)
      ),
      franchiseName
    ),
  };
}

export const franchisePricingService = {
  list: async (params?: ListParams): Promise<FranchisePricingListResponse> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<FranchisePricingListResponse>(
        withListQuery(LINKS.franchise.pricing.list, params)
      );
    }
    return fetchV1FranchisePricing(params);
  },

  get: async (id: string): Promise<PricingRule> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<PricingRule>(LINKS.franchise.pricing.getById(id));
    }
    const franchiseId = await resolveFranchiseId();
    const [response, lookups] = await Promise.all([
      apiClient.get<ApiV1PricingRulesListResponse>(
        LINKS.franchise.v1.pricingRules(franchiseId)
      ),
      resolvePricingLookups(),
    ]);
    const item = (response.items ?? []).find((r) => r.id === id);
    if (!item) {
      throw new ApiError(404, {
        message: "Grille tarifaire introuvable",
        code: "PRICING_NOT_FOUND",
      });
    }
    return mapApiPricingRuleToUi(item, lookups);
  },

  create: async (payload: FranchiseCreatePricingPayload) => {
    if (useLegacyPortalApi()) {
      return apiClient.post<PricingRule>(LINKS.franchise.pricing.create, payload);
    }
    const franchiseId = await resolveFranchiseId();
    return apiClient.post<PricingRule>(LINKS.franchise.v1.pricingRules(franchiseId), payload);
  },

  update: async (id: string, payload: FranchiseUpdatePricingPayload) => {
    if (useLegacyPortalApi()) {
      return apiClient.put<PricingRule>(LINKS.franchise.pricing.update(id), payload);
    }
    const franchiseId = await resolveFranchiseId();
    return apiClient.patch<PricingRule>(
      `${LINKS.franchise.v1.pricingRules(franchiseId)}/${id}`,
      payload
    );
  },
};
