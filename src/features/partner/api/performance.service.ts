import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

interface ApiVehiclePerformanceItem {
  id: string;
  vehicle_id?: string;
  brand?: string | null;
  model?: string | null;
  plate?: string | null;
  plate_number?: string | null;
  total_km?: number;
  trips_count?: number;
  revenue_fcfa?: number;
  acceptance_rate_pct?: number;
  avg_rating?: number;
  period?: string;
  partner_id?: string;
  driver_id?: string | null;
  manufacture_year?: number | null;
  metadata?: {
    brand?: string;
    model?: string;
    category?: string;
  };
}

interface PerformanceApiResponse<T> {
  status: string;
  items?: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

interface ApiFleetVehicleAssignment {
  id: string;
  driver_id?: string | null;
}

function readOptionalText(value?: string | null): string {
  const text = value?.trim();
  return text && text !== "—" ? text : "";
}

function mapApiVehicleToPerformance(item: ApiVehiclePerformanceItem): VehiclePerformance {
  const brand = readOptionalText(item.brand) || readOptionalText(item.metadata?.brand);
  const model = readOptionalText(item.model) || readOptionalText(item.metadata?.model);
  const plate = readOptionalText(item.plate) || readOptionalText(item.plate_number);

  return {
    id: item.id,
    vehicle_id: item.vehicle_id ?? item.id,
    driver_id: item.driver_id ?? undefined,
    brand,
    model,
    plate: plate || undefined,
    category_code: item.metadata?.category ?? undefined,
    year: item.manufacture_year ?? undefined,
    total_km: item.total_km ?? 0,
    trips_count: item.trips_count ?? 0,
    revenue_fcfa: item.revenue_fcfa ?? 0,
    acceptance_rate_pct: item.acceptance_rate_pct ?? 0,
    avg_rating: item.avg_rating ?? 0,
    period: item.period ?? "N/A",
  };
}

function mapVehiclePerformanceResponse(
  response: PerformanceApiResponse<ApiVehiclePerformanceItem>
): Paginated<VehiclePerformance> {
  if ("status" in response && response.status === "ok" && response.items) {
    const data = response.items.map((item) => mapApiVehicleToPerformance(item));

    return {
      data,
      meta: response.pagination
        ? {
            current_page: response.pagination.page,
            last_page: response.pagination.hasMore
              ? response.pagination.page + 1
              : response.pagination.page,
            per_page: response.pagination.limit,
            total: response.pagination.total,
          }
        : {
            current_page: 1,
            last_page: 1,
            per_page: 20,
            total: response.items.length,
          },
    };
  }
  return { data: [], meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 } };
}

interface ApiDriverPerformanceItem {
  id: string;
  driver_id?: string;
  user_id?: string;
  driver_code?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  displayName?: string | null;
  phone?: string | null;
  profile?: {
    firstName?: string | null;
    first_name?: string | null;
    lastName?: string | null;
    last_name?: string | null;
    displayName?: string | null;
    display_name?: string | null;
    phone?: string | null;
  };
  trips_completed?: number;
  trips_count?: number;
  trips_cancelled?: number;
  revenue_fcfa?: number;
  revenue_xof?: number;
  avg_rating?: number;
  acceptance_rate_pct?: number;
  cancellation_rate_pct?: number;
  period?: string;
  metadata?: Record<string, unknown>;
}

function resolveDriverName(
  item: ApiDriverPerformanceItem,
  driverId: string
): { first_name: string; last_name: string } {
  const profile = item.profile ?? {};
  const firstRaw =
    item.first_name ??
    profile.firstName ??
    profile.first_name ??
    null;
  const lastRaw =
    item.last_name ?? profile.lastName ?? profile.last_name ?? null;

  if (firstRaw || lastRaw) {
    return {
      first_name: firstRaw?.trim() || "",
      last_name: lastRaw?.trim() || "",
    };
  }

  const display =
    item.displayName?.trim() ||
    profile.displayName?.trim() ||
    profile.display_name?.trim();
  if (display) {
    const parts = display.split(/\s+/).filter(Boolean);
    return {
      first_name: parts[0] ?? "",
      last_name: parts.slice(1).join(" "),
    };
  }

  if (item.driver_code?.trim()) {
    return { first_name: item.driver_code.trim(), last_name: "" };
  }

  return {
    first_name: "Chauffeur",
    last_name: driverId.slice(-8).toUpperCase(),
  };
}

function mapApiDriverToPerformance(item: ApiDriverPerformanceItem): DriverPerformance {
  const driverId = String(item.driver_id ?? item.user_id ?? item.id);
  const name = resolveDriverName(item, driverId);

  return {
    id: item.id,
    driver_id: driverId,
    first_name: name.first_name,
    last_name: name.last_name,
    trips_completed: item.trips_completed ?? item.trips_count ?? 0,
    trips_cancelled: item.trips_cancelled ?? 0,
    revenue_fcfa: item.revenue_fcfa ?? item.revenue_xof ?? 0,
    avg_rating: item.avg_rating ?? 0,
    acceptance_rate_pct: item.acceptance_rate_pct ?? 0,
    cancellation_rate_pct: item.cancellation_rate_pct ?? 0,
    period: item.period ?? "N/A",
  };
}

