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

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-card border border-border bg-surface p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Flux 7 jours</h2>
              {(data.chart_flux ?? []).some(d => d.revenue > 0) && (
                <span className="text-xs text-muted">
                  Max: {formatFCFA(Math.max(...(data.chart_flux ?? []).map(x => x.revenue)))}
                </span>
              )}
            </div>
            <div className="mt-4 flex h-36 justify-between gap-1">
              {(data.chart_flux ?? []).length === 0 ? (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted">
                  Aucune donnée disponible
                </div>
              ) : (
                (data.chart_flux ?? []).map((p) => {
                  const max = Math.max(...(data.chart_flux ?? []).map((x) => x.revenue), 1);
                  const hasRevenue = p.revenue > 0;
                  return (
                    <div key={p.day} className="flex flex-1 flex-col items-center justify-end gap-1 h-full">
                      <div
                        className={`w-full max-w-[20px] rounded-t transition-all ${hasRevenue ? 'bg-teal' : 'bg-slate-200 dark:bg-slate-700'}`}
                        style={{
                          height: hasRevenue ? `${Math.max((p.revenue / max) * 100, 8)}%` : '4px',
                        }}
                        title={`${p.day}: ${formatFCFA(p.revenue)}`}
                      />
                      <span className="text-[10px] text-muted leading-none">{p.day}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface shadow-card overflow-hidden">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold">Courses récentes</h2>
            </div>
            <ul className="divide-y divide-border/50">
              {(data.recent_trips ?? []).map((trip) => (
                <li key={trip.id} className="flex items-center justify-between gap-3 px-6 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{trip.ref}</p>
                    <p className="truncate text-xs text-muted">
                      {trip.from_label} → {trip.to_label}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium tabular-nums">
                      {formatFCFA(trip.amount_fcfa)}
                    </p>
                    <StatusPill status={trip.status} />
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
