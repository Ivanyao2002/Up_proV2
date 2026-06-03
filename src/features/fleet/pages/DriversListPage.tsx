"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { BulkActionBar } from "@/shared/ui/BulkActionBar";
import { SearchInput } from "@/shared/ui/SearchInput";
import { AccountStatusPill, AvailabilityPill } from "@/shared/ui/DriverPills";
import { notificationService } from "@/core/http/notificationService";
import {
  getDriverAccountStatusLabel,
  getDriverAvailabilityLabel,
} from "@/shared/lib/driverLabels";
import type { Driver } from "@/shared/types";
import { useDriversList } from "../api/drivers.queries";

export function DriversListPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const { data, isLoading, isError } = useDriversList({ search: search || undefined });

  const rows = useMemo(() => {
    const list = data?.data ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (d) =>
        `${d.first_name} ${d.last_name}`.toLowerCase().includes(q) ||
        d.phone.includes(q) ||
        d.zone.toLowerCase().includes(q) ||
        (d.owner_name?.toLowerCase().includes(q) ?? false)
    );
  }, [data?.data, search]);

  const columns: Column<Driver>[] = [
    {
      id: "name",
      header: "Chauffeur",
      cell: (d) => (
        <div>
          <Link
            href={`/admin/fleet/drivers/${d.id}`}
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
      id: "zone",
      header: "Zone",
      cell: (d) => d.zone,
      exportValue: (d) => d.zone,
    },
    {
      id: "owner",
      header: "Partenaire",
      cell: (d) => d.owner_name ?? "—",
      exportValue: (d) => d.owner_name ?? "",
    },
    {
      id: "vehicle",
      header: "Véhicule",
      cell: (d) => (
        <span className="text-muted">{d.vehicle_label ?? "—"}</span>
      ),
      exportValue: (d) => d.vehicle_label ?? "",
    },
    {
      id: "rating",
      header: "Note",
      className: "tabular-nums",
      cell: (d) => (d.rating > 0 ? d.rating.toFixed(2) : "—"),
      exportValue: (d) => (d.rating > 0 ? d.rating : ""),
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
    return (
      <p className="text-sm text-red-600">Impossible de charger les chauffeurs.</p>
    );
  }

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader
        title="Chauffeurs"
        breadcrumb={["Admin", "Flotte"]}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Nom, téléphone, zone, partenaire…"
        />
        {data?.meta && (
          <span className="text-sm text-muted">
            {data.meta.total.toLocaleString("fr-CI")} chauffeurs au total
          </span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(d) => d.id}
        isLoading={isLoading}
        exportFileName="chauffeurs"
        emptyTitle="Aucun chauffeur"
        emptyDescription="Modifiez vos filtres ou élargissez la recherche."
        selectable
        selectedKeys={selected}
        onSelectionChange={setSelected}
        footer={
          data?.meta ? (
            <>
              <span>
                Page {data.meta.current_page} / {data.meta.last_page}
              </span>
              <span>{data.meta.per_page} par page</span>
            </>
          ) : undefined
        }
      />

      <BulkActionBar
        count={selected.size}
        onClear={() => setSelected(new Set())}
        actions={[
          {
            label: "Mettre en ligne",
            onClick: () => {
              notificationService.info(
                `${selected.size} chauffeur(s) — action mock`
              );
            },
          },
          {
            label: "Hors ligne",
            variant: "secondary",
            onClick: () => {
              notificationService.warning(
                `${selected.size} chauffeur(s) — action mock`
              );
            },
          },
        ]}
      />
    </div>
  );
}
