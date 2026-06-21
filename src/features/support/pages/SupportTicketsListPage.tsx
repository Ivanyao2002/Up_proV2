"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/core/auth/authStore";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { FilterChips } from "@/shared/ui/FilterChips";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { SelectFilter } from "@/shared/ui/SelectFilter";
import { formatDateTime } from "@/shared/lib/format";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { AdminSupportTicket } from "../api/tickets.service";
import { useSupportTicketsList } from "../api/tickets.queries";
import { useSupportPaths } from "../lib/supportPaths";
import type { AgentReporterType, AgentTicketCategory } from "../api/agentTicket.types";
import { useAssignTicket } from "../api/agentTicket.queries";

// ── Statut ────────────────────────────────────────────────────────
const STATUS_FILTERS: { value: AdminSupportTicket["status"] | "all"; label: string }[] = [
  { value: "all",         label: "Tous" },
  { value: "open",        label: "Non assignés" },
  { value: "in_progress", label: "En cours" },
  { value: "resolved",    label: "Résolus" },
];

const STATUS_LABELS: Record<AdminSupportTicket["status"], string> = {
  open:        "Non assigné",
  in_progress: "En cours",
  resolved:    "Résolu",
};

// ── Type de plaignant ─────────────────────────────────────────────
const REPORTER_FILTERS: { value: AgentReporterType | "all"; label: string }[] = [
  { value: "all",       label: "Tous" },
  { value: "client",    label: "Client" },
  { value: "driver",    label: "Chauffeur" },
  { value: "deliverer", label: "Livreur" },
  { value: "partner",   label: "Partenaire" },
];

const REPORTER_LABELS: Record<AgentReporterType, string> = {
  client:    "Client",
  driver:    "Chauffeur",
  deliverer: "Livreur",
  partner:   "Partenaire",
};

const REPORTER_STYLES: Record<AgentReporterType, string> = {
  client:    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/40",
  driver:    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-900/40",
  deliverer: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-900/40",
  partner:   "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-900/40",
};

