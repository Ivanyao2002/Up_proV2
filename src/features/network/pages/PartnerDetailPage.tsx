"use client";

import { useState } from "react";
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
import { getDriverAvailabilityLabel } from "@/shared/lib/driverLabels";
import type { PartnerDetail } from "@/shared/types";
import { usePartnerDetail } from "../api/partnerDetail.queries";

interface PartnerDetailPageProps {
  partnerId: string;
}

export function PartnerDetailPage({ partnerId }: PartnerDetailPageProps) {
  const [tab, setTab] = useState("overview");
  const { data, isLoading, isError } = usePartnerDetail(partnerId);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-card bg-border" />;
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

  const driverCols: Column<PartnerDetail["drivers"][0]>[] = [
    {
      id: "name",
      header: "Chauffeur",
      cell: (d) => (
        <Link
          href={`/admin/fleet/drivers/${d.id}`}
          className="font-medium text-navy hover:text-teal"
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
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader
          title={data.name}
          breadcrumb={["Admin", "Réseau", "Partenaires", data.name]}
          actions={<EntityStatusPill status={data.status} />}
        />
        <p className="text-sm text-muted">
          <Link
            href={`/admin/network/franchises/${data.franchise_id}`}
            className="text-teal hover:underline"
          >
            {data.franchise_name}
          </Link>
          {" · "}
          {data.city} · {data.contact_email}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          <Tabs
            tabs={[
              { id: "overview", label: "Aperçu" },
              { id: "drivers", label: "Chauffeurs" },
              { id: "trips", label: "Courses" },
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
                <KpiCard label="Courses / mois" value={String(data.stats.trips_month)} />
                <KpiCard
                  label="Chauffeurs"
                  value={`${data.stats.drivers_online} en ligne / ${data.stats.drivers_count}`}
                />
              </div>
            )}

            {tab === "drivers" && (
              <DataTable
                columns={driverCols}
                data={data.drivers}
                rowKey={(d) => d.id}
                exportFileName="chauffeurs-partenaire-detail"
                emptyTitle="Aucun chauffeur"
              />
            )}

            {tab === "trips" && (
              <div className="space-y-3">
                {data.recent_trips.map((trip) => (
                  <Link
                    key={trip.id}
                    href={`/admin/ops/trips/${trip.id}`}
                    className="flex items-center justify-between rounded-card border border-border bg-surface p-4 shadow-card transition-colors hover:bg-canvas/50"
                  >
                    <div>
                      <p className="font-medium text-navy">{trip.ref}</p>
                      <p className="text-xs text-muted">
                        {formatDateTime(trip.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums font-medium">
                        {formatFCFA(trip.amount_fcfa)}
                      </span>
                      <StatusPill status={trip.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Portefeuille
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-navy">
              {formatFCFA(data.stats.wallet_balance_fcfa)}
            </p>
            {data.stats.pending_withdrawal_fcfa > 0 && (
              <p className="mt-2 text-sm text-amber-700">
                {formatFCFA(data.stats.pending_withdrawal_fcfa)} en attente de retrait
              </p>
            )}
            <Link href="/admin/finance/withdrawals">
              <Button variant="secondary" className="mt-4 w-full !text-xs">
                Voir les retraits
              </Button>
            </Link>
          </div>

          <div className="rounded-card border border-border bg-surface p-5 text-sm shadow-card">
            <h3 className="font-semibold">Coordonnées</h3>
            <p className="mt-2 text-muted">{data.address}</p>
            <p className="mt-1 text-muted">{data.contact_phone}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