function mapDriverPerformanceResponse(
  response: PerformanceApiResponse<ApiDriverPerformanceItem> | Paginated<ApiDriverPerformanceItem>
): Paginated<DriverPerformance> {
  if ("status" in response && response.status === "ok" && response.items) {
    return {
      data: response.items.map(mapApiDriverToPerformance),
      meta: response.pagination
        ? {
            current_page: response.pagination.page,
            last_page: response.pagination.hasMore
              ? response.pagination.page + 1
              : response.pagination.page,
            per_page: response.pagination.limit,
            total: response.pagination.total,
          }
        : {
            current_page: 1,
            last_page: 1,
            per_page: 20,
            total: response.items.length,
          },
    };
  }
  if ("data" in response && Array.isArray(response.data)) {
    return {
      data: (response.data as ApiDriverPerformanceItem[]).map(mapApiDriverToPerformance),
      meta: response.meta,
    };
  }
  return { data: [], meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 } };
}

export interface VehiclePerformance {
  id: string;
  vehicle_id: string;
  driver_id?: string;
  brand: string;
  model: string;
  plate?: string;
  category_code?: string;
  year?: number;
  total_km: number;
  trips_count: number;
  revenue_fcfa: number;
  acceptance_rate_pct: number;
  avg_rating: number;
  period: string;
}

export interface DriverPerformance {
  id: string;
  driver_id: string;
  first_name: string;
  last_name: string;
  trips_completed: number;
  trips_cancelled: number;
  revenue_fcfa: number;
  avg_rating: number;
  acceptance_rate_pct: number;
  cancellation_rate_pct: number;
  period: string;
}

/** Ligne fusionnée véhicule + chauffeur pour le tableau Analytics. */
export interface FleetPerformanceRow {
  id: string;
  vehicle_id?: string;
  driver_id?: string;
  brand?: string;
  model?: string;
  plate?: string;
  category_code?: string;
  year?: number;
  driver_first_name?: string;
  driver_last_name?: string;
  total_km: number;
  trips_count: number;
  trips_completed: number;
  trips_cancelled: number;
  revenue_fcfa: number;
  avg_rating: number;
  acceptance_rate_pct: number;
  cancellation_rate_pct: number;
}

function driverLabel(driver?: DriverPerformance): string {
  if (!driver) return "";
  return [driver.first_name, driver.last_name].filter(Boolean).join(" ").trim();
}

function buildFleetRow(
  vehicle: VehiclePerformance,
  driver?: DriverPerformance
): FleetPerformanceRow {
  const revenue = Math.max(vehicle.revenue_fcfa, driver?.revenue_fcfa ?? 0);
  const completed = Math.max(vehicle.trips_count, driver?.trips_completed ?? 0);
  const driverId = driver ? String(driver.driver_id) : vehicle.driver_id;

  return {
    id: driverId ? `${vehicle.vehicle_id}-${driverId}` : vehicle.vehicle_id,
    vehicle_id: vehicle.vehicle_id,
    driver_id: driverId,
    brand: vehicle.brand,
    model: vehicle.model,
    plate: vehicle.plate,
    category_code: vehicle.category_code,
    year: vehicle.year,
    driver_first_name: driver?.first_name,
    driver_last_name: driver?.last_name,
    total_km: vehicle.total_km,
    trips_count: completed,
    trips_completed: driver?.trips_completed ?? vehicle.trips_count,
    trips_cancelled: driver?.trips_cancelled ?? 0,
    revenue_fcfa: revenue,
    avg_rating: vehicle.avg_rating || driver?.avg_rating || 0,
    acceptance_rate_pct: driver?.acceptance_rate_pct ?? vehicle.acceptance_rate_pct,
    cancellation_rate_pct: driver?.cancellation_rate_pct ?? 0,
  };
}

function findDriverByStats(
  vehicle: VehiclePerformance,
  candidates: DriverPerformance[]
): DriverPerformance | undefined {
  if (vehicle.revenue_fcfa <= 0 && vehicle.trips_count <= 0) {
    return undefined;
  }

  const exact = candidates.filter(
    (driver) =>
      driver.revenue_fcfa === vehicle.revenue_fcfa &&
      driver.trips_completed === vehicle.trips_count
  );
  if (exact.length === 1) return exact[0];

  if (vehicle.revenue_fcfa > 0) {
    const byRevenue = candidates.filter(
      (driver) => driver.revenue_fcfa === vehicle.revenue_fcfa
    );
    if (byRevenue.length === 1) return byRevenue[0];
  }

  return undefined;
}

