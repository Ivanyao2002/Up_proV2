import type { TripDetail } from "@/shared/types";
import { formatDateTime } from "@/shared/lib/format";
import {
  isTripLiveOnMap,
  isTripWithAssignedDriver,
} from "@/shared/lib/tripDriver";

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
  if (!trip.vehicle_label && !trip.vehicle_plate) return null;

  const live = isTripLiveOnMap(trip.status);
  const speed = driverLocation?.speed_kmh ?? trip.driver_location?.speed_kmh;
  const recordedAt =
    driverLocation?.recorded_at ?? trip.driver_location?.recorded_at;

  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-card">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
        Véhicule
      </h3>
      <p className="mt-2 font-medium text-foreground">
        {trip.vehicle_label ?? trip.vehicle_plate}
      </p>
      {trip.vehicle_label && trip.vehicle_plate && trip.vehicle_label !== trip.vehicle_plate && (
        <p className="text-sm text-muted">Plaque {trip.vehicle_plate}</p>
      )}
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
