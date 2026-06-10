"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  partnerWalletService,
  type DriverRechargeBatchPayload,
} from "./wallet.service";
import { notificationService } from "@/core/http/notificationService";
import type { ListParams } from "@/shared/types/listParams";

export function usePartnerWallet() {
  return useQuery({
    queryKey: ["partner", "wallet"],
    queryFn: () => partnerWalletService.get(),
  });
}

export function usePartnerDriverRechargeStats() {
  return useQuery({
    queryKey: ["partner", "wallet", "driver-transfers", "stats"],
    queryFn: () => partnerWalletService.getDriverRechargeStats(),
  });
}

export function usePartnerDriverTransfers(params?: ListParams) {
  return useQuery({
    queryKey: ["partner", "wallet", "driver-transfers", params],
    queryFn: () => partnerWalletService.listDriverTransfers(params),
  });
}

export function usePartnerWalletWithdraw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (amount_fcfa: number) => partnerWalletService.withdraw(amount_fcfa),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["partner", "wallet"] });
      notificationService.success(data.message);
    },
  });
}

export function usePartnerDriverRecharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DriverRechargeBatchPayload) =>
      partnerWalletService.rechargeDrivers(payload),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["partner", "wallet"] });
      void qc.invalidateQueries({
        queryKey: ["partner", "wallet", "driver-transfers"],
      });
      notificationService.success(data.message);
    },
  });
}
