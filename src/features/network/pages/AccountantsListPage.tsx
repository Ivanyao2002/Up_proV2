"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { EntityStatusPill } from "@/shared/ui/EntityStatusPill";
import { Button } from "@/shared/ui/Button";
import { formatDateTime } from "@/shared/lib/format";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { AccountantListItem } from "../api/adminAccountants.types";
import {
  useAccountantsList,
  useActivateAccountant,
  useSuspendAccountant,
} from "../api/adminAccountants.queries";

function statusForPill(status: string): "active" | "pending" | "suspended" {
  const key = status.toLowerCase();
  if (key === "suspended" || key === "inactive") return "suspended";
  if (key === "pending") return "pending";
  return "active";
}

export function AccountantsListPage() {
  const router = useRouter();
  const table = useServerTableState([]);
  const { data, isLoading, isError } = useAccountantsList(table.listParams);
  const suspend = useSuspendAccountant();
  const activate = useActivateAccountant();
  const [actionId, setActionId] = useState<string | null>(null);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<AccountantListItem>[] = [
    {
      id: "name",
      header: "Comptable",
      cell: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.displayName}</p>
          <p className="text-xs text-muted">{row.email}</p>
        </div>
      ),
      exportValue: (row) => `${row.displayName} (${row.email})`,
    },
    {
      id: "country",
      header: "Pays",
      cell: (row) => row.country?.name ?? row.country?.code ?? "—",
      exportValue: (row) => row.country?.name ?? "",
    },
    {
      id: "status",
      header: "Statut",
      cell: (row) => <EntityStatusPill status={statusForPill(row.status)} />,
      exportValue: (row) => row.status,
    },
    {
      id: "created",
      header: "Créé le",
      cell: (row) => (row.createdAt ? formatDateTime(row.createdAt) : "—"),
      exportValue: (row) => row.createdAt ?? "",
    },
    {
      id: "actions",
      header: "",
      cell: (row) => {
        const isSuspended = statusForPill(row.status) === "suspended";
        const busy = actionId === row.userId && (suspend.isPending || activate.isPending);
        return (
          <Button
            variant="secondary"
            className="px-3 py-1.5 text-xs"
            disabled={busy}
            onClick={() => {
              setActionId(row.userId);
              const action = isSuspended ? activate : suspend;
              action.mutate(row.userId, { onSettled: () => setActionId(null) });
            }}
          >
            {isSuspended ? "Réactiver" : "Suspendre"}
          </Button>
        );
      },
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les comptables.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Comptables"
        breadcrumb={["Admin", "Réseau"]}
        actions={
          <Button variant="primary" onClick={() => router.push("/admin/network/accountants/new")}>
            Nouveau comptable
          </Button>
        }
      />
      <p className="mb-6 text-sm text-muted">
        Un comptable par pays — accès au portail <code className="rounded bg-canvas px-1">/compta</code>.
      </p>

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Email, nom…"
        totalLabel={meta ? `${meta.total} comptables` : undefined}
      />

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.userId}
        isLoading={isLoading}
        exportFileName="comptables"
        emptyTitle="Aucun comptable"
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
