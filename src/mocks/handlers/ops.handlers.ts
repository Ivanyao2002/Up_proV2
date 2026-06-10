import { http, HttpResponse } from "msw";
import tripsListSeed from "../data/trips-list.json";
import { TRIPS_CATALOG, filterTrips } from "../lib/tripsCatalog";
import { getTripsScopeFilterOptions } from "../lib/tripsScope";
import { paginatedList, parseListQuery } from "../lib/listQuery";
import tripDetail from "../data/trip-detail.json";
import {
  buildAdminLiveMap,
  buildLocalAbidjanLiveMap,
  getLiveMapCatalogDrivers,
} from "../lib/liveMapBuilder";
import { buildDispatchConsole } from "../lib/dispatchConsoleBuilder";
import tripForensic from "../data/trip-forensic.json";
import crisisModeSeed from "../data/crisis-mode.json";
import type { DispatchConsoleData, Paginated, Trip, TripsListResponse } from "@/shared/types";

let tripsState: Paginated<Trip> = {
  data: TRIPS_CATALOG,
  meta: tripsListSeed.meta,
};

function dispatchConsoleResponse(request: Request): DispatchConsoleData {
  const url = new URL(request.url);
  const franchiseId = url.searchParams.get("franchise_id");
  const partnerId = url.searchParams.get("partner_id");
  return buildDispatchConsole({
    trips: tripsState.data,
    franchiseId: franchiseId ? Number(franchiseId) : null,
    partnerId: partnerId ? Number(partnerId) : null,
    includeFilterOptions: true,
  });
}

const driverNames: Record<number, string> = Object.fromEntries(
  getLiveMapCatalogDrivers().map((d) => [d.id, d.name])
);

let crisisState = { ...crisisModeSeed };

