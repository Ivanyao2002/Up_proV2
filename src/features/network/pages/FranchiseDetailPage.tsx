"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Tabs } from "@/shared/ui/Tabs";
import { EntityStatusPill } from "@/shared/ui/EntityStatusPill";
import { KpiCard } from "@/shared/ui/KpiCard";
import { ZoneTypePill } from "@/shared/ui/ZoneTypePill";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { WalletBalancesCard } from "@/shared/finance/WalletBalancesCard";
import type { Zone } from "@/shared/types";
import { FranchiseDetailOrdersTab } from "../components/FranchiseDetailOrdersTab";

const ENTITY_STATUS_LABELS = {
  active: "Actif",
  pending: "En attente",
  suspended: "Suspendu",
} as const;

const ZONE_TYPE_LABELS: Record<Zone["type"], string> = {
  standard: "Standard",
  surge: "Surge",
  airport: "Aéroport",
};
import { Button } from "@/shared/ui/Button";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import { useFranchiseDetail } from "../api/franchiseDetail.queries";
import { useDeleteFranchise } from "../api/franchises.queries";
import { useZonesByFranchise } from "../api/zones.queries";
import { AbidjanZonesMap } from "../components/AbidjanZonesMap";

interface FranchiseDetailPageProps {
  franchiseId: string;
}

const FRANCHISE_TABS = ["overview", "partners", "orders", "zones"] as const;

