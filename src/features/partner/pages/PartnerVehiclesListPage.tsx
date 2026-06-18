"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { FilterChips } from "@/shared/ui/FilterChips";
import { VehicleApprovalPill } from "@/shared/ui/VehicleApprovalPill";
import { Button } from "@/shared/ui/Button";
import { KpiCard } from "@/shared/ui/KpiCard";
import { getVehicleApprovalLabel } from "@/shared/lib/vehicleLabels";
import { useDateRangeFilter } from "@/shared/hooks/useDateRangeFilter";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import { DateRangeFilter } from "@/shared/ui/DateRangeFilter";
import { IvorianPlateBadge } from "@/shared/ui/IvorianPlateBadge";
import { VehicleTypeBadge } from "@/shared/ui/VehicleTypeBadge";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { Vehicle, VehicleApprovalStatus } from "@/shared/types";
import { usePartnerVehiclesList } from "../api/vehicles.queries";

const STATUS_FILTERS: { value: VehicleApprovalStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "approved", label: "Approuvés" },
  { value: "pending", label: "En validation" },
  { value: "rejected", label: "Rejetés" },
  { value: "draft", label: "Brouillons" },
];

interface PartnerVehiclesListPageProps {
  pendingOnly?: boolean;
}

export function PartnerVehiclesListPage({ pendingOnly }: PartnerVehiclesListPageProps) {
  const [statusFilter, setStatusFilter] = useState<VehicleApprovalStatus | "all">(
    pendingOnly ? "pending" : "all"
  );

  const dateRange = useDateRangeFilter({ defaultPreset: "all" });

  const table = useServerTableState(
    [statusFilter, pendingOnly, dateRange.dateFrom, dateRange.dateTo],
    {
      status: pendingOnly
        ? "pending"
        : statusFilter !== "all"
          ? statusFilter
          : undefined,
      ...dateRange.listParams,
    }
  );

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      ...(!pendingOnly
        ? [
            {
              value: statusFilter,
              defaultValue: "all" as const,
              reset: () => setStatusFilter("all"),
            },
          ]
        : []),
      dateRange.resetField,
    ],
  });

  const { data, isLoading, isError } = usePartnerVehiclesList(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<Vehicle>[] = [
    {
      id: "plate",
      header: "Immatriculation",
      cell: (v) => (
        <Link href={`/partner/fleet/${v.id}`} className="inline-block hover:opacity-90">
          {v.plate ? <IvorianPlateBadge plate={v.plate} size="sm" /> : "—"}
        </Link>
      ),
      exportValue: (v) => v.plate ?? "",
    },
    {
      id: "brand",
      header: "Marque",
      cell: (v) => v.brand ?? "—",
      exportValue: (v) => v.brand ?? "",
      sortKey: (v) => v.brand ?? "",
    },
    {
      id: "model",
      header: "Modèle",
      cell: (v) => v.model ?? "—",
      exportValue: (v) => v.model ?? "",
      sortKey: (v) => v.model ?? "",
    },
    {
      id: "driver",
      header: "Chauffeur affecté",
      cell: (v) => v.driver_name ?? "—",
      exportValue: (v) => v.driver_name ?? "",
      sortKey: (v) => v.driver_name ?? "",
    },
    {
      id: "year",
      header: "Année",
      className: "tabular-nums",
      cell: (v) => v.year,
      exportValue: (v) => String(v.year),
      sortKey: (v) => v.year ?? 0,
    },
    {
      id: "color",
      header: "Couleur",
      cell: (v) => v.color,
      exportValue: (v) => v.color,
    },
    {
      id: "type",
      header: "Type & service",
      cell: (v) => <VehicleTypeBadge vehicle={v} />,
      exportValue: (v) =>
        [v.category_code, v.category_label, v.category].filter(Boolean).join(" · "),
    },
    {
      id: "status",
      header: "Statut",
      cell: (v) => <VehicleApprovalPill status={v.approval_status} />,
      exportValue: (v) => getVehicleApprovalLabel(v.approval_status),
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les véhicules.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={pendingOnly ? "Véhicules à valider" : "Mes véhicules"}
        breadcrumb={["Partenaire", "Flotte"]}
        actions={
          <Link href="/partner/fleet/new">
            <Button>Nouveau chauffeur + véhicule</Button>
          </Link>
        }
      />

      {data?.summary && !pendingOnly && (
        <div className="mb-6 grid gap-3 grid-cols-2 sm:grid-cols-4">
          <KpiCard label="Approuvés" value={String(data.summary.approved)} />
          <KpiCard label="En validation" value={String(data.summary.pending)} />
          <KpiCard label="Rejetés" value={String(data.summary.rejected)} />
          <KpiCard label="Brouillons" value={String(data.summary.draft)} />
        </div>
      )}

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Marque, plaque, chauffeur…"
        totalLabel={meta ? `${meta.total} véhicules enregistrés` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        {!pendingOnly && (
          <FilterChips
            options={STATUS_FILTERS}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        )}
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
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(v) => v.id}
        isLoading={isLoading}
        exportFileName={
          pendingOnly ? "vehicules-a-valider-partenaire" : "vehicules-partenaire"
        }
        emptyTitle="Aucun véhicule"
        emptyDescription={
          pendingOnly
            ? "Tous vos véhicules sont à jour."
            : "Ajoutez un véhicule puis téléversez la carte grise."
        }
        pagination={false}
        serverPagination={serverPaginationFromMeta(
          meta,
          table.setPage,
          table.setPageSize
        )}
      />
    </div>
  );
}
