"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { useReportingOverview } from "@/features/reporting/api/reporting.queries";
import { fmt, formatTrend, formatReportingMoney } from "@/features/reporting/utils/reportingFormatters";
import { SERVICE_LABEL, SEVERITY_COLOR, SEVERITY_DOT } from "@/features/reporting/lib/dashboardConstants";

export function ReportingDashboardPage() {
  const { data, isLoading } = useReportingOverview();

  return (
    <div className="animate-fade-up">
      <PageHeader title="Tableau de bord reporting" breadcrumb={["Reporting"]} />
      <p className="-mt-2 mb-6 text-sm text-muted">
        Synthèses multi-services, indicateurs de performance et alertes qualité.
      </p>

      {isLoading || !data ? (
        <div className="animate-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <KpiCard key={i} label="—" value="…" index={i} />)}
        </div>
      ) : (
        <>
          {/* KPIs principaux */}
          <div className="animate-stagger mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Demandes créées"
              value={fmt(data.kpis.total_activity.value)}
              trend={formatTrend(data.kpis.total_activity.change_pct)}
              trendTone={
                (data.kpis.total_activity.change_pct ?? 0) >= 0
                  ? "positive"
                  : "negative"
              }
              hint="vs mois précédent"
              index={0}
            />
            <KpiCard
              label="Montant brut des prestations (GMV)"
              value={formatReportingMoney(
                data.kpis.gmv.value,
                data.kpis.gmv.currency
              )}
              trend={formatTrend(data.kpis.gmv.change_pct)}
              trendTone="neutral"
              hint="vs mois précédent"
              index={1}
            />
            <KpiCard
              label="Clients actifs"
              value={fmt(data.kpis.active_clients.value)}
              trend={formatTrend(data.kpis.active_clients.change_pct)}
              trendTone={
                (data.kpis.active_clients.change_pct ?? 0) >= 0
                  ? "positive"
                  : "negative"
              }
              hint="vs mois précédent"
              index={2}
            />
            <KpiCard
              label="Taux de réclamation"
              value={`${data.kpis.complaint_rate.value} %`}
              trend={formatTrend(data.kpis.complaint_rate.change_pct)}
              trendTone={
                (data.kpis.complaint_rate.change_pct ?? 0) <= 0
                  ? "positive"
                  : "negative"
              }
              hint="vs mois précédent"
              index={3}
            />
          </div>

          {/* Répartition par service */}
          {data.service_breakdown.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-sm font-semibold text-heading">Répartition par service</h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {data.service_breakdown.map((s, i) => (
                  <KpiCard
                    key={s.service}
                    label={SERVICE_LABEL[s.service] ?? s.service}
                    value={fmt(s.completed) + " terminées"}
                    hint={formatReportingMoney(s.gmv, s.currency)}
                    index={i}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Alertes */}
          {data.alerts.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-sm font-semibold text-heading">
                Alertes qualité
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  {data.alerts.length}
                </span>
              </h2>
              <div className="space-y-2">
                {data.alerts.map((alert) => (
                  <div
                    key={alert.code}
                    className={`flex items-center justify-between rounded-card border px-4 py-3 ${SEVERITY_COLOR[alert.severity]}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[alert.severity]}`} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{alert.label}</p>
                        <p className="text-xs opacity-75">{alert.dimension.label}</p>
                      </div>
                    </div>
                    <span className="ml-4 shrink-0 text-sm font-bold">
                      {alert.value} % <span className="text-xs font-normal opacity-60">/ seuil {alert.threshold} %</span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
