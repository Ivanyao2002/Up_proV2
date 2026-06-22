"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Button } from "@/shared/ui/Button";
import { useReportingActivity } from "@/features/reporting/api/reporting.queries";
import { fmt, fmtPct, formatReportingMoney } from "@/features/reporting/utils/reportingFormatters";
import { DIMENSION_LABEL, DIMENSION_COL } from "@/features/reporting/lib/activityConstants";
import { ReportingPeriodFilter, defaultPeriod } from "@/features/reporting/components/ReportingPeriodFilter";
import type { ReportingPeriod } from "@/features/reporting/api/reporting.types";

export function ReportingActivityPage() {
  const [period, setPeriod] = useState<ReportingPeriod>(defaultPeriod);

  const { data, isLoading, isError } = useReportingActivity({
    group_by: "day",
    date_from: period.date_from,
    date_to: period.date_to,
    timezone: period.timezone,
    comparison_date_from: period.comparison_date_from,
    comparison_date_to: period.comparison_date_to,
  });

  if (isError) {
    return (
      <div className="animate-fade-up">
        <PageHeader title="Activité consolidée" breadcrumb={["Reporting", "Activité"]} />
        <div className="rounded-card border border-border bg-surface px-6 py-12 text-center shadow-card">
          <p className="text-sm text-red-600">Impossible de charger les indicateurs.</p>
          <Link href="/reporting" className="mt-4 inline-flex text-sm font-medium text-teal hover:underline">
            ← Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Activité consolidée"
        breadcrumb={["Reporting", "Activité"]}
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
        Indicateurs opérationnels agrégés — VTC, livraison, fret et location.
      </p>

      {isLoading || !data ? (
        <div className="animate-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <KpiCard key={i} label="—" value="…" index={i} />)}
        </div>
      ) : (
        <>
          {/* KPIs volumes */}
          <div className="animate-stagger mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Demandes créées" value={fmt(data.summary.created)} index={0} />
            <KpiCard label="Demandes terminées" value={fmt(data.summary.completed)} index={1} />
            <KpiCard label="Demandes annulées" value={fmt(data.summary.cancelled)} index={2} />
            <KpiCard label="En cours" value={fmt(data.summary.in_progress)} index={3} />
          </div>

          {/* KPIs taux */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-card border border-border bg-surface px-4 py-4 shadow-card">
              <p className="text-xs text-muted">Taux d'acceptation</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{fmtPct(data.summary.acceptance_rate)}</p>
              <p className="mt-1 text-xs text-muted">offres acceptées / envoyées</p>
            </div>
            <div className="rounded-card border border-border bg-surface px-4 py-4 shadow-card">
              <p className="text-xs text-muted">Taux d'annulation</p>
              <p className={`mt-1 text-2xl font-bold ${data.summary.cancellation_rate > 10 ? "text-red-600" : "text-foreground"}`}>
                {fmtPct(data.summary.cancellation_rate)}
              </p>
              <p className="mt-1 text-xs text-muted">annulées / (terminées + annulées)</p>
            </div>
            <div className="rounded-card border border-border bg-surface px-4 py-4 shadow-card">
              <p className="text-xs text-muted">Taux de finalisation</p>
              <p className="mt-1 text-2xl font-bold text-teal-dark">{fmtPct(data.summary.completion_rate)}</p>
              <p className="mt-1 text-xs text-muted">terminées / demandes acceptées</p>
            </div>
          </div>

          {/* Classement */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-heading">
                Classement par {DIMENSION_LABEL[data.ranking.dimension] ?? data.ranking.dimension}
              </h2>
              <span className="text-xs text-muted">{data.ranking.meta.total} entrées</span>
            </div>
            <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-hover text-left text-xs text-muted">
                    <th className="px-4 py-3">{DIMENSION_COL[data.ranking.dimension] ?? "Entité"}</th>
                    <th className="px-4 py-3 text-right">Demandes</th>
                    <th className="px-4 py-3 text-right">Terminées</th>
                    <th className="px-4 py-3 text-right">
                      Montant brut (GMV)
                    </th>
                    <th className="px-4 py-3 text-right">% Annulation</th>
                    <th className="px-4 py-3 text-right">% Finalisation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.ranking.data.map((row) => (
                    <tr key={row.id} className="hover:bg-surface-hover">
                      <td className="px-4 py-3 font-medium text-foreground">{row.label}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted">{fmt(row.activity)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{fmt(row.completed)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-teal-dark">
                        {formatReportingMoney(row.gmv, row.currency)}
                      </td>
                      <td className={`px-4 py-3 text-right tabular-nums font-medium ${row.cancellation_rate > 10 ? "text-red-600" : "text-foreground"}`}>
                        {fmtPct(row.cancellation_rate)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-foreground">
                        {fmtPct(row.completion_rate)}
                      </td>
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
