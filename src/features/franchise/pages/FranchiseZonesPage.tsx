"use client";

import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { SelectFilter } from "@/shared/ui/SelectFilter";
import { ZoneTypePill } from "@/shared/ui/ZoneTypePill";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { Zone } from "@/shared/types";
import { paginateClientList } from "@/shared/lib/clientList";
import {
  useZonesMapOverviewByFranchise,
  useZonesByFranchiseCtx,
} from "@/features/network/api/zones.queries";
import { AbidjanZonesMap } from "@/features/network/components/AbidjanZonesMap";

const ZONE_TYPE_LABELS: Record<Zone["type"], string> = {
  standard: "Standard",
  surge: "Surge",
  airport: "Aéroport",
};

const TYPE_OPTIONS = [
  { value: "all" as const, label: "Tous les types" },
  { value: "standard" as const, label: "Standard" },
  { value: "surge" as const, label: "Surge" },
  { value: "airport" as const, label: "Aéroport" },
];

export function FranchiseZonesPage() {
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_OPTIONS)[number]["value"]>("all");
  const [selectedMapZoneId, setSelectedMapZoneId] = useState<number | string | null>(null);

  const table = useServerTableState([typeFilter], {
    type: typeFilter !== "all" ? typeFilter : undefined,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: typeFilter, defaultValue: "all", reset: () => setTypeFilter("all") },
    ],
  });

  const { data: mapOverview, isLoading: mapLoading } = useZonesMapOverviewByFranchise();
  const { data: zonesRaw, isLoading, isError } = useZonesByFranchiseCtx();

  const allZones: Zone[] = (zonesRaw ?? []).map((z) => ({
    id: z.id,
    name: z.name,
    city: z.city ?? "—",
    franchise_name: z.franchise_name ?? "—",
    type: z.type,
    drivers_active: 0,
    surge_multiplier: z.surge_multiplier,
  }));

  let filtered = allZones;
  if (table.search.trim()) {
    const q = table.search.toLowerCase();
    filtered = filtered.filter(
      (z) =>
        z.name.toLowerCase().includes(q) ||
        z.city.toLowerCase().includes(q)
    );
  }
  if (typeFilter !== "all") {
    filtered = filtered.filter((z) => z.type === typeFilter);
  }
  const paginated = paginateClientList(filtered, table.listParams);
  const rows = paginated.data;
  const meta = paginated.meta;

  const columns: Column<Zone>[] = [
    {
      id: "name",
      header: "Zone",
      cell: (z) => (
        <div>
          <span className="font-medium text-foreground">{z.name}</span>
          <p className="text-xs text-muted">{z.city}</p>
        </div>
      ),
      exportValue: (z) => `${z.name} (${z.city})`,
    },
    {
      id: "type",
      header: "Type",
      cell: (z) => <ZoneTypePill type={z.type} />,
      exportValue: (z) => ZONE_TYPE_LABELS[z.type],
    },
    {
      id: "surge",
      header: "Multiplicateur",
      className: "tabular-nums",
      cell: (z) =>
        z.surge_multiplier && z.surge_multiplier > 1
          ? `×${z.surge_multiplier}`
          : "—",
      exportValue: (z) =>
        z.surge_multiplier && z.surge_multiplier > 1 ? z.surge_multiplier : "",
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les zones.</p>;
  }

  return (
    <div className="animate-fade-up">
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader
          title="Zones du territoire"
          breadcrumb={["Franchise", "Zones"]}
        />
        {meta && (
          <p className="mt-1 text-sm text-muted">
            {meta.total} zone{meta.total !== 1 ? "s" : ""} sur le territoire
          </p>
        )}
      </div>

      <div className="mb-6">
        {mapLoading ? (
          <div className="h-[min(380px,50vh)] animate-pulse rounded-card border border-border bg-surface" />
        ) : (
          <AbidjanZonesMap
            mode="select"
            zones={mapOverview?.zones ?? []}
            hotZones={mapOverview?.hotZones ?? []}
            cityLabel={mapOverview?.city ?? "Territoire"}
            selectedZoneId={selectedMapZoneId}
            onSelectZone={(zone) => {
              setSelectedMapZoneId(zone.id);
            }}
          />
        )}
      </div>

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Nom de zone, ville…"
        totalLabel={meta ? `${meta.total} zone${meta.total !== 1 ? "s" : ""}` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <SelectFilter
          label="Type"
          value={typeFilter}
          onChange={setTypeFilter}
          options={TYPE_OPTIONS}
        />
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(z) => z.id}
        isLoading={isLoading}
        exportFileName="zones-franchise"
        emptyTitle="Aucune zone"
        emptyDescription="Aucune zone n'est encore associée à votre territoire."
        pagination={false}
        serverPagination={serverPaginationFromMeta(meta, table.setPage, table.setPageSize)}
      />
    </div>
  );
}
