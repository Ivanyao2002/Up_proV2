"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { SearchInput } from "@/shared/ui/SearchInput";
import { FilterChips } from "@/shared/ui/FilterChips";
import { ServicePill } from "@/shared/ui/ServicePill";
import { Button } from "@/shared/ui/Button";
import { formatFCFA } from "@/shared/lib/format";
import { getServiceLabel } from "@/shared/lib/tripLabels";
import type { PricingRule, TripService } from "@/shared/types";
import { usePricingList } from "../api/pricing.queries";

const STATUS_FILTERS = [
  { value: "all" as const, label: "Tous" },
  { value: "active" as const, label: "Actifs" },
  { value: "draft" as const, label: "Brouillons" },
];

export function PricingListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PricingRule["status"]>("all");
  const { data, isLoading, isError } = usePricingList();

  const rows = useMemo(() => {
    let list = data?.data ?? [];
    if (statusFilter !== "all") {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((p) => p.zone_name.toLowerCase().includes(q));
  }, [data?.data, search, statusFilter]);

  const columns: Column<PricingRule>[] = [
    {
      id: "zone",
      header: "Zone",
      cell: (p) => <span className="font-medium text-navy">{p.zone_name}</span>,
      exportValue: (p) => p.zone_name,
    },
    {
      id: "service",
      header: "Service",
      cell: (p) => <ServicePill service={p.service as TripService} />,
      exportValue: (p) => getServiceLabel(p.service),
    },
    {
      id: "base",
      header: "Prise en charge",
      className: "tabular-nums",
      cell: (p) => formatFCFA(p.base_fare_fcfa),
      exportValue: (p) => p.base_fare_fcfa,
    },
    {
      id: "km",
      header: "Par km",
      className: "tabular-nums",
      cell: (p) => formatFCFA(p.per_km_fcfa),
      exportValue: (p) => p.per_km_fcfa,
    },
    {
      id: "min",
      header: "Minimum",
      className: "tabular-nums",
      cell: (p) => formatFCFA(p.min_fare_fcfa),
      exportValue: (p) => p.min_fare_fcfa,
    },
    {
      id: "surge",
      header: "Surge",
      className: "tabular-nums",
      cell: (p) =>
        p.surge_multiplier > 1 ? (
          <span className="font-medium text-amber-700">×{p.surge_multiplier}</span>
        ) : (
          <span className="text-muted">—</span>
        ),
      exportValue: (p) => p.surge_multiplier,
    },
    {
      id: "status",
      header: "Statut",
      cell: (p) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            p.status === "active"
              ? "bg-teal/15 text-teal-dark"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {p.status === "active" ? "Actif" : "Brouillon"}
        </span>
      ),
      exportValue: (p) => (p.status === "active" ? "Actif" : "Brouillon"),
    },
    {
      id: "actions",
      header: "",
      cell: (p) => (
        <Link
          href={`/admin/settings/pricing/${p.id}`}
          className="text-xs font-medium text-teal hover:underline"
        >
          Modifier
        </Link>
      ),
      exportValue: () => "",
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger la tarification.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Tarification"
        breadcrumb={["Admin", "Paramètres"]}
        actions={
          <Link href="/admin/settings/pricing/new">
            <Button variant="primary">Nouvelle grille</Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Rechercher une zone…"
          />
        </div>
        <FilterChips
          options={STATUS_FILTERS}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        exportFileName="tarification"
        emptyTitle="Aucune règle tarifaire"
      />
    </div>
  );
}
