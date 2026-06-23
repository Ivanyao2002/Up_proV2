"use client";

import Link from "next/link";
import { useState } from "react";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Timeline, type TimelineItem } from "@/shared/ui/Timeline";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import { formatDateTime } from "@/shared/lib/format";
import type {
  AcknowledgeSosPayload,
  ResolveSosPayload,
  SosIncidentDetail,
  SosResolution,
} from "../api/sos.types";
import type { SosPortalRoutes } from "../lib/sosPortalConfig";
import { SosIncidentMap } from "./SosIncidentMap";
import { SosRiskMeter } from "./SosRiskMeter";
import { SosSeverityBadge } from "./SosSeverityBadge";
import { SosStatusPill } from "./SosStatusPill";
import {
  formatRiskFactor,
  SOS_ACTOR_LABELS,
  SOS_RESOLUTION_OPTIONS,
  SOS_TRIGGER_LABELS,
} from "../lib/sosLabels";

type UseSosIncidentDetail = (id: string) => UseQueryResult<SosIncidentDetail>;
type UseAcknowledgeSos = (id: string) => UseMutationResult<unknown, Error, AcknowledgeSosPayload | undefined>;
type UseResolveSos = (id: string) => UseMutationResult<unknown, Error, ResolveSosPayload>;

interface SosIncidentDetailViewProps {
  incidentId: string;
  routes: SosPortalRoutes;
  breadcrumb: string[];
  useIncidentDetail: UseSosIncidentDetail;
  useAcknowledge: UseAcknowledgeSos;
  useResolve: UseResolveSos;
}

