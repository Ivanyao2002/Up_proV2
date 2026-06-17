"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import { useComptaApiScope } from "@/features/compta/api/useComptaApiScope";
import { adminDriverTransfersService } from "./driverTransfers.service";
import { rechargeDriversViaPartner } from "./adminDriverRecharge.service";
import type { DriverRechargeBatchPayload } from "./driverRecharge.v1.service";
import type { ListParams } from "@/shared/types/listParams";

export function useAdminDriverRechargeStats() {
  const scope = useComptaApiScope();
  return useQuery({
    queryKey: ["finance", "driver-transfers", "stats", scope],
    queryFn: () => adminDriverTransfersService.getStats(scope),
  });
}

export function useAdminDriverTransfers(params?: ListParams) {
  const scope = useComptaApiScope();
  return useQuery({
    queryKey: ["finance", "driver-transfers", scope, params],
    queryFn: () => adminDriverTransfersService.list(params, scope),
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
        queryKey: ["finance", "driver-transfers"],
      });
      notificationService.success(data.message);
    },
  });
}
