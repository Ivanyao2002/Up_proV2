"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Tabs } from "@/shared/ui/Tabs";
import { KycDocumentCard } from "@/shared/ui/KycDocumentCard";
import { AccountStatusPill, AvailabilityPill } from "@/shared/ui/DriverPills";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Button } from "@/shared/ui/Button";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { StatusPill } from "@/shared/ui/StatusPill";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { getTripStatusLabel } from "@/shared/lib/tripLabels";
import { notificationService } from "@/core/http/notificationService";
import type { KycDocument } from "@/shared/types";
import {
  usePartnerDriverDetail,
  useUploadPartnerDriverDocument,
} from "../api/drivers.queries";
import {
  usePartnerDriverTrips,
  usePartnerDriverWalletTransactions,
} from "../api/partnerDriverDetail.queries";
import type {
  PartnerDriverTripRow,
  PartnerDriverWalletTransaction,
} from "../api/partnerDriverDetail.service";
import { PartnerDriverLiveMap } from "../components/PartnerDriverLiveMap";

interface PartnerDriverDetailPageProps {
  driverId: string;
}

function canUploadDoc(doc: KycDocument): boolean {
  return doc.status === "rejected" || !doc.uploaded_at;
}

export function PartnerDriverDetailPage({ driverId }: PartnerDriverDetailPageProps) {
  const [tab, setTab] = useState("overview");
  const [showWallet, setShowWallet] = useState(false);

  const { data: driver, isLoading, isError } = usePartnerDriverDetail(driverId);
  const { data: tripsData, isLoading: tripsLoading } = usePartnerDriverTrips(driverId);
  const { data: walletData, isLoading: walletLoading } =
    usePartnerDriverWalletTransactions(driverId, showWallet);
  const uploadDoc = useUploadPartnerDriverDocument(driverId);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 rounded-card bg-border" />
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
        <Link href="/partner/drivers" className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  const fullName = `${driver.first_name} ${driver.last_name}`;
  const showLiveMap = driver.account_status === "approved";

  const tripColumns: Column<PartnerDriverTripRow>[] = [
    {
      id: "ref",
      header: "Réf.",
      cell: (t) => (
        <Link
          href={`/partner/bookings/${t.id}`}
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

  const walletColumns: Column<PartnerDriverWalletTransaction>[] = [
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
      <PageHeader
        title={fullName}
        breadcrumb={["Partenaire", "Chauffeurs", fullName]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <AccountStatusPill status={driver.account_status} />
            <AvailabilityPill status={driver.availability} />
            {showLiveMap && (
              <Link href="/partner/map">
                <Button variant="secondary">Carte live flotte</Button>
              </Link>
            )}
          </div>
        }
      />
      <p className="-mt-4 mb-6 text-sm text-muted">
        {driver.phone}
        {driver.email ? ` · ${driver.email}` : ""} · {driver.zone}
        {driver.vehicle_label ? ` · ${driver.vehicle_label}` : ""}
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <Tabs
            tabs={[
              { id: "overview", label: "Aperçu" },
              { id: "kyc", label: "Documents" },
            ]}
            active={tab}
            onChange={setTab}
          />

          <div className="mt-6 space-y-6">
            {tab === "overview" && (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <KpiCard
                    index={0}
                    label="Courses totales"
                    value={String(driver.stats.trips_total)}
                  />
                  <KpiCard
                    index={1}
                    label="Taux d'acceptation"
                    value={`${driver.stats.acceptance_rate_pct} %`}
                  />
                  <KpiCard
                    index={2}
                    label="Note moyenne"
                    value={driver.rating > 0 ? driver.rating.toFixed(2) : "—"}
                  />
                  <KpiCard
                    index={3}
                    label="Solde portefeuille"
                    value={formatFCFA(driver.stats.wallet_balance_fcfa)}
                  />
                </div>

                {showLiveMap && (
                  <PartnerDriverLiveMap driverId={driverId} driverName={fullName} />
                )}

                <div className="rounded-card border border-border bg-surface shadow-card overflow-hidden">
                  <div className="border-b border-border px-6 py-4">
                    <h2 className="text-sm font-semibold text-heading">Courses récentes</h2>
                    <p className="mt-0.5 text-xs text-muted">
                      Historique des trajets effectués par ce chauffeur
                    </p>
                  </div>
                  <div className="px-2 pb-2">
                    <DataTable
                      columns={tripColumns}
                      data={tripsData?.data ?? []}
                      rowKey={(t) => t.id}
                      isLoading={tripsLoading}
                      exportFileName={`partenaire-chauffeur-${driverId}-courses`}
                      emptyTitle="Aucune course"
                      emptyDescription="Ce chauffeur n'a pas encore de course enregistrée."
                      pagination={{ pageSize: 10 }}
                    />
                  </div>
                </div>
              </>
            )}

            {tab === "kyc" && (
              <div className="grid gap-4 sm:grid-cols-2">
                {driver.kyc_documents.map((doc) => (
                  <KycDocumentCard
                    key={doc.id}
                    document={doc}
                    canUpload={canUploadDoc(doc)}
                    uploadHint="PDF ou image · max 5 Mo"
                    onUpload={(file) => {
                      uploadDoc.mutate(
                        { type: doc.type, file },
                        {
                          onSuccess: () =>
                            notificationService.success(
                              "Document envoyé — validation en cours"
                            ),
                          onError: () => notificationService.error("Échec de l'envoi"),
                        }
                      );
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Portefeuille mobile
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-heading">
              {formatFCFA(driver.stats.wallet_balance_fcfa)}
            </p>
            <p className="mt-1 text-xs text-muted">
              Solde app chauffeur · rechargeable depuis votre portefeuille
            </p>
            <Link href="/partner/wallet/driver-transfers" className="mt-3 block">
              <Button variant="secondary" className="w-full !text-xs">
                Recharger ce chauffeur
              </Button>
            </Link>
            <Button
              variant="secondary"
              className="mt-2 w-full !text-xs"
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
                    exportFileName={`partenaire-chauffeur-${driverId}-wallet`}
                    emptyTitle="Aucune transaction"
                    pagination={{ pageSize: 8 }}
                  />
                )}
              </div>
            )}
          </div>

          <div className="rounded-card border border-border bg-surface p-5 shadow-card text-sm">
            <h3 className="font-semibold text-heading">Informations</h3>
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
                <dt>Véhicule</dt>
                <dd className="text-right text-foreground">
                  {driver.vehicle_label ?? "—"}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
