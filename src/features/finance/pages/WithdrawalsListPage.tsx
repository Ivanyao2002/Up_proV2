"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { FilterChips } from "@/shared/ui/FilterChips";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Button } from "@/shared/ui/Button";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { WithdrawalStatusPill } from "@/shared/ui/TransactionStatusPill";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { WITHDRAWAL_METHOD_LABELS } from "@/shared/lib/financeLabels";

const WITHDRAWAL_STATUS_LABELS = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Rejeté",
} as const;
import type { Withdrawal, WithdrawalStatus } from "@/shared/types";
import {
  useWithdrawalsList,
  useApproveWithdrawal,
  useRejectWithdrawal,
} from "../api/withdrawals.queries";

const STATUS_FILTERS: { value: WithdrawalStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "pending", label: "En attente" },
  { value: "approved", label: "Approuvés" },
  { value: "rejected", label: "Rejetés" },
];

export function WithdrawalsListPage() {
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatus | "all">(
    "pending"
  );
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);

  const { data, isLoading, isError } = useWithdrawalsList();
  const approve = useApproveWithdrawal();
  const reject = useRejectWithdrawal();

  const rows = useMemo(() => {
    const list = data?.data ?? [];
    if (statusFilter === "all") return list;
    return list.filter((w) => w.status === statusFilter);
  }, [data?.data, statusFilter]);

  const columns: Column<Withdrawal>[] = [
    {
      id: "id",
      header: "Réf.",
      cell: (w) => <span className="font-medium text-navy">{w.id}</span>,
      exportValue: (w) => w.id,
    },
    {
      id: "beneficiary",
      header: "Bénéficiaire",
      cell: (w) => (
        <div>
          {w.owner_id ? (
            <Link
              href={`/admin/network/partners/${w.owner_id}`}
              className="font-medium text-navy hover:text-teal"
            >
              {w.owner_name}
            </Link>
          ) : w.driver_id ? (
            <Link
              href={`/admin/fleet/drivers/${w.driver_id}`}
              className="font-medium text-navy hover:text-teal"
            >
              {w.owner_name}
            </Link>
          ) : (
            <span className="font-medium">{w.owner_name}</span>
          )}
          <p className="text-xs text-muted">{w.franchise_name}</p>
        </div>
      ),
      exportValue: (w) => `${w.owner_name} (${w.franchise_name})`,
    },
    {
      id: "amount",
      header: "Montant",
      className: "tabular-nums font-medium",
      cell: (w) => formatFCFA(w.amount_fcfa),
      exportValue: (w) => w.amount_fcfa,
    },
    {
      id: "balance",
      header: "Solde wallet",
      className: "tabular-nums text-muted",
      cell: (w) => formatFCFA(w.wallet_balance_fcfa),
      exportValue: (w) => w.wallet_balance_fcfa,
    },
    {
      id: "method",
      header: "Méthode",
      cell: (w) => (
        <div>
          <p>{WITHDRAWAL_METHOD_LABELS[w.method]}</p>
          <p className="text-xs text-muted">{w.account_label}</p>
        </div>
      ),
      exportValue: (w) =>
        `${WITHDRAWAL_METHOD_LABELS[w.method]} — ${w.account_label}`,
    },
    {
      id: "status",
      header: "Statut",
      cell: (w) => <WithdrawalStatusPill status={w.status} />,
      exportValue: (w) => WITHDRAWAL_STATUS_LABELS[w.status],
    },
    {
      id: "date",
      header: "Demandé le",
      className: "text-muted whitespace-nowrap",
      cell: (w) => formatDateTime(w.requested_at),
      exportValue: (w) => formatDateTime(w.requested_at),
    },
    {
      id: "actions",
      header: "",
      exportValue: () => "",
      cell: (w) =>
        w.status === "pending" ? (
          <div className="flex gap-1">
            <Button
              className="!py-1 !px-2 !text-xs"
              onClick={() => setConfirmId(w.id)}
            >
              Approuver
            </Button>
            <Button
              variant="secondary"
              className="!py-1 !px-2 !text-xs"
              onClick={() => setRejectId(w.id)}
            >
              Rejeter
            </Button>
          </div>
        ) : (
          <span className="text-xs text-muted">—</span>
        ),
    },
  ];

  if (isError) {
    return (
      <p className="text-sm text-red-600">Impossible de charger les retraits.</p>
    );
  }

  const pendingWithdrawal = data?.data.find((w) => w.id === confirmId);

  return (
    <div className="animate-fade-up">
      <PageHeader title="Retraits" breadcrumb={["Admin", "Finance"]} />

      {data?.summary && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <KpiCard
            label="En attente"
            value={String(data.summary.pending_count)}
            hint="demandes à traiter"
          />
          <KpiCard
            label="Montant en attente"
            value={formatFCFA(data.summary.pending_amount_fcfa)}
          />
        </div>
      )}

      <div className="mb-4">
        <FilterChips
          options={STATUS_FILTERS}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(w) => w.id}
        isLoading={isLoading}
        exportFileName="retraits"
        emptyTitle="Aucun retrait"
        footer={
          data?.meta ? <span>{data.meta.total} retraits au total</span> : undefined
        }
      />

      <ConfirmModal
        open={Boolean(confirmId)}
        title="Approuver ce retrait ?"
        message={
          pendingWithdrawal
            ? `${formatFCFA(pendingWithdrawal.amount_fcfa)} seront versés à ${pendingWithdrawal.owner_name} via ${WITHDRAWAL_METHOD_LABELS[pendingWithdrawal.method]}.`
            : ""
        }
        confirmLabel="Approuver"
        onConfirm={() => {
          if (confirmId) approve.mutate(confirmId);
          setConfirmId(null);
        }}
        onCancel={() => setConfirmId(null)}
      />

      <ConfirmModal
        open={Boolean(rejectId)}
        title="Rejeter ce retrait ?"
        message="Le bénéficiaire sera notifié et les fonds resteront sur le portefeuille."
        confirmLabel="Rejeter"
        variant="danger"
        onConfirm={() => {
          if (rejectId) reject.mutate(rejectId);
          setRejectId(null);
        }}
        onCancel={() => setRejectId(null)}
      />
    </div>
  );
}
