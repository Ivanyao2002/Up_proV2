"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useScopeQueryKey } from "@/core/auth/scopeQueryKey";
import { notificationService } from "@/core/http/notificationService";
import { ApiError } from "@/core/http/errorHandler";
import type { Driver } from "@/shared/types";
import { driverDetailKeys } from "./driverDetail.keys";
import { driversKeys } from "./drivers.keys";
import { franchiseDriversKeys } from "@/features/franchise/api/drivers.queries";
import {
  transferDriverToPartner,
  prepareBulkDriverTransfers,
  runBulkTransferDriversToPartner,
  type DriverPartnerTransferPayload,
  type DriverPartnerTransferResult,
} from "./driverTransfer.service";

const TRANSFER_ERROR_MESSAGES: Record<string, string> = {
  PARTNER_FRANCHISE_ACCESS_DENIED:
    "Vous n'avez pas les droits pour transférer ce chauffeur.",
  PARTNER_TRANSFER_CROSS_FRANCHISE_FORBIDDEN:
    "Transfert inter-franchise interdit. Contactez un administrateur plateforme.",
  DRIVER_NOT_FOUND: "Chauffeur introuvable.",
  TARGET_PARTNER_ID_REQUIRED: "Sélectionnez un partenaire de destination.",
  PARTNER_TRANSFER_SAME:
    "Le partenaire de destination doit être différent du partenaire actuel.",
  PARTNER_ARCHIVED: "Le partenaire source ou cible est archivé.",
  DRIVER_HAS_ACTIVE_RIDE:
    "Le chauffeur a une course en cours. Terminez-la avant le transfert.",
};

function transferSuccessMessage(result: DriverPartnerTransferResult): string {
  const count = result.transferredVehicleCount;
  if (count > 0) {
    return `Chauffeur transféré avec ${count} véhicule${count > 1 ? "s" : ""}.`;
  }
  return "Chauffeur transféré vers le nouveau partenaire.";
}

export function useTransferDriverToPartner(driverId: string) {
  const qc = useQueryClient();
  const scopeKey = useScopeQueryKey();

  return useMutation({
    mutationFn: ({
      sourcePartnerId,
      ...payload
    }: DriverPartnerTransferPayload & { sourcePartnerId: string }) =>
      transferDriverToPartner(sourcePartnerId, driverId, payload),
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: driverDetailKeys.detail(driverId) });
      void qc.invalidateQueries({ queryKey: driversKeys.all(scopeKey) });
      void qc.invalidateQueries({ queryKey: franchiseDriversKeys.all });
      notificationService.success(transferSuccessMessage(result));
    },
    onError: (error: Error) => {
      if (error instanceof ApiError && TRANSFER_ERROR_MESSAGES[error.code]) {
        notificationService.error(TRANSFER_ERROR_MESSAGES[error.code]);
        return;
      }
      notificationService.error(error.message || "Transfert impossible");
    },
  });
}

function bulkTransferSuccessMessage(
  successCount: number,
  vehicleCount: number,
  skippedCount: number,
  failedCount: number
): string {
  const parts: string[] = [];
  if (successCount > 0) {
    parts.push(
      `${successCount} chauffeur${successCount > 1 ? "s" : ""} transféré${successCount > 1 ? "s" : ""}`
    );
    if (vehicleCount > 0) {
      parts.push(`${vehicleCount} véhicule${vehicleCount > 1 ? "s" : ""}`);
    }
  }
  if (skippedCount > 0) {
    parts.push(`${skippedCount} ignoré${skippedCount > 1 ? "s" : ""}`);
  }
  if (failedCount > 0) {
    parts.push(`${failedCount} échec${failedCount > 1 ? "s" : ""}`);
  }
  return parts.join(" · ") || "Aucun transfert effectué.";
}

export function useBulkTransferDriversToPartner() {
  const qc = useQueryClient();
  const scopeKey = useScopeQueryKey();

  return useMutation({
    mutationFn: ({
      drivers,
      ids,
      targetPartnerId,
      reason,
    }: {
      drivers: Driver[];
      ids: Array<string | number>;
      targetPartnerId: string;
      reason?: string;
    }) => {
      const { eligible, skippedCount } = prepareBulkDriverTransfers(
        drivers,
        ids,
        targetPartnerId
      );
      if (eligible.length === 0) {
        return Promise.resolve({
          successCount: 0,
          skippedCount,
          failedCount: 0,
          vehicleCount: 0,
          failures: [],
        });
      }
      return runBulkTransferDriversToPartner(eligible, {
        targetPartnerId,
        reason,
      }).then((result) => ({ ...result, skippedCount }));
    },
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: driversKeys.all(scopeKey) });
      void qc.invalidateQueries({ queryKey: franchiseDriversKeys.all });
      void qc.invalidateQueries({ queryKey: driverDetailKeys.all });

      if (result.successCount === 0 && result.failedCount === 0) {
        notificationService.warning(
          "Aucun chauffeur éligible au transfert (partenaire manquant ou déjà sur la cible)."
        );
        return;
      }

      if (result.failedCount > 0) {
        const first = result.failures[0];
        notificationService.warning(
          `${bulkTransferSuccessMessage(
            result.successCount,
            result.vehicleCount,
            result.skippedCount,
            result.failedCount
          )}${first ? ` — ${first.driverName}: ${first.message}` : ""}`
        );
        return;
      }

      notificationService.success(
        bulkTransferSuccessMessage(
          result.successCount,
          result.vehicleCount,
          result.skippedCount,
          result.failedCount
        )
      );
    },
    onError: (error: Error) => {
      if (error instanceof ApiError && TRANSFER_ERROR_MESSAGES[error.code]) {
        notificationService.error(TRANSFER_ERROR_MESSAGES[error.code]);
        return;
      }
      notificationService.error(error.message || "Transfert groupé impossible");
    },
  });
}
