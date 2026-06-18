import L from "leaflet";
import {
  closestDistanceAlongPath,
  haversineDistanceM,
  offsetLngLat,
  pathLengthM,
  positionAlongPath,
  type LngLat,
} from "./mapboxDirections";
import { fetchDrivingRouteForLiveMap } from "./liveMapRouteFetch";

/** Abstraction Mapbox GL / Leaflet pour l’animation temps réel. */
export interface DriverMotionMarker {
  setLngLat(lng: number, lat: number): void;
}

/** L’icône GPS (gps-navigation.png) pointe vers le haut (nord) à 0°. */
const HEADING_ICON_OFFSET = 0;

const STATIONARY_DISTANCE_M = 2.5;
/** Recalcul Directions si déplacement API significatif. */
const ROUTE_REFETCH_MIN_M = 18;
/** Intervalle minimum entre deux Directions par marqueur. */
const ROUTE_MIN_INTERVAL_MS = 3500;
/** Vitesse par défaut si GPS ne renvoie pas speedKmh (m/s). */
const DEFAULT_SPEED_MPS = 8;
const MIN_SPEED_MPS = 0.8;
const MAX_SPEED_MPS = 38;
/** Extrapolation cible après silence socket (ms). */
const EXTRAPOLATE_AFTER_MS = 2200;
const MAX_EXTRAPOLATE_SEC = 5;

type LngLatPoint = { lng: number; lat: number };

interface DriverMotionState {
  marker: DriverMotionMarker;
  vehicleEl: HTMLElement;
  lng: number;
  lat: number;
  targetLng: number;
  targetLat: number;
  heading: number;
  lastApiHeading?: number;
  speedMps: number;
  lastTargetUpdateMs: number;
  lastRouteFetchMs: number;
  path: LngLat[] | null;
  pathDistanceM: number;
  pathTotalM: number;
  routeSeq: number;
}

const motions = new Map<DriverMotionMarker, DriverMotionState>();
let rafId: number | null = null;
let lastFrameTime = 0;

const HEADING_SMOOTH_MS = 320;

interface LeafletMotionBinding {
  map: L.Map;
  onMapMove: () => void;
}

const leafletBindings = new WeakMap<DriverMotionMarker, LeafletMotionBinding>();

export function bearingFromPositions(
  from: LngLatPoint,
  to: LngLatPoint
): number | null {
  const dLng = to.lng - from.lng;
  const dLat = to.lat - from.lat;
  const distSq = dLng * dLng + dLat * dLat;
  if (distSq < 1e-14) return null;
  const rad = Math.atan2(dLng, dLat);
  return ((rad * (180 / Math.PI) + 360) % 360);
}

function lerpAngle(from: number, to: number, alpha: number): number {
  const diff = ((to - from + 540) % 360) - 180;
  return (from + diff * alpha + 360) % 360;
}

function smoothAlpha(dtMs: number, tauMs: number): number {
  return 1 - Math.exp(-dtMs / tauMs);
}

function resolveHeading(
  pathBearing: number | null,
  apiHeading: number | undefined,
  previousHeading: number
): number {
  if (pathBearing != null) return pathBearing;
  if (apiHeading != null && !Number.isNaN(apiHeading)) {
    return normalizeHeading(apiHeading);
  }
  return previousHeading;
}

export function normalizeHeading(heading: number): number {
  return ((heading % 360) + 360) % 360;
}

export function applyHeadingToVehicleElement(
  root: HTMLElement,
  heading: number
): void {
  const vehicle = root.querySelector<HTMLElement>(".mapbox-live-marker__vehicle");
  if (!vehicle) return;
  const deg = normalizeHeading(heading + HEADING_ICON_OFFSET);
  vehicle.style.transform = `rotate(${deg}deg)`;
}

function applyStateToMarker(state: DriverMotionState): void {
  if (!Number.isFinite(state.lng) || !Number.isFinite(state.lat)) return;
  state.marker.setLngLat(state.lng, state.lat);
  applyHeadingToVehicleElement(state.vehicleEl, state.heading);
}

