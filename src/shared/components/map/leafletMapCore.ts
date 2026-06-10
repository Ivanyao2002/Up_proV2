import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { env } from "@/core/config/env";

export function createOsmTileLayer(): L.TileLayer {
  return L.tileLayer(env.osmTileUrl, {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  });
}

export function initLeafletMap(
  container: HTMLElement,
  options?: L.MapOptions
): L.Map {
  const map = L.map(container, {
    zoomControl: true,
    attributionControl: true,
    ...options,
  });
  createOsmTileLayer().addTo(map);
  return map;
}

export function createMapPinElement(color: string, size = 14): HTMLDivElement {
  const el = document.createElement("div");
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.borderRadius = "50%";
  el.style.backgroundColor = color;
  el.style.border = "2px solid #fff";
  el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.35)";
  return el;
}

export function lngLatToLeaflet(lat: number, lng: number): L.LatLngExpression {
  return [lat, lng];
}

export function pathLngLatToLeaflet(
  coordinates: [number, number][]
): [number, number][] {
  return coordinates.map(([lng, lat]) => [lat, lng]);
}
