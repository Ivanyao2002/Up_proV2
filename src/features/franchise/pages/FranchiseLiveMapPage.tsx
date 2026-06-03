"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { LiveMapCanvas } from "@/features/ops/components/LiveMapCanvas";
import { LiveMapStatsBar } from "@/features/ops/components/LiveMapStatsBar";
import type { LiveMapData } from "@/shared/types";
import { useFranchiseLiveMap } from "../api/liveMap.queries";

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
        <div className="h-[min(520px,70vh)] animate-pulse rounded-card bg-map" />
      </div>
      <div className="h-[min(560px,72vh)] animate-pulse rounded-card bg-border" />
    </div>
  );
}

export function FranchiseLiveMapPage() {
  const { data, isLoading, isError, dataUpdatedAt } = useFranchiseLiveMap();

  if (isLoading) return <MapSkeleton />;
  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">Impossible de charger la carte live.</p>
    );
  }

  const updated = new Date(dataUpdatedAt).toLocaleTimeString("fr-CI", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Carte live — Territoire"
        breadcrumb={["Franchise", "Carte live"]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-navy/8 px-3 py-1 text-xs font-medium text-muted">
              MAJ {updated} · refresh 30s
            </span>
            <Link href="/franchise/drivers">
              <Button variant="secondary">Liste chauffeurs</Button>
            </Link>
          </div>
        }
      />

      <p className="mb-4 max-w-2xl text-sm text-muted">
        Vue temps réel des chauffeurs actifs sur votre territoire. Cliquez sur un
        nom pour ouvrir sa fiche.
      </p>

      <div className="animate-stagger grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-3">
          <LiveMapStatsBar stats={data.stats} />
          <LiveMapCanvas data={data} />
        </div>
        <FranchiseLiveMapDriversPanel data={data} />
      </div>
    </div>
  );
}

function FranchiseLiveMapDriversPanel({ data }: { data: LiveMapData }) {
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
            <span className="font-semibold tabular-nums text-teal-dark">{online}</span>{" "}
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
          <Link
            key={d.id}
            href={`/franchise/drivers/${d.id}`}
            className="flex items-center justify-between gap-2 border-t border-border/50 py-3 first:border-0 transition-colors hover:bg-surface-hover"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground hover:text-teal">
                {d.name}
              </p>
              <p className="truncate text-xs text-muted">{d.vehicle}</p>
            </div>
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                d.availability === "online" || d.availability === "on_trip"
                  ? "bg-teal"
                  : d.availability === "paused"
                    ? "bg-amber-400"
                    : "bg-muted/40"
              }`}
              aria-hidden
            />
          </Link>
        ))}
      </div>
    </aside>
  );
}
