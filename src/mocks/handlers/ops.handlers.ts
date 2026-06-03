import { http, HttpResponse } from "msw";
import tripsListSeed from "../data/trips-list.json";
import tripDetail from "../data/trip-detail.json";
import liveMap from "../data/live-map.json";
import dispatchConsoleSeed from "../data/dispatch-console.json";
import tripForensic from "../data/trip-forensic.json";
import crisisModeSeed from "../data/crisis-mode.json";
import type { DispatchConsoleData, DispatchQueueItem, Trip } from "@/shared/types";

type TripsListResponse = { data: Trip[]; meta: typeof tripsListSeed.meta };

let tripsState: TripsListResponse = {
  data: tripsListSeed.data as Trip[],
  meta: tripsListSeed.meta,
};

function buildDispatchQueue(): DispatchQueueItem[] {
  const pending = tripsState.data.filter((t) =>
    ["matching", "requested"].includes(t.status)
  );
  return dispatchConsoleSeed.queue
    .filter((item) => pending.some((t) => t.id === item.trip.id))
    .map((item) => {
      const trip = tripsState.data.find((t) => t.id === item.trip.id);
      return trip ? { ...item, trip } : item;
    }) as DispatchQueueItem[];
}

function dispatchConsoleResponse(): DispatchConsoleData {
  const queue = buildDispatchQueue();
  const online = liveMap.drivers.filter((d) => d.availability === "online").length;
  return {
    stats: {
      queue_size: queue.length,
      online_nearby: online,
      avg_wait_min: dispatchConsoleSeed.stats.avg_wait_min,
    },
    queue,
    map: dispatchConsoleSeed.map,
  };
}

const driverNames: Record<number, string> = Object.fromEntries(
  liveMap.drivers.map((d) => [d.id, d.name])
);

let crisisState = { ...crisisModeSeed };

export const opsHandlers = [
  http.get("*/api/v2/admin/ops/trips", () => {
    return HttpResponse.json(tripsState);
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

  http.get("*/api/v2/admin/ops/map", () => {
    return HttpResponse.json(liveMap);
  }),

  http.get("*/api/v2/admin/ops/dispatch", () => {
    return HttpResponse.json(dispatchConsoleResponse());
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
    const candidates = liveMap.drivers
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
    const driver = liveMap.drivers.find((d) => d.id === driverId);
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
