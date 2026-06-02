"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Tabs } from "@/shared/ui/Tabs";
import { Timeline, type TimelineItem } from "@/shared/ui/Timeline";
import { KycDocumentCard } from "@/shared/ui/KycDocumentCard";
import { AccountStatusPill, AvailabilityPill } from "@/shared/ui/DriverPills";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Button } from "@/shared/ui/Button";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import type { DriverTimelineEvent } from "@/shared/types";
import {
  useDriverDetail,
  useApproveDriverKyc,
  useRejectDriverKyc,
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
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);

  const { data: driver, isLoading, isError } = useDriverDetail(driverId);
  const approveKyc = useApproveDriverKyc(driverId);
  const rejectKyc = useRejectDriverKyc(driverId);

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

  return (
    <div className="animate-fade-up">
      {/* Header sticky résumé */}
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader
          title={fullName}
          breadcrumb={["Admin", "Flotte", "Chauffeurs", fullName]}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <AccountStatusPill status={driver.account_status} />
              <AvailabilityPill status={driver.availability} />
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
                  <h3 className="text-sm font-semibold text-[#212529]">Historique</h3>
                  <div className="mt-4">
                    <Timeline items={timelineItems} />
                  </div>
                </div>
              </div>
            )}

            {tab === "activity" && (
              <div className="rounded-card border border-dashed border-border bg-surface p-12 text-center text-sm text-muted">
                Historique des courses — disponible en P1 avec l&apos;API trips.
              </div>
            )}
          </div>
        </div>

        {/* Panneau latéral */}
        <aside className="space-y-4">
          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Portefeuille
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-navy">
              {formatFCFA(driver.stats.wallet_balance_fcfa)}
            </p>
            <Button variant="secondary" className="mt-4 w-full !text-xs" disabled>
              Voir les transactions
            </Button>
          </div>

          <div className="rounded-card border border-border bg-surface p-5 shadow-card text-sm">
            <h3 className="font-semibold text-[#212529]">Informations</h3>
            <dl className="mt-3 space-y-2 text-muted">
              <div className="flex justify-between gap-2">
                <dt>Inscrit le</dt>
                <dd className="text-[#212529]">{formatDateTime(driver.registered_at)}</dd>
              </div>
              {driver.approved_at && (
                <div className="flex justify-between gap-2">
                  <dt>Approuvé le</dt>
                  <dd className="text-[#212529]">{formatDateTime(driver.approved_at)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt>Partenaire ID</dt>
                <dd className="text-[#212529]">{driver.owner_id ?? "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h3 className="text-sm font-semibold text-[#212529]">Actions rapides</h3>
            <div className="mt-3 flex flex-col gap-2">
              <Button variant="secondary" className="w-full !text-xs" disabled>
                Suspendre
              </Button>
              <Button variant="ghost" className="w-full !text-xs" disabled>
                Contacter
              </Button>
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
    </div>
  );
}
