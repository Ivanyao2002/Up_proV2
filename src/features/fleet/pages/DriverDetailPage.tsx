"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Tabs } from "@/shared/ui/Tabs";
import { Timeline, type TimelineItem } from "@/shared/ui/Timeline";
import { KycDocumentCard } from "@/shared/ui/KycDocumentCard";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Button } from "@/shared/ui/Button";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { StatusPill } from "@/shared/ui/StatusPill";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { getTripStatusLabel } from "@/shared/lib/tripLabels";
import type { DriverTimelineEvent } from "@/shared/types";
import type { DriverTripRow, DriverWalletTransaction } from "../api/driverDetail.service";
import {
  useDriverDetail,
  useDriverTrips,
  useDriverWalletTransactions,
  useApproveDriverKyc,
  useRejectDriverKyc,
  useSuspendDriver,
  useActivateDriver,
} from "../api/driverDetail.queries";
import { notificationService } from "@/core/http/notificationService";

function timelineVariant(
  type: DriverTimelineEvent["type"]
): TimelineItem["variant"] {
  switch (type) {
    case "approved":
      return "success";
    case "kyc":
      return "warning";
    case "suspended":
      return "muted";
    default:
      return "default";
  }
}

interface DriverDetailPageProps {
  driverId: string;
}

