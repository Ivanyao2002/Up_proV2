"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import type { PartnerShift } from "../api/shifts.service";
import { usePartnerShifts } from "../api/shifts.queries";

export function PartnerShiftsPage() {
  const { data, isLoading, isError } = usePartnerShifts();

  const columns: Column<PartnerShift>[] = [
    {
      id: "driver",
      header: "Chauffeur",
      cell: (s) => (
        <div>
          <p className="font-medium text-navy">{s.driver_name}</p>
          <p className="text-xs text-muted">{s.vehicle_label}</p>
        </div>
      ),
      exportValue: (s) => s.driver_name,
    },
    {
      id: "day",
      header: "Jour",
      cell: (s) => s.day_label,
      exportValue: (s) => s.day_label,
    },
    {
      id: "hours",
      header: "Horaires",
      cell: (s) => `${s.start_time} – ${s.end_time}`,
      exportValue: (s) => `${s.start_time} – ${s.end_time}`,
    },
    {
      id: "status",
      header: "Statut",
      cell: (s) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            s.status === "active"
              ? "bg-teal/15 text-teal-dark"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {s.status === "active" ? "Actif" : "Brouillon"}
        </span>
      ),
      exportValue: (s) => (s.status === "active" ? "Actif" : "Brouillon"),
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les shifts.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Planning des shifts"
        breadcrumb={["Partenaire", "Activité"]}
      />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        rowKey={(s) => s.id}
        isLoading={isLoading}
        exportFileName="shifts"
        emptyTitle="Aucun shift planifié"
      />
    </div>
  );
}
