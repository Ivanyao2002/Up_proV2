"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { FilterChips } from "@/shared/ui/FilterChips";
import { SelectFilter } from "@/shared/ui/SelectFilter";
import { VehicleApprovalPill } from "@/shared/ui/VehicleApprovalPill";
import { formatDateTime } from "@/shared/lib/format";
import {
  getVehicleApprovalLabel,
  getVehicleCategoryLabel,
} from "@/shared/lib/vehicleLabels";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { Vehicle, VehicleApprovalStatus } from "@/shared/types";
import { useFranchisePartnersList } from "../api/partners.queries";
import {
  useFranchiseVehiclesList,
  type FranchiseVehicleFilters,
} from "../api/franchiseVehicles.queries";

const STATUS_FILTERS: { value: VehicleApprovalStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "approved", label: "Approuvés" },
  { value: "pending", label: "En validation" },
  { value: "rejected", label: "Rejetés" },
  { value: "draft", label: "Brouillons" },
];

export function FranchiseVehiclesListPage() {
  const [statusFilter, setStatusFilter] = useState<VehicleApprovalStatus | "all">("all");
  const [partnerFilter, setPartnerFilter] = useState<string>("all");

  const table = useServerTableState([statusFilter, partnerFilter]);

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      {
        value: statusFilter,
        defaultValue: "all",
        reset: () => setStatusFilter("all"),
      },
      {
        value: partnerFilter,
        defaultValue: "all",
        reset: () => setPartnerFilter("all"),
      },
    ],
  });

  const { data: partners } = useFranchisePartnersList({ per_page: 100 });

  const listParams: FranchiseVehicleFilters = {
    page: table.page,
    per_page: table.pageSize,
    search: table.search || undefined,
    approval_status: statusFilter !== "all" ? statusFilter : undefined,
    partner_id: partnerFilter !== "all" ? partnerFilter : undefined,
  };

  const { data, isLoading } = useFranchiseVehiclesList(listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<Vehicle>[] = [
    {
      id: "vehicle",
      header: "Véhicule",
      cell: (v) => (
        <div>
          <Link
            href={`/franchise/fleet/vehicles/${v.id}`}
            className="font-medium text-foreground hover:text-teal"
          >
            {v.label}
          </Link>
          <p className="text-xs text-muted">
            {v.plate || "Plaque à renseigner"} ·{" "}
            {v.category_label ?? getVehicleCategoryLabel(v.category)}
          </p>
        </div>
      ),
      exportValue: (v) =>
        `${v.label} · ${v.plate || "—"} · ${v.category_label ?? getVehicleCategoryLabel(v.category)}`,
    },
    {
      id: "partner",
      header: "Partenaire",
      cell: (v) => v.partner_name ?? (v.partner_id ? String(v.partner_id).slice(0, 8) : "—"),
      exportValue: (v) => v.partner_name ?? v.partner_id ?? "—",
    },
    {
      id: "year",
      header: "Année",
      className: "tabular-nums",
      cell: (v) => (v.year > 0 ? v.year : "—"),
      exportValue: (v) => (v.year > 0 ? String(v.year) : "—"),
    },
    {
      id: "color",
      header: "Couleur",
      cell: (v) => v.color,
      exportValue: (v) => v.color,
    },
    {
      id: "status",
      header: "Statut",
      cell: (v) => <VehicleApprovalPill status={v.approval_status} />,
      exportValue: (v) => getVehicleApprovalLabel(v.approval_status),
    },
    {
      id: "created",
      header: "Créé le",
      cell: (v) => formatDateTime(v.created_at),
      exportValue: (v) => formatDateTime(v.created_at),
    },
    {
      id: "actions",
      header: "",
      cell: (v) => (
        <Link
          href={`/franchise/fleet/vehicles/${v.id}`}
          className="text-sm font-medium text-teal hover:underline"
        >
          Détail
        </Link>
      ),
      exportValue: () => "",
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Véhicules"
        breadcrumb={["Franchise", "Flotte", "Véhicules"]}
      />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Rechercher plaque, partenaire…"
        totalLabel={
          meta
            ? `${meta.total.toLocaleString("fr-CI")} véhicules au total`
            : undefined
        }
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <FilterChips
          options={STATUS_FILTERS}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <SelectFilter
          label="Partenaire"
          value={partnerFilter}
          onChange={setPartnerFilter}
          options={[
            { value: "all", label: "Tous les partenaires" },
            ...(partners?.data ?? []).map((p) => ({
              value: String(p.id),
              label: p.name,
            })),
          ]}
        />
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(v) => String(v.id)}
        isLoading={isLoading}
        emptyTitle="Aucun véhicule"
        exportFileName="vehicules-franchise"
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
