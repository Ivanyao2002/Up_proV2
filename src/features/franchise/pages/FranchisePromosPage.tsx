"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { formatDateTime } from "@/shared/lib/format";
import type { FranchisePromo } from "../api/promos.service";
import { useFranchisePromos } from "../api/promos.queries";

export function FranchisePromosPage() {
  const { data, isLoading, isError } = useFranchisePromos();

  const columns: Column<FranchisePromo>[] = [
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
          : p.discount_pct > 0
            ? `${p.discount_pct} %`
            : "—",
      exportValue: (p) => p.discount_pct || p.fixed_discount_fcfa || 0,
    },
    {
      id: "uses",
      header: "Utilisations",
      className: "tabular-nums",
      cell: (p) => `${p.uses_count} / ${p.max_uses}`,
      exportValue: (p) => p.uses_count,
    },
    {
      id: "expires",
      header: "Expire le",
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
        title="Codes promo territoire"
        breadcrumb={["Franchise", "Marketing"]}
      />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        exportFileName="promos-franchise"
        emptyTitle="Aucun code promo"
      />
    </div>
  );
}
