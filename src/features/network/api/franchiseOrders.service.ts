import { apiClient } from "@/core/http/apiClient";
import { ApiError } from "@/core/http/errorHandler";
import { LINKS, appendQuery } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import {
  mapFranchiseOrdersToTripsList,
  type ApiFranchiseOrdersResponse,
} from "@/features/franchise/api/franchisePortal.mapper";
import type { TripsListResponse } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";

const emptyOrdersResponse = (
  params?: ListParams
): ApiFranchiseOrdersResponse => ({
  status: "success",
  orders: [],
  pagination: {
    total: 0,
    page: params?.page ?? 1,
    limit: params?.per_page ?? 25,
    totalPages: 1,
  },
});

export const franchiseOrdersService = {
  list: async (
    franchiseId: string,
    params?: ListParams
  ): Promise<TripsListResponse> => {
    try {
      const response = await apiClient.get<ApiFranchiseOrdersResponse>(
        appendQuery(
          LINKS.franchise.v1.orders(franchiseId),
          buildV1ListQuery(params)
        )
      );
      return mapFranchiseOrdersToTripsList(response, params);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return mapFranchiseOrdersToTripsList(emptyOrdersResponse(params), params);
      }
      throw error;
    }
  },
};
