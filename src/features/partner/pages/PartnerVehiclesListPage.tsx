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
import {
  getVehicleApprovalLabel,
  getVehicleCategoryLabel,
} from "@/shared/lib/vehicleLabels";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
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

  const table = useServerTableState([statusFilter, pendingOnly], {
    status: pendingOnly
      ? "pending"
      : statusFilter !== "all"
        ? statusFilter
        : undefined,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    ...(!pendingOnly
      ? {
          fields: [
            {
              value: statusFilter,
              defaultValue: "all",
              reset: () => setStatusFilter("all"),
            },
          ],
        }
      : {}),
  });

  const { data, isLoading, isError } = usePartnerVehiclesList(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<Vehicle>[] = [
    {
      id: "vehicle",
      header: "Véhicule",
      cell: (v) => (
        <div>
          <Link
            href={`/partner/fleet/${v.id}`}
            className="font-medium text-foreground hover:text-teal"
          >
            {v.label}
          </Link>
          <p className="text-xs text-muted">
            {v.plate || "Plaque à renseigner"} · {getVehicleCategoryLabel(v.category)}
          </p>
        </div>
      ),
      exportValue: (v) =>
        `${v.label} · ${v.plate || "Plaque à renseigner"} · ${getVehicleCategoryLabel(v.category)}`,
    },
    {
      id: "year",
      header: "Année",
      className: "tabular-nums",
      cell: (v) => v.year,
      exportValue: (v) => v.year,
    },
    {
      id: "color",
      header: "Couleur",
      cell: (v) => v.color,
      exportValue: (v) => v.color,
    },
    {
      id: "driver",
      header: "Chauffeur assigné",
      cell: (v) => v.driver_name ?? "—",
      exportValue: (v) => v.driver_name ?? "",
    },
    {
      id: "status",
      header: "Validation",
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
            <Button>Ajouter un véhicule</Button>
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
