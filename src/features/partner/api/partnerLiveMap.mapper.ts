import type {
  LiveMapData,
  LiveMapDriver,
  LiveMapOrderMarker,
  LiveMapTripRoute,
  LiveMapActiveTrip,
  LiveMapRealtimeConfig,
} from "@/shared/types";
import { liveMapOrderStatusLabel } from "@/features/ops/api/liveMap.labels";
import { resolvePartnerLiveMapRealtime } from "../lib/partnerLiveMapRealtime";

/** Réponse brute de GET /v1/partners/{id}/ops/map */
export interface ApiPartnerLiveMapDriver {
  id: string;
  user_id?: string;
  partner_id?: string;
  city_id?: string;
  driver_code?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    display_name?: string;
    phone?: string;
  } | null;
  availability_status?: string;
  last_online_at?: string;
  current_vehicle_id?: string;
  vehicle_label?: string;
  vehicle_color?: string | null;
  vehicle?: {
    id?: string;
    brand?: string;
    model?: string;
    plate_number?: string;
    label?: string;
    display_name?: string;
  } | null;
  latitude?: number | null;
  longitude?: number | null;
  heading?: number | null;
  speed_kmh?: number | null;
  location?: {
    lat?: number | null;
    lng?: number | null;
    latitude?: number | null;
    longitude?: number | null;
    heading?: number | null;
    speedKmh?: number | null;
    recordedAt?: string | null;
  } | null;
  metadata?: {
    zoneId?: string;
    citySlug?: string;
    zoneCode?: string;
    suspended?: boolean;
    zoneLabel?: string;
    partnerKey?: string;
    [key: string]: unknown;
  };
}

export interface ApiPartnerLiveMapOrder {
  id: string;
  order_reference?: string | null;
  driver_id?: string | null;
  status?: string;
  service_type?: string;
  pickup_address?: string | null;
  pickup_latitude?: number | null;
  pickup_longitude?: number | null;
  dropoff_address?: string | null;
  dropoff_latitude?: number | null;
  dropoff_longitude?: number | null;
  estimated_price_xof?: number | null;
  final_price_xof?: number | null;
  category_code?: string | null;
}

export interface ApiPartnerLiveMapResponse {
  status?: string;
  generatedAt?: string;
  drivers?: ApiPartnerLiveMapDriver[];
  orders?: ApiPartnerLiveMapOrder[];
  meta?: {
    realtime?: LiveMapRealtimeConfig | null;
  };
}

const ABIDJAN_CENTER = { lat: 5.35, lng: -4.02 };

function readCoord(
  lat?: number | null,
  lng?: number | null
): { lat: number; lng: number } | null {
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }
  return { lat, lng };
}

function mapAvailability(status?: string): LiveMapDriver["availability"] {
  const key = String(status ?? "").toLowerCase();
  if (key === "paused" || key === "break") return "paused";
  if (key === "offline") return "offline";
  if (key === "on_trip" || key === "on-trip" || key === "in_progress") return "on_trip";
  return "online";
}

function buildOrderRef(order: ApiPartnerLiveMapOrder): string {
  if (order.order_reference) return order.order_reference;
  return `TR-${String(order.id).slice(0, 8).toUpperCase()}`;
}

function mapActiveTrip(order: ApiPartnerLiveMapOrder): LiveMapActiveTrip {
  const status = String(order.status ?? "requested").toLowerCase();
  return {
    id: order.id,
    ref: buildOrderRef(order),
    from_label: order.pickup_address ?? "Prise en charge",
    to_label: order.dropoff_address ?? "Destination",
    status,
    status_label: liveMapOrderStatusLabel(status),
    amount_fcfa: order.estimated_price_xof ?? undefined,
    driver_id: order.driver_id ?? undefined,
  };
}

const ACTIVE_ORDER_STATUSES = new Set([
  "requested",
  "matching",
  "assigned",
  "accepted",
  "arrived",
  "in_progress",
  "started",
  "picked_up",
]);

const ACTIVE_TRIP_STATUSES = new Set([
  "assigned",
  "accepted",
  "arrived",
  "in_progress",
  "started",
  "picked_up",
]);

