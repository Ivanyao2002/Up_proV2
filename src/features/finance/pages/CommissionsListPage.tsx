"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { formatFCFA } from "@/shared/lib/format";
import type { CommissionRow } from "../api/commissions.service";
import { useCommissionsList } from "../api/commissions.queries";

export function CommissionsListPage() {
  const { data, isLoading, isError } = useCommissionsList();

  const columns: Column<CommissionRow>[] = [
    {
      id: "period",
      header: "Période",
      cell: (c) => (
        <div>
          <p className="font-medium text-navy">{c.period_label}</p>
          <p className="text-xs text-muted">{c.id}</p>
        </div>
      ),
      exportValue: (c) => c.period_label,
    },
    {
      id: "franchise",
      header: "Franchise",
      cell: (c) => c.franchise_name,
      exportValue: (c) => c.franchise_name,
    },
    {
      id: "trips",
      header: "Courses",
      className: "tabular-nums",
      cell: (c) => c.trips_count.toLocaleString("fr-CI"),
      exportValue: (c) => c.trips_count,
    },
    {
      id: "gross",
      header: "CA brut",
      className: "tabular-nums",
      cell: (c) => formatFCFA(c.gross_fcfa),
      exportValue: (c) => c.gross_fcfa,
    },
    {
      id: "commission",
      header: "Commission",
      className: "tabular-nums",
      cell: (c) => (
        <span className="font-medium text-teal-dark">
          {formatFCFA(c.commission_fcfa)} ({c.rate_pct} %)
        </span>
      ),
      exportValue: (c) => c.commission_fcfa,
    },
    {
      id: "status",
      header: "Statut",
      cell: (c) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            c.status === "paid"
              ? "bg-teal/15 text-teal-dark"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {c.status === "paid" ? "Versée" : "En attente"}
        </span>
      ),
      exportValue: (c) => (c.status === "paid" ? "Versée" : "En attente"),
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les commissions.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Commissions" breadcrumb={["Admin", "Finance"]} />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        exportFileName="commissions"
        emptyTitle="Aucune commission"
      />
    </div>
  );
}
