import type {
  LiveMapActiveTrip,
  LiveMapData,
  LiveMapDriver,
  LiveMapOrderMarker,
  LiveMapScope,
  LiveMapTripRoute,
} from "@/shared/types";
import type { Driver } from "@/shared/types";
import type {
  ApiAdminLiveMapResponse,
  ApiLiveMapDriver,
  ApiLiveMapOrderBase,
} from "./liveMap.api.types";
import {
  isDriverOnTripStatus,
  liveMapOrderStatusLabel,
  LIVE_MAP_ACTIVE_TRIP_STATUSES,
} from "./liveMap.labels";
import type { LiveMapScopeFiltersValue } from "./liveMap.types";
import {
  extractLiveMapDriverVehicleColor,
  extractLiveMapDriverVehicleColorHex,
  extractLiveMapDriverVehicleColorLabel,
} from "./liveMapVehicleColor";
import { resolveVehicleMapIconUrl } from "@/shared/lib/vehicleMapIcons";
import { mapApiLiveMapStats } from "./liveMapStats";

export interface LiveMapMapperContext {
  colorById?: Map<string, { code: string; label: string }>;
}

const ABIDJAN_BOUNDS = {
  lat_min: 5.28,
  lat_max: 5.42,
  lng_min: -4.05,
  lng_max: -3.92,
};

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

function mapAvailability(
  status?: string,
  hasActiveTrip?: boolean
): Driver["availability"] {
  if (hasActiveTrip || isDriverOnTripStatus(status)) return "on_trip";
  const key = String(status ?? "").toLowerCase();
  if (key === "paused" || key === "break") return "paused";
  if (key === "offline") return "offline";
  return "online";
}

function readCoord(
  lat?: number | null,
  lng?: number | null
): { lat: number; lng: number } | null {
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }
  return { lat, lng };
}

function readDriverCoords(driver: ApiLiveMapDriver): { lat: number; lng: number } | null {
  const loc = driver.location;
  if (!loc) return null;
  return readCoord(
    loc.lat ?? loc.latitude ?? null,
    loc.lng ?? loc.longitude ?? null
  );
}

function orderRef(order: ApiLiveMapOrderBase): string {
  if (order.order_reference) return order.order_reference;
  return `TR-${String(order.id).slice(0, 8).toUpperCase()}`;
}

function mapActiveTrip(order: ApiLiveMapOrderBase): LiveMapActiveTrip {
  const status = String(order.status ?? "requested").toLowerCase();
  return {
    id: order.id,
    ref: orderRef(order),
    from_label: order.pickup_address ?? "Prise en charge",
    to_label: order.dropoff_address ?? "Destination",
    status,
    status_label: liveMapOrderStatusLabel(status),
    amount_fcfa: order.estimated_price_xof ?? undefined,
    driver_id: order.driver_id ?? undefined,
  };
}

function indexActiveTripsByDriver(
  orders: ApiLiveMapOrderBase[]
): Map<string, ApiLiveMapOrderBase> {
  const map = new Map<string, ApiLiveMapOrderBase>();
  for (const order of orders) {
    if (!order.driver_id) continue;
    const status = String(order.status ?? "").toLowerCase();
    if (!LIVE_MAP_ACTIVE_TRIP_STATUSES.has(status)) continue;
    map.set(order.driver_id, order);
  }
  return map;
}

function mapDriver(
  driver: ApiLiveMapDriver,
  activeOrder: ApiLiveMapOrderBase | undefined,
  context?: LiveMapMapperContext
): LiveMapDriver | null {
  let coords = readDriverCoords(driver);
  if (!coords && activeOrder) {
    coords = readCoord(
      activeOrder.pickup_latitude,
      activeOrder.pickup_longitude
    );
  }
  if (!coords) return null;

  const active_trip = activeOrder ? mapActiveTrip(activeOrder) : undefined;
  const loc = driver.location;
  const vehicle_color = extractLiveMapDriverVehicleColor(
    driver,
    context?.colorById
  );
  const vehicle_color_label = extractLiveMapDriverVehicleColorLabel(
    driver,
    context?.colorById
  );
  const vehicle_color_hex = extractLiveMapDriverVehicleColorHex(driver);

  return {
    id: driver.id,
    name: driver.profile?.displayName ?? driver.driverCode ?? "Chauffeur",
    lat: coords.lat,
    lng: coords.lng,
    heading: loc?.heading ?? undefined,
    speed_kmh: loc?.speedKmh ?? undefined,
    availability: mapAvailability(
      driver.availabilityStatus,
      Boolean(active_trip)
    ),
    vehicle: driver.vehicleLabel ?? driver.rideCategoryCode ?? "",
    vehicle_color: vehicle_color ?? null,
    vehicle_color_label: vehicle_color_label ?? null,
    vehicle_color_hex: vehicle_color_hex ?? null,
    vehicle_icon_url: resolveVehicleMapIconUrl(vehicle_color),
    franchise_id: driver.franchiseId ?? undefined,
    franchise_name: driver.franchiseName,
    partner_id: driver.partnerId ?? undefined,
    partner_name: driver.partnerName,
    zone_name: driver.zoneName,
    active_trip,
  };
}

