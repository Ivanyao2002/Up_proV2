"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { SearchInput } from "@/shared/ui/SearchInput";
import { EntityStatusPill } from "@/shared/ui/EntityStatusPill";
import { Button } from "@/shared/ui/Button";
import { formatFCFA } from "@/shared/lib/format";
import type { Franchise } from "@/shared/types";

const ENTITY_STATUS_LABELS = {
  active: "Actif",
  pending: "En attente",
  suspended: "Suspendu",
} as const;
import { useFranchisesList } from "../api/franchises.queries";

export function FranchisesListPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useFranchisesList();

  const rows = useMemo(() => {
    const list = data?.data ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (f) => f.name.toLowerCase().includes(q) || f.city.toLowerCase().includes(q)
    );
  }, [data?.data, search]);

  const columns: Column<Franchise>[] = [
    {
      id: "name",
      header: "Franchise",
      cell: (f) => (
        <div>
          <Link
            href={`/admin/network/franchises/${f.id}`}
            className="font-medium text-navy hover:text-teal"
          >
            {f.name}
          </Link>
          <p className="text-xs text-muted">{f.city}</p>
        </div>
      ),
      exportValue: (f) => `${f.name} (${f.city})`,
    },
    {
      id: "status",
      header: "Statut",
      cell: (f) => <EntityStatusPill status={f.status} />,
      exportValue: (f) => ENTITY_STATUS_LABELS[f.status],
    },
    {
      id: "partners",
      header: "Partenaires",
      className: "tabular-nums",
      cell: (f) => f.partners_count,
      exportValue: (f) => f.partners_count,
    },
    {
      id: "drivers",
      header: "Chauffeurs",
      className: "tabular-nums",
      cell: (f) => f.drivers_count.toLocaleString("fr-CI"),
      exportValue: (f) => f.drivers_count,
    },
    {
      id: "zones",
      header: "Zones",
      className: "tabular-nums",
      cell: (f) => f.zones_count,
      exportValue: (f) => f.zones_count,
    },
    {
      id: "revenue",
      header: "Revenus / mois",
      className: "tabular-nums whitespace-nowrap",
      cell: (f) => formatFCFA(f.revenue_month_fcfa),
      exportValue: (f) => f.revenue_month_fcfa,
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les franchises.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Franchises"
        breadcrumb={["Admin", "Réseau"]}
        actions={
          <Button variant="primary" disabled>
            Nouvelle franchise
          </Button>
        }
      />

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Nom, ville…"
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(f) => f.id}
        isLoading={isLoading}
        exportFileName="franchises"
        emptyTitle="Aucune franchise"
        footer={
          data?.meta ? (
            <span>{data.meta.total} franchises</span>
          ) : undefined
        }
      />
    </div>
  );
}
