"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { StatusPill } from "@/shared/ui/StatusPill";
import { ServicePill } from "@/shared/ui/ServicePill";
import { Button } from "@/shared/ui/Button";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { EmptyState } from "@/shared/ui/EmptyState";
import { AvailabilityPill } from "@/shared/ui/DriverPills";
import { usePermission } from "@/core/auth/usePermission";
import { formatFCFA } from "@/shared/lib/format";
import type { DispatchDriverCandidate, DispatchQueueItem } from "@/shared/types";
import { useAssignDriver, useDispatchConsole } from "../api/dispatch.queries";
import {
  useDispatchPortalAssign,
  useDispatchPortalConsole,
} from "@/features/dispatch/api/dispatchPortal.queries";
import { DispatchMapPreview } from "../components/DispatchMapPreview";

export type DispatchConsoleVariant = "admin" | "dispatch";

function QueueCard({
  item,
  selected,
  onSelect,
}: {
  item: DispatchQueueItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
        selected
          ? "border-teal bg-teal/5 shadow-sm"
          : "border-border bg-surface hover:border-teal/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-foreground">{item.trip.ref}</span>
        <StatusPill status={item.trip.status} />
      </div>
      <p className="mt-1 text-xs text-muted line-clamp-1">{item.trip.from_label}</p>
      <p className="mt-2 flex items-center justify-between text-xs">
        <span className="text-amber-700 font-medium">
          Attente {item.waiting_min} min
        </span>
        <span className="text-muted">{item.candidates.length} chauffeurs</span>
      </p>
    </button>
  );
}

