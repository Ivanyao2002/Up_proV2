"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { EntityStatusPill } from "@/shared/ui/EntityStatusPill";
import { KpiCard } from "@/shared/ui/KpiCard";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { useFranchisePartnerDetail } from "../api/partners.queries";

interface FranchisePartnerDetailPageProps {
  partnerId: string;
}

export function FranchisePartnerDetailPage({ partnerId }: FranchisePartnerDetailPageProps) {
  const { data, isLoading, isError } = useFranchisePartnerDetail(partnerId);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-card bg-border" />;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Partenaire introuvable.{" "}
        <Link href="/franchise/partners" className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={data.name}
        breadcrumb={["Franchise", "Partenaires", data.name]}
        actions={<EntityStatusPill status={data.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-card border border-border bg-surface p-6 shadow-card">
          <h2 className="text-sm font-semibold">Coordonnées</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Raison sociale</dt>
              <dd>{data.legal_name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Email</dt>
              <dd>{data.contact_email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Téléphone</dt>
              <dd>{data.contact_phone}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Adresse</dt>
              <dd className="text-right">{data.address}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Inscrit le</dt>
              <dd>{formatDateTime(data.created_at)}</dd>
            </div>
          </dl>
        </section>

        <aside className="space-y-4">
          <KpiCard label="Chauffeurs" value={String(data.drivers_count)} />
          <KpiCard label="Véhicules" value={String(data.vehicles_count)} />
          <KpiCard
            label="CA mensuel"
            value={formatFCFA(data.revenue_month_fcfa ?? 0)}
          />
        </aside>
      </div>
    </div>
  );
}
