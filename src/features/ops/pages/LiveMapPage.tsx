"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { useLiveMap } from "../api/liveMap.queries";
import { LiveMapCanvas } from "../components/LiveMapCanvas";
import { LiveMapStatsBar } from "../components/LiveMapStatsBar";
import { LiveMapDriversPanel } from "../components/LiveMapDriversPanel";

function MapSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-[5.5rem] animate-pulse rounded-card bg-gradient-to-br from-[#1e2838] to-navy/30"
            />
          ))}
        </div>
        <div className="h-[min(520px,70vh)] animate-pulse rounded-card bg-[#d8dbe4]" />
      </div>
      <div className="h-[min(560px,72vh)] animate-pulse rounded-card bg-navy/20" />
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
          <span className="rounded-full bg-navy/8 px-3 py-1 text-xs font-medium text-muted">
            MAJ {updated} · refresh 30s
          </span>
        }
      />

      <div className="animate-stagger grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-3">
          <LiveMapStatsBar stats={data.stats} />
          <LiveMapCanvas data={data} />
        </div>
        <LiveMapDriversPanel data={data} />
      </div>
    </div>
  );
}
