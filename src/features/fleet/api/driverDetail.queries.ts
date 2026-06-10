"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useScopeQueryKey } from "@/core/auth/scopeQueryKey";
import { driverDetailKeys } from "./driverDetail.keys";
import { driverDetailService } from "./driverDetail.service";
import { driversKeys } from "./drivers.keys";
import { kycKeys } from "./kyc.keys";
import { kycService } from "./kyc.service";
import { notificationService } from "@/core/http/notificationService";

export function useDriverDetail(id: string) {
  return useQuery({
    queryKey: driverDetailKeys.detail(id),
    queryFn: () => driverDetailService.getById(id),
    enabled: Boolean(id),
  });
}

export function useDriverTrips(id: string) {
  return useQuery({
    queryKey: driverDetailKeys.trips(id),
    queryFn: () => driverDetailService.getTrips(id),
    enabled: Boolean(id),
  });
}

export function useDriverWalletTransactions(id: string, enabled = true) {
  return useQuery({
    queryKey: driverDetailKeys.walletTransactions(id),
    queryFn: () => driverDetailService.getWalletTransactions(id),
    enabled: Boolean(id) && enabled,
  });
}

export function useApproveDriverKyc(id: string) {
  const qc = useQueryClient();
  const scopeKey = useScopeQueryKey();
  return useMutation({
    mutationFn: () => driverDetailService.approveKyc(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: driverDetailKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: driversKeys.all(scopeKey) });
      notificationService.success("Compte chauffeur approuvé");
    },
  });
}

export function useRejectDriverKyc(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => driverDetailService.rejectKyc(id, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: driverDetailKeys.detail(id) });
      notificationService.warning("Demande de correction envoyée");
    },
  });
}

export function useSuspendDriver(id: string) {
  const qc = useQueryClient();
  const scopeKey = useScopeQueryKey();
  return useMutation({
    mutationFn: () => driverDetailService.suspend(id),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: driverDetailKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: driversKeys.all(scopeKey) });
      notificationService.success(data.message);
    },
  });
}

export function useApproveKycDocument(driverId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => kycService.approveDocument(documentId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: driverDetailKeys.detail(driverId) });
      void qc.invalidateQueries({ queryKey: kycKeys.all });
    },
  });
}

export function useRejectKycDocument(driverId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      documentId,
      reason,
    }: {
      documentId: string;
      reason: string;
    }) => kycService.rejectDocument(documentId, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: driverDetailKeys.detail(driverId) });
      void qc.invalidateQueries({ queryKey: kycKeys.all });
    },
  });
}

export function useActivateDriver(id: string) {
  const qc = useQueryClient();
  const scopeKey = useScopeQueryKey();
  return useMutation({
    mutationFn: () => driverDetailService.activate(id),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: driverDetailKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: driversKeys.all(scopeKey) });
      notificationService.success(data.message);
    },
  });
}

export function useSetDriverAvailability(id: string) {
  const qc = useQueryClient();
  const scopeKey = useScopeQueryKey();
  return useMutation({
    mutationFn: (availability: "online" | "offline") =>
      driverDetailService.setAvailability(id, availability),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: driverDetailKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: driversKeys.all(scopeKey) });
      notificationService.success(data.message);
    },
  });
}
