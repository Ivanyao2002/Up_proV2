"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { StatusPill } from "@/shared/ui/StatusPill";
import { Button } from "@/shared/ui/Button";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { getTripStatusLabel } from "@/shared/lib/tripLabels";
import type { FleetClientDetail } from "../api/clients.service";
import {
  useClientDetail,
  useSuspendClient,
  useActivateClient,
} from "../api/clients.queries";

interface ClientDetailPageProps {
  clientId: string;
}

export function ClientDetailPage({ clientId }: ClientDetailPageProps) {
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const { data, isLoading, isError } = useClientDetail(clientId);
  const suspendClient = useSuspendClient(clientId);
  const activateClient = useActivateClient(clientId);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-card bg-border" />;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Client introuvable.{" "}
        <Link href="/admin/fleet/clients" className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  const isSuspended = data.status === "suspended";

  const tripCols: Column<FleetClientDetail["recent_trips"][0]>[] = [
    {
      id: "ref",
      header: "Réf.",
      cell: (t) => (
        <Link
          href={`/admin/ops/trips/${t.id}`}
          className="font-medium text-foreground hover:text-teal"
        >
          {t.ref}
        </Link>
      ),
      exportValue: (t) => t.ref,
    },
    {
      id: "route",
      header: "Trajet",
      cell: (t) => (
        <span className="text-sm">
          {t.from_label} → {t.to_label}
        </span>
      ),
      exportValue: (t) => `${t.from_label} → ${t.to_label}`,
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
      cell: (t) => <StatusPill status={t.status} />,
      exportValue: (t) => getTripStatusLabel(t.status),
    },
    {
      id: "date",
      header: "Date",
      cell: (t) => formatDateTime(t.created_at),
      exportValue: (t) => t.created_at,
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={data.full_name}
        breadcrumb={["Admin", "Flotte", "Clients", data.full_name]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium uppercase ${
                data.type === "b2b" ? "bg-navy/10 text-foreground" : "bg-teal/15 text-teal-dark"
              }`}
            >
              {data.type}
            </span>
            {isSuspended ? (
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                Suspendu
              </span>
            ) : (
              <span className="rounded-full bg-teal/15 px-3 py-1 text-xs font-medium text-teal-dark">
                Actif
              </span>
            )}
            {!isSuspended ? (
              <Button variant="secondary" className="!text-xs" onClick={() => setConfirmSuspend(true)}>
                Suspendre
              </Button>
            ) : (
              <Button
                variant="secondary"
                className="!text-xs"
                disabled={activateClient.isPending}
                onClick={() => activateClient.mutate()}
              >
                Réactiver
              </Button>
            )}
          </div>
        }
      />

      <p className="mb-6 text-sm text-muted">
        <Link href="/admin/fleet/clients" className="text-teal hover:underline">
          ← Retour à la liste
        </Link>
        {" · "}
        {data.phone}
        {data.email ? ` · ${data.email}` : ""}
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Courses totales" value={String(data.stats.trips_total)} />
        <KpiCard label="Dépenses totales" value={formatFCFA(data.stats.total_spent_fcfa)} />
        <KpiCard label="Panier moyen" value={formatFCFA(data.stats.avg_fare_fcfa)} />
        <KpiCard label="Solde wallet" value={formatFCFA(data.stats.wallet_balance_fcfa)} />
      </div>

      {data.notes && (
        <p className="mb-6 rounded-card border border-border bg-surface p-4 text-sm text-muted shadow-card">
          {data.notes}
        </p>
      )}

      <h2 className="mb-3 text-sm font-semibold text-heading">Courses récentes</h2>
      <DataTable
        columns={tripCols}
        data={data.recent_trips}
        rowKey={(t) => t.id}
        exportFileName={`client-${data.id}-trips`}
        emptyTitle="Aucune course"
      />

      <ConfirmModal
        open={confirmSuspend}
        title="Suspendre ce client ?"
        message="Il ne pourra plus réserver de courses tant que le compte est suspendu."
        confirmLabel="Suspendre"
        variant="danger"
        onConfirm={() => {
          suspendClient.mutate(undefined, { onSuccess: () => setConfirmSuspend(false) });
        }}
        onCancel={() => setConfirmSuspend(false)}
      />
    </div>
  );
}