// ── Catégorie de réclamation ──────────────────────────────────────
const CATEGORY_CONFIG: Record<AgentTicketCategory, { label: string; className: string }> = {
  payment:   { label: "Paiement",    className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/40" },
  behavior:  { label: "Comportement", className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/40" },
  service:   { label: "Service",     className: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-900/40" },
  logistics: { label: "Logistique",  className: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-900/40" },
  app:       { label: "Application", className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700/40" },
  other:     { label: "Autre",       className: "bg-surface-hover text-muted border-border" },
};

const CATEGORY_FILTERS: { value: AgentTicketCategory | "all"; label: string }[] = [
  { value: "all",       label: "Toutes catégories" },
  { value: "payment",   label: "Paiement" },
  { value: "behavior",  label: "Comportement" },
  { value: "service",   label: "Service" },
  { value: "logistics", label: "Logistique" },
  { value: "app",       label: "Application" },
  { value: "other",     label: "Autre" },
];

const PRIORITY_LABELS: Record<AdminSupportTicket["priority"], string> = {
  low:    "Basse",
  normal: "Normale",
  high:   "Haute",
};

function TicketAssignmentCell({ ticket }: { ticket: AdminSupportTicket }) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const assign = useAssignTicket(ticket.id);
  const assignedToMe =
    ticket.assigned_to_id != null &&
    String(ticket.assigned_to_id) === String(currentUserId);

  if (ticket.assigned_to) {
    return (
      <div>
        <p className="text-sm font-medium text-foreground">
          {assignedToMe ? "Vous" : ticket.assigned_to}
        </p>
        <p className="text-xs text-muted">
          {assignedToMe ? "Pris en charge" : "Déjà assigné"}
        </p>
      </div>
    );
  }

  return (
    <Button
      className="!px-3 !py-2 !text-xs"
      disabled={assign.isPending}
      onClick={() => assign.mutate()}
    >
      {assign.isPending ? "Assignation…" : "S’assigner"}
    </Button>
  );
}

// ── Page ──────────────────────────────────────────────────────────
export function SupportTicketsListPage() {
  const paths = useSupportPaths();

  const [statusFilter,   setStatusFilter]   = useState<AdminSupportTicket["status"] | "all">("all");
  const [reporterFilter, setReporterFilter] = useState<AgentReporterType | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<AgentTicketCategory | "all">("all");

  const table = useServerTableState([statusFilter, reporterFilter, categoryFilter], {
    status:        statusFilter !== "all" ? statusFilter : undefined,
    reporter_type: reporterFilter !== "all" ? reporterFilter : undefined,
    category:      categoryFilter !== "all" ? categoryFilter : undefined,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: statusFilter,   defaultValue: "all", reset: () => setStatusFilter("all") },
      { value: reporterFilter, defaultValue: "all", reset: () => setReporterFilter("all") },
      { value: categoryFilter, defaultValue: "all", reset: () => setCategoryFilter("all") },
    ],
  });

  const { data, isLoading, isError } = useSupportTicketsList(table.listParams);
  const rows = data?.data ?? [];
  const meta = data?.meta;
  const facets = data?.facets?.status;

  // Onglets statut avec compteurs (les clés de facets correspondent aux valeurs de filtre).
  const statusOptions = STATUS_FILTERS.map((f) => ({
    value: f.value,
    label: facets ? `${f.label} (${facets[f.value]})` : f.label,
  }));

  const columns: Column<AdminSupportTicket>[] = [
    {
      id: "id",
      header: "Ticket",
      cell: (t) => (
        <Link href={paths.ticketDetail(t.id)} className="group block">
          <p className="font-mono text-sm font-medium text-foreground group-hover:text-teal-dark">
            {t.id}
          </p>
          {t.trip_ref && (
            <p className="text-xs text-muted">{t.trip_ref}</p>
          )}
        </Link>
      ),
      exportValue: (t) => t.id,
    },
    {
      id: "subject",
      header: "Sujet",
      cell: (t) => (
        <Link href={paths.ticketDetail(t.id)} className="group block max-w-xs">
          <p className="font-medium text-foreground group-hover:text-teal-dark line-clamp-2">{t.subject}</p>
        </Link>
      ),
      exportValue: (t) => t.subject,
    },
    {
      id: "category",
      header: "Catégorie",
      cell: (t) => {
        const cfg = t.category ? CATEGORY_CONFIG[t.category as AgentTicketCategory] : undefined;
        return cfg ? (
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
            {cfg.label}
          </span>
        ) : (
          <span className="text-xs text-muted">{t.category ?? "—"}</span>
        );
      },
      exportValue: (t) => {
        const cfg = t.category ? CATEGORY_CONFIG[t.category as AgentTicketCategory] : undefined;
        return cfg ? cfg.label : (t.category ?? "");
      },
    },
    {
      id: "reporter_type",
      header: "Plaignant",
      cell: (t) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{t.reporter_name}</p>
          <span className={`mt-0.5 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${REPORTER_STYLES[t.reporter_type]}`}>
            {REPORTER_LABELS[t.reporter_type]}
          </span>
        </div>
      ),
      exportValue: (t) => `${t.reporter_name} (${REPORTER_LABELS[t.reporter_type]})`,
    },
    {
      id: "priority",
      header: "Priorité",
      cell: (t) => (
        <span className={`text-xs font-medium ${
          t.priority === "high"   ? "text-red-600 dark:text-red-400" :
          t.priority === "normal" ? "text-foreground" : "text-muted"
        }`}>
          {PRIORITY_LABELS[t.priority]}
        </span>
      ),
      exportValue: (t) => PRIORITY_LABELS[t.priority],
    },
    {
      id: "assignment",
      header: "Prise en charge",
      cell: (t) => <TicketAssignmentCell ticket={t} />,
      exportValue: (t) => t.assigned_to ?? "Non assigné",
    },
    {
      id: "status",
      header: "Statut",
      cell: (t) => (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
          t.status === "resolved"    ? "bg-teal/15 text-teal-dark dark:text-teal"                 :
          t.status === "in_progress" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300" :
                                       "bg-navy/10 text-foreground"
        }`}>
          {STATUS_LABELS[t.status]}
        </span>
      ),
      exportValue: (t) => STATUS_LABELS[t.status],
    },
    {
      id: "updated",
      header: "Mis à jour",
      cell: (t) => (
        <span className="whitespace-nowrap text-xs text-muted">{formatDateTime(t.updated_at)}</span>
      ),
      exportValue: (t) => t.updated_at,
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les réclamations.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Réclamations" breadcrumb={["Support"]} />
      <p className="-mt-2 mb-4 text-sm text-muted">
        Plaintes des clients, chauffeurs et livreurs — prenez en charge un ticket pour ouvrir la conversation.
      </p>

      {/* Onglets statut avec compteurs */}
      <div className="mb-4">
        <FilterChips
          size="sm"
          options={statusOptions}
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            table.setPage(1);
          }}
        />
      </div>

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Rechercher par sujet, déclarant, référence…"
        totalLabel={meta ? `${meta.total} réclamation${meta.total !== 1 ? "s" : ""}` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <SelectFilter
          label="Catégorie"
          options={CATEGORY_FILTERS}
          value={categoryFilter}
          onChange={(value) => {
            setCategoryFilter(value);
            table.setPage(1);
          }}
          wide
        />
        <SelectFilter
          label="Type de plaignant"
          options={REPORTER_FILTERS}
          value={reporterFilter}
          onChange={(value) => {
            setReporterFilter(value);
            table.setPage(1);
          }}
          wide
        />
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(t) => t.id}
        isLoading={isLoading}
        exportFileName="reclamations-support"
        emptyTitle="Aucune réclamation"
        emptyDescription="Aucune réclamation ne correspond aux filtres sélectionnés."
        serverPagination={serverPaginationFromMeta(meta, table.setPage, table.setPageSize)}
      />
    </div>
  );
}
