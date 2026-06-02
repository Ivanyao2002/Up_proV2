"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { AvailabilityPill } from "@/shared/ui/DriverPills";
import { useLiveMap } from "../api/liveMap.queries";
import { LiveMapCanvas } from "../components/LiveMapCanvas";
import type { LiveMapDriver } from "@/shared/types";

function MapSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
      <div className="h-[min(520px,70vh)] animate-pulse rounded-card bg-border" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-card bg-border" />
        ))}
      </div>
    </div>
  );
}

function DriverRow({ driver }: { driver: LiveMapDriver }) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-border/50 py-3 first:border-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[#212529]">{driver.name}</p>
        <p className="truncate text-xs text-muted">{driver.vehicle}</p>
      </div>
      <AvailabilityPill status={driver.availability} />
    </div>
  );
}

export function LiveMapPage() {
  const { data, isLoading, isError, dataUpdatedAt } = useLiveMap();

  if (isLoading) return <MapSkeleton />;
  if (isError || !data) {
    return <p className="text-sm text-red-600">Impossible de charger la carte.</p>;
  }

  const updated = new Date(dataUpdatedAt).toLocaleTimeString("fr-CI", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Carte live"
        breadcrumb={["Admin", "Opérations"]}
        actions={
          <span className="text-xs text-muted">MAJ {updated} · refresh 30s</span>
        }
      />

      <div className="animate-stagger mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="En ligne"
          value={String(data.stats.drivers_online)}
          hint="chauffeurs disponibles"
        />
        <KpiCard
          label="En course"
          value={String(data.stats.drivers_on_trip)}
        />
        <KpiCard
          label="Courses actives"
          value={String(data.stats.active_trips)}
        />
        <KpiCard
          label="Attente moy."
          value={`${data.stats.avg_wait_min} min`}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <LiveMapCanvas data={data} />
        <aside className="rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="text-sm font-semibold text-[#212529]">Sur la carte</h2>
          <p className="text-xs text-muted">{data.drivers.length} chauffeurs visibles</p>
          <div className="mt-3 max-h-[420px] overflow-y-auto">
            {data.drivers.map((d) => (
              <DriverRow key={d.id} driver={d} />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
