import { apiClient } from "@/core/http/apiClient";
import { ApiError } from "@/core/http/errorHandler";
import { LINKS, appendQuery } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import { resolveFranchiseId } from "@/core/api/franchiseContext.service";
import type { ApiV1FranchisePartnersResponse } from "@/features/network/api/adminFranchises.api.types";
import type { TripDetail, TripsListResponse } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import {
  mapFranchiseOrdersToTripsList,
  mapFranchiseOrderToTripDetail,
  type ApiFranchiseOrdersResponse,
  type ApiFranchiseOrderDetailResponse,
} from "./franchisePortal.mapper";

/**
 * Helper to handle API errors gracefully
 * Returns empty list for 404/not-found instead of throwing
 */
async function fetchOrdersWithFallback(
  franchiseId: string,
  params?: ListParams
): Promise<ApiFranchiseOrdersResponse> {
  try {
    return await apiClient.get<ApiFranchiseOrdersResponse>(
      appendQuery(
        LINKS.franchise.v1.orders(franchiseId),
        buildV1ListQuery(params)
      )
    );
  } catch (error) {
    // Handle 404 as "no results" rather than error
    if (error instanceof ApiError && error.status === 404) {
      return { status: "success", orders: [], pagination: { total: 0, page: 1, limit: params?.per_page ?? 25, totalPages: 1 } };
    }
    throw error;
  }
}

export const franchiseTripsService = {
  list: async (params?: ListParams): Promise<TripsListResponse> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<TripsListResponse>(
        `${LINKS.franchise.ops.trips.list}${buildListQuery(params)}`
      );
    }

    const franchiseId = await resolveFranchiseId();
    const [ordersResponse, partnersResponse] = await Promise.all([
      fetchOrdersWithFallback(franchiseId, params),
      apiClient.get<ApiV1FranchisePartnersResponse>(
        appendQuery(
          LINKS.franchise.v1.partners(franchiseId),
          buildV1ListQuery({ per_page: 100 }) // Get all partners for filter
        )
      ),
    ]);
    return mapFranchiseOrdersToTripsList(ordersResponse, params, partnersResponse);
  },

  getById: async (id: string): Promise<TripDetail> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<TripDetail>(`${LINKS.franchise.ops.trips.getById(id)}`);
    }

    const franchiseId = await resolveFranchiseId();
    const response = await apiClient.get<ApiFranchiseOrderDetailResponse>(
      LINKS.franchise.v1.orderById(franchiseId, id)
    );
    return mapFranchiseOrderToTripDetail(response);
  },
};
