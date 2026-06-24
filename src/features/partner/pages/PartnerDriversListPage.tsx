"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { formatDate } from "@/shared/lib/format";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { AccountStatusPill, AvailabilityPill } from "@/shared/ui/DriverPills";
import { Button } from "@/shared/ui/Button";
import { BulkActionBar } from "@/shared/ui/BulkActionBar";
import { notificationService } from "@/core/http/notificationService";
import {
  driverBulkStatusMessage,
  driverBulkSuspendMessage,
  driverBulkReactivateMessage,
} from "@/shared/lib/bulkLabels";
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
import {
  usePartnerDriversList,
  usePartnerDriverOnTripCount,
} from "../api/drivers.queries";
import { partnerDriversService } from "../api/drivers.service";
import { PartnerDriversFiltersPanel } from "../components/PartnerDriversFiltersPanel";

interface PartnerDriversListPageProps {
  pendingOnly?: boolean;
}

export function PartnerDriversListPage({ pendingOnly }: PartnerDriversListPageProps) {
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [accountStatusFilter, setAccountStatusFilter] = useState<Driver["account_status"] | "all">(
    pendingOnly ? "pending" : "all"
  );
  const [availabilityFilter, setAvailabilityFilter] = useState<Driver["availability"] | "all">(
    "all"
  );

  const effectiveAccountStatus: Driver["account_status"] | "all" = pendingOnly
    ? "pending"
    : accountStatusFilter;

  const table = useServerTableState(
    [effectiveAccountStatus, availabilityFilter, pendingOnly],
    {
      account_status:
        effectiveAccountStatus !== "all" ? effectiveAccountStatus : undefined,
      availability: availabilityFilter !== "all" ? availabilityFilter : undefined,
    }
  );

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      ...(!pendingOnly
        ? [
            {
              value: accountStatusFilter,
              defaultValue: "all" as const,
              reset: () => setAccountStatusFilter("all"),
            },
          ]
        : []),
      {
        value: availabilityFilter,
        defaultValue: "all" as const,
        reset: () => setAvailabilityFilter("all"),
      },
    ],
  });

  const { data, isLoading, isError, refetch } = usePartnerDriversList(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const selectedIds = Array.from(selected).map(String);
  const selectedDrivers = rows.filter((driver) => selected.has(driver.id));

  // Compteurs flotte : total/online viennent de `counters` (réponse liste) ; on_trip via 1 appel.
  // offline est déduit (total − online − on_trip). Repli sur la page courante si indisponible.
  const counters = data?.counters;
  const { on_trip: onTripCount } = usePartnerDriverOnTripCount();
  const kpiTotal = counters?.total ?? meta?.total ?? 0;
  const kpiOnline =
    counters?.online ?? rows.filter((d) => d.availability === "online").length;
  const kpiInTrip =
    onTripCount ?? rows.filter((d) => d.availability === "on_trip").length;
  const kpiOffline =
    counters?.total != null && counters?.online != null && onTripCount != null
      ? Math.max(0, counters.total - counters.online - onTripCount)
      : rows.filter((d) => d.availability === "offline").length;

  const runBulkAction = async (
    action: (driverId: string) => Promise<void>,
    successMessage: string
  ) => {
    if (selectedIds.length === 0) return;
    setBulkBusy(true);
    try {
      await Promise.all(selectedIds.map((id) => action(id)));
      notificationService.success(successMessage);
      setSelected(new Set());
      await refetch();
    } catch {
      notificationService.error("Action impossible sur la sélection.");
    } finally {
      setBulkBusy(false);
    }
  };

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
      id: "vehicle",
      header: "Véhicule affecté",
      className: "min-w-[180px]",
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
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les chauffeurs.</p>;
  }

  const canSetOnline = selectedDrivers.some(
    (driver) =>
      !driver.suspended &&
      driver.account_status !== "suspended" &&
      driver.account_status !== "banned" &&
      driver.availability !== "online"
  );
  const canSetOffline = selectedDrivers.some(
    (driver) =>
      driver.availability === "online" || driver.availability === "on_trip"
  );
  const canSuspend = selectedDrivers.some(
    (driver) =>
      !driver.suspended &&
      driver.account_status !== "suspended" &&
      driver.account_status !== "banned"
  );
  const canReactivate = selectedDrivers.some(
    (driver) => driver.suspended || driver.account_status === "suspended"
  );

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
          <KpiCard index={0} label="Total chauffeurs" value={String(kpiTotal)} isLoading={isLoading} />
          <KpiCard index={1} label="En ligne" value={String(kpiOnline)} isLoading={isLoading} />
          <KpiCard index={2} label="En course" value={String(kpiInTrip)} isLoading={isLoading} />
          <KpiCard index={3} label="Hors ligne" value={String(kpiOffline)} isLoading={isLoading} />
        </div>
      )}

      <PartnerDriversFiltersPanel
        showAccountStatusFilters={!pendingOnly}
        accountStatusFilter={accountStatusFilter}
        onAccountStatusFilterChange={setAccountStatusFilter}
        availabilityFilter={availabilityFilter}
        onAvailabilityFilterChange={setAvailabilityFilter}
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Nom, téléphone, zone…"
        totalLabel={
          meta
            ? `${meta.total} chauffeur${meta.total > 1 ? "s" : ""} dans votre flotte`
            : undefined
        }
        hasActiveFilters={hasActiveFilters}
        onResetAll={resetAll}
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
            ...(canSetOnline
              ? [
                  {
                    label: "Mettre en ligne",
                    disabled: bulkBusy,
                    onClick: () =>
                      void runBulkAction(
                        (id) => partnerDriversService.setAvailability(id, "online"),
                        driverBulkStatusMessage(selected.size, "online")
                      ),
                  },
                ]
              : []),
            ...(canSetOffline
              ? [
                  {
                    label: "Mettre hors ligne",
                    variant: "secondary" as const,
                    disabled: bulkBusy,
                    onClick: () =>
                      void runBulkAction(
                        (id) => partnerDriversService.setAvailability(id, "offline"),
                        driverBulkStatusMessage(selected.size, "offline")
                      ),
                  },
                ]
              : []),
            ...(canSuspend
              ? [
                  {
                    label: "Suspendre",
                    variant: "secondary" as const,
                    disabled: bulkBusy,
                    onClick: () =>
                      void runBulkAction(
                        (id) => partnerDriversService.suspend(id),
                        driverBulkSuspendMessage(selected.size)
                      ),
                  },
                ]
              : []),
            ...(canReactivate
              ? [
                  {
                    label: "Réactiver",
                    disabled: bulkBusy,
                    onClick: () =>
                      void runBulkAction(
                        (id) => partnerDriversService.reactivate(id),
                        driverBulkReactivateMessage(selected.size)
                      ),
                  },
                ]
              : []),
          ]}
        />
      )}
    </div>
  );
}
