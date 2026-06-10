import type { Marker } from "leaflet";
import L from "leaflet";
import type { MapboxPointFeature } from "./mapboxMarkers";
import { createLiveMapMarkerElement } from "./mapboxMarkerElement";

export interface LeafletLiveMarkerEntry {
  marker: Marker;
  root: HTMLElement;
}

function mountMarkerElement(marker: Marker, el: HTMLElement): void {
  const iconEl = marker.getElement();
  if (!iconEl) return;
  if (el.parentElement === iconEl) return;
  iconEl.innerHTML = "";
  iconEl.appendChild(el);
}

/** Crée un marqueur Leaflet avec l’élément DOM réutilisé (comme Mapbox GL). */
export function createLeafletLiveMarker(
  feature: MapboxPointFeature
): LeafletLiveMarkerEntry {
  const root = createLiveMapMarkerElement(feature);
  const marker = L.marker([feature.lat, feature.lng], {
    icon: L.divIcon({
      className: "leaflet-live-marker-icon",
      html: "",
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    }),
    riseOnHover: true,
  });

  marker.on("add", () => {
    mountMarkerElement(marker, root);
  });

  return { marker, root };
}

export function ensureLeafletMarkerMounted(entry: LeafletLiveMarkerEntry): void {
  mountMarkerElement(entry.marker, entry.root);
}

export function getLeafletMarkerRoot(marker: Marker): HTMLElement | null {
  const icon = marker.getElement();
  if (!icon) return null;
  return icon.querySelector<HTMLElement>(".mapbox-live-marker");
}