function collectOrderMarkers(orders: ApiLiveMapOrderBase[]): LiveMapOrderMarker[] {
  const markers: LiveMapOrderMarker[] = [];

  for (const order of orders) {
    const status = String(order.status ?? "requested").toLowerCase();
    if (!ACTIVE_ORDER_STATUSES.has(status)) continue;

    const ref = orderRef(order);
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

    const showDropoff =
      LIVE_MAP_ACTIVE_TRIP_STATUSES.has(status) || status === "matching";
    if (showDropoff) {
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

function buildTripRoutes(
  orders: ApiLiveMapOrderBase[]
): LiveMapTripRoute[] {
  const routes: LiveMapTripRoute[] = [];

  for (const order of orders) {
    const status = String(order.status ?? "").toLowerCase();
    if (!LIVE_MAP_ACTIVE_TRIP_STATUSES.has(status)) continue;

    const pickup = readCoord(order.pickup_latitude, order.pickup_longitude);
    const dropoff = readCoord(order.dropoff_latitude, order.dropoff_longitude);
    if (!pickup || !dropoff) continue;

    routes.push({
      order_id: order.id,
      ref: orderRef(order),
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
  if (points.length === 0) return { ...ABIDJAN_BOUNDS };

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

  const padLat = Math.max((latMax - latMin) * 0.08, 0.02);
  const padLng = Math.max((lngMax - lngMin) * 0.08, 0.02);

  return {
    lat_min: latMin - padLat,
    lat_max: latMax + padLat,
    lng_min: lngMin - padLng,
    lng_max: lngMax + padLng,
  };
}

function resolveScope(filters?: LiveMapScopeFiltersValue): LiveMapScope {
  if (filters?.partnerId != null) return "partner";
  if (filters?.franchiseId != null) return "franchise";
  return "global";
}

/** Mappe GET /v1/admin/live-map vers le modèle carte back-office. */
export function mapApiLiveMapToData(
  response: ApiAdminLiveMapResponse,
  filters?: LiveMapScopeFiltersValue,
  context?: LiveMapMapperContext
): LiveMapData {
  const meta = response.meta;
  const rawDrivers = response.drivers ?? [];
  const rides = response.orders?.rides ?? [];
  const deliveries = response.orders?.deliveries ?? [];
  const allOrders = [...rides, ...deliveries];

  const activeByDriver = indexActiveTripsByDriver(allOrders);

  const drivers = rawDrivers
    .map((d) => mapDriver(d, activeByDriver.get(d.id), context))
    .filter((d): d is LiveMapDriver => d != null);

  const order_markers = collectOrderMarkers(allOrders);
  const trip_routes = buildTripRoutes(allOrders);

  const activeOrders = allOrders.filter((o) =>
    ACTIVE_ORDER_STATUSES.has(String(o.status ?? "").toLowerCase())
  );

  const driversOnTrip = drivers.filter((d) => d.availability === "on_trip").length;
  const driversOnlineInPayload = rawDrivers.filter((d) => {
    const status = String(d.availabilityStatus ?? "").toLowerCase();
    return status === "online" || status === "available";
  }).length;
  const points = [
    ...drivers.map((d) => ({ lat: d.lat, lng: d.lng })),
    ...order_markers.map((m) => ({ lat: m.lat, lng: m.lng })),
  ];

  const scope = resolveScope(filters);
  const applied = response.filters?.applied;

  const stats = mapApiLiveMapStats(response, {
    drivers_online: meta?.onlineInDatabase ?? driversOnlineInPayload,
    drivers_on_trip: Math.max(driversOnTrip, trip_routes.length),
    active_trips: activeOrders.length,
    avg_wait_min: 0,
  });

  return {
    zone_name:
      scope === "global"
        ? "Réseau UpJunoo"
        : applied?.partnerId
          ? "Partenaire"
          : "Franchise",
    city: "Abidjan",
    scope,
    stats,
    bounds: computeBounds(points),
    drivers,
    order_markers,
    trip_routes,
    filter_options: undefined,
    active_filter: {
      franchise_id:
        typeof filters?.franchiseId === "number" ? filters.franchiseId : null,
      partner_id:
        typeof filters?.partnerId === "number" ? filters.partnerId : null,
    },
    franchise_summary: undefined,
    realtime: meta?.realtime ?? null,
  };
}
