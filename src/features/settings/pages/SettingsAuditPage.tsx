"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { SearchInput } from "@/shared/ui/SearchInput";
import { formatDateTime } from "@/shared/lib/format";
import { useMemo, useState } from "react";
import type { AuditLogEntry } from "../api/settingsExtended.service";
import { useAuditLog } from "../api/settingsExtended.queries";

export function SettingsAuditPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useAuditLog();

  const rows = useMemo(() => {
    const list = data?.data ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (e) =>
        e.actor_email.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        e.resource.toLowerCase().includes(q) ||
        e.detail.toLowerCase().includes(q)
    );
  }, [data?.data, search]);

  const columns: Column<AuditLogEntry>[] = [
    {
      id: "at",
      header: "Date",
      cell: (e) => formatDateTime(e.at),
      exportValue: (e) => e.at,
    },
    {
      id: "actor",
      header: "Acteur",
      cell: (e) => <span className="text-sm">{e.actor_email}</span>,
      exportValue: (e) => e.actor_email,
    },
    {
      id: "action",
      header: "Action",
      cell: (e) => <span className="font-mono text-xs text-muted">{e.action}</span>,
      exportValue: (e) => e.action,
    },
    {
      id: "resource",
      header: "Ressource",
      cell: (e) => <span className="font-medium text-navy">{e.resource}</span>,
      exportValue: (e) => e.resource,
    },
    {
      id: "detail",
      header: "Détail",
      cell: (e) => <span className="text-sm text-muted">{e.detail}</span>,
      exportValue: (e) => e.detail,
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger le journal d&apos;audit.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Journal d'audit" breadcrumb={["Admin", "Paramètres"]} />

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Filtrer par acteur, action, ressource…"
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(e) => e.id}
        isLoading={isLoading}
        exportFileName="audit-log"
        emptyTitle="Aucune entrée"
      />
    </div>
  );
}
