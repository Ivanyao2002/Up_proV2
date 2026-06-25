"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { KpiCard } from "@/shared/ui/KpiCard";
import { FilterChips } from "@/shared/ui/FilterChips";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import { useServerTableState } from "@/shared/hooks/useServerTableState";
import { usePartnerRentalVehicles } from "../api/rentalFleet.queries";
import {
  RENTAL_VEHICLE_CATEGORY_LABELS,
  RENTAL_VEHICLE_STATUS_CONFIG,
  type RentalVehicle,
  type RentalVehicleStatus,
} from "../api/rentalFleet.service";
import { isDocumentExpiringSoon } from "../lib/rentalFleetHelpers";

const STATUS_FILTERS: { value: RentalVehicleStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "disponible", label: "Disponibles" },
  { value: "reserve", label: "Réservés" },
  { value: "en_cours", label: "En cours" },
  { value: "maintenance", label: "Maintenance" },
  { value: "indisponible", label: "Indisponibles" },
];

export function PartnerRentalFleetPage() {
  const router = useRouter();
  const table = useServerTableState([]);
  const [statusFilter, setStatusFilter] = useState<RentalVehicleStatus | "all">("all");

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
    ],
  });

  const { data, isLoading } = usePartnerRentalVehicles({ per_page: 200 });
  const allVehicles = useMemo(() => data?.data ?? [], [data?.data]);

  const stats = useMemo(() => {
    const by = (s: RentalVehicleStatus) => allVehicles.filter((v) => v.status === s).length;
    const expiringDocs = allVehicles.filter((v) =>
      (v.documents ?? []).some((d) => isDocumentExpiringSoon(d.expires_at))
    ).length;
    return {
      total: allVehicles.length,
      disponible: by("disponible"),
      en_cours: by("en_cours"),
      maintenance: by("maintenance"),
      expiringDocs,
    };
  }, [allVehicles]);

  const searchTerm = table.search.trim().toLowerCase();
  const vehicles = useMemo(
    () =>
      allVehicles.filter((v) => {
        if (statusFilter !== "all" && v.status !== statusFilter) return false;
        if (!searchTerm) return true;
        return [v.label, v.plate, v.brand, v.model]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(searchTerm);
      }),
    [allVehicles, statusFilter, searchTerm]
  );

  const columns: Column<RentalVehicle>[] = [
    {
      id: "vehicle",
      header: "Véhicule",
      className: "min-w-[180px]",
      cell: (v) => (
        <Link
          href={`/partner/rental/fleet/${v.id}`}
          className="font-medium text-foreground hover:text-teal"
        >
          {v.label || v.plate || `Véhicule ${v.id.slice(0, 6)}`}
        </Link>
      ),
    },
    {
      id: "category",
      header: "Catégorie",
      cell: (v) => RENTAL_VEHICLE_CATEGORY_LABELS[v.category] ?? v.category,
    },
    {
      id: "plate",
      header: "Immatriculation",
      cell: (v) => v.plate || "—",
    },
    {
      id: "docs",
      header: "Documents",
      cell: (v) => {
        const expiring = (v.documents ?? []).some((d) =>
          isDocumentExpiringSoon(d.expires_at)
        );
        return expiring ? (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
            Expiration proche
          </span>
        ) : (
          <span className="text-xs text-muted">À jour</span>
        );
      },
    },
    {
      id: "pricing",
      header: "Tarif",
      cell: (v) =>
        v.has_pricing ? (
          <span className="text-xs text-green-700">Configuré</span>
        ) : (
          <span className="text-xs text-amber-600">À définir</span>
        ),
    },
    {
      id: "status",
      header: "Statut",
      cell: (v) => {
        const cfg = RENTAL_VEHICLE_STATUS_CONFIG[v.status];
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${cfg.color}`}
          >
            {cfg.label}
          </span>
        );
      },
    },
  ];

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader
        title="Flotte location"
        breadcrumb={["Partenaire", "Location", "Flotte"]}
        actions={
          <Button onClick={() => router.push("/partner/rental/fleet/new")}>
            Ajouter un véhicule
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 grid-cols-2 sm:grid-cols-4">
        <KpiCard index={0} label="Total flotte" value={String(stats.total)} isLoading={isLoading} />
        <KpiCard index={1} label="Disponibles" value={String(stats.disponible)} isLoading={isLoading} />
        <KpiCard index={2} label="En cours" value={String(stats.en_cours)} isLoading={isLoading} />
        <KpiCard
          index={3}
          label="Docs à renouveler"
          value={String(stats.expiringDocs)}
          isLoading={isLoading}
        />
      </div>

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Marque, modèle, immatriculation..."
        totalLabel={`${vehicles.length} véhicule${vehicles.length > 1 ? "s" : ""}`}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <FilterChips options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={vehicles}
        rowKey={(v) => v.id}
        isLoading={isLoading}
        pagination={{ pageSize: 10 }}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetAll}
        emptyTitle="Aucun véhicule"
        emptyDescription="Ajoutez un véhicule ou engin à votre flotte de location"
      />
    </div>
  );
}
