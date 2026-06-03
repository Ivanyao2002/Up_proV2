"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { LiveMapCanvas } from "@/features/ops/components/LiveMapCanvas";
import { LiveMapStatsBar } from "@/features/ops/components/LiveMapStatsBar";
import { LiveMapDriversPanel } from "@/features/ops/components/LiveMapDriversPanel";
import { useDispatchPortalLiveMap } from "../api/dispatchPortal.queries";

export function DispatchLiveMapPage() {
  const { data, isLoading, isError } = useDispatchPortalLiveMap();

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="h-[min(580px,75vh)] animate-pulse rounded-card bg-border" />
        <div className="hidden h-96 animate-pulse rounded-card bg-navy/15 lg:block" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">Impossible de charger la carte live.</p>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Carte live" breadcrumb={["Dispatch", "Carte"]} />

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
