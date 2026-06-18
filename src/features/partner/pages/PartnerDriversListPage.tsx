"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { formatDate } from "@/shared/lib/format";
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
import { KpiCard } from "@/shared/ui/KpiCard";
import { usePartnerDriversList } from "../api/drivers.queries";

interface PartnerDriversListPageProps {
  pendingOnly?: boolean;
}

export function PartnerDriversListPage({ pendingOnly }: PartnerDriversListPageProps) {
  const router = useRouter();
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

  const kpiOnline = rows.filter(d => d.availability === "online").length;
  const kpiInTrip = rows.filter(d => d.availability === "on_trip").length;
  const kpiOffline = rows.filter(d => d.availability === "offline").length;

  const columns: Column<Driver>[] = [
    {
      id: "name",
      header: "Nom",
      className: "min-w-[200px]",
      cell: (d) => (
        <div>
          <Link
            href={`/partner/drivers/${d.id}`}
            className="font-medium text-foreground hover:text-teal"
          >
            {d.first_name} {d.last_name}
          </Link>
        </div>
      ),
      exportValue: (d) => `${d.first_name} ${d.last_name}`,
      sortKey: (d) => `${d.last_name} ${d.first_name}`.toLowerCase(),
    },
    {
      id: "phone",
      header: "Téléphone",
      cell: (d) => d.phone,
      exportValue: (d) => d.phone,
    },
    {
      id: "zone",
      header: "Zone",
      cell: (d) => d.zone,
      exportValue: (d) => d.zone,
      sortKey: (d) => d.zone ?? "",
    },
    {
      id: "vehicle",
      header: "Véhicule affecté",
      cell: (d) => d.vehicle_label ?? "—",
      exportValue: (d) => d.vehicle_label ?? "",
    },
    {
      id: "category",
      header: "Catégorie",
      cell: (d) => d.ride_category_code ?? "—",
      exportValue: (d) => d.ride_category_code ?? "",
    },
    {
      id: "created",
      header: "Date création",
      cell: (d) => formatDate(d.created_at),
      exportValue: (d) => d.created_at ?? "",
      sortKey: (d) => d.created_at ?? "",
    },
    {
      id: "account",
      header: "Statut",
      cell: (d) => <AccountStatusPill status={d.account_status} />,
      exportValue: (d) => getDriverAccountStatusLabel(d.account_status),
    },
    {
      id: "availability",
      header: "Disponibilité",
      cell: (d) => <AvailabilityPill status={d.availability} />,
      exportValue: (d) => getDriverAvailabilityLabel(d.availability),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (d) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            className="px-2 py-1 text-xs"
            onClick={() => router.push(`/partner/drivers/${d.id}`)}
          >
            Voir
          </Button>
          <Button
            variant="ghost"
            className="px-2 py-1 text-xs"
            onClick={() => router.push(`/partner/drivers/${d.id}?edit=1`)}
          >
            Modifier
          </Button>
          <Button
            variant="ghost"
            className={`px-2 py-1 text-xs ${d.suspended ? "text-teal" : "text-red-600"}`}
            onClick={() => {
              notificationService.success(
                d.suspended
                  ? "Chauffeur réactivé (à brancher sur l'API)"
                  : "Chauffeur suspendu (à brancher sur l'API)"
              );
            }}
          >
            {d.suspended ? "Réactiver" : "Suspendre"}
          </Button>
        </div>
      ),
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
            <Link href="/partner/fleet/new">
              <Button>Nouveau chauffeur + véhicule</Button>
            </Link>
          ) : undefined
        }
      />

      {!pendingOnly && (meta || isLoading) && (
        <div className="mb-5 grid gap-3 grid-cols-2 sm:grid-cols-4">
          <KpiCard index={0} label="Total chauffeurs" value={String(meta?.total ?? 0)} isLoading={isLoading} />
          <KpiCard index={1} label="En ligne" value={String(kpiOnline)} isLoading={isLoading} />
          <KpiCard index={2} label="En course" value={String(kpiInTrip)} isLoading={isLoading} />
          <KpiCard index={3} label="Hors ligne" value={String(kpiOffline)} isLoading={isLoading} />
        </div>
      )}

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
