"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import type { PartnerReport } from "../api/shifts.service";
import { usePartnerReports } from "../api/shifts.queries";

export function PartnerReportsPage() {
  const { data, isLoading, isError } = usePartnerReports();

  const columns: Column<PartnerReport>[] = [
    {
      id: "period",
      header: "Période",
      cell: (r) => (
        <div>
          <p className="font-medium text-navy">{r.period_label}</p>
          <p className="text-xs text-muted">{r.id}</p>
        </div>
      ),
      exportValue: (r) => r.period_label,
    },
    {
      id: "trips",
      header: "Courses",
      className: "tabular-nums",
      cell: (r) => r.trips_count,
      exportValue: (r) => r.trips_count,
    },
    {
      id: "revenue",
      header: "Revenus",
      className: "tabular-nums",
      cell: (r) => formatFCFA(r.revenue_fcfa),
      exportValue: (r) => r.revenue_fcfa,
    },
    {
      id: "acceptance",
      header: "Acceptation",
      className: "tabular-nums",
      cell: (r) => `${r.acceptance_rate_pct} %`,
      exportValue: (r) => r.acceptance_rate_pct,
    },
    {
      id: "generated",
      header: "Généré le",
      cell: (r) => formatDateTime(r.generated_at),
      exportValue: (r) => r.generated_at,
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les rapports.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Rapports d'activité"
        breadcrumb={["Partenaire", "Activité"]}
      />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        exportFileName="rapports-partenaire"
        emptyTitle="Aucun rapport disponible"
      />
    </div>
  );
}
