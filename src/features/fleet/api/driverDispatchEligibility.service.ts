import { apiClient } from "@/core/http/apiClient";
import { ApiError } from "@/core/http/errorHandler";
import { LINKS } from "@/core/api/links";
import type { ApiDriverDispatchEligibilityResponse } from "./driverDispatchEligibility.api.types";
import {
  mapApiDispatchEligibility,
  type DriverDispatchFiltersView,
} from "./driverDispatchEligibility.mapper";

export const driverDispatchEligibilityService = {
  getByDriverId: async (
    driverId: string
  ): Promise<DriverDispatchFiltersView | null> => {
    try {
      const response = await apiClient.get<ApiDriverDispatchEligibilityResponse>(
        LINKS.v1.drivers.dispatchEligibility(driverId)
      );
      return mapApiDispatchEligibility(response, driverId);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
        return null;
      }
      throw error;
    }
  },
};