function collectOrderMarkers(orders: ApiPartnerLiveMapOrder[]): LiveMapOrderMarker[] {
  const markers: LiveMapOrderMarker[] = [];
  for (const order of orders) {
    const status = String(order.status ?? "requested").toLowerCase();
    if (!ACTIVE_ORDER_STATUSES.has(status)) continue;

    const ref = buildOrderRef(order);
    const status_label = liveMapOrderStatusLabel(status);
    const pickup = readCoord(order.pickup_latitude, order.pickup_longitude);

    if (pickup) {
      markers.push({
        id: `${order.id}-pickup`,
        order_id: order.id,
        lat: pickup.lat,
        lng: pickup.lng,
        kind: "pickup",
        status,
        status_label,
        label: order.pickup_address ?? "Prise en charge",
        ref,
        driver_id: order.driver_id ?? undefined,
        amount_fcfa: order.estimated_price_xof ?? undefined,
      });
    }

    if (ACTIVE_TRIP_STATUSES.has(status)) {
      const dropoff = readCoord(order.dropoff_latitude, order.dropoff_longitude);
      if (dropoff) {
        markers.push({
          id: `${order.id}-dropoff`,
          order_id: order.id,
          lat: dropoff.lat,
          lng: dropoff.lng,
          kind: "dropoff",
          status,
          status_label,
          label: order.dropoff_address ?? "Destination",
          ref,
          driver_id: order.driver_id ?? undefined,
          amount_fcfa: order.estimated_price_xof ?? undefined,
        });
      }
    }
  }
  return markers.slice(0, 120);
}

function buildTripRoutes(orders: ApiPartnerLiveMapOrder[]): LiveMapTripRoute[] {
  const routes: LiveMapTripRoute[] = [];
  for (const order of orders) {
    const status = String(order.status ?? "").toLowerCase();
    if (!ACTIVE_TRIP_STATUSES.has(status)) continue;

    const pickup = readCoord(order.pickup_latitude, order.pickup_longitude);
    const dropoff = readCoord(order.dropoff_latitude, order.dropoff_longitude);
    if (!pickup || !dropoff) continue;

    routes.push({
      order_id: order.id,
      ref: buildOrderRef(order),
      status_label: liveMapOrderStatusLabel(status),
      coordinates: [
        [pickup.lng, pickup.lat],
        [dropoff.lng, dropoff.lat],
      ],
    });
  }
  return routes.slice(0, 40);
}

function computeBounds(points: { lat: number; lng: number }[]): LiveMapData["bounds"] {
  if (points.length === 0) {
    return {
      lat_min: ABIDJAN_CENTER.lat - 0.1,
      lat_max: ABIDJAN_CENTER.lat + 0.1,
      lng_min: ABIDJAN_CENTER.lng - 0.1,
      lng_max: ABIDJAN_CENTER.lng + 0.1,
    };
  }

  let latMin = points[0].lat;
  let latMax = points[0].lat;
  let lngMin = points[0].lng;
  let lngMax = points[0].lng;

  for (const p of points) {
    latMin = Math.min(latMin, p.lat);
    latMax = Math.max(latMax, p.lat);
    lngMin = Math.min(lngMin, p.lng);
    lngMax = Math.max(lngMax, p.lng);
  }

  const padLat = Math.max((latMax - latMin) * 0.15, 0.02);
  const padLng = Math.max((lngMax - lngMin) * 0.15, 0.02);

  return {
    lat_min: latMin - padLat,
    lat_max: latMax + padLat,
    lng_min: lngMin - padLng,
    lng_max: lngMax + padLng,
  };
}

function readDriverCoords(
  driver: ApiPartnerLiveMapDriver
): { lat: number; lng: number } | null {
  const fromLocation = driver.location;
  const lat =
    driver.latitude ??
    fromLocation?.lat ??
    fromLocation?.latitude ??
    null;
  const lng =
    driver.longitude ??
    fromLocation?.lng ??
    fromLocation?.longitude ??
    null;
  return readCoord(lat, lng);
}