function clampSpeedMps(speedMps: number): number {
  if (!Number.isFinite(speedMps) || speedMps <= 0) return DEFAULT_SPEED_MPS;
  return Math.min(MAX_SPEED_MPS, Math.max(MIN_SPEED_MPS, speedMps));
}

function speedMpsFromKmh(speedKmh?: number): number | null {
  if (speedKmh == null || !Number.isFinite(speedKmh) || speedKmh <= 0) {
    return null;
  }
  return clampSpeedMps(speedKmh / 3.6);
}

function updateSpeedFromMove(
  state: DriverMotionState,
  moveM: number,
  dtMs: number,
  speedKmh?: number
): void {
  const fromGps = speedMpsFromKmh(speedKmh);
  if (fromGps != null) {
    state.speedMps = fromGps;
    return;
  }
  if (dtMs > 80 && moveM >= STATIONARY_DISTANCE_M) {
    const inferred = moveM / (dtMs / 1000);
    state.speedMps = clampSpeedMps(inferred * 0.85 + state.speedMps * 0.15);
  }
}

function extrapolateTargetIfStale(state: DriverMotionState, now: number): void {
  const silentMs = now - state.lastTargetUpdateMs;
  if (silentMs < EXTRAPOLATE_AFTER_MS || state.speedMps < MIN_SPEED_MPS) return;

  const heading =
    state.lastApiHeading != null
      ? state.lastApiHeading
      : state.heading;
  const extrapSec = Math.min(
    MAX_EXTRAPOLATE_SEC,
    (silentMs - EXTRAPOLATE_AFTER_MS) / 1000
  );
  const distM = state.speedMps * extrapSec * 0.35;
  if (distM < 0.5) return;

  const [lng, lat] = offsetLngLat(
    [state.targetLng, state.targetLat],
    heading,
    distM
  );
  state.targetLng = lng;
  state.targetLat = lat;
}

function advanceAlongPathOrTarget(
  state: DriverMotionState,
  dtMs: number,
  headAlpha: number
): void {
  const stepM = state.speedMps * (dtMs / 1000);

  if (state.path && state.path.length >= 2 && state.pathTotalM > 0) {
    state.pathDistanceM = Math.min(
      state.pathTotalM + stepM * 0.25,
      state.pathDistanceM + stepM
    );
    const along = positionAlongPath(state.path, state.pathDistanceM);
    state.lng = along.lng;
    state.lat = along.lat;
    const targetHeading = resolveHeading(
      along.bearing,
      state.lastApiHeading,
      state.heading
    );
    state.heading = lerpAngle(state.heading, targetHeading, headAlpha);

    if (state.pathDistanceM >= state.pathTotalM - 1) {
      const remainM = haversineDistanceM(
        [state.lng, state.lat],
        [state.targetLng, state.targetLat]
      );
      if (remainM > STATIONARY_DISTANCE_M) {
        const straightStep = Math.min(remainM, stepM);
        const bearing =
          bearingFromPositions(
            { lng: state.lng, lat: state.lat },
            { lng: state.targetLng, lat: state.targetLat }
          ) ?? state.heading;
        const [nlng, nlat] = offsetLngLat(
          [state.lng, state.lat],
          bearing,
          straightStep
        );
        state.lng = nlng;
        state.lat = nlat;
        state.heading = lerpAngle(
          state.heading,
          resolveHeading(bearing, state.lastApiHeading, state.heading),
          headAlpha
        );
      }
    }
    return;
  }

  const distToTarget = haversineDistanceM(
    [state.lng, state.lat],
    [state.targetLng, state.targetLat]
  );

  if (distToTarget < STATIONARY_DISTANCE_M) {
    state.lng = state.targetLng;
    state.lat = state.targetLat;
    if (state.lastApiHeading != null) {
      state.heading = lerpAngle(
        state.heading,
        state.lastApiHeading,
        headAlpha
      );
    }
    return;
  }

  const moveM = Math.min(distToTarget, stepM);
  const bearing =
    bearingFromPositions(
      { lng: state.lng, lat: state.lat },
      { lng: state.targetLng, lat: state.targetLat }
    ) ?? state.heading;
  const [nlng, nlat] = offsetLngLat([state.lng, state.lat], bearing, moveM);
  state.lng = nlng;
  state.lat = nlat;
  state.heading = lerpAngle(
    state.heading,
    resolveHeading(bearing, state.lastApiHeading, state.heading),
    headAlpha
  );
}

