import { http, HttpResponse } from "msw";
import dispatchConsoleSeed from "../data/dispatch-console.json";
import {
  buildLocalAbidjanLiveMap,
  getLiveMapCatalogDrivers,
} from "../lib/liveMapBuilder";
import tripsListSeed from "../data/trips-list.json";
import type { DispatchConsoleData, DispatchQueueItem, Trip } from "@/shared/types";

type TripsListResponse = { data: Trip[]; meta: typeof tripsListSeed.meta };

let dispatchTripsState: TripsListResponse = {
  data: tripsListSeed.data as Trip[],
  meta: tripsListSeed.meta,
};

function buildDispatchQueue(): DispatchQueueItem[] {
  const pending = dispatchTripsState.data.filter((t) =>
    ["matching", "requested"].includes(t.status)
  );
  return dispatchConsoleSeed.queue
    .filter((item) => pending.some((t) => t.id === item.trip.id))
    .map((item) => {
      const trip = dispatchTripsState.data.find((t) => t.id === item.trip.id);
      return trip ? { ...item, trip } : item;
    }) as DispatchQueueItem[];
}

function dispatchConsoleResponse(): DispatchConsoleData {
  const queue = buildDispatchQueue();
  const localMap = buildLocalAbidjanLiveMap();
  const online = localMap.drivers.filter((d) => d.availability === "online").length;
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
  getLiveMapCatalogDrivers().map((d) => [d.id, d.name])
);

function nextTripRef(): string {
  const n = 88000 + dispatchTripsState.data.length;
  return `TR-${n}`;
}

export const dispatchHandlers = [
  http.get("*/api/v2/dispatch/ops/console", () => {
    return HttpResponse.json(dispatchConsoleResponse());
  }),

  http.get("*/api/v2/dispatch/ops/map", () => {
    return HttpResponse.json(buildLocalAbidjanLiveMap());
  }),

  http.post("*/api/v2/dispatch/ops/trips/:id/assign", async ({ params, request }) => {
    const id = String(params.id);
    const body = (await request.json()) as { driver_id?: number };
    const driverId = body.driver_id;
    if (!driverId) {
      return HttpResponse.json({ message: "driver_id requis" }, { status: 422 });
    }
    const idx = dispatchTripsState.data.findIndex((t) => t.id === id);
    if (idx < 0) {
      return HttpResponse.json({ message: "Course introuvable" }, { status: 404 });
    }
    const trip = dispatchTripsState.data[idx];
    const updated: Trip = {
      ...trip,
      status: "assigned",
      driver_name: driverNames[driverId] ?? `Chauffeur #${driverId}`,
    };
    dispatchTripsState = {
      ...dispatchTripsState,
      data: dispatchTripsState.data.map((t, i) => (i === idx ? updated : t)),
    };
    return HttpResponse.json(updated);
  }),

  http.post("*/api/v2/dispatch/bookings", async ({ request }) => {
    const body = (await request.json()) as {
      from_label?: string;
      to_label?: string;
      client_name?: string;
      client_phone?: string;
      service?: Trip["service"];
      payment_method?: Trip["payment_method"];
    };
    if (!body.from_label?.trim() || !body.to_label?.trim()) {
      return HttpResponse.json(
        { message: "Adresses départ et arrivée requises" },
        { status: 422 }
      );
    }
    if (!body.client_name?.trim() || !body.client_phone?.trim()) {
      return HttpResponse.json(
        { message: "Client requis" },
        { status: 422 }
      );
    }
    const id = String(Date.now());
    const trip: Trip = {
      id,
      ref: nextTripRef(),
      service: body.service ?? "taxi",
      from_label: body.from_label,
      to_label: body.to_label,
      client_name: body.client_name,
      amount_fcfa: 3500,
      status: "matching",
      payment_method: body.payment_method ?? "cash",
      created_at: new Date().toISOString(),
    };
    dispatchTripsState = {
      ...dispatchTripsState,
      data: [trip, ...dispatchTripsState.data],
      meta: {
        ...dispatchTripsState.meta,
        total: dispatchTripsState.meta.total + 1,
      },
    };
    return HttpResponse.json(trip, { status: 201 });
  }),
];
