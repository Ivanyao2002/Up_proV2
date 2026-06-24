import type { LiveMapData, Paginated, PricingRule } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type {
  ApiV1PricingRuleCreateBody,
  ApiV1PricingRuleItem,
  ApiV1PricingRulePatchBody,
  ApiV1PricingRulesListResponse,
} from "./adminPricing.api.types";
import type {
  CreatePricingPayload,
  UpdatePricingPayload,
} from "./pricing.service";

export interface PricingLookupMaps {
  franchiseNameById: Map<string, string>;
  cityById: Map<string, string>;
  zoneNameById: Map<string, string>;
}

const CATEGORY_OPTIONS = ["ECO", "CONFORT", "CONFORT+", "PREMIUM"] as const;

export function mapUiServiceToApi(service: PricingRule["service"]): string {
  switch (service) {
    case "delivery":
      return "DELIVERY";
    case "freight":
      return "FREIGHT";
    case "rental":
      return "RENTAL";
    default:
      return "RIDE";
  }
}

export function mapApiServiceToUi(
  serviceType?: string | null
): PricingRule["service"] {
  const key = String(serviceType ?? "").toUpperCase();
  switch (key) {
    case "DELIVERY":
      return "delivery";
    case "FREIGHT":
      return "freight";
    case "RENTAL":
      return "rental";
    default:
      return "taxi";
  }
}

export function resolveSurgeMultiplier(item: ApiV1PricingRuleItem): number {
  const values = [
    item.night_multiplier,
    item.rain_multiplier,
    item.holiday_multiplier,
  ].filter((v): v is number => v != null && v > 1);
  return values.length ? Math.max(...values) : 1;
}

export function resolveZoneLabel(
  item: ApiV1PricingRuleItem,
  lookups: PricingLookupMaps
): string {
  if (item.zone_id) {
    const fromMap = lookups.zoneNameById.get(item.zone_id);
    if (fromMap) return fromMap;
  }
  if (item.rule_name?.trim()) return item.rule_name.trim();
  const category = item.category_code?.trim();
  const city =
    (item.city_id && lookups.cityById.get(item.city_id)) || undefined;
  if (category && city) return `${category} · ${city}`;
  if (category) return category;
  return city ?? "Règle globale";
}

export function mapApiPricingRuleToUi(
  item: ApiV1PricingRuleItem,
  lookups: PricingLookupMaps
): PricingRule {
  const franchiseId = item.franchise_id ?? "";
  return {
    id: item.id,
    franchise_id: franchiseId,
    franchise_name:
      (franchiseId && lookups.franchiseNameById.get(String(franchiseId))) ||
      "—",
    zone_name: resolveZoneLabel(item, lookups),
    rule_name: item.rule_name ?? undefined,
    category_code: item.category_code ?? undefined,
    zone_id: item.zone_id ?? undefined,
    city_id: item.city_id ?? undefined,
    service: mapApiServiceToUi(item.service_type),
    base_fare_fcfa: item.base_fare_xof ?? 0,
    per_km_fcfa: item.per_km_xof ?? 0,
    min_fare_fcfa: item.minimum_fare_xof ?? 0,
    waiting_per_minute_fcfa: item.waiting_per_minute_xof ?? undefined,
    cancellation_fee_fcfa: item.cancellation_fee_xof ?? undefined,
    surge_multiplier: resolveSurgeMultiplier(item),
    status: item.active ? "active" : "draft",
  };
}

