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
import { WalletBalancesCard } from "@/shared/finance/WalletBalancesCard";
import { usePermission } from "@/core/auth/usePermission";
import { canReviewKycDocument } from "@/shared/lib/kycReview";
import { useScope } from "@/core/auth/useScope";
import { DriverTransferModal } from "@/features/fleet/components/DriverTransferModal";
import { useTransferDriverToPartner } from "@/features/fleet/api/driverTransfer.queries";
import { resolveDriverSourcePartnerId } from "@/features/fleet/api/driverTransfer.service";
import type { DriverTripRow, DriverWalletTransaction } from "@/features/fleet/api/driverDetail.service";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { getTripStatusLabel } from "@/shared/lib/tripLabels";
import type { TripMatchingOutcome } from "@/shared/types";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import { ModalPortal } from "@/shared/ui/ModalPortal";
import { useRouter } from "next/navigation";
import {
  useApproveFranchiseDocument,
  useApproveFranchiseDriverKyc,
  useDeleteFranchiseDriver,
  useFranchiseDriverDetail,
  useRejectFranchiseDocument,
  useRejectFranchiseDriverKyc,
  useSuspendFranchiseDriver,
  useUnsuspendFranchiseDriver,
  useUpdateFranchiseDriver,
  useFranchiseDriverWalletTransactions,
  useFranchiseDriverTrips,
} from "../api/drivers.queries";

interface FranchiseDriverDetailPageProps {
  driverId: string;
}

