"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { SelectFilter } from "@/shared/ui/SelectFilter";
import { EntityStatusPill } from "@/shared/ui/EntityStatusPill";
import { formatFCFA } from "@/shared/lib/format";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { FranchisePartner } from "../api/partners.service";
import { useFranchisePartnersList } from "../api/partners.queries";

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

export function FranchisePartnersListPage() {
  const [statusFilter, setStatusFilter] = useState<FranchisePartner["status"] | "all">(
    "all"
  );

  const table = useServerTableState([statusFilter], {
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
    ],
  });

  const { data, isLoading, isError } = useFranchisePartnersList(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<FranchisePartner>[] = [
    {
      id: "name",
      header: "Partenaire",
      cell: (p) => (
        <Link
          href={`/franchise/partners/${p.id}`}
          className="font-medium text-foreground hover:text-teal"
        >
          {p.name}
        </Link>
      ),
      exportValue: (p) => p.name,
    },
    {
      id: "city",
      header: "Ville",
      cell: (p) => p.city,
      exportValue: (p) => p.city,
    },
    {
      id: "drivers",
      header: "Chauffeurs",
      cell: (p) => String(p.drivers_count),
      exportValue: (p) => p.drivers_count,
    },
    {
      id: "revenue",
      header: "CA mensuel",
      cell: (p) => formatFCFA(p.revenue_month_fcfa ?? 0),
      exportValue: (p) => p.revenue_month_fcfa ?? 0,
    },
    {
      id: "status",
      header: "Statut",
      cell: (p) => <EntityStatusPill status={p.status} />,
      exportValue: (p) => ENTITY_STATUS_LABELS[p.status],
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les partenaires.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Sous-partenaires"
        breadcrumb={["Franchise", "Réseau"]}
      />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Nom, email, ville…"
        totalLabel={
          meta ? `${meta.total} partenaires sur le territoire` : undefined
        }
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
        rowKey={(p) => p.id}
        isLoading={isLoading}
        exportFileName="sous-partenaires-franchise"
        emptyTitle="Aucun partenaire"
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
