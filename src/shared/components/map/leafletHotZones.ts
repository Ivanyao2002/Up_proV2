import type { LayerGroup, Map as LeafletMap } from "leaflet";
import L from "leaflet";
import type { LiveMapHotZone } from "@/shared/types";
import { getZonePolygonRings } from "./zonesMapGeoJson";
import {
  hotZoneFillOpacity,
  hotZonePopupHtml,
  hotZoneStrokeColor,
} from "./mapboxHotZones";

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

function addPointHotZone(layerGroup: LayerGroup, zone: LiveMapHotZone): void {
  const latlng: [number, number] = [zone.lat, zone.lng];
  const stroke = hotZoneStrokeColor(zone.heatLevel);

  L.circleMarker(latlng, {
    radius: heatRadius(zone.heatLevel, "glow"),
    color: "transparent",
    weight: 0,
    fillColor: stroke,
    fillOpacity: 0.28,
  }).addTo(layerGroup);

  L.circleMarker(latlng, {
    radius: heatRadius(zone.heatLevel, "core"),
    color: "#ffffff",
    weight: 1.5,
    fillColor: stroke,
    fillOpacity: 0.9,
  })
    .bindPopup(hotZonePopupHtml(zone), {
      className: "mapbox-live-popup",
      maxWidth: 280,
    })
    .addTo(layerGroup);
}

export function syncLeafletHotZones(
  _map: LeafletMap,
  layerGroup: LayerGroup,
  zones: LiveMapHotZone[]
): void {
  layerGroup.clearLayers();

  for (const zone of zones) {
    const rings = getZonePolygonRings(zone.polygon_geojson);
    if (rings.length === 0) {
      addPointHotZone(layerGroup, zone);
      continue;
    }

    const geo = zone.polygon_geojson!;
    L.geoJSON(geo as GeoJSON.GeoJsonObject, {
      style: {
        color: hotZoneStrokeColor(zone.heatLevel),
        weight: 2,
        opacity: 0.9,
        fillColor: hotZoneStrokeColor(zone.heatLevel),
        fillOpacity: hotZoneFillOpacity(zone.heatLevel),
      },
      onEachFeature: (_feature, layer) => {
        layer.bindPopup(hotZonePopupHtml(zone), {
          className: "mapbox-live-popup",
          maxWidth: 280,
        });
      },
    }).addTo(layerGroup);
  }
}
