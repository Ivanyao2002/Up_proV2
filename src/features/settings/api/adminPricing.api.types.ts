/** GET/POST /v1/admin/pricing-rules · PATCH /v1/admin/pricing-rules/{id} */

export interface ApiV1PricingRuleItem {
  id: string;
  franchise_id?: string | null;
  city_id?: string | null;
  zone_id?: string | null;
  service_type?: string | null;
  category_code?: string | null;
  delivery_mode_code?: string | null;
  vehicle_type_code?: string | null;
  rule_name?: string | null;
  base_fare_xof?: number | null;
  per_km_xof?: number | null;
  per_minute_xof?: number | null;
  minimum_fare_xof?: number | null;
  waiting_per_minute_xof?: number | null;
  cancellation_fee_xof?: number | null;
  night_multiplier?: number | null;
  rain_multiplier?: number | null;
  holiday_multiplier?: number | null;
  airport_fee_xof?: number | null;
  toll_handling?: string | null;
  effective_from?: string | null;
  effective_to?: string | null;
  active?: boolean | null;
  priority?: number | null;
  metadata?: Record<string, unknown>;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ApiV1PricingRulesListResponse {
  status?: string;
  items?: ApiV1PricingRuleItem[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiV1PricingRuleMutationResponse {
  status?: string;
  item?: ApiV1PricingRuleItem;
}

export interface ApiV1PricingRuleCreateBody {
  franchise_id: string;
  city_id: string;
  zone_id?: string | null;
  service_type: string;
  category_code: string;
  rule_name: string;
  base_fare_xof: number;
  per_km_xof: number;
  minimum_fare_xof: number;
  per_minute_xof?: number;
  night_multiplier?: number | null;
  rain_multiplier?: number | null;
  effective_from?: string | null;
  active: boolean;
}

export interface ApiV1PricingRulePatchBody {
  service_type?: string;
  category_code?: string;
  rule_name?: string;
  base_fare_xof?: number;
  per_km_xof?: number;
  minimum_fare_xof?: number;
  per_minute_xof?: number;
  night_multiplier?: number | null;
  rain_multiplier?: number | null;
  effective_from?: string | null;
  active?: boolean;
  zone_id?: string | null;
}
