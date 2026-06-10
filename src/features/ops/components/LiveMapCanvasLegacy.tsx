"use client";

import Link from "next/link";
import { adminPaths } from "@/core/routes/adminPaths";
import { LIVE_MAP_DEFAULT_VEHICLE_ICON } from "@/shared/lib/vehicleMapIcons";
import type { LiveMapData, LiveMapDriver, LiveMapHotZone } from "@/shared/types";
import {
  LIVE_MAP_AVAILABILITY_PULSE_CLASS,
} from "../lib/liveMapAvailabilityColors";
import {
  formatLiveMapVehicleLine,
  getLiveMapVehicleColorLabel,
} from "../lib/liveMapDriverDisplay";
import { LiveMapVehicleColorInfo } from "./LiveMapVehicleColorInfo";
import {
  projectDriver,
  WORLD_HUB_LABELS,
} from "../lib/liveMapProjection";

const HOT_ZONE_STYLE: Record<number, string> = {
  1: "bg-amber-400/30 ring-amber-500/50",
  2: "bg-orange-500/35 ring-orange-600/55",
  3: "bg-red-500/40 ring-red-600/60",
};

const FRANCHISE_PIN_RING: Record<number, string> = {
  1: "ring-teal/50",
  2: "ring-sky-400/50",
  3: "ring-violet-400/50",
  4: "ring-amber-400/50",
};

interface LiveMapCanvasLegacyProps {
  data: LiveMapData;
  hotZones?: LiveMapHotZone[];
}

