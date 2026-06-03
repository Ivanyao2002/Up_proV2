"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Tabs } from "@/shared/ui/Tabs";
import { EntityStatusPill } from "@/shared/ui/EntityStatusPill";
import { KpiCard } from "@/shared/ui/KpiCard";
import { ZoneTypePill } from "@/shared/ui/ZoneTypePill";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import type { Zone } from "@/shared/types";

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
import { useFranchiseDetail } from "../api/franchiseDetail.queries";

interface FranchiseDetailPageProps {
  franchiseId: string;
}

export function FranchiseDetailPage({ franchiseId }: FranchiseDetailPageProps) {
  const [tab, setTab] = useState("overview");
  const { data, isLoading, isError } = useFranchiseDetail(franchiseId);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-card bg-border" />;
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
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader
          title={data.name}
          breadcrumb={["Admin", "Réseau", "Franchises", data.name]}
          actions={<EntityStatusPill status={data.status} />}
        />
        <p className="text-sm text-muted">
          {data.city} · {data.contact_email} · {data.contact_phone}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          <Tabs
            tabs={[
              { id: "overview", label: "Aperçu" },
              { id: "partners", label: "Partenaires" },
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
              <DataTable
                columns={partnerCols}
                data={data.partners}
                rowKey={(p) => p.id}
                exportFileName="partenaires-franchise-detail"
              />
            )}

            {tab === "zones" && (
              <DataTable
                columns={zoneCols}
                data={data.zones}
                rowKey={(z) => z.id}
                exportFileName="zones-franchise-detail"
              />
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h3 className="text-sm font-semibold">Transactions récentes</h3>
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
            <Link
              href="/admin/finance/transactions"
              className="mt-4 block text-center text-xs text-teal hover:underline"
            >
              Toutes les transactions →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
