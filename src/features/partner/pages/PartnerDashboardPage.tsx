"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { HeroKpi } from "@/features/ops/components/HeroKpi";
import { KpiCard } from "@/shared/ui/KpiCard";
import { StatusPill } from "@/shared/ui/StatusPill";
import { formatFCFA } from "@/shared/lib/format";
import { usePartnerDashboard } from "../api/dashboard.queries";

export function PartnerDashboardPage() {
  const { data, isLoading, isError } = usePartnerDashboard();

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-card bg-border" />;
  }

  if (isError || !data) {
    return <p className="text-sm text-red-600">Impossible de charger le tableau de bord.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Tableau de bord"
        breadcrumb={["Partenaire", data.fleet_name]}
      />

      <div className="animate-stagger space-y-5">
        <HeroKpi
          amount={data.revenue_today_fcfa}
          trendPct={data.revenue_trend_pct}
          label="Revenus du jour"
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            label="Courses aujourd'hui"
            value={String(data.trips_today)}
            hint={`${data.trips_completed_today} terminées · ${data.trips_cancelled_today} annulées`}
          />
          <KpiCard
            label="Chauffeurs en ligne"
            value={`${data.drivers_online} / ${data.drivers_total}`}
          />
          <KpiCard
            label="Portefeuille"
            value={formatFCFA(data.wallet_balance_fcfa)}
            hint={
              data.pending_withdrawal_fcfa > 0
                ? `${formatFCFA(data.pending_withdrawal_fcfa)} en retrait`
                : undefined
            }
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-card border border-border bg-surface p-6 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">Flux 7 jours</h2>
            <div className="mt-4 flex h-36 items-end justify-between gap-1">
              {data.chart_flux.map((p) => {
                const max = Math.max(...data.chart_flux.map((x) => x.revenue), 1);
                return (
                  <div key={p.day} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full max-w-[20px] rounded-t bg-teal"
                      style={{ height: `${(p.revenue / max) * 100}%`, minHeight: 4 }}
                    />
                    <span className="text-[10px] text-muted">{p.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface shadow-card overflow-hidden">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold">Courses récentes</h2>
            </div>
            <ul className="divide-y divide-border/50">
              {data.recent_trips.map((trip) => (
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
            {data.drivers_pending_kyc > 0 && (
              <div className="border-t border-border bg-amber-50/50 px-6 py-3">
                <Link href="/partner/drivers/pending" className="text-sm text-amber-800 hover:underline">
                  {data.drivers_pending_kyc} chauffeur(s) en attente de validation KYC →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