function CandidateRow({
  candidate,
  selected,
  onSelect,
  canAssign,
}: {
  candidate: DispatchDriverCandidate;
  selected: boolean;
  onSelect: () => void;
  canAssign: boolean;
}) {
  const assignable = canAssign && candidate.availability === "online";

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!assignable}
      className={`flex w-full items-center gap-4 rounded-lg border px-4 py-3 text-left transition-colors ${
        selected
          ? "border-teal bg-teal/5"
          : "border-border bg-surface hover:border-teal/30 disabled:opacity-50"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{candidate.name}</p>
        <p className="text-xs text-muted">{candidate.vehicle}</p>
      </div>
      <div className="text-right text-xs tabular-nums">
        <p className="font-medium text-foreground">{candidate.distance_km.toFixed(1)} km</p>
        <p className="text-muted">~{candidate.eta_min} min</p>
      </div>
      <div className="text-right text-xs">
        <p className="font-medium text-teal-dark">★ {candidate.rating.toFixed(2)}</p>
        <AvailabilityPill status={candidate.availability} />
      </div>
    </button>
  );
}

export function DispatchConsolePage({
  variant = "admin",
}: {
  variant?: DispatchConsoleVariant;
}) {
  const isDispatchPortal = variant === "dispatch";
  const adminQuery = useDispatchConsole();
  const portalQuery = useDispatchPortalConsole();
  const activeQuery = isDispatchPortal ? portalQuery : adminQuery;
  const { data, isLoading, isError, dataUpdatedAt } = activeQuery;
  const adminAssign = useAssignDriver();
  const portalAssign = useDispatchPortalAssign();
  const assignMutation = isDispatchPortal ? portalAssign : adminAssign;
  const canAssign = usePermission("ops.dispatch.assign");
  const breadcrumb = isDispatchPortal
    ? ["Dispatch", "Console"]
    : ["Admin", "Opérations"];
  const tripsHref = isDispatchPortal ? "/dispatch/console" : "/admin/ops/trips";
  const tripDetailHref = (id: string) =>
    isDispatchPortal ? "/dispatch/console" : `/admin/ops/trips/${id}`;

  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const selected = useMemo(
    () => data?.queue.find((q) => q.trip.id === selectedTripId) ?? data?.queue[0] ?? null,
    [data?.queue, selectedTripId]
  );

  const selectedDriver = selected?.candidates.find((c) => c.id === selectedDriverId);

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-card bg-border" />;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">Impossible de charger la console dispatch.</p>
    );
  }

  const updated = new Date(dataUpdatedAt).toLocaleTimeString("fr-CI", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleAssign = () => {
    if (!selected || !selectedDriverId) return;
    assignMutation.mutate(
      { tripId: selected.trip.id, driverId: selectedDriverId },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          setSelectedDriverId(null);
          const remaining = data.queue.filter((q) => q.trip.id !== selected.trip.id);
          setSelectedTripId(remaining[0]?.trip.id ?? null);
        },
      }
    );
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Console dispatch"
        breadcrumb={breadcrumb}
        actions={
          <span className="text-xs text-muted">
            MAJ {updated} · refresh 15s
          </span>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <KpiCard label="File d'attente" value={String(data.stats.queue_size)} />
        <KpiCard
          label="Chauffeurs à proximité"
          value={String(data.stats.online_nearby)}
        />
        <KpiCard
          label="Attente moyenne"
          value={`${data.stats.avg_wait_min} min`}
        />
      </div>

      {data.queue.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            title="Aucune course en attente"
            description="Les courses en statut « matching » ou « demandée » apparaîtront ici."
          />
          <p className="text-center">
            {!isDispatchPortal && (
              <Link href={tripsHref} className="text-sm text-teal hover:underline">
                Voir toutes les courses
              </Link>
            )}
            {isDispatchPortal && (
              <Link href="/dispatch/book" className="text-sm text-teal hover:underline">
                Réserver une course →
              </Link>
            )}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[280px_1fr_300px]">
          <aside className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
              File d&apos;attente
            </h2>
            {data.queue.map((item) => (
              <QueueCard
                key={item.trip.id}
                item={item}
                selected={selected?.trip.id === item.trip.id}
                onSelect={() => {
                  setSelectedTripId(item.trip.id);
                  setSelectedDriverId(null);
                }}
              />
            ))}
          </aside>

          <main className="space-y-4">
            {selected && (
              <>
                <div className="rounded-card border border-border bg-surface p-5 shadow-card">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-heading">
                      {selected.trip.ref}
                    </h2>
                    <ServicePill service={selected.trip.service} />
                    <StatusPill status={selected.trip.status} />
                  </div>
                  <p className="mt-2 text-sm text-foreground">{selected.trip.client_name}</p>
                  <div className="mt-3 space-y-1 text-sm text-muted">
                    <p>
                      <span className="text-teal">●</span> {selected.trip.from_label}
                    </p>
                    <p>
                      <span className="text-teal">●</span> {selected.trip.to_label}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
                    <span className="text-lg font-semibold tabular-nums text-heading">
                      {formatFCFA(selected.trip.amount_fcfa)}
                    </span>
                    {selected.zone_name && (
                      <span className="text-xs text-muted">{selected.zone_name}</span>
                    )}
                    {!isDispatchPortal && (
                      <Link
                        href={tripDetailHref(selected.trip.id)}
                        className="text-xs text-teal hover:underline"
                      >
                        Fiche course →
                      </Link>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                    Chauffeurs disponibles
                  </h3>
                  <div className="space-y-2">
                    {selected.candidates.map((c) => (
                      <CandidateRow
                        key={c.id}
                        candidate={c}
                        selected={selectedDriverId === c.id}
                        canAssign={canAssign}
                        onSelect={() => setSelectedDriverId(c.id)}
                      />
                    ))}
                  </div>
                </div>

                {canAssign && (
                  <Button
                    className="w-full sm:w-auto"
                    disabled={!selectedDriverId || assignMutation.isPending}
                    onClick={() => setConfirmOpen(true)}
                  >
                    {assignMutation.isPending
                      ? "Assignation…"
                      : "Assigner le chauffeur"}
                  </Button>
                )}
              </>
            )}
          </main>

          <aside>
            <DispatchMapPreview
              map={data.map}
              selected={selected}
              highlightDriverId={selectedDriverId}
            />
            {selectedDriver && (
              <p className="mt-3 text-center text-xs text-muted">
                {selectedDriver.name} · {selectedDriver.distance_km.toFixed(1)} km · ~
                {selectedDriver.eta_min} min
              </p>
            )}
          </aside>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Confirmer l'assignation"
        message={
          selected && selectedDriver
            ? `Assigner ${selectedDriver.name} à la course ${selected.trip.ref} ?`
            : ""
        }
        confirmLabel="Assigner"
        onConfirm={handleAssign}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
