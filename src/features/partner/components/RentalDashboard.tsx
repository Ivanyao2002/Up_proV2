"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { HeroKpi } from "@/features/ops/components/HeroKpi";
import { KpiCard } from "@/shared/ui/KpiCard";
import { formatFCFA, formatDate } from "@/shared/lib/format";
import { PortalDashboardSkeleton } from "@/shared/ui/skeletons";
import { usePartnerRentalStats, usePartnerRentalOffers } from "../api/rental.queries";
import { usePartnerRentalVehicles } from "../api/rentalFleet.queries";
import { RENTAL_STATUS_CONFIG } from "../lib/rentalStatus";

/** Tableau de bord pour les partenaires LOCATION (≠ dashboard VTC). */
export function RentalDashboard() {
  const { data: stats, isLoading: statsLoading } = usePartnerRentalStats();
  const { data: fleet } = usePartnerRentalVehicles({ per_page: 200 });
  const { data: recent, isLoading: recentLoading } = usePartnerRentalOffers({
    per_page: 5,
    sort: "created_at",
    order: "desc",
  });

  const fleetStats = useMemo(() => {
    const items = fleet?.data ?? [];
    return {
      total: items.length,
      available: items.filter((v) => v.status === "disponible").length,
    };
  }, [fleet?.data]);

  const counters = stats?.counters;
  const recentOffers = recent?.data ?? [];

  if (statsLoading) {
    return <PortalDashboardSkeleton title="Tableau de bord" breadcrumb={["Partenaire", "Location"]} />;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Tableau de bord" breadcrumb={["Partenaire", "Location"]} />

      <div className="animate-stagger space-y-5">
        <HeroKpi amount={stats?.revenue_fcfa ?? 0} label="Revenus location" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/partner/rental" className="block">
            <KpiCard
              label="À confirmer"
              value={String(counters?.awaiting_confirmation ?? 0)}
              hint="Demandes en attente"
              className="cursor-pointer transition-colors hover:border-teal/50"
            />
          </Link>
          <Link href="/partner/rental" className="block">
            <KpiCard
              label="En cours"
              value={String(counters?.active ?? 0)}
              hint="Locations actives"
              className="cursor-pointer transition-colors hover:border-teal/50"
            />
          </Link>
          <Link href="/partner/rental/fleet" className="block">
            <KpiCard
              label="Flotte location"
              value={String(fleetStats.total)}
              hint={`${fleetStats.available} disponible${fleetStats.available > 1 ? "s" : ""}`}
              className="cursor-pointer transition-colors hover:border-teal/50"
            />
          </Link>
          <Link href="/partner/rental/finance" className="block">
            <KpiCard
              label="Cautions bloquées"
              value={formatFCFA(stats?.deposits_held_fcfa ?? 0)}
              hint="Gérer la finance"
              className="cursor-pointer transition-colors hover:border-teal/50"
            />
          </Link>
        </div>

        <div className="rounded-card border border-border bg-surface shadow-card overflow-hidden">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold">Réservations récentes</h2>
          </div>
          <ul className="divide-y divide-border/50">
            {recentLoading ? (
              <li className="px-6 py-8 text-center text-sm text-muted">Chargement…</li>
            ) : recentOffers.length === 0 ? (
              <li className="flex flex-col items-center justify-center px-6 py-8">
                <p className="text-sm font-medium text-foreground">Aucune réservation récente</p>
                <p className="mt-1 text-xs text-muted">
                  Les demandes de location apparaîtront ici.
                </p>
              </li>
            ) : (
              recentOffers.map((o) => {
                const cfg = RENTAL_STATUS_CONFIG[o.status];
                return (
                  <li key={o.id} className="flex items-center justify-between gap-3 px-6 py-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/partner/rental/${o.id}`}
                        className="font-medium text-foreground transition-colors hover:text-teal"
                      >
                        {o.ref}
                      </Link>
                      <div className="mt-1 text-xs text-muted">
                        {o.client_name} · {formatDate(o.pickup_date)} → {formatDate(o.return_date)}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <p className="text-sm font-medium tabular-nums">{formatFCFA(o.price_fcfa)}</p>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color}`}
                      >
                        {cfg.label}
                      </span>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
          <div className="border-t border-border bg-slate-50/50 px-6 py-3">
            <Link href="/partner/rental" className="text-sm text-amber-700 hover:underline">
              Voir toutes les réservations →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
