"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { useAdminDashboard } from "../api/dashboard.queries";
import { HeroKpi } from "../components/HeroKpi";
import { ChartFlux } from "../components/ChartFlux";
import { RecentTripsTable } from "../components/RecentTripsTable";
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-40 rounded-hero bg-navy/10" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-card bg-gradient-to-br from-navy/10 via-teal/10 to-border animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

export function AdminDashboardPage() {
  const { data, isLoading, isError } = useAdminDashboard();

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger le tableau de bord.
      </p>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Tableau de bord"
        breadcrumb={["Admin", "Opérations"]}
      />

      <div className="animate-stagger space-y-5">
        <HeroKpi
          amount={data.net_profit_today_fcfa}
          trendPct={data.net_profit_trend_pct}
        />

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ChartFlux data={data.chart_flux} />
          </div>
          <div className="space-y-5">
            <KpiCard
              index={0}
              label="Courses terminées"
              value={String(data.trips_completed_today)}
              hint={`${data.trips_cancelled_today} annulées`}
            />
            <KpiCard
              index={1}
              label="Zone active"
              value={data.active_zone.name}
              hint={`${data.active_zone.drivers_online} chauffeurs en ligne · ${data.active_zone.trips_24h} courses / 24h`}
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <KpiCard
            index={0}
            label="Chauffeurs approuvés"
            value={data.drivers_approved.toLocaleString("fr-CI")}
          />
          <KpiCard
            index={1}
            label="KYC en attente"
            value={String(data.drivers_pending_kyc)}
            trend={data.drivers_pending_kyc > 0 ? "Action requise" : undefined}
          />
          <KpiCard
            index={2}
            label="Utilisateurs inscrits"
            value={data.users_registered.toLocaleString("fr-CI")}
          />
        </div>

        <RecentTripsTable trips={data.recent_trips} />
      </div>
    </div>
  );
}
