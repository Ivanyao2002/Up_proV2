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
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { RejectReasonModal } from "@/shared/ui/RejectReasonModal";
import { usePermission } from "@/core/auth/usePermission";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [rejectDocTarget, setRejectDocTarget] = useState<string | null>(null);
  const canModerate = usePermission("fleet.kyc.approve");

  const { data: driver, isLoading, isError } = useFranchiseDriverDetail(driverId);
  const approveKyc = useApproveFranchiseDriverKyc();
  const rejectKyc = useRejectFranchiseDriverKyc();
  const approveDoc = useApproveFranchiseDocument(driverId);
  const rejectDoc = useRejectFranchiseDocument(driverId);
  const suspendDriver = useSuspendFranchiseDriver();
  const unsuspendDriver = useUnsuspendFranchiseDriver();
  const updateDriver = useUpdateFranchiseDriver();
  const deleteDriver = useDeleteFranchiseDriver();

  if (isLoading) {
    return (
      <DetailPageSkeleton title="Chauffeur" breadcrumb={["Franchise", "Chauffeurs"]} />
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
  const timelineItems = driverTimelineToItems(driver.timeline || []);
  const kycDisplayItems = organizeDriverKycDocuments(driver.kyc_documents || []);

  const tabs = [
    { id: "kyc", label: "KYC & documents" },
    { id: "overview", label: "Aperçu" },
  ];

  return (
    <div className="animate-fade-up">
      {/* Header sticky résumé */}
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader
          title={fullName}
          breadcrumb={["Franchise", "Chauffeurs", fullName]}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {isPending && canModerate && (
                <>
                  <Button onClick={() => setConfirmApprove(true)}>Approuver le compte</Button>
                  <Button variant="secondary" onClick={() => setConfirmReject(true)}>Rejeter</Button>
                </>
              )}
              <Button variant="secondary" onClick={() => setShowEditModal(true)}>Modifier</Button>
              {isSuspended ? (
                <Button variant="secondary" onClick={() => setConfirmUnsuspend(true)}
                  className="border-teal text-teal hover:bg-teal/10">
                  Réactiver
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => setConfirmSuspend(true)}
                  className="border-amber-500 text-amber-600 hover:bg-amber-50">
                  Suspendre
                </Button>
              )}
              <Button variant="secondary" onClick={() => setConfirmDelete(true)}
                className="border-red-300 text-red-600 hover:bg-red-50">
                Supprimer
              </Button>
            </div>
          }
        />
        <p className="mt-1 text-sm text-muted">
          {driver.driver_code ? (
            <span className="font-medium text-foreground">{driver.driver_code}</span>
          ) : null}
          {driver.driver_code ? " · " : ""}
          {driver.phone ?? "—"}
          {driver.email ? ` · ${driver.email}` : ""} · {driver.zone ?? "—"}
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
                            canReview={isPending && canModerate}
                            onApprove={(documentId) => approveDoc.mutate(documentId)}
                            onReject={(documentId) => setRejectDocTarget(documentId)}
                          />
                        </div>
                      ) : (
                        <KycDocumentCard
                          key={item.document.id}
                          document={item.document}
                          canReview={
                            isPending &&
                            canModerate &&
                            item.document.status === "pending" &&
                            Boolean(item.document.uploaded_at) &&
                            !item.document.id.startsWith("slot-")
                          }
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
                {/* KPIs stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <KpiCard label="Courses terminées" value={String(driver.stats?.trips_completed ?? driver.total_completed_orders ?? 0)} variant="navy" />
                  <KpiCard label="Courses totales" value={String(driver.stats?.trips_total ?? driver.trips_count ?? 0)} variant="teal" />
                  <KpiCard label="Annulations" value={String(driver.stats?.trips_cancelled ?? 0)} variant="navy" />
                  <KpiCard
                    label="Note moyenne"
                    value={(driver.rating_avg ?? driver.rating) > 0 ? `${(driver.rating_avg ?? driver.rating).toFixed(1)} / 5` : "—"}
                    variant="teal"
                  />
                  <KpiCard
                    label="Taux d'acceptation"
                    value={driver.stats?.acceptance_rate_pct != null ? `${driver.stats.acceptance_rate_pct} %` : "—"}
                    variant="navy"
                  />
                  <KpiCard
                    label="Score de fiabilité"
                    value={driver.reliability_score != null ? `${driver.reliability_score} / 100` : "—"}
                    variant="teal"
                  />
                </div>

                {/* Infos conducteur */}
                <div className="rounded-card border border-border bg-surface p-5 shadow-card">
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Profil conducteur</h3>
                  <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted">Catégorie</dt>
                      <dd className="font-medium text-foreground">{driver.ride_category_code ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted">Taux d'annulation</dt>
                      <dd className="font-medium text-foreground">{driver.cancellation_rate != null ? `${driver.cancellation_rate} %` : "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted">Nombre d'avis</dt>
                      <dd className="font-medium text-foreground">{driver.rating_count ?? "—"}</dd>
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
                      <dt className="text-muted">Dernière connexion</dt>
                      <dd className="font-medium text-foreground">{driver.last_online_at ? formatDateTime(driver.last_online_at) : "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted">Statut KYC</dt>
                      <dd className="font-medium text-foreground">{driver.kyc_status ?? driver.approval_status ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted">Onboarding</dt>
                      <dd className="font-medium text-foreground">{driver.onboarding_status ?? "—"}</dd>
                    </div>
                  </dl>
                </div>

                {/* Timeline */}
                {timelineItems.length > 0 && (
                  <div className="rounded-card border border-border bg-surface p-6 shadow-card">
                    <h3 className="text-sm font-semibold text-foreground">Historique</h3>
                    <div className="mt-4">
                      <Timeline items={timelineItems} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Panneau latéral */}
        <aside className="space-y-4">
          {/* Statut en ligne + wallet */}
          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">Portefeuille</p>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${driver.is_online ? "bg-teal/10 text-teal" : "bg-muted/10 text-muted"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${driver.is_online ? "bg-teal" : "bg-muted"}`} />
                {driver.is_online ? "En ligne" : "Hors ligne"}
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-heading">
              {formatFCFA(driver.stats?.wallet_balance_fcfa ?? driver.wallet_balance_xof ?? 0)}
            </p>
          </div>

          {/* Véhicule */}
          <div className="rounded-card border border-border bg-surface p-5 shadow-card text-sm">
            <h3 className="font-semibold text-foreground">Véhicule assigné</h3>
            <p className="mt-3 text-muted">
              {driver.vehicle_label ?? "Aucun véhicule assigné."}
            </p>
          </div>

          {/* Contacts */}
          <div className="rounded-card border border-border bg-surface p-5 shadow-card text-sm">
            <h3 className="font-semibold text-foreground">Contact</h3>
            <dl className="mt-3 space-y-2">
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Téléphone</dt>
                <dd className="text-foreground">{driver.phone ?? "—"}</dd>
              </div>
              {driver.email && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Email</dt>
                  <dd className="truncate text-foreground">{driver.email}</dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Zone</dt>
                <dd className="text-foreground">{driver.zone ?? "—"}</dd>
              </div>
            </dl>
          </div>

          {/* Infos administratives */}
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
                <dt>Inscrit le</dt>
                <dd className="text-foreground">
                  {driver.registered_at ? formatDateTime(driver.registered_at) : "—"}
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
                    <Link href={`/franchise/partners/${driver.owner_id}`} className="text-teal hover:underline">
                      {driver.owner_name ?? "—"}
                    </Link>
                  ) : (driver.owner_name ?? "—")}
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

      {/* Modal Suspendre */}
      {confirmSuspend && (
        <ModalPortal>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-card border border-border bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">Suspendre ce chauffeur ?</h2>
            </div>
            <div className="space-y-4 px-6 py-5">
              <p className="text-sm text-muted">
                Le chauffeur ne pourra plus recevoir de courses pendant la suspension.
              </p>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Motif (optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex : comportement signalé"
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <Button variant="secondary" onClick={() => setConfirmSuspend(false)}>Annuler</Button>
                <Button
                  className="bg-amber-600 text-white hover:bg-amber-700"
                  onClick={() => {
                    suspendDriver.mutate({ id: driverId, reason: suspendReason || undefined });
                    setConfirmSuspend(false);
                    setSuspendReason("");
                  }}
                >
                  Confirmer la suspension
                </Button>
              </div>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

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
