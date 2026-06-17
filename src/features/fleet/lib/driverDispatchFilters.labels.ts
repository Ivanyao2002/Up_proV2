export function formatActiveFilterLabel(filter: string): string {
  const trimmed = filter.trim();
  if (!trimmed) return "—";

  if (trimmed.startsWith("exclusive_zone:")) {
    const zone = trimmed.slice("exclusive_zone:".length).trim();
    return zone ? `Zone exclusive : ${zone}` : "Zone exclusive";
  }

  if (trimmed === "heading_home") return "Retour à la maison";
  if (trimmed === "zone_filter") return "Filtre zone";
  if (trimmed === "blocked_zone") return "Zone bloquée";
  if (trimmed === "max_distance") return "Distance max";

  return trimmed.replace(/_/g, " ");
}

export function isExclusiveZoneFilterActive(
  mode: string | null | undefined,
  active?: boolean | null
): boolean {
  const normalized = String(mode ?? "").toLowerCase();
  if (normalized === "exclusive") return active !== false;
  return false;
}

export function isHeadingHomeActive(
  headingHome?: {
    enabled?: boolean;
    active?: boolean;
  } | null
): boolean {
  if (!headingHome) return false;
  if (headingHome.active === true || headingHome.enabled === true) return true;
  return false;
}