export const opsHandlers = [
  http.get("*/api/v2/admin/ops/trips", ({ request }) => {
    const query = parseListQuery(request);
    const filtered = filterTrips(tripsState.data, query);
    const body: TripsListResponse = {
      ...paginatedList(filtered, query),
      filter_options: getTripsScopeFilterOptions(),
    };
    return HttpResponse.json(body);
  }),

  http.get("*/api/v2/admin/ops/trips/:id", ({ params }) => {
    const id = String(params.id);
    const fromList = tripsState.data.find((t) => t.id === id);
    if (fromList) {
      return HttpResponse.json({
        ...tripDetail,
        ...fromList,
        id,
        timeline: tripDetail.timeline,
      });
    }
    return HttpResponse.json({ ...tripDetail, id });
  }),

  http.get("*/v1/admin/live-map", ({ request }) => {
    const url = new URL(request.url);
    const legacy = buildAdminLiveMap({
      franchise_id: url.searchParams.get("franchise_id"),
      partner_id: url.searchParams.get("partner_id"),
    });
    return HttpResponse.json({
      status: "ok",
      generatedAt: new Date().toISOString(),
      stats: {
        online: legacy.stats.drivers_online,
        onTrip: legacy.stats.drivers_on_trip,
        activeTrips: legacy.stats.active_trips,
        avgWaitMin: legacy.stats.avg_wait_min,
      },
      meta: {
        onlineInDatabase: legacy.stats.drivers_online,
        withRecentLocation: legacy.drivers.length,
        includeWithoutLocation: true,
      },
      drivers: legacy.drivers.map((d) => ({
        id: String(d.id),
        availabilityStatus: d.availability,
        profile: { displayName: d.name },
        vehicleLabel: d.vehicle,
        franchiseId: d.franchise_id != null ? String(d.franchise_id) : null,
        franchiseName: d.franchise_name,
        partnerId: d.partner_id != null ? String(d.partner_id) : null,
        partnerName: d.partner_name,
        zoneName: d.zone_name,
        location: { lat: d.lat, lng: d.lng },
      })),
      orders: {
        rides: [
          {
            id: "9001",
            order_reference: "TR-88421",
            status: "in_progress",
            driver_id: "101",
            pickup_address: "Cocody Angré",
            dropoff_address: "Plateau",
            pickup_latitude: 5.359,
            pickup_longitude: -3.987,
            dropoff_latitude: 5.322,
            dropoff_longitude: -4.018,
            estimated_price_xof: 3500,
          },
          {
            id: "9002",
            order_reference: "TR-90215",
            status: "accepted",
            driver_id: "105",
            pickup_address: "Marcory Zone 4",
            dropoff_address: "Treichville",
            pickup_latitude: 5.348,
            pickup_longitude: -4.008,
            dropoff_latitude: 5.301,
            dropoff_longitude: -4.012,
            estimated_price_xof: 2800,
          },
          {
            id: "9003",
            order_reference: "TR-91002",
            status: "arrived",
            driver_id: "109",
            pickup_address: "Aéroport FHB",
            dropoff_address: "Cocody Riviera",
            pickup_latitude: 5.351,
            pickup_longitude: -4.015,
            dropoff_latitude: 5.365,
            dropoff_longitude: -3.978,
            estimated_price_xof: 5200,
          },
        ],
        deliveries: [],
      },
    });
  }),

  http.get("*/api/v2/admin/ops/map", ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(
      buildAdminLiveMap({
        franchise_id: url.searchParams.get("franchise_id"),
        partner_id: url.searchParams.get("partner_id"),
      })
    );
  }),

  http.get("*/api/v2/admin/ops/dispatch", ({ request }) => {
    return HttpResponse.json(dispatchConsoleResponse(request));
  }),

  http.post("*/api/v2/admin/ops/dispatch/trips/:id/assign", async ({ params, request }) => {
    const id = String(params.id);
    const body = (await request.json()) as { driver_id?: number };
    const driverId = body.driver_id;
    if (!driverId) {
      return HttpResponse.json({ message: "Chauffeur requis" }, { status: 422 });
    }

    const idx = tripsState.data.findIndex((t) => t.id === id);
    if (idx < 0) {
      return HttpResponse.json({ message: "Course introuvable" }, { status: 404 });
    }
    const trip = tripsState.data[idx];
    if (!["matching", "requested"].includes(trip.status)) {
      return HttpResponse.json(
        { message: "Cette course n'est plus en attente d'assignation" },
        { status: 409 }
      );
    }

    const driverName = driverNames[driverId] ?? `Chauffeur #${driverId}`;
    const updated: Trip = {
      ...trip,
      status: "assigned",
      driver_name: driverName,
    };
    tripsState.data[idx] = updated;

    return HttpResponse.json({
      ok: true,
      trip: updated,
      message: `Course ${trip.ref} assignée à ${driverName}`,
    });
  }),

  http.get("*/api/v2/admin/ops/trips/:id/reassign-candidates", () => {
    const candidates = buildLocalAbidjanLiveMap().drivers
      .filter((d) => d.availability === "online")
      .map((d) => ({ id: d.id, name: d.name, vehicle: d.vehicle }));
    return HttpResponse.json({ data: candidates });
  }),

  http.post("*/api/v2/admin/ops/trips/:id/reassign", async ({ params, request }) => {
    const id = String(params.id);
    const body = (await request.json()) as { driver_id?: number };
    const driverId = body.driver_id;
    if (!driverId) {
      return HttpResponse.json({ message: "Chauffeur requis" }, { status: 422 });
    }
    const idx = tripsState.data.findIndex((t) => t.id === id);
    if (idx < 0) {
      return HttpResponse.json({ message: "Course introuvable" }, { status: 404 });
    }
    const trip = tripsState.data[idx];
    const driver = getLiveMapCatalogDrivers().find((d) => d.id === driverId);
    const driverName = driver?.name ?? driverNames[driverId] ?? `Chauffeur #${driverId}`;
    const updated: Trip = {
      ...trip,
      driver_name: driverName,
      status: trip.status === "matching" || trip.status === "requested" ? "assigned" : trip.status,
    };
    tripsState.data[idx] = updated;
    return HttpResponse.json({
      ok: true,
      trip: updated,
      message: `Course ${trip.ref} réassignée à ${driverName}`,
    });
  }),

  http.get("*/api/v2/admin/ops/trips/:id/forensic", ({ params }) => {
    const id = String(params.id);
    const trip = tripsState.data.find((t) => t.id === id);
    return HttpResponse.json({
      ...tripForensic,
      trip_id: id,
      ref: trip?.ref ?? tripForensic.ref,
      driver_name: trip?.driver_name ?? tripForensic.driver_name,
    });
  }),

  http.get("*/api/v2/admin/ops/crisis", () => {
    return HttpResponse.json(crisisState);
  }),

  http.put("*/api/v2/admin/ops/crisis", async ({ request }) => {
    const body = (await request.json()) as Partial<typeof crisisState>;
    crisisState = {
      ...crisisState,
      ...body,
      updated_at: new Date().toISOString(),
      updated_by: "admin@upjunoo.ci",
    };
    return HttpResponse.json(crisisState);
  }),
];
