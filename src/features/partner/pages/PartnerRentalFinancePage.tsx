"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { FilterChips } from "@/shared/ui/FilterChips";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import { useServerTableState } from "@/shared/hooks/useServerTableState";
import { formatFCFA, formatDate } from "@/shared/lib/format";
import {
  usePartnerRentalFinanceSummary,
  usePartnerRentalSettlements,
} from "../api/rentalFinance.queries";
import {
  RENTAL_SETTLEMENT_STATUS_CONFIG,
  type RentalSettlement,
  type RentalSettlementStatus,
} from "../api/rentalFinance.service";

const STATUS_FILTERS: { value: RentalSettlementStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "pending", label: "En attente" },
  { value: "paid", label: "Payés" },
  { value: "hold", label: "Bloqués" },
];

export function PartnerRentalFinancePage() {
  const table = useServerTableState([]);
  const [statusFilter, setStatusFilter] = useState<RentalSettlementStatus | "all">("all");

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
    ],
  });

  const { data: summary, isLoading: summaryLoading } = usePartnerRentalFinanceSummary();
  const { data, isLoading } = usePartnerRentalSettlements({ per_page: 200 });
  const all = useMemo(() => data?.data ?? [], [data?.data]);

  const searchTerm = table.search.trim().toLowerCase();
  const rows = useMemo(
    () =>
      all.filter((s) => {
        if (statusFilter !== "all" && s.status !== statusFilter) return false;
        if (!searchTerm) return true;
        return [s.ref, s.period].filter(Boolean).join(" ").toLowerCase().includes(searchTerm);
      }),
    [all, statusFilter, searchTerm]
  );

  const columns: Column<RentalSettlement>[] = [
    {
      id: "ref",
      header: "Référence",
      cell: (s) => s.ref ?? s.id.slice(0, 8),
      exportValue: (s) => s.ref ?? s.id,
    },
    {
      id: "period",
      header: "Période",
      cell: (s) => s.period ?? "—",
      exportValue: (s) => s.period ?? "",
    },
    {
      id: "amount",
      header: "Montant net",
      cell: (s) => <span className="font-medium text-teal">{formatFCFA(s.amount_fcfa)}</span>,
      exportValue: (s) => String(s.amount_fcfa),
    },
    {
      id: "status",
      header: "Statut",
      cell: (s) => {
        const cfg = RENTAL_SETTLEMENT_STATUS_CONFIG[s.status];
        return (
          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${cfg.color}`}>
            {cfg.label}
          </span>
        );
      },
      exportValue: (s) => RENTAL_SETTLEMENT_STATUS_CONFIG[s.status].label,
    },
    {
      id: "date",
      header: "Date",
      cell: (s) => (
        <span className="text-xs text-muted">
          {s.paid_at ? formatDate(s.paid_at) : s.created_at ? formatDate(s.created_at) : "—"}
        </span>
      ),
      exportValue: (s) => s.paid_at ?? s.created_at ?? "",
    },
  ];

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader title="Finance location" breadcrumb={["Partenaire", "Location", "Finance"]} />

      <div className="mb-5 grid gap-3 grid-cols-2 sm:grid-cols-4">
        <KpiCard
          index={0}
          label="Brut encaissé"
          value={summary ? formatFCFA(summary.gross_fcfa) : "—"}
          isLoading={summaryLoading}
        />
        <KpiCard
          index={1}
          label="Commissions"
          value={summary ? formatFCFA(summary.commission_fcfa) : "—"}
          isLoading={summaryLoading}
        />
        <KpiCard
          index={2}
          label="Frais & taxes"
          value={summary ? formatFCFA(summary.fees_fcfa + summary.taxes_fcfa) : "—"}
          isLoading={summaryLoading}
        />
        <KpiCard
          index={3}
          label="Net partenaire"
          value={summary ? formatFCFA(summary.net_fcfa) : "—"}
          isLoading={summaryLoading}
        />
      </div>

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Référence, période…"
        totalLabel={`${rows.length} reversement${rows.length > 1 ? "s" : ""}`}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <FilterChips options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(s) => s.id}
        isLoading={isLoading}
        pagination={{ pageSize: 10 }}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetAll}
        exportFileName="reversements-location"
        emptyTitle="Aucun reversement"
        emptyDescription="Les reversements de vos locations apparaîtront ici"
      />
    </div>
  );
}
