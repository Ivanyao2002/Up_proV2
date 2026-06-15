"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { KpiCard } from "@/shared/ui/KpiCard";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { FilterChips } from "@/shared/ui/FilterChips";
import { SelectFilter } from "@/shared/ui/SelectFilter";
import { ServicePill } from "@/shared/ui/ServicePill";
import { formatFCFA } from "@/shared/lib/format";
import { getServiceLabel } from "@/shared/lib/tripLabels";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { PricingRule, TripService } from "@/shared/types";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import { useFranchisePricing } from "../api/pricing.queries";

const STATUS_FILTERS = [
  { value: "all" as const, label: "Toutes" },
  { value: "active" as const, label: "En vigueur" },
  { value: "draft" as const, label: "Brouillons" },
];

const SERVICE_OPTIONS = [
  { value: "all" as const, label: "Tous services" },
  { value: "taxi" as const, label: "Taxi" },
  { value: "delivery" as const, label: "Livraison" },
];

export function FranchisePricingPage() {
  const legacy = useLegacyPortalApi();
  const [statusFilter, setStatusFilter] = useState<"all" | PricingRule["status"]>("all");
  const [serviceFilter, setServiceFilter] = useState<(typeof SERVICE_OPTIONS)[number]["value"]>("all");

  const table = useServerTableState([statusFilter, serviceFilter], {
    status: statusFilter !== "all" ? statusFilter : undefined,
    service: serviceFilter !== "all" ? serviceFilter : undefined,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
      { value: serviceFilter, defaultValue: "all", reset: () => setServiceFilter("all") },
    ],
  });

  const { data, isLoading, isError } = useFranchisePricing(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const summary = data?.summary;

  const columns: Column<PricingRule>[] = [
    {
      id: "zone",
      header: "Zone / Règle",
      cell: (p) => (
        <div>
          <span className="font-medium text-foreground">{p.zone_name}</span>
          {p.rule_name && p.rule_name !== p.zone_name && (
            <p className="text-xs text-muted">{p.rule_name}</p>
          )}
          {p.category_code && (
            <p className="text-xs text-muted">{p.category_code}</p>
          )}
        </div>
      ),
      exportValue: (p) => p.rule_name ?? p.zone_name,
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
      exportValue: (p) => (p.surge_multiplier > 1 ? `×${p.surge_multiplier}` : ""),
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
          {p.status === "active" ? "En vigueur" : "Brouillon"}
        </span>
      ),
      exportValue: (p) => (p.status === "active" ? "En vigueur" : "Brouillon"),
    },
    {
      id: "actions",
      header: "",
      cell: (p) => (
        <Link
          href={`/franchise/pricing/${p.id}`}
          className="text-xs font-medium text-teal hover:underline"
        >
          {legacy ? "Modifier" : "Détail"}
        </Link>
      ),
      exportValue: () => "",
    },
  ];

  if (isError) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger la tarification.{" "}
        <Link href="/franchise/pricing" className="text-teal underline">
          Réessayer
        </Link>
      </p>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader
          title="Tarification"
          breadcrumb={["Franchise", "Tarification"]}
          actions={
            <Link href="/franchise/pricing/new">
              <Button variant="primary">Nouvelle grille</Button>
            </Link>
          }
        />
        {summary && (
          <p className="mt-1 text-sm text-muted">
            {summary.franchise_name} · {summary.active_count} en vigueur · {summary.draft_count} brouillon{summary.draft_count !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {summary && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
          <KpiCard
            label="Grilles en vigueur"
            value={String(summary.active_count)}
            variant="teal"
          />
          <KpiCard
            label="Brouillons"
            value={String(summary.draft_count)}
            variant="navy"
          />
          <KpiCard
            label="Total grilles"
            value={String((meta?.total ?? 0))}
            className="col-span-2 lg:col-span-1"
          />
        </div>
      )}

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Zone, règle, catégorie…"
        totalLabel={meta ? `${meta.total} grille${meta.total !== 1 ? "s" : ""}` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <FilterChips
          options={STATUS_FILTERS}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <SelectFilter
          label="Service"
          value={serviceFilter}
          onChange={setServiceFilter}
          options={SERVICE_OPTIONS}
        />
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        exportFileName="tarification-franchise"
        emptyTitle="Aucune grille tarifaire"
        emptyDescription="Aucune grille ne correspond aux filtres sélectionnés."
        pagination={false}
        serverPagination={serverPaginationFromMeta(
          meta,
          table.setPage,
          table.setPageSize
        )}
      />
    </div>
  );
}
