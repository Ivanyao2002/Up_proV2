"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { SearchInput } from "@/shared/ui/SearchInput";
import { AccountStatusPill, AvailabilityPill } from "@/shared/ui/DriverPills";
import { Button } from "@/shared/ui/Button";
import { BulkActionBar } from "@/shared/ui/BulkActionBar";
import { notificationService } from "@/core/http/notificationService";
import {
  getDriverAccountStatusLabel,
  getDriverAvailabilityLabel,
} from "@/shared/lib/driverLabels";
import type { Driver } from "@/shared/types";
import { usePartnerDriversList } from "../api/drivers.queries";

interface PartnerDriversListPageProps {
  pendingOnly?: boolean;
}

export function PartnerDriversListPage({ pendingOnly }: PartnerDriversListPageProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const { data, isLoading, isError } = usePartnerDriversList();

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
        d.zone.toLowerCase().includes(q)
    );
  }, [data?.data, search, pendingOnly]);

  const columns: Column<Driver>[] = [
    {
      id: "name",
      header: "Chauffeur",
      cell: (d) => (
        <div>
          <Link
            href={`/partner/drivers/${d.id}`}
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
      id: "vehicle",
      header: "Véhicule",
      cell: (d) => d.vehicle_label ?? "—",
      exportValue: (d) => d.vehicle_label ?? "",
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
    <div className="animate-fade-up pb-24">
      <PageHeader
        title={pendingOnly ? "Chauffeurs en attente" : "Mes chauffeurs"}
        breadcrumb={["Partenaire", "Flotte"]}
        actions={
          !pendingOnly ? (
            <Link href="/partner/drivers/new">
              <Button>Ajouter un chauffeur</Button>
            </Link>
          ) : undefined
        }
      />

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Nom, téléphone, zone…"
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(d) => d.id}
        isLoading={isLoading}
        exportFileName={
          pendingOnly ? "chauffeurs-en-attente-partenaire" : "chauffeurs-partenaire"
        }
        emptyTitle={pendingOnly ? "Aucun dossier en attente" : "Aucun chauffeur"}
        selectable={!pendingOnly}
        selectedKeys={selected}
        onSelectionChange={setSelected}
        footer={
          data?.meta ? (
            <span>{data.meta.total} chauffeurs dans votre flotte</span>
          ) : undefined
        }
      />

      {!pendingOnly && (
        <BulkActionBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          actions={[
            {
              label: "Mettre en ligne",
              onClick: () =>
                notificationService.info(`${selected.size} chauffeur(s) — mock`),
            },
          ]}
        />
      )}
    </div>
  );
}
