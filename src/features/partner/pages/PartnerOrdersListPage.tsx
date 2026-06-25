"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { StatusPill } from "@/shared/ui/StatusPill";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { getTripStatusLabel, STATUS_FILTER_OPTIONS } from "@/shared/lib/tripLabels";
import { getPaymentLabel, getPaymentStatusLabel } from "@/shared/lib/paymentLabels";
import { useDateRangeFilter } from "@/shared/hooks/useDateRangeFilter";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import { KpiCard } from "@/shared/ui/KpiCard";
import { useScope } from "@/core/auth/useScope";
import type { TripStatus } from "@/shared/types";
import type { PartnerBooking } from "../api/bookings.service";
import { usePartnerOrdersList } from "../api/orders.queries";
import { partnerOrdersService } from "../api/orders.service";
import { PartnerListFiltersPanel } from "../components/PartnerListFiltersPanel";

export function PartnerOrdersListPage() {
  const { ownerId } = useScope();
  const [statusFilter, setStatusFilter] = useState<TripStatus | "all">("all");

  const dateRange = useDateRangeFilter({ defaultPreset: "7d" });
  const table = useServerTableState([statusFilter, dateRange.dateFrom, dateRange.dateTo], {
    status: statusFilter !== "all" ? statusFilter : undefined,
    ...dateRange.listParams,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
      dateRange.resetField,
    ],
  });

  const { data, isLoading, isError } = usePartnerOrdersList(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<PartnerBooking>[] = [
    {
      id: "ref",
      header: "Réf.",
      sortField: "ref",
      cell: (b) => (
        <Link
          href={`/partner/orders/${b.id}`}
          className="font-medium text-foreground hover:text-teal"
        >
          {b.ref}
        </Link>
      ),
      exportValue: (b) => b.ref,
    },
    {
      id: "route",
      header: "Trajet",
      cell: (b) => (
        <div className="min-w-[200px]">
          <p className="text-sm text-foreground">{b.from_label}</p>
          <p className="text-xs text-muted">→ {b.to_label}</p>
        </div>
      ),
      exportValue: (b) => `${b.from_label} → ${b.to_label}`,
    },
    {
      id: "client",
      header: "Client",
      sortField: "client_name",
      cell: (b) => (
        <div>
          <p className="text-sm">{b.client_name || "—"}</p>
          {b.client_phone && <p className="text-xs text-muted">{b.client_phone}</p>}
        </div>
      ),
      exportValue: (b) => (b.client_phone ? `${b.client_name || "—"} (${b.client_phone})` : (b.client_name || "—")),
    },
    {
      id: "driver",
      header: "Chauffeur",
      sortField: "driver_name",
      cell: (b) => b.driver_name ?? "—",
      exportValue: (b) => b.driver_name ?? "",
    },
    {
      id: "vehicle",
      header: "Véhicule",
      cell: (b) => b.vehicle_plate ?? "—",
      exportValue: (b) => b.vehicle_plate ?? "",
    },
    {
      id: "payment_status",
      header: "Paiement",
      cell: (b) => getPaymentStatusLabel(b.payment_status),
      exportValue: (b) => getPaymentStatusLabel(b.payment_status),
    },
    {
      id: "payment_method",
      header: "Mode",
      cell: (b) => (b.payment_method ? getPaymentLabel(b.payment_method) : "—"),
      exportValue: (b) => (b.payment_method ? getPaymentLabel(b.payment_method) : ""),
    },
    {
      id: "amount",
      header: "Montant",
      sortField: "amount_fcfa",
      cell: (b) => (b.amount_fcfa != null ? formatFCFA(b.amount_fcfa) : "—"),
      exportValue: (b) => (b.amount_fcfa != null ? String(b.amount_fcfa) : ""),
    },
    {
      id: "status",
      header: "Statut",
      sortField: "status",
      cell: (b) => <StatusPill status={b.status} pulse={b.status === "in_progress"} />,
      exportValue: (b) => getTripStatusLabel(b.status),
    },
    {
      id: "date",
      header: "Créée le",
      sortField: "created_at",
      cell: (b) => (
        <span className="text-xs text-muted whitespace-nowrap">
          {formatDateTime(b.created_at)}
        </span>
      ),
      exportValue: (b) => formatDateTime(b.created_at),
    },
  ];

  const allRows = data?.data ?? [];
  const counters = data?.counters;
  const kpiCompleted = counters?.completed ?? allRows.filter((b) => b.status === "completed").length;
  const kpiInProgress = counters?.in_progress ?? allRows.filter((b) => b.status === "in_progress").length;
  const kpiCancelled = counters?.cancelled ?? allRows.filter((b) => b.status === "cancelled").length;
  const kpiTotal = counters?.total ?? meta?.total ?? 0;

  // Export complet : récupère toutes les pages (au-delà de la page affichée) en
  // réutilisant les filtres courants, puis laisse le DataTable générer le fichier.
  const fetchAllOrders = async (): Promise<PartnerBooking[]> => {
    if (ownerId == null) return rows;
    const all: PartnerBooking[] = [];
    const perPage = 100;
    for (let page = 1; page <= 100; page += 1) {
      const res = await partnerOrdersService.list(ownerId, {
        ...table.listParams,
        page,
        per_page: perPage,
      });
      all.push(...res.data);
      const lastPage = res.meta?.last_page ?? page;
      if (page >= lastPage || res.data.length === 0) break;
    }
    return all;
  };

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les courses.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Courses"
        breadcrumb={["Partenaire", "Courses"]}
      />

      {(meta || isLoading) && (
        <div className="mb-5 grid gap-3 grid-cols-2 sm:grid-cols-4">
          <KpiCard index={0} label="Total courses" value={String(kpiTotal)} isLoading={isLoading} />
          <KpiCard index={1} label="En cours" value={String(kpiInProgress)} isLoading={isLoading} />
          <KpiCard index={2} label="Complétées" value={String(kpiCompleted)} isLoading={isLoading} />
          <KpiCard index={3} label="Annulées" value={String(kpiCancelled)} isLoading={isLoading} />
        </div>
      )}

      <PartnerListFiltersPanel
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOptions={STATUS_FILTER_OPTIONS}
        allStatusValue="all"
        dateRange={dateRange}
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Réf., client, adresse, chauffeur…"
        totalLabel={meta ? `${meta.total} courses enregistrées` : undefined}
        hasActiveFilters={hasActiveFilters}
        onResetAll={resetAll}
        showAllDatePreset
      />

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(b) => b.id}
        isLoading={isLoading}
        exportFileName="courses-partenaire"
        onExportAll={fetchAllOrders}
        emptyTitle="Aucune course"
        emptyDescription="Les courses de votre flotte apparaîtront ici."
        pagination={false}
        serverPagination={serverPaginationFromMeta(
          meta,
          table.setPage,
          table.setPageSize,
          {
            sortBy: table.sortBy,
            sortOrder: table.sortOrder,
            onSortChange: table.setSort,
          }
        )}
      />
    </div>
  );
}
