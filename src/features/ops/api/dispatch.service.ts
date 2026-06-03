import { apiClient } from "@/core/http/apiClient";
import type { DispatchConsoleData, Trip } from "@/shared/types";

export const dispatchService = {
  getConsole: () => apiClient.get<DispatchConsoleData>("/admin/ops/dispatch"),

  assignDriver: (tripId: string, driverId: number) =>
    apiClient.post<{ ok: boolean; trip: Trip; message: string }>(
      `/admin/ops/dispatch/trips/${tripId}/assign`,
      { driver_id: driverId }
    ),
};
