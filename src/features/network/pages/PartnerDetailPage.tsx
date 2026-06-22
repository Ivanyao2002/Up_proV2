"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Tabs } from "@/shared/ui/Tabs";
import { EntityStatusPill } from "@/shared/ui/EntityStatusPill";
import { KpiCard } from "@/shared/ui/KpiCard";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { StatusPill } from "@/shared/ui/StatusPill";
import { AvailabilityPill } from "@/shared/ui/DriverPills";
import { Button } from "@/shared/ui/Button";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { WalletBalancesCard } from "@/shared/finance/WalletBalancesCard";
import { getDriverAvailabilityLabel } from "@/shared/lib/driverLabels";
import { getTripStatusLabel } from "@/shared/lib/tripLabels";
import type { PartnerDetail } from "@/shared/types";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { usePartnerDetail } from "../api/partnerDetail.queries";
import {
  useActivatePartner,
  useDeletePartner,
  useSuspendPartner,
} from "../api/partners.queries";
import { PartnerCommissionRulesPanel } from "@/features/finance/components/PartnerCommissionRulesPanel";
import { PartnerDocumentsPanel } from "../components/PartnerDocumentsPanel";
import { formatPartnerTypeLabel } from "../lib/partnerType";
import { formatPartnerLegalFormLabel } from "../lib/partnerLegalForm";

interface PartnerDetailPageProps {
  partnerId: string;
}

