"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { SearchInput } from "@/shared/ui/SearchInput";
import { FilterChips } from "@/shared/ui/FilterChips";
import { HeroKpi } from "@/features/ops/components/HeroKpi";
import { KpiCard } from "@/shared/ui/KpiCard";
import { TransactionStatusPill } from "@/shared/ui/TransactionStatusPill";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { TRANSACTION_TYPE_LABELS } from "@/shared/lib/financeLabels";

const TRANSACTION_STATUS_LABELS = {
  completed: "Validé",
  pending: "En attente",
  failed: "Échoué",
} as const;
import { getPaymentLabel } from "@/shared/lib/paymentLabels";
import type { Transaction, TransactionType } from "@/shared/types";
import { useTransactionsList } from "../api/transactions.queries";

const TYPE_FILTERS: { value: TransactionType | "all"; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "trip_payment", label: "Courses" },
  { value: "commission", label: "Commissions" },
  { value: "withdrawal", label: "Retraits" },
  { value: "refund", label: "Remboursements" },
];

export function TransactionsListPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TransactionType | "all">("all");
  const { data, isLoading, isError } = useTransactionsList();

  const rows = useMemo(() => {
    let list = data?.data ?? [];
    if (typeFilter !== "all") {
      list = list.filter((t) => t.type === typeFilter);
    }
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.label.toLowerCase().includes(q) ||
        t.entity_ref.toLowerCase().includes(q) ||
        t.franchise_name.toLowerCase().includes(q)
    );
  }, [data?.data, search, typeFilter]);

  const columns: Column<Transaction>[] = [
    {
      id: "id",
      header: "Réf.",
      cell: (t) => <span className="font-medium text-navy">{t.id}</span>,
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

      <div className="mb-4 space-y-4">
        <FilterChips
          options={TYPE_FILTERS}
          value={typeFilter}
          onChange={setTypeFilter}
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Réf., libellé, franchise…"
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(t) => t.id}
        isLoading={isLoading}
        exportFileName="transactions"
        emptyTitle="Aucune transaction"
        footer={
          data?.meta ? (
            <span>{data.meta.total.toLocaleString("fr-CI")} transactions</span>
          ) : undefined
        }
      />
    </div>
  );
}
