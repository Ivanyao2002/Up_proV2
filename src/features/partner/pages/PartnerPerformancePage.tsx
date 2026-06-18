"use client";

import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { DateRangeFilter } from "@/shared/ui/DateRangeFilter";
import { useDateRangeFilter } from "@/shared/hooks/useDateRangeFilter";
import { useVehiclePerformance, useDriverPerformance } from "../api/performance.queries";
import { formatFCFA } from "@/shared/lib/format";
import type { VehiclePerformance, DriverPerformance } from "../api/performance.service";

export function PartnerPerformancePage() {
  const [tab, setTab] = useState<"vehicles" | "drivers">("vehicles");
  const dateRange = useDateRangeFilter({ defaultPreset: "7d" });

  const periodParams = dateRange.listParams;
  const vehiclesQuery = useVehiclePerformance(periodParams);
  const driversQuery = useDriverPerformance(periodParams);

  const isLoading = tab === "vehicles" ? vehiclesQuery.isLoading : driversQuery.isLoading;
  const isError = tab === "vehicles" ? vehiclesQuery.isError : driversQuery.isError;
  const data = tab === "vehicles" ? vehiclesQuery.data : driversQuery.data;
  const rows = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="animate-fade-up mx-auto max-w-6xl">
      <PageHeader
        title="Performance"
        breadcrumb={["Partenaire", "Analytics"]}
      />

      <div className="mt-4 mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setTab("vehicles")}
            className={`px-4 py-2 text-sm font-medium ${
              tab === "vehicles"
                ? "border-b-2 border-teal text-teal"
                : "text-muted hover:text-foreground"
            }`}
          >
            Véhicules
          </button>
          <button
            onClick={() => setTab("drivers")}
            className={`px-4 py-2 text-sm font-medium ${
              tab === "drivers"
                ? "border-b-2 border-teal text-teal"
                : "text-muted hover:text-foreground"
            }`}
          >
            Chauffeurs
          </button>
        </div>
        <DateRangeFilter
          preset={dateRange.preset}
          onPresetChange={dateRange.setPreset}
          customFrom={dateRange.customFrom}
          customTo={dateRange.customTo}
          onCustomFromChange={dateRange.setCustomFrom}
          onCustomToChange={dateRange.setCustomTo}
          showAllPreset
          rangeLabel={dateRange.rangeLabel}
        />
      </div>

      {isLoading && <div className="py-8">Chargement...</div>}
      {isError && <div className="py-8 text-red-600">Erreur de chargement</div>}

      {!isLoading && !isError && tab === "vehicles" && (
        <VehiclePerformanceTable rows={rows as VehiclePerformance[]} meta={meta} />
      )}
      {!isLoading && !isError && tab === "drivers" && (
        <DriverPerformanceTable rows={rows as DriverPerformance[]} meta={meta} />
      )}
    </div>
  );
}

function VehiclePerformanceTable({
  rows,
  meta,
}: {
  rows: VehiclePerformance[];
  meta: any;
}) {
  const columns: Column<VehiclePerformance>[] = [
    {
      id: "vehicle",
      header: "Véhicule",
      cell: (v) => (
        <div className="font-medium">
          {v.brand} {v.model}
          {v.plate && <span className="text-muted ml-2">({v.plate})</span>}
        </div>
      ),
      exportValue: (v) => [v.brand, v.model, v.plate ? `(${v.plate})` : ""].filter(Boolean).join(" "),
    },
    {
      id: "km",
      header: "Km parcourus",
      cell: (v) => `${v.total_km?.toLocaleString() ?? 0} km`,
      exportValue: (v) => v.total_km ?? 0,
      sortKey: (v) => v.total_km ?? 0,
    },
    {
      id: "trips",
      header: "Courses",
      cell: (v) => v.trips_count ?? 0,
      exportValue: (v) => v.trips_count ?? 0,
      sortKey: (v) => v.trips_count ?? 0,
    },
    {
      id: "revenue",
      header: "Revenus (FCFA)",
      cell: (v) => formatFCFA(v.revenue_fcfa ?? 0),
      exportValue: (v) => v.revenue_fcfa ?? 0,
      sortKey: (v) => v.revenue_fcfa ?? 0,
    },
    {
      id: "acceptance",
      header: "Tx d'acceptation",
      cell: (v) => v.acceptance_rate_pct != null ? `${v.acceptance_rate_pct}%` : "—",
      exportValue: (v) => v.acceptance_rate_pct ?? "",
      sortKey: (v) => v.acceptance_rate_pct ?? 0,
    },
    {
      id: "rating",
      header: "Note moy.",
      cell: (v) => v.avg_rating?.toFixed(1) ?? "—",
      exportValue: (v) => v.avg_rating ?? "",
      sortKey: (v) => v.avg_rating ?? 0,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      rowKey={(v) => v.id}
      emptyTitle="Aucune donnée de performance"
      exportFileName="performance-vehicules"
      pagination={false}
    />
  );
}

function DriverPerformanceTable({
  rows,
  meta,
}: {
  rows: DriverPerformance[];
  meta: any;
}) {
  const columns: Column<DriverPerformance>[] = [
    {
      id: "driver",
      header: "Chauffeur",
      cell: (d) => (
        <div className="font-medium">
          {d.first_name} {d.last_name}
        </div>
      ),
      exportValue: (d) => `${d.first_name} ${d.last_name}`.trim(),
    },
    {
      id: "completed",
      header: "Courses complétées",
      cell: (d) => d.trips_completed ?? 0,
      exportValue: (d) => d.trips_completed ?? 0,
      sortKey: (d) => d.trips_completed ?? 0,
    },
    {
      id: "cancelled",
      header: "Annulations",
      cell: (d) => d.trips_cancelled ?? 0,
      exportValue: (d) => d.trips_cancelled ?? 0,
      sortKey: (d) => d.trips_cancelled ?? 0,
    },
    {
      id: "revenue",
      header: "Revenus (FCFA)",
      cell: (d) => formatFCFA(d.revenue_fcfa ?? 0),
      exportValue: (d) => d.revenue_fcfa ?? 0,
      sortKey: (d) => d.revenue_fcfa ?? 0,
    },
    {
      id: "rating",
      header: "Note moy.",
      cell: (d) => d.avg_rating?.toFixed(1) ?? "—",
      exportValue: (d) => d.avg_rating ?? "",
      sortKey: (d) => d.avg_rating ?? 0,
    },
    {
      id: "acceptance",
      header: "Taux d'acceptation",
      cell: (d) => d.acceptance_rate_pct != null ? `${d.acceptance_rate_pct}%` : "—",
      exportValue: (d) => d.acceptance_rate_pct ?? "",
      sortKey: (d) => d.acceptance_rate_pct ?? 0,
    },
    {
      id: "cancellation",
      header: "Taux annulation",
      cell: (d) => d.cancellation_rate_pct != null ? `${d.cancellation_rate_pct}%` : "—",
      exportValue: (d) => d.cancellation_rate_pct ?? "",
      sortKey: (d) => d.cancellation_rate_pct ?? 0,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      rowKey={(d) => d.id}
      emptyTitle="Aucune donnée de performance"
      exportFileName="performance-chauffeurs"
      pagination={false}
    />
  );
}
