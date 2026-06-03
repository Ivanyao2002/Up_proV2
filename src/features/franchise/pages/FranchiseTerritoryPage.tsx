"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { KpiCard } from "@/shared/ui/KpiCard";
import { useFranchiseTerritory } from "../api/territory.queries";
import {
  FranchiseTerritoryLegend,
  FranchiseTerritoryMap,
} from "../components/FranchiseTerritoryMap";

export function FranchiseTerritoryPage() {
  const { data, isLoading, isError } = useFranchiseTerritory();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-card bg-border" />;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">Impossible de charger la carte territoire.</p>
    );
  }

  const selected = data.zones.find((z) => z.id === selectedId) ?? data.zones[0] ?? null;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Carte territoire"
        breadcrumb={["Franchise", data.franchise_name]}
        actions={
          <Link href="/franchise/territory/extension">
            <Button variant="secondary">Demander une extension</Button>
          </Link>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Zones actives" value={String(data.stats.zones_count)} />
        <KpiCard label="Sous-partenaires" value={String(data.stats.partners_count)} />
        <KpiCard
          label="Chauffeurs"
          value={data.stats.drivers_count.toLocaleString("fr-CI")}
        />
        <KpiCard label="Superficie" value={`${data.stats.area_km2} km²`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <FranchiseTerritoryMap
          zones={data.zones}
          selectedId={selected?.id ?? null}
          onSelect={setSelectedId}
          franchiseName={`${data.franchise_name} · ${data.city}`}
        />
        <aside className="space-y-4">
          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h2 className="text-sm font-semibold text-heading">Zones du territoire</h2>
            <div className="mt-4">
              <FranchiseTerritoryLegend
                zones={data.zones}
                selectedId={selected?.id ?? null}
                onSelect={setSelectedId}
              />
            </div>
          </div>
          {selected && (
            <div className="rounded-card border border-teal/30 bg-teal/5 p-4 text-sm">
              <p className="font-semibold text-heading">{selected.name}</p>
              <p className="mt-2 text-muted">
                {selected.drivers_active} chauffeurs actifs sur cette zone
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
