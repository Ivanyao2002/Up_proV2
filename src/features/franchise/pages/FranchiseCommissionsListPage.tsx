"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { FilterChips } from "@/shared/ui/FilterChips";
import { formatFCFA } from "@/shared/lib/format";
import { useDateRangeFilter } from "@/shared/hooks/useDateRangeFilter";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import { DateRangeFilter } from "@/shared/ui/DateRangeFilter";
import type { FranchisePartnerCommission } from "../api/commissions.service";
import { useFranchiseCommissionsList } from "../api/commissions.queries";
import { FranchiseLiveMapPartnerFilter } from "../components/FranchiseLiveMapPartnerFilter";
import type { FranchiseLiveMapFiltersValue } from "../api/liveMap.types";

const STATUS_FILTERS = [
  { value: "all" as const, label: "Tous" },
  { value: "paid" as const, label: "Versées" },
  { value: "pending" as const, label: "En attente" },
];

export function FranchiseCommissionsListPage() {
  const [statusFilter, setStatusFilter] =
    useState<FranchisePartnerCommission["status"] | "all">("all");
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

  const { data, isLoading, isError } = useFranchiseCommissionsList(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const summary = data?.summary;
  const showPartnerColumn = scope.partnerId == null;

  const columns: Column<FranchisePartnerCommission>[] = [
    {
      id: "period",
      header: "Période",
      cell: (c) => (
        <div>
          <p className="font-medium text-foreground">{c.period_label}</p>
          <p className="text-xs text-muted">{c.id}</p>
        </div>
      ),
      exportValue: (c) => c.period_label,
    },
    ...(showPartnerColumn
      ? [
          {
            id: "partner",
            header: "Partenaire",
            cell: (c: FranchisePartnerCommission) => (
              <div>
                <Link
                  href={`/franchise/partners/${c.partner_id}`}
                  className="font-medium text-foreground hover:text-teal"
                >
                  {c.partner_name}
                </Link>
                <p className="text-xs text-muted">{c.partner_city}</p>
              </div>
            ),
            exportValue: (c: FranchisePartnerCommission) => c.partner_name,
          } satisfies Column<FranchisePartnerCommission>,
        ]
      : []),
    {
      id: "trips",
      header: "Courses",
      className: "tabular-nums",
      cell: (c) => c.trips_count.toLocaleString("fr-CI"),
      exportValue: (c) => c.trips_count,
    },
    {
      id: "gross",
      header: "CA brut",
      className: "tabular-nums",
      cell: (c) => formatFCFA(c.gross_fcfa),
      exportValue: (c) => c.gross_fcfa,
    },
    {
      id: "commission",
      header: "Commission",
      className: "tabular-nums",
      cell: (c) => (
        <span className="font-medium text-teal-dark">
          {formatFCFA(c.commission_fcfa)} ({c.rate_pct} %)
        </span>
      ),
      exportValue: (c) => c.commission_fcfa,
    },
    {
      id: "status",
      header: "Statut",
      cell: (c) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            c.status === "paid"
              ? "bg-teal/15 text-teal-dark"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {c.status === "paid" ? "Versée" : "En attente"}
        </span>
      ),
      exportValue: (c) => (c.status === "paid" ? "Versée" : "En attente"),
    },
  ];

  if (isError) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger les commissions.{" "}
        <Link href="/franchise/finance/commissions" className="text-teal underline">
          Réessayer
        </Link>
      </p>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader
          title="Commissions"
          breadcrumb={["Franchise", "Finance", "Commissions"]}
        />
        {summary && (
          <p className="mt-1 text-sm text-muted">
            {formatFCFA(summary.pending_fcfa)} en attente · {formatFCFA(summary.paid_month_fcfa)} versé · {meta?.total ?? 0} périodes
          </p>
        )}
      </div>

      {data?.filter_options && (
        <FranchiseLiveMapPartnerFilter
          options={data.filter_options}
          value={scope}
          onChange={setScope}
        />
      )}

      {summary && (
        <div className="mb-5 grid gap-4 sm:grid-cols-2">
          <KpiCard
            index={0}
            label="En attente de versement"
            value={formatFCFA(summary.pending_fcfa)}
            hint={`${summary.pending_count} période${summary.pending_count > 1 ? "s" : ""}`}
          />
          <KpiCard
            index={1}
            label="Versées (périodes payées)"
            value={formatFCFA(summary.paid_month_fcfa)}
            hint="Total des commissions déjà versées"
          />
        </div>
      )}

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Partenaire, période, référence…"
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
        rowKey={(c) => c.id}
        isLoading={isLoading}
        exportFileName="commissions-partenaires-franchise"
        emptyTitle="Aucune commission"
        emptyDescription="Aucun résultat pour ce partenaire ou ces filtres."
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
