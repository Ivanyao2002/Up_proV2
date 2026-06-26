"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { adminPaths } from "@/core/routes/adminPaths";
import type { Driver, LiveMapData, LiveMapDriver } from "@/shared/types";
import { AvailabilityPill } from "@/shared/ui/DriverPills";
import { formatLiveMapVehicleLine } from "../lib/liveMapDriverDisplay";
import { LiveMapVehicleColorInfo } from "./LiveMapVehicleColorInfo";

type AvailabilityFilter = "all" | Driver["availability"];

const AVAILABILITY_FILTER_OPTIONS: { value: AvailabilityFilter; label: string }[] = [
  { value: "all", label: "Toutes dispos" },
  { value: "online", label: "En ligne" },
  { value: "on_trip", label: "En course" },
  { value: "paused", label: "En pause" },
  { value: "offline", label: "Hors ligne" },
];

function matchesDriverSearch(driver: LiveMapDriver, query: string): boolean {
  const haystack = `${driver.name} ${driver.vehicle ?? ""}`.toLowerCase();
  return haystack.includes(query);
}

function DriverRow({
  driver,
  showMeta,
  driverHref,
  showTripLinks,
}: {
  driver: LiveMapDriver;
  showMeta: boolean;
  driverHref?: (id: string | number) => string;
  showTripLinks?: boolean;
}) {
  const trip = driver.active_trip;

  const rowClass =
    "flex items-center justify-between gap-2 border-t border-border/50 py-3 first:border-0";

  const driverName = driverHref ? (
    <Link
      href={driverHref(driver.id)}
      className="truncate text-sm font-medium text-foreground hover:text-teal-dark hover:underline"
    >
      {driver.name}
    </Link>
  ) : (
    <p className="truncate text-sm font-medium text-foreground">{driver.name}</p>
  );

  return (
    <div className={rowClass}>
      <div className="min-w-0 flex-1">
        {driverName}
        {formatLiveMapVehicleLine(driver) ? (
          <p className="truncate text-xs text-muted">{formatLiveMapVehicleLine(driver)}</p>
        ) : null}
        <LiveMapVehicleColorInfo driver={driver} />
        {trip && (
          <p className="mt-1 truncate text-[10px] font-medium text-navy">
            {trip.ref} · {trip.status_label}
          </p>
        )}
        {trip && (
          <p className="truncate text-[10px] text-muted">
            {trip.from_label} → {trip.to_label}
          </p>
        )}
        {showTripLinks && trip && (
          <p className="mt-1 flex flex-wrap gap-2 text-[10px] font-semibold">
            <Link
              href={adminPaths.trip(trip.id)}
              className="text-teal-dark hover:underline"
            >
              Course
            </Link>
            {driverHref && (
              <Link
                href={driverHref(driver.id)}
                className="text-teal-dark hover:underline"
              >
                Chauffeur
              </Link>
            )}
          </p>
        )}
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
        {driver.has_location === false && (
          <p className="mt-0.5 truncate text-[10px] font-medium text-amber-600">
            Position inconnue
          </p>
        )}
      </div>
      <AvailabilityPill status={driver.availability} />
    </div>
  );
}

interface LiveMapDriversPanelProps {
  data: LiveMapData;
  /** Liens admin vers fiche chauffeur */
  adminDriverLinks?: boolean;
  /** Liens franchise vers fiche chauffeur */
  franchiseDriverLinks?: boolean;
  /** Liens partenaire vers fiche chauffeur */
  partnerDriverLinks?: boolean;
}

