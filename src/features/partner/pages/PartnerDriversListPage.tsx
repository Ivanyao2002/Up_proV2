"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { AccountStatusPill, AvailabilityPill } from "@/shared/ui/DriverPills";
import { Button } from "@/shared/ui/Button";
import { BulkActionBar } from "@/shared/ui/BulkActionBar";
import { notificationService } from "@/core/http/notificationService";
import { driverBulkStatusMessage } from "@/shared/lib/bulkLabels";
import {
  getDriverAccountStatusLabel,
  getDriverAvailabilityLabel,
} from "@/shared/lib/driverLabels";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { Driver } from "@/shared/types";
import { usePartnerDriversList } from "../api/drivers.queries";

interface PartnerDriversListPageProps {
  pendingOnly?: boolean;
}

export function PartnerDriversListPage({ pendingOnly }: PartnerDriversListPageProps) {
  const [selected, setSelected] = useState<Set<string | number>>(new Set());

  const table = useServerTableState([], {
    ...(pendingOnly ? { account_status: "pending" } : {}),
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
  });

  const { data, isLoading, isError } = usePartnerDriversList(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<Driver>[] = [
    {
      id: "name",
      header: "Chauffeur",
      cell: (d) => (
        <div>
          <Link
            href={`/partner/drivers/${d.id}`}
            className="font-medium text-foreground hover:text-teal"
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

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Nom, téléphone, zone…"
        totalLabel={
          meta
            ? `${meta.total} chauffeur${meta.total > 1 ? "s" : ""} dans votre flotte`
            : undefined
        }
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      />

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
        pagination={false}
        serverPagination={serverPaginationFromMeta(
          meta,
          table.setPage,
          table.setPageSize
        )}
      />

      {!pendingOnly && (
        <BulkActionBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          actions={[
            {
              label: "Mettre en ligne",
              onClick: () => {
                notificationService.success(
                  driverBulkStatusMessage(selected.size, "online")
                );
                setSelected(new Set());
              },
            },
          ]}
        />
      )}
    </div>
  );
}
