"use client";

import type {
  DispatchDriverCandidate,
  DispatchQueueItem,
  LiveMapData,
} from "@/shared/types";

function project(
  lat: number,
  lng: number,
  bounds: LiveMapData["bounds"]
): { left: string; top: string } {
  const latPct =
    ((lat - bounds.lat_min) / (bounds.lat_max - bounds.lat_min)) * 100;
  const lngPct =
    ((lng - bounds.lng_min) / (bounds.lng_max - bounds.lng_min)) * 100;
  return {
    left: `${Math.min(92, Math.max(8, lngPct))}%`,
    top: `${Math.min(88, Math.max(12, 100 - latPct))}%`,
  };
}

interface DispatchMapPreviewProps {
  map: Pick<LiveMapData, "bounds" | "zone_name" | "city">;
  selected?: DispatchQueueItem | null;
  highlightDriverId?: number | null;
}

export function DispatchMapPreview({
  map,
  selected,
  highlightDriverId,
}: DispatchMapPreviewProps) {
  const pickup = selected
    ? project(selected.from_coords.lat, selected.from_coords.lng, map.bounds)
    : null;

  return (
    <div className="relative h-[min(320px,45vh)] w-full overflow-hidden rounded-card border border-border bg-map shadow-card">
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
      <p className="absolute left-3 top-3 rounded-lg bg-surface/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm">
        {map.zone_name}
      </p>

      {pickup && (
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
          style={pickup}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white shadow-md ring-4 ring-amber-500/30">
            P
          </span>
        </div>
      )}

      {selected?.candidates.map((driver) => (
        <CandidatePin
          key={driver.id}
          driver={driver}
          bounds={map.bounds}
          highlighted={highlightDriverId === driver.id}
        />
      ))}

      {!selected && (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-muted">
          Sélectionnez une course
        </p>
      )}
    </div>
  );
}

function CandidatePin({
  driver,
  bounds,
  highlighted,
}: {
  driver: DispatchDriverCandidate;
  bounds: LiveMapData["bounds"];
  highlighted: boolean;
}) {
  const pos = project(driver.lat, driver.lng, bounds);
  const online = driver.availability === "online";

  return (
    <div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={pos}
      title={`${driver.name} · ${driver.distance_km} km`}
    >
      <span
        className={`block h-3 w-3 rounded-full border-2 border-white shadow ${
          highlighted
            ? "h-4 w-4 bg-teal ring-4 ring-teal/40"
            : online
              ? "bg-teal"
              : "bg-muted"
        }`}
      />
    </div>
  );
}
