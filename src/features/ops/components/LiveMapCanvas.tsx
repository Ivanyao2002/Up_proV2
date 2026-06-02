"use client";

import type { LiveMapData, LiveMapDriver } from "@/shared/types";

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

const PIN_COLORS: Record<LiveMapDriver["availability"], string> = {
  online: "bg-teal",
  on_trip: "bg-navy",
  paused: "bg-amber-400",
  offline: "bg-muted/50",
};

export function LiveMapCanvas({ data }: { data: LiveMapData }) {
  return (
    <div className="relative h-[min(520px,70vh)] w-full overflow-hidden rounded-card border border-border bg-[#e8eaf0] shadow-card">
      {/* Grille stylisée — pas de placeholder gris */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(rgba(64,81,137,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(64,81,137,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-teal/5 via-transparent to-navy/10" />

      {/* Zones fictives */}
      <div className="absolute left-[15%] top-[20%] h-24 w-32 rounded-2xl border border-teal/30 bg-teal/10" />
      <div className="absolute right-[20%] bottom-[25%] h-20 w-28 rounded-2xl border border-navy/20 bg-navy/5" />

      <p className="absolute left-4 top-4 rounded-lg bg-surface/90 px-3 py-1.5 text-xs font-medium text-navy shadow-sm backdrop-blur">
        {data.zone_name} · {data.city}
      </p>

      {data.drivers.map((driver) => {
        const pos = projectDriver(driver, data.bounds);
        const isPulsing =
          driver.availability === "online" || driver.availability === "on_trip";
        return (
          <button
            key={driver.id}
            type="button"
            title={`${driver.name} · ${driver.vehicle}`}
            className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={pos}
          >
            <span className="relative flex h-4 w-4 items-center justify-center">
              {isPulsing && (
                <span
                  className={`absolute inline-flex h-full w-full animate-pulse-ring rounded-full opacity-60 ${PIN_COLORS[driver.availability]}`}
                />
              )}
              <span
                className={`relative h-3 w-3 rounded-full border-2 border-white shadow-md ${PIN_COLORS[driver.availability]}`}
              />
            </span>
            <span className="pointer-events-none absolute left-1/2 top-5 hidden -translate-x-1/2 whitespace-nowrap rounded bg-navy px-2 py-1 text-[10px] text-white group-hover:block">
              {driver.name}
            </span>
          </button>
        );
      })}

      <div className="absolute bottom-4 left-4 flex flex-wrap gap-3 rounded-lg bg-surface/95 px-3 py-2 text-[10px] text-muted shadow-sm backdrop-blur">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-teal" /> En ligne
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-navy" /> En course
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> Pause
        </span>
      </div>
    </div>
  );
}
