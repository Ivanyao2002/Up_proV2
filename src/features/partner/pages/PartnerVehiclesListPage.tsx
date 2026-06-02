"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { SearchInput } from "@/shared/ui/SearchInput";
import { FilterChips } from "@/shared/ui/FilterChips";
import { VehicleApprovalPill } from "@/shared/ui/VehicleApprovalPill";
import { Button } from "@/shared/ui/Button";
import { KpiCard } from "@/shared/ui/KpiCard";
import {
  getVehicleApprovalLabel,
  getVehicleCategoryLabel,
} from "@/shared/lib/vehicleLabels";
import type { Vehicle, VehicleApprovalStatus } from "@/shared/types";
import { usePartnerVehiclesList } from "../api/vehicles.queries";

const STATUS_FILTERS: { value: VehicleApprovalStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "approved", label: "Approuvés" },
  { value: "pending", label: "En validation" },
  { value: "rejected", label: "Rejetés" },
  { value: "draft", label: "Brouillons" },
];

interface PartnerVehiclesListPageProps {
  pendingOnly?: boolean;
}

export function PartnerVehiclesListPage({ pendingOnly }: PartnerVehiclesListPageProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<VehicleApprovalStatus | "all">(
    pendingOnly ? "pending" : "all"
  );
  const { data, isLoading, isError } = usePartnerVehiclesList();

  const rows = useMemo(() => {
    let list = data?.data ?? [];
    if (pendingOnly) {
      list = list.filter(
        (v) => v.approval_status === "pending" || v.approval_status === "draft"
      );
    } else if (statusFilter !== "all") {
      list = list.filter((v) => v.approval_status === statusFilter);
    }
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (v) =>
        v.label.toLowerCase().includes(q) ||
        v.plate.toLowerCase().includes(q) ||
        (v.driver_name?.toLowerCase().includes(q) ?? false)
    );
  }, [data?.data, search, statusFilter, pendingOnly]);

  const columns: Column<Vehicle>[] = [
    {
      id: "vehicle",
      header: "Véhicule",
      cell: (v) => (
        <div>
          <Link
            href={`/partner/fleet/${v.id}`}
            className="font-medium text-navy hover:text-teal"
          >
            {v.label}
          </Link>
          <p className="text-xs text-muted">
            {v.plate || "Plaque à renseigner"} · {getVehicleCategoryLabel(v.category)}
          </p>
        </div>
      ),
      exportValue: (v) =>
        `${v.label} · ${v.plate || "Plaque à renseigner"} · ${getVehicleCategoryLabel(v.category)}`,
    },
    {
      id: "year",
      header: "Année",
      className: "tabular-nums",
      cell: (v) => v.year,
      exportValue: (v) => v.year,
    },
    {
      id: "color",
      header: "Couleur",
      cell: (v) => v.color,
      exportValue: (v) => v.color,
    },
    {
      id: "driver",
      header: "Chauffeur assigné",
      cell: (v) => v.driver_name ?? "—",
      exportValue: (v) => v.driver_name ?? "",
    },
    {
      id: "status",
      header: "Validation",
      cell: (v) => <VehicleApprovalPill status={v.approval_status} />,
      exportValue: (v) => getVehicleApprovalLabel(v.approval_status),
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les véhicules.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={pendingOnly ? "Véhicules à valider" : "Mes véhicules"}
        breadcrumb={["Partenaire", "Flotte"]}
        actions={
          <Link href="/partner/fleet/new">
            <Button>Ajouter un véhicule</Button>
          </Link>
        }
      />

      {data?.summary && !pendingOnly && (
        <div className="mb-6 grid gap-3 grid-cols-2 sm:grid-cols-4">
          <KpiCard label="Approuvés" value={String(data.summary.approved)} />
          <KpiCard label="En validation" value={String(data.summary.pending)} />
          <KpiCard label="Rejetés" value={String(data.summary.rejected)} />
          <KpiCard label="Brouillons" value={String(data.summary.draft)} />
        </div>
      )}

      {!pendingOnly && (
        <div className="mb-4">
          <FilterChips
            options={STATUS_FILTERS}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      )}

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Marque, plaque, chauffeur…"
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(v) => v.id}
        isLoading={isLoading}
        exportFileName={
          pendingOnly ? "vehicules-a-valider-partenaire" : "vehicules-partenaire"
        }
        emptyTitle="Aucun véhicule"
        emptyDescription={
          pendingOnly
            ? "Tous vos véhicules sont à jour."
            : "Ajoutez un véhicule puis téléversez la carte grise."
        }
        footer={
          data?.meta ? (
            <span>{data.meta.total} véhicules enregistrés</span>
          ) : undefined
        }
      />
    </div>
  );
}
