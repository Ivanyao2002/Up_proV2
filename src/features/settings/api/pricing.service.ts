import { apiClient } from "@/core/http/apiClient";
import { ApiError } from "@/core/http/errorHandler";
import {
  fetchCityLabelById,
  fetchFranchiseNameById,
  resolveCityIdByLabel,
} from "@/core/api/catalogLookup.service";
import { LINKS, withListQuery } from "@/core/api/links";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import type { ApiAdminDashboardResponse } from "@/features/ops/api/dashboard.api.types";
import type { ApiV1ZonesListResponse } from "@/features/network/api/adminZones.api.types";
import type { LiveMapData, Paginated, PricingRule } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import type {
  ApiV1PricingRuleMutationResponse,
  ApiV1PricingRulesListResponse,
} from "./adminPricing.api.types";
import {
  buildPricingFilterOptions,
  mapApiPricingRuleToUi,
  mapApiPricingRulesToPaginated,
  mapCreatePayloadToApi,
  mapUpdatePayloadToApi,
  type PricingLookupMaps,
} from "./adminPricing.mapper";

export interface PricingListResponse extends Paginated<PricingRule> {
  filter_options: NonNullable<LiveMapData["filter_options"]>;
}

export interface CreatePricingPayload {
  franchise_id: number | string;
  zone_name: string;
  zone_id?: string | number | null;
  rule_name?: string;
  category_code?: string;
  service?: PricingRule["service"];
  base_fare_fcfa?: number;
  per_km_fcfa?: number;
  min_fare_fcfa?: number;
  waiting_per_minute_fcfa?: number;
  cancellation_fee_fcfa?: number;
  surge_multiplier?: number;
  status?: PricingRule["status"];
  city_label?: string;
  effectiveFrom?: string;
}

export type UpdatePricingPayload = Omit<
  CreatePricingPayload,
  "zone_name" | "franchise_id" | "city_label"
> & {
  service?: PricingRule["service"];
  rule_name?: string;
};

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

async function fetchDashboardFranchiseOptions(): Promise<
  { id: string; name: string; city?: string }[]
> {
  const dash = await apiClient.get<ApiAdminDashboardResponse>(
    LINKS.admin.v1.dashboard
  );
  return (dash.dashboard?.filters?.options?.franchises ?? []).map((f) => ({
    id: String(f.id),
    name: f.name,
    city: f.city ?? undefined,
  }));
}

async function fetchV1PricingList(
  params?: ListParams
): Promise<PricingListResponse> {
  const [response, lookups, franchises] = await Promise.all([
    apiClient.get<ApiV1PricingRulesListResponse>(
      `${LINKS.admin.v1.pricingRules}${buildV1ListQuery({ ...params, per_page: 200 })}`
    ),
    resolvePricingLookups(),
    fetchDashboardFranchiseOptions(),
  ]);

  const paginated = mapApiPricingRulesToPaginated(response, lookups, params);
  return {
    ...paginated,
    filter_options: buildPricingFilterOptions(franchises),
  };
}

async function resolveCityIdForCreate(
  payload: CreatePricingPayload
): Promise<string> {
  if (payload.city_label?.trim()) {
    const fromLabel = await resolveCityIdByLabel(payload.city_label);
    if (fromLabel) return fromLabel;
  }
  const franchises = await fetchDashboardFranchiseOptions();
  const franchise = franchises.find(
    (f) => String(f.id) === String(payload.franchise_id)
  );
  if (franchise?.city) {
    const fromFranchiseCity = await resolveCityIdByLabel(franchise.city);
    if (fromFranchiseCity) return fromFranchiseCity;
  }
  const boot = await apiClient.get<{ defaultCityId?: string }>(
    "/v1/dev/sandbox"
  ).catch(() => null);
  if (boot?.defaultCityId) return boot.defaultCityId;
  throw new Error(
    "Impossible de résoudre cityId pour la grille tarifaire."
  );
}

export const pricingService = {
  list: async (params?: ListParams): Promise<PricingListResponse> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<PricingListResponse>(
        withListQuery(LINKS.admin.settings.pricing.list, params)
      );
    }
    return fetchV1PricingList(params);
  },

  get: async (id: string): Promise<PricingRule> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<PricingRule>(
        LINKS.admin.settings.pricing.getById(id)
      );
    }
    // Pas de GET /v1/admin/pricing-rules/{id} sur l'API — lecture depuis la liste.
    const [response, lookups] = await Promise.all([
      apiClient.get<ApiV1PricingRulesListResponse>(
        `${LINKS.admin.v1.pricingRules}?limit=500`
      ),
      resolvePricingLookups(),
    ]);
    const item = (response.items ?? []).find((r) => String(r.id) === id);
    if (!item) {
      throw new ApiError(404, {
        message:
          "Grille tarifaire introuvable. L'API ne expose pas GET /v1/admin/pricing-rules/{id} — utilisez la liste.",
        code: "PRICING_NOT_FOUND",
      });
    }
    return mapApiPricingRuleToUi(item, lookups);
  },

  create: async (payload: CreatePricingPayload): Promise<PricingRule> => {
    if (useLegacyAdminApi()) {
      return apiClient.post<PricingRule>(
        LINKS.admin.settings.pricing.create,
        payload
      );
    }
    const cityId = await resolveCityIdForCreate(payload);
    const body = mapCreatePayloadToApi(payload, cityId);
    const res = await apiClient.post<ApiV1PricingRuleMutationResponse>(
      LINKS.admin.v1.pricingRules,
      body
    );
    const lookups = await resolvePricingLookups();
    if (!res.item) {
      throw new Error("Création tarif sans item en réponse.");
    }
    return mapApiPricingRuleToUi(res.item, lookups);
  },

  update: async (
    id: string,
    payload: UpdatePricingPayload
  ): Promise<PricingRule> => {
    if (useLegacyAdminApi()) {
      return apiClient.put<PricingRule>(
        LINKS.admin.settings.pricing.update(id),
        payload
      );
    }
    const body = mapUpdatePayloadToApi(payload);
    const res = await apiClient.patch<ApiV1PricingRuleMutationResponse>(
      LINKS.admin.v1.pricingRuleById(id),
      body
    );
    const lookups = await resolvePricingLookups();
    if (!res.item) {
      return pricingService.get(id);
    }
    return mapApiPricingRuleToUi(res.item, lookups);
  },
};
