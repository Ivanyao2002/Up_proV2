"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { SearchInput } from "@/shared/ui/SearchInput";
import { ZoneTypePill } from "@/shared/ui/ZoneTypePill";
import { Button } from "@/shared/ui/Button";
import type { Zone } from "@/shared/types";

const ZONE_TYPE_LABELS: Record<Zone["type"], string> = {
  standard: "Standard",
  surge: "Surge",
  airport: "Aéroport",
};
import { useZonesList } from "../api/zones.queries";

export function ZonesListPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useZonesList();

  const rows = useMemo(() => {
    const list = data?.data ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (z) =>
        z.name.toLowerCase().includes(q) ||
        z.city.toLowerCase().includes(q) ||
        z.franchise_name.toLowerCase().includes(q)
    );
  }, [data?.data, search]);

  const columns: Column<Zone>[] = [
    {
      id: "name",
      header: "Zone",
      cell: (z) => (
        <div>
          <Link
            href={`/admin/network/zones/${z.id}`}
            className="font-medium text-navy hover:text-teal"
          >
            {z.name}
          </Link>
          <p className="text-xs text-muted">{z.city}</p>
        </div>
      ),
      exportValue: (z) => `${z.name} (${z.city})`,
    },
    {
      id: "franchise",
      header: "Franchise",
      cell: (z) => z.franchise_name,
      exportValue: (z) => z.franchise_name,
    },
    {
      id: "type",
      header: "Type",
      cell: (z) => <ZoneTypePill type={z.type} />,
      exportValue: (z) => ZONE_TYPE_LABELS[z.type],
    },
    {
      id: "surge",
      header: "Multiplicateur",
      className: "tabular-nums",
      cell: (z) =>
        z.surge_multiplier && z.surge_multiplier > 1
          ? `×${z.surge_multiplier}`
          : "—",
      exportValue: (z) =>
        z.surge_multiplier && z.surge_multiplier > 1 ? z.surge_multiplier : "",
    },
    {
      id: "drivers",
      header: "Chauffeurs actifs",
      className: "tabular-nums",
      cell: (z) => z.drivers_active.toLocaleString("fr-CI"),
      exportValue: (z) => z.drivers_active,
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les zones.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Zones"
        breadcrumb={["Admin", "Réseau"]}
        actions={
          <Button variant="primary" disabled>
            Nouvelle zone
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Zone, ville, franchise…"
        />
        {data?.meta && (
          <span className="text-sm text-muted">{data.meta.total} zones</span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(z) => z.id}
        isLoading={isLoading}
        exportFileName="zones"
        emptyTitle="Aucune zone"
        footer={
          data?.meta ? (
            <span>
              {data.meta.total} zone{data.meta.total > 1 ? "s" : ""} · Abidjan
            </span>
          ) : undefined
        }
      />
    </div>
  );
}
