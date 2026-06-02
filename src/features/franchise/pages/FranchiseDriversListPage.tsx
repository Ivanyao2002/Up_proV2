"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { SearchInput } from "@/shared/ui/SearchInput";
import { AccountStatusPill, AvailabilityPill } from "@/shared/ui/DriverPills";
import {
  getDriverAccountStatusLabel,
  getDriverAvailabilityLabel,
} from "@/shared/lib/driverLabels";
import type { Driver } from "@/shared/types";
import { useFranchiseDriversList } from "../api/drivers.queries";

interface FranchiseDriversListPageProps {
  pendingOnly?: boolean;
}

export function FranchiseDriversListPage({ pendingOnly }: FranchiseDriversListPageProps) {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useFranchiseDriversList();

  const rows = useMemo(() => {
    let list = data?.data ?? [];
    if (pendingOnly) {
      list = list.filter((d) => d.account_status === "pending");
    }
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (d) =>
        `${d.first_name} ${d.last_name}`.toLowerCase().includes(q) ||
        d.phone.includes(q) ||
        (d.owner_name?.toLowerCase().includes(q) ?? false)
    );
  }, [data?.data, search, pendingOnly]);

  const columns: Column<Driver>[] = [
    {
      id: "name",
      header: "Chauffeur",
      cell: (d) => (
        <div>
          <Link
            href={`/franchise/drivers/${d.id}`}
            className="font-medium text-navy hover:text-teal"
          >
            {d.first_name} {d.last_name}
          </Link>
          <p className="text-xs text-muted">{d.phone}</p>
        </div>
      ),
      exportValue: (d) => `${d.first_name} ${d.last_name} (${d.phone})`,
    },
    {
      id: "owner",
      header: "Partenaire",
      cell: (d) => d.owner_name ?? "—",
      exportValue: (d) => d.owner_name ?? "",
    },
    {
      id: "zone",
      header: "Zone",
      cell: (d) => d.zone,
      exportValue: (d) => d.zone,
    },
    {
      id: "account",
      header: "Compte",
      cell: (d) => <AccountStatusPill status={d.account_status} />,
      exportValue: (d) => getDriverAccountStatusLabel(d.account_status),
    },
    {
      id: "availability",
      header: "Disponibilité",
      cell: (d) => <AvailabilityPill status={d.availability} />,
      exportValue: (d) => getDriverAvailabilityLabel(d.availability),
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les chauffeurs.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={pendingOnly ? "Modération KYC" : "Chauffeurs du territoire"}
        breadcrumb={["Franchise", "Flotte"]}
      />

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Nom, téléphone, partenaire…"
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(d) => d.id}
        isLoading={isLoading}
        exportFileName={
          pendingOnly ? "moderation-kyc-franchise" : "chauffeurs-franchise"
        }
        emptyTitle={pendingOnly ? "Aucun dossier en attente" : "Aucun chauffeur"}
        footer={
          data?.meta ? (
            <span>{data.meta.total} chauffeurs sur le territoire</span>
          ) : undefined
        }
      />
    </div>
  );
}
