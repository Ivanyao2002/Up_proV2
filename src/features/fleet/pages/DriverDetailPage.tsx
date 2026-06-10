"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Tabs } from "@/shared/ui/Tabs";
import { Timeline } from "@/shared/ui/Timeline";
import { driverTimelineToItems } from "@/shared/lib/driverTimeline";
import { organizeDriverKycDocuments } from "@/features/fleet/api/kycDocument.mapper";
import { KycDocumentCard } from "@/shared/ui/KycDocumentCard";
import { KycDocumentGroupCard } from "@/shared/ui/KycDocumentGroupCard";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Button } from "@/shared/ui/Button";
import { AccountStatusPill, AvailabilityPill } from "@/shared/ui/DriverPills";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { RejectReasonModal } from "@/shared/ui/RejectReasonModal";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { StatusPill } from "@/shared/ui/StatusPill";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { getTripStatusLabel } from "@/shared/lib/tripLabels";
import type { TripMatchingOutcome } from "@/shared/types";
import type { DriverTripRow, DriverWalletTransaction } from "../api/driverDetail.service";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import { buildAdminVehicleDetailPath } from "../lib/vehicleRoutes";
import {
  useDriverDetail,
  useDriverTrips,
  useDriverWalletTransactions,
  useApproveDriverKyc,
  useRejectDriverKyc,
  useApproveKycDocument,
  useRejectKycDocument,
  useSuspendDriver,
  useActivateDriver,
  useSetDriverAvailability,
} from "../api/driverDetail.queries";
import { canSetDriverAvailability } from "../api/driverAdminActions.service";

interface DriverDetailPageProps {
  driverId: string;
}

