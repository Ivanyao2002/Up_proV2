/** Helpers d'affichage pour la flotte LOCATION. */

/** Seuil d'alerte « document expirant bientôt » (cahier §4.2). */
export const DOC_EXPIRY_WARNING_DAYS = 30;

/**
 * Vrai si la date d'expiration est dépassée ou survient dans les
 * `withinDays` prochains jours. `undefined`/invalide → false (pas d'alerte).
 */
export function isDocumentExpiringSoon(
  expiresAt?: string,
  withinDays: number = DOC_EXPIRY_WARNING_DAYS
): boolean {
  if (!expiresAt) return false;
  const ts = Date.parse(expiresAt);
  if (Number.isNaN(ts)) return false;
  const threshold = Date.now() + withinDays * 24 * 60 * 60 * 1000;
  return ts <= threshold;
}
