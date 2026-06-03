"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { FilterChips } from "@/shared/ui/FilterChips";
import { SearchInput } from "@/shared/ui/SearchInput";
import { formatDateTime } from "@/shared/lib/format";
import type { AdminSupportTicket } from "../api/tickets.service";
import { useSupportTicketsList } from "../api/tickets.queries";

const STATUS_FILTERS = [
  { value: "all" as const, label: "Tous" },
  { value: "open" as const, label: "Ouverts" },
  { value: "in_progress" as const, label: "En cours" },
  { value: "resolved" as const, label: "Résolus" },
];

const STATUS_LABELS: Record<AdminSupportTicket["status"], string> = {
  open: "Ouvert",
  in_progress: "En cours",
  resolved: "Résolu",
};

const PRIORITY_LABELS: Record<AdminSupportTicket["priority"], string> = {
  low: "Basse",
  normal: "Normale",
  high: "Haute",
};

export function SupportTicketsListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    AdminSupportTicket["status"] | "all"
  >("all");
  const { data, isLoading, isError } = useSupportTicketsList();

  const rows = useMemo(() => {
    let list = data?.data ?? [];
    if (statusFilter !== "all") list = list.filter((t) => t.status === statusFilter);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (t) =>
        t.subject.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.reporter_name.toLowerCase().includes(q)
    );
  }, [data?.data, search, statusFilter]);

  const columns: Column<AdminSupportTicket>[] = [
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
          <p className="font-medium text-[#212529]">{t.subject}</p>
          <p className="text-xs text-muted">{t.reporter_name}</p>
        </div>
      ),
      exportValue: (t) => t.subject,
    },
    {
      id: "franchise",
      header: "Franchise",
      cell: (t) => t.franchise_name,
      exportValue: (t) => t.franchise_name,
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
      id: "actions",
      header: "",
      cell: (t) =>
        t.category === "dispute" && t.dispute_id ? (
          <Link
            href={`/admin/support/disputes/${t.dispute_id}`}
            className="text-sm text-teal hover:underline"
          >
            Voir litige
          </Link>
        ) : null,
      exportValue: () => "",
    },
    {
      id: "updated",
      header: "Mis à jour",
      cell: (t) => formatDateTime(t.updated_at),
      exportValue: (t) => t.updated_at,
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les tickets.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Tickets support" breadcrumb={["Admin", "Support"]} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Rechercher un ticket…"
          />
        </div>
        <FilterChips
          options={STATUS_FILTERS}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(t) => t.id}
        isLoading={isLoading}
        exportFileName="tickets-support"
        emptyTitle="Aucun ticket"
      />
    </div>
  );
}
