"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { FilterChips } from "@/shared/ui/FilterChips";
import { SearchInput } from "@/shared/ui/SearchInput";
import { formatFCFA } from "@/shared/lib/format";
import type { PlatformWallet } from "../api/wallets.service";
import { useWalletsList } from "../api/wallets.queries";

const TYPE_FILTERS = [
  { value: "all" as const, label: "Tous" },
  { value: "driver" as const, label: "Chauffeurs" },
  { value: "partner" as const, label: "Partenaires" },
  { value: "franchise" as const, label: "Franchises" },
];

const TYPE_LABELS: Record<PlatformWallet["owner_type"], string> = {
  driver: "Chauffeur",
  partner: "Partenaire",
  franchise: "Franchise",
};

function ownerHref(w: PlatformWallet): string | null {
  if (w.owner_type === "driver") return `/admin/fleet/drivers/${w.owner_id}`;
  if (w.owner_type === "partner") return `/admin/network/partners/${w.owner_id}`;
  if (w.owner_type === "franchise") return `/admin/network/franchises/${w.owner_id}`;
  return null;
}

export function WalletsListPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<PlatformWallet["owner_type"] | "all">("all");
  const { data, isLoading, isError } = useWalletsList();

  const rows = useMemo(() => {
    let list = data?.data ?? [];
    if (typeFilter !== "all") list = list.filter((w) => w.owner_type === typeFilter);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (w) =>
        w.owner_name.toLowerCase().includes(q) ||
        w.id.toLowerCase().includes(q) ||
        w.franchise_name.toLowerCase().includes(q)
    );
  }, [data?.data, search, typeFilter]);

  const columns: Column<PlatformWallet>[] = [
    {
      id: "id",
      header: "Wallet",
      cell: (w) => <span className="font-mono text-sm text-navy">{w.id}</span>,
      exportValue: (w) => w.id,
    },
    {
      id: "owner",
      header: "Titulaire",
      cell: (w) => {
        const href = ownerHref(w);
        return (
          <div>
            {href ? (
              <Link href={href} className="font-medium text-navy hover:text-teal">
                {w.owner_name}
              </Link>
            ) : (
              <span className="font-medium">{w.owner_name}</span>
            )}
            <p className="text-xs text-muted">{TYPE_LABELS[w.owner_type]}</p>
          </div>
        );
      },
      exportValue: (w) => w.owner_name,
    },
    {
      id: "franchise",
      header: "Franchise",
      cell: (w) => w.franchise_name,
      exportValue: (w) => w.franchise_name,
    },
    {
      id: "balance",
      header: "Solde",
      className: "tabular-nums",
      cell: (w) => formatFCFA(w.balance_fcfa),
      exportValue: (w) => w.balance_fcfa,
    },
    {
      id: "pending",
      header: "En attente",
      className: "tabular-nums",
      cell: (w) =>
        w.pending_fcfa > 0 ? (
          <span className="text-amber-700">{formatFCFA(w.pending_fcfa)}</span>
        ) : (
          "—"
        ),
      exportValue: (w) => w.pending_fcfa,
    },
    {
      id: "status",
      header: "Statut",
      cell: (w) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            w.status === "active"
              ? "bg-teal/15 text-teal-dark"
              : "bg-red-50 text-red-700"
          }`}
        >
          {w.status === "active" ? "Actif" : "Gelé"}
        </span>
      ),
      exportValue: (w) => (w.status === "active" ? "Actif" : "Gelé"),
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les portefeuilles.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Portefeuilles" breadcrumb={["Admin", "Finance"]} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Rechercher un titulaire…"
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
        rowKey={(w) => w.id}
        isLoading={isLoading}
        exportFileName="portefeuilles"
        emptyTitle="Aucun portefeuille"
      />
    </div>
  );
}
