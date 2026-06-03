"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { FilterChips } from "@/shared/ui/FilterChips";
import { HeroKpi } from "@/features/ops/components/HeroKpi";
import { KpiCard } from "@/shared/ui/KpiCard";
import { TransactionStatusPill } from "@/shared/ui/TransactionStatusPill";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { TRANSACTION_TYPE_LABELS } from "@/shared/lib/financeLabels";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import { getPaymentLabel } from "@/shared/lib/paymentLabels";
import type { Transaction, TransactionStatus, TransactionType } from "@/shared/types";
import { useTransactionsList } from "../api/transactions.queries";

const TRANSACTION_STATUS_LABELS = {
  completed: "Validé",
  pending: "En attente",
  failed: "Échoué",
} as const;

const TYPE_FILTERS: { value: TransactionType | "all"; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "trip_payment", label: "Courses" },
  { value: "commission", label: "Commissions" },
  { value: "withdrawal", label: "Retraits" },
  { value: "refund", label: "Remboursements" },
];

const STATUS_FILTERS: { value: TransactionStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous statuts" },
  { value: "completed", label: "Validées" },
  { value: "pending", label: "En attente" },
  { value: "failed", label: "Échouées" },
];

export function TransactionsListPage() {
  const [typeFilter, setTypeFilter] = useState<TransactionType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "all">("all");

  const table = useServerTableState([typeFilter, statusFilter], {
    type: typeFilter !== "all" ? typeFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: typeFilter, defaultValue: "all", reset: () => setTypeFilter("all") },
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
    ],
  });

  const { data, isLoading, isError } = useTransactionsList(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<Transaction>[] = [
    {
      id: "id",
      header: "Réf.",
      cell: (t) => <span className="font-medium text-foreground">{t.id}</span>,
      exportValue: (t) => t.id,
    },
    {
      id: "type",
      header: "Type",
      cell: (t) => (
        <span className="text-sm">{TRANSACTION_TYPE_LABELS[t.type]}</span>
      ),
      exportValue: (t) => TRANSACTION_TYPE_LABELS[t.type],
    },
    {
      id: "label",
      header: "Libellé",
      cell: (t) => (
        <div className="max-w-[200px]">
          <p className="truncate">{t.label}</p>
          {t.entity_type === "trip" && (
            <Link
              href="/admin/ops/trips"
              className="text-xs text-teal hover:underline"
            >
              {t.entity_ref}
            </Link>
          )}
        </div>
      ),
      exportValue: (t) =>
        t.entity_type === "trip" ? `${t.label} (${t.entity_ref})` : t.label,
    },
    {
      id: "amount",
      header: "Montant",
      className: "tabular-nums whitespace-nowrap",
      cell: (t) => (
        <span
          className={
            t.direction === "credit" ? "font-medium text-teal-dark" : "text-red-600"
          }
        >
          {t.direction === "debit" ? "−" : "+"}
          {formatFCFA(t.amount_fcfa)}
        </span>
      ),
      exportValue: (t) =>
        t.direction === "debit" ? -t.amount_fcfa : t.amount_fcfa,
    },
    {
      id: "payment",
      header: "Paiement",
      cell: (t) => getPaymentLabel(t.payment_method),
      exportValue: (t) => getPaymentLabel(t.payment_method),
    },
    {
      id: "franchise",
      header: "Franchise",
      cell: (t) => t.franchise_name,
      exportValue: (t) => t.franchise_name,
    },
    {
      id: "status",
      header: "Statut",
      cell: (t) => <TransactionStatusPill status={t.status} />,
      exportValue: (t) => TRANSACTION_STATUS_LABELS[t.status],
    },
    {
      id: "date",
      header: "Date",
      className: "text-muted whitespace-nowrap",
      cell: (t) => formatDateTime(t.created_at),
      exportValue: (t) => formatDateTime(t.created_at),
    },
  ];

  if (isError) {
    return (
      <p className="text-sm text-red-600">Impossible de charger les transactions.</p>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Transactions" breadcrumb={["Admin", "Finance"]} />

      {data?.summary && (
        <div className="animate-stagger mb-6 space-y-4">
          <HeroKpi
            amount={data.summary.volume_today_fcfa}
            trendPct={0}
            label="Volume net aujourd'hui"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <KpiCard
              label="Entrées"
              value={formatFCFA(data.summary.credits_today_fcfa)}
            />
            <KpiCard
              label="Sorties"
              value={formatFCFA(data.summary.debits_today_fcfa)}
            />
          </div>
        </div>
      )}

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Réf., libellé, franchise…"
        totalLabel={
          meta
            ? `${meta.total.toLocaleString("fr-CI")} transactions`
            : undefined
        }
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <div className="space-y-3">
          <FilterChips
            options={TYPE_FILTERS}
            value={typeFilter}
            onChange={setTypeFilter}
          />
          <FilterChips
            options={STATUS_FILTERS}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(t) => t.id}
        isLoading={isLoading}
        exportFileName="transactions"
        emptyTitle="Aucune transaction"
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
