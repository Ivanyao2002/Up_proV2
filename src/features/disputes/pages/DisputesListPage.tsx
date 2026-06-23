"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { FilterChips } from "@/shared/ui/FilterChips";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { SelectFilter } from "@/shared/ui/SelectFilter";
import { formatDateTime } from "@/shared/lib/format";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { Dispute, DisputeCategory, DisputeStatus } from "../api/dispute.types";
import { useDisputesList } from "../api/dispute.queries";
import { DisputeAssignmentCell } from "../components/DisputeAssignmentCell";
import {
  STATUS_FILTERS,
  STATUS_LABELS,
  STATUS_COLORS,
  CATEGORY_FILTERS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from "../lib/disputeConstants";

export function DisputesListPage() {
  const [statusFilter,   setStatusFilter]   = useState<DisputeStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<DisputeCategory | "all">("all");

  const table = useServerTableState([statusFilter, categoryFilter], {
    status:   statusFilter   !== "all" ? statusFilter   : undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: statusFilter,   defaultValue: "all", reset: () => setStatusFilter("all") },
      { value: categoryFilter, defaultValue: "all", reset: () => setCategoryFilter("all") },
    ],
  });

  const { data, isLoading, isError } = useDisputesList(table.listParams);
  const rows   = data?.data ?? [];
  const meta   = data?.meta;
  const facets = data?.facets?.status;

  const statusOptions = STATUS_FILTERS.map((f) => ({
    value: f.value,
    label: facets ? `${f.label} (${facets[f.value] ?? 0})` : f.label,
  }));

  const columns: Column<Dispute>[] = [
    {
      id: "id",
      header: "Référence",
      cell: (d) => (
        <Link href={`/support/disputes/${d.id}`} className="group block">
          <p className="font-mono text-sm font-medium text-foreground group-hover:text-teal-dark">
            {d.id}
          </p>
          {d.trip_ref && <p className="text-xs text-muted">{d.trip_ref}</p>}
        </Link>
      ),
      exportValue: (d) => d.id,
    },
    {
      id: "subject",
      header: "Sujet",
      cell: (d) => (
        <Link href={`/support/disputes/${d.id}`} className="group block max-w-xs">
          <p className="font-medium text-foreground group-hover:text-teal-dark line-clamp-2">
            {d.subject}
          </p>
        </Link>
      ),
      exportValue: (d) => d.subject,
    },
    {
      id: "category",
      header: "Catégorie",
      cell: (d) => (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[d.category]}`}>
          {CATEGORY_LABELS[d.category]}
        </span>
      ),
      exportValue: (d) => CATEGORY_LABELS[d.category],
    },
    {
      id: "reporter",
      header: "Client",
      cell: (d) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{d.reporter_name}</p>
          {d.reporter_phone && (
            <p className="text-xs text-muted">{d.reporter_phone}</p>
          )}
        </div>
      ),
      exportValue: (d) => d.reporter_name,
    },
    {
      id: "assignment",
      header: "Prise en charge",
      cell: (d) => <DisputeAssignmentCell dispute={d} />,
      exportValue: (d) => d.assigned_to ?? "Non assigné",
    },
    {
      id: "status",
      header: "Statut",
      cell: (d) => (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[d.status]}`}>
          {STATUS_LABELS[d.status]}
        </span>
      ),
      exportValue: (d) => STATUS_LABELS[d.status],
    },
    {
      id: "updated",
      header: "Mis à jour",
      cell: (d) => (
        <span className="whitespace-nowrap text-xs text-muted">
          {formatDateTime(d.updated_at)}
        </span>
      ),
      exportValue: (d) => d.updated_at,
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les litiges.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Litiges" breadcrumb={["Support"]} />
      <p className="-mt-2 mb-4 text-sm text-muted">
        Litiges soumis par les clients depuis l'application mobile — chaque litige est lié à une course ou une action spécifique.
      </p>

      <div className="mb-4">
        <FilterChips
          size="sm"
          options={statusOptions}
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value as DisputeStatus | "all");
            table.setPage(1);
          }}
        />
      </div>

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Rechercher par sujet, client, référence…"
        totalLabel={meta ? `${meta.total} litige${meta.total !== 1 ? "s" : ""}` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <SelectFilter
          label="Catégorie"
          options={CATEGORY_FILTERS}
          value={categoryFilter}
          onChange={(value) => {
            setCategoryFilter(value as DisputeCategory | "all");
            table.setPage(1);
          }}
          wide
        />
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(d) => d.id}
        isLoading={isLoading}
        exportFileName="litiges"
        emptyTitle="Aucun litige"
        emptyDescription="Aucun litige ne correspond aux filtres sélectionnés."
        serverPagination={serverPaginationFromMeta(meta, table.setPage, table.setPageSize)}
      />
    </div>
  );
}
