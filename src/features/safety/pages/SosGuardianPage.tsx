"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Button } from "@/shared/ui/Button";
import { formatDateTime } from "@/shared/lib/format";
import { useSosDashboard } from "../api/sos.queries";
import { SosActiveIncidentCard } from "../components/SosActiveIncidentCard";

export function SosGuardianPage() {
  const { data, isLoading, isError, dataUpdatedAt, isFetching } = useSosDashboard();

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
        breadcrumb={["Admin", "Opérations", "SOS"]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {dataUpdatedAt ? (
              <span className="text-xs text-muted">
                MAJ {formatDateTime(new Date(dataUpdatedAt).toISOString())}
                {isFetching ? " · actualisation…" : ""}
              </span>
            ) : null}
            <Link href="/admin/ops/sos/incidents">
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
              Surveillance temps réel des incidents SOS clients et chauffeurs.
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
            href="/admin/ops/sos/incidents"
            className="mt-4 inline-block text-sm text-teal hover:underline"
          >
            Consulter l&apos;historique
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {active.map((incident) => (
            <SosActiveIncidentCard key={incident.id} incident={incident} />
          ))}
        </div>
      )}
    </div>
  );
}
