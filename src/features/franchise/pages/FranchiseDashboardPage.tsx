"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { HeroKpi } from "@/features/ops/components/HeroKpi";
import { KpiCard } from "@/shared/ui/KpiCard";
import { EntityStatusPill } from "@/shared/ui/EntityStatusPill";
import { formatFCFA } from "@/shared/lib/format";
import { useFranchiseDashboard } from "../api/dashboard.queries";

export function FranchiseDashboardPage() {
  const { data, isLoading, isError } = useFranchiseDashboard();

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
        breadcrumb={["Franchise", data.territory_name]}
      />

      <div className="animate-stagger space-y-5">
        <HeroKpi
          amount={data.revenue_today_fcfa}
          trendPct={data.revenue_trend_pct}
          label="Revenus du jour · territoire"
        />

        <div className="grid gap-4 sm:grid-cols-4">
          <KpiCard label="Partenaires" value={String(data.partners_count)} />
          <KpiCard
            label="Chauffeurs en ligne"
            value={`${data.drivers_online} / ${data.drivers_total}`}
          />
          <KpiCard
            label="Courses aujourd'hui"
            value={String(data.trips_today)}
            hint={`${data.trips_completed_today} terminées`}
          />
          <KpiCard
            label="Retraits en attente"
            value={formatFCFA(data.pending_withdrawals_fcfa)}
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-card border border-border bg-surface p-6 shadow-card">
            <h2 className="text-sm font-semibold text-[#212529]">Flux 7 jours</h2>
            <div className="mt-4 flex h-36 items-end justify-between gap-1">
              {data.chart_flux.map((p) => {
                const max = Math.max(...data.chart_flux.map((x) => x.revenue), 1);
                return (
                  <div key={p.day} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full max-w-[20px] rounded-t bg-navy"
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
              <h2 className="text-sm font-semibold">Partenaires actifs</h2>
            </div>
            <ul className="divide-y divide-border/50">
              {data.recent_partners.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-6 py-3">
                  <div>
                    <Link
                      href={`/franchise/partners/${p.id}`}
                      className="font-medium text-navy hover:text-teal"
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
