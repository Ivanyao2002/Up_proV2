import type { TripDetail } from "@/shared/types";
import { resolveVehicleMapIconUrl } from "@/shared/lib/vehicleMapIcons";
import type { ApiAdminOrderDetailPayload } from "./adminOrderDetail.api.types";
import type {
  ApiLiveMapDriver,
  ApiLiveMapDriverLocation,
} from "./liveMap.api.types";
import {
  extractLiveMapDriverVehicleColor,
  extractLiveMapDriverVehicleColorLabel,
} from "./liveMapVehicleColor";

type UnknownRecord = Record<string, unknown>;

const LABEL_OBJECT_KEYS = [
  "name",
  "label",
  "displayName",
  "value",
  "text",
  "title",
] as const;

function isBrokenLabel(value: string): boolean {
  return !value || value.includes("[object Object]");
}

function readString(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "object") return undefined;
  const s = String(value).trim();
  return s && !isBrokenLabel(s) ? s : undefined;
}

/** Extrait un libellé affichable (gère les objets imbriqués type `{ name: "Toyota" }`). */
function readLabelValue(value: unknown): string | undefined {
  if (value == null) return undefined;

  if (typeof value === "string") {
    const s = value.trim();
    return s && !isBrokenLabel(s) ? s : undefined;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    const s = String(value).trim();
    return s && !isBrokenLabel(s) ? s : undefined;
  }

  if (typeof value === "object") {
    const record = value as UnknownRecord;
    for (const key of LABEL_OBJECT_KEYS) {
      const nested = readLabelValue(record[key]);
      if (nested) return nested;
    }
    const brand = readLabelValue(record.brand ?? record.make ?? record.brandName);
    const model = readLabelValue(record.model ?? record.brandModel ?? record.brand_model);
    if (brand && model) return `${brand} ${model}`;
    return model ?? brand;
  }

  return undefined;
}

function readVehiclePlate(vehicle: UnknownRecord | null | undefined): string | undefined {
  if (!vehicle) return undefined;
  return readLabelValue(
    vehicle.plateNumber ??
      vehicle.plate ??
      vehicle.licensePlate ??
      vehicle.license_plate
  );
}

function readVehicleModel(vehicle: UnknownRecord | null | undefined): string | undefined {
  if (!vehicle) return undefined;

  const brandModelRaw = vehicle.brandModel ?? vehicle.brand_model;
  if (brandModelRaw && typeof brandModelRaw === "object") {
    const fromBrandModel = readLabelValue(brandModelRaw);
    if (fromBrandModel) return fromBrandModel;
  }

  const brand = readLabelValue(vehicle.brand ?? vehicle.make ?? vehicle.brandName);
  const model = readLabelValue(vehicle.model);
  if (brand && model) return `${brand} ${model}`;
  return model ?? brand;
}

export function formatApiVehicleLabel(
  vehicle: UnknownRecord | null | undefined,
  fallbackLabel?: unknown
): string | undefined {
  const plate = readVehiclePlate(vehicle);
  const model = readVehicleModel(vehicle);
  const cleanedFallback = readLabelValue(fallbackLabel)?.replace(/^[·•]\s*/, "");

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

function readSummaryVehicle(block: UnknownRecord | undefined): UnknownRecord | undefined {
  const summary = block?.summary;
  if (!summary || typeof summary !== "object") return undefined;
  const vehicle = (summary as UnknownRecord).vehicle;
  return vehicle && typeof vehicle === "object" ? (vehicle as UnknownRecord) : undefined;
}

export function extractTripVehicleFields(
  payload: ApiAdminOrderDetailPayload
): Pick<
  TripDetail,
  | "vehicle_id"
  | "vehicle_label"
  | "vehicle_plate"
  | "vehicle_color"
  | "vehicle_color_label"
  | "vehicle_icon_url"
  | "driver_location"
> {
  const block = readDriverBlock(payload);
  const vehicleRaw = block?.vehicle;
  const vehicle =
    vehicleRaw && typeof vehicleRaw === "object"
      ? (vehicleRaw as UnknownRecord)
      : undefined;
  const summaryVehicle = readSummaryVehicle(block);
  const ride = payload.ride as UnknownRecord | undefined;
  const rideVehicle =
    ride?.vehicle && typeof ride.vehicle === "object"
      ? (ride.vehicle as UnknownRecord)
      : undefined;
  const resolvedVehicle = vehicle ?? summaryVehicle ?? rideVehicle;
  const fallbackLabel =
    block?.vehicleLabel ??
    summaryVehicle?.label ??
    summaryVehicle?.model;

  const colorSource = {
    vehicle: resolvedVehicle ?? null,
  } as ApiLiveMapDriver;
  const vehicle_color = extractLiveMapDriverVehicleColor(colorSource);
  const vehicle_color_label =
    extractLiveMapDriverVehicleColorLabel(colorSource);

  return {
    vehicle_id:
      readString(vehicle?.id) ??
      readString(summaryVehicle?.id) ??
      readString(rideVehicle?.id) ??
      readString(ride?.vehicle_id) ??
      readString(block?.current_vehicle_id),
    vehicle_label: formatApiVehicleLabel(resolvedVehicle, fallbackLabel),
    vehicle_plate:
      readVehiclePlate(resolvedVehicle) ?? readVehiclePlate(summaryVehicle),
    vehicle_color: vehicle_color ?? null,
    vehicle_color_label: vehicle_color_label ?? null,
    vehicle_icon_url: resolveVehicleMapIconUrl(vehicle_color),
    driver_location: mapApiLocationToTripDriverLocation(readLocationRecord(payload)),
  };
}
