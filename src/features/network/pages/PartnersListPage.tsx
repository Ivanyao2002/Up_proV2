"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { SearchInput } from "@/shared/ui/SearchInput";
import { EntityStatusPill } from "@/shared/ui/EntityStatusPill";
import { Button } from "@/shared/ui/Button";
import type { Partner } from "@/shared/types";

const ENTITY_STATUS_LABELS = {
  active: "Actif",
  pending: "En attente",
  suspended: "Suspendu",
} as const;
import { usePartnersList } from "../api/partners.queries";

export function PartnersListPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = usePartnersList();

  const rows = useMemo(() => {
    const list = data?.data ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.franchise_name.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.contact_email.toLowerCase().includes(q)
    );
  }, [data?.data, search]);

  const columns: Column<Partner>[] = [
    {
      id: "name",
      header: "Partenaire",
      cell: (p) => (
        <div>
          <Link
            href={`/admin/network/partners/${p.id}`}
            className="font-medium text-navy hover:text-teal"
          >
            {p.name}
          </Link>
          <p className="text-xs text-muted">{p.contact_email}</p>
        </div>
      ),
      exportValue: (p) => `${p.name} (${p.contact_email})`,
    },
    {
      id: "franchise",
      header: "Franchise",
      cell: (p) => p.franchise_name,
      exportValue: (p) => p.franchise_name,
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
      className: "tabular-nums",
      cell: (p) => p.drivers_count,
      exportValue: (p) => p.drivers_count,
    },
    {
      id: "status",
      header: "Statut",
      cell: (p) => <EntityStatusPill status={p.status} />,
      exportValue: (p) => ENTITY_STATUS_LABELS[p.status],
    },
    {
      id: "phone",
      header: "Contact",
      cell: (p) => (
        <span className="whitespace-nowrap text-muted">{p.contact_phone}</span>
      ),
      exportValue: (p) => p.contact_phone,
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les partenaires.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Partenaires"
        breadcrumb={["Admin", "Réseau"]}
        actions={
          <Button variant="primary" disabled>
            Nouveau partenaire
          </Button>
        }
      />

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Nom, franchise, email…"
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        exportFileName="partenaires"
        emptyTitle="Aucun partenaire"
        footer={
          data?.meta ? (
            <span>{data.meta.total} partenaires</span>
          ) : undefined
        }
      />
    </div>
  );
}