function motionTick(now: number): void {
  const dt = lastFrameTime ? Math.min(now - lastFrameTime, 48) : 16;
  lastFrameTime = now;

  if (motions.size === 0) {
    rafId = null;
    lastFrameTime = 0;
    return;
  }

  const headAlpha = smoothAlpha(dt, HEADING_SMOOTH_MS);

  for (const state of motions.values()) {
    if (!Number.isFinite(state.lng) || !Number.isFinite(state.lat)) continue;
    extrapolateTargetIfStale(state, now);
    advanceAlongPathOrTarget(state, dt, headAlpha);
    applyStateToMarker(state);
  }

  rafId = requestAnimationFrame(motionTick);
}

function ensureMotionLoop(): void {
  if (rafId != null) return;
  lastFrameTime = 0;
  rafId = requestAnimationFrame(motionTick);
}

function isValidTarget([lng, lat]: [number, number]): boolean {
  return (
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
}

function shouldFetchRoute(
  state: DriverMotionState,
  moveM: number,
  now: number
): boolean {
  if (moveM < ROUTE_REFETCH_MIN_M) return false;
  if (!state.path) return true;
  if (now - state.lastRouteFetchMs >= ROUTE_MIN_INTERVAL_MS) return true;
  const distToTarget = haversineDistanceM(
    [state.lng, state.lat],
    [state.targetLng, state.targetLat]
  );
  return distToTarget > ROUTE_REFETCH_MIN_M * 0.75;
}

function scheduleDrivingPath(
  state: DriverMotionState,
  from: LngLat,
  to: LngLat,
  seq: number,
  now: number
): void {
  state.lastRouteFetchMs = now;

  void fetchDrivingRouteForLiveMap(from, to).then((coordinates) => {
    const current = motions.get(state.marker);
    if (!current || current.routeSeq !== seq) return;
    if (!coordinates || coordinates.length < 2) return;

    const displayPos: LngLat = [current.lng, current.lat];
    const { distanceM } = closestDistanceAlongPath(coordinates, displayPos);

    current.path = coordinates;
    const nextTotal = pathLengthM(coordinates);
    const prevDistance = current.pathDistanceM;
    current.pathTotalM = nextTotal;
    current.pathDistanceM = Math.min(
      nextTotal,
      Math.max(0, distanceM * 0.65 + prevDistance * 0.35)
    );
    ensureMotionLoop();
  });
}

export function setDriverMotionTarget(
  marker: DriverMotionMarker,
  vehicleRoot: HTMLElement,
  target: [number, number],
  apiHeading?: number,
  speedKmh?: number
): void {
  if (!isValidTarget(target)) return;

  const [targetLng, targetLat] = target;
  const api =
    apiHeading != null && !Number.isNaN(apiHeading)
      ? normalizeHeading(apiHeading)
      : undefined;

  const now = performance.now();
  let state = motions.get(marker);

  if (!state) {
    const initialHeading = api ?? 0;
    const speedMps = speedMpsFromKmh(speedKmh) ?? DEFAULT_SPEED_MPS;
    state = {
      marker,
      vehicleEl: vehicleRoot,
      lng: targetLng,
      lat: targetLat,
      targetLng,
      targetLat,
      heading: initialHeading,
      lastApiHeading: api,
      speedMps,
      lastTargetUpdateMs: now,
      lastRouteFetchMs: 0,
      path: null,
      pathDistanceM: 0,
      pathTotalM: 0,
      routeSeq: 0,
    };
    motions.set(marker, state);
    marker.setLngLat(targetLng, targetLat);
    applyHeadingToVehicleElement(vehicleRoot, initialHeading);
    ensureMotionLoop();
    return;
  }

  const prevTarget: LngLat = [state.targetLng, state.targetLat];
  const dtMs = Math.max(16, now - state.lastTargetUpdateMs);
  state.targetLng = targetLng;
  state.targetLat = targetLat;
  state.lastTargetUpdateMs = now;
  if (api != null) state.lastApiHeading = api;

  const from: LngLat = [state.lng, state.lat];
  const to: LngLat = [targetLng, targetLat];
  const moveM = haversineDistanceM(from, to);
  const apiMoveM = haversineDistanceM(prevTarget, to);

  updateSpeedFromMove(state, apiMoveM > moveM ? apiMoveM : moveM, dtMs, speedKmh);

  if (moveM < STATIONARY_DISTANCE_M && apiMoveM < STATIONARY_DISTANCE_M) {
    ensureMotionLoop();
    return;
  }

  if (shouldFetchRoute(state, Math.max(moveM, apiMoveM), now)) {
    const seq = ++state.routeSeq;
    const routeFrom: LngLat =
      state.path && state.path.length >= 2
        ? [state.lng, state.lat]
        : from;
    scheduleDrivingPath(state, routeFrom, to, seq, now);
  }

  ensureMotionLoop();
}

export function snapDriverMarker(
  marker: DriverMotionMarker,
  vehicleRoot: HTMLElement,
  position: [number, number],
  apiHeading?: number
): void {
  if (!isValidTarget(position)) return;

  removeDriverMotion(marker);
  const [lng, lat] = position;
  const heading =
    apiHeading != null && !Number.isNaN(apiHeading)
      ? normalizeHeading(apiHeading)
      : 0;
  marker.setLngLat(lng, lat);
  applyHeadingToVehicleElement(vehicleRoot, heading);
}

function detachLeafletMotionBinding(marker: DriverMotionMarker): void {
  const binding = leafletBindings.get(marker);
  if (!binding) return;
  binding.map.off("move", binding.onMapMove);
  binding.map.off("zoom", binding.onMapMove);
  binding.map.off("zoomanim", binding.onMapMove);
  binding.map.off("viewreset", binding.onMapMove);
  leafletBindings.delete(marker);
}

export function removeDriverMotion(marker: DriverMotionMarker): void {
  detachLeafletMotionBinding(marker);
  motions.delete(marker);
  if (motions.size === 0 && rafId != null) {
    cancelAnimationFrame(rafId);
    rafId = null;
    lastFrameTime = 0;
  }
}

export function clearAllDriverMotions(): void {
  motions.clear();
  if (rafId != null) {
    cancelAnimationFrame(rafId);
    rafId = null;
    lastFrameTime = 0;
  }
}

export function createMapboxDriverMotionMarker(
  marker: { setLngLat: (pos: [number, number]) => unknown }
): DriverMotionMarker {
  return {
    setLngLat(lng, lat) {
      marker.setLngLat([lng, lat]);
    },
  };
}

function readLeafletIconAnchor(marker: L.Marker): L.Point {
  const icon = marker.options.icon;
  if (icon && "options" in icon) {
    const anchor = (icon as L.DivIcon).options.iconAnchor;
    if (anchor) return L.point(anchor);
  }
  return L.point(18, 18);
}

/**
 * Leaflet : évite setLatLng à chaque frame (arrondi px → tremblement).
 * On repositionne l’icône via latLngToLayerPoint + transform.
 */
export function createLeafletDriverMotionMarker(
  marker: L.Marker,
  map: L.Map
): DriverMotionMarker {
  let lat = 0;
  let lng = 0;
  let hasPosition = false;

  const reposition = () => {
    const iconEl = marker.getElement();
    if (!iconEl || !hasPosition) return;

    const point = map.latLngToLayerPoint(L.latLng(lat, lng));
    const anchor = readLeafletIconAnchor(marker);
    L.DomUtil.setPosition(iconEl, point.subtract(anchor));
  };

  const onMapMove = () => reposition();
  map.on("move", onMapMove);
  map.on("zoom", onMapMove);
  map.on("zoomanim", onMapMove);
  map.on("viewreset", onMapMove);

  const adapter: DriverMotionMarker = {
    setLngLat(newLng, newLat) {
      lat = newLat;
      lng = newLng;

      if (!hasPosition) {
        hasPosition = true;
        marker.setLatLng([lat, lng]);
      } else {
        (marker as L.Marker & { _latlng?: L.LatLng })._latlng = L.latLng(lat, lng);
      }

      reposition();
    },
  };

  leafletBindings.set(adapter, { map, onMapMove });
  return adapter;
}