function matchesListFilters(
  rule: PricingRule,
  params?: ListParams
): boolean {
  if (params?.franchise_id != null) {
    if (String(rule.franchise_id) !== String(params.franchise_id)) return false;
  }
  if (params?.status && params.status !== "all") {
    if (rule.status !== params.status) return false;
  }
  if (params?.zone && params.zone !== "all") {
    if (!rule.zone_name.toLowerCase().includes(params.zone.toLowerCase())) {
      return false;
    }
  }
  const q = params?.search?.trim().toLowerCase();
  if (q) {
    const hay = [
      rule.franchise_name,
      rule.zone_name,
      rule.rule_name,
      rule.category_code,
      rule.service,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export function mapApiPricingRulesToPaginated(
  response: ApiV1PricingRulesListResponse,
  lookups: PricingLookupMaps,
  params?: ListParams
): Paginated<PricingRule> {
  const all = (response.items ?? []).map((item) =>
    mapApiPricingRuleToUi(item, lookups)
  );
  const filtered = all.filter((rule) => matchesListFilters(rule, params));
  const page = params?.page ?? 1;
  const perPage = params?.per_page ?? 25;
  const start = (page - 1) * perPage;
  const data = filtered.slice(start, start + perPage);

  return {
    data,
    meta: mapV1PaginationToMeta(
      {
        page,
        limit: perPage,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / perPage)),
      },
      params
    ),
  };
}

export function buildPricingFilterOptions(
  franchises: { id: string | number; name: string; city?: string }[]
): NonNullable<LiveMapData["filter_options"]> {
  return {
    franchises: franchises.map((f) => ({
      id: f.id,
      name: f.name,
      city: f.city ?? "—",
    })),
    partners: [],
  };
}

export function mapCreatePayloadToApi(
  payload: CreatePricingPayload,
  cityId: string
): ApiV1PricingRuleCreateBody {
  const ruleName =
    payload.rule_name?.trim() ||
    payload.zone_name?.trim() ||
    `${payload.category_code ?? "ECO"} grille`;
  return {
    franchise_id: String(payload.franchise_id),
    city_id: cityId,
    zone_id: payload.zone_id != null ? String(payload.zone_id) : null,
    service_type: mapUiServiceToApi(payload.service ?? "taxi"),
    category_code: payload.category_code ?? "ECO",
    rule_name: ruleName,
    base_fare_xof: payload.base_fare_fcfa ?? 0,
    per_km_xof: payload.per_km_fcfa ?? 0,
    minimum_fare_xof: payload.min_fare_fcfa ?? 0,
    waiting_per_minute_xof: payload.waiting_per_minute_fcfa ?? null,
    cancellation_fee_xof: payload.cancellation_fee_fcfa ?? null,
    night_multiplier:
      (payload.surge_multiplier ?? 1) > 1 ? payload.surge_multiplier : null,
    effective_from: payload.effectiveFrom?.trim() || null,
    active: payload.status === "active",
  };
}

export function mapUpdatePayloadToApi(
  payload: UpdatePricingPayload
): ApiV1PricingRulePatchBody {
  const body: ApiV1PricingRulePatchBody = {};
  if (payload.service != null) {
    body.service_type = mapUiServiceToApi(payload.service);
  }
  if (payload.category_code != null) body.category_code = payload.category_code;
  if (payload.rule_name != null) body.rule_name = payload.rule_name;
  if (payload.base_fare_fcfa != null) body.base_fare_xof = payload.base_fare_fcfa;
  if (payload.per_km_fcfa != null) body.per_km_xof = payload.per_km_fcfa;
  if (payload.min_fare_fcfa != null) body.minimum_fare_xof = payload.min_fare_fcfa;
  if (payload.waiting_per_minute_fcfa != null) {
    body.waiting_per_minute_xof = payload.waiting_per_minute_fcfa;
  }
  if (payload.cancellation_fee_fcfa != null) {
    body.cancellation_fee_xof = payload.cancellation_fee_fcfa;
  }
  if (payload.surge_multiplier != null) {
    body.night_multiplier =
      payload.surge_multiplier > 1 ? payload.surge_multiplier : null;
  }
  if (payload.status != null) body.active = payload.status === "active";
  if (payload.effectiveFrom != null) {
    body.effective_from = payload.effectiveFrom.trim() || null;
  }
  return body;
}

export const PRICING_CATEGORY_OPTIONS = CATEGORY_OPTIONS;
