import { http, HttpResponse } from "msw";
import franchiseDetail from "../data/franchise-detail.json";
import partnerDetail from "../data/partner-detail.json";
import zoneDetail from "../data/zone-detail.json";
import zonesMapOverviewSeed from "../data/zones-map-overview.json";
import type { Franchise, Partner, Zone } from "@/shared/types";
import {
  franchisesState,
  partnersState,
  zonesState,
  nextFranchiseId,
  nextPartnerId,
  nextZoneId,
  franchiseName,
} from "./network-state";

type StoredPolygon = NonNullable<(typeof zoneDetail)["polygon_geojson"]>;
const zonePolygonsStore: Record<number, StoredPolygon> = {};

function buildMapOverview() {
  const fromSeed = zonesMapOverviewSeed.zones.map((z) => ({ ...z }));
  const byId = new Map(fromSeed.map((z) => [z.id, z]));
  for (const [id, polygon] of Object.entries(zonePolygonsStore)) {
    const numId = Number(id);
    const existing = byId.get(numId);
    if (existing) {
      existing.polygon_geojson = polygon;
    } else {
      const row = zonesState.data.find((z) => z.id === numId);
      if (row) {
        byId.set(numId, {
          id: row.id,
          name: row.name,
          type: row.type,
          city: row.city,
          franchise_name: row.franchise_name,
          polygon_geojson: polygon,
        });
      }
    }
  }
  return {
    city: zonesMapOverviewSeed.city,
    zones: Array.from(byId.values()),
  };
}

function polygonForZone(id: number): StoredPolygon | undefined {
  if (zonePolygonsStore[id]) return zonePolygonsStore[id];
  const fromOverview = zonesMapOverviewSeed.zones.find((z) => z.id === id);
  if (fromOverview?.polygon_geojson) return fromOverview.polygon_geojson;
  if (id === zoneDetail.id) return zoneDetail.polygon_geojson;
  return undefined;
}

