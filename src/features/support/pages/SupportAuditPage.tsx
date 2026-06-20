"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { SelectFilter } from "@/shared/ui/SelectFilter";
import { ModalPortal } from "@/shared/ui/ModalPortal";
import { formatDateTime } from "@/shared/lib/format";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import { useSupportAuditLog } from "../api/supportAudit.queries";
import { useSupportPaths } from "../lib/supportPaths";
import type {
  SupportAuditAction,
  SupportAuditCategory,
  SupportAuditEvent,
  SupportAuditSeverity,
} from "../api/supportAudit.types";

// ── Severity ─────────────────────────────────────────────────────
const SEVERITY_CONFIG: Record<
  SupportAuditSeverity,
  { label: string; className: string }
> = {
  info: {
    label: "Info",
    className:
      "text-blue-700 bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/40",
  },
  warning: {
    label: "Avertissement",
    className:
      "text-amber-700 bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/40",
  },
  critical: {
    label: "Critique",
    className:
      "text-red-700 bg-red-50 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/40",
  },
};

function SeverityBadge({ severity }: { severity: SupportAuditSeverity }) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

const ACTION_LABELS: Record<SupportAuditAction, string> = {
  "ticket.assigned": "Prise en charge",
  "ticket.message_sent": "Réponse envoyée",
  "ticket.note_added": "Note interne",
  "ticket.justification_requested": "Justificatif demandé",
  "ticket.resolved": "Réclamation résolue",
  "ticket.closed": "Réclamation clôturée",
  "ticket.escalated": "Réclamation escaladée",
  "sanction.applied": "Sanction appliquée",
  "compensation.applied": "Geste commercial",
  "chat.message_sent": "Message de chat",
  "auth.login": "Connexion",
  "auth.logout": "Déconnexion",
};

const SANCTION_LABELS = {
  warning: "Avertissement",
  surveillance: "Mise sous surveillance",
  quality_points: "Retrait de points qualité",
  suspension: "Suspension temporaire",
} as const;

const COMPENSATION_LABELS = {
  percentage_discount: "Réduction en pourcentage",
  fixed_discount: "Réduction fixe",
  free_service: "Service offert",
} as const;

function getActionSubtype(event: SupportAuditEvent): string | null {
  const metadata = event.metadata;
  if (metadata?.sanction_type) return SANCTION_LABELS[metadata.sanction_type];
  if (metadata?.compensation_type) {
    const value =
      metadata.discount_value != null
        ? ` · ${metadata.discount_value}${
            metadata.compensation_type === "percentage_discount" ? "%" : " FCFA"
          }`
        : "";
    return `${COMPENSATION_LABELS[metadata.compensation_type]}${value}`;
  }
  return null;
}

// ── Filters ───────────────────────────────────────────────────────
const SEVERITY_FILTERS = [
  { value: "all" as const, label: "Tous niveaux" },
  { value: "info" as const, label: "Info" },
  { value: "warning" as const, label: "Avertissement" },
  { value: "critical" as const, label: "Critique" },
];

const CATEGORY_FILTERS: { value: SupportAuditCategory | "all"; label: string }[] = [
  { value: "all",          label: "Toutes catégories" },
  { value: "ticket",       label: "Réclamations" },
  { value: "compensation", label: "Gestes commerciaux" },
  { value: "sanction",     label: "Sanctions" },
  { value: "escalation",   label: "Escalades" },
  { value: "chat",         label: "Messages chat" },
  { value: "auth",         label: "Connexions" },
];

const ACTION_FILTERS: { value: SupportAuditAction | "all"; label: string }[] = [
  { value: "all", label: "Toutes les actions" },
  { value: "ticket.assigned", label: "Prises en charge" },
  { value: "ticket.message_sent", label: "Réponses" },
  { value: "ticket.note_added", label: "Notes internes" },
  { value: "ticket.justification_requested", label: "Justificatifs" },
  { value: "sanction.applied", label: "Sanctions" },
  { value: "compensation.applied", label: "Gestes commerciaux" },
  { value: "ticket.resolved", label: "Résolutions" },
  { value: "ticket.closed", label: "Clôtures" },
  { value: "ticket.escalated", label: "Escalades" },
];

const DATE_PRESETS = [
  { value: "all", label: "Toute la période" },
  { value: "today", label: "Aujourd'hui" },
  { value: "7d", label: "7 derniers jours" },
  { value: "30d", label: "30 derniers jours" },
] as const;
type DatePreset = (typeof DATE_PRESETS)[number]["value"];

