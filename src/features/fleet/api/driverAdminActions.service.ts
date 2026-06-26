import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { env } from "@/core/config/env";
import type { Driver } from "@/shared/types";

export type DriverAvailabilityAction = "online" | "offline";

export interface DriverAdminActionResult {
  ok: boolean;
  message: string;
}

function useLegacyDriverAdminApi(): boolean {
  return env.useMocks && !env.useRealAuth;
}

export async function setDriverAvailability(
  id: string | number,
  availability: DriverAvailabilityAction
): Promise<DriverAdminActionResult> {
  const driverId = String(id);

  if (useLegacyDriverAdminApi()) {
    return apiClient.post<DriverAdminActionResult>(
      `/admin/drivers/${driverId}/set-availability`,
      { availability }
    );
  }

  await apiClient.patch(LINKS.admin.v1.driverById(driverId), {
    availability_status: availability,
    availability,
  });

  return {
    ok: true,
    message:
      availability === "online"
        ? "Chauffeur mis en ligne"
        : "Chauffeur mis hors ligne",
  };
}

export async function suspendDriverAccount(
  id: string | number
): Promise<DriverAdminActionResult> {
  const driverId = String(id);

  if (useLegacyDriverAdminApi()) {
    const res = await apiClient.post<DriverAdminActionResult & { message: string }>(
      `/admin/drivers/${driverId}/suspend`
    );
    return { ok: res.ok ?? true, message: res.message };
  }

  await apiClient.patch(LINKS.admin.v1.driverById(driverId), {
    approval_status: "suspended",
    account_status: "suspended",
  });

  return { ok: true, message: "Chauffeur suspendu" };
}

export async function activateDriverAccount(
  id: string | number
): Promise<DriverAdminActionResult> {
  const driverId = String(id);

  if (useLegacyDriverAdminApi()) {
    const res = await apiClient.post<DriverAdminActionResult & { message: string }>(
      `/admin/drivers/${driverId}/activate`
    );
    return { ok: res.ok ?? true, message: res.message };
  }

  await apiClient.patch(LINKS.admin.v1.driverById(driverId), {
    approval_status: "approved",
    account_status: "approved",
  });

  return { ok: true, message: "Chauffeur réactivé" };
}

/**
 * Change la gamme (`ride_category_code`) d'un chauffeur — prérogative back-office
 * (anti-fraude tarifaire : le chauffeur ne peut pas le faire lui-même).
 *
 * Sans `force`, une montée au-dessus de la catégorie réelle du véhicule est
 * refusée par le backend (`422 DRIVER_CATEGORY_UPGRADE_REQUIRES_FORCE`). L'erreur
 * est propagée telle quelle (`ApiError`) afin que l'UI propose la confirmation
 * puis renvoie avec `force: true`. Voir docs/MONTEE-EN-GAMME-CHAUFFEUR.md.
 */
export async function setDriverRideCategory(
  id: string | number,
  categoryCode: string,
  force = false
): Promise<DriverAdminActionResult> {
  await apiClient.patch(LINKS.admin.v1.driverById(String(id)), {
    ride_category_code: categoryCode,
    ...(force ? { force: true } : {}),
  });
  return { ok: true, message: `Gamme appliquée : ${categoryCode}` };
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
    await setDriverAvailability(driver.id, availability);
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
    await suspendDriverAccount(driver.id);
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
    await activateDriverAccount(driver.id);
  }

  return {
    count: eligible.length,
    message: `${eligible.length} chauffeur(s) réactivé(s)`,
  };
}
