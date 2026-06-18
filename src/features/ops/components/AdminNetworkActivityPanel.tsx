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
    <div className="kpi-card kpi-card--compact kpi-card--deep-teal kpi-card__grain relative rounded-card p-4 text-white sm:p-5">
      <div className="kpi-card__pattern kpi-card__pattern--mesh" aria-hidden />
      <div className="relative z-[1]">
        <div className="flex items-center justify-between gap-2">
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
          className="kpi-card__value mt-1.5 block text-2xl font-semibold tabular-nums tracking-tight text-white hover:text-teal-dark"
        >
          {focus.franchise_name}
        </Link>

        <p className="mt-1 truncate text-xs leading-snug text-white/75">
          {focus.top_partner_name} · {focus.top_zone_name}
        </p>

        <p className="mt-1.5 text-xs text-white/70">
          <span className="font-semibold tabular-nums text-white">
            {focus.drivers_online.toLocaleString("fr-CI")}
          </span>{" "}
          en ligne ·{" "}
          <span className="font-semibold tabular-nums text-white">
            {focus.trips_24h}
          </span>{" "}
          courses / 24 h
        </p>
      </div>
    </div>
  );
}
