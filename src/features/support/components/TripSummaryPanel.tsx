"use client";

import { useState } from "react";
import { formatDateTime } from "@/shared/lib/format";
import { useSupportTripSummary } from "../api/agentTicket.queries";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  completed:   { label: "Terminée",    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/40" },
  cancelled:   { label: "Annulée",     className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/40" },
  in_progress: { label: "En cours",    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/40" },
};

interface TripSummaryPanelProps {
  tripId: string;
  tripRef: string;
}

export function TripSummaryPanel({ tripId, tripRef }: TripSummaryPanelProps) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError } = useSupportTripSummary(open ? tripId : null);

  const statusCfg = data ? (STATUS_LABELS[data.status] ?? STATUS_LABELS.completed) : null;

  return (
    <div className="rounded-card border border-border bg-surface shadow-card">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-teal-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span className="text-sm font-semibold text-heading">Résumé course</span>
          <span className="font-mono text-xs text-muted">{tripRef}</span>
          {data?.anomaly_flagged && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
              ⚠ Anomalie
            </span>
          )}
        </div>
        <svg
          className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Body */}
      {open && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          {isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 w-full animate-pulse rounded bg-surface-hover" />
              ))}
            </div>
          )}

          {isError && (
            <p className="text-sm text-muted">Données de course indisponibles.</p>
          )}

          {data && (
            <div className="space-y-4">
              {/* Anomaly banner */}
              {data.anomaly_flagged && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                  <strong>{data.anomaly_count} anomalie{data.anomaly_count > 1 ? "s" : ""} système détectée{data.anomaly_count > 1 ? "s" : ""}</strong>
                  {" — "}analyse détaillée réservée aux superviseurs admin.
                </div>
              )}

              {/* Route */}
              <div className="flex flex-col gap-1">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-teal" />
                  <span className="text-sm text-foreground">{data.from_address}</span>
                </div>
                <div className="ml-[3px] h-4 w-px bg-border" />
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-400" />
                  <span className="text-sm text-foreground">{data.to_address}</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-canvas px-3 py-2 text-center">
                  <p className="text-xs text-muted">Distance</p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-heading">{data.distance_km} km</p>
                </div>
                <div className="rounded-lg bg-canvas px-3 py-2 text-center">
                  <p className="text-xs text-muted">Durée</p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-heading">{data.duration_min} min</p>
                </div>
                <div className="rounded-lg bg-canvas px-3 py-2 text-center">
                  <p className="text-xs text-muted">Montant</p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-heading">{data.amount_fcfa.toLocaleString("fr-FR")} F</p>
                </div>
              </div>

              {/* Meta */}
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Chauffeur</dt>
                  <dd className="font-medium text-foreground">{data.driver_name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Statut</dt>
                  <dd>
                    {statusCfg && (
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusCfg.className}`}>
                        {statusCfg.label}
                      </span>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Départ</dt>
                  <dd className="tabular-nums text-foreground">{formatDateTime(data.started_at)}</dd>
                </div>
                {data.ended_at && (
                  <div className="flex justify-between">
                    <dt className="text-muted">Fin</dt>
                    <dd className="tabular-nums text-foreground">{formatDateTime(data.ended_at)}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