export function DriverDetailPage({ driverId }: DriverDetailPageProps) {
  const [tab, setTab] = useState("kyc");
  const [showWallet, setShowWallet] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  const { data: driver, isLoading, isError } = useDriverDetail(driverId);
  const { data: tripsData, isLoading: tripsLoading } = useDriverTrips(driverId);
  const { data: walletData, isLoading: walletLoading } = useDriverWalletTransactions(
    driverId,
    showWallet
  );
  const approveKyc = useApproveDriverKyc(driverId);
  const rejectKyc = useRejectDriverKyc(driverId);
  const suspendDriver = useSuspendDriver(driverId);
  const activateDriver = useActivateDriver(driverId);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 rounded-card bg-border" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-64 rounded-card bg-border lg:col-span-2" />
          <div className="h-64 rounded-card bg-border" />
        </div>
      </div>
    );
  }

  if (isError || !driver) {
    return (
      <p className="text-sm text-red-600">
        Chauffeur introuvable.{" "}
        <Link href="/admin/fleet/drivers" className="text-teal underline">
          Retour à la liste
        </Link>
      </p>
    );
  }

  const fullName = `${driver.first_name} ${driver.last_name}`;
  const isPending = driver.account_status === "pending";
  const isSuspended = driver.account_status === "suspended";
  const canSuspend = driver.account_status === "approved";
  const timelineItems: TimelineItem[] = driver.timeline.map((e) => ({
    id: e.id,
    label: e.label,
    description: e.description,
    at: e.at,
    variant: timelineVariant(e.type),
  }));

  const tabs = [
    { id: "kyc", label: "KYC & documents" },
    { id: "overview", label: "Aperçu" },
    { id: "activity", label: "Activité" },
  ];

  const tripColumns: Column<DriverTripRow>[] = [
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

  const walletColumns: Column<DriverWalletTransaction>[] = [
    {
      id: "label",
      header: "Libellé",
      cell: (tx) => <span className="text-sm">{tx.label}</span>,
      exportValue: (tx) => tx.label,
    },
    {
      id: "amount",
      header: "Montant",
      className: "tabular-nums",
      cell: (tx) => (
        <span className={tx.type === "credit" ? "text-teal-dark" : "text-red-600"}>
          {tx.type === "credit" ? "+" : "−"}
          {formatFCFA(tx.amount_fcfa)}
        </span>
      ),
      exportValue: (tx) => (tx.type === "credit" ? tx.amount_fcfa : -tx.amount_fcfa),
    },
    {
      id: "balance",
      header: "Solde après",
      className: "tabular-nums",
      cell: (tx) => formatFCFA(tx.balance_after_fcfa),
      exportValue: (tx) => tx.balance_after_fcfa,
    },
    {
      id: "date",
      header: "Date",
      cell: (tx) => formatDateTime(tx.created_at),
      exportValue: (tx) => tx.created_at,
    },
  ];

  return (
    <div className="animate-fade-up">
      {/* Header sticky résumé */}
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader
          title={fullName}
          breadcrumb={["Admin", "Flotte", "Chauffeurs", fullName]}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              
              {isPending && (
                <>
                  <Button onClick={() => setConfirmApprove(true)}>
                    Approuver le compte
                  </Button>
                  <Button variant="secondary" onClick={() => setConfirmReject(true)}>
                    Rejeter
                  </Button>
                </>
              )}
            </div>
          }
        />
        <p className="mt-1 text-sm text-muted">
          {driver.phone}
          {driver.email ? ` · ${driver.email}` : ""} · {driver.zone} ·{" "}
          {driver.owner_name}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Contenu onglets */}
        <div className="min-w-0">
          <Tabs tabs={tabs} active={tab} onChange={setTab} />

          <div className="mt-6">
            {tab === "kyc" && (
              <div className="grid gap-4 sm:grid-cols-2">
                {driver.kyc_documents.map((doc) => (
                  <KycDocumentCard
                    key={doc.id}
                    document={doc}
                    canReview={isPending}
                    onApprove={() =>
                      notificationService.success(`${doc.label} validé (mock)`)
                    }
                    onReject={() =>
                      notificationService.warning(`${doc.label} — rejet mock`)
                    }
                  />
                ))}
              </div>
            )}

            {tab === "overview" && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <KpiCard
                    label="Courses totales"
                    value={String(driver.stats.trips_total)}
                  />
                  <KpiCard
                    label="Taux d'acceptation"
                    value={`${driver.stats.acceptance_rate_pct} %`}
                  />
                  <KpiCard
                    label="Note moyenne"
                    value={driver.rating > 0 ? driver.rating.toFixed(2) : "—"}
                  />
                  <KpiCard
                    label="Véhicule"
                    value={driver.vehicle_label ?? "Non renseigné"}
                  />
                </div>
                <div className="rounded-card border border-border bg-surface p-6 shadow-card">
                  <h3 className="text-sm font-semibold text-foreground">Historique</h3>
                  <div className="mt-4">
                    <Timeline items={timelineItems} />
                  </div>
                </div>
              </div>
            )}

            {tab === "activity" && (
              <DataTable
                columns={tripColumns}
                data={tripsData?.data ?? []}
                rowKey={(t) => t.id}
                isLoading={tripsLoading}
                exportFileName={`chauffeur-${driverId}-courses`}
                emptyTitle="Aucune course"
                emptyDescription="Ce chauffeur n'a pas encore effectué de course."
              />
            )}
          </div>
        </div>

        {/* Panneau latéral */}
        <aside className="space-y-4">
          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Portefeuille
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-heading">
              {formatFCFA(driver.stats.wallet_balance_fcfa)}
            </p>
            <Button
              variant="secondary"
              className="mt-4 w-full !text-xs"
              onClick={() => setShowWallet((v) => !v)}
            >
              {showWallet ? "Masquer les transactions" : "Voir les transactions"}
            </Button>
            {showWallet && (
              <div className="mt-4 border-t border-border pt-4">
                {walletLoading ? (
                  <div className="h-24 animate-pulse rounded bg-border" />
                ) : (
                  <DataTable
                    columns={walletColumns}
                    data={walletData?.data ?? []}
                    rowKey={(tx) => tx.id}
                    exportFileName={`chauffeur-${driverId}-wallet`}
                    emptyTitle="Aucune transaction"
                  />
                )}
              </div>
            )}
          </div>

          <div className="rounded-card border border-border bg-surface p-5 shadow-card text-sm">
            <h3 className="font-semibold text-foreground">Informations</h3>
            <dl className="mt-3 space-y-2 text-muted">
              <div className="flex justify-between gap-2">
                <dt>Inscrit le</dt>
                <dd className="text-foreground">{formatDateTime(driver.registered_at)}</dd>
              </div>
              {driver.approved_at && (
                <div className="flex justify-between gap-2">
                  <dt>Approuvé le</dt>
                  <dd className="text-foreground">{formatDateTime(driver.approved_at)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt>Partenaire ID</dt>
                <dd className="text-foreground">{driver.owner_id ?? "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h3 className="text-sm font-semibold text-foreground">Actions rapides</h3>
            <div className="mt-3 flex flex-col gap-2">
              {canSuspend && (
                <Button
                  variant="secondary"
                  className="w-full !text-xs"
                  onClick={() => setConfirmSuspend(true)}
                >
                  Suspendre
                </Button>
              )}
              {isSuspended && (
                <Button
                  variant="secondary"
                  className="w-full !text-xs"
                  onClick={() => activateDriver.mutate()}
                  disabled={activateDriver.isPending}
                >
                  Réactiver
                </Button>
              )}
            </div>
          </div>
        </aside>
      </div>

      <ConfirmModal
        open={confirmApprove}
        title="Approuver ce chauffeur ?"
        message="Tous les documents en attente seront validés et le compte pourra recevoir des courses."
        confirmLabel="Approuver"
        onConfirm={() => {
          approveKyc.mutate();
          setConfirmApprove(false);
        }}
        onCancel={() => setConfirmApprove(false)}
      />

      <ConfirmModal
        open={confirmReject}
        title="Rejeter la demande ?"
        message="Le chauffeur devra corriger ses documents avant une nouvelle validation."
        confirmLabel="Rejeter"
        variant="danger"
        onConfirm={() => {
          rejectKyc.mutate("Documents non conformes");
          setConfirmReject(false);
        }}
        onCancel={() => setConfirmReject(false)}
      />

      <ConfirmModal
        open={confirmSuspend}
        title="Suspendre ce chauffeur ?"
        message="Il ne pourra plus recevoir de courses tant que le compte est suspendu."
        confirmLabel="Suspendre"
        variant="danger"
        onConfirm={() => {
          suspendDriver.mutate(undefined, { onSuccess: () => setConfirmSuspend(false) });
        }}
        onCancel={() => setConfirmSuspend(false)}
      />
    </div>
  );
}
