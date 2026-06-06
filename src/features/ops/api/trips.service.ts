import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import { fetchAdminFilterOptions } from "@/features/admin/api/adminFilterOptions.service";
import {
  fetchAdminDriversList,
  fetchAdminOrdersList,
} from "@/features/admin/api/adminEntityLookup.service";
import type { TripsListResponse } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type { ApiAdminDashboardResponse } from "./dashboard.api.types";
import {
  mapAdminOrdersToTripsListResponse,
  mapOrdersFilterOptions,
} from "./adminOrders.mapper";
import { mapDashboardFilterOptions } from "./dashboard.mapper";

async function resolveTripsFilterOptions(
  ordersFilterOptions: ReturnType<typeof mapOrdersFilterOptions>
): Promise<ReturnType<typeof mapOrdersFilterOptions>> {
  const hasFranchises = ordersFilterOptions.franchises.length > 0;
  const hasPartners = ordersFilterOptions.partners.length > 0;
  if (hasFranchises && hasPartners) return ordersFilterOptions;

  try {
    return await fetchAdminFilterOptions();
  } catch {
    // fallback dashboard
  }

  try {
    const dashboard = await apiClient.get<ApiAdminDashboardResponse>(
      LINKS.admin.v1.dashboard
    );
    return mapDashboardFilterOptions(dashboard);
  } catch {
    return ordersFilterOptions;
  }
}

export const tripsService = {
  listAdmin: async (params?: ListParams): Promise<TripsListResponse> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<TripsListResponse>(
        `/admin/ops/trips${buildListQuery(params)}`
      );
    }

    const [orders, drivers] = await Promise.all([
      fetchAdminOrdersList(params),
      fetchAdminDriversList({ page: 1, per_page: 100 }),
    ]);
    const driversById = new Map(
      (drivers.items ?? []).map((d) => [d.id, d])
    );
    const filterOptions = await resolveTripsFilterOptions(
      mapOrdersFilterOptions(orders.filterOptions)
    );
    return mapAdminOrdersToTripsListResponse(
      orders,
      driversById,
      params,
      filterOptions,
      orders.pagination
    );
  },
};
