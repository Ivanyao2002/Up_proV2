"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Button } from "@/shared/ui/Button";
import { useAdminDashboard } from "@/features/ops/api/dashboard.queries";
import { FinanceDashboardSkeleton } from "@/shared/ui/skeletons";

export function ReportingActivityPage() {
  const { data, isLoading, isError } = useAdminDashboard();

  if (isLoading && !data) {
    return <FinanceDashboardSkeleton title="Activité consolidée" />;
  }

  if (isError || !data) {
    return (
      <div className="animate-fade-up">
        <PageHeader title="Activité consolidée" breadcrumb={["Reporting", "Activité"]} />
        <div className="rounded-card border border-border bg-surface px-6 py-12 text-center shadow-card">
          <p className="text-sm text-red-600">Impossible de charger les indicateurs.</p>
          <Link href="/reporting" className="mt-4 inline-flex text-sm font-medium text-teal hover:underline">
            Retour au tableau de bord
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
          <Link href="/reporting/exports">
            <Button variant="secondary">Exports</Button>
          </Link>
        }
      />
      <p className="-mt-2 mb-6 text-sm text-muted">
        Indicateurs opérationnels agrégés — VTC, livraison, fret et location.
      </p>

      <div className="animate-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Courses du jour" value={String(data.trips_today)} index={0} />
        <KpiCard
          label="Courses terminées"
          value={String(data.trips_completed_today)}
          index={1}
        />
        <KpiCard
          label="Chauffeurs approuvés"
          value={`${data.drivers_approved} / ${data.drivers_total}`}
          index={2}
        />
        <KpiCard
          label="Clients actifs"
          value={String(data.clients_ordered_today)}
          hint="Commandes du jour"
          index={3}
        />
      </div>

      {data.alerts && data.alerts.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-heading">Alertes opérationnelles</h2>
          <div className="space-y-2">
            {data.alerts.map((alert) => (
              <Link
                key={alert.code}
                href={alert.href}
                className="flex items-center justify-between rounded-card border border-border bg-surface px-4 py-3 text-sm shadow-card hover:border-teal/35"
              >
                <span>{alert.label}</span>
                <span className="font-semibold tabular-nums text-teal-dark">{alert.count}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
