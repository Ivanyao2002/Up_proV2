"use client";

import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { FilterChips } from "@/shared/ui/FilterChips";
import { formatFCFA } from "@/shared/lib/format";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { ReconciliationRow } from "../api/commissions.service";
import { useReconciliationList } from "../api/commissions.queries";

const STATUS_FILTERS = [
  { value: "all" as const, label: "Tous" },
  { value: "matched" as const, label: "Rapprochés" },
  { value: "discrepancy" as const, label: "Écarts" },
  { value: "pending" as const, label: "En cours" },
];

export function ReconciliationListPage() {
  const [statusFilter, setStatusFilter] = useState<ReconciliationRow["status"] | "all">(
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

  const { data, isLoading, isError } = useReconciliationList(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<ReconciliationRow>[] = [
    {
      id: "date",
      header: "Date",
      cell: (r) => (
        <div>
          <p className="font-medium text-foreground">{r.date_label}</p>
          <p className="text-xs text-muted">{r.id}</p>
        </div>
      ),
      exportValue: (r) => r.date_label,
    },
    {
      id: "source",
      header: "Source",
      cell: (r) => r.source,
      exportValue: (r) => r.source,
    },
    {
      id: "expected",
      header: "Attendu",
      className: "tabular-nums",
      cell: (r) => formatFCFA(r.expected_fcfa),
      exportValue: (r) => r.expected_fcfa,
    },
    {
      id: "received",
      header: "Reçu",
      className: "tabular-nums",
      cell: (r) => formatFCFA(r.received_fcfa),
      exportValue: (r) => r.received_fcfa,
    },
    {
      id: "delta",
      header: "Écart",
      className: "tabular-nums",
      cell: (r) => (
        <span
          className={
            r.delta_fcfa === 0
              ? "text-muted"
              : r.delta_fcfa < 0
                ? "font-medium text-red-600"
                : "font-medium text-teal-dark"
          }
        >
          {r.delta_fcfa === 0 ? "—" : formatFCFA(r.delta_fcfa)}
        </span>
      ),
      exportValue: (r) => r.delta_fcfa,
    },
    {
      id: "status",
      header: "Statut",
      cell: (r) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            r.status === "matched"
              ? "bg-teal/15 text-teal-dark"
              : r.status === "discrepancy"
                ? "bg-red-50 text-red-700"
                : "bg-amber-50 text-amber-700"
          }`}
        >
          {r.status === "matched"
            ? "Rapproché"
            : r.status === "discrepancy"
              ? "Écart détecté"
              : "En cours"}
        </span>
      ),
      exportValue: (r) => r.status,
    },
  ];

  if (isError) {
    return (
      <p className="text-sm text-red-600">Impossible de charger la réconciliation.</p>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Réconciliation" breadcrumb={["Admin", "Finance"]} />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Période, franchise…"
        totalLabel={meta ? `${meta.total} lignes` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <FilterChips
          options={STATUS_FILTERS}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        exportFileName="reconciliation"
        emptyTitle="Aucune ligne de réconciliation"
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