export function DriverDetailPage({ driverId }: DriverDetailPageProps) {
  const [tab, setTab] = useState("kyc");
  const [showWallet, setShowWallet] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [rejectDocTarget, setRejectDocTarget] = useState<string | null>(null);

  const { data: driver, isLoading, isError } = useDriverDetail(driverId);
  const { data: tripsData, isLoading: tripsLoading } = useDriverTrips(driverId);
  const { data: walletData, isLoading: walletLoading } = useDriverWalletTransactions(
    driverId,
    showWallet
  );
  const approveKyc = useApproveDriverKyc(driverId);
  const rejectKyc = useRejectDriverKyc(driverId);
  const approveDoc = useApproveKycDocument(driverId);
  const rejectDoc = useRejectKycDocument(driverId);
  const suspendDriver = useSuspendDriver(driverId);
  const activateDriver = useActivateDriver(driverId);
  const setAvailability = useSetDriverAvailability(driverId);

  if (isLoading) {
    return (
      <DetailPageSkeleton title="Chauffeur" breadcrumb={["Admin", "Flotte"]} />
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
  const canManageAvailability = canSetDriverAvailability(driver);
  const actionBusy =
    suspendDriver.isPending ||
    activateDriver.isPending ||
    setAvailability.isPending;
  const timelineItems = driverTimelineToItems(driver.timeline);
  const vehicleDetailHref = driver.vehicle_id
    ? buildAdminVehicleDetailPath(driver.vehicle_id, driver.owner_id)
    : null;
  const kycDisplayItems = organizeDriverKycDocuments(driver.kyc_documents);

  const tabs = [
    { id: "kyc", label: "KYC & documents" },
    { id: "overview", label: "Aperçu" },
    { id: "activity", label: "Activité" },
  ];

  const offerOutcomeLabel: Record<TripMatchingOutcome, string> = {
    declined: "Proposition refusée",
    no_response: "Sans réponse",
    accepted: "Acceptée",
  };

  const tripColumns: Column<DriverTripRow>[] = [
    {
      id: "ref",
      header: "Réf.",
      cell: (t) => {
        const tripId = t.id.startsWith("offer-")
          ? t.id.replace(/^offer-(\d+)-.*/, "$1")
          : t.id;
        return (
          <Link
            href={`/admin/ops/trips/${tripId}`}
            className="font-medium text-foreground hover:text-teal"
          >
            {t.ref}
          </Link>
        );
      },
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
      cell: (t) =>
        t.offer_outcome && t.offer_outcome !== "accepted" ? (
          <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
            {offerOutcomeLabel[t.offer_outcome]}
          </span>
        ) : (
          <StatusPill status={t.status} />
        ),
      exportValue: (t) =>
        t.offer_outcome && t.offer_outcome !== "accepted"
          ? offerOutcomeLabel[t.offer_outcome]
          : getTripStatusLabel(t.status),
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

  const isOffline =
    driver.availability === "offline" || driver.availability === "paused";

  return (
    <div className="animate-fade-up">
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
              {isSuspended && (
                <Button
                  disabled={actionBusy}
                  onClick={() => activateDriver.mutate()}
                >
                  Réactiver
                </Button>
              )}
              {canManageAvailability && (
                <>
                  {isOffline ? (
                    <Button
                      disabled={actionBusy}
                      onClick={() => setAvailability.mutate("online")}
                    >
                      Mettre en ligne
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      disabled={actionBusy}
                      onClick={() => setAvailability.mutate("offline")}
                    >
                      Hors ligne
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    className="!text-xs"
                    disabled={actionBusy}
                    onClick={() => setConfirmSuspend(true)}
                  >
                    Suspendre
                  </Button>
                </>
              )}
              <AccountStatusPill status={driver.account_status} />
              {canManageAvailability && (
                <AvailabilityPill status={driver.availability} />
              )}
            </div>
          }
        />
        <p className="text-sm text-muted">
          {driver.driver_code ? (
            <span className="font-medium text-foreground">{driver.driver_code}</span>
          ) : null}
          {driver.driver_code ? " · " : ""}
          {driver.phone}
          {driver.email ? ` · ${driver.email}` : ""} · {driver.zone}
          {driver.owner_name ? ` · ${driver.owner_name}` : ""}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Contenu onglets */}
        <div className="min-w-0">
          <Tabs tabs={tabs} active={tab} onChange={setTab} />

          <div className="mt-6">
            {tab === "kyc" && (
              <div className="space-y-4">
                {driver.kyc_documents.length === 0 ? (
                  <div className="rounded-card border border-dashed border-border bg-surface p-8 text-center">
                    <p className="font-medium text-foreground">
                      Aucun document KYC
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      Les documents soumis par le chauffeur apparaîtront ici
                      (CNI, permis, selfie) avec aperçu et actions de validation.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {kycDisplayItems.map((item) =>
                      item.kind === "group" ? (
                        <div key={item.groupId} className="sm:col-span-2">
                          <KycDocumentGroupCard
                            label={item.label}
                            documents={item.documents}
                            canReview={isPending}
                            onApprove={(documentId) =>
                              approveDoc.mutate(documentId)
                            }
                            onReject={(documentId) =>
                              setRejectDocTarget(documentId)
                            }
                          />
                        </div>
                      ) : (
                        <KycDocumentCard
                          key={item.document.id}
                          document={item.document}
                          canReview={
                            isPending &&
                            item.document.status === "pending" &&
                            Boolean(item.document.uploaded_at) &&
                            !item.document.id.startsWith("slot-")
                          }
                          onApprove={() => approveDoc.mutate(item.document.id)}
                          onReject={() =>
                            setRejectDocTarget(item.document.id)
                          }
                        />
                      )
                    )}
                  </div>
                )}
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
                  {vehicleDetailHref ? (
                    <Link
                      href={vehicleDetailHref}
                      className="block rounded-card transition-opacity hover:opacity-95"
                    >
                      <KpiCard
                        label="Véhicule"
                        value={driver.vehicle_label ?? "Voir la fiche"}
                        hint="Ouvrir le détail véhicule →"
                      />
                    </Link>
                  ) : (
                    <KpiCard
                      label="Véhicule"
                      value={driver.vehicle_label ?? "Non renseigné"}
                    />
                  )}
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
                  <div className="h-24 animate-pulse rounded bg-navy/10" />
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
            <h3 className="font-semibold text-foreground">Véhicule assigné</h3>
            {vehicleDetailHref ? (
              <div className="mt-3 space-y-3">
                <p className="font-medium text-foreground">
                  {driver.vehicle_label ?? "Véhicule assigné"}
                </p>
                <Link
                  href={vehicleDetailHref}
                  className="inline-block text-teal hover:underline"
                >
                  Voir la fiche véhicule →
                </Link>
              </div>
            ) : (
              <p className="mt-3 text-muted">
                {driver.vehicle_label ?? "Aucun véhicule assigné."}
              </p>
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
                <dt>Partenaire</dt>
                <dd className="text-right text-foreground">
                  {driver.owner_name ? (
                    driver.owner_id ? (
                      <Link
                        href={`/admin/network/partners/${driver.owner_id}`}
                        className="font-medium text-teal hover:underline"
                      >
                        {driver.owner_name}
                      </Link>
                    ) : (
                      driver.owner_name
                    )
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>
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

      <RejectReasonModal
        open={rejectDocTarget !== null}
        title="Rejeter ce document ?"
        message="Indiquez le motif du rejet. Le chauffeur pourra soumettre un nouveau document."
        confirmLabel="Rejeter le document"
        onConfirm={(reason) => {
          if (rejectDocTarget) {
            rejectDoc.mutate({ documentId: rejectDocTarget, reason });
          }
          setRejectDocTarget(null);
        }}
        onCancel={() => setRejectDocTarget(null)}
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
