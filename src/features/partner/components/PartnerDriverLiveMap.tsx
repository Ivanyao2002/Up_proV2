"use client";

import type { LiveMapData, LiveMapDriver } from "@/shared/types";
import { AvailabilityPill } from "@/shared/ui/DriverPills";
import { usePartnerDriverLive } from "../api/partnerDriverDetail.queries";

const PIN_COLORS: Record<LiveMapDriver["availability"], string> = {
  online: "bg-teal",
  on_trip: "bg-navy",
  paused: "bg-amber-400",
  offline: "bg-muted/50",
};

function projectDriver(
  driver: LiveMapDriver,
  bounds: LiveMapData["bounds"]
): { left: string; top: string } {
  const latPct =
    ((driver.lat - bounds.lat_min) / (bounds.lat_max - bounds.lat_min)) * 100;
  const lngPct =
    ((driver.lng - bounds.lng_min) / (bounds.lng_max - bounds.lng_min)) * 100;
  return {
    left: `${Math.min(92, Math.max(8, lngPct))}%`,
    top: `${Math.min(88, Math.max(12, 100 - latPct))}%`,
  };
}

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
      <div className="h-52 animate-pulse rounded-card bg-border sm:h-56" />
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
          <span className="relative flex h-5 w-5 items-center justify-center">
            {isPulsing && (
              <span
                className={`absolute inline-flex h-full w-full animate-pulse-ring rounded-full opacity-60 ${PIN_COLORS[driver.availability]}`}
              />
            )}
            <span
              className={`relative h-4 w-4 rounded-full border-2 border-white shadow-md ring-2 ring-teal/40 ${PIN_COLORS[driver.availability]}`}
            />
          </span>
        </button>
        <p className="absolute bottom-3 right-3 text-[10px] text-muted">
          MAJ {new Date(data.updated_at).toLocaleTimeString("fr-CI", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
      <p className="border-t border-border/50 px-4 py-2 text-xs text-muted">
        {driver.vehicle}
      </p>
    </div>
  );
}
