"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { useReportingOverview } from "@/features/reporting/api/reporting.queries";
import { formatReportingMoney } from "@/features/reporting/utils/reportingFormatters";

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

function changeBadge(pct: number | null) {
  if (pct === null) return null;
  const sign = pct >= 0 ? "+" : "";
  const color = pct >= 0 ? "text-emerald-600" : "text-red-500";
  return <span className={`text-xs font-medium ${color}`}>{sign}{pct.toFixed(1)} %</span>;
}

const SERVICE_LABEL: Record<string, string> = {
  taxi: "VTC",
  delivery: "Livraison",
  freight: "Fret",
  rental: "Location",
};

const SEVERITY_COLOR: Record<string, string> = {
  info: "bg-blue-50 text-blue-700 border-blue-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  critical: "bg-red-50 text-red-700 border-red-200",
};

const SEVERITY_DOT: Record<string, string> = {
  info: "bg-blue-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
};

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
              hint={changeBadge(data.kpis.total_activity.change_pct) ? `vs mois préc.` : undefined}
              index={0}
            />
            <KpiCard
              label="Montant brut des prestations (GMV)"
              value={formatReportingMoney(
                data.kpis.gmv.value,
                data.kpis.gmv.currency
              )}
              hint="vs mois préc."
              index={1}
            />
            <KpiCard
              label="Chauffeurs actifs"
              value={fmt(data.kpis.active_drivers.value)}
              hint="au moins 1 mission"
              index={2}
            />
            <KpiCard
              label="Taux d'annulation"
              value={`${data.kpis.cancellation_rate.value} %`}
              hint="annulées / (terminées + annulées)"
              index={3}
            />
          </div>

          {/* Variation vs période précédente */}
          <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Demandes créées", kpi: data.kpis.total_activity },
              { label: "Montant brut (GMV)", kpi: data.kpis.gmv },
              { label: "Clients actifs", kpi: data.kpis.active_clients },
              { label: "Taux de réclamation", kpi: data.kpis.complaint_rate },
            ].map(({ label, kpi }, i) => (
              <div key={i} className="flex items-center justify-between rounded-card border border-border bg-surface px-4 py-3 shadow-card">
                <span className="text-sm text-muted">{label}</span>
                {changeBadge(kpi.change_pct)}
              </div>
            ))}
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
