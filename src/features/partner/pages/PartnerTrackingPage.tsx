"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { IvorianPlateBadge } from "@/shared/ui/IvorianPlateBadge";
import { timeAgo } from "@/shared/lib/format";
import { usePartnerTracking } from "../api/tracking.queries";
import type { TrackingUnit } from "../api/tracking.service";

const IconNavigation = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </svg>
);

function PositionLine({ position }: { position?: TrackingUnit["position"] }) {
  if (!position) {
    return <p className="text-xs text-muted">Position GPS indisponible</p>;
  }
  const coords = `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`;
  const moving = (position.speed_kmh ?? 0) > 3;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
      <span className="inline-flex items-center gap-1.5">
        <span
          className={`h-2 w-2 rounded-full ${moving ? "bg-green-500" : "bg-yellow-500"}`}
          aria-hidden
        />
        {moving ? `${Math.round(position.speed_kmh ?? 0)} km/h` : "À l'arrêt"}
      </span>
      <a
        href={`https://www.google.com/maps?q=${position.lat},${position.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono tabular-nums hover:text-teal"
      >
        {coords}
      </a>
      {position.recorded_at ? <span>· vu {timeAgo(position.recorded_at)}</span> : null}
    </div>
  );
}

function UnitCard({ unit, kind }: { unit: TrackingUnit; kind: "mission" | "idle" }) {
  const colorHex = unit.vehicle?.color?.hex;
  const colorLabel = unit.vehicle?.color?.label;
  const plate = unit.vehicle?.plateNumber;
  const vehicleTitle = unit.vehicle_label ?? plate ?? "Véhicule non affecté";

  return (
    <li className="flex items-start gap-3 rounded-lg border border-border bg-canvas/40 p-3">
      {plate ? (
        <IvorianPlateBadge plate={plate} size="sm" />
      ) : (
        <span className="flex h-10 w-[4.5rem] shrink-0 items-center justify-center rounded-lg border border-dashed border-border text-[10px] uppercase text-muted">
          N/A
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{unit.driver_name}</p>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted">
          {colorHex ? (
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full border border-border/80"
              style={{ backgroundColor: colorHex }}
              aria-hidden
            />
          ) : null}
          <span className="truncate">
            {vehicleTitle}
            {colorLabel ? ` · ${colorLabel}` : ""}
          </span>
        </p>
        {kind === "mission" && (unit.order_ref || unit.status || unit.destination) ? (
          <p className="mt-1 truncate text-xs text-foreground">
            {[unit.order_ref, unit.status, unit.destination].filter(Boolean).join(" · ")}
            {unit.eta_min ? ` · ETA ${unit.eta_min} min` : ""}
          </p>
        ) : null}
        <div className="mt-1.5">
          <PositionLine position={unit.position} />
        </div>
      </div>
    </li>
  );
}

function Panel({
  title,
  count,
  emptyLabel,
  units,
  kind,
}: {
  title: string;
  count: number;
  emptyLabel: string;
  units: TrackingUnit[];
  kind: "mission" | "idle";
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-heading">{title}</h3>
        <span className="rounded-full bg-canvas px-2 py-0.5 text-xs font-medium tabular-nums text-muted">
          {count}
        </span>
      </div>
      {units.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2">
          {units.map((unit) => (
            <UnitCard key={`${unit.driver_id}-${unit.order_id ?? "idle"}`} unit={unit} kind={kind} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function PartnerTrackingPage() {
  const { data, isLoading, isError, isFetching, refetch, dataUpdatedAt } = usePartnerTracking();

  const stats = data?.stats;

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader title="Tracking GPS" breadcrumb={["Partenaire", "Tracking"]} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">
          {dataUpdatedAt
            ? `Actualisé ${timeAgo(new Date(dataUpdatedAt).toISOString())} · rafraîchissement automatique`
            : "Rafraîchissement automatique toutes les 15 s"}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-canvas disabled:opacity-60"
        >
          {isFetching ? "Actualisation…" : "Actualiser"}
        </button>
      </div>

      {isError ? (
        <div className="mt-6 rounded-card border border-dashed border-border bg-surface p-10 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal/10 text-teal">
            <IconNavigation />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Suivi indisponible</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Impossible de récupérer le suivi de flotte pour le moment. Réessayez dans
            quelques instants.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard index={0} label="Chauffeurs en ligne" value={String(stats?.drivers_online ?? 0)} />
            <KpiCard index={1} label="En mission" value={String(stats?.drivers_on_trip ?? 0)} />
            <KpiCard index={2} label="Courses actives" value={String(stats?.active_trips ?? 0)} />
            <KpiCard
              index={3}
              label="Attente moyenne"
              value={`${stats?.avg_wait_min ?? 0} min`}
            />
          </div>

          {isLoading ? (
            <div className="py-10 text-sm text-muted">Chargement du suivi…</div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Panel
                title="Missions en cours"
                count={data?.missions.length ?? 0}
                emptyLabel="Aucune mission en cours actuellement."
                units={data?.missions ?? []}
                kind="mission"
              />
              <Panel
                title="Chauffeurs disponibles"
                count={data?.idleDrivers.length ?? 0}
                emptyLabel="Aucun chauffeur disponible en ligne."
                units={data?.idleDrivers ?? []}
                kind="idle"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
