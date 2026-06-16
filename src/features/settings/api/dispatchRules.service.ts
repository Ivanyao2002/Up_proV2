import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { DispatchRules } from "@/shared/types";

interface ApiDispatchConfigResponse {
  document?: {
    global?: Partial<DispatchRules>;
  };
}

const DEFAULT_DISPATCH_RULES: DispatchRules = {
  wave_radii_km: [2, 4, 6, 8],
  wave_interval_sec: 120,
  offer_ttl_sec: 120,
  max_waves: 4,
  max_dispatch_duration_sec: 900,
  max_offers_per_driver: 2,
  max_rejections_before_cooldown: 3,
  rejection_cooldown_sec: 300,
  offer_mode: "sequential",
  batch_size: 3,
  match_radius_km: 3,
  assign_timeout_sec: 45,
  min_driver_rating: 0,
  max_driver_active_trips: 1,
  require_vehicle_category_match: true,
  require_payment_method_support: false,
  exclude_offline_drivers: true,
  exclude_busy_drivers: true,
  distance_weight: 0.7,
  rating_weight: 0.3,
  max_candidates_returned: 20,
  max_queue_size: 12,
  priority_mode: "balanced",
  auto_reassign: true,
  reassign_max_attempts: 3,
  reassign_delay_sec: 30,
  escalation_action: "notify_dispatcher",
  active_zone_ids: [],
  zone_overrides: {},
  cross_zone_assign_allowed: false,
  enabled_service_types: ["RIDE", "DELIVERY", "DELIVERY_CARGO"],
  auto_start_dispatch_on_create: true,
  manual_dispatch_allowed: true,
  per_service_overrides: {},
  console_poll_interval_sec: 15,
  shift_required: false,
  updated_at: new Date().toISOString(),
};

function normalizeDispatchRules(raw?: Partial<DispatchRules> | null): DispatchRules {
  return {
    ...DEFAULT_DISPATCH_RULES,
    ...(raw ?? {}),
    wave_radii_km: raw?.wave_radii_km?.length
      ? raw.wave_radii_km
      : DEFAULT_DISPATCH_RULES.wave_radii_km,
    active_zone_ids: raw?.active_zone_ids ?? [],
    zone_overrides: raw?.zone_overrides ?? {},
    enabled_service_types:
      raw?.enabled_service_types?.length
        ? raw.enabled_service_types
        : DEFAULT_DISPATCH_RULES.enabled_service_types,
    per_service_overrides: raw?.per_service_overrides ?? {},
    updated_at: raw?.updated_at ?? new Date().toISOString(),
  };
}

export const dispatchRulesService = {
  get: async () => {
    try {
      const response = await apiClient.get<ApiDispatchConfigResponse>(
        LINKS.admin.v1.dispatchConfig
      );
      return normalizeDispatchRules(response.document?.global);
    } catch {
      const legacy = await apiClient.get<Partial<DispatchRules>>(
        LINKS.admin.settings.dispatchRules.get
      );
      return normalizeDispatchRules(legacy);
    }
  },

  update: async (payload: Partial<DispatchRules>) => {
    const normalized = normalizeDispatchRules(payload);
    try {
      await apiClient.put(LINKS.admin.v1.dispatchConfig, {
        schemaVersion: 2,
        global: normalized,
      });
      return normalized;
    } catch {
      const legacy = await apiClient.put<DispatchRules>(
        LINKS.admin.settings.dispatchRules.update,
        normalized
      );
      return normalizeDispatchRules(legacy);
    }
  },
};
