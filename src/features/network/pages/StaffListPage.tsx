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
import { getAdminStaffConfig, type AdminStaffKind } from "../api/adminStaff.config";
import type { StaffListItem } from "../api/adminStaff.types";
import {
  useActivateStaff,
  useStaffList,
  useSuspendStaff,
} from "../api/adminStaff.queries";

function statusForPill(status: string): "active" | "pending" | "suspended" {
  const key = status.toLowerCase();
  if (key === "suspended" || key === "inactive" || key === "blocked") return "suspended";
  if (key === "pending") return "pending";
  return "active";
}

export function StaffListPage({ kind }: { kind: AdminStaffKind }) {
  const config = getAdminStaffConfig(kind);
  const router = useRouter();
  const table = useServerTableState([]);
  const { data, isLoading, isError } = useStaffList(kind, table.listParams);
  const suspend = useSuspendStaff(kind);
  const activate = useActivateStaff(kind);
  const [actionId, setActionId] = useState<string | null>(null);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<StaffListItem>[] = [
    {
      id: "name",
      header: config.titleSingular,
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
            data-row-action
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
    return (
      <p className="text-sm text-red-600">
        Impossible de charger les {config.titlePlural.toLowerCase()}.
      </p>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={config.titlePlural}
        breadcrumb={["Admin", "Réseau", "Personnel siège"]}
        actions={
          <Button variant="primary" onClick={() => router.push(config.newPath)}>
            Nouveau — {config.titleSingular.toLowerCase()}
          </Button>
        }
      />
      <p className="mb-6 text-sm text-muted">
        Accès portail{" "}
        <code className="rounded bg-canvas px-1">{config.portalLoginPath}</code>
        {" · "}
        {config.countryHint}
      </p>

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Email, nom…"
        totalLabel={meta ? `${meta.total} comptes` : undefined}
      />

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.userId}
        isLoading={isLoading}
        exportFileName={config.kind}
        emptyTitle={`Aucun ${config.titleSingular.toLowerCase()}`}
        pagination={false}
        serverPagination={serverPaginationFromMeta(meta, table.setPage, table.setPageSize)}
      />
    </div>
  );
}
