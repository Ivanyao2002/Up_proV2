"use client";

import Link from "next/link";
import type { LiveMapData, LiveMapDriver } from "@/shared/types";
import { AvailabilityPill } from "@/shared/ui/DriverPills";

function DriverRow({
  driver,
  showMeta,
  driverHref,
}: {
  driver: LiveMapDriver;
  showMeta: boolean;
  driverHref?: (id: number) => string;
}) {
  const inner = (
    <>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{driver.name}</p>
        <p className="truncate text-xs text-muted">{driver.vehicle}</p>
        {showMeta && (driver.partner_name || driver.zone_name) && (
          <p className="mt-0.5 truncate text-[10px] text-muted">
            {[driver.partner_name, driver.zone_name].filter(Boolean).join(" · ")}
          </p>
        )}
        {showMeta && driver.franchise_name && (
          <p className="truncate text-[10px] font-medium text-teal-dark">
            {driver.franchise_name}
          </p>
        )}
      </div>
      <AvailabilityPill status={driver.availability} />
    </>
  );

  if (driverHref) {
    return (
      <Link
        href={driverHref(driver.id)}
        className="flex items-center justify-between gap-2 border-t border-border/50 py-3 first:border-0 transition-colors hover:bg-surface-hover"
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 border-t border-border/50 py-3 first:border-0">
      {inner}
    </div>
  );
}

interface LiveMapDriversPanelProps {
  data: LiveMapData;
  /** Liens admin vers fiche chauffeur */
  adminDriverLinks?: boolean;
}

export function LiveMapDriversPanel({
  data,
  adminDriverLinks = false,
}: LiveMapDriversPanelProps) {
  const online = data.drivers.filter(
    (d) => d.availability === "online" || d.availability === "on_trip"
  ).length;
  const showMeta = Boolean(
    data.scope === "global" || data.scope === "franchise"
  );
  const panelTitle =
    data.scope === "global"
      ? "Flotte mondiale"
      : data.scope === "partner"
        ? "Chauffeurs partenaire"
        : "Territoire";

  const driverHref = adminDriverLinks
    ? (id: number) => `/admin/fleet/drivers/${id}`
    : undefined;

  const grouped =
    data.scope === "global" && data.franchise_summary
      ? data.franchise_summary
          .map((s) => ({
            ...s,
            drivers: data.drivers.filter((d) => d.franchise_id === s.franchise_id),
          }))
          .filter((g) => g.drivers.length > 0)
      : null;

  return (
    <aside className="live-map-territory-panel flex max-h-[min(560px,72vh)] flex-col overflow-hidden rounded-card border shadow-card">
      <div className="shrink-0 border-b border-border px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
          {panelTitle}
        </p>
        <h2 className="mt-1 text-base font-semibold text-heading">{data.zone_name}</h2>
        <p className="mt-0.5 text-xs text-muted">{data.city}</p>
        <div className="mt-3 flex gap-4 text-xs text-muted">
          <span>
            <span className="font-semibold tabular-nums text-teal-dark">{online}</span>{" "}
            actifs
          </span>
          <span>
            <span className="font-semibold tabular-nums text-heading">
              {data.drivers.length}
            </span>{" "}
            visibles
          </span>
        </div>
        {data.scope === "global" && data.franchise_summary && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {data.franchise_summary.map((s) => (
              <span
                key={s.franchise_id}
                className="rounded-full bg-canvas px-2 py-0.5 text-[10px] text-muted"
              >
                {s.franchise_name}{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {s.drivers_active}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
        {grouped
          ? grouped.map((group) => (
              <div key={group.franchise_id} className="mb-2">
                <p className="sticky top-0 z-[1] bg-white py-2 text-[10px] font-semibold uppercase tracking-widest text-muted">
                  {group.franchise_name}
                </p>
                {group.drivers.map((d) => (
                  <DriverRow
                    key={d.id}
                    driver={d}
                    showMeta={showMeta}
                    driverHref={driverHref}
                  />
                ))}
              </div>
            ))
          : data.drivers.map((d) => (
              <DriverRow
                key={d.id}
                driver={d}
                showMeta={showMeta}
                driverHref={driverHref}
              />
            ))}
      </div>
    </aside>
  );
}
