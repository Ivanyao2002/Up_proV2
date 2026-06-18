"use client";

import Link from "next/link";
import type { DashboardAdminKpi } from "@/shared/types";

interface AdminNetworkActivityPanelProps {
  activeZone: DashboardAdminKpi["active_zone"];
  franchiseActivity: DashboardAdminKpi["franchise_activity"];
  /** Vue filtrée sur une seule franchise */
  scopedToFranchise?: boolean;
}

function topFranchise(
  list: DashboardAdminKpi["franchise_activity"]
): DashboardAdminKpi["franchise_activity"][number] | undefined {
  if (list.length === 0) return undefined;
  return [...list].sort(
    (a, b) =>
      b.drivers_online - a.drivers_online || b.trips_24h - a.trips_24h
  )[0];
}

export function AdminNetworkActivityPanel({
  activeZone,
  franchiseActivity,
  scopedToFranchise = false,
}: AdminNetworkActivityPanelProps) {
  const leader = topFranchise(franchiseActivity);
  const sorted = [...franchiseActivity].sort(
    (a, b) =>
      b.drivers_online - a.drivers_online || b.trips_24h - a.trips_24h
  );
  const focus = leader ?? {
    franchise_id: activeZone.franchise_id,
    franchise_name: activeZone.franchise_name,
    city: activeZone.city,
    drivers_online: activeZone.drivers_online,
    trips_24h: activeZone.trips_24h,
    top_partner_name: activeZone.partner_name,
    top_zone_name: activeZone.zone_name,
  };

  return (
    <div className="kpi-card kpi-card--deep-teal kpi-card__grain relative w-full rounded-card p-5 text-white sm:p-6">
      <div className="kpi-card__pattern kpi-card__pattern--mesh" aria-hidden />
      <div className="relative z-[1]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/65">
                {scopedToFranchise ? "Territoire" : "Activité réseau"}
              </p>
              {!scopedToFranchise && (
                <span className="rounded-full bg-teal/25 px-2 py-0.5 text-[10px] font-semibold text-teal-dark">
                  #1
                </span>
              )}
            </div>

            <Link
              href={`/admin/network/franchises/${focus.franchise_id}`}
              className="kpi-card__value mt-1.5 block text-2xl font-semibold tabular-nums tracking-tight text-white hover:text-teal-dark sm:text-3xl"
            >
              {focus.franchise_name}
            </Link>

            <p className="mt-1 text-sm leading-snug text-white/75">
              {focus.city}
              {focus.top_partner_name || focus.top_zone_name ? (
                <>
                  {" "}
                  · {focus.top_partner_name}
                  {focus.top_zone_name ? ` · ${focus.top_zone_name}` : ""}
                </>
              ) : null}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-6 sm:gap-10 lg:justify-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
                Chauffeurs
              </p>
              <p className="mt-0.5 text-2xl font-semibold tabular-nums text-white sm:text-3xl">
                {focus.drivers_online.toLocaleString("fr-CI")}
              </p>
              <p className="text-xs text-white/65">en ligne</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
                Courses
              </p>
              <p className="mt-0.5 text-2xl font-semibold tabular-nums text-white sm:text-3xl">
                {focus.trips_24h.toLocaleString("fr-CI")}
              </p>
              <p className="text-xs text-white/65">sur 24 h</p>
            </div>
          </div>
        </div>

        {!scopedToFranchise && sorted.length > 1 ? (
          <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sorted.slice(1).map((item, index) => (
              <Link
                key={item.franchise_id}
                href={`/admin/network/franchises/${item.franchise_id}`}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 transition-colors hover:bg-white/10"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-white">
                    {item.franchise_name}
                  </p>
                  <span className="shrink-0 text-[10px] font-semibold text-white/50">
                    #{index + 2}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-white/60">{item.city}</p>
                <p className="mt-1 text-xs text-white/75">
                  {item.drivers_online.toLocaleString("fr-CI")} en ligne ·{" "}
                  {item.trips_24h} courses / 24 h
                </p>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
