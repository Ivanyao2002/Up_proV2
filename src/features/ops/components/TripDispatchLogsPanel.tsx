"use client";

import Link from "next/link";
import { formatDateTime } from "@/shared/lib/format";
import { useDispatchLogs } from "../api/dispatchLogs.queries";

interface TripDispatchLogsPanelProps {
  orderId: string;
  serviceType?: string;
  className?: string;
}

export function TripDispatchLogsPanel({
  orderId,
  serviceType,
  className = "",
}: TripDispatchLogsPanelProps) {
  const { data, isLoading, isError } = useDispatchLogs(orderId, serviceType);
  const logs = data ?? [];
  const exclusions = logs.filter((log) => log.isExclusion);

  return (
    <div
      className={`rounded-card border border-border bg-surface p-5 shadow-card text-sm ${className}`}
    >
      <h3 className="font-semibold text-foreground">Journal dispatch</h3>
      <p className="mt-1 text-xs text-muted">
        Offres, exclusions zone / retour domicile et événements moteur.
      </p>

      <div className="mt-4">
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-lg bg-navy/10" />
        ) : isError ? (
          <p className="text-xs text-amber-700">
            Impossible de charger le journal dispatch.
          </p>
        ) : logs.length === 0 ? (
          <p className="text-xs text-muted">Aucun événement dispatch enregistré.</p>
        ) : (
          <ul className="space-y-3">
            {logs.map((log) => (
              <li
                key={log.id}
                className={`rounded-lg border px-3 py-2 ${
                  log.isExclusion
                    ? "border-amber-200 bg-amber-50/60"
                    : "border-border bg-canvas/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{log.label}</p>
                    {log.message !== log.label && (
                      <p className="mt-0.5 text-xs text-muted">{log.message}</p>
                    )}
                    {log.driverId && (
                      <p className="mt-1 text-xs">
                        <Link
                          href={`/admin/fleet/drivers/${log.driverId}`}
                          className="text-teal hover:underline"
                        >
                          Voir chauffeur
                        </Link>
                      </p>
                    )}
                  </div>
                  <time className="shrink-0 text-xs tabular-nums text-muted">
                    {formatDateTime(log.at)}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {exclusions.length > 0 && (
        <p className="mt-3 text-xs text-amber-800">
          {exclusions.length} exclusion
          {exclusions.length > 1 ? "s" : ""} liée
          {exclusions.length > 1 ? "s" : ""} aux filtres chauffeur (zone / domicile).
        </p>
      )}
    </div>
  );
}
