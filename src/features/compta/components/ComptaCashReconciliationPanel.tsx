"use client";

import { useState } from "react";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { FilterChips } from "@/shared/ui/FilterChips";
import { formatFCFA } from "@/shared/lib/format";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import { useCashReconciliationsList } from "../api/cashReconciliations.queries";
import type { CashReconciliationRow } from "../api/compta.types";

const STATUS_FILTERS = [
  { value: "all" as const, label: "Tous" },
  { value: "matched" as const, label: "Rapprochés" },
  { value: "discrepancy" as const, label: "Écarts" },
  { value: "pending" as const, label: "En cours" },
];

export function ComptaCashReconciliationPanel() {
  const [statusFilter, setStatusFilter] = useState<CashReconciliationRow["status"] | "all">("all");
  const table = useServerTableState([statusFilter], {
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
    ],
  });

  const { data, isLoading, isError } = useCashReconciliationsList(table.listParams);
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<CashReconciliationRow>[] = [
    {
      id: "date",
      header: "Date",
      cell: (r) => r.date_label,
      exportValue: (r) => r.date_label,
    },
    {
      id: "driver",
      header: "Chauffeur",
      cell: (r) => (
        <div>
          <p className="font-medium">{r.driver_name}</p>
          {r.franchise_name ? <p className="text-xs text-muted">{r.franchise_name}</p> : null}
        </div>
      ),
      exportValue: (r) => r.driver_name,
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
      header: "Déclaré",
      className: "tabular-nums",
      cell: (r) => formatFCFA(r.received_fcfa),
      exportValue: (r) => r.received_fcfa,
    },
    {
      id: "delta",
      header: "Écart",
      className: "tabular-nums",
      cell: (r) => (
        <span className={r.delta_fcfa === 0 ? "text-muted" : "font-medium text-red-600"}>
          {r.delta_fcfa === 0 ? "—" : formatFCFA(r.delta_fcfa)}
        </span>
      ),
      exportValue: (r) => r.delta_fcfa,
    },
    {
      id: "status",
      header: "Statut",
      cell: (r) => (
        <span className="text-sm capitalize">
          {r.status === "matched"
            ? "Rapproché"
            : r.status === "discrepancy"
              ? "Écart"
              : "En cours"}
        </span>
      ),
      exportValue: (r) => r.status,
    },
  ];

  if (isError) {
    return (
      <p className="text-sm text-red-600">Impossible de charger les réconciliations cash.</p>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        Rapprochement du cash collecté par chauffeur — consultation seule.
      </p>
      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Chauffeur, franchise…"
        totalLabel={meta ? `${meta.total} lignes` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <FilterChips options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
      </TableFiltersBar>
      <DataTable
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        exportFileName="reconciliation-cash"
        emptyTitle="Aucune réconciliation cash"
        pagination={false}
        serverPagination={serverPaginationFromMeta(meta, table.setPage, table.setPageSize)}
      />
    </div>
  );
}
