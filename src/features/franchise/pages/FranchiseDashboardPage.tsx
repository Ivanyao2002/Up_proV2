"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { HeroTripsTodayKpi } from "@/features/ops/components/HeroTripsTodayKpi";
import { KpiCard } from "@/shared/ui/KpiCard";
import { EntityStatusPill } from "@/shared/ui/EntityStatusPill";
import { formatFCFA, formatPercent } from "@/shared/lib/format";
import { useFranchiseDashboard } from "../api/dashboard.queries";
import { FranchisePendingWithdrawalsKpi } from "../components/FranchisePendingWithdrawalsKpi";
import { LiveRefreshIndicator } from "@/shared/ui/LiveRefreshIndicator";
import { PortalDashboardSkeleton } from "@/shared/ui/skeletons";

export function FranchiseDashboardPage() {
  const { data, isLoading, isError, isFetching, dataUpdatedAt } =
    useFranchiseDashboard();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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
          <div className="rounded-card border border-border bg-surface shadow-card overflow-hidden flex flex-col">
            <div className="px-6 pt-5 pb-3 shrink-0">
              <h2 className="text-sm font-semibold text-foreground">Flux 7 jours</h2>
            </div>
            {data.chart_flux.length > 0 ? (
              <div className="flex-1 flex flex-col min-h-0 pb-2">
                <div className="relative flex-1 min-h-[280px]">
                  {data.chart_flux.map((p, index) => {
                    const max = Math.max(...data.chart_flux.map((x) => x.revenue), 1);
                    const heightPercent = (p.revenue / max) * 100;
                    const barWidth = 100 / data.chart_flux.length;
                    const leftPos = index * barWidth;
                    const isHovered = hoveredIndex === index;

                    return (
                      <div
                        key={p.day}
                        className="absolute bottom-0 group"
                        style={{
                          left: `${leftPos}%`,
                          width: `${barWidth}%`,
                          height: '100%',
                        }}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        <div className="flex flex-col items-center justify-end h-full gap-0 px-4">
                          <div
                            className={`relative w-full rounded-t transition-all duration-200 ${
                              isHovered ? "bg-teal" : "bg-navy"
                            }`}
                            style={{
                              height: `calc(${heightPercent * 0.72}% - 28px)`,
                              minHeight: '6px',
                            }}
                          >
                            {/* Tooltip — ancré au sommet de la barre */}
                            {isHovered && (
                              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 rounded-lg bg-surface border border-border p-3 shadow-lg min-w-[140px]">
                                <div className="text-xs font-semibold text-foreground mb-1">{p.day}</div>
                                <div className="text-xs text-muted mb-1">Revenus: <span className="text-foreground font-medium">{formatFCFA(p.revenue)}</span></div>
                                <div className="text-xs text-muted">Courses: <span className="text-foreground font-medium">{p.trips}</span></div>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-3 h-3 bg-surface border-r border-b border-border rotate-45" />
                              </div>
                            )}
                          </div>
                          <span className={`text-[11px] leading-none pt-2 pb-1 shrink-0 transition-colors ${
                            isHovered ? "text-foreground font-medium" : "text-muted"
                          }`}>
                            {p.day}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="px-6 pb-6 text-sm text-muted">Données non disponibles pour la période.</p>
            )}
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
