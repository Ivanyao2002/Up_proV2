import Link from "next/link";
import { formatDateTime } from "@/shared/lib/format";
import type { SosIncident } from "../api/sos.types";
import {
  formatRiskFactor,
  SOS_ACTOR_LABELS,
  SOS_TRIGGER_LABELS,
} from "../lib/sosLabels";
import { SosRiskMeter } from "./SosRiskMeter";
import { SosSeverityBadge } from "./SosSeverityBadge";
import { SosStatusPill } from "./SosStatusPill";

interface SosActiveIncidentCardProps {
  incident: SosIncident;
}

export function SosActiveIncidentCard({ incident }: SosActiveIncidentCardProps) {
  const href = `/admin/ops/sos/incidents/${incident.id}`;
  const actor =
    SOS_ACTOR_LABELS[incident.actor_type] ?? incident.actor_type;
  const trigger =
    SOS_TRIGGER_LABELS[incident.trigger] ?? incident.trigger;

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
          href={href}
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
