import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { ComptaApiScope } from "@/features/compta/api/comptaApiScope";
import { comptaFinanceLinks } from "@/features/compta/api/comptaApiScope";
import type { ApiAdminOrdersFilterOptions } from "@/features/ops/api/adminOrders.api.types";
import { mapOrdersFilterOptions } from "@/features/ops/api/adminOrders.mapper";
import type { TripsScopeFilterOptions } from "@/shared/types";

export interface ApiAdminFilterOptionsResponse {
  status?: string;
  generatedAt?: string;
  filterOptions?: ApiAdminOrdersFilterOptions;
}

const franchiseNameCache = new Map<ComptaApiScope, Map<string, string>>();

/** GET filter-options — admin ou portail comptable (scopé pays). */
export async function fetchScopeFilterOptions(
  scope: ComptaApiScope = "admin"
): Promise<TripsScopeFilterOptions> {
  const response = await apiClient.get<ApiAdminFilterOptionsResponse>(
    comptaFinanceLinks(scope).filterOptions
  );
  return mapOrdersFilterOptions(response.filterOptions);
}

/** @deprecated Préférer `fetchScopeFilterOptions("admin")` */
export async function fetchAdminFilterOptions(): Promise<TripsScopeFilterOptions> {
  return fetchScopeFilterOptions("admin");
}

/** Lookup franchise id → name pour retraits / listes. */
export async function fetchFranchiseNameMap(
  scope: ComptaApiScope = "admin"
): Promise<Map<string, string>> {
  const cached = franchiseNameCache.get(scope);
  if (cached) return cached;

  const map = new Map<string, string>();
  try {
    const options = await fetchScopeFilterOptions(scope);
    for (const f of options.franchises) {
      map.set(String(f.id), f.name);
    }
  } catch {
    // ignore
  }

  franchiseNameCache.set(scope, map);
  return map;
}

export function clearFranchiseNameCache(): void {
  franchiseNameCache.clear();
}
