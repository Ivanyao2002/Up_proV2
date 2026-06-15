"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { FilterChips } from "@/shared/ui/FilterChips";
import { formatDateTime } from "@/shared/lib/format";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type {
  FranchiseSupportChat,
  SupportReporterType,
} from "../api/support.service";
import { useFranchiseSupportChats } from "../api/support.queries";

const REPORTER_LABELS: Record<SupportReporterType, string> = {
  partner: "Partenaire",
  driver: "Chauffeur",
  client: "Client",
};

const TYPE_FILTERS = [
  { value: "all" as const, label: "Tous" },
  { value: "partner" as const, label: "Partenaires" },
  { value: "driver" as const, label: "Chauffeurs" },
  { value: "client" as const, label: "Clients" },
];

const STATUS_FILTERS = [
  { value: "all" as const, label: "Tous" },
  { value: "open" as const, label: "Ouverts" },
  { value: "closed" as const, label: "Clôturés" },
];

export function FranchiseSupportChatListPage() {
  const [typeFilter, setTypeFilter] = useState<SupportReporterType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<FranchiseSupportChat["status"] | "all">(
    "all"
  );

  const table = useServerTableState([typeFilter, statusFilter], {
    type: typeFilter !== "all" ? typeFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: typeFilter, defaultValue: "all", reset: () => setTypeFilter("all") },
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
    ],
  });

  const { data, isLoading, isError } = useFranchiseSupportChats(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<FranchiseSupportChat>[] = [
    {
      id: "participant",
      header: "Conversation",
      cell: (c) => (
        <Link href={`/franchise/support/chat/${c.id}`} className="block hover:opacity-90">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{c.participant_name}</p>
              <p className="text-xs text-muted">
                {REPORTER_LABELS[c.participant_type]}
                {c.subject ? ` · ${c.subject}` : ""}
              </p>
              <p className="mt-1 truncate text-sm text-muted">{c.last_message_preview}</p>
            </div>
            {c.unread_count > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-teal px-1.5 text-[10px] font-bold text-white">
                {c.unread_count}
              </span>
            )}
          </div>
        </Link>
      ),
      exportValue: (c) => c.participant_name,
    },
    {
      id: "status",
      header: "Statut",
      cell: (c) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            c.status === "open"
              ? "bg-teal/15 text-teal-dark"
              : "bg-canvas text-muted"
          }`}
        >
          {c.status === "open" ? "Ouvert" : "Clôturé"}
        </span>
      ),
      exportValue: (c) => c.status,
    },
    {
      id: "updated",
      header: "Dernière activité",
      cell: (c) => formatDateTime(c.updated_at),
      exportValue: (c) => c.updated_at,
    },
  ];

  if (isError) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger les conversations.{" "}
        <Link href="/franchise/support/chat" className="text-teal underline">
          Réessayer
        </Link>
      </p>
    );
  }

  const openCount = rows.filter((c) => c.status === "open").length;
  const unreadTotal = rows.reduce((sum, c) => sum + (c.unread_count ?? 0), 0);

  return (
    <div className="animate-fade-up">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader title="Chat" breadcrumb={["Franchise", "Support", "Chat"]} />
        {meta && (
          <p className="mt-1 text-sm text-muted">
            {meta.total} conversation{meta.total > 1 ? "s" : ""} · {openCount} ouverte{openCount > 1 ? "s" : ""}{unreadTotal > 0 ? ` · ${unreadTotal} non lu${unreadTotal > 1 ? "s" : ""}` : ""}
          </p>
        )}
      </div>

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Nom, sujet, message…"
        totalLabel={meta ? `${meta.total} conversations` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <FilterChips options={TYPE_FILTERS} value={typeFilter} onChange={setTypeFilter} />
        <FilterChips
          options={STATUS_FILTERS}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        exportFileName="chat-support-franchise"
        emptyTitle="Aucune conversation"
        pagination={false}
        serverPagination={serverPaginationFromMeta(
          meta,
          table.setPage,
          table.setPageSize
        )}
      />
    </div>
  );
}
