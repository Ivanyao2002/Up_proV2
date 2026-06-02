"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { HeroKpi } from "@/features/ops/components/HeroKpi";
import { KpiCard } from "@/shared/ui/KpiCard";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { useFranchiseFinance } from "../api/finance.queries";

export function FranchiseFinancePage() {
  const { data, isLoading, isError } = useFranchiseFinance();

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-card bg-border" />;
  }

  if (isError || !data) {
    return <p className="text-sm text-red-600">Impossible de charger la finance.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Finance locale" breadcrumb={["Franchise", "Finance"]} />

      <div className="animate-stagger space-y-6">
        <HeroKpi amount={data.balance_fcfa} trendPct={0} label="Solde territoire" />

        <div className="grid gap-4 sm:grid-cols-2">
          <KpiCard
            label="Commissions du mois"
            value={formatFCFA(data.commission_month_fcfa)}
          />
          <KpiCard
            label="Paiements en attente"
            value={formatFCFA(data.payouts_pending_fcfa)}
          />
        </div>

        <div className="rounded-card border border-border bg-surface shadow-card overflow-hidden">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold">Mouvements récents</h2>
          </div>
          <ul className="divide-y divide-border/50">
            {data.transactions.map((tx) => (
              <li
                key={tx.id}
                className="flex items-center justify-between gap-4 px-6 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-navy">{tx.label}</p>
                  <p className="text-xs text-muted">{formatDateTime(tx.created_at)}</p>
                </div>
                <p
                  className={`font-medium tabular-nums ${
                    tx.direction === "credit" ? "text-teal-dark" : "text-red-600"
                  }`}
                >
                  {tx.direction === "credit" ? "+" : "−"}
                  {formatFCFA(tx.amount_fcfa)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