export function LiveMapDriversPanel({
  data,
  adminDriverLinks = false,
  franchiseDriverLinks = false,
  partnerDriverLinks = false,
}: LiveMapDriversPanelProps) {
  const [search, setSearch] = useState("");
  const [availabilityFilter, setAvailabilityFilter] =
    useState<AvailabilityFilter>("all");

  // Recherche (nom / immatriculation) + filtre disponibilité (#76 audit UX).
  const filteredDrivers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.drivers.filter((d) => {
      if (availabilityFilter !== "all" && d.availability !== availabilityFilter) {
        return false;
      }
      if (query && !matchesDriverSearch(d, query)) return false;
      return true;
    });
  }, [data.drivers, search, availabilityFilter]);

  const hasActiveFilter = search.trim() !== "" || availabilityFilter !== "all";

  const online = filteredDrivers.filter(
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

  const showTripLinks = adminDriverLinks;

  const driverHref = adminDriverLinks
    ? (id: string | number) => adminPaths.driver(id)
    : franchiseDriverLinks
      ? (id: string | number) => `/franchise/drivers/${id}`
      : partnerDriverLinks
        ? (id: string | number) => `/partner/drivers/${id}`
        : undefined;

  const grouped =
    data.scope === "global" && data.franchise_summary
      ? data.franchise_summary
          .map((s) => ({
            ...s,
            drivers: filteredDrivers.filter(
              (d) => d.franchise_id === s.franchise_id
            ),
          }))
          .filter((g) => g.drivers.length > 0)
      : null;

  const partnerGrouped =
    data.scope === "franchise" && !grouped
      ? (() => {
          const map = new Map<
            string | number,
            { partner_name: string; drivers: LiveMapDriver[]; active: number }
          >();
          for (const d of filteredDrivers) {
            const pid = d.partner_id ?? 0;
            const row = map.get(pid) ?? {
              partner_name: d.partner_name ?? "Partenaire",
              drivers: [] as LiveMapDriver[],
              active: 0,
            };
            row.drivers.push(d);
            if (d.availability === "online" || d.availability === "on_trip") {
              row.active += 1;
            }
            map.set(pid, row);
          }
          return [...map.entries()]
            .map(([partner_id, g]) => ({ partner_id, ...g }))
            .sort((a, b) => a.partner_name.localeCompare(b.partner_name));
        })()
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
              {data.drivers.filter((d) => d.has_location !== false).length}
            </span>{" "}
            {hasActiveFilter ? "filtrés" : "géolocalisés"}
          </span>
          {(data.order_markers?.length ?? 0) > 0 && (
            <span>
              <span className="font-semibold tabular-nums text-heading">
                {data.order_markers!.length}
              </span>{" "}
              points course
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (nom, immatriculation)…"
            aria-label="Rechercher un chauffeur"
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground placeholder:text-muted outline-none ring-teal/30 focus:ring-2"
          />
          <select
            value={availabilityFilter}
            onChange={(e) =>
              setAvailabilityFilter(e.target.value as AvailabilityFilter)
            }
            aria-label="Filtrer par disponibilité"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground outline-none ring-teal/30 focus:ring-2"
          >
            {AVAILABILITY_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-surface text-foreground">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {data.drivers.length === 0 && online > 0 && (
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Chauffeurs en ligne sans position récente — les commandes actives restent
            visibles sur la carte.
          </p>
        )}
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
        {partnerGrouped && partnerGrouped.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {partnerGrouped.map((g) => (
              <span
                key={g.partner_id}
                className="rounded-full bg-canvas px-2 py-0.5 text-[10px] text-muted"
              >
                {g.partner_name}{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {g.active}
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
                <p className="sticky top-0 z-[1] bg-surface py-2 text-[10px] font-semibold uppercase tracking-widest text-muted">
                  {group.franchise_name}
                </p>
                {group.drivers.map((d) => (
                  <DriverRow
                    key={d.id}
                    driver={d}
                    showMeta={showMeta}
                    driverHref={driverHref}
                    showTripLinks={showTripLinks}
                  />
                ))}
              </div>
            ))
          : partnerGrouped && partnerGrouped.length > 1
            ? partnerGrouped.map((group) => (
                <div key={group.partner_id} className="mb-2">
                  <p className="sticky top-0 z-[1] bg-surface py-2 text-[10px] font-semibold uppercase tracking-widest text-muted">
                    {group.partner_name}
                  </p>
                  {group.drivers.map((d) => (
                    <DriverRow
                      key={d.id}
                      driver={d}
                      showMeta={showMeta}
                      driverHref={driverHref}
                      showTripLinks={showTripLinks}
                    />
                  ))}
                </div>
              ))
            : filteredDrivers.map((d) => (
                <DriverRow
                  key={d.id}
                  driver={d}
                  showMeta={showMeta}
                  driverHref={driverHref}
                  showTripLinks={showTripLinks}
                />
              ))}
        {hasActiveFilter && filteredDrivers.length === 0 && (
          <p className="py-6 text-center text-xs text-muted">
            Aucun chauffeur ne correspond à la recherche.
          </p>
        )}
      </div>
    </aside>
  );
}
