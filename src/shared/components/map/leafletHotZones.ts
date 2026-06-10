import type { LayerGroup, Map as LeafletMap } from "leaflet";
import L from "leaflet";
import type { LiveMapHotZone } from "@/shared/types";
import { hotZonePopupHtml } from "./mapboxHotZones";

function heatRadius(heatLevel: number, kind: "glow" | "core"): number {
  const heat = Math.min(3, Math.max(1, heatLevel));
  if (kind === "glow") {
    if (heat >= 3) return 34;
    if (heat >= 2) return 26;
    return 18;
  }
  if (heat >= 3) return 9;
  if (heat >= 2) return 7;
  return 5;
}

function heatGlowColor(heatLevel: number): string {
  const heat = Math.min(3, Math.max(1, heatLevel));
  if (heat >= 3) return "#ef4444";
  if (heat >= 2) return "#f97316";
  return "#f59e0b";
}

function heatCoreColor(heatLevel: number): string {
  return heatGlowColor(heatLevel);
}

export function syncLeafletHotZones(
  _map: LeafletMap,
  layerGroup: LayerGroup,
  zones: LiveMapHotZone[]
): void {
  layerGroup.clearLayers();

  for (const zone of zones) {
    const latlng: [number, number] = [zone.lat, zone.lng];

    L.circleMarker(latlng, {
      radius: heatRadius(zone.heatLevel, "glow"),
      color: "transparent",
      weight: 0,
      fillColor: heatGlowColor(zone.heatLevel),
      fillOpacity: 0.28,
    }).addTo(layerGroup);

    L.circleMarker(latlng, {
      radius: heatRadius(zone.heatLevel, "core"),
      color: "#ffffff",
      weight: 1.5,
      fillColor: heatCoreColor(zone.heatLevel),
      fillOpacity: 0.9,
    })
      .bindPopup(hotZonePopupHtml(zone), {
        className: "mapbox-live-popup",
        maxWidth: 280,
      })
      .addTo(layerGroup);
  }
}
