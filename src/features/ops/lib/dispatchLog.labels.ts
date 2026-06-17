const DISPATCH_LOG_LABELS: Record<string, string> = {
  DRIVER_EXCLUDED_ZONE_FILTER: "Chauffeur exclu — filtre zone",
  DRIVER_EXCLUDED_HEADING_HOME: "Chauffeur exclu — retour domicile",
  HEADING_HOME_EXCLUDED: "Course exclue — retour domicile",
  ZONE_FILTER_EXCLUDED: "Course exclue — zone exclusive",
  DRIVER_EXCLUDED_MAX_DISTANCE: "Chauffeur exclu — distance max",
  DRIVER_EXCLUDED_BLOCKED_ZONE: "Chauffeur exclu — zone bloquée",
  OFFER_SENT: "Offre envoyée",
  OFFER_ACCEPTED: "Offre acceptée",
  OFFER_DECLINED: "Offre refusée",
  OFFER_EXPIRED: "Offre expirée",
  OFFER_CANCELLED: "Offre annulée",
  DISPATCH_WAVE_START: "Début de vague dispatch",
  DISPATCH_WAVE_END: "Fin de vague dispatch",
  NO_DRIVER_FOUND: "Aucun chauffeur trouvé",
};

export function formatDispatchLogCode(code?: string | null): string {
  const key = String(code ?? "").trim().toUpperCase();
  if (!key) return "Événement dispatch";
  return DISPATCH_LOG_LABELS[key] ?? key.replace(/_/g, " ").toLowerCase();
}

export function isDispatchExclusionLog(code?: string | null): boolean {
  const key = String(code ?? "").toUpperCase();
  return (
    key.includes("EXCLUDED") ||
    key.includes("ZONE_FILTER") ||
    key.includes("HEADING_HOME")
  );
}
