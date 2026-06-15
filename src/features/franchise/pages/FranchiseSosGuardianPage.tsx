"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Button } from "@/shared/ui/Button";
import { formatDateTime } from "@/shared/lib/format";
import { SosRiskMeter } from "@/features/safety/components/SosRiskMeter";
import { SosSeverityBadge } from "@/features/safety/components/SosSeverityBadge";
import { SosStatusPill } from "@/features/safety/components/SosStatusPill";
import {
  formatRiskFactor,
  SOS_ACTOR_LABELS,
  SOS_TRIGGER_LABELS,
} from "@/features/safety/lib/sosLabels";
import type { SosIncident } from "@/features/safety/api/sos.types";
import { useFranchiseSosDashboard } from "../api/franchiseSos.queries";

interface FranchiseSosActiveIncidentCardProps {
  incident: SosIncident;
}

export function FranchiseSosGuardianPage() {
  const { data, isLoading, isError, dataUpdatedAt, isFetching } = useFranchiseSosDashboard();

  if (isError) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger le centre SOS Guardian.
      </p>
    );
  }

  const stats = data?.stats;
  const active = data?.active_incidents ?? [];
  const hasUrgent = (stats?.critical ?? 0) > 0 || (stats?.escalated ?? 0) > 0;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="SOS Guardian"
        breadcrumb={["Franchise", "Opération", "SOS"]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {dataUpdatedAt ? (
              <span className="text-xs text-muted">
                MAJ {formatDateTime(new Date(dataUpdatedAt).toISOString())}
                {isFetching ? " · actualisation…" : ""}
              </span>
            ) : null}
            <Link href="/franchise/sos/incidents">
              <Button variant="secondary">Historique complet</Button>
            </Link>
          </div>
        }
      />

      <section
        className={`relative mb-6 overflow-hidden rounded-card border p-6 shadow-card ${
          hasUrgent
            ? "border-red-200 bg-gradient-to-br from-red-950 via-red-900 to-navy text-white"
            : "border-border bg-surface"
        }`}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-red-500/20 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p
              className={`text-xs font-semibold uppercase tracking-widest ${
                hasUrgent ? "text-red-200" : "text-muted"
              }`}
            >
              Centre de sécurité live
            </p>
            <h2
              className={`mt-1 text-2xl font-bold tracking-tight ${
                hasUrgent ? "text-white" : "text-heading"
              }`}
            >
              {isLoading
                ? "Chargement…"
                : hasUrgent
                  ? `${stats?.active ?? 0} alerte(s) nécessitent une attention`
                  : "Aucune alerte critique en cours"}
            </h2>
            <p className={`mt-2 max-w-xl text-sm ${hasUrgent ? "text-red-100" : "text-muted"}`}>
              Surveillance temps réel des incidents SOS clients et chauffeurs sur votre territoire.
              Rafraîchissement automatique toutes les 30 secondes.
            </p>
          </div>
          {hasUrgent ? (
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-red-400/40 bg-red-500/20">
              <span className="relative flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-4 w-4 rounded-full bg-red-300" />
              </span>
            </div>
          ) : null}
        </div>
      </section>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Actifs"
          value={isLoading ? "—" : String(stats?.active ?? 0)}
          hint="Incidents en cours"
          index={0}
        />
        <KpiCard
          label="Escaladés"
          value={isLoading ? "—" : String(stats?.escalated ?? 0)}
          hint="Niveau ops requis"
          index={1}
        />
        <KpiCard
          label="Critiques"
          value={isLoading ? "—" : String(stats?.critical ?? 0)}
          hint="Sévérité maximale"
          index={2}
        />
        <KpiCard
          label="Pris en charge"
          value={isLoading ? "—" : String(stats?.acknowledged ?? 0)}
          compact
          index={3}
        />
        <KpiCard
          label="Haut risque"
          value={isLoading ? "—" : String(stats?.highRisk ?? 0)}
          compact
          index={0}
        />
        <KpiCard
          label="GPS perdu"
          value={isLoading ? "—" : String(stats?.gpsLost ?? 0)}
          compact
          index={1}
        />
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-heading">Incidents actifs</h2>
        <span className="text-sm text-muted">
          {isLoading ? "…" : `${active.length} affiché(s)`}
        </span>
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-card border border-border bg-navy/5"
            />
          ))}
        </div>
      ) : active.length === 0 ? (
        <div className="rounded-card border border-dashed border-border bg-surface p-12 text-center">
          <p className="text-sm font-medium text-foreground">Aucun incident actif</p>
          <p className="mt-1 text-sm text-muted">
            Les nouvelles alertes SOS apparaîtront ici en temps réel.
          </p>
          <Link
            href="/franchise/sos/incidents"
            className="mt-4 inline-block text-sm text-teal hover:underline"
          >
            Consulter l&apos;historique
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {active.map((incident) => (
            <FranchiseSosActiveIncidentCard key={incident.id} incident={incident} />
          ))}
        </div>
      )}
    </div>
  );
}

function FranchiseSosActiveIncidentCard({ incident }: FranchiseSosActiveIncidentCardProps) {
  const actor = SOS_ACTOR_LABELS[incident.actor_type] ?? incident.actor_type;
  const trigger = SOS_TRIGGER_LABELS[incident.trigger] ?? incident.trigger;

  return (
    <article className="group relative overflow-hidden rounded-card border border-border bg-surface p-5 shadow-card transition hover:border-red-200 hover:shadow-md">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-teal"
        aria-hidden
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <SosStatusPill status={incident.status} pulse />
            <SosSeverityBadge severity={incident.severity} />
            {incident.silent_mode ? (
              <span className="rounded-md bg-navy/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                Silencieux
              </span>
            ) : null}
          </div>
          <p className="font-mono text-xs text-muted">{incident.id.slice(0, 8)}…</p>
          <h3 className="text-base font-semibold text-heading">
            Alerte {actor.toLowerCase()} · {trigger}
          </h3>
          {incident.message ? (
            <p className="text-sm text-muted line-clamp-2">{incident.message}</p>
          ) : null}
        </div>
        <Link
          href={`/franchise/sos/incidents/${incident.id}`}
          className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
        >
          Ouvrir
        </Link>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <SosRiskMeter score={incident.risk_score} compact />
        <dl className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <dt className="text-muted">Déclenché</dt>
            <dd className="font-medium text-foreground">
              {formatDateTime(incident.triggered_at)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Escalade</dt>
            <dd className="font-medium text-foreground">
              Niveau {incident.escalation_level}
            </dd>
          </div>
          {incident.age_minutes != null ? (
            <div>
              <dt className="text-muted">Âge</dt>
              <dd className="font-medium text-foreground">
                {incident.age_minutes} min
              </dd>
            </div>
          ) : null}
          {incident.battery_level != null ? (
            <div>
              <dt className="text-muted">Batterie</dt>
              <dd className="font-medium text-foreground">
                {incident.battery_level}%
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      {(incident.risk_factors.length > 0 || incident.attention_flags) && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {incident.attention_flags?.gpsLost ? (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
              GPS perdu
            </span>
          ) : null}
          {incident.attention_flags?.highRisk ? (
            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-800">
              Risque élevé
            </span>
          ) : null}
          {incident.risk_factors.slice(0, 4).map((factor) => (
            <span
              key={factor}
              className="rounded-full bg-navy/5 px-2 py-0.5 text-[10px] font-medium text-muted"
            >
              {formatRiskFactor(factor)}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
