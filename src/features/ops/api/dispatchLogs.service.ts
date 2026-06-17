import { apiClient } from "@/core/http/apiClient";
import { ApiError } from "@/core/http/errorHandler";
import { env } from "@/core/config/env";
import { LINKS } from "@/core/api/links";
import type { ApiDispatchLogsResponse } from "./dispatchLogs.api.types";
import {
  mapApiDispatchLogsResponse,
  type DispatchLogEntry,
} from "./dispatchLogs.mapper";

function useLegacyDispatchLogs(): boolean {
  return env.useMocks && !env.useRealAuth;
}

export const dispatchLogsService = {
  getByOrder: async (
    orderId: string,
    apiServiceType = "RIDE"
  ): Promise<DispatchLogEntry[]> => {
    if (useLegacyDispatchLogs()) {
      return [];
    }

    try {
      const response = await apiClient.get<ApiDispatchLogsResponse>(
        LINKS.admin.v1.dispatchLogs(apiServiceType, orderId)
      );
      return mapApiDispatchLogsResponse(response);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
        return [];
      }
      throw error;
    }
  },
};
