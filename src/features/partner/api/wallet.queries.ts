"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useScope } from "@/core/auth/useScope";
import type { DriverRechargeBatchPayload } from "@/features/finance/api/driverRecharge.v1.service";
import { partnerWalletService } from "./wallet.service";
import { notificationService } from "@/core/http/notificationService";
import type { ListParams } from "@/shared/types/listParams";

export function usePartnerWallet() {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: ["partner", "wallet", ownerId],
    queryFn: () => partnerWalletService.get(ownerId!),
    enabled: ownerId != null,
  });
}

export function usePartnerDriverRechargeStats() {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: ["partner", "wallet", "driver-transfers", "stats", ownerId],
    queryFn: () => partnerWalletService.getDriverRechargeStats(ownerId!),
    enabled: ownerId != null,
  });
}

export function usePartnerDriverTransfers(params?: ListParams) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: ["partner", "wallet", "driver-transfers", ownerId, params],
    queryFn: () => partnerWalletService.listDriverTransfers(ownerId!, params),
    enabled: ownerId != null,
  });
}

export function usePartnerWalletWithdraw() {
  const qc = useQueryClient();
  const { ownerId } = useScope();
  return useMutation({
    mutationFn: (amount_fcfa: number) => partnerWalletService.withdraw(ownerId!, amount_fcfa),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["partner", "wallet"] });
      notificationService.success(data.message);
    },
  });
}

export function usePartnerDriverRecharge() {
  const qc = useQueryClient();
  const { ownerId } = useScope();
  return useMutation({
    mutationFn: (payload: DriverRechargeBatchPayload) =>
      partnerWalletService.rechargeDrivers(ownerId!, payload),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["partner", "wallet"] });
      void qc.invalidateQueries({
        queryKey: ["partner", "wallet", "driver-transfers"],
      });
      notificationService.success(data.message);
    },
  });
}

export const partnerLedgerKeys = {
  all: ["partner", "ledger"] as const,
  list: (filters?: ListParams) => [...partnerLedgerKeys.all, "list", filters] as const,
};

export function usePartnerLedger(params?: ListParams) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerLedgerKeys.list(params),
    queryFn: () => partnerWalletService.ledger(ownerId!, params),
    enabled: ownerId != null,
  });
}

export const partnerSettlementsKeys = {
  all: ["partner", "settlements"] as const,
  list: (filters?: ListParams) => [...partnerSettlementsKeys.all, "list", filters] as const,
};

export function usePartnerSettlements(params?: ListParams) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerSettlementsKeys.list(params),
    queryFn: () => partnerWalletService.settlements(ownerId!, params),
    enabled: ownerId != null,
  });
}

export function usePartnerRevenue() {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: ["partner", "revenue", ownerId],
    queryFn: () => partnerWalletService.revenue(ownerId!),
    enabled: ownerId != null,
  });
}

export const partnerCashReconciliationsKeys = {
  all: ["partner", "cash-reconciliations"] as const,
  list: (filters?: ListParams) =>
    [...partnerCashReconciliationsKeys.all, "list", filters] as const,
};

export function usePartnerCashReconciliations(params?: ListParams) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerCashReconciliationsKeys.list(params),
    queryFn: () => partnerWalletService.cashReconciliations(ownerId!, params),
    enabled: ownerId != null,
  });
}

export function usePartnerRevenuePaginated(params?: ListParams) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: ["partner", "revenue", "paginated", ownerId, params],
    queryFn: () => partnerWalletService.revenue(ownerId!),
    enabled: ownerId != null,
  });
}
