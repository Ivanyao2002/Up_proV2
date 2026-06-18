"use client";

import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { useAdminDashboard } from "../api/dashboard.queries";
import { HeroTripsTodayKpi } from "../components/HeroTripsTodayKpi";
import { DashboardUsersKpi } from "../components/DashboardUsersKpi";
import { ChartFlux } from "../components/ChartFlux";
import { RecentTripsTable } from "../components/RecentTripsTable";
import { AdminNetworkActivityPanel } from "../components/AdminNetworkActivityPanel";
import { AdminDashboardAlerts } from "../components/AdminDashboardAlerts";
import { AdminDashboardFranchiseSelect } from "../components/AdminDashboardFranchiseSelect";
import { AdminDashboardSkeleton } from "../components/AdminDashboardSkeleton";
import { LiveRefreshIndicator } from "@/shared/ui/LiveRefreshIndicator";
import type { AdminDashboardFranchiseFilter } from "../api/dashboard.types";

export function AdminDashboardPage() {
  const [franchiseId, setFranchiseId] =
    useState<AdminDashboardFranchiseFilter>(null);
  const { data, isLoading, isError, isFetching, dataUpdatedAt } =
    useAdminDashboard(franchiseId);

  const scopeLabel =
    franchiseId === null
      ? "Toutes les franchises"
      : data?.franchise_options.find((f) => f.id === franchiseId)?.name ??
        "Franchise";

  if (isLoading && !data) return <AdminDashboardSkeleton />;
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
        breadcrumb={["Admin", "Opérations", scopeLabel]}
        actions={
          <div className="flex flex-wrap items-end justify-end gap-3">
            <LiveRefreshIndicator
              dataUpdatedAt={dataUpdatedAt}
              isFetching={isFetching}
            />
            {data.franchise_options.length > 0 ? (
              <AdminDashboardFranchiseSelect
                options={data.franchise_options}
                value={franchiseId}
                onChange={setFranchiseId}
                disabled={isFetching}
              />
            ) : null}
          </div>
        }
      />

      {franchiseId !== null && (
        <p className="mb-4 text-sm text-muted">
          Chiffres filtrés pour{" "}
          <span className="font-medium text-foreground">{scopeLabel}</span>.
          Sélectionnez « Toutes les franchises » pour la vue globale.
        </p>
      )}

      <div
        className={`animate-stagger space-y-5 ${isFetching ? "opacity-70 transition-opacity" : ""}`}
      >
        <HeroTripsTodayKpi
          total={data.trips_today}
          trendPct={data.trips_today_trend_pct}
        />

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ChartFlux data={data.chart_flux} />
          </div>
          <div className="flex flex-col gap-5">
            {data.alerts && data.alerts.length > 0 && (
              <AdminDashboardAlerts alerts={data.alerts} />
            )}
            <KpiCard
              index={0}
              label="Répartition du jour"
              value={`${data.trips_in_progress_today} en cours`}
              hint={`${data.trips_completed_today} terminées · ${data.trips_cancelled_today} annulées · ${data.trips_today} au total`}
            />
            <AdminNetworkActivityPanel
              activeZone={data.active_zone}
              franchiseActivity={data.franchise_activity ?? []}
              scopedToFranchise={franchiseId !== null}
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <KpiCard
            index={0}
            label="Chauffeurs approuvés"
            value={`${data.drivers_approved.toLocaleString("fr-CI")} / ${data.drivers_total.toLocaleString("fr-CI")}`}
            hint="approuvés · total plateforme"
          />
          <KpiCard
            index={1}
            label="KYC en attente"
            value={String(data.drivers_pending_kyc)}
            trend={data.drivers_pending_kyc > 0 ? "Action requise" : undefined}
          />
          <DashboardUsersKpi
            usersRegistered={data.users_registered}
            clientsOrderedToday={data.clients_ordered_today}
          />
        </div>

        <RecentTripsTable trips={data.recent_trips} />
      </div>
    </div>
  );
}