function getDateFrom(preset: DatePreset): string | undefined {
  const now = new Date();
  if (preset === "today") return now.toISOString().split("T")[0];
  if (preset === "7d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  }
  if (preset === "30d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  }
  return undefined;
}

// ── Detail modal ─────────────────────────────────────────────────
const CATEGORY_LABELS: Record<SupportAuditEvent["category"], string> = {
  ticket:       "Réclamation",
  compensation: "Geste commercial",
  sanction:     "Sanction",
  escalation:   "Escalade",
  chat:         "Chat",
  auth:         "Authentification",
};

const META_LABELS: Record<string, string> = {
  sanction_type:      "Type de sanction",
  compensation_type:  "Type de compensation",
  discount_value:     "Valeur",
  promo_code:         "Code promo",
  message_type:       "Type de message",
  transition_note:    "Note de transition",
};

function AuditDetailModal({
  event,
  onClose,
  paths,
}: {
  event: SupportAuditEvent;
  onClose: () => void;
  paths: ReturnType<typeof import("../lib/supportPaths").useSupportPaths>;
}) {
  const subtype = getActionSubtype(event);
  const meta = event.metadata;
  const metaEntries = meta
    ? (Object.entries(meta) as [string, unknown][]).filter(([, v]) => v != null)
    : [];

  return (
    <ModalPortal>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-hidden bg-surface shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div className="min-w-0 flex-1 pr-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              {CATEGORY_LABELS[event.category]}
            </p>
            <h2 className="mt-0.5 text-base font-semibold text-heading">
              {ACTION_LABELS[event.action]}
            </h2>
            {subtype && <p className="mt-0.5 text-sm text-muted">{subtype}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <SeverityBadge severity={event.severity} />
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-foreground"
              aria-label="Fermer"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Horodatage */}
          <section>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">Horodatage</p>
            <p className="text-sm text-foreground">{formatDateTime(event.at)}</p>
          </section>

          {/* Acteur */}
          <section>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">Agent</p>
            <p className="text-sm font-medium text-foreground">{event.actor_name}</p>
            <p className="text-xs text-muted">{event.actor_email}</p>
          </section>

          {/* Ressource */}
          {event.resource_id && (
            <section>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">Ressource</p>
              <Link
                href={paths.ticketDetail(event.resource_id)}
                onClick={onClose}
                className="inline-flex items-center gap-1 text-sm font-medium text-teal hover:underline"
              >
                {event.resource_label ?? event.resource_id}
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
              <p className="text-xs text-muted">{event.resource_id}</p>
            </section>
          )}

          {/* Détail */}
          <section>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">Détail</p>
            <p className="rounded-lg bg-canvas px-3 py-2.5 text-sm text-foreground leading-relaxed">
              {event.detail}
            </p>
          </section>

          {/* Métadonnées */}
          {metaEntries.length > 0 && (
            <section>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">Métadonnées</p>
              <dl className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                {metaEntries.map(([key, value]) => (
                  <div key={key} className="flex items-baseline justify-between gap-4 px-3 py-2">
                    <dt className="text-xs text-muted shrink-0">
                      {META_LABELS[key] ?? key}
                    </dt>
                    <dd className="text-xs font-medium text-foreground text-right break-all">
                      {String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* ID technique */}
          <section>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">ID d'audit</p>
            <p className="font-mono text-xs text-muted">{event.id}</p>
          </section>
        </div>
      </div>
    </ModalPortal>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export function SupportAuditPage() {
  const paths = useSupportPaths();
  const [severityFilter, setSeverityFilter] = useState<SupportAuditSeverity | "all">("all");
  const [actionFilter,   setActionFilter]   = useState<SupportAuditAction | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<SupportAuditCategory | "all">("all");
  const [datePreset,     setDatePreset]     = useState<DatePreset>("all");
  const [selectedEvent,  setSelectedEvent]  = useState<SupportAuditEvent | null>(null);

  const table = useServerTableState(
    [severityFilter, actionFilter, categoryFilter, datePreset],
    {
      date_from: getDateFrom(datePreset),
      date_to:   datePreset !== "all" ? new Date().toISOString().split("T")[0] : undefined,
    }
  );

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: severityFilter,  defaultValue: "all", reset: () => setSeverityFilter("all") },
      { value: actionFilter,    defaultValue: "all", reset: () => setActionFilter("all") },
      { value: categoryFilter,  defaultValue: "all", reset: () => setCategoryFilter("all") },
      { value: datePreset,      defaultValue: "all", reset: () => setDatePreset("all") },
    ],
  });

  const { data, isLoading, isError } = useSupportAuditLog({
    ...table.listParams,
    severity: severityFilter !== "all" ? severityFilter : undefined,
    action:   actionFilter   !== "all" ? actionFilter   : undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
  });
  const rows: SupportAuditEvent[] = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<SupportAuditEvent>[] = [
    {
      id: "at",
      header: "Date",
      cell: (e) => (
        <span className="whitespace-nowrap text-sm text-muted">{formatDateTime(e.at)}</span>
      ),
      exportValue: (e) => e.at,
    },
    {
      id: "actor",
      header: "Acteur",
      cell: (e) => (
        <div>
          <p className="text-sm font-medium text-foreground">{e.actor_name}</p>
          <p className="text-xs text-muted">{e.actor_email}</p>
        </div>
      ),
      exportValue: (e) => e.actor_email,
    },
    {
      id: "severity",
      header: "Niveau",
      cell: (e) => <SeverityBadge severity={e.severity} />,
      exportValue: (e) => e.severity,
    },
    {
      id: "action",
      header: "Action réalisée",
      cell: (e) => {
        const subtype = getActionSubtype(e);
        return (
          <div>
            <p className="text-sm font-medium text-foreground">
              {ACTION_LABELS[e.action]}
            </p>
            {subtype && <p className="text-xs text-muted">{subtype}</p>}
          </div>
        );
      },
      exportValue: (e) => ACTION_LABELS[e.action],
    },
    {
      id: "resource",
      header: "Ressource",
      cell: (e) =>
        e.resource_id ? (
          <Link
            href={paths.ticketDetail(e.resource_id)}
            className="text-xs text-teal hover:underline"
            onClick={(ev) => ev.stopPropagation()}
          >
            {e.resource_label ?? e.resource_id}
          </Link>
        ) : (
          <span className="text-xs text-muted">—</span>
        ),
      exportValue: (e) => e.resource_label ?? e.resource_id ?? "",
    },
    {
      id: "detail",
      header: "Détail",
      cell: (e) => (
        <span className="max-w-xs text-xs text-muted">{e.detail}</span>
      ),
      exportValue: (e) => e.detail,
    },
    {
      id: "actions",
      header: "",
      cell: (e) => (
        <button
          type="button"
          onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); }}
          className="rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
          title="Voir les détails"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ),
      exportValue: () => "",
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Historique des réclamations"
        breadcrumb={["Support", "Réclamations", "Historique"]}
      />
      <p className="-mt-2 mb-6 text-sm text-muted">
        Chaque action réalisée sur une réclamation est enregistrée automatiquement avec son agent et son horodatage.
      </p>

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Rechercher un ticket, un agent ou une action…"
        totalLabel={meta ? `${meta.total} action${meta.total !== 1 ? "s" : ""}` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <SelectFilter
          label="Période"
          value={datePreset}
          onChange={(value) => {
            setDatePreset(value);
            table.setPage(1);
          }}
          options={[...DATE_PRESETS]}
        />

        <SelectFilter
          label="Niveau"
          value={severityFilter}
          onChange={(value) => {
            setSeverityFilter(value);
            table.setPage(1);
          }}
          options={SEVERITY_FILTERS}
        />

        <SelectFilter
          label="Catégorie"
          value={categoryFilter}
          onChange={(value) => {
            setCategoryFilter(value);
            table.setPage(1);
          }}
          options={CATEGORY_FILTERS}
          wide
        />

        <SelectFilter
          label="Action"
          value={actionFilter}
          onChange={(value) => {
            setActionFilter(value);
            table.setPage(1);
          }}
          options={ACTION_FILTERS}
          wide
        />
      </TableFiltersBar>

      <DataTable<SupportAuditEvent>
        columns={columns}
        data={rows}
        rowKey={(e) => e.id}
        isLoading={isLoading}
        exportFileName="journal-audit-support"
        emptyTitle="Aucune action enregistrée"
        emptyDescription={isError ? "L'historique des réclamations n'est pas disponible." : "Aucune action ne correspond aux filtres sélectionnés."}
        serverPagination={serverPaginationFromMeta(meta, table.setPage, table.setPageSize)}
      />

      {selectedEvent && (
        <AuditDetailModal
          event={selectedEvent}
          paths={paths}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
