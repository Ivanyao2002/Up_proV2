"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { formatDateTime } from "@/shared/lib/format";
import type { MarketingPromo } from "../api/marketing.service";
import { useMarketingPromos } from "../api/marketing.queries";

export function MarketingPromosListPage() {
  const { data, isLoading, isError } = useMarketingPromos();

  const columns: Column<MarketingPromo>[] = [
    {
      id: "code",
      header: "Code",
      cell: (p) => (
        <div>
          <p className="font-mono font-medium text-navy">{p.code}</p>
          <p className="text-xs text-muted">{p.label}</p>
        </div>
      ),
      exportValue: (p) => p.code,
    },
    {
      id: "discount",
      header: "Réduction",
      cell: (p) =>
        p.fixed_discount_fcfa
          ? `${p.fixed_discount_fcfa} FCFA`
          : `${p.discount_pct} %`,
      exportValue: (p) => p.discount_pct || p.fixed_discount_fcfa || 0,
    },
    {
      id: "uses",
      header: "Utilisations",
      className: "tabular-nums",
      cell: (p) => `${p.uses_count.toLocaleString("fr-CI")} / ${p.max_uses.toLocaleString("fr-CI")}`,
      exportValue: (p) => p.uses_count,
    },
    {
      id: "expires",
      header: "Expire",
      cell: (p) => formatDateTime(p.expires_at),
      exportValue: (p) => p.expires_at,
    },
    {
      id: "status",
      header: "Statut",
      cell: (p) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            p.status === "active"
              ? "bg-teal/15 text-teal-dark"
              : p.status === "expired"
                ? "bg-canvas text-muted"
                : "bg-amber-50 text-amber-700"
          }`}
        >
          {p.status === "active" ? "Actif" : p.status === "expired" ? "Expiré" : "Brouillon"}
        </span>
      ),
      exportValue: (p) => p.status,
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les promos.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Codes promo"
        breadcrumb={["Admin", "Marketing"]}
        actions={
          <Link href="/admin/marketing/promos/new">
            <Button>Nouveau code</Button>
          </Link>
        }
      />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        exportFileName="promos-marketing"
        emptyTitle="Aucun code promo"
      />
    </div>
  );
}
