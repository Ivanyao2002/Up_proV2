"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { Button } from "@/shared/ui/Button";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { FranchisePartnerTransfer } from "@/shared/types";
import {
  DRIVER_TRANSFER_STATUS,
  DriverTransferStatusBadge,
} from "@/shared/wallet/driverTransferStatus";
import {
  useFranchiseFinance,
  useFranchisePartnerRechargeStats,
  useFranchisePartnerTransfers,
} from "../api/finance.queries";
import { FranchisePartnerRechargeModal } from "../components/FranchisePartnerRechargeModal";

export function FranchisePartnerTransfersPage() {
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const table = useServerTableState();
  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
  });

  const { data: finance } = useFranchiseFinance();
  const { data: stats, isLoading: statsLoading } = useFranchisePartnerRechargeStats();
  const { data, isLoading, isError } = useFranchisePartnerTransfers(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const available = finance?.available_fcfa ?? 0;

  const columns: Column<FranchisePartnerTransfer>[] = [
    {
      id: "ref",
      header: "Réf.",
      cell: (t) => (
        <span className="font-mono text-sm font-medium text-foreground">{t.ref}</span>
      ),
      exportValue: (t) => t.ref,
    },
    {
      id: "partner",
      header: "Partenaire",
      cell: (t) => (
        <Link
          href={`/franchise/partners/${t.partner_id}`}
          className="font-medium text-foreground hover:text-teal"
        >
          {t.partner_name}
        </Link>
      ),
      exportValue: (t) => t.partner_name,
    },
    {
      id: "amount",
      header: "Montant",
      className: "tabular-nums",
      cell: (t) => formatFCFA(t.amount_fcfa),
      exportValue: (t) => t.amount_fcfa,
    },
    {
      id: "status",
      header: "Statut",
      cell: (t) => <DriverTransferStatusBadge status={t.status} />,
      exportValue: (t) => DRIVER_TRANSFER_STATUS[t.status].label,
    },
    {
      id: "date",
      header: "Date",
      cell: (t) => formatDateTime(t.created_at),
      exportValue: (t) => t.created_at,
    },
  ];

  if (isError) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger les recharges partenaires.{" "}
        <Link href="/franchise/finance/partner-transfers" className="text-teal underline">
          Réessayer
        </Link>
      </p>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader
          title="Recharges partenaires"
          breadcrumb={["Franchise", "Finance", "Partenaires"]}
          actions={
            <div className="flex flex-wrap gap-2">
              <Link href="/franchise/finance">
                <Button variant="secondary">Finance locale</Button>
              </Link>
              <Button
                variant="primary"
                disabled={available <= 0}
                onClick={() => setRechargeOpen(true)}
              >
                Nouvelle recharge
              </Button>
            </div>
          }
        />
        {stats && (
          <p className="mt-1 text-sm text-muted">
            {stats.transfers_count} recharges · {formatFCFA(stats.total_spent_fcfa)} crédité · {formatFCFA(available)} disponible
          </p>
        )}
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <KpiCard
          index={0}
          label="Disponible territoire"
          value={formatFCFA(available)}
        />
        {statsLoading ? (
          <div className="kpi-card kpi-card--slate kpi-card--compact relative h-24 animate-pulse rounded-card p-4 sm:col-span-2" />
        ) : stats ? (
          <>
            <KpiCard
              index={1}
              label="Total crédité"
              value={formatFCFA(stats.total_spent_fcfa)}
              hint={`${stats.transfers_count} opération(s)`}
            />
            <KpiCard
              index={2}
              label="Dernière recharge"
              value={
                stats.last_transfer_at
                  ? formatDateTime(stats.last_transfer_at)
                  : "—"
              }
            />
          </>
        ) : null}
      </div>

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Réf., partenaire, note…"
        totalLabel={
          meta ? `${meta.total.toLocaleString("fr-CI")} recharges` : undefined
        }
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      />

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(t) => t.id}
        isLoading={isLoading}
        exportFileName="recharges-partenaires-franchise"
        emptyTitle="Aucune recharge partenaire"
        pagination={false}
        serverPagination={serverPaginationFromMeta(
          meta,
          table.setPage,
          table.setPageSize
        )}
      />

      <FranchisePartnerRechargeModal
        open={rechargeOpen}
        availableFcfa={available}
        onClose={() => setRechargeOpen(false)}
      />
    </div>
  );
}
