import type { Driver } from "@/shared/types";

export const driverAccountStatusOverrides: Record<
  string,
  Driver["account_status"]
> = {};

export const driverAvailabilityOverrides: Record<string, Driver["availability"]> =
  {};

export function applyDriverAdminOverrides(driver: Driver): Driver {
  const id = String(driver.id);
  return {
    ...driver,
    account_status:
      driverAccountStatusOverrides[id] ?? driver.account_status,
    availability: driverAvailabilityOverrides[id] ?? driver.availability,
  };
}
