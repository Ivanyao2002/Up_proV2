import Link from "next/link";
import type { TripDetail } from "@/shared/types";
import { formatDateTime } from "@/shared/lib/format";
import { LiveMapVehicleColorInfo } from "./LiveMapVehicleColorInfo";
import {
  isTripLiveOnMap,
  isTripWithAssignedDriver,
} from "@/shared/lib/tripDriver";
import { buildAdminVehicleDetailPath } from "@/features/fleet/lib/vehicleRoutes";

interface TripAssignedVehicleCardProps {
  trip: TripDetail;
  driverLocation?: TripDetail["driver_location"];
  driverLive?: boolean;
}

export function TripAssignedVehicleCard({
  trip,
  driverLocation,
  driverLive,
}: TripAssignedVehicleCardProps) {
  if (!isTripWithAssignedDriver(trip.status)) return null;
  if (!trip.vehicle_label && !trip.vehicle_plate && !trip.vehicle_id) return null;

  const vehicleDetailHref = trip.vehicle_id
    ? buildAdminVehicleDetailPath(trip.vehicle_id, trip.partner_id)
    : null;
  const displayLabel =
    trip.vehicle_label ?? trip.vehicle_plate ?? "Véhicule assigné";

  const live = isTripLiveOnMap(trip.status);
  const speed = driverLocation?.speed_kmh ?? trip.driver_location?.speed_kmh;
  const recordedAt =
    driverLocation?.recorded_at ?? trip.driver_location?.recorded_at;

  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-card">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
        Véhicule
      </h3>
      {vehicleDetailHref ? (
        <Link
          href={vehicleDetailHref}
          className="mt-2 block font-medium text-foreground hover:text-teal"
        >
          {displayLabel}
        </Link>
      ) : (
        <p className="mt-2 font-medium text-foreground">{displayLabel}</p>
      )}
      {trip.vehicle_label && trip.vehicle_plate && trip.vehicle_label !== trip.vehicle_plate && (
        <p className="text-sm text-muted">Plaque {trip.vehicle_plate}</p>
      )}
      <LiveMapVehicleColorInfo
        driver={{
          vehicle_color: trip.vehicle_color,
          vehicle_color_label: trip.vehicle_color_label,
          vehicle_color_hex: null,
        }}
        className="mt-2"
      />
      {live && speed != null && Number.isFinite(speed) && (
        <p className="mt-1 text-sm text-teal-dark">
          En course · {Math.round(speed)} km/h
          {driverLive ? " · Live" : ""}
        </p>
      )}
      {live && recordedAt && (
        <p className="mt-1 text-xs text-muted">
          Position {formatDateTime(recordedAt)}
        </p>
      )}
    </div>
  );
}
