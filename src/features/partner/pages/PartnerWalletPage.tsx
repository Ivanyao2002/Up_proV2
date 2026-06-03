"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { HeroKpi } from "@/features/ops/components/HeroKpi";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Button } from "@/shared/ui/Button";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import {
  usePartnerDriverRechargeStats,
  usePartnerWallet,
} from "../api/wallet.queries";
import { PartnerWalletWithdrawModal } from "../components/PartnerWalletWithdrawModal";
import { PartnerDriverRechargeModal } from "../components/PartnerDriverRechargeModal";

export function PartnerWalletPage() {
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const { data, isLoading, isError } = usePartnerWallet();
  const { data: rechargeStats } = usePartnerDriverRechargeStats();

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-card bg-border" />;
  }

  if (isError || !data) {
    return <p className="text-sm text-red-600">Impossible de charger le portefeuille.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Portefeuille"
        breadcrumb={["Partenaire", "Finance"]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/partner/wallet/driver-transfers">
              <Button variant="secondary">Historique recharges</Button>
            </Link>
            <Button
              variant="primary"
              disabled={data.available_fcfa <= 0}
              onClick={() => setRechargeOpen(true)}
            >
              Recharger un chauffeur
            </Button>
            <Button
              variant="secondary"
              disabled={data.available_fcfa <= 0}
              onClick={() => setWithdrawOpen(true)}
            >
              Demander un retrait
            </Button>
          </div>
        }
      />

      <div className="animate-stagger mb-6 space-y-4">
        <HeroKpi
          amount={data.balance_fcfa}
          trendPct={0}
          label="Solde total"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            index={0}
            label="Disponible"
            value={formatFCFA(data.available_fcfa)}
          />
          <KpiCard
            index={1}
            label="En attente de retrait"
            value={formatFCFA(data.pending_withdrawal_fcfa)}
            hint={
              data.pending_withdrawal_fcfa > 0
                ? "Demande en cours de traitement"
                : undefined
            }
          />
          {rechargeStats ? (
            <>
              <KpiCard
                index={2}
                label="Recharges chauffeurs (total)"
                value={formatFCFA(rechargeStats.total_spent_fcfa)}
                hint={`${rechargeStats.transfers_count} transfert(s)`}
              />
              <KpiCard
                index={3}
                label="Recharges ce mois"
                value={formatFCFA(rechargeStats.month_spent_fcfa)}
                hint={`${rechargeStats.month_transfers_count} ce mois`}
              />
            </>
          ) : null}
        </div>
      </div>

      <div className="rounded-card border border-border bg-surface shadow-card overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold">Mouvements récents</h2>
        </div>
        <ul className="divide-y divide-border/50">
          {data.recent_movements.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-4 px-6 py-4"
            >
              <div>
                <p className="font-medium text-[#212529]">{m.label}</p>
                <p className="text-xs text-muted">{formatDateTime(m.created_at)}</p>
              </div>
              <span
                className={`tabular-nums font-medium ${
                  m.direction === "credit" ? "text-teal-dark" : "text-red-600"
                }`}
              >
                {m.direction === "debit" ? "−" : "+"}
                {formatFCFA(m.amount_fcfa)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <PartnerDriverRechargeModal
        open={rechargeOpen}
        availableFcfa={data.available_fcfa}
        onClose={() => setRechargeOpen(false)}
      />

      <PartnerWalletWithdrawModal
        open={withdrawOpen}
        availableFcfa={data.available_fcfa}
        onClose={() => setWithdrawOpen(false)}
      />
    </div>
  );
}