export function FranchiseDetailPage({ franchiseId }: FranchiseDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const initialTab =
    tabFromUrl && FRANCHISE_TABS.includes(tabFromUrl as (typeof FRANCHISE_TABS)[number])
      ? tabFromUrl
      : "overview";
  const [tab, setTab] = useState(initialTab);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { data, isLoading, isError } = useFranchiseDetail(franchiseId);
  const deleteFranchise = useDeleteFranchise();
  const { data: franchiseZones = [], isLoading: zonesMapLoading } =
    useZonesByFranchise(franchiseId);

  if (isLoading) {
    return (
      <DetailPageSkeleton
        title="Franchise"
        breadcrumb={["Admin", "Réseau", "Franchises"]}
        kpiCount={4}
      />
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Franchise introuvable.{" "}
        <Link href="/admin/network/franchises" className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  const partnerCols: Column<(typeof data.partners)[0]>[] = [
    {
      id: "name",
      header: "Partenaire",
      cell: (p) => (
        <Link
          href={`/admin/network/partners/${p.id}`}
          className="font-medium text-foreground hover:text-teal"
        >
          {p.name}
        </Link>
      ),
      exportValue: (p) => p.name,
    },
    {
      id: "drivers",
      header: "Chauffeurs",
      cell: (p) => p.drivers_count,
      exportValue: (p) => p.drivers_count,
    },
    {
      id: "status",
      header: "Statut",
      cell: (p) => (
        <EntityStatusPill status={p.status as "active" | "pending" | "suspended"} />
      ),
      exportValue: (p) =>
        ENTITY_STATUS_LABELS[p.status as keyof typeof ENTITY_STATUS_LABELS],
    },
  ];

  const zoneCols: Column<(typeof data.zones)[0]>[] = [
    {
      id: "name",
      header: "Zone",
      cell: (z) => (
        <Link
          href={`/admin/network/zones/${z.id}`}
          className="font-medium text-foreground hover:text-teal"
        >
          {z.name}
        </Link>
      ),
      exportValue: (z) => z.name,
    },
    {
      id: "type",
      header: "Type",
      cell: (z) => <ZoneTypePill type={z.type} />,
      exportValue: (z) => ZONE_TYPE_LABELS[z.type],
    },
    {
      id: "drivers",
      header: "Actifs",
      cell: (z) => z.drivers_active,
      exportValue: (z) => z.drivers_active,
    },
  ];

  return (
    <div className="animate-fade-up">
      <div className="page-sticky-header">
        <PageHeader
          title={data.name}
          breadcrumb={["Admin", "Réseau", "Franchises", data.name]}
          actions={
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  router.push(`/admin/network/franchises/${franchiseId}/edit`)
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
          {data.city} · {data.contact_email} · {data.contact_phone}
        </p>
      </div>

      <div className="detail-page-grid lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <Tabs
            tabs={[
              { id: "overview", label: "Aperçu" },
              { id: "partners", label: "Partenaires" },
              { id: "orders", label: "Courses" },
              { id: "zones", label: "Zones" },
            ]}
            active={tab}
            onChange={setTab}
          />

          <div className="mt-6">
            {tab === "overview" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <KpiCard
                  label="Revenus / mois"
                  value={formatFCFA(data.stats.revenue_month_fcfa)}
                />
                <KpiCard
                  label="Commissions / mois"
                  value={formatFCFA(data.stats.commission_month_fcfa)}
                />
                <KpiCard label="Courses / mois" value={String(data.stats.trips_month)} />
                <KpiCard label="Chauffeurs" value={String(data.stats.drivers_count)} />
              </div>
            )}

            {tab === "partners" && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/admin/network/franchises/${franchiseId}/partners/new`
                      )
                    }
                  >
                    Nouveau partenaire
                  </Button>
                </div>
                <DataTable
                  columns={partnerCols}
                  data={data.partners}
                  rowKey={(p) => p.id}
                  exportFileName="partenaires-franchise-detail"
                />
              </div>
            )}

            {tab === "orders" && (
              <FranchiseDetailOrdersTab franchiseId={String(franchiseId)} />
            )}

            {tab === "zones" && (
              <div className="space-y-6">
                {zonesMapLoading ? (
                  <div className="h-[min(320px,45vh)] animate-pulse rounded-card border border-border bg-surface" />
                ) : (
                  <AbidjanZonesMap
                    mode="select"
                    zones={franchiseZones}
                    cityLabel={data.city !== "—" ? data.city : "Zones franchise"}
                  />
                )}
                <DataTable
                  columns={zoneCols}
                  data={data.zones}
                  rowKey={(z) => z.id}
                  exportFileName="zones-franchise-detail"
                />
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          {data.wallet ? (
            <WalletBalancesCard
              balances={{
                balance_fcfa: data.wallet.balance_fcfa,
                withdrawable_fcfa: data.wallet.withdrawable_fcfa,
                non_withdrawable_fcfa: data.wallet.non_withdrawable_fcfa,
                available_fcfa: data.wallet.available_fcfa,
                pending_withdrawal_fcfa: data.wallet.pending_withdrawal_fcfa,
              }}
              footer={
                data.wallet.recent_movements?.length ? (
                  <ul className="space-y-3">
                    {data.wallet.recent_movements.slice(0, 5).map((m) => (
                      <li
                        key={m.id}
                        className="flex items-start justify-between gap-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{m.label}</p>
                          <p className="text-xs text-muted">{formatDateTime(m.created_at)}</p>
                        </div>
                        <span
                          className={`shrink-0 tabular-nums font-medium ${
                            m.direction === "credit" ? "text-teal-dark" : "text-red-600"
                          }`}
                        >
                          {m.direction === "debit" ? "−" : "+"}
                          {formatFCFA(m.amount_fcfa)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : undefined
              }
            />
          ) : (
            <WalletBalancesCard
              title="Portefeuille"
              balances={{ balance_fcfa: data.stats.revenue_month_fcfa }}
              footer={
                <p className="text-sm text-muted">
                  Portefeuille franchise non exposé par l&apos;API — revenus du mois affichés
                  en attendant.
                </p>
              }
            />
          )}

          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h3 className="text-sm font-semibold">Transactions récentes</h3>
            {data.recent_transactions.length > 0 ? (
              <ul className="mt-3 space-y-3">
                {data.recent_transactions.map((tx) => (
                  <li
                    key={tx.id}
                    className="flex justify-between gap-2 border-b border-border/50 pb-2 text-sm last:border-0"
                  >
                    <div>
                      <p className="font-medium">{tx.label}</p>
                      <p className="text-xs text-muted">{formatDateTime(tx.created_at)}</p>
                    </div>
                    <span
                      className={`tabular-nums ${
                        tx.amount_fcfa < 0 ? "text-red-600" : "text-teal-dark"
                      }`}
                    >
                      {tx.amount_fcfa < 0 ? "−" : "+"}
                      {formatFCFA(Math.abs(tx.amount_fcfa))}
                    </span>
                  </li>
                ))}
              </ul>
            ) : data.recent_orders.length > 0 ? (
              <ul className="mt-3 space-y-3">
                {data.recent_orders.slice(0, 5).map((order) => (
                  <li
                    key={order.id}
                    className="flex justify-between gap-2 border-b border-border/50 pb-2 text-sm last:border-0"
                  >
                    <div>
                      <Link
                        href={`/admin/ops/trips/${order.id}`}
                        className="font-medium text-foreground hover:text-teal"
                      >
                        {order.ref}
                      </Link>
                      <p className="text-xs text-muted">{formatDateTime(order.created_at)}</p>
                    </div>
                    <span className="tabular-nums text-teal-dark">
                      {formatFCFA(order.amount_fcfa)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">Aucune activité récente.</p>
            )}
            <Link
              href="/admin/finance/transactions"
              className="mt-4 block text-center text-xs text-teal hover:underline"
            >
              Toutes les transactions →
            </Link>
          </div>
        </aside>
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="Supprimer cette franchise ?"
        message={
          data.partners_count > 0
            ? `Cette action est irréversible. La franchise « ${data.name} » compte ${data.partners_count} partenaire(s) — vérifiez les contraintes côté API avant de confirmer.`
            : `Cette action est irréversible. La franchise « ${data.name} » sera définitivement supprimée.`
        }
        confirmLabel={deleteFranchise.isPending ? "Suppression…" : "Supprimer"}
        variant="danger"
        onConfirm={() => {
          deleteFranchise.mutate(String(franchiseId), {
            onSuccess: () => {
              setConfirmDelete(false);
              router.push("/admin/network/franchises");
            },
          });
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