/** Carte CSS (fallback sans token Mapbox). */
export function LiveMapCanvasLegacy({
  data,
  hotZones = [],
}: LiveMapCanvasLegacyProps) {
  const isGlobal = data.scope === "global";

  return (
    <div className="live-map-canvas relative h-[min(520px,70vh)] w-full overflow-hidden rounded-card border shadow-card">
      <div className="live-map-grid absolute inset-0 opacity-40" />
      <div
        className={`absolute inset-0 ${
          isGlobal
            ? "bg-gradient-to-br from-navy/15 via-canvas/5 to-teal/10"
            : "bg-gradient-to-br from-navy/10 via-transparent to-teal/8"
        }`}
      />

      {isGlobal && (
        <>
          <div className="pointer-events-none absolute inset-[12%] rounded-[40%] border border-dashed border-border/40" />
          {WORLD_HUB_LABELS.map((hub) => {
            const summary = data.franchise_summary?.find(
              (s) => s.franchise_id === hub.franchise_id
            );
            return (
              <div
                key={hub.franchise_id}
                className="pointer-events-none absolute z-[1] -translate-x-1/2 -translate-y-1/2"
                style={{ left: hub.left, top: hub.top }}
              >
                <span className="rounded-md border border-border/60 bg-elevated/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted backdrop-blur">
                  {hub.label}
                  {summary ? (
                    <span className="ml-1 tabular-nums text-teal-dark">
                      {summary.drivers_active}
                    </span>
                  ) : null}
                </span>
              </div>
            );
          })}
        </>
      )}

      {!isGlobal && (
        <>
          <div className="absolute left-[15%] top-[20%] h-24 w-32 rounded-2xl border border-teal/30 bg-teal/10" />
          <div className="absolute right-[20%] bottom-[25%] h-20 w-28 rounded-2xl border border-border bg-navy/10" />
        </>
      )}

      <p className="absolute left-4 top-4 z-10 rounded-lg bg-elevated/95 px-3 py-1.5 text-xs font-medium text-heading shadow-md backdrop-blur">
        {data.zone_name}
        <span className="text-muted"> · {data.city}</span>
      </p>

      {hotZones.map((zone) => {
        const pos = projectDriver({ lat: zone.lat, lng: zone.lng }, data.bounds);
        const heat = Math.min(3, Math.max(1, zone.heatLevel));
        const size =
          heat >= 3 ? "h-14 w-14" : heat >= 2 ? "h-11 w-11" : "h-9 w-9";
        return (
          <div
            key={zone.id}
            className={`pointer-events-none absolute z-[2] -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ${size} ${HOT_ZONE_STYLE[heat] ?? HOT_ZONE_STYLE[1]}`}
            style={pos}
            title={`${zone.name} · chaleur ${zone.heatLevel}`}
          />
        );
      })}

      {data.drivers.map((driver) => {
        const pos = projectDriver(driver, data.bounds);
        const vehicleLine = formatLiveMapVehicleLine(driver);
        const vehicleColorLabel = getLiveMapVehicleColorLabel(driver);
        const isPulsing =
          driver.availability === "online" || driver.availability === "on_trip";
        const franchiseKey =
          typeof driver.franchise_id === "number" ? driver.franchise_id : null;
        const ring =
          franchiseKey != null
            ? FRANCHISE_PIN_RING[franchiseKey] ?? "ring-border"
            : "";
        return (
          <button
            key={driver.id}
            type="button"
            title={[
              driver.name,
              driver.active_trip
                ? `${driver.active_trip.ref} · ${driver.active_trip.from_label} → ${driver.active_trip.to_label}`
                : null,
              vehicleLine,
              vehicleColorLabel ? `Couleur : ${vehicleColorLabel}` : null,
              driver.partner_name,
              driver.franchise_name,
              driver.zone_name,
            ]
              .filter(Boolean)
              .join(" · ")}
            className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={pos}
          >
            <span className="relative flex h-9 w-9 items-center justify-center">
              {isPulsing && (
                <span
                  className={`absolute inline-flex h-full w-full animate-pulse-ring rounded-full opacity-90 ${LIVE_MAP_AVAILABILITY_PULSE_CLASS[driver.availability]}`}
                />
              )}
              <img
                src={driver.vehicle_icon_url ?? LIVE_MAP_DEFAULT_VEHICLE_ICON}
                alt=""
                width={32}
                height={32}
                className={`relative object-contain drop-shadow-md ${ring ? `ring-2 ${ring} rounded-full` : ""}`}
                draggable={false}
              />
            </span>
            <span className="pointer-events-auto absolute left-1/2 top-10 z-20 hidden min-w-[140px] -translate-x-1/2 rounded bg-elevated px-2 py-1.5 text-left text-[10px] text-foreground shadow-md group-hover:block">
              <span className="block font-medium">{driver.name}</span>
              {vehicleLine ? (
                <span className="block text-muted">{vehicleLine}</span>
              ) : null}
              <LiveMapVehicleColorInfo driver={driver} className="mt-0.5" />
              {driver.active_trip && (
                <>
                  <span className="mt-0.5 block font-semibold text-navy">
                    {driver.active_trip.ref} · {driver.active_trip.status_label}
                  </span>
                  <span className="block text-muted">
                    {driver.active_trip.from_label} → {driver.active_trip.to_label}
                  </span>
                  <span className="mt-1 flex gap-2 font-semibold text-teal-dark">
                    <Link href={adminPaths.trip(driver.active_trip.id)}>Course</Link>
                    <Link href={adminPaths.driver(driver.id)}>Chauffeur</Link>
                  </span>
                </>
              )}
              {driver.partner_name && (
                <span className="block text-muted">{driver.partner_name}</span>
              )}
              {isGlobal && driver.franchise_name && (
                <span className="block text-teal-dark">{driver.franchise_name}</span>
              )}
            </span>
          </button>
        );
      })}

      <LiveMapLegend
        isGlobal={isGlobal}
        showOrders={Boolean(data.order_markers?.length)}
        showHotZones={hotZones.length > 0}
      />
    </div>
  );
}

export function LiveMapLegend({
  isGlobal,
  showOrders,
  showHotZones,
}: {
  isGlobal?: boolean;
  showOrders?: boolean;
  showHotZones?: boolean;
}) {
  return (
    <div className="absolute bottom-4 left-4 flex flex-wrap gap-3 rounded-lg border border-border-subtle bg-elevated/95 px-3 py-2 text-[10px] text-muted shadow-md backdrop-blur">
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-blue-800" /> En ligne
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-green-500" /> En course
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-orange-400" /> Pause
      </span>
      {showHotZones && (
        <span className="flex items-center gap-1.5 border-l border-border pl-3">
          <span className="h-3 w-3 rounded-full bg-orange-500/50 ring-2 ring-orange-500/70" />
          Zone chaude
        </span>
      )}
      {showOrders && (
        <>
          <span className="flex items-center gap-1.5 border-l border-border pl-3">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Prise en charge
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-500" /> Destination
          </span>
        </>
      )}
      {isGlobal && (
        <span className="hidden border-l border-border pl-3 sm:inline">
          Anneaux colorés = franchise
        </span>
      )}
    </div>
  );
}
