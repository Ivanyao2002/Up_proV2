"use client";

import type { LiveMapData, LiveMapDriver } from "@/shared/types";
import { AvailabilityPill } from "@/shared/ui/DriverPills";

function DriverRow({ driver }: { driver: LiveMapDriver }) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-border/50 py-3 first:border-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{driver.name}</p>
        <p className="truncate text-xs text-muted">{driver.vehicle}</p>
      </div>
      <AvailabilityPill status={driver.availability} />
    </div>
  );
}

interface LiveMapDriversPanelProps {
  data: LiveMapData;
}

export function LiveMapDriversPanel({ data }: LiveMapDriversPanelProps) {
  const online = data.drivers.filter(
    (d) => d.availability === "online" || d.availability === "on_trip"
  ).length;

  return (
    <aside className="live-map-territory-panel flex max-h-[min(560px,72vh)] flex-col overflow-hidden rounded-card border shadow-card">
      <div className="shrink-0 border-b border-border px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
          Territoire
        </p>
        <h2 className="mt-1 text-base font-semibold text-heading">{data.zone_name}</h2>
        <p className="mt-0.5 text-xs text-muted">{data.city}</p>
        <div className="mt-3 flex gap-4 text-xs text-muted">
          <span>
            <span className="font-semibold tabular-nums text-teal-dark">
              {online}
            </span>{" "}
            actifs
          </span>
          <span>
            <span className="font-semibold tabular-nums text-heading">
              {data.drivers.length}
            </span>{" "}
            visibles
          </span>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
        {data.drivers.map((d) => (
          <DriverRow key={d.id} driver={d} />
        ))}
      </div>
    </aside>
  );
}
