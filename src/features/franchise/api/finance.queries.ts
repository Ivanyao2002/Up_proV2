"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  franchiseFinanceService,
  type FranchiseDriverRechargeBatchPayload,
  type FranchisePartnerRechargePayload,
} from "./finance.service";
import { notificationService } from "@/core/http/notificationService";
import type { ListParams } from "@/shared/types/listParams";

export const franchiseFinanceKeys = {
  all: ["franchise", "finance"] as const,
  driverTransfers: (params?: ListParams) =>
    [...franchiseFinanceKeys.all, "driver-transfers", params] as const,
  driverStats: () =>
    [...franchiseFinanceKeys.all, "driver-transfers", "stats"] as const,
  partnerTransfers: (params?: ListParams) =>
    [...franchiseFinanceKeys.all, "partner-transfers", params] as const,
  partnerStats: () =>
    [...franchiseFinanceKeys.all, "partner-transfers", "stats"] as const,
};

export function useFranchiseFinance() {
  return useQuery({
    queryKey: franchiseFinanceKeys.all,
    queryFn: () => franchiseFinanceService.get(),
  });
}

export function useFranchiseDriverRechargeStats() {
  return useQuery({
    queryKey: franchiseFinanceKeys.driverStats(),
    queryFn: () => franchiseFinanceService.getDriverRechargeStats(),
  });
}

export function useFranchiseDriverTransfers(params?: ListParams) {
  return useQuery({
    queryKey: franchiseFinanceKeys.driverTransfers(params),
    queryFn: () => franchiseFinanceService.listDriverTransfers(params),
  });
}

export function useFranchiseDriverRecharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FranchiseDriverRechargeBatchPayload) =>
      franchiseFinanceService.rechargeDrivers(payload),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: franchiseFinanceKeys.all });
      notificationService.success(data.message);
    },
  });
}

export function useFranchisePartnerRechargeStats() {
  return useQuery({
    queryKey: franchiseFinanceKeys.partnerStats(),
    queryFn: () => franchiseFinanceService.getPartnerRechargeStats(),
  });
}

export function useFranchisePartnerTransfers(params?: ListParams) {
  return useQuery({
    queryKey: franchiseFinanceKeys.partnerTransfers(params),
    queryFn: () => franchiseFinanceService.listPartnerTransfers(params),
  });
}

export function useFranchisePartnerRecharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FranchisePartnerRechargePayload) =>
      franchiseFinanceService.rechargePartner(payload),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: franchiseFinanceKeys.all });
      notificationService.success(data.message);
    },
  });
}