export function PartnerDetailPage({ partnerId }: PartnerDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [tab, setTab] = useState(
    initialTab === "drivers" ||
      initialTab === "trips" ||
      initialTab === "commission" ||
      initialTab === "documents"
      ? initialTab
      : "overview"
  );
  const [confirmActivate, setConfirmActivate] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { data, isLoading, isError } = usePartnerDetail(partnerId);
  const activatePartner = useActivatePartner(partnerId);
  const suspendPartner = useSuspendPartner(partnerId);
  const deletePartner = useDeletePartner();

  if (isLoading) {
    return (
      <DetailPageSkeleton
        title="Partenaire"
        breadcrumb={["Admin", "Réseau", "Partenaires"]}
      />
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Partenaire introuvable.{" "}
        <Link href="/admin/network/partners" className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  const tripCols: Column<PartnerDetail["recent_trips"][0]>[] = [
    {
      id: "ref",
      header: "Référence",
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
      id: "created_at",
      header: "Date",
      cell: (t) => formatDateTime(t.created_at),
      exportValue: (t) => t.created_at,
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
  ];

  const driverCols: Column<PartnerDetail["drivers"][0]>[] = [
    {
      id: "name",
      header: "Chauffeur",
      cell: (d) => (
        <Link
          href={`/admin/fleet/drivers/${d.id}`}
          className="font-medium text-foreground hover:text-teal"
        >
          {d.name}
        </Link>
      ),
      exportValue: (d) => d.name,
    },
    {
      id: "availability",
      header: "Statut",
      cell: (d) => <AvailabilityPill status={d.availability} />,
      exportValue: (d) => getDriverAvailabilityLabel(d.availability),
    },
    {
      id: "rating",
      header: "Note",
      cell: (d) => (d.rating > 0 ? d.rating.toFixed(2) : "—"),
      exportValue: (d) => (d.rating > 0 ? d.rating : ""),
    },
  ];

  return (
    <div className="animate-fade-up">
      <div className="page-sticky-header">
        <PageHeader
          title={data.name}
          breadcrumb={["Admin", "Réseau", "Partenaires", data.name]}
          actions={
            <div className="flex flex-wrap items-center gap-3">
              {data.status === "pending" || data.status === "suspended" ? (
                <Button type="button" onClick={() => setConfirmActivate(true)}>
                  {data.status === "suspended" ? "Réactiver" : "Approuver"}
                </Button>
              ) : null}
              {data.status === "active" ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setConfirmSuspend(true)}
                >
                  Suspendre
                </Button>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  router.push(`/admin/network/partners/${partnerId}/edit`)
                }
              >
                Modifier
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="!border-red-200 !text-red-600 hover:!bg-red-50"
                onClick={() => setConfirmDelete(true)}
              >
                Supprimer
              </Button>
              <EntityStatusPill status={data.status} />
            </div>
          }
        />
        <p className="text-sm text-muted">
          <Link
            href={`/admin/network/franchises/${data.franchise_id}`}
            className="text-teal hover:underline"
          >
            {data.franchise_name}
          </Link>
          {" · "}
          {formatPartnerTypeLabel(data.partner_type)}
          {" · "}
          {data.city} · {data.contact_email}
        </p>
      </div>

      <div className="detail-page-grid">
        <div>
          <Tabs
            tabs={[
              { id: "overview", label: "Aperçu" },
              { id: "documents", label: "Documents" },
              { id: "drivers", label: "Chauffeurs" },
              { id: "trips", label: "Courses" },
              { id: "commission", label: "Commission" },
            ]}
            active={tab}
            onChange={setTab}
          />

          <div className="mt-6">
            {tab === "overview" && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <KpiCard
                    label="Revenus / mois"
                    value={formatFCFA(data.stats.revenue_month_fcfa)}
                  />
                  <KpiCard label="Courses / mois" value={String(data.stats.trips_month)} />
                  <KpiCard
                    label="Chauffeurs"
                    value={`${data.stats.drivers_online} en ligne / ${data.stats.drivers_count}`}
                  />
                </div>

                <WalletBalancesCard
                  balances={{
                    balance_fcfa: data.wallet?.balance_fcfa ?? data.stats.wallet_balance_fcfa,
                    withdrawable_fcfa: data.wallet?.withdrawable_fcfa,
                    non_withdrawable_fcfa: data.wallet?.non_withdrawable_fcfa,
                    available_fcfa: data.wallet?.available_fcfa,
                    pending_withdrawal_fcfa:
                      data.wallet?.pending_withdrawal_fcfa ??
                      data.stats.pending_withdrawal_fcfa,
                  }}
                  footer={
                    <>
                      {!data.wallet && !data.wallet_id ? (
                        <p className="text-sm text-muted">
                          Aucun portefeuille associé à ce partenaire.
                        </p>
                      ) : null}
                      {data.wallet_id && !data.wallet ? (
                        <p className="text-xs text-muted">
                          ID {data.wallet_id.slice(0, 8)}…
                        </p>
                      ) : null}
                      {data.wallet?.recent_movements?.length ? (
                        <ul className="space-y-3">
                          {data.wallet.recent_movements.slice(0, 5).map((m) => (
                            <li
                              key={m.id}
                              className="flex items-start justify-between gap-3 text-sm"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-medium text-foreground">
                                  {m.label}
                                </p>
                                <p className="text-xs text-muted">
                                  {formatDateTime(m.created_at)}
                                </p>
                              </div>
                              <span
                                className={`shrink-0 tabular-nums font-medium ${
                                  m.direction === "credit"
                                    ? "text-teal-dark"
                                    : "text-red-600"
                                }`}
                              >
                                {m.direction === "debit" ? "−" : "+"}
                                {m.amount_fcfa ? formatFCFA(m.amount_fcfa) : "—"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <Link href="/admin/finance/withdrawals" className="mt-4 block">
                        <Button variant="secondary" className="w-full !text-xs">
                          Voir les retraits
                        </Button>
                      </Link>
                    </>
                  }
                />
              </div>
            )}

            {tab === "documents" && (
              <PartnerDocumentsPanel
                partnerId={partnerId}
                canUpload
                canReview
              />
            )}

            {tab === "drivers" && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/admin/network/partners/${partnerId}/drivers/new`
                      )
                    }
                  >
                    Nouveau chauffeur + véhicule
                  </Button>
                </div>
                <DataTable
                  columns={driverCols}
                  data={data.drivers}
                  rowKey={(d) => d.id}
                  exportFileName="chauffeurs-partenaire-detail"
                  emptyTitle="Aucun chauffeur"
                />
              </div>
            )}

            {tab === "trips" && (
              <DataTable
                columns={tripCols}
                data={data.recent_trips}
                rowKey={(t) => t.id}
                exportFileName="courses-partenaire-detail"
                emptyTitle="Aucune course"
                emptyDescription="Aucune course récente pour ce partenaire."
              />
            )}

            {tab === "commission" &&
              (data.franchise_id ? (
                <PartnerCommissionRulesPanel
                  partnerId={String(partnerId)}
                  franchiseId={String(data.franchise_id)}
                  franchiseName={data.franchise_name}
                  partnerName={data.name}
                />
              ) : (
                <div className="rounded-card border border-dashed border-border bg-surface p-8 text-center">
                  <p className="font-medium text-foreground">
                    Partenaire sans franchise
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    Les règles de commission partenaire / franchise nécessitent
                    un rattachement à une franchise.
                  </p>
                </div>
              ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-card border border-border bg-surface p-5 text-sm shadow-card">
            <h3 className="font-semibold">Infos commerciales</h3>
            <dl className="mt-3 space-y-2 text-muted">
              <div className="flex justify-between gap-2">
                <dt>Type</dt>
                <dd className="text-foreground">
                  {formatPartnerTypeLabel(data.partner_type)}
                </dd>
              </div>
              {data.legal_form ? (
                <div className="flex justify-between gap-2">
                  <dt>Forme juridique</dt>
                  <dd className="text-foreground">
                    {formatPartnerLegalFormLabel(data.legal_form)}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-2">
                <dt>Commission</dt>
                <dd className="text-foreground">
                  {data.commission_rate != null ? `${data.commission_rate} %` : "—"}
                </dd>
              </div>
            </dl>
          </div>

          {data.legal_form === "COMPANY" ? (
            <div className="rounded-card border border-border bg-surface p-5 text-sm shadow-card">
              <h3 className="font-semibold">Gérant</h3>
              {data.manager_display_name ? (
                <dl className="mt-3 space-y-2 text-muted">
                  <div className="flex justify-between gap-2">
                    <dt>Nom complet</dt>
                    <dd className="text-right text-foreground">
                      {data.manager_display_name}
                    </dd>
                  </div>
                  {data.manager_first_name ? (
                    <div className="flex justify-between gap-2">
                      <dt>Prénom</dt>
                      <dd className="text-foreground">{data.manager_first_name}</dd>
                    </div>
                  ) : null}
                  {data.manager_last_name ? (
                    <div className="flex justify-between gap-2">
                      <dt>Nom</dt>
                      <dd className="text-foreground">{data.manager_last_name}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : (
                <p className="mt-2 text-muted">
                  Aucun gérant renseigné pour cette personne morale.
                </p>
              )}
            </div>
          ) : null}

          <div className="rounded-card border border-border bg-surface p-5 text-sm shadow-card">
            <h3 className="font-semibold">Coordonnées</h3>
            <p className="mt-2 text-muted">{data.address}</p>
            <p className="mt-1 text-muted">{data.contact_phone}</p>
          </div>
        </aside>
      </div>

      <ConfirmModal
        open={confirmActivate}
        title={data.status === "suspended" ? "Réactiver ce partenaire ?" : "Approuver ce partenaire ?"}
        message="Le partenaire pourra à nouveau opérer sur la plateforme."
        confirmLabel={data.status === "suspended" ? "Réactiver" : "Approuver"}
        onConfirm={() => {
          activatePartner.mutate(undefined, {
            onSuccess: () => setConfirmActivate(false),
          });
        }}
        onCancel={() => setConfirmActivate(false)}
      />

      <ConfirmModal
        open={confirmSuspend}
        title="Suspendre ce partenaire ?"
        message="Les chauffeurs associés ne pourront plus prendre de courses."
        confirmLabel="Suspendre"
        variant="danger"
        onConfirm={() => {
          suspendPartner.mutate(undefined, {
            onSuccess: () => setConfirmSuspend(false),
          });
        }}
        onCancel={() => setConfirmSuspend(false)}
      />

      <ConfirmModal
        open={confirmDelete}
        title="Supprimer ce partenaire ?"
        message={
          data.stats.drivers_count > 0
            ? `Cette action est irréversible. « ${data.name} » compte ${data.stats.drivers_count} chauffeur(s).`
            : `Cette action est irréversible. Le partenaire « ${data.name} » sera définitivement supprimé.`
        }
        confirmLabel={deletePartner.isPending ? "Suppression…" : "Supprimer"}
        variant="danger"
        onConfirm={() => {
          deletePartner.mutate(partnerId, {
            onSuccess: () => {
              setConfirmDelete(false);
              router.push("/admin/network/partners");
            },
          });
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
