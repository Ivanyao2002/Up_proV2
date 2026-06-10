import { liveMapPulseBackground } from "@/features/ops/lib/liveMapAvailabilityColors";
import { LIVE_MAP_DEFAULT_VEHICLE_ICON } from "@/shared/lib/vehicleMapIcons";
import type { MapboxPointFeature } from "./mapboxMarkers";

/** @deprecated Utiliser `LIVE_MAP_DEFAULT_VEHICLE_ICON` */
export const LIVE_MAP_DRIVER_NAV_ICON = LIVE_MAP_DEFAULT_VEHICLE_ICON;

function driverNavIconHtml(iconUrl: string): string {
  return `<span class="mapbox-live-marker__vehicle" aria-hidden="true">
    <img
      class="mapbox-live-marker__nav-icon"
      src="${iconUrl}"
      data-icon-src="${iconUrl}"
      width="32"
      height="32"
      alt=""
      decoding="async"
      draggable="false"
    />
  </span>`;
}

export function resolveDriverMarkerIconUrl(feature: MapboxPointFeature): string {
  return feature.vehicleIconUrl ?? LIVE_MAP_DEFAULT_VEHICLE_ICON;
}

/** Met à jour l’icône véhicule sans recréer le marqueur (socket / refresh). */
export function updateLiveMapMarkerElement(
  root: HTMLElement,
  feature: MapboxPointFeature
): void {
  if (feature.kind !== "driver") return;

  const iconUrl = resolveDriverMarkerIconUrl(feature);
  const img = root.querySelector<HTMLImageElement>(".mapbox-live-marker__nav-icon");
  if (img && img.getAttribute("data-icon-src") !== iconUrl) {
    img.src = iconUrl;
    img.setAttribute("data-icon-src", iconUrl);
  }

  const ring = root.querySelector<HTMLElement>(".mapbox-live-marker__ring--pulse");
  if (ring) {
    ring.style.background = liveMapPulseBackground(feature.color);
  }
}

function waypointIconSvg(fill: string, label: string): string {
  return `<svg class="mapbox-live-marker__pin" viewBox="0 0 24 32" width="22" height="30" aria-hidden="true">
    <path fill="${fill}" stroke="#fff" stroke-width="1.2" d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 15 9 15s9-8.25 9-15c0-4.97-4.03-9-9-9z"/>
    <circle cx="12" cy="9" r="3.5" fill="#fff"/>
    <text x="12" y="10.5" text-anchor="middle" font-size="6" font-weight="700" fill="${fill}">${label}</text>
  </svg>`;
}

/** Marqueur véhicule (détail course, suivi chauffeur) avec icône couleur catalogue. */
export function createTripDriverMarkerElement(options?: {
  vehicleIconUrl?: string;
  pulse?: boolean;
  pulseColor?: string;
}): HTMLDivElement {
  const iconUrl = options?.vehicleIconUrl ?? LIVE_MAP_DEFAULT_VEHICLE_ICON;
  const pulse = options?.pulse ?? true;
  const pulseColor =
    options?.pulseColor ?? liveMapPulseBackground("#166534");

  const el = document.createElement("div");
  el.className = "mapbox-live-marker mapbox-live-marker--driver";
  const pulseHtml = pulse
    ? `<span class="mapbox-live-marker__ring mapbox-live-marker__ring--pulse" style="background:${pulseColor}"></span>`
    : "";
  el.innerHTML = `${pulseHtml}${driverNavIconHtml(iconUrl)}`;
  return el;
}

export function updateTripDriverMarkerElement(
  root: HTMLElement,
  options: { vehicleIconUrl?: string; pulseColor?: string }
): void {
  if (options.vehicleIconUrl) {
    const img = root.querySelector<HTMLImageElement>(".mapbox-live-marker__nav-icon");
    if (img && img.getAttribute("data-icon-src") !== options.vehicleIconUrl) {
      img.src = options.vehicleIconUrl;
      img.setAttribute("data-icon-src", options.vehicleIconUrl);
    }
  }
  if (options.pulseColor) {
    const ring = root.querySelector<HTMLElement>(".mapbox-live-marker__ring--pulse");
    if (ring) ring.style.background = options.pulseColor;
  }
}

/** Crée le bouton marqueur (voiture chauffeur, épingle course). */
export function createLiveMapMarkerElement(feature: MapboxPointFeature): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.className = `mapbox-live-marker group mapbox-live-marker--${feature.kind}`;
  el.setAttribute("aria-label", feature.label);

  if (feature.kind === "driver") {
    const pulse = feature.pulse
      ? `<span class="mapbox-live-marker__ring mapbox-live-marker__ring--pulse" style="background:${liveMapPulseBackground(feature.color)}"></span>`
      : "";
    el.innerHTML = `${pulse}${driverNavIconHtml(resolveDriverMarkerIconUrl(feature))}`;
  } else {
    const letter = feature.kind === "pickup" ? "A" : "B";
    el.innerHTML = waypointIconSvg(feature.color, letter);
  }

  return el;
}
