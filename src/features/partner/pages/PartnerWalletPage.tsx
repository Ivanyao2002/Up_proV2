"use client";

import { SimplePageSkeleton } from "@/shared/ui/skeletons";
import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { HeroKpi } from "@/features/ops/components/HeroKpi";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Button } from "@/shared/ui/Button";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import {
  usePartnerDriverRechargeStats,
  usePartnerWallet,
  usePartnerCashReconciliations,
  usePartnerLedger,
} from "../api/wallet.queries";
import type { CashReconciliation, LedgerEntry } from "../api/wallet.service";
import { PartnerWalletWithdrawModal } from "../components/PartnerWalletWithdrawModal";
import { PartnerWalletTopUpModal } from "../components/PartnerWalletTopUpModal";
import { PartnerDriverRechargeModal } from "../components/PartnerDriverRechargeModal";

const cashStatusConfig: Record<CashReconciliation["status"], { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  submitted: { label: "Soumis", color: "bg-blue-100 text-blue-700" },
  validated: { label: "Validé", color: "bg-green-100 text-green-700" },
  rejected: { label: "Rejeté", color: "bg-red-100 text-red-700" },
};

const cashColumns: Column<CashReconciliation>[] = [
  {
    id: "driver",
    header: "Chauffeur",
    cell: (r) => (
      <span className="font-medium">
        {r.driver_name ?? (r.driver_id ? `Chauffeur ${r.driver_id.slice(-6).toUpperCase()}` : "—")}
      </span>
    ),
  },
  {
    id: "amount",
    header: "Montant",
    className: "tabular-nums",
    cell: (r) => formatFCFA(r.amount_fcfa),
  },
  {
    id: "status",
    header: "Statut",
    cell: (r) => {
      const cfg = cashStatusConfig[r.status];
      return (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${cfg.color}`}>
          {cfg.label}
        </span>
      );
    },
  },
  {
    id: "collected_at",
    header: "Collecté le",
    cell: (r) => formatDateTime(r.collected_at),
  },
  {
    id: "note",
    header: "Note",
    cell: (r) => <span className="text-sm text-muted">{r.note ?? "—"}</span>,
  },
];

export function PartnerWalletPage() {
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const { data, isLoading, isError } = usePartnerWallet();
  const { data: rechargeStats } = usePartnerDriverRechargeStats();
  const { data: cashData, isLoading: cashLoading } = usePartnerCashReconciliations();
  const { data: ledgerData } = usePartnerLedger({ per_page: 10 });
  const cashRows = cashData?.data ?? [];
  const recentMovements =
    data?.recent_movements?.length
      ? data.recent_movements
      : (ledgerData?.data ?? []).slice(0, 10).map((entry: LedgerEntry) => ({
          id: entry.id,
          label: entry.label,
          amount_fcfa: entry.amount_fcfa,
          direction: entry.direction,
          created_at: entry.created_at,
        }));

  if (isLoading) {
    return <SimplePageSkeleton />;
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
            <Button variant="primary" onClick={() => setTopUpOpen(true)}>
              Alimenter mon compte
            </Button>
            <Button
              variant="primary"
              disabled={(data.withdrawable_fcfa ?? data.available_fcfa) <= 0}
              onClick={() => setRechargeOpen(true)}
            >
              Recharger un chauffeur
            </Button>
            <Button
              variant="secondary"
              disabled={(data.withdrawable_fcfa ?? data.available_fcfa) <= 0 || (data.daily_cap_fcfa != null && (data.today_withdrawn_fcfa ?? 0) >= data.daily_cap_fcfa)}
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            index={0}
            label="Solde retirable"
            value={formatFCFA(data.withdrawable_fcfa ?? data.available_fcfa)}
            hint="Peut être retiré ou utilisé pour recharger"
          />
          <KpiCard
            index={1}
            label="Solde de service"
            value={formatFCFA(data.non_withdrawable_fcfa ?? 0)}
            hint="Crédits plateforme — non retirables"
          />
          <KpiCard
            index={2}
            label="En attente de retrait"
            value={formatFCFA(data.pending_withdrawal_fcfa)}
            hint={
              data.pending_withdrawal_fcfa > 0
                ? "Demande en cours de traitement"
                : undefined
            }
          />
          <KpiCard
            index={3}
            label="Plafond retrait / jour"
            value={formatFCFA(data.daily_cap_fcfa ?? 30_000)}
            hint={`Retiré aujourd'hui : ${formatFCFA(data.today_withdrawn_fcfa ?? 0)}`}
          />
          {rechargeStats ? (
            <>
              <KpiCard
                index={4}
                label="Recharges chauffeurs (total)"
                value={formatFCFA(rechargeStats.total_spent_fcfa ?? 0)}
                hint={`${rechargeStats.transfers_count ?? 0} transfert(s)`}
              />
              <KpiCard
                index={5}
                label="Recharges ce mois"
                value={formatFCFA(rechargeStats.month_spent_fcfa ?? 0)}
                hint={`${rechargeStats.month_transfers_count ?? 0} ce mois`}
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
          {(recentMovements ?? []).map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-4 px-6 py-4"
            >
              <div>
                <p className="font-medium text-foreground">{m.label}</p>
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

      <div className="mt-6 rounded-card border border-border bg-surface shadow-card overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold">Rapprochement des encaissements cash</h2>
          <p className="mt-0.5 text-xs text-muted">Espèces collectées par les chauffeurs à reverser</p>
        </div>
        <div className="px-2 pb-2">
          <DataTable
            columns={cashColumns}
            data={cashRows}
            rowKey={(r) => r.id}
            isLoading={cashLoading}
            emptyTitle="Aucun encaissement en attente"
            emptyDescription="Les collectes cash de vos chauffeurs apparaîtront ici"
            pagination={{ pageSize: 10 }}
          />
        </div>
      </div>

      <PartnerDriverRechargeModal
        open={rechargeOpen}
        availableFcfa={data.withdrawable_fcfa ?? data.available_fcfa}
        onClose={() => setRechargeOpen(false)}
      />

      <PartnerWalletTopUpModal
        open={topUpOpen}
        onClose={() => setTopUpOpen(false)}
      />

      <PartnerWalletWithdrawModal
        open={withdrawOpen}
        availableFcfa={data.withdrawable_fcfa ?? data.available_fcfa}
        dailyCapFcfa={data.daily_cap_fcfa}
        todayWithdrawnFcfa={data.today_withdrawn_fcfa}
        onClose={() => setWithdrawOpen(false)}
      />
    </div>
  );
}
