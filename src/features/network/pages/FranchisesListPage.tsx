"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { SelectFilter } from "@/shared/ui/SelectFilter";
import { EntityStatusPill } from "@/shared/ui/EntityStatusPill";
import { Button } from "@/shared/ui/Button";
import { formatFCFA } from "@/shared/lib/format";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { Franchise } from "@/shared/types";
import { useFranchisesList } from "../api/franchises.queries";

const ENTITY_STATUS_LABELS = {
  active: "Actif",
  pending: "En attente",
  suspended: "Suspendu",
} as const;

const STATUS_OPTIONS = [
  { value: "all" as const, label: "Tous les statuts" },
  { value: "active" as const, label: "Actif" },
  { value: "pending" as const, label: "En attente" },
  { value: "suspended" as const, label: "Suspendu" },
];

export function FranchisesListPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<Franchise["status"] | "all">("all");

  const table = useServerTableState([statusFilter], {
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
    ],
  });

  const { data, isLoading, isError } = useFranchisesList(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<Franchise>[] = [
    {
      id: "name",
      header: "Franchise",
      cell: (f) => (
        <div>
          <Link
            href={`/admin/network/franchises/${f.id}`}
            className="font-medium text-foreground hover:text-teal"
          >
            {f.name}
          </Link>
          <p className="text-xs text-muted">{f.city}</p>
        </div>
      ),
      exportValue: (f) => `${f.name} (${f.city})`,
    },
    {
      id: "status",
      header: "Statut",
      cell: (f) => <EntityStatusPill status={f.status} />,
      exportValue: (f) => ENTITY_STATUS_LABELS[f.status],
    },
    {
      id: "partners",
      header: "Partenaires",
      className: "tabular-nums",
      cell: (f) => f.partners_count,
      exportValue: (f) => f.partners_count,
    },
    {
      id: "drivers",
      header: "Chauffeurs",
      className: "tabular-nums",
      cell: (f) => f.drivers_count.toLocaleString("fr-CI"),
      exportValue: (f) => f.drivers_count,
    },
    {
      id: "zones",
      header: "Zones",
      className: "tabular-nums",
      cell: (f) => f.zones_count,
      exportValue: (f) => f.zones_count,
    },
    {
      id: "revenue",
      header: "Revenus / mois",
      className: "tabular-nums whitespace-nowrap",
      cell: (f) => formatFCFA(f.revenue_month_fcfa),
      exportValue: (f) => f.revenue_month_fcfa,
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les franchises.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Franchises"
        breadcrumb={["Admin", "Réseau"]}
        actions={
          <Button variant="primary" onClick={() => router.push("/admin/network/franchises/new")}>
            Nouvelle franchise
          </Button>
        }
      />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Nom, ville…"
        totalLabel={meta ? `${meta.total} franchises` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <SelectFilter
          label="Statut"
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_OPTIONS}
        />
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(f) => f.id}
        isLoading={isLoading}
        exportFileName="franchises"
        emptyTitle="Aucune franchise"
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
