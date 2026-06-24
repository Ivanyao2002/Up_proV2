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
          // Pas de tendance trompeuse (« -100% ») tant qu'aucun revenu n'est encore enregistré aujourd'hui.
          trendPct={data.revenue_today_fcfa > 0 ? data.revenue_trend_pct : undefined}
          label="Revenus du jour"
        />

        {data.cash_reconciliations_count != null && data.cash_reconciliations_count > 0 && (
          <Link
            href="/partner/wallet"
            className="flex items-center justify-between gap-3 rounded-card border border-amber-200 bg-amber-50 px-5 py-3.5 shadow-card transition-colors hover:border-amber-300"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  {data.cash_reconciliations_count} rapprochement{data.cash_reconciliations_count > 1 ? "s" : ""} cash à traiter
                </p>
                <p className="text-xs text-amber-700">
                  Des encaissements espèces de vos chauffeurs sont en attente de validation.
                </p>
              </div>
            </div>
            <span className="shrink-0 text-sm font-medium text-amber-800">Traiter →</span>
          </Link>
        )}

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
              hint={
                [
                  data.drivers_with_vehicle != null
                    ? `${data.drivers_with_vehicle} équipé${data.drivers_with_vehicle > 1 ? "s" : ""}`
                    : null,
                  data.drivers_pending_kyc > 0 ? `${data.drivers_pending_kyc} en attente KYC` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || undefined
              }
              className="cursor-pointer hover:border-teal/50 transition-colors"
            />
          </Link>
          <Link href="/partner/fleet" className="block">
            <KpiCard
              label="Véhicules"
              value={String(data.vehicles_total)}
              hint={
                data.vehicles_pending && data.vehicles_pending > 0
                  ? `${data.vehicles_pending} en attente de validation`
                  : data.vehicles_assigned != null
                    ? `${data.vehicles_assigned} affecté${data.vehicles_assigned > 1 ? "s" : ""} à un chauffeur`
                    : "Voir la flotte"
              }
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

          <div className="rounded-card border border-border bg-surface shadow-card overflow-hidden flex flex-col">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold">Courses récentes</h2>
            </div>
            <ul className="divide-y divide-border/50 flex-1">
              {(data.recent_trips ?? []).length === 0 ? (
                <li className="flex flex-col items-center justify-center px-6 py-8 h-full">
                  <p className="text-sm font-medium text-foreground">Aucune course récente</p>
                  <p className="mt-1 text-xs text-muted">Les dernières courses de votre flotte apparaîtront ici.</p>
                </li>
              ) : (
                (data.recent_trips ?? []).map((trip) => (
                  <li key={trip.id} className="flex items-center justify-between gap-3 px-6 py-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/partner/orders/${trip.id}`}
                        className="font-medium text-foreground hover:text-teal transition-colors"
                      >
                        {trip.ref}
                      </Link>
                      <div className="mt-1 space-y-0.5">
                        <p className="truncate text-xs" title={trip.from_label}>
                          <span className="text-muted">Départ · </span>
                          <span className="text-foreground/90">{trip.from_label}</span>
                        </p>
                        <p className="truncate text-xs" title={trip.to_label}>
                          <span className="text-muted">Arrivée · </span>
                          <span className="text-foreground/90">{trip.to_label}</span>
                        </p>
                      </div>
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
                ))
              )}
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
