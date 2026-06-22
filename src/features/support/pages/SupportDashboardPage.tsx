"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { SupportDashboardSkeleton } from "@/shared/ui/skeletons";
import { formatDateTime } from "@/shared/lib/format";
import { TicketStatusBadge } from "../components/TicketStatusBadge";
import { TicketPriorityBadge } from "../components/TicketPriorityBadge";
import {
  useSupportDashboardStats,
  useSupportDashboardRecent,
} from "../api/supportAudit.queries";
import { useSupportPaths } from "../lib/supportPaths";
import { SEVERITY_DOT } from "../lib/auditConstants";

export function SupportDashboardPage() {
  const paths = useSupportPaths();
  const { data: stats,  isLoading: statsLoading  } = useSupportDashboardStats();
  const { data: recent, isLoading: recentLoading } = useSupportDashboardRecent();

  if (statsLoading || recentLoading) {
    return <SupportDashboardSkeleton />;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Tableau de bord" breadcrumb={["Support"]} />

      {/* ── KPI strip ─────────────────────────────────────────────── */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Tickets ouverts"
          value={stats ? String(stats.open_tickets) : "—"}
          hint={`${stats?.in_progress_tickets ?? "—"} en cours de traitement`}
          index={0}
        />
        <KpiCard
          label="Escaladés"
          value={stats ? String(stats.escalated_tickets) : "—"}
          hint="En attente de Central"
          index={1}
        />
        <KpiCard
          label="Anomalies du jour"
          value={stats ? String(stats.anomalies_today) : "—"}
          hint="Niveaux warning et critique"
          index={2}
        />
        <KpiCard
          label="Chats actifs"
          value={stats ? String(stats.active_chat_conversations) : "—"}
          hint={`${stats?.resolved_today ?? "—"} tickets résolus aujourd'hui`}
          index={3}
        />
      </div>

      {/* ── Main layout ───────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

        {/* Tickets en attente */}
        <div className="rounded-card border border-border bg-surface shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-heading">Tickets en attente</h2>
            <Link href={paths.tickets} className="text-xs text-teal hover:underline">
              Voir tous →
            </Link>
          </div>

          <div className="divide-y divide-border">
            {!recent?.recent_tickets.length ? (
              <p className="px-5 py-6 text-center text-sm text-muted">
                Aucun ticket en attente.
              </p>
            ) : (
              recent.recent_tickets.map((t) => (
                <Link
                  key={t.id}
                  href={paths.ticketDetail(t.id)}
                  className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-hover"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground group-hover:text-teal-dark">
                      {t.subject}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {t.reporter_name} · {t.franchise_name}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <TicketPriorityBadge priority={t.priority} />
                    <TicketStatusBadge status={t.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-4">

          {/* Anomalies récentes */}
          <div className="rounded-card border border-border bg-surface shadow-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold text-heading">Anomalies récentes</h2>
              <Link href={paths.anomaliesAudit} className="text-xs text-teal hover:underline">
                Journal →
              </Link>
            </div>

            <div className="divide-y divide-border">
              {!recent?.recent_anomalies.length ? (
                <p className="px-5 py-4 text-center text-sm text-muted">
                  Aucune anomalie récente.
                </p>
              ) : (
                recent.recent_anomalies.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                    <span
                      className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${
                        SEVERITY_DOT[a.severity]
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">
                        {a.resource_label ?? a.action}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted">{a.detail}</p>
                      <p className="mt-0.5 text-xs text-muted">{formatDateTime(a.at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat franchises */}
          <Link
            href={paths.chat}
            className="group flex items-center justify-between rounded-card border border-border bg-surface px-5 py-4 shadow-card transition-all hover:border-teal/35"
          >
            <div>
              <p className="text-sm font-semibold text-heading group-hover:text-teal-dark">
                Chat franchises
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {stats
                  ? `${stats.active_chat_conversations} conversation${stats.active_chat_conversations !== 1 ? "s" : ""} active${stats.active_chat_conversations !== 1 ? "s" : ""}`
                  : "Chargement…"}
              </p>
            </div>
            <span className="text-teal transition-transform group-hover:translate-x-0.5">→</span>
          </Link>

          {/* Historique des réclamations */}
          <Link
            href={paths.anomaliesAudit}
            className="group flex items-center justify-between rounded-card border border-border bg-surface px-5 py-4 shadow-card transition-all hover:border-teal/35"
          >
            <div>
              <p className="text-sm font-semibold text-heading group-hover:text-teal-dark">
                Historique des réclamations
              </p>
              <p className="mt-0.5 text-xs text-muted">
                Actions réalisées sur les tickets
              </p>
            </div>
            <span className="text-teal transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
