"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { KpiCard } from "@/shared/ui/KpiCard";
import { useReportingGovernance } from "@/features/reporting/api/reporting.queries";
import { fmt, fmtPct } from "@/features/reporting/utils/reportingFormatters";
import { ENTITY_LABEL, CATEGORY_LABEL } from "@/features/reporting/lib/governanceConstants";
import { ReportingPeriodFilter, defaultPeriod } from "@/features/reporting/components/ReportingPeriodFilter";
import type { ReportingPeriod } from "@/features/reporting/api/reporting.types";

export function ReportingGovernancePage() {
  const [period, setPeriod] = useState<ReportingPeriod>(defaultPeriod);

  const { data, isLoading, isError } = useReportingGovernance({
    date_from: period.date_from,
    date_to: period.date_to,
    timezone: period.timezone,
    comparison_date_from: period.comparison_date_from,
    comparison_date_to: period.comparison_date_to,
  });

  if (isError) {
    return (
      <div className="animate-fade-up">
        <PageHeader title="Audit & conformité" breadcrumb={["Reporting", "Gouvernance"]} />
        <div className="rounded-card border border-border bg-surface px-6 py-12 text-center text-sm text-red-600 shadow-card">
          Impossible de charger les données de gouvernance.
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Audit & conformité"
        breadcrumb={["Reporting", "Gouvernance"]}
        actions={
          <div className="flex items-center gap-2">
            <ReportingPeriodFilter value={period} onChange={setPeriod} />
            <Link href="/reporting/exports?report=audit_summary">
              <Button variant="secondary">Exporter le rapport</Button>
            </Link>
          </div>
        }
      />
      <p className="-mt-2 mb-6 text-sm text-muted">
        Activité d'audit, opérations sensibles et conformité des entités — agrégats uniquement.
      </p>

      {isLoading || !data ? (
        <div className="animate-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <KpiCard key={i} label="—" value="…" index={i} />)}
        </div>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold text-heading">Activité d'audit</h2>
            <div className="animate-stagger grid gap-4 sm:grid-cols-3">
              <KpiCard label="Événements total" value={fmt(data.audit.events_count)} index={0} />
              <KpiCard label="Opérations sensibles" value={fmt(data.audit.sensitive_events_count)} index={1} />
              <KpiCard label="Actions échouées" value={fmt(data.audit.failed_actions_count)} index={2} />
            </div>

            <div className="mt-4 rounded-card border border-border bg-surface shadow-card">
              <h3 className="border-b border-border px-4 py-3 text-sm font-semibold text-heading">
                Événements par catégorie
              </h3>
              <div className="divide-y divide-border">
                {data.audit.events_by_category.map((row) => {
                  const pct = Math.round((row.count / data.audit.events_count) * 100);
                  return (
                    <div key={row.category} className="flex items-center gap-4 px-4 py-3">
                      <span className="w-32 text-sm text-foreground">{CATEGORY_LABEL[row.category] ?? row.category}</span>
                      <div className="flex-1 overflow-hidden rounded-full bg-surface-hover" style={{ height: 6 }}>
                        <div className="h-full rounded-full bg-teal" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-12 text-right tabular-nums text-sm text-muted">{fmt(row.count)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-heading">Conformité</h2>
            <div className="mb-4 grid gap-4 sm:grid-cols-4">
              <KpiCard label="Taux global" value={fmtPct(data.compliance.global_rate)} index={0} />
              <KpiCard label="Entités contrôlées" value={fmt(data.compliance.entities_checked)} index={1} />
              <KpiCard label="Documents expirés" value={fmt(data.compliance.documents_expired)} index={2} />
              <KpiCard label="Expiration proche" value={fmt(data.compliance.documents_expiring_soon)} index={3} />
            </div>

            <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted">
                    <th className="px-4 py-3">Type d'entité</th>
                    <th className="px-4 py-3 text-right">Contrôlées</th>
                    <th className="px-4 py-3 text-right">Conformes</th>
                    <th className="px-4 py-3 text-right">Taux</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.compliance.by_entity_type.map((row) => (
                    <tr key={row.entity_type} className="hover:bg-surface-hover">
                      <td className="px-4 py-3 font-medium text-foreground">
                        {ENTITY_LABEL[row.entity_type] ?? row.entity_type}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted">{fmt(row.checked)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{fmt(row.compliant)}</td>
                      <td className={`px-4 py-3 text-right tabular-nums font-semibold ${row.compliance_rate < 90 ? "text-red-600" : "text-teal-dark"}`}>
                        {fmtPct(row.compliance_rate)}
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
