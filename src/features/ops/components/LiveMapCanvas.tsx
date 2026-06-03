"use client";

import type { LiveMapData, LiveMapDriver } from "@/shared/types";
import {
  projectDriver,
  WORLD_HUB_LABELS,
} from "../lib/liveMapProjection";

const PIN_COLORS: Record<LiveMapDriver["availability"], string> = {
  online: "bg-teal",
  on_trip: "bg-navy",
  paused: "bg-amber-400",
  offline: "bg-muted/50",
};

const FRANCHISE_PIN_RING: Record<number, string> = {
  1: "ring-teal/50",
  2: "ring-sky-400/50",
  3: "ring-violet-400/50",
  4: "ring-amber-400/50",
};

interface LiveMapCanvasProps {
  data: LiveMapData;
}

export function LiveMapCanvas({ data }: LiveMapCanvasProps) {
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

      {data.drivers.map((driver) => {
        const pos = projectDriver(driver, data.bounds);
        const isPulsing =
          driver.availability === "online" || driver.availability === "on_trip";
        const ring =
          driver.franchise_id != null
            ? FRANCHISE_PIN_RING[driver.franchise_id] ?? "ring-border"
            : "";
        return (
          <button
            key={driver.id}
            type="button"
            title={[
              driver.name,
              driver.vehicle,
              driver.partner_name,
              driver.franchise_name,
              driver.zone_name,
            ]
              .filter(Boolean)
              .join(" · ")}
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
                className={`relative h-3 w-3 rounded-full border-2 border-surface shadow-md ring-2 ${ring} ${PIN_COLORS[driver.availability]}`}
              />
            </span>
            <span className="pointer-events-none absolute left-1/2 top-5 z-20 hidden min-w-[120px] -translate-x-1/2 rounded bg-elevated px-2 py-1.5 text-left text-[10px] text-foreground shadow-md group-hover:block">
              <span className="block font-medium">{driver.name}</span>
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

      <div className="absolute bottom-4 left-4 flex flex-wrap gap-3 rounded-lg border border-border-subtle bg-elevated/95 px-3 py-2 text-[10px] text-muted shadow-md backdrop-blur">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-teal" /> En ligne
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-navy" /> En course
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> Pause
        </span>
        {isGlobal && (
          <span className="hidden border-l border-border pl-3 sm:inline">
            Anneaux colorés = franchise
          </span>
        )}
      </div>
    </div>
  );
}
