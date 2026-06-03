"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { Button } from "@/shared/ui/Button";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { formatDateTime } from "@/shared/lib/format";
import { usePermission } from "@/core/auth/usePermission";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { KycQueueItem } from "@/shared/types";
import {
  useApproveFranchiseDriverKyc,
  useFranchiseKycQueue,
  useRejectFranchiseDriverKyc,
} from "../api/drivers.queries";

function WaitingBadge({ hours }: { hours: number }) {
  const urgent = hours >= 12;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        urgent ? "bg-amber-50 text-amber-700" : "bg-canvas text-muted"
      }`}
    >
      {hours}h d&apos;attente
    </span>
  );
}

export function FranchiseKycModerationPage() {
  const canModerate = usePermission("fleet.kyc.approve");
  const table = useServerTableState();

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
  });

  const { data, isLoading, isError } = useFranchiseKycQueue(table.listParams);
  const [approveId, setApproveId] = useState<number | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);

  const approveMutation = useApproveFranchiseDriverKyc();
  const rejectMutation = useRejectFranchiseDriverKyc();

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<KycQueueItem>[] = [
    {
      id: "driver",
      header: "Chauffeur",
      cell: (row) => (
        <div>
          <Link
            href={`/franchise/drivers/${row.driver_id}`}
            className="font-medium text-foreground hover:text-teal"
          >
            {row.first_name} {row.last_name}
          </Link>
          <p className="text-xs text-muted">{row.phone}</p>
        </div>
      ),
      exportValue: (row) => `${row.first_name} ${row.last_name}`,
    },
    {
      id: "owner",
      header: "Partenaire",
      cell: (row) => row.owner_name,
      exportValue: (row) => row.owner_name,
    },
    {
      id: "zone",
      header: "Zone",
      cell: (row) => row.zone,
      exportValue: (row) => row.zone,
    },
    {
      id: "docs",
      header: "Documents",
      cell: (row) => (
        <span className="text-sm">
          <span className="font-medium text-amber-700">{row.documents_pending}</span>
          <span className="text-muted"> en attente</span>
          {row.documents_rejected > 0 && (
            <span className="text-red-600"> · {row.documents_rejected} rejeté(s)</span>
          )}
        </span>
      ),
      exportValue: (row) => `${row.documents_pending} pending`,
    },
    {
      id: "submitted",
      header: "Soumis",
      cell: (row) => (
        <span className="text-sm text-muted">{formatDateTime(row.submitted_at)}</span>
      ),
      exportValue: (row) => formatDateTime(row.submitted_at),
    },
    {
      id: "wait",
      header: "Priorité",
      cell: (row) => <WaitingBadge hours={row.waiting_hours} />,
      exportValue: (row) => `${row.waiting_hours}h`,
    },
    {
      id: "actions",
      header: "",
      cell: (row) =>
        canModerate ? (
          <div className="flex gap-2">
            <Button
              variant="primary"
              className="!py-1.5 !text-xs"
              onClick={() => setApproveId(row.driver_id)}
            >
              Approuver
            </Button>
            <Button
              variant="secondary"
              className="!py-1.5 !text-xs"
              onClick={() => setRejectId(row.driver_id)}
            >
              Rejeter
            </Button>
          </div>
        ) : (
          <Link
            href={`/franchise/drivers/${row.driver_id}`}
            className="text-sm text-teal hover:underline"
          >
            Examiner
          </Link>
        ),
      exportValue: () => "",
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger la file KYC.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Modération KYC"
        breadcrumb={["Franchise", "Territoire"]}
        actions={
          meta ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
              {meta.total} dossier{meta.total > 1 ? "s" : ""} en attente
            </span>
          ) : undefined
        }
      />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Nom, téléphone, partenaire, zone…"
        totalLabel={meta ? `${meta.total} dossiers en attente` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      />

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(r) => r.driver_id}
        isLoading={isLoading}
        exportFileName="moderation-kyc-franchise"
        emptyTitle="Aucun dossier en attente"
        pagination={false}
        serverPagination={serverPaginationFromMeta(
          meta,
          table.setPage,
          table.setPageSize
        )}
      />

      <ConfirmModal
        open={approveId !== null}
        title="Approuver ce chauffeur ?"
        message="Tous les documents en attente seront validés sur votre territoire."
        confirmLabel="Approuver"
        onConfirm={() => {
          if (approveId === null) return;
          approveMutation.mutate(String(approveId), {
            onSuccess: () => setApproveId(null),
          });
        }}
        onCancel={() => setApproveId(null)}
      />

      <ConfirmModal
        open={rejectId !== null}
        title="Rejeter la demande ?"
        message="Le partenaire et le chauffeur devront corriger les pièces."
        confirmLabel="Rejeter"
        variant="danger"
        onConfirm={() => {
          if (rejectId === null) return;
          rejectMutation.mutate(
            {
              driverId: String(rejectId),
              reason: "Documents non conformes — franchise",
            },
            { onSuccess: () => setRejectId(null) }
          );
        }}
        onCancel={() => setRejectId(null)}
      />
    </div>
  );
}
