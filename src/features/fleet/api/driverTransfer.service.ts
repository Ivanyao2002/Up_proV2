import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { DriverDetail } from "@/shared/types";
import type { Driver } from "@/shared/types";

export interface DriverPartnerTransferPayload {
  targetPartnerId: string;
  reason?: string;
}

export interface DriverPartnerTransferResult {
  driver: Record<string, unknown>;
  vehicles: Record<string, unknown>[];
  fromPartnerId: string;
  toPartnerId: string;
  transferredVehicleCount: number;
}

interface ApiDriverPartnerTransferResponse {
  driver?: Record<string, unknown>;
  vehicles?: Record<string, unknown>[];
  from_partner_id?: string;
  fromPartnerId?: string;
  to_partner_id?: string;
  toPartnerId?: string;
  transferred_vehicle_count?: number;
  transferredVehicleCount?: number;
}

export function resolveDriverSourcePartnerId(
  driver: Pick<DriverDetail, "owner_id" | "partner_id"> | Pick<Driver, "owner_id">
): string | null {
  const id =
    "partner_id" in driver && driver.partner_id != null
      ? driver.partner_id
      : driver.owner_id;
  if (id == null || id === "") return null;
  return String(id);
}

export interface BulkDriverTransferItem {
  driverId: string;
  sourcePartnerId: string;
  driverName: string;
}

export interface BulkDriverTransferResult {
  successCount: number;
  skippedCount: number;
  failedCount: number;
  vehicleCount: number;
  failures: { driverId: string; driverName: string; message: string }[];
}

export function prepareBulkDriverTransfers(
  drivers: Driver[],
  ids: Array<string | number>,
  targetPartnerId: string
): { eligible: BulkDriverTransferItem[]; skippedCount: number } {
  const idSet = new Set(ids.map(String));
  const target = String(targetPartnerId);
  let skippedCount = 0;
  const eligible: BulkDriverTransferItem[] = [];

  for (const driver of drivers) {
    if (!idSet.has(String(driver.id))) continue;
    const sourcePartnerId = resolveDriverSourcePartnerId(driver);
    if (!sourcePartnerId) {
      skippedCount += 1;
      continue;
    }
    if (sourcePartnerId === target) {
      skippedCount += 1;
      continue;
    }
    eligible.push({
      driverId: String(driver.id),
      sourcePartnerId,
      driverName: `${driver.first_name} ${driver.last_name}`.trim(),
    });
  }

  return { eligible, skippedCount };
}

export async function runBulkTransferDriversToPartner(
  items: BulkDriverTransferItem[],
  payload: DriverPartnerTransferPayload
): Promise<BulkDriverTransferResult> {
  const failures: BulkDriverTransferResult["failures"] = [];
  let successCount = 0;
  let vehicleCount = 0;

  for (const item of items) {
    try {
      const result = await transferDriverToPartner(
        item.sourcePartnerId,
        item.driverId,
        payload
      );
      successCount += 1;
      vehicleCount += result.transferredVehicleCount;
    } catch (error) {
      failures.push({
        driverId: item.driverId,
        driverName: item.driverName,
        message:
          error instanceof Error ? error.message : "Transfert impossible",
      });
    }
  }

  return {
    successCount,
    skippedCount: 0,
    failedCount: failures.length,
    vehicleCount,
    failures,
  };
}

export async function transferDriverToPartner(
  sourcePartnerId: string,
  driverId: string,
  payload: DriverPartnerTransferPayload
): Promise<DriverPartnerTransferResult> {
  const body: Record<string, string> = {
    target_partner_id: payload.targetPartnerId,
    targetPartnerId: payload.targetPartnerId,
  };
  if (payload.reason?.trim()) {
    body.reason = payload.reason.trim();
  }

  const response = await apiClient.post<ApiDriverPartnerTransferResponse>(
    LINKS.v1.partners.transferDriver(sourcePartnerId, driverId),
    body
  );

  return {
    driver: response.driver ?? {},
    vehicles: response.vehicles ?? [],
    fromPartnerId:
      response.fromPartnerId ?? response.from_partner_id ?? sourcePartnerId,
    toPartnerId:
      response.toPartnerId ?? response.to_partner_id ?? payload.targetPartnerId,
    transferredVehicleCount:
      response.transferredVehicleCount ??
      response.transferred_vehicle_count ??
      (response.vehicles?.length ?? 0),
  };
}
