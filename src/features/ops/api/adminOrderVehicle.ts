import type { TripDetail } from "@/shared/types";
import type { ApiAdminOrderDetailPayload } from "./adminOrderDetail.api.types";
import type { ApiLiveMapDriverLocation } from "./liveMap.api.types";

type UnknownRecord = Record<string, unknown>;

function readString(value: unknown): string | undefined {
  if (value == null) return undefined;
  const s = String(value).trim();
  return s || undefined;
}

function readVehiclePlate(vehicle: UnknownRecord | null | undefined): string | undefined {
  if (!vehicle) return undefined;
  return readString(
    vehicle.plateNumber ??
      vehicle.plate ??
      vehicle.licensePlate ??
      vehicle.license_plate
  );
}

function readVehicleModel(vehicle: UnknownRecord | null | undefined): string | undefined {
  if (!vehicle) return undefined;
  const brand = readString(vehicle.brand ?? vehicle.make ?? vehicle.brandName);
  const model = readString(vehicle.model ?? vehicle.brandModel ?? vehicle.brand_model);
  if (brand && model) return `${brand} ${model}`;
  return model ?? brand;
}

export function formatApiVehicleLabel(
  vehicle: UnknownRecord | null | undefined,
  fallbackLabel?: string | null
): string | undefined {
  const plate = readVehiclePlate(vehicle);
  const model = readVehicleModel(vehicle);
  const cleanedFallback = readString(fallbackLabel)?.replace(/^[·•]\s*/, "");

  if (model && plate) return `${model} · ${plate}`;
  if (cleanedFallback) return cleanedFallback;
  if (plate) return plate;
  if (model) return model;
  return undefined;
}

function readDriverBlock(payload: ApiAdminOrderDetailPayload): UnknownRecord | undefined {
  const raw = payload.driver;
  if (!raw || typeof raw !== "object") return undefined;
  return raw as UnknownRecord;
}

function readLocationRecord(
  payload: ApiAdminOrderDetailPayload
): UnknownRecord | undefined {
  const tracking = payload.tracking as UnknownRecord | undefined;
  const trackingLoc = tracking?.driverLocation;
  if (trackingLoc && typeof trackingLoc === "object") {
    return trackingLoc as UnknownRecord;
  }

  const block = readDriverBlock(payload);
  const blockLoc = block?.location;
  if (blockLoc && typeof blockLoc === "object") {
    return blockLoc as UnknownRecord;
  }

  const summary = block?.summary;
  if (summary && typeof summary === "object") {
    const summaryLoc = (summary as UnknownRecord).location;
    if (summaryLoc && typeof summaryLoc === "object") {
      return summaryLoc as UnknownRecord;
    }
  }

  const rideDriver = payload.ride?.driver as UnknownRecord | undefined;
  const rideLoc = rideDriver?.location;
  if (rideLoc && typeof rideLoc === "object") {
    return rideLoc as UnknownRecord;
  }

  return undefined;
}

export function mapApiLocationToTripDriverLocation(
  loc: UnknownRecord | ApiLiveMapDriverLocation | null | undefined
): TripDetail["driver_location"] | undefined {
  if (!loc || typeof loc !== "object") return undefined;

  const lat = (loc as ApiLiveMapDriverLocation).lat ?? (loc as UnknownRecord).latitude;
  const lng = (loc as ApiLiveMapDriverLocation).lng ?? (loc as UnknownRecord).longitude;
  if (lat == null || lng == null || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
    return undefined;
  }

  const heading = (loc as ApiLiveMapDriverLocation).heading ?? (loc as UnknownRecord).heading;
  const speed =
    (loc as ApiLiveMapDriverLocation).speedKmh ?? (loc as UnknownRecord).speedKmh;

  return {
    lat: Number(lat),
    lng: Number(lng),
    heading: heading != null ? Number(heading) : undefined,
    speed_kmh: speed != null ? Number(speed) : undefined,
    recorded_at: readString((loc as UnknownRecord).recordedAt),
  };
}

export function extractTripVehicleFields(
  payload: ApiAdminOrderDetailPayload
): Pick<TripDetail, "vehicle_id" | "vehicle_label" | "vehicle_plate" | "driver_location"> {
  const block = readDriverBlock(payload);
  const vehicleRaw = block?.vehicle;
  const vehicle =
    vehicleRaw && typeof vehicleRaw === "object"
      ? (vehicleRaw as UnknownRecord)
      : undefined;

  return {
    vehicle_id: readString(vehicle?.id),
    vehicle_label: formatApiVehicleLabel(vehicle, readString(block?.vehicleLabel)),
    vehicle_plate: readVehiclePlate(vehicle),
    driver_location: mapApiLocationToTripDriverLocation(readLocationRecord(payload)),
  };
}
