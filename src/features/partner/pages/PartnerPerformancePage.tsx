"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { KpiCard } from "@/shared/ui/KpiCard";
import { IvorianPlateBadge } from "@/shared/ui/IvorianPlateBadge";
import { VehicleTypeBadge } from "@/shared/ui/VehicleTypeBadge";
import { useDateRangeFilter } from "@/shared/hooks/useDateRangeFilter";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import { formatFCFA } from "@/shared/lib/format";
import type { Vehicle } from "@/shared/types";
import { useFleetPerformance } from "../api/performance.queries";
import type { FleetPerformanceRow } from "../api/performance.service";
import { PartnerListFiltersPanel } from "../components/PartnerListFiltersPanel";

function driverDisplayName(row: FleetPerformanceRow): string {
  const name = [row.driver_first_name, row.driver_last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (!name || name === "Chauffeur") return "—";
  return name;
}

function PerformanceVehicleCell({ row }: { row: FleetPerformanceRow }) {
  if (!row.vehicle_id) {
    return (
      <div className="flex items-center gap-3 min-w-[200px]">
        <span className="flex h-10 w-[4.5rem] shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-canvas/60 text-[10px] font-medium uppercase tracking-wide text-muted">
          N/A
        </span>
        <p className="text-sm text-muted">Aucun véhicule affecté</p>
      </div>
    );
  }

  const vehicleStub = {
    id: row.vehicle_id,
    plate: row.plate ?? "",
    brand: row.brand,
    model: row.model,
    ride_category_code: row.category_code,
    service: "taxi" as const,
  } satisfies Partial<Vehicle>;

  const vehicleTitle =
    [row.brand, row.model].filter(Boolean).join(" ").trim() || row.plate || "Véhicule";

  return (
    <div className="flex items-center gap-3 min-w-[220px]">
      <Link
        href={`/partner/fleet/${row.vehicle_id}`}
        className="shrink-0 transition-opacity hover:opacity-90"
      >
        {row.plate ? (
          <IvorianPlateBadge plate={row.plate} size="sm" />
        ) : (
          <span className="flex h-10 w-[4.5rem] items-center justify-center rounded-lg border border-border bg-canvas text-xs text-muted">
            —
          </span>
        )}
      </Link>
      <div className="min-w-0">
        <Link
          href={`/partner/fleet/${row.vehicle_id}`}
          className="block truncate font-semibold text-foreground hover:text-teal"
        >
          {vehicleTitle}
        </Link>
        {row.brand && row.model && row.plate ? (
          <p className="mt-0.5 truncate text-xs text-muted">{row.plate}</p>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {row.year ? (
            <span className="text-xs text-muted tabular-nums">{row.year}</span>
          ) : null}
          {row.category_code ? (
            <VehicleTypeBadge vehicle={vehicleStub as Vehicle} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PerformanceDriverCell({ row }: { row: FleetPerformanceRow }) {
  const name = driverDisplayName(row);
  if (!row.driver_id || name === "—") {
    return <span className="text-sm text-muted">Non assigné</span>;
  }

  return (
    <Link
      href={`/partner/drivers/${row.driver_id}`}
      className="group inline-flex min-w-[140px] flex-col"
    >
      <span className="font-medium text-foreground group-hover:text-teal">{name}</span>
      <span className="text-xs text-teal opacity-0 transition-opacity group-hover:opacity-100">
        Voir la fiche →
      </span>
    </Link>
  );
}

function RatePill({ value, tone }: { value: number; tone?: "neutral" | "good" | "danger" }) {
  const styles =
    tone === "good"
      ? "bg-teal/10 text-teal-dark"
      : tone === "danger"
        ? "bg-red-50 text-red-700"
        : "bg-canvas text-muted";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${styles}`}>
      {value}%
    </span>
  );
}

export function PartnerPerformancePage() {
  const dateRange = useDateRangeFilter({ defaultPreset: "7d" });
  const [search, setSearch] = useState("");

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: search, set: setSearch },
    fields: [dateRange.resetField],
  });

  const { data, isLoading, isError } = useFleetPerformance(dateRange.listParams);

  const filteredRows = useMemo(() => {
    const rows = data?.data ?? [];
    const query = search.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((row) => {
      const haystack = [
        row.plate,
        row.brand,
        row.model,
        row.driver_first_name,
        row.driver_last_name,
        row.category_code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [data?.data, search]);

  const kpis = useMemo(() => {
    const rows = filteredRows;
    return {
      revenue: rows.reduce((sum, row) => sum + row.revenue_fcfa, 0),
      trips: rows.reduce((sum, row) => sum + row.trips_completed, 0),
      vehicles: rows.filter((row) => row.vehicle_id).length,
      drivers: rows.filter((row) => row.driver_id).length,
    };
  }, [filteredRows]);

  const columns: Column<FleetPerformanceRow>[] = [
    {
      id: "vehicle",
      header: "Véhicule",
      className: "min-w-[240px]",
      cell: (row) => <PerformanceVehicleCell row={row} />,
      exportValue: (row) =>
        [row.plate, row.brand, row.model].filter(Boolean).join(" "),
      sortKey: (row) => row.plate ?? row.brand ?? "",
    },
    {
      id: "driver",
      header: "Chauffeur",
      className: "min-w-[160px]",
      cell: (row) => <PerformanceDriverCell row={row} />,
      exportValue: (row) => driverDisplayName(row),
      sortKey: (row) => driverDisplayName(row).toLowerCase(),
    },
    {
      id: "km",
      header: "Km",
      cell: (row) => (
        <span className="tabular-nums text-sm">
          {row.total_km > 0 ? `${row.total_km.toLocaleString("fr-FR")} km` : "—"}
        </span>
      ),
      exportValue: (row) => row.total_km,
      sortKey: (row) => row.total_km,
    },
    {
      id: "trips",
      header: "Courses",
      cell: (row) => (
        <div className="text-sm tabular-nums">
          <span className="font-medium text-foreground">{row.trips_completed}</span>
          {row.trips_cancelled > 0 && (
            <span className="text-red-600"> · {row.trips_cancelled} annul.</span>
          )}
        </div>
      ),
      exportValue: (row) => row.trips_completed,
      sortKey: (row) => row.trips_completed,
    },
    {
      id: "revenue",
      header: "Revenus",
      cell: (row) => (
        <span className="font-medium tabular-nums text-foreground">
          {formatFCFA(row.revenue_fcfa)}
        </span>
      ),
      exportValue: (row) => row.revenue_fcfa,
      sortKey: (row) => row.revenue_fcfa,
    },
    {
      id: "rating",
      header: "Note",
      cell: (row) => (
        <span className="tabular-nums text-sm">
          {row.avg_rating > 0 ? row.avg_rating.toFixed(1) : "—"}
        </span>
      ),
      exportValue: (row) => row.avg_rating,
      sortKey: (row) => row.avg_rating,
    },
    {
      id: "acceptance",
      header: "Acceptation",
      cell: (row) =>
        row.acceptance_rate_pct > 0 ? (
          <RatePill value={row.acceptance_rate_pct} tone="good" />
        ) : (
          <span className="text-sm text-muted tabular-nums">0%</span>
        ),
      exportValue: (row) => row.acceptance_rate_pct,
      sortKey: (row) => row.acceptance_rate_pct,
    },
    {
      id: "cancellation",
      header: "Annulation",
      cell: (row) =>
        row.cancellation_rate_pct > 0 ? (
          <RatePill value={row.cancellation_rate_pct} tone="danger" />
        ) : (
          <span className="text-sm text-muted tabular-nums">0%</span>
        ),
      exportValue: (row) => row.cancellation_rate_pct,
      sortKey: (row) => row.cancellation_rate_pct,
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader title="Performance" breadcrumb={["Partenaire", "Analytics"]} />

      {!isLoading && !isError && (
        <div className="mb-5 grid gap-3 grid-cols-2 sm:grid-cols-4">
          <KpiCard index={0} label="Revenus période" value={formatFCFA(kpis.revenue)} />
          <KpiCard index={1} label="Courses complétées" value={String(kpis.trips)} />
          <KpiCard index={2} label="Véhicules" value={String(kpis.vehicles)} />
          <KpiCard index={3} label="Chauffeurs actifs" value={String(kpis.drivers)} />
        </div>
      )}

      <PartnerListFiltersPanel
        showStatusFilters={false}
        statusFilter="all"
        onStatusFilterChange={() => {}}
        statusOptions={[]}
        allStatusValue="all"
        dateRange={dateRange}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Plaque, marque, chauffeur…"
        totalLabel={
          filteredRows.length > 0
            ? `${filteredRows.length} affectation${filteredRows.length > 1 ? "s" : ""}`
            : undefined
        }
        hasActiveFilters={hasActiveFilters}
        onResetAll={resetAll}
      />

      {isLoading && <div className="py-8 text-sm text-muted">Chargement…</div>}
      {isError && (
        <div className="py-8 text-sm text-red-600">
          Impossible de charger les données de performance.
        </div>
      )}

      {!isLoading && !isError && (
        <DataTable
          columns={columns}
          data={filteredRows}
          rowKey={(row) => row.id}
          emptyTitle="Aucune donnée de performance"
          emptyDescription="Les statistiques de votre flotte apparaîtront ici pour la période sélectionnée."
          exportFileName="performance-flotte-partenaire"
          pagination={false}
        />
      )}
    </div>
  );
}