export function FranchiseDriverDetailPage({ driverId }: FranchiseDriverDetailPageProps) {
  const router = useRouter();
  const [tab, setTab] = useState("kyc");
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [confirmUnsuspend, setConfirmUnsuspend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [rejectDocTarget, setRejectDocTarget] = useState<string | null>(null);
  const canModerate = usePermission("fleet.kyc.approve");
  const { franchiseId } = useScope();

  const { data: driver, isLoading, isError } = useFranchiseDriverDetail(driverId);
  const { data: tripsData, isLoading: tripsLoading } = useFranchiseDriverTrips(driverId);
  const { data: walletData, isLoading: walletLoading } = useFranchiseDriverWalletTransactions(driverId);
  const approveKyc = useApproveFranchiseDriverKyc();
  const rejectKyc = useRejectFranchiseDriverKyc();
  const approveDoc = useApproveFranchiseDocument(driverId);
  const rejectDoc = useRejectFranchiseDocument(driverId);
  const suspendDriver = useSuspendFranchiseDriver();
  const unsuspendDriver = useUnsuspendFranchiseDriver();
  const updateDriver = useUpdateFranchiseDriver();
  const deleteDriver = useDeleteFranchiseDriver();
  const transferDriver = useTransferDriverToPartner(driverId);

  if (isLoading) {
    return (
      <DetailPageSkeleton title="Chauffeur" breadcrumb={["Franchise", "Flotte", "Chauffeurs"]} />
    );
  }

  if (isError || !driver) {
    return (
      <p className="text-sm text-red-600">
        Chauffeur introuvable.{" "}
        <Link href="/franchise/drivers" className="text-teal underline">
          Retour à la liste
        </Link>
      </p>
    );
  }

  const fullName = `${driver.first_name} ${driver.last_name}`;
  const isPending = driver.account_status === "pending";
  const isSuspended = driver.account_status === "suspended";
  const canManageAvailability = driver.account_status === "approved";
  const isOffline = driver.availability === "offline" || driver.availability === "paused";
  const actionBusy = suspendDriver.isPending || unsuspendDriver.isPending || transferDriver.isPending || deleteDriver.isPending;
  const setAvailabilityOffline = () => suspendDriver.mutate({ id: driverId, reason: undefined });
  const timelineItems = driverTimelineToItems(driver.timeline || []);
  const kycDisplayItems = organizeDriverKycDocuments(driver.kyc_documents || []);
  const sourcePartnerId = resolveDriverSourcePartnerId(driver);
  const canTransferDriver = Boolean(sourcePartnerId);

  const tabs = [
    { id: "kyc", label: "KYC & documents" },
    { id: "overview", label: "Aperçu" },
    { id: "activity", label: "Activité" },
    { id: "wallet", label: "Portefeuille" },
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
          <Link href={`/franchise/ops/trips/${tripId}`} className="font-medium text-foreground hover:text-teal">
            {t.ref}
          </Link>
        );
      },
      exportValue: (t) => t.ref,
    },
    {
      id: "route",
      header: "Trajet",
      cell: (t) => <span className="text-sm">{t.from_label} → {t.to_label}</span>,
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

  return (
    <div className="animate-fade-up">
      <div className="page-sticky-header">
        <PageHeader
          title={fullName}
          breadcrumb={["Franchise", "Flotte", "Chauffeurs", fullName]}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {isPending && canModerate && (
                <>
                  <Button onClick={() => setConfirmApprove(true)}>Approuver le compte</Button>
                  <Button variant="secondary" onClick={() => setConfirmReject(true)}>Rejeter</Button>
                </>
              )}
              {isSuspended && (
                <Button disabled={actionBusy} onClick={() => setConfirmUnsuspend(true)}>
                  Réactiver
                </Button>
              )}
              {canManageAvailability && (
                <>
                  {isOffline ? (
                    <Button disabled={actionBusy} onClick={() => unsuspendDriver.mutate(driverId)}>
                      Mettre en ligne
                    </Button>
                  ) : (
                    <Button variant="secondary" disabled={actionBusy} onClick={() => setAvailabilityOffline()}>
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
              <Button variant="secondary" onClick={() => setShowEditModal(true)}>Modifier</Button>
              {canTransferDriver && (
                <Button variant="secondary" disabled={actionBusy} onClick={() => setShowTransferModal(true)}>
                  Transférer vers un partenaire
                </Button>
              )}
              <Button
                variant="secondary"
                disabled={actionBusy}
                onClick={() => setConfirmDelete(true)}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                Supprimer
              </Button>
              <AccountStatusPill status={driver.account_status} />
              {canManageAvailability && <AvailabilityPill status={driver.availability} />}
            </div>
          }
        />
        <p className="text-sm text-muted break-words">
          {driver.driver_code ? (
            <span className="font-medium text-foreground">{driver.driver_code}</span>
          ) : null}
          {driver.driver_code ? " · " : ""}
          {driver.phone ?? "—"}
          {driver.email ? ` · ${driver.email}` : ""} · {driver.zone ?? "—"}
          {driver.owner_name ? ` · ${driver.owner_name}` : ""}
        </p>
      </div>

      <div className="detail-page-grid">
        <div className="min-w-0">
          <Tabs tabs={tabs} active={tab} onChange={setTab} />

          <div className="mt-6">
            {tab === "kyc" && (
              <div className="space-y-6">
                {driver.kyc_documents?.length === 0 ? (
                  <div className="rounded-card border border-dashed border-border bg-surface p-8 text-center">
                    <p className="font-medium text-foreground">Aucun document KYC</p>
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
                            canReview={canModerate}
                            onApprove={(documentId) => approveDoc.mutate(documentId)}
                            onReject={(documentId) => setRejectDocTarget(documentId)}
                          />
                        </div>
                      ) : (
                        <KycDocumentCard
                          key={item.document.id}
                          document={item.document}
                          canReview={canModerate && canReviewKycDocument(item.document)}
                          onApprove={() => approveDoc.mutate(item.document.id)}
                          onReject={() => setRejectDocTarget(item.document.id)}
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
                  <KpiCard label="Courses totales" value={String(driver.stats?.trips_total ?? driver.trips_count ?? 0)} />
                  <KpiCard label="Taux d'acceptation" value={driver.stats?.acceptance_rate_pct != null ? `${driver.stats.acceptance_rate_pct} %` : "—"} />
                  <KpiCard
                    label="Note moyenne"
                    value={(driver.rating_avg ?? driver.rating) > 0 ? `${(driver.rating_avg ?? driver.rating).toFixed(2)} / 5` : "—"}
                  />
                  <KpiCard label="Véhicule" value={driver.vehicle_label ?? "Non renseigné"} />
                </div>

                <div className="rounded-card border border-border bg-surface p-6 shadow-card">
                  <h3 className="text-sm font-semibold text-foreground">Historique</h3>
                  <div className="mt-4">
                    <Timeline items={timelineItems} />
                  </div>
                </div>

                <div className="rounded-card border border-border bg-surface p-5 shadow-card">
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Profil conducteur</h3>
                  <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted">Catégorie</dt>
                      <dd className="font-medium text-foreground">{driver.ride_category_code ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted">Taux d&apos;annulation</dt>
                      <dd className="font-medium text-foreground">{driver.cancellation_rate != null ? `${driver.cancellation_rate} %` : "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted">Paiement cash</dt>
                      <dd className={`font-medium ${driver.accepts_cash ? "text-teal" : "text-muted"}`}>{driver.accepts_cash ? "Oui" : "Non"}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted">Paiement wallet</dt>
                      <dd className={`font-medium ${driver.accepts_wallet ? "text-teal" : "text-muted"}`}>{driver.accepts_wallet ? "Oui" : "Non"}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted">Statut KYC</dt>
                      <dd className="font-medium text-foreground">{driver.kyc_status ?? driver.approval_status ?? "—"}</dd>
                    </div>
                  </dl>
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

            {tab === "wallet" && (
              <div className="space-y-6">
                <div className="rounded-card border border-border bg-surface p-5 shadow-card">
                  <h3 className="text-sm font-semibold text-foreground">Transactions portefeuille</h3>
                  <p className="mt-1 text-xs text-muted">Mouvements récents du portefeuille chauffeur.</p>
                  <div className="mt-4">
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
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <WalletBalancesCard
            balances={{
              balance_fcfa: driver.stats?.wallet_balance_fcfa ?? driver.wallet_balance_xof ?? 0,
              withdrawable_balance_xof: driver.stats?.wallet_withdrawable_fcfa,
              non_withdrawable_balance_xof: driver.stats?.wallet_non_withdrawable_fcfa,
            }}
            actions={
              <Link
                href="/franchise/finance/driver-transfers"
                className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-navy/5"
              >
                Recharger un chauffeur
              </Link>
            }
          />

          <div className="rounded-card border border-border bg-surface p-5 shadow-card text-sm">
            <h3 className="font-semibold text-foreground">Véhicule assigné</h3>
            {driver.vehicle_label ? (
              <p className="mt-3 font-medium text-foreground">{driver.vehicle_label}</p>
            ) : (
              <p className="mt-3 text-muted">Aucun véhicule assigné.</p>
            )}
          </div>

          <div className="rounded-card border border-border bg-surface p-5 shadow-card text-sm">
            <h3 className="font-semibold text-foreground">Informations</h3>
            <dl className="mt-3 space-y-2 text-muted">
              {driver.driver_code && (
                <div className="flex justify-between gap-2">
                  <dt>Code</dt>
                  <dd className="font-mono text-xs text-foreground">{driver.driver_code}</dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt>Inscription</dt>
                <dd className="text-foreground">
                  {driver.registered_at ? formatDateTime(driver.registered_at) : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Dernière connexion</dt>
                <dd className="text-foreground">
                  {driver.last_online_at ? formatDateTime(driver.last_online_at) : "—"}
                </dd>
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
                  {driver.owner_id ? (
                    <Link href={`/franchise/partners/${driver.owner_id}`} className="font-medium text-teal hover:underline">
                      {driver.owner_name ?? "—"}
                    </Link>
                  ) : (driver.owner_name ?? "—")}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Zone</dt>
                <dd className="text-foreground">{driver.zone ?? "—"}</dd>
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
          approveKyc.mutate(driverId);
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
          rejectKyc.mutate({ driverId, reason: "Documents non conformes" });
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
            rejectDoc.mutate({ docId: rejectDocTarget, reason });
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
          suspendDriver.mutate({ id: driverId, reason: undefined }, { onSuccess: () => setConfirmSuspend(false) });
        }}
        onCancel={() => setConfirmSuspend(false)}
      />

      <ConfirmModal
        open={confirmUnsuspend}
        title="Réactiver ce chauffeur ?"
        message="Le chauffeur pourra à nouveau recevoir des courses."
        confirmLabel="Réactiver"
        onConfirm={() => {
          unsuspendDriver.mutate(driverId);
          setConfirmUnsuspend(false);
        }}
        onCancel={() => setConfirmUnsuspend(false)}
      />

      <ConfirmModal
        open={confirmDelete}
        title="Supprimer ce chauffeur ?"
        message="Cette action est irréversible. Le compte et toutes les données associées seront supprimés."
        confirmLabel="Supprimer définitivement"
        variant="danger"
        onConfirm={() => {
          deleteDriver.mutate(driverId, {
            onSuccess: () => router.push("/franchise/drivers"),
          });
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
      />

      {sourcePartnerId && (
        <DriverTransferModal
          open={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          driverName={fullName}
          sourcePartnerId={sourcePartnerId}
          sourcePartnerName={driver.owner_name}
          vehicleLabel={driver.vehicle_label}
          scope="franchise"
          franchiseId={franchiseId ?? driver.franchise_id}
          isSubmitting={transferDriver.isPending}
          onSubmit={(payload) => {
            transferDriver.mutate(
              { sourcePartnerId, ...payload },
              { onSuccess: () => setShowTransferModal(false) }
            );
          }}
        />
      )}

      {/* Modal Modifier */}
      {showEditModal && (
        <ModalPortal>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-card border border-border bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">Modifier le chauffeur</h2>
              <button type="button" onClick={() => setShowEditModal(false)} className="text-muted hover:text-foreground">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <EditDriverForm
              driver={driver}
              onSave={(payload) => {
                updateDriver.mutate(
                  { id: driverId, payload },
                  { onSuccess: () => setShowEditModal(false) }
                );
              }}
              onCancel={() => setShowEditModal(false)}
              isSaving={updateDriver.isPending}
            />
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
}

function EditDriverForm({
  driver,
  onSave,
  onCancel,
  isSaving,
}: {
  driver: NonNullable<ReturnType<typeof useFranchiseDriverDetail>["data"]>;
  onSave: (payload: { first_name?: string; last_name?: string; phone?: string; email?: string; ride_category_code?: string; accepts_cash?: boolean; accepts_wallet?: boolean }) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState({
    first_name: driver.first_name ?? "",
    last_name: driver.last_name ?? "",
    phone: driver.phone ?? "",
    email: driver.email ?? "",
    ride_category_code: driver.ride_category_code ?? "",
    accepts_cash: driver.accepts_cash ?? false,
    accepts_wallet: driver.accepts_wallet ?? true,
  });

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      first_name: form.first_name || undefined,
      last_name: form.last_name || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      ride_category_code: form.ride_category_code || undefined,
      accepts_cash: form.accepts_cash,
      accepts_wallet: form.accepts_wallet,
    });
  };

  return (
    <form className="space-y-4 px-6 py-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Prénom</label>
          <input
            type="text"
            className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
            value={form.first_name}
            onChange={(e) => set("first_name", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Nom</label>
          <input
            type="text"
            className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
            value={form.last_name}
            onChange={(e) => set("last_name", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Téléphone</label>
          <input
            type="tel"
            className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Email</label>
          <input
            type="email"
            className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Catégorie</label>
          <select
            className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
            value={form.ride_category_code}
            onChange={(e) => set("ride_category_code", e.target.value)}
          >
            <option value="">— Non renseigné —</option>
            <option value="STANDARD">Standard</option>
            <option value="CONFORT">Confort</option>
            <option value="VIP">VIP</option>
            <option value="MOTO">Moto</option>
          </select>
        </div>
      </div>
      <div className="flex gap-6">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-teal"
            checked={form.accepts_cash}
            onChange={(e) => set("accepts_cash", e.target.checked)}
          />
          Accepte le cash
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-teal"
            checked={form.accepts_wallet}
            onChange={(e) => set("accepts_wallet", e.target.checked)}
          />
          Accepte le wallet
        </label>
      </div>
      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
