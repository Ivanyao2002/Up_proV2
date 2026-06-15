import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import type { DispatchConsoleData } from "@/shared/types";
import type { FranchiseLiveMapFiltersValue } from "./liveMap.types";
import { franchiseLiveMapQueryParams } from "./liveMap.types";

export const franchiseDispatchService = {
  getConsole: (filters?: FranchiseLiveMapFiltersValue) => {
    const qs = filters ? franchiseLiveMapQueryParams(filters) : "";
    return useLegacyPortalApi()
      ? apiClient.get<DispatchConsoleData>(`/franchise/ops/dispatch${qs}`)
      : apiClient.get<DispatchConsoleData>(`${LINKS.franchise.v1.dispatchOrders}${qs}`);
  },

  assignDriver: (tripId: string, driverId: number) =>
    useLegacyPortalApi()
      ? apiClient.post<{ ok: boolean; message: string }>(
          `/franchise/ops/dispatch/trips/${tripId}/assign`,
          { driver_id: driverId }
        )
      : apiClient.post<{ ok: boolean; message: string }>(
          LINKS.franchise.v1.dispatchAssign(tripId),
          { driver_id: driverId }
        ),
};
