"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Button } from "@/shared/ui/Button";
import { useReportingFinance } from "@/features/reporting/api/reporting.queries";
import { fmt, formatReportingMoney } from "@/features/reporting/utils/reportingFormatters";
import { PAYMENT_LABEL, STATUS_LABEL, STATUS_COLOR } from "@/features/reporting/lib/financeConstants";
import { ReportingPeriodFilter, defaultPeriod } from "@/features/reporting/components/ReportingPeriodFilter";
import type { ReportingPeriod } from "@/features/reporting/api/reporting.types";

export function ReportingFinancePage() {
  const [period, setPeriod] = useState<ReportingPeriod>(defaultPeriod);

  const { data, isLoading, isError } = useReportingFinance({
    date_from: period.date_from,
    date_to: period.date_to,
    timezone: period.timezone,
    comparison_date_from: period.comparison_date_from,
    comparison_date_to: period.comparison_date_to,
  });

  if (isError) {
    return (
      <div className="animate-fade-up">
        <PageHeader title="Finance analytique" breadcrumb={["Reporting", "Finance"]} />
        <div className="rounded-card border border-border bg-surface px-6 py-12 text-center text-sm text-red-600 shadow-card">
          Impossible de charger les données financières.
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Finance analytique"
        breadcrumb={["Reporting", "Finance"]}
        actions={
          <div className="flex items-center gap-2">
            <ReportingPeriodFilter value={period} onChange={setPeriod} />
            <Link href="/reporting/exports">
              <Button variant="secondary">Exporter</Button>
            </Link>
          </div>
        }
      />
      <p className="-mt-2 mb-6 text-sm text-muted">
        Montant brut des prestations (GMV), commissions et wallets — lecture
        seule. Les écritures comptables restent dans le module Comptabilité.
      </p>

      {isLoading || !data ? (
        <div className="animate-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <KpiCard key={i} label="—" value="…" index={i} />)}
        </div>
      ) : (
        <>
          <div className="animate-stagger mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Montant brut des prestations (GMV)" value={formatReportingMoney(data.kpis.gross_revenue, data.currency)} index={0} />
            <KpiCard label="Commission plateforme" value={formatReportingMoney(data.kpis.platform_commission, data.currency)} index={1} />
            <KpiCard label="Commission partenaires" value={formatReportingMoney(data.kpis.partner_commission, data.currency)} index={2} />
            <KpiCard label="Commission franchises" value={formatReportingMoney(data.kpis.franchise_commission, data.currency)} index={3} />
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <KpiCard label="Solde wallets" value={formatReportingMoney(data.kpis.wallet_balance, data.currency)} index={0} />
            <KpiCard label="Recharges" value={formatReportingMoney(data.kpis.wallet_topups, data.currency)} index={1} />
            <KpiCard label="Débits" value={formatReportingMoney(data.kpis.wallet_debits, data.currency)} index={2} />
          </div>

          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-card border border-border bg-surface shadow-card">
              <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-heading">
                Transactions par statut
              </h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-hover text-left text-xs text-muted">
                    <th className="px-4 py-2">Statut</th>
                    <th className="px-4 py-2 text-right">Transactions</th>
                    <th className="px-4 py-2 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.transactions.by_status.map((row) => (
                    <tr key={row.status} className="hover:bg-surface-hover">
                      <td className={`px-4 py-2 font-medium ${STATUS_COLOR[row.status] ?? "text-foreground"}`}>
                        {STATUS_LABEL[row.status] ?? row.status}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-muted">{fmt(row.count)}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-medium text-teal-dark">{formatReportingMoney(row.amount, data.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="rounded-card border border-border bg-surface shadow-card">
              <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-heading">
                Transactions par moyen de paiement
              </h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-hover text-left text-xs text-muted">
                    <th className="px-4 py-2">Moyen de paiement</th>
                    <th className="px-4 py-2 text-right">Transactions</th>
                    <th className="px-4 py-2 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.transactions.by_payment_method.map((row) => (
                    <tr key={row.payment_method} className="hover:bg-surface-hover">
                      <td className="px-4 py-2 text-foreground">{PAYMENT_LABEL[row.payment_method] ?? row.payment_method}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-muted">{fmt(row.count)}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-teal-dark">{formatReportingMoney(row.amount, data.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-heading">Commissions par franchise</h2>
            <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted">
                    <th className="px-4 py-3">Franchise</th>
                    <th className="px-4 py-3 text-right">
                      Montant brut (GMV)
                    </th>
                    <th className="px-4 py-3 text-right">Plateforme</th>
                    <th className="px-4 py-3 text-right">Partenaire</th>
                    <th className="px-4 py-3 text-right">Franchise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.commission_breakdown.map((row) => (
                    <tr key={row.dimension_id} className="hover:bg-surface-hover">
                      <td className="px-4 py-3 font-medium text-foreground">{row.dimension_label}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatReportingMoney(row.gross_revenue, data.currency)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-teal-dark">{formatReportingMoney(row.platform_commission, data.currency)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatReportingMoney(row.partner_commission, data.currency)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatReportingMoney(row.franchise_commission, data.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
