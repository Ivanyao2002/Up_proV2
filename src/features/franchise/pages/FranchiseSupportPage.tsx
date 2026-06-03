"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { formatDateTime } from "@/shared/lib/format";
import type { FranchiseSupportTicket } from "../api/promos.service";
import { useFranchiseSupportTickets } from "../api/promos.queries";

const PRIORITY_LABELS: Record<FranchiseSupportTicket["priority"], string> = {
  low: "Basse",
  normal: "Normale",
  high: "Haute",
};

const STATUS_LABELS: Record<FranchiseSupportTicket["status"], string> = {
  open: "Ouvert",
  in_progress: "En cours",
  resolved: "Résolu",
};

export function FranchiseSupportPage() {
  const { data, isLoading, isError } = useFranchiseSupportTickets();

  const columns: Column<FranchiseSupportTicket>[] = [
    {
      id: "id",
      header: "Ticket",
      cell: (t) => (
        <div>
          <p className="font-mono font-medium text-navy">{t.id}</p>
          <p className="text-xs text-muted">{t.category}</p>
        </div>
      ),
      exportValue: (t) => t.id,
    },
    {
      id: "subject",
      header: "Sujet",
      cell: (t) => (
        <div>
          <p className="text-sm font-medium text-[#212529]">{t.subject}</p>
          <p className="text-xs text-muted">{t.partner_name}</p>
        </div>
      ),
      exportValue: (t) => t.subject,
    },
    {
      id: "priority",
      header: "Priorité",
      cell: (t) => (
        <span
          className={`text-xs font-medium ${
            t.priority === "high"
              ? "text-red-600"
              : t.priority === "normal"
                ? "text-navy"
                : "text-muted"
          }`}
        >
          {PRIORITY_LABELS[t.priority]}
        </span>
      ),
      exportValue: (t) => PRIORITY_LABELS[t.priority],
    },
    {
      id: "status",
      header: "Statut",
      cell: (t) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            t.status === "resolved"
              ? "bg-teal/15 text-teal-dark"
              : t.status === "in_progress"
                ? "bg-amber-50 text-amber-700"
                : "bg-navy/10 text-navy"
          }`}
        >
          {STATUS_LABELS[t.status]}
        </span>
      ),
      exportValue: (t) => STATUS_LABELS[t.status],
    },
    {
      id: "updated",
      header: "Mis à jour",
      cell: (t) => formatDateTime(t.updated_at),
      exportValue: (t) => t.updated_at,
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger le support.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Support partenaires"
        breadcrumb={["Franchise", "Support"]}
      />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        rowKey={(t) => t.id}
        isLoading={isLoading}
        exportFileName="tickets-support"
        emptyTitle="Aucun ticket ouvert"
      />
    </div>
  );
}
