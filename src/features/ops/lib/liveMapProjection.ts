import type { LiveMapData, LiveMapDriver } from "@/shared/types";

export function projectDriver(
  driver: Pick<LiveMapDriver, "lat" | "lng">,
  bounds: LiveMapData["bounds"]
): { left: string; top: string } {
  const latRange = bounds.lat_max - bounds.lat_min || 1;
  const lngRange = bounds.lng_max - bounds.lng_min || 1;
  const latPct = ((driver.lat - bounds.lat_min) / latRange) * 100;
  const lngPct = ((driver.lng - bounds.lng_min) / lngRange) * 100;
  return {
    left: `${Math.min(92, Math.max(8, lngPct))}%`,
    top: `${Math.min(88, Math.max(12, 100 - latPct))}%`,
  };
}

/** Positions indicatives des hubs franchise en vue mondiale (%) */
export const WORLD_HUB_LABELS: {
  franchise_id: number;
  label: string;
  left: string;
  top: string;
}[] = [
  { franchise_id: 1, label: "Côte d'Ivoire", left: "48%", top: "58%" },
  { franchise_id: 2, label: "Canada", left: "22%", top: "28%" },
  { franchise_id: 3, label: "Espace euro", left: "52%", top: "32%" },
  { franchise_id: 4, label: "Sénégal", left: "42%", top: "52%" },
];