export const networkHandlers = [
  http.get("*/api/v2/admin/network/franchises", () => {
    return HttpResponse.json(franchisesState);
  }),

  http.post("*/api/v2/admin/network/franchises", async ({ request }) => {
    const body = (await request.json()) as Partial<Franchise> & {
      contact_email?: string;
      contact_phone?: string;
    };
    if (!body.name?.trim() || !body.city?.trim()) {
      return HttpResponse.json({ message: "Nom et ville requis" }, { status: 422 });
    }
    const row: Franchise = {
      id: nextFranchiseId(),
      name: body.name.trim(),
      city: body.city.trim(),
      status: body.status ?? "pending",
      partners_count: 0,
      drivers_count: 0,
      zones_count: 0,
      revenue_month_fcfa: 0,
    };
    franchisesState.data.push(row);
    franchisesState.meta.total = franchisesState.data.length;
    return HttpResponse.json(
      {
        ...franchiseDetail,
        ...row,
        contact_email: body.contact_email ?? "",
        contact_phone: body.contact_phone ?? "",
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  http.get("*/api/v2/admin/network/franchises/:id", ({ params }) => {
    const id = Number(params.id);
    const fromList = franchisesState.data.find((f) => f.id === id);
    return HttpResponse.json({
      ...franchiseDetail,
      ...fromList,
      id: id || franchiseDetail.id,
    });
  }),

  http.get("*/api/v2/admin/network/partners", () => {
    return HttpResponse.json(partnersState);
  }),

  http.post("*/api/v2/admin/network/partners", async ({ request }) => {
    const body = (await request.json()) as Partial<Partner> & { address?: string };
    if (!body.name?.trim() || !body.franchise_id || !body.contact_email?.trim()) {
      return HttpResponse.json(
        { message: "Nom, franchise et email requis" },
        { status: 422 }
      );
    }
    const row: Partner = {
      id: nextPartnerId(),
      name: body.name.trim(),
      franchise_id: body.franchise_id,
      franchise_name: franchiseName(body.franchise_id),
      city: body.city?.trim() ?? "Abidjan",
      drivers_count: 0,
      status: body.status ?? "pending",
      contact_email: body.contact_email.trim(),
      contact_phone: body.contact_phone?.trim() ?? "",
    };
    partnersState.data.push(row);
    partnersState.meta.total = partnersState.data.length;
    const fIdx = franchisesState.data.findIndex((f) => f.id === body.franchise_id);
    if (fIdx >= 0) {
      franchisesState.data[fIdx].partners_count += 1;
    }
    return HttpResponse.json(
      {
        ...partnerDetail,
        ...row,
        address: body.address ?? "",
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  http.get("*/api/v2/admin/network/partners/:id", ({ params }) => {
    const id = Number(params.id);
    const fromList = partnersState.data.find((p) => p.id === id);
    return HttpResponse.json({
      ...partnerDetail,
      ...fromList,
      id: id || partnerDetail.id,
    });
  }),

  http.get("*/api/v2/admin/network/zones", () => {
    return HttpResponse.json(zonesState);
  }),

  http.get("*/api/v2/admin/network/zones/map-overview", () => {
    return HttpResponse.json(buildMapOverview());
  }),

  http.post("*/api/v2/admin/network/zones", async ({ request }) => {
    const body = (await request.json()) as Partial<Zone> & {
      franchise_id?: number;
      polygon_geojson?: StoredPolygon;
    };
    if (!body.name?.trim() || !body.franchise_id) {
      return HttpResponse.json(
        { message: "Nom et franchise requis" },
        { status: 422 }
      );
    }
    if (
      body.polygon_geojson?.coordinates?.[0] &&
      body.polygon_geojson.coordinates[0].length < 4
    ) {
      return HttpResponse.json(
        { message: "Tracez au moins 3 points sur la carte" },
        { status: 422 }
      );
    }
    const row: Zone = {
      id: nextZoneId(),
      name: body.name.trim(),
      city: body.city?.trim() ?? "Abidjan",
      franchise_name: franchiseName(body.franchise_id),
      type: body.type ?? "standard",
      drivers_active: 0,
      surge_multiplier: body.surge_multiplier ?? 1,
    };
    zonesState.data.push(row);
    zonesState.meta.total = zonesState.data.length;
    if (body.polygon_geojson) {
      zonePolygonsStore[row.id] = body.polygon_geojson;
    }
    const fIdx = franchisesState.data.findIndex((f) => f.id === body.franchise_id);
    if (fIdx >= 0) {
      franchisesState.data[fIdx].zones_count += 1;
    }
    return HttpResponse.json(
      {
        ...zoneDetail,
        ...row,
        franchise_id: body.franchise_id,
        status: "active",
        polygon_geojson: body.polygon_geojson ?? zoneDetail.polygon_geojson,
      },
      { status: 201 }
    );
  }),

  http.get("*/api/v2/admin/network/zones/:id", ({ params }) => {
    const id = Number(params.id);
    const fromList = zonesState.data.find((z) => z.id === id);
    const polygon = polygonForZone(id);
    return HttpResponse.json({
      ...zoneDetail,
      ...fromList,
      id: id || zoneDetail.id,
      polygon_geojson: polygon ?? zoneDetail.polygon_geojson,
    });
  }),

  http.put("*/api/v2/admin/network/zones/:id/polygon", async ({ params, request }) => {
    const id = Number(params.id);
    const body = (await request.json()) as { polygon_geojson?: StoredPolygon };
    const ring = body.polygon_geojson?.coordinates?.[0];
    if (!ring || ring.length < 4) {
      return HttpResponse.json(
        { message: "Polygone invalide (min. 3 points)" },
        { status: 422 }
      );
    }
    if (!zonesState.data.some((z) => z.id === id)) {
      return HttpResponse.json({ message: "Zone introuvable" }, { status: 404 });
    }
    zonePolygonsStore[id] = body.polygon_geojson!;
    const fromList = zonesState.data.find((z) => z.id === id);
    return HttpResponse.json({
      ...zoneDetail,
      ...fromList,
      id,
      polygon_geojson: body.polygon_geojson,
    });
  }),
];
