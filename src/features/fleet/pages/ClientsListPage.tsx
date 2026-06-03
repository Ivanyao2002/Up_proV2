"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { SearchInput } from "@/shared/ui/SearchInput";
import { FilterChips } from "@/shared/ui/FilterChips";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import type { FleetClient } from "../api/clients.service";
import { useClientsList } from "../api/clients.queries";

const TYPE_FILTERS = [
  { value: "all" as const, label: "Tous" },
  { value: "b2c" as const, label: "B2C" },
  { value: "b2b" as const, label: "B2B" },
];

export function ClientsListPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FleetClient["type"] | "all">("all");
  const { data, isLoading, isError } = useClientsList();

  const rows = useMemo(() => {
    let list = data?.data ?? [];
    if (typeFilter !== "all") list = list.filter((c) => c.type === typeFilter);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false)
    );
  }, [data?.data, search, typeFilter]);

  const columns: Column<FleetClient>[] = [
    {
      id: "name",
      header: "Client",
      cell: (c) => (
        <div>
          <Link
            href={`/admin/fleet/clients/${c.id}`}
            className="font-medium text-navy hover:text-teal"
          >
            {c.full_name}
          </Link>
          <p className="text-xs text-muted">{c.phone}</p>
        </div>
      ),
      exportValue: (c) => c.full_name,
    },
    {
      id: "type",
      header: "Type",
      cell: (c) => (
        <span className="text-xs font-medium uppercase text-muted">{c.type}</span>
      ),
      exportValue: (c) => c.type,
    },
    {
      id: "trips",
      header: "Courses",
      className: "tabular-nums",
      cell: (c) => c.trips_count,
      exportValue: (c) => c.trips_count,
    },
    {
      id: "wallet",
      header: "Wallet",
      className: "tabular-nums",
      cell: (c) => formatFCFA(c.wallet_balance_fcfa),
      exportValue: (c) => c.wallet_balance_fcfa,
    },
    {
      id: "last",
      header: "Dernière course",
      cell: (c) => (c.last_trip_at ? formatDateTime(c.last_trip_at) : "—"),
      exportValue: (c) => c.last_trip_at ?? "",
    },
    {
      id: "status",
      header: "Statut",
      cell: (c) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            c.status === "active"
              ? "bg-teal/15 text-teal-dark"
              : "bg-red-50 text-red-700"
          }`}
        >
          {c.status === "active" ? "Actif" : "Suspendu"}
        </span>
      ),
      exportValue: (c) => c.status,
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les clients.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Clients" breadcrumb={["Admin", "Flotte"]} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Rechercher un client…"
          />
        </div>
        <FilterChips
          options={TYPE_FILTERS}
          value={typeFilter}
          onChange={setTypeFilter}
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        exportFileName="clients"
        emptyTitle="Aucun client"
      />
    </div>
  );
}
