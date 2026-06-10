"use client";

import type { LiveMapData, LiveMapDriver } from "@/shared/types";
import { AvailabilityPill } from "@/shared/ui/DriverPills";
import { usePartnerDriverLive } from "../api/partnerDriverDetail.queries";

import { projectDriver } from "@/features/ops/lib/liveMapProjection";
import { resolveMapEngine } from "@/core/config/mapProvider";
import { DriverPositionMap } from "@/shared/components/map/DriverPositionMap";
import { LIVE_MAP_DEFAULT_VEHICLE_ICON } from "@/shared/lib/vehicleMapIcons";
import { liveMapPulseBackground } from "@/features/ops/lib/liveMapAvailabilityColors";
import { LIVE_MAP_AVAILABILITY_COLORS } from "@/features/ops/lib/liveMapAvailabilityColors";

interface PartnerDriverLiveMapProps {
  driverId: string;
  driverName: string;
}

export function PartnerDriverLiveMap({
  driverId,
  driverName,
}: PartnerDriverLiveMapProps) {
  const { data, isLoading, isError } = usePartnerDriverLive(driverId);

  if (isLoading) {
    return (
      <div className="relative h-52 overflow-hidden rounded-card border border-border bg-map shadow-card sm:h-56">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-navy/8 via-transparent to-teal/5" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-card border border-border bg-surface px-4 py-8 text-center text-sm text-muted">
        Position live indisponible pour ce chauffeur.
      </div>
    );
  }

  const { driver, bounds } = data;
  const pos = projectDriver(driver, bounds);
  const isPulsing =
    driver.availability === "online" || driver.availability === "on_trip";
  const mapEngine = resolveMapEngine();
  const useRealMap = mapEngine === "osm" || mapEngine === "mapbox";
  const vehicleIcon = driver.vehicle_icon_url ?? LIVE_MAP_DEFAULT_VEHICLE_ICON;
  const pulseColor = liveMapPulseBackground(
    LIVE_MAP_AVAILABILITY_COLORS[driver.availability]
  );

  const legacyCanvas = (
    <div className="live-map-canvas relative h-52 w-full overflow-hidden sm:h-56">
      <div className="live-map-grid absolute inset-0 opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-br from-navy/8 via-transparent to-teal/6" />
      <p className="absolute left-3 top-3 rounded-lg bg-[#1e2838]/90 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur">
        {data.zone_name}
      </p>
      <button
        type="button"
        title={`${driver.name} · ${driver.vehicle}`}
        className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
        style={pos}
      >
        <span className="relative flex h-8 w-8 items-center justify-center">
          {isPulsing && (
            <span
              className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full opacity-50"
              style={{ background: pulseColor }}
            />
          )}
          <img
            src={vehicleIcon}
            alt=""
            width={28}
            height={28}
            className="relative drop-shadow-md"
            draggable={false}
          />
        </span>
      </button>
      <p className="absolute bottom-3 right-3 text-[10px] text-muted">
        MAJ {new Date(data.updated_at).toLocaleTimeString("fr-CI", { hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
            Position live
          </p>
          <p className="text-sm font-semibold text-heading">{driverName}</p>
        </div>
        <AvailabilityPill status={driver.availability} />
      </div>
      {useRealMap ? (
        <DriverPositionMap
          driver={driver}
          bounds={bounds}
          zoneLabel={data.zone_name}
          className="h-52 min-h-0 rounded-none border-0 shadow-none sm:h-56"
        />
      ) : (
        legacyCanvas
      )}
      <p className="border-t border-border/50 px-4 py-2 text-xs text-muted">
        {driver.vehicle}
      </p>
    </div>
  );
}
