/** Fiche chauffeur admin */
export function buildAdminDriverDetailPath(driverId: string | number): string {
  return `/admin/fleet/drivers/${driverId}`;
}