/** Mappe la réponse brute partner /ops/map vers LiveMapData. */
export function mapApiPartnerLiveMapToData(
  response: ApiPartnerLiveMapResponse,
  partnerId: string
): LiveMapData {
  const rawDrivers = response.drivers ?? [];
  const rawOrders = response.orders ?? [];

  const firstDriver = rawDrivers[0];
  const zone_name = firstDriver?.metadata?.zoneLabel ?? "Territoire";
  const city = firstDriver?.metadata?.citySlug
    ? firstDriver.metadata.citySlug.charAt(0).toUpperCase() +
      firstDriver.metadata.citySlug.slice(1)
    : "Abidjan";

  // Indexer les orders actives par driver
  const activeOrdersByDriver = new Map<string, ApiPartnerLiveMapOrder>();
  for (const order of rawOrders) {
    if (!order.driver_id) continue;
    const status = String(order.status ?? "").toLowerCase();
    if (ACTIVE_TRIP_STATUSES.has(status)) {
      activeOrdersByDriver.set(order.driver_id, order);
    }
  }

  // Points pour bounds (pickup/dropoff des orders)
  const allPoints: { lat: number; lng: number }[] = [];

  // Mapper les drivers
  const drivers: LiveMapDriver[] = [];
  for (let i = 0; i < rawDrivers.length; i++) {
    const d = rawDrivers[i];
    const activeOrder = activeOrdersByDriver.get(d.id);

    let coords = readDriverCoords(d);
    if (!coords && activeOrder) {
      coords = readCoord(activeOrder.pickup_latitude, activeOrder.pickup_longitude);
    }

    if (!coords) {
      // Petit offset aléatoire basé sur l'index pour éviter la superposition totale
      const offsetLat = (i % 5) * 0.005 - 0.01;
      const offsetLng = (i % 7) * 0.005 - 0.015;
      coords = { lat: ABIDJAN_CENTER.lat + offsetLat, lng: ABIDJAN_CENTER.lng + offsetLng };
    }

    allPoints.push(coords);

    const active_trip = activeOrder ? mapActiveTrip(activeOrder) : undefined;

    const firstName = d.first_name ?? d.profile?.first_name;
    const lastName = d.last_name ?? d.profile?.last_name;
    const displayName = d.display_name ?? d.profile?.display_name;
    const driverName =
      d.name ??
      displayName ??
      (firstName && lastName ? `${firstName} ${lastName}` : null) ??
      (firstName ?? lastName ?? null) ??
      d.driver_code ??
      `Chauffeur ${String(d.id).slice(0, 6)}`;

    const v = d.vehicle;
    const vehicleLabel =
      d.vehicle_label ??
      (v
        ? v.label ??
          v.display_name ??
          [v.brand, v.model].filter(Boolean).join(" ") ??
          null
        : null);
    const vehiclePlate = v?.plate_number ?? null;
    const vehicleDisplay = vehicleLabel
      ? vehiclePlate && !vehicleLabel.includes(vehiclePlate)
        ? `${vehicleLabel} · ${vehiclePlate}`
        : vehicleLabel
      : d.current_vehicle_id
        ? `Véh. ${d.current_vehicle_id.slice(0, 8)}`
        : "—";
    const vehicleColor = d.vehicle_color ?? null;

    drivers.push({
      id: d.id,
      name: driverName,
      lat: coords.lat,
      lng: coords.lng,
      heading: d.heading ?? d.location?.heading ?? undefined,
      speed_kmh: d.speed_kmh ?? d.location?.speedKmh ?? undefined,
      availability: mapAvailability(d.availability_status),
      vehicle: vehicleDisplay,
      vehicle_color: vehicleColor,
      vehicle_color_hex: vehicleColor,
      zone_name: d.metadata?.zoneLabel,
      active_trip,
    });
  }

  const order_markers = collectOrderMarkers(rawOrders);
  const trip_routes = buildTripRoutes(rawOrders);

  for (const m of order_markers) {
    allPoints.push({ lat: m.lat, lng: m.lng });
  }

  const driversOnline = rawDrivers.filter((d) => {
    const s = String(d.availability_status ?? "").toLowerCase();
    return s === "online" || s === "available";
  }).length;

  const driversOnTrip = drivers.filter((d) => d.availability === "on_trip").length;

  const activeTrips = rawOrders.filter((o) => {
    const s = String(o.status ?? "").toLowerCase();
    return ACTIVE_TRIP_STATUSES.has(s);
  }).length;

  return {
    zone_name,
    city,
    scope: "partner",
    stats: {
      drivers_online: driversOnline,
      drivers_on_trip: Math.max(driversOnTrip, activeOrdersByDriver.size),
      active_trips: activeTrips,
      avg_wait_min: 0,
    },
    bounds: computeBounds(allPoints),
    drivers,
    order_markers,
    trip_routes,
    filter_options: undefined,
    active_filter: { franchise_id: null, partner_id: null },
    franchise_summary: undefined,
    realtime: resolvePartnerLiveMapRealtime(response.meta?.realtime, partnerId),
  };
}
