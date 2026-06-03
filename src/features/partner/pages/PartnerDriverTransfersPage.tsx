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
import type { PartnerDriverTransfer } from "@/shared/types";
import {
  DRIVER_TRANSFER_STATUS,
  DriverTransferStatusBadge,
} from "@/shared/wallet/driverTransferStatus";
import {
  usePartnerDriverRechargeStats,
  usePartnerDriverTransfers,
  usePartnerWallet,
} from "../api/wallet.queries";
import { PartnerDriverRechargeModal } from "../components/PartnerDriverRechargeModal";

export function PartnerDriverTransfersPage() {
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const table = useServerTableState();
  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
  });

  const { data: wallet } = usePartnerWallet();
  const { data: stats, isLoading: statsLoading } = usePartnerDriverRechargeStats();
  const { data, isLoading, isError } = usePartnerDriverTransfers(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const available = wallet?.available_fcfa ?? 0;

  const columns: Column<PartnerDriverTransfer>[] = [
    {
      id: "ref",
      header: "Réf.",
      cell: (t) => (
        <span className="font-mono text-sm font-medium text-foreground">{t.ref}</span>
      ),
      exportValue: (t) => t.ref,
    },
    {
      id: "driver",
      header: "Chauffeur",
      cell: (t) => (
        <div>
          <Link
            href={`/partner/drivers/${t.driver_id}`}
            className="font-medium text-foreground hover:text-teal"
          >
            {t.driver_name}
          </Link>
          <p className="text-xs text-muted">{t.driver_phone}</p>
        </div>
      ),
      exportValue: (t) => `${t.driver_name} (${t.driver_phone})`,
    },
    {
      id: "amount",
      header: "Montant",
      cell: (t) => (
        <span className="tabular-nums font-medium text-red-600">
          −{formatFCFA(t.amount_fcfa)}
        </span>
      ),
      exportValue: (t) => t.amount_fcfa,
    },
    {
      id: "status",
      header: "Statut",
      cell: (t) => <DriverTransferStatusBadge status={t.status} />,
      exportValue: (t) => DRIVER_TRANSFER_STATUS[t.status].label,
    },
    {
      id: "mobile",
      header: "App mobile",
      cell: (t) => (
        <span className="text-sm text-muted">
          {t.mobile_wallet_credited ? "Crédité" : "—"}
        </span>
      ),
      exportValue: (t) => (t.mobile_wallet_credited ? "Oui" : "Non"),
    },
    {
      id: "note",
      header: "Note",
      cell: (t) => (
        <span className="max-w-[200px] truncate text-sm text-muted">
          {t.note ?? "—"}
        </span>
      ),
      exportValue: (t) => t.note ?? "",
    },
    {
      id: "date",
      header: "Date",
      cell: (t) => (
        <span className="text-sm text-muted">{formatDateTime(t.created_at)}</span>
      ),
      exportValue: (t) => t.created_at,
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Recharges chauffeurs"
        breadcrumb={["Partenaire", "Finance", "Recharges"]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/partner/wallet">
              <Button variant="secondary">Portefeuille</Button>
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

      <p className="mb-6 max-w-2xl text-sm text-muted">
        Transférez des fonds depuis votre portefeuille partenaire vers le solde
        mobile de vos chauffeurs. L&apos;historique ci-dessous recense chaque
        opération, les montants dépensés et le statut de crédit sur
        l&apos;application.
      </p>

      {statsLoading ? (
        <div className="mb-6 h-24 animate-pulse rounded-card bg-border" />
      ) : stats ? (
        <div className="animate-stagger mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            index={0}
            label="Total dépensé (recharges)"
            value={formatFCFA(stats.total_spent_fcfa)}
          />
          <KpiCard
            index={1}
            label="Nombre de transferts"
            value={String(stats.transfers_count)}
          />
          <KpiCard
            index={2}
            label="Ce mois"
            value={formatFCFA(stats.month_spent_fcfa)}
            hint={`${stats.month_transfers_count} transfert(s)`}
          />
          <KpiCard
            index={3}
            label="Dernière recharge"
            value={
              stats.last_transfer_at
                ? formatDateTime(stats.last_transfer_at)
                : "—"
            }
          />
        </div>
      ) : null}

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Réf., chauffeur, téléphone…"
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      />

      {isError ? (
        <p className="text-sm text-red-600">
          Impossible de charger l&apos;historique des recharges.
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          emptyTitle="Aucune recharge"
          emptyDescription="Effectuez un premier transfert vers un chauffeur."
          exportFileName="recharges-chauffeurs"
          serverPagination={serverPaginationFromMeta(
            meta,
            table.setPage,
            table.setPageSize
          )}
        />
      )}

      <PartnerDriverRechargeModal
        open={rechargeOpen}
        availableFcfa={available}
        onClose={() => setRechargeOpen(false)}
      />
    </div>
  );
}
