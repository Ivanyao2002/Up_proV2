"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import { adminDriverTransfersService } from "./driverTransfers.service";
import { rechargeDriversViaPartner } from "./adminDriverRecharge.service";
import type { DriverRechargeBatchPayload } from "./driverRecharge.v1.service";
import type { ListParams } from "@/shared/types/listParams";

export function useAdminDriverRechargeStats() {
  return useQuery({
    queryKey: ["admin", "finance", "driver-transfers", "stats"],
    queryFn: () => adminDriverTransfersService.getStats(),
  });
}

export function useAdminDriverTransfers(params?: ListParams) {
  return useQuery({
    queryKey: ["admin", "finance", "driver-transfers", params],
    queryFn: () => adminDriverTransfersService.list(params),
  });
}

export function useAdminDriverRecharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      payload: DriverRechargeBatchPayload & { partnerId: string }
    ) =>
      rechargeDriversViaPartner(payload.partnerId, {
        driver_ids: payload.driver_ids,
        amount_fcfa: payload.amount_fcfa,
        note: payload.note,
      }),
    onSuccess: (data) => {
      void qc.invalidateQueries({
        queryKey: ["admin", "finance", "driver-transfers"],
      });
      notificationService.success(data.message);
    },
  });
}
