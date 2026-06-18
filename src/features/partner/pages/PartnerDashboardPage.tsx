"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { HeroKpi } from "@/features/ops/components/HeroKpi";
import { KpiCard } from "@/shared/ui/KpiCard";
import { StatusPill } from "@/shared/ui/StatusPill";
import { formatFCFA } from "@/shared/lib/format";
import { usePartnerDashboard } from "../api/dashboard.queries";
import { LiveRefreshIndicator } from "@/shared/ui/LiveRefreshIndicator";
import { PortalDashboardSkeleton } from "@/shared/ui/skeletons";
import { WeeklyRevenueChart } from "@/shared/ui/WeeklyRevenueChart";

export function PartnerDashboardPage() {
  const { data, isLoading, isError, isFetching, dataUpdatedAt } =
    usePartnerDashboard();

  if (isLoading) {
    return (
      <PortalDashboardSkeleton
        title="Tableau de bord"
        breadcrumb={["Partenaire"]}
      />
    );
  }

  if (isError || !data) {
    return <p className="text-sm text-red-600">Impossible de charger le tableau de bord.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Tableau de bord"
        breadcrumb={["Partenaire", data.fleet_name]}
        actions={
          <LiveRefreshIndicator
            dataUpdatedAt={dataUpdatedAt}
            isFetching={isFetching}
          />
        }
      />

      <div className="animate-stagger space-y-5">
        <HeroKpi
          amount={data.revenue_today_fcfa}
          trendPct={data.revenue_trend_pct}
          label="Revenus du jour"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/partner/orders" className="block">
            <KpiCard
              label="Courses aujourd'hui"
              value={String(data.trips_today)}
              hint={`${data.trips_completed_today} terminées · ${data.trips_cancelled_today} annulées`}
              className="cursor-pointer hover:border-teal/50 transition-colors"
            />
          </Link>
          <Link href="/partner/drivers" className="block">
            <KpiCard
              label="Chauffeurs en ligne"
              value={`${data.drivers_online} / ${data.drivers_total}`}
              hint={data.drivers_pending_kyc > 0 ? `${data.drivers_pending_kyc} en attente KYC` : undefined}
              className="cursor-pointer hover:border-teal/50 transition-colors"
            />
          </Link>
          <Link href="/partner/fleet" className="block">
            <KpiCard
              label="Véhicules"
              value={String(data.vehicles_total)}
              hint="Voir la flotte"
              className="cursor-pointer hover:border-teal/50 transition-colors"
            />
          </Link>
          <Link href="/partner/wallet" className="block">
            <KpiCard
              label="Portefeuille"
              value={formatFCFA(data.wallet_balance_fcfa)}
              hint={
                data.pending_withdrawal_fcfa > 0
                  ? `${formatFCFA(data.pending_withdrawal_fcfa)} en retrait`
                  : "Gérer les fonds"
              }
              className="cursor-pointer hover:border-teal/50 transition-colors"
            />
          </Link>
        </div>

        <div className="grid items-stretch gap-5 lg:grid-cols-2">
          <WeeklyRevenueChart data={data.chart_flux ?? []} />

          <div className="rounded-card border border-border bg-surface shadow-card overflow-hidden">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold">Courses récentes</h2>
            </div>
            <ul className="divide-y divide-border/50">
              {(data.recent_trips ?? []).map((trip) => (
                <li key={trip.id} className="flex items-center justify-between gap-3 px-6 py-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/partner/orders/${trip.id}`}
                      className="font-medium text-foreground hover:text-teal transition-colors"
                    >
                      {trip.ref}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      <span className="text-foreground/80">{trip.from_label}</span>
                      <span className="mx-1">→</span>
                      <span>{trip.to_label}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <p className="text-sm font-medium tabular-nums">
                      {formatFCFA(trip.amount_fcfa)}
                    </p>
                    <div className="flex items-center gap-2">
                      <StatusPill status={trip.status} />
                      <Link
                        href={`/partner/orders/${trip.id}`}
                        className="text-xs font-medium text-teal hover:text-teal-dark hover:underline"
                      >
                        Détails
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-border bg-slate-50/50 px-6 py-3">
              <div className="flex items-center justify-between">
                <Link href="/partner/orders" className="text-sm text-amber-700 hover:text-amber-800 hover:underline">
                  Voir toutes les courses →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
