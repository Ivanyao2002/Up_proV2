"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Timeline, type TimelineItem } from "@/shared/ui/Timeline";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import { formatDateTime } from "@/shared/lib/format";
import type { SosResolution } from "@/features/safety/api/sos.types";
import {
  useFranchiseAcknowledgeSos,
  useFranchiseResolveSos,
  useFranchiseSosIncidentDetail,
} from "../api/franchiseSos.queries";
import { SosIncidentMap } from "@/features/safety/components/SosIncidentMap";
import { SosRiskMeter } from "@/features/safety/components/SosRiskMeter";
import { SosSeverityBadge } from "@/features/safety/components/SosSeverityBadge";
import { SosStatusPill } from "@/features/safety/components/SosStatusPill";
import {
  formatRiskFactor,
  SOS_ACTOR_LABELS,
  SOS_RESOLUTION_OPTIONS,
  SOS_TRIGGER_LABELS,
} from "@/features/safety/lib/sosLabels";

interface FranchiseSosIncidentDetailPageProps {
  incidentId: string;
}

export function FranchiseSosIncidentDetailPage({
  incidentId,
}: FranchiseSosIncidentDetailPageProps) {
  const [showAcknowledge, setShowAcknowledge] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [ackNotes, setAckNotes] = useState("");
  const [resolveNotes, setResolveNotes] = useState("");
  const [resolution, setResolution] = useState<SosResolution>("client_safe");

  const { data, isLoading, isError } = useFranchiseSosIncidentDetail(incidentId);
  const acknowledge = useFranchiseAcknowledgeSos(incidentId);
  const resolve = useFranchiseResolveSos(incidentId);

  if (isLoading) {
    return (
      <DetailPageSkeleton
        title="Incident SOS"
        breadcrumb={["Franchise", "Opération", "SOS"]}
      />
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Incident introuvable.{" "}
        <Link href="/franchise/sos/incidents" className="text-teal underline">
          Retour à la liste
        </Link>
      </p>
    );
  }

  const { incident, locations, events } = data;
  const isClosed =
    incident.status === "resolved" || incident.status === "cancelled";
  const canAcknowledge =
    !isClosed &&
    (incident.status === "active" || incident.status === "escalated");
  const canResolve = !isClosed;

  const timelineItems: TimelineItem[] = events.map((event) => ({
    id: event.id,
    label: event.label,
    description: [
      event.description,
      event.new_status_label ? `→ ${event.new_status_label}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    at: event.at,
    variant:
      event.event_type.includes("resolved") || event.event_type.includes("ok")
        ? "success"
        : event.event_type.includes("failed") ||
          event.event_type.includes("escalated")
          ? "warning"
          : "default",
  }));

  const lat = incident.last_latitude ?? incident.latitude;
  const lng = incident.last_longitude ?? incident.longitude;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={`Incident ${incident.id.slice(0, 8)}`}
        breadcrumb={["Franchise", "Opération", "SOS", incident.id.slice(0, 8)]}
        actions={
          !isClosed ? (
            <div className="flex flex-wrap gap-2">
              {canAcknowledge && (
                <Button onClick={() => setShowAcknowledge(true)}>
                  Prendre en charge
                </Button>
              )}
              {canResolve && (
                <Button variant="secondary" onClick={() => setShowResolve(true)}>
                  Clôturer
                </Button>
              )}
            </div>
          ) : (
            <span className="rounded-full bg-teal/10 px-3 py-1 text-sm font-medium text-teal">
              Incident clôturé
            </span>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-card border border-border bg-surface p-4 shadow-card">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Statut
              </p>
              <div className="mt-2">
                <SosStatusPill status={incident.status} />
              </div>
            </div>
            <div className="rounded-card border border-border bg-surface p-4 shadow-card">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Sévérité
              </p>
              <div className="mt-2">
                <SosSeverityBadge severity={incident.severity} />
              </div>
            </div>
            <KpiCard
              label="Risque"
              value={String(incident.risk_score)}
              compact
              index={0}
            />
            <KpiCard
              label="Escalade"
              value={`Niveau ${incident.escalation_level}`}
              compact
              index={1}
            />
          </div>

          <section className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Informations
            </h3>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Type d&apos;acteur</dt>
                <dd className="font-medium">
                  {SOS_ACTOR_LABELS[incident.actor_type] ?? incident.actor_type}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Déclencheur</dt>
                <dd className="font-medium">
                  {SOS_TRIGGER_LABELS[incident.trigger] ?? incident.trigger}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Déclenché le</dt>
                <dd className="font-medium">
                  {formatDateTime(incident.triggered_at)}
                </dd>
              </div>
              {incident.acknowledged_at && (
                <div>
                  <dt className="text-muted">Pris en charge le</dt>
                  <dd className="font-medium">
                    {formatDateTime(incident.acknowledged_at)}
                  </dd>
                </div>
              )}
              {incident.resolved_at && (
                <div>
                  <dt className="text-muted">Résolu le</dt>
                  <dd className="font-medium">
                    {formatDateTime(incident.resolved_at)}
                  </dd>
                </div>
              )}
              {incident.message && (
                <div className="sm:col-span-2">
                  <dt className="text-muted">Message</dt>
                  <dd className="mt-1 rounded-lg bg-canvas p-3 font-medium">
                    {incident.message}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {incident.risk_factors.length > 0 && (
            <section className="rounded-card border border-border bg-surface p-5 shadow-card">
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Facteurs de risque
              </h3>
              <div className="flex flex-wrap gap-2">
                {incident.risk_factors.map((factor) => (
                  <span
                    key={factor}
                    className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700"
                  >
                    {formatRiskFactor(factor)}
                  </span>
                ))}
              </div>
            </section>
          )}

          {timelineItems.length > 0 && (
            <section className="rounded-card border border-border bg-surface p-5 shadow-card">
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Historique
              </h3>
              <Timeline items={timelineItems} />
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <SosRiskMeter score={incident.risk_score} />

          <SosIncidentMap latitude={lat} longitude={lng} locations={locations} />

          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Contexte
            </h3>
            <dl className="space-y-2 text-sm">
              {incident.order_id && (
                <div className="flex justify-between">
                  <dt className="text-muted">Course</dt>
                  <dd className="font-medium">
                    <Link
                      href={`/franchise/ops/trips/${incident.order_id}`}
                      className="text-teal hover:underline"
                    >
                      {incident.order_id.slice(0, 8)}…
                    </Link>
                  </dd>
                </div>
              )}
              {incident.client_id && (
                <div className="flex justify-between">
                  <dt className="text-muted">Client</dt>
                  <dd className="font-medium">
                    {incident.client_id.slice(0, 8)}…
                  </dd>
                </div>
              )}
              {incident.driver_id && (
                <div className="flex justify-between">
                  <dt className="text-muted">Chauffeur</dt>
                  <dd className="font-medium">
                    <Link
                      href={`/franchise/drivers/${incident.driver_id}`}
                      className="text-teal hover:underline"
                    >
                      {incident.driver_id.slice(0, 8)}…
                    </Link>
                  </dd>
                </div>
              )}
              {incident.battery_level != null && (
                <div className="flex justify-between">
                  <dt className="text-muted">Batterie</dt>
                  <dd className="font-medium">{incident.battery_level}%</dd>
                </div>
              )}
              {incident.network_type && (
                <div className="flex justify-between">
                  <dt className="text-muted">Réseau</dt>
                  <dd className="font-medium">{incident.network_type}</dd>
                </div>
              )}
              {incident.device_platform && (
                <div className="flex justify-between">
                  <dt className="text-muted">Appareil</dt>
                  <dd className="font-medium">{incident.device_platform}</dd>
                </div>
              )}
            </dl>
          </div>
        </aside>
      </div>

      {/* Modal Prendre en charge */}
      {showAcknowledge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-card border border-border bg-surface p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Prendre en charge l&apos;incident
            </h3>
            <p className="mb-4 text-sm text-muted">
              Confirmez la prise en charge de cet incident SOS. 
              Cela notifiera les équipes que vous traitez la situation.
            </p>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-foreground">
                Notes (optionnel)
              </label>
              <textarea
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm"
                rows={3}
                placeholder="Actions en cours, observations..."
                value={ackNotes}
                onChange={(e) => setAckNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowAcknowledge(false)}>
                Annuler
              </Button>
              <Button
                onClick={() => {
                  acknowledge.mutate({ notes: ackNotes || undefined });
                  setShowAcknowledge(false);
                }}
                disabled={acknowledge.isPending}
              >
                {acknowledge.isPending ? "En cours…" : "Confirmer"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Clôturer */}
      {showResolve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-card border border-border bg-surface p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Clôturer l&apos;incident
            </h3>
            <p className="mb-4 text-sm text-muted">
              Sélectionnez la résolution et ajoutez des notes si nécessaire.
            </p>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-foreground">
                Résolution
              </label>
              <select
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm"
                value={resolution}
                onChange={(e) => setResolution(e.target.value as SosResolution)}
              >
                {SOS_RESOLUTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-foreground">
                Notes (optionnel)
              </label>
              <textarea
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm"
                rows={3}
                placeholder="Détails sur la résolution..."
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowResolve(false)}>
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  resolve.mutate({
                    resolution,
                    notes: resolveNotes || undefined,
                  });
                  setShowResolve(false);
                }}
                disabled={resolve.isPending}
              >
                {resolve.isPending ? "En cours…" : "Clôturer l&apos;incident"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
