import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { ApiAdminOrdersFilterOptions } from "@/features/ops/api/adminOrders.api.types";
import { mapOrdersFilterOptions } from "@/features/ops/api/adminOrders.mapper";
import type { TripsScopeFilterOptions } from "@/shared/types";

export interface ApiAdminFilterOptionsResponse {
  status?: string;
  generatedAt?: string;
  filterOptions?: ApiAdminOrdersFilterOptions;
}

let franchiseNameCache: Map<string, string> | null = null;

/** GET /v1/admin/filter-options — franchises + partenaires pour filtres UI */
export async function fetchAdminFilterOptions(): Promise<TripsScopeFilterOptions> {
  const response = await apiClient.get<ApiAdminFilterOptionsResponse>(
    LINKS.admin.v1.filterOptions
  );
  return mapOrdersFilterOptions(response.filterOptions);
}

/** Lookup franchise id → name (WD-01 fallback retraits). */
export async function fetchFranchiseNameMap(): Promise<Map<string, string>> {
  if (franchiseNameCache) return franchiseNameCache;

  const map = new Map<string, string>();
  try {
    const options = await fetchAdminFilterOptions();
    for (const f of options.franchises) {
      map.set(String(f.id), f.name);
    }
  } catch {
    // ignore
  }

  franchiseNameCache = map;
  return map;
}

export function clearFranchiseNameCache(): void {
  franchiseNameCache = null;
}
