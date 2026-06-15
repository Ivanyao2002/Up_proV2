import type { Driver } from "@/shared/types";
import { franchiseDriversService } from "./drivers.service";

export type DriverAvailabilityAction = "online" | "offline";

export interface DriverFranchiseActionResult {
  ok: boolean;
  message: string;
}

export function canSetDriverAvailability(driver: Pick<Driver, "account_status">): boolean {
  return driver.account_status === "approved";
}

export function isDriverSuspended(driver: Pick<Driver, "account_status">): boolean {
  return driver.account_status === "suspended";
}

export async function runBulkDriverAvailability(
  drivers: Driver[],
  ids: Array<string | number>,
  availability: DriverAvailabilityAction
): Promise<{ count: number; message: string }> {
  const idSet = new Set(ids.map(String));
  const eligible = drivers.filter(
    (d) => idSet.has(String(d.id)) && canSetDriverAvailability(d)
  );

  for (const driver of eligible) {
    await franchiseDriversService.setAvailability(String(driver.id), availability);
  }

  return {
    count: eligible.length,
    message:
      availability === "online"
        ? `${eligible.length} chauffeur(s) mis en ligne`
        : `${eligible.length} chauffeur(s) mis hors ligne`,
  };
}

export async function runBulkSuspendDrivers(
  drivers: Driver[],
  ids: Array<string | number>
): Promise<{ count: number; message: string }> {
  const idSet = new Set(ids.map(String));
  const eligible = drivers.filter(
    (d) => idSet.has(String(d.id)) && canSetDriverAvailability(d)
  );

  for (const driver of eligible) {
    await franchiseDriversService.suspend(String(driver.id));
  }

  return {
    count: eligible.length,
    message: `${eligible.length} chauffeur(s) suspendu(s)`,
  };
}

export async function runBulkActivateDrivers(
  drivers: Driver[],
  ids: Array<string | number>
): Promise<{ count: number; message: string }> {
  const idSet = new Set(ids.map(String));
  const eligible = drivers.filter(
    (d) => idSet.has(String(d.id)) && isDriverSuspended(d)
  );

  for (const driver of eligible) {
    await franchiseDriversService.unsuspend(String(driver.id));
  }

  return {
    count: eligible.length,
    message: `${eligible.length} chauffeur(s) réactivé(s)`,
  };
}
