"use client";

import { useQuery } from "@tanstack/react-query";
import { dispatchLogsService } from "./dispatchLogs.service";

export const dispatchLogsKeys = {
  all: ["ops", "dispatch-logs"] as const,
  order: (orderId: string, serviceType?: string) =>
    [...dispatchLogsKeys.all, orderId, serviceType ?? "RIDE"] as const,
};

export function useDispatchLogs(
  orderId: string,
  serviceType?: string,
  enabled = true
) {
  return useQuery({
    queryKey: dispatchLogsKeys.order(orderId, serviceType),
    queryFn: () => dispatchLogsService.getByOrder(orderId, serviceType),
    enabled: Boolean(orderId) && enabled,
    staleTime: 20_000,
  });
}
