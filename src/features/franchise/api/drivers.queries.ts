"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import { franchiseDashboardKeys } from "./dashboard.queries";
import { franchiseDriversService } from "./drivers.service";

export const franchiseDriversKeys = {
  all: ["franchise", "drivers"] as const,
  list: () => [...franchiseDriversKeys.all, "list"] as const,
  kycQueue: () => [...franchiseDriversKeys.all, "kyc-queue"] as const,
  detail: (id: string) => [...franchiseDriversKeys.all, "detail", id] as const,
};

export function useFranchiseDriversList() {
  return useQuery({
    queryKey: franchiseDriversKeys.list(),
    queryFn: () => franchiseDriversService.list(),
  });
}

export function useFranchiseKycQueue() {
  return useQuery({
    queryKey: franchiseDriversKeys.kycQueue(),
    queryFn: () => franchiseDriversService.kycQueue(),
  });
}

export function useFranchiseDriverDetail(id: string) {
  return useQuery({
    queryKey: franchiseDriversKeys.detail(id),
    queryFn: () => franchiseDriversService.getById(id),
    enabled: Boolean(id),
  });
}

function invalidateFranchiseDriverQueries(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: franchiseDriversKeys.all });
  void qc.invalidateQueries({ queryKey: franchiseDashboardKeys.all });
}

export function useApproveFranchiseDriverKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (driverId: string) => franchiseDriversService.approveKyc(driverId),
    onSuccess: (data) => {
      invalidateFranchiseDriverQueries(qc);
      notificationService.success(data.message);
    },
    onError: () => notificationService.error("Approbation impossible"),
  });
}

export function useRejectFranchiseDriverKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ driverId, reason }: { driverId: string; reason: string }) =>
      franchiseDriversService.rejectKyc(driverId, reason),
    onSuccess: (data) => {
      invalidateFranchiseDriverQueries(qc);
      notificationService.success(data.message);
    },
    onError: () => notificationService.error("Rejet impossible"),
  });
}

export function useApproveFranchiseDocument(driverId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) =>
      franchiseDriversService.approveDocument(driverId, docId),
    onSuccess: () => {
      invalidateFranchiseDriverQueries(qc);
      notificationService.success("Document validé");
    },
  });
}

export function useRejectFranchiseDocument(driverId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ docId, reason }: { docId: string; reason: string }) =>
      franchiseDriversService.rejectDocument(driverId, docId, reason),
    onSuccess: () => {
      invalidateFranchiseDriverQueries(qc);
      notificationService.warning("Document rejeté");
    },
  });
}
