"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { HeroTripsTodayKpi } from "@/features/ops/components/HeroTripsTodayKpi";
import { KpiCard } from "@/shared/ui/KpiCard";
import { EntityStatusPill } from "@/shared/ui/EntityStatusPill";
import { useFranchiseDashboard } from "../api/dashboard.queries";
import { FranchisePendingWithdrawalsKpi } from "../components/FranchisePendingWithdrawalsKpi";
import { LiveRefreshIndicator } from "@/shared/ui/LiveRefreshIndicator";
import { PortalDashboardSkeleton } from "@/shared/ui/skeletons";
import { WeeklyRevenueChart } from "@/shared/ui/WeeklyRevenueChart";

export function FranchiseDashboardPage() {
  const { data, isLoading, isError, isFetching, dataUpdatedAt } =
    useFranchiseDashboard();
  if (isLoading) {
    return (
      <PortalDashboardSkeleton
        title="Tableau de bord"
        breadcrumb={["Franchise"]}
      />
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger le tableau de bord.{" "}
        <Link href="/franchise" className="text-teal underline">
          Réessayer
        </Link>
      </p>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader
          title="Tableau de bord"
          breadcrumb={["Franchise", data.territory_name]}
          actions={
            <LiveRefreshIndicator
              dataUpdatedAt={dataUpdatedAt}
              isFetching={isFetching}
            />
          }
        />
        <p className="mt-1 text-sm text-muted">
          {data.partners_count} partenaires · {data.drivers_online} chauffeurs en ligne · {data.drivers_total} chauffeurs total
        </p>
      </div>

      <div className="animate-stagger space-y-5">
        <HeroTripsTodayKpi
          total={data.trips_today}
          trendPct={data.trips_today_trend_pct}
        />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard label="Partenaires" value={String(data.partners_count)} variant="navy" />
          <KpiCard
            label="Chauffeurs en ligne"
            value={`${data.drivers_online} / ${data.drivers_total}`}
            variant="teal"
          />
          <KpiCard
            label="Courses terminées"
            value={String(data.trips_completed_today)}
            hint={`sur ${data.trips_today} aujourd'hui`}
            variant="navy"
          />
          <FranchisePendingWithdrawalsKpi pending={data.pending_withdrawals} />
        </div>

        <div className="grid gap-5 lg:grid-cols-2 items-stretch">
          <WeeklyRevenueChart
            data={data.chart_flux}
            emptyMessage="Données non disponibles pour la période."
          />

          <div className="rounded-card border border-border bg-surface shadow-card overflow-hidden">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold">Partenaires actifs</h2>
            </div>
            <ul className="divide-y divide-border/50">
              {data.recent_partners.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-6 py-3">
                  <div>
                    <Link
                      href={`/franchise/partners/${p.id}`}
                      className="font-medium text-foreground hover:text-teal"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-muted">{p.drivers_count} chauffeurs</p>
                  </div>
                  <EntityStatusPill status={p.status} />
                </li>
              ))}
            </ul>
            {data.pending_kyc > 0 && (
              <div className="border-t border-border bg-amber-50/50 px-6 py-3">
                <Link
                  href="/franchise/drivers/moderation"
                  className="text-sm text-amber-800 hover:underline"
                >
                  {data.pending_kyc} dossier(s) KYC à modérer →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
