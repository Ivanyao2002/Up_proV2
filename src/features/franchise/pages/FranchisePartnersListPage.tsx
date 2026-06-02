"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { SearchInput } from "@/shared/ui/SearchInput";
import { EntityStatusPill } from "@/shared/ui/EntityStatusPill";
import { formatFCFA } from "@/shared/lib/format";

const ENTITY_STATUS_LABELS = {
  active: "Actif",
  pending: "En attente",
  suspended: "Suspendu",
} as const;
import type { FranchisePartner } from "../api/partners.service";
import { useFranchisePartnersList } from "../api/partners.queries";

export function FranchisePartnersListPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useFranchisePartnersList();

  const rows = useMemo(() => {
    const list = data?.data ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.contact_email.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
    );
  }, [data?.data, search]);

  const columns: Column<FranchisePartner>[] = [
    {
      id: "name",
      header: "Partenaire",
      cell: (p) => (
        <Link
          href={`/franchise/partners/${p.id}`}
          className="font-medium text-navy hover:text-teal"
        >
          {p.name}
        </Link>
      ),
      exportValue: (p) => p.name,
    },
    {
      id: "city",
      header: "Ville",
      cell: (p) => p.city,
      exportValue: (p) => p.city,
    },
    {
      id: "drivers",
      header: "Chauffeurs",
      cell: (p) => String(p.drivers_count),
      exportValue: (p) => p.drivers_count,
    },
    {
      id: "revenue",
      header: "CA mensuel",
      cell: (p) => formatFCFA(p.revenue_month_fcfa ?? 0),
      exportValue: (p) => p.revenue_month_fcfa ?? 0,
    },
    {
      id: "status",
      header: "Statut",
      cell: (p) => <EntityStatusPill status={p.status} />,
      exportValue: (p) => ENTITY_STATUS_LABELS[p.status],
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les partenaires.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Sous-partenaires"
        breadcrumb={["Franchise", "Réseau"]}
      />

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Nom, email, ville…" />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        exportFileName="sous-partenaires-franchise"
        emptyTitle="Aucun partenaire"
        footer={
          data?.meta ? <span>{data.meta.total} partenaires sur le territoire</span> : undefined
        }
      />
    </div>
  );
}
