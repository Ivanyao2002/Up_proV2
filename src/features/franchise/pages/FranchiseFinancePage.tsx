"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { HeroKpi } from "@/features/ops/components/HeroKpi";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Button } from "@/shared/ui/Button";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import {
  useFranchiseDriverRechargeStats,
  useFranchiseFinance,
  useFranchisePartnerRechargeStats,
} from "../api/finance.queries";
import { FranchisePartnerRechargeModal } from "../components/FranchisePartnerRechargeModal";
import { SimplePageSkeleton } from "@/shared/ui/skeletons";
import type { FranchiseWithdrawal } from "../api/finance.service";

export function FranchiseFinancePage() {
  const [partnerRechargeOpen, setPartnerRechargeOpen] = useState(false);
  const { data, isLoading, isError } = useFranchiseFinance();
  const { data: rechargeStats } = useFranchiseDriverRechargeStats();
  const { data: partnerRechargeStats } = useFranchisePartnerRechargeStats();

  if (isLoading) {
    return <SimplePageSkeleton />;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger la finance.{" "}
        <Link href="/franchise/finance" className="text-teal underline">
          Réessayer
        </Link>
      </p>
    );
  }

  const available = data.available_fcfa ?? 0;

  const WITHDRAWAL_STATUS: Record<string, { label: string; className: string }> = {
    pending:  { label: "En attente",  className: "bg-amber-100 text-amber-700" },
    approved: { label: "Approuvé",    className: "bg-teal/10 text-teal-dark" },
    paid:     { label: "Payé",        className: "bg-teal/15 text-teal-dark" },
    rejected: { label: "Rejeté",      className: "bg-red-100 text-red-700" },
  };

  const withdrawalCols: Column<FranchiseWithdrawal>[] = [
    {
      id: "date",
      header: "Date",
      className: "whitespace-nowrap text-muted text-xs",
      cell: (w) => formatDateTime(w.created_at),
      exportValue: (w) => w.created_at,
    },
    {
      id: "amount",
      header: "Montant",
      className: "tabular-nums font-medium",
      cell: (w) => formatFCFA(w.amount_xof),
      exportValue: (w) => w.amount_xof,
    },
    {
      id: "method",
      header: "Méthode",
      cell: (w) => (
        <span className="text-xs text-muted">
          {w.payout_method ?? w.destination_type ?? "—"}
        </span>
      ),
      exportValue: (w) => w.payout_method ?? w.destination_type ?? "",
    },
    {
      id: "status",
      header: "Statut",
      cell: (w) => {
        const s = WITHDRAWAL_STATUS[w.status] ?? { label: w.status, className: "bg-gray-100 text-gray-600" };
        return (
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}>
            {s.label}
          </span>
        );
      },
      exportValue: (w) => w.status,
    },
    {
      id: "paid_at",
      header: "Payé le",
      className: "whitespace-nowrap text-muted text-xs",
      cell: (w) => (w.paid_at ? formatDateTime(w.paid_at) : "—"),
      exportValue: (w) => w.paid_at ?? "",
    },
  ];

  return (
    <div className="animate-fade-up">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader
          title="Finance locale"
          breadcrumb={["Franchise", "Finance"]}
          actions={
            <Button
              variant="primary"
              disabled={available <= 0}
              onClick={() => setPartnerRechargeOpen(true)}
            >
              Recharger un partenaire
            </Button>
          }
        />
        <p className="mt-1 text-sm text-muted">
          Solde&nbsp;: {formatFCFA(data.balance_fcfa)} · Disponible&nbsp;: {formatFCFA(available)}
          {data.payouts_pending_count > 0 && (
            <> · <span className="text-amber-600 font-medium">{data.payouts_pending_count} retrait{data.payouts_pending_count > 1 ? "s" : ""} en attente</span></>
          )}
        </p>
      </div>

      <div className="animate-stagger space-y-6">
        <HeroKpi amount={data.balance_fcfa} trendPct={0} label="Solde territoire" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard index={0} label="Disponible recharges" value={formatFCFA(available)} />
          <KpiCard
            index={1}
            label="Commissions (total)"
            value={formatFCFA(data.commission_month_fcfa)}
          />
          <KpiCard
            index={2}
            label="Retraits en attente"
            value={formatFCFA(data.payouts_pending_fcfa)}
            hint={data.payouts_pending_count > 0 ? `${data.payouts_pending_count} demande${data.payouts_pending_count > 1 ? "s" : ""}` : undefined}
          />
          {partnerRechargeStats ? (
            <KpiCard
              index={3}
              label="Recharges partenaires"
              value={formatFCFA(partnerRechargeStats.total_spent_fcfa)}
              hint={`${partnerRechargeStats.transfers_count} crédit(s)`}
            />
          ) : null}
          {rechargeStats ? (
            <KpiCard
              index={4}
              label="Recharges chauffeurs"
              value={formatFCFA(rechargeStats.total_spent_fcfa)}
              hint={`${rechargeStats.transfers_count} transfert(s)`}
            />
          ) : null}
        </div>

        {/* Retraits */}
        <div className="rounded-card border border-border bg-surface shadow-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold">Retraits</h2>
            {data.withdrawals.length > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                {data.withdrawals.filter(w => w.status === "pending").length} en attente
              </span>
            )}
          </div>
          <DataTable
            columns={withdrawalCols}
            data={data.withdrawals}
            rowKey={(w) => w.id}
            exportFileName="retraits-franchise"
            emptyTitle="Aucun retrait"
          />
        </div>

        {/* Mouvements récents */}
        <div className="rounded-card border border-border bg-surface shadow-card overflow-hidden">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold">Mouvements récents</h2>
          </div>
          {data.transactions.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted">Aucun mouvement enregistré.</p>
          ) : (
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
          )}
        </div>
      </div>

      <FranchisePartnerRechargeModal
        open={partnerRechargeOpen}
        availableFcfa={available}
        onClose={() => setPartnerRechargeOpen(false)}
      />
    </div>
  );
}
