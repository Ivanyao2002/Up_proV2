"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { HeroKpi } from "@/features/ops/components/HeroKpi";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Button } from "@/shared/ui/Button";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import {
  useFranchiseDriverRechargeStats,
  useFranchiseFinance,
} from "../api/finance.queries";
import { FranchiseDriverRechargeModal } from "../components/FranchiseDriverRechargeModal";

export function FranchiseFinancePage() {
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const { data, isLoading, isError } = useFranchiseFinance();
  const { data: rechargeStats } = useFranchiseDriverRechargeStats();

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-card bg-border" />;
  }

  if (isError || !data) {
    return <p className="text-sm text-red-600">Impossible de charger la finance.</p>;
  }

  const available = data.available_fcfa ?? 0;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Finance locale"
        breadcrumb={["Franchise", "Finance"]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/franchise/finance/driver-transfers">
              <Button variant="secondary">Historique recharges</Button>
            </Link>
            <Button
              variant="primary"
              disabled={available <= 0}
              onClick={() => setRechargeOpen(true)}
            >
              Recharger un chauffeur
            </Button>
          </div>
        }
      />

      <div className="animate-stagger space-y-6">
        <HeroKpi amount={data.balance_fcfa} trendPct={0} label="Solde territoire" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard index={0} label="Disponible recharges" value={formatFCFA(available)} />
          <KpiCard
            index={1}
            label="Commissions du mois"
            value={formatFCFA(data.commission_month_fcfa)}
          />
          <KpiCard
            index={2}
            label="Paiements en attente"
            value={formatFCFA(data.payouts_pending_fcfa)}
          />
          {rechargeStats ? (
            <KpiCard
              index={3}
              label="Recharges chauffeurs (total)"
              value={formatFCFA(rechargeStats.total_spent_fcfa)}
              hint={`${rechargeStats.transfers_count} transfert(s)`}
            />
          ) : null}
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
                  <p className="font-medium text-foreground">{tx.label}</p>
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

      <FranchiseDriverRechargeModal
        open={rechargeOpen}
        availableFcfa={available}
        onClose={() => setRechargeOpen(false)}
      />
    </div>
  );
}
