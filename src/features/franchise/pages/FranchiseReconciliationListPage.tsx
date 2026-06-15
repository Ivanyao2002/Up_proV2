"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { FilterChips } from "@/shared/ui/FilterChips";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { useDateRangeFilter } from "@/shared/hooks/useDateRangeFilter";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import { DateRangeFilter } from "@/shared/ui/DateRangeFilter";
import { FranchiseLiveMapPartnerFilter } from "../components/FranchiseLiveMapPartnerFilter";
import type { FranchiseLiveMapFiltersValue } from "../api/liveMap.types";
import type { FranchiseReconciliationRow } from "../api/reconciliation.service";
import { useFranchiseReconciliationList } from "../api/reconciliation.queries";

const STATUS_FILTERS = [
  { value: "all" as const, label: "Tous" },
  { value: "matched" as const, label: "Rapprochés" },
  { value: "discrepancy" as const, label: "Écarts" },
  { value: "pending" as const, label: "En cours" },
];

export function FranchiseReconciliationListPage() {
  const [statusFilter, setStatusFilter] =
    useState<FranchiseReconciliationRow["status"] | "all">("all");
  const [scope, setScope] = useState<FranchiseLiveMapFiltersValue>({
    partnerId: null,
  });

  const dateRange = useDateRangeFilter({ defaultPreset: "7d" });

  const table = useServerTableState(
    [statusFilter, scope.partnerId, dateRange.dateFrom, dateRange.dateTo],
    {
      status: statusFilter !== "all" ? statusFilter : undefined,
      partner_id: scope.partnerId ?? undefined,
      ...dateRange.listParams,
    }
  );

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
      {
        value: scope.partnerId != null,
        defaultValue: false,
        reset: () => setScope({ partnerId: null }),
      },
      dateRange.resetField,
    ],
  });

  const { data, isLoading, isError } = useFranchiseReconciliationList(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const wallet = data?.wallet;
  const showPartnerColumn = scope.partnerId == null;

  const columns: Column<FranchiseReconciliationRow>[] = [
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
    ...(showPartnerColumn
      ? [
          {
            id: "partner",
            header: "Partenaire",
            cell: (r: FranchiseReconciliationRow) =>
              r.partner_id != null ? (
                <Link
                  href={`/franchise/partners/${r.partner_id}`}
                  className="text-sm text-foreground hover:text-teal"
                >
                  {r.partner_name}
                </Link>
              ) : (
                <span className="text-muted">Territoire</span>
              ),
            exportValue: (r: FranchiseReconciliationRow) => r.partner_name ?? "",
          } satisfies Column<FranchiseReconciliationRow>,
        ]
      : []),
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
      <p className="text-sm text-red-600">
        Impossible de charger la réconciliation.{" "}
        <Link href="/franchise/finance/reconciliation" className="text-teal underline">
          Réessayer
        </Link>
      </p>
    );
  }

  // Calcul des stats
  const matchedCount = rows.filter((r) => r.status === "matched").length;
  const discrepancyCount = rows.filter((r) => r.status === "discrepancy").length;

  return (
    <div className="animate-fade-up">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader
          title="Réconciliation"
          breadcrumb={["Franchise", "Finance", "Réconciliation"]}
        />
        {meta && (
          <p className="mt-1 text-sm text-muted">
            {meta.total} ligne{meta.total > 1 ? "s" : ""}
            {matchedCount > 0 && <> · <span className="text-teal-dark">{matchedCount} rapproché{matchedCount > 1 ? "s" : ""}</span></>}
            {discrepancyCount > 0 && <> · <span className="text-red-600 font-medium">{discrepancyCount} écart{discrepancyCount > 1 ? "s" : ""}</span></>}
          </p>
        )}
      </div>

      {/* Wallet summary */}
      {wallet && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-card border border-border bg-surface px-5 py-4 shadow-card">
            <p className="text-xs text-muted">Solde wallet</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{formatFCFA(wallet.balance_xof)}</p>
          </div>
          <div className="rounded-card border border-border bg-surface px-5 py-4 shadow-card">
            <p className="text-xs text-muted">Disponible</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-teal-dark">{formatFCFA(wallet.available_xof)}</p>
          </div>
          <div className="rounded-card border border-border bg-surface px-5 py-4 shadow-card">
            <p className="text-xs text-muted">Retraits en attente</p>
            <p className={`mt-1 text-lg font-semibold tabular-nums ${wallet.pending_withdrawal_xof > 0 ? "text-amber-600" : "text-foreground"}`}>
              {formatFCFA(wallet.pending_withdrawal_xof)}
            </p>
            <p className="mt-0.5 text-xs text-muted">Mis à jour {formatDateTime(wallet.updated_at)}</p>
          </div>
        </div>
      )}

      {data?.filter_options && (
        <FranchiseLiveMapPartnerFilter
          options={data.filter_options}
          value={scope}
          onChange={setScope}
        />
      )}

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Source, partenaire, référence…"
        totalLabel={meta ? `${meta.total} lignes` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <FilterChips
          options={STATUS_FILTERS}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <DateRangeFilter
          preset={dateRange.preset}
          onPresetChange={dateRange.setPreset}
          customFrom={dateRange.customFrom}
          customTo={dateRange.customTo}
          onCustomFromChange={dateRange.setCustomFrom}
          onCustomToChange={dateRange.setCustomTo}
          rangeLabel={dateRange.rangeLabel}
        />
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        exportFileName="reconciliation-franchise"
        emptyTitle="Aucune entrée de réconciliation"
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