export function SosIncidentDetailView({
  incidentId,
  routes,
  breadcrumb,
  useIncidentDetail,
  useAcknowledge,
  useResolve,
}: SosIncidentDetailViewProps) {
  const [showAcknowledge, setShowAcknowledge] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [ackNotes, setAckNotes] = useState("");
  const [resolveNotes, setResolveNotes] = useState("");
  const [resolution, setResolution] = useState<SosResolution>("client_safe");

  const { data, isLoading, isError } = useIncidentDetail(incidentId);
  const acknowledge = useAcknowledge(incidentId);
  const resolve = useResolve(incidentId);

  if (isLoading) {
    return (
      <DetailPageSkeleton title="Incident SOS" breadcrumb={breadcrumb} />
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Incident introuvable.{" "}
        <Link href={routes.incidents} className="text-teal underline">
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
  const staleGps = (incident.last_location_age_minutes ?? 0) > 5;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={`Incident ${incident.id.slice(0, 8)}`}
        breadcrumb={[...breadcrumb, incident.id.slice(0, 8)]}
        actions={
          !isClosed ? (
            <div className="flex flex-wrap gap-2">
              {canAcknowledge ? (
                <Button
                  variant="secondary"
                  disabled={acknowledge.isPending}
                  onClick={() => setShowAcknowledge(true)}
                >
                  Prendre en charge
                </Button>
              ) : null}
              {canResolve ? (
                <Button
                  disabled={resolve.isPending}
                  onClick={() => setShowResolve(true)}
                >
                  Clôturer
                </Button>
              ) : null}
            </div>
          ) : (
            <SosStatusPill status={incident.status} />
          )
        }
      />

      <p className="mb-6 text-sm">
        <Link href={routes.guardian} className="text-teal hover:underline">
          ← Centre live
        </Link>
        {" · "}
        <Link href={routes.incidents} className="text-teal hover:underline">
          Historique
        </Link>
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <SosStatusPill status={incident.status} pulse={canAcknowledge} />
        <SosSeverityBadge severity={incident.severity} />
        {incident.silent_mode ? (
          <span className="text-xs font-medium text-muted">Mode silencieux</span>
        ) : null}
        <span className="text-sm text-muted">
          Déclenché {formatDateTime(incident.triggered_at)}
        </span>
      </div>

      {!isClosed ? (
        <div
          className={`mb-6 rounded-card border p-4 shadow-card ${
            incident.status === "escalated" || incident.severity === "critical"
              ? "border-red-300 bg-red-50"
              : "border-amber-300 bg-amber-50"
          }`}
        >
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted">
                Déclenché
              </p>
              <p className="text-lg font-semibold text-foreground">
                {incident.age_minutes != null
                  ? `il y a ${incident.age_minutes} min`
                  : formatDateTime(incident.triggered_at)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted">
                Dernier point GPS
              </p>
              <p
                className={`text-lg font-semibold ${
                  staleGps ? "text-red-600" : "text-foreground"
                }`}
              >
                {incident.last_location_age_minutes != null
                  ? `il y a ${incident.last_location_age_minutes} min`
                  : "inconnu"}
                {staleGps ? " · GPS perdu" : ""}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted">
                Score risque
              </p>
              <p className="text-lg font-semibold text-foreground">
                {incident.risk_score}
              </p>
            </div>
            {canAcknowledge ? (
              <div className="ml-auto">
                <Button
                  disabled={acknowledge.isPending}
                  onClick={() => setShowAcknowledge(true)}
                >
                  Prendre en charge
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Score risque"
          value={String(incident.risk_score)}
          hint={`Escalade niveau ${incident.escalation_level}`}
          index={0}
        />
        <KpiCard
          label="Acteur"
          value={SOS_ACTOR_LABELS[incident.actor_type] ?? incident.actor_type}
          index={1}
        />
        <KpiCard
          label="Déclencheur"
          value={SOS_TRIGGER_LABELS[incident.trigger] ?? incident.trigger}
          index={2}
        />
        <KpiCard
          label="Positions"
          value={String(locations.length)}
          hint="Points GPS enregistrés"
          index={3}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <SosIncidentMap
            latitude={lat}
            longitude={lng}
            locations={locations}
            className="min-h-[320px]"
          />

          {incident.message ? (
            <section className="rounded-card border border-border bg-surface p-5 shadow-card">
              <h2 className="text-sm font-semibold text-heading">Message client</h2>
              <p className="mt-3 text-sm text-muted">{incident.message}</p>
            </section>
          ) : null}

          <section className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h2 className="text-sm font-semibold text-heading">Timeline</h2>
            <div className="mt-4">
              {timelineItems.length ? (
                <Timeline items={timelineItems} />
              ) : (
                <p className="text-sm text-muted">Aucun événement enregistré.</p>
              )}
            </div>
          </section>

          {locations.length > 0 ? (
            <section className="rounded-card border border-border bg-surface p-5 shadow-card">
              <h2 className="text-sm font-semibold text-heading">
                Historique positions
              </h2>
              <ul className="mt-3 divide-y divide-border">
                {locations.map((point) => (
                  <li
                    key={point.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm first:pt-0"
                  >
                    <span className="font-mono text-xs text-muted">
                      {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
                    </span>
                    <span className="text-muted">
                      {formatDateTime(point.recorded_at)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <section className="rounded-card border border-border bg-surface p-5 shadow-card">
            <SosRiskMeter score={incident.risk_score} />
            {incident.risk_factors.length > 0 ? (
              <ul className="mt-4 space-y-1.5">
                {incident.risk_factors.map((factor) => (
                  <li
                    key={factor}
                    className="rounded-md bg-navy/5 px-2.5 py-1.5 text-xs text-muted"
                  >
                    {formatRiskFactor(factor)}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {incident.client_id || incident.driver_id ? (
            <section className="rounded-card border border-border bg-surface p-5 shadow-card">
              <h2 className="text-sm font-semibold text-heading">
                Contacts d&apos;urgence
              </h2>
              <div className="mt-4 space-y-2">
                {incident.client_id ? (
                  incident.client_phone ? (
                    <a
                      href={`tel:${incident.client_phone}`}
                      className="flex items-center justify-between gap-2 rounded-lg bg-teal px-3 py-2.5 text-sm font-medium text-white hover:bg-teal-dark"
                    >
                      <span>
                        Appeler le client
                        {incident.client_name ? ` · ${incident.client_name}` : ""}
                      </span>
                      <span className="font-mono">{incident.client_phone}</span>
                    </a>
                  ) : (
                    <p className="rounded-lg border border-dashed border-border px-3 py-2.5 text-xs text-muted">
                      Client{" "}
                      {incident.client_name ?? `${incident.client_id.slice(0, 8)}…`} —
                      numéro non communiqué par l&apos;API
                    </p>
                  )
                ) : null}
                {incident.driver_id ? (
                  incident.driver_phone ? (
                    <a
                      href={`tel:${incident.driver_phone}`}
                      className="flex items-center justify-between gap-2 rounded-lg bg-navy px-3 py-2.5 text-sm font-medium text-white hover:opacity-90"
                    >
                      <span>
                        Appeler le chauffeur
                        {incident.driver_name ? ` · ${incident.driver_name}` : ""}
                      </span>
                      <span className="font-mono">{incident.driver_phone}</span>
                    </a>
                  ) : (
                    <p className="rounded-lg border border-dashed border-border px-3 py-2.5 text-xs text-muted">
                      Chauffeur{" "}
                      {incident.driver_name ?? `${incident.driver_id.slice(0, 8)}…`} —
                      numéro non communiqué par l&apos;API
                    </p>
                  )
                ) : null}
                {incident.emergency_contact_phone ? (
                  <a
                    href={`tel:${incident.emergency_contact_phone}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100"
                  >
                    <span>
                      Contact d&apos;urgence
                      {incident.emergency_contact_name
                        ? ` · ${incident.emergency_contact_name}`
                        : ""}
                    </span>
                    <span className="font-mono">
                      {incident.emergency_contact_phone}
                    </span>
                  </a>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h2 className="text-sm font-semibold text-heading">Contexte</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {incident.order_id && routes.orderDetail ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Course</dt>
                  <dd>
                    <Link
                      href={routes.orderDetail(incident.order_id)}
                      className="text-teal hover:underline"
                    >
                      {incident.order_id.slice(0, 8)}…
                    </Link>
                  </dd>
                </div>
              ) : null}
              {incident.client_id ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Client</dt>
                  <dd className="font-mono text-xs">{incident.client_id.slice(0, 8)}…</dd>
                </div>
              ) : null}
              {incident.driver_id && routes.driverDetail ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Chauffeur</dt>
                  <dd>
                    <Link
                      href={routes.driverDetail(incident.driver_id)}
                      className="text-teal hover:underline"
                    >
                      Voir fiche
                    </Link>
                  </dd>
                </div>
              ) : null}
              {incident.device_platform ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Appareil</dt>
                  <dd>
                    {incident.device_platform}
                    {incident.battery_level != null
                      ? ` · ${incident.battery_level}%`
                      : ""}
                  </dd>
                </div>
              ) : null}
              {incident.tracking_url ? (
                <div>
                  <dt className="text-muted">Suivi public</dt>
                  <dd className="mt-1 break-all text-xs text-teal">
                    <a
                      href={incident.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {incident.tracking_url}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
        </aside>
      </div>

      {showAcknowledge ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4">
          <div className="w-full max-w-md rounded-card border border-border bg-surface p-6 shadow-card">
            <h2 className="text-lg font-semibold text-heading">
              Prendre en charge cet incident
            </h2>
            <p className="mt-2 text-sm text-muted">
              Confirmez la prise en charge de l&apos;alerte SOS.
            </p>
            <label className="mt-4 block text-sm">
              <span className="font-medium text-foreground">Notes (optionnel)</span>
              <textarea
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                rows={3}
                value={ackNotes}
                onChange={(e) => setAckNotes(e.target.value)}
                placeholder="Ex. contact téléphonique en cours…"
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowAcknowledge(false)}>
                Annuler
              </Button>
              <Button
                disabled={acknowledge.isPending}
                onClick={() => {
                  acknowledge.mutate(
                    { notes: ackNotes.trim() || undefined },
                    { onSuccess: () => setShowAcknowledge(false) }
                  );
                }}
              >
                Confirmer
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showResolve ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4">
          <div className="w-full max-w-md rounded-card border border-border bg-surface p-6 shadow-card">
            <h2 className="text-lg font-semibold text-heading">
              Clôturer l&apos;incident SOS
            </h2>
            <p className="mt-2 text-sm text-muted">
              Indiquez la résolution appliquée. Cette action est définitive.
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <label className="block">
                <span className="font-medium text-foreground">Résolution</span>
                <select
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 outline-none ring-teal/30 focus:ring-2"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value as SosResolution)}
                >
                  {SOS_RESOLUTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="font-medium text-foreground">Notes</span>
                <textarea
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 outline-none ring-teal/30 focus:ring-2"
                  rows={3}
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowResolve(false)}>
                Annuler
              </Button>
              <Button
                disabled={resolve.isPending}
                onClick={() => {
                  resolve.mutate(
                    {
                      resolution,
                      notes: resolveNotes.trim() || undefined,
                    },
                    { onSuccess: () => setShowResolve(false) }
                  );
                }}
              >
                Clôturer
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
