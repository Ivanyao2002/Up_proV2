"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Tabs } from "@/shared/ui/Tabs";
import { ZoneTypePill } from "@/shared/ui/ZoneTypePill";
import { EntityStatusPill } from "@/shared/ui/EntityStatusPill";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Button } from "@/shared/ui/Button";
import { ZonePolygonMap } from "../components/ZonePolygonMap";
import { ZonePolygonEditModal } from "../components/ZonePolygonEditModal";
import { formatFCFA } from "@/shared/lib/format";
import { useZoneDetail, useUpdateZonePolygon } from "../api/zoneDetail.queries";
import { useZonesMapOverview } from "../api/zones.queries";

interface ZoneDetailPageProps {
  zoneId: string;
}

export function ZoneDetailPage({ zoneId }: ZoneDetailPageProps) {
  const [tab, setTab] = useState("map");
  const [editPolygonOpen, setEditPolygonOpen] = useState(false);
  const { data, isLoading, isError } = useZoneDetail(zoneId);
  const { data: mapOverview } = useZonesMapOverview();
  const updatePolygon = useUpdateZonePolygon(zoneId);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-card bg-border" />;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Zone introuvable.{" "}
        <Link href="/admin/network/zones" className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader
          title={data.name}
          breadcrumb={["Admin", "Réseau", "Zones", data.name]}
          actions={
            <div className="flex gap-2">
              <ZoneTypePill type={data.type} />
              <EntityStatusPill status={data.status === "active" ? "active" : "pending"} />
            </div>
          }
        />
        <p className="text-sm text-muted">
          <Link
            href={`/admin/network/franchises/${data.franchise_id}`}
            className="text-teal hover:underline"
          >
            {data.franchise_name}
          </Link>
          {" · "}
          {data.city}
          {data.surge_multiplier && data.surge_multiplier > 1
            ? ` · Surge ×${data.surge_multiplier}`
            : ""}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          <Tabs
            tabs={[
              { id: "map", label: "Carte & périmètre" },
              { id: "stats", label: "Statistiques" },
              { id: "surge", label: "Tarification" },
            ]}
            active={tab}
            onChange={setTab}
          />

          <div className="mt-6">
            {tab === "map" && (
              <div className="space-y-4">
                <ZonePolygonMap
                  polygon={data.polygon_geojson}
                  zoneName={data.name}
                  className="h-[min(380px,50vh)]"
                />
                <Button
                  variant="secondary"
                  onClick={() => setEditPolygonOpen(true)}
                >
                  Modifier le polygone
                </Button>
              </div>
            )}

            {tab === "stats" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <KpiCard
                  label="Courses / 24h"
                  value={String(data.stats.trips_24h)}
                />
                <KpiCard
                  label="Courses / mois"
                  value={String(data.stats.trips_month)}
                />
                <KpiCard
                  label="Revenus / mois"
                  value={formatFCFA(data.stats.revenue_month_fcfa)}
                />
                <KpiCard
                  label="Tarif moyen"
                  value={formatFCFA(data.stats.avg_fare_fcfa)}
                />
                <KpiCard
                  label="Chauffeurs actifs"
                  value={`${data.stats.drivers_active} / ${data.stats.drivers_total}`}
                />
              </div>
            )}

            {tab === "surge" && (
              <div className="space-y-3">
                {data.surge_rules.map((rule) => (
                  <div
                    key={rule.label}
                    className="flex items-center justify-between rounded-card border border-border bg-surface p-4 shadow-card"
                  >
                    <div>
                      <p className="font-medium text-foreground">{rule.label}</p>
                      <p className="text-sm text-muted">{rule.hours}</p>
                    </div>
                    <span className="text-lg font-semibold text-teal-dark">
                      ×{rule.multiplier}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h3 className="text-sm font-semibold">Partenaires dans la zone</h3>
            <ul className="mt-3 space-y-2">
              {data.partners_in_zone.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/network/partners/${p.id}`}
                    className="flex justify-between text-sm hover:text-teal"
                  >
                    <span className="font-medium text-foreground">{p.name}</span>
                    <span className="text-muted">{p.drivers_count} ch.</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <Link href="/admin/ops/map">
            <Button variant="secondary" className="w-full !text-xs">
              Voir sur la carte live
            </Button>
          </Link>
        </aside>
      </div>

      <ZonePolygonEditModal
        open={editPolygonOpen}
        zoneId={data.id}
        zoneName={data.name}
        initialRing={data.polygon_geojson?.coordinates?.[0] ?? []}
        referenceZones={mapOverview?.zones ?? []}
        cityLabel={data.city}
        onClose={() => setEditPolygonOpen(false)}
        isSaving={updatePolygon.isPending}
        onSave={(ring) => {
          updatePolygon.mutate(ring, {
            onSuccess: () => setEditPolygonOpen(false),
          });
        }}
      />
    </div>
  );
}