function enrichVehiclesWithAssignments(
  vehicles: VehiclePerformance[],
  assignments: Map<string, string>
): VehiclePerformance[] {
  return vehicles.map((vehicle) => ({
    ...vehicle,
    driver_id: vehicle.driver_id ?? assignments.get(vehicle.vehicle_id),
  }));
}

export function mergeFleetPerformance(
  vehicles: VehiclePerformance[],
  drivers: DriverPerformance[],
  assignments: Map<string, string> = new Map()
): FleetPerformanceRow[] {
  const enrichedVehicles = enrichVehiclesWithAssignments(vehicles, assignments);
  const driversById = new Map(drivers.map((driver) => [String(driver.driver_id), driver]));
  const matchedDriverIds = new Set<string>();
  const rows: FleetPerformanceRow[] = [];

  for (const vehicle of enrichedVehicles) {
    let driverId = vehicle.driver_id ? String(vehicle.driver_id) : undefined;
    let driver = driverId ? driversById.get(driverId) : undefined;

    if (!driver) {
      const unmatched = drivers.filter(
        (candidate) => !matchedDriverIds.has(String(candidate.driver_id))
      );
      const statsMatch = findDriverByStats(vehicle, unmatched);
      if (statsMatch) {
        driver = statsMatch;
        driverId = String(statsMatch.driver_id);
      }
    }

    if (driverId) matchedDriverIds.add(driverId);
    rows.push(buildFleetRow(vehicle, driver));
  }

  const activeLabels = new Set(
    rows
      .filter((row) => row.driver_id && (row.revenue_fcfa > 0 || row.trips_completed > 0))
      .map((row) =>
        [row.driver_first_name, row.driver_last_name].filter(Boolean).join(" ").trim()
      )
      .filter(Boolean)
  );

  for (const driver of drivers) {
    const driverId = String(driver.driver_id);
    if (matchedDriverIds.has(driverId)) continue;

    const label = driverLabel(driver);
    const isInactiveDuplicate =
      driver.revenue_fcfa <= 0 &&
      driver.trips_completed <= 0 &&
      label &&
      activeLabels.has(label);

    if (isInactiveDuplicate) continue;

    rows.push({
      id: `driver-${driverId}`,
      driver_id: driverId,
      driver_first_name: driver.first_name,
      driver_last_name: driver.last_name,
      total_km: 0,
      trips_count: driver.trips_completed,
      trips_completed: driver.trips_completed,
      trips_cancelled: driver.trips_cancelled,
      revenue_fcfa: driver.revenue_fcfa,
      avg_rating: driver.avg_rating,
      acceptance_rate_pct: driver.acceptance_rate_pct,
      cancellation_rate_pct: driver.cancellation_rate_pct,
    });
  }

  return rows.sort((a, b) => b.revenue_fcfa - a.revenue_fcfa);
}

async function fetchVehicleDriverAssignments(
  partnerId: string | number
): Promise<Map<string, string>> {
  try {
    const response = await apiClient.get<{
      status?: string;
      items?: ApiFleetVehicleAssignment[];
    }>(
      `${LINKS.v1.partners.vehicles(partnerId)}${buildV1ListQuery({ per_page: 200 })}`
    );
    const map = new Map<string, string>();
    for (const item of response.items ?? []) {
      if (item.id && item.driver_id) {
        map.set(item.id, item.driver_id);
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

export const partnerPerformanceService = {
  vehicles: async (partnerId: string | number, params?: ListParams) => {
    const response = await apiClient.get<PerformanceApiResponse<ApiVehiclePerformanceItem>>(
      `${LINKS.partner.vehicles.performance(partnerId)}${buildListQuery(params)}`
    );
    return mapVehiclePerformanceResponse(response);
  },

  drivers: async (partnerId: string | number, params?: ListParams) => {
    const response = await apiClient.get<PerformanceApiResponse<ApiDriverPerformanceItem>>(
      `${LINKS.partner.vehicles.driverPerformance(partnerId)}${buildListQuery(params)}`
    );
    return mapDriverPerformanceResponse(response);
  },

  fleet: async (partnerId: string | number, params?: ListParams) => {
    const [vehicles, drivers, assignments] = await Promise.all([
      partnerPerformanceService.vehicles(partnerId, params),
      partnerPerformanceService.drivers(partnerId, params),
      fetchVehicleDriverAssignments(partnerId),
    ]);
    const data = mergeFleetPerformance(vehicles.data, drivers.data, assignments);
    return {
      data,
      meta: {
        total: data.length,
        current_page: 1,
        last_page: 1,
        per_page: data.length || 20,
      },
      vehiclesMeta: vehicles.meta,
      driversMeta: drivers.meta,
    };
  },
};
