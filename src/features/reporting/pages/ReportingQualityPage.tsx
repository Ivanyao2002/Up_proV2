"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Button } from "@/shared/ui/Button";
import { useReportingQuality } from "@/features/reporting/api/reporting.queries";

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

function fmtMin(n: number) {
  if (n < 60) return `${n.toFixed(0)} min`;
  return `${(n / 60).toFixed(1)} h`;
}

const CATEGORY_LABEL: Record<string, string> = {
  payment: "Paiement",
  behavior: "Comportement",
  service: "Service",
  logistics: "Logistique",
  app: "Application",
  other: "Autre",
};

const SEVERITY_COLOR: Record<string, string> = {
  info: "bg-blue-100 text-blue-700",
  warning: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};

export function ReportingQualityPage() {
  const { data, isLoading, isError } = useReportingQuality();

  if (isError) {
    return (
      <div className="animate-fade-up">
        <PageHeader title="Qualité & incidents" breadcrumb={["Reporting", "Qualité"]} />
        <div className="rounded-card border border-border bg-surface px-6 py-12 text-center text-sm text-red-600 shadow-card">
          Impossible de charger les données qualité.
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Qualité & incidents"
        breadcrumb={["Reporting", "Qualité"]}
        actions={
          <Link href="/reporting/exports">
            <Button variant="secondary">Exporter</Button>
          </Link>
        }
      />
      <p className="-mt-2 mb-6 text-sm text-muted">
        Incidents, réclamations, délais de traitement et taux par franchise.
      </p>

      {isLoading || !data ? (
        <div className="animate-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <KpiCard key={i} label="—" value="…" index={i} />)}
        </div>
      ) : (
        <>
          <div className="animate-stagger mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Incidents" value={fmt(data.kpis.incidents_count)} hint={`${data.kpis.critical_incidents_count} critiques`} index={0} />
            <KpiCard label="Réclamations" value={fmt(data.kpis.complaints_count)} index={1} />
            <KpiCard label="Taux de réclamation" value={`${data.kpis.complaint_rate} %`} index={2} />
            <KpiCard label="SLA respecté" value={`${data.kpis.resolved_within_sla_rate} %`} index={3} />
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <KpiCard label="Délai moyen prise en charge" value={fmtMin(data.kpis.average_first_assignment_minutes)} index={0} />
            <KpiCard label="Délai moyen de résolution" value={fmtMin(data.kpis.average_resolution_minutes)} index={1} />
          </div>

          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-card border border-border bg-surface shadow-card">
              <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-heading">
                Incidents par niveau
              </h2>
              <div className="divide-y divide-border">
                {data.incidents_by_severity.map((row) => (
                  <div key={row.severity} className="flex items-center justify-between px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${SEVERITY_COLOR[row.severity]}`}>
                      {row.severity}
                    </span>
                    <span className="tabular-nums font-semibold text-foreground">{fmt(row.count)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-card border border-border bg-surface shadow-card">
              <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-heading">
                Réclamations par catégorie
              </h2>
              <div className="divide-y divide-border">
                {data.complaints_by_category.map((row) => (
                  <div key={row.category} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-foreground">{CATEGORY_LABEL[row.category] ?? row.category}</span>
                    <span className="tabular-nums font-semibold text-foreground">{fmt(row.count)}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-heading">Classement qualité par franchise</h2>
            <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted">
                    <th className="px-4 py-3">Franchise</th>
                    <th className="px-4 py-3 text-right">Terminées</th>
                    <th className="px-4 py-3 text-right">Incidents</th>
                    <th className="px-4 py-3 text-right">Réclamations</th>
                    <th className="px-4 py-3 text-right">Taux récla.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.ranking.map((row) => (
                    <tr key={row.dimension_id} className="hover:bg-surface-hover">
                      <td className="px-4 py-3 font-medium text-foreground">{row.dimension_label}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted">{fmt(row.completed_activity)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{fmt(row.incidents)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{fmt(row.complaints)}</td>
                      <td className={`px-4 py-3 text-right tabular-nums font-semibold ${row.complaint_rate > 2.5 ? "text-red-600" : "text-foreground"}`}>
                        {row.complaint_rate.toFixed(2)} %
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
