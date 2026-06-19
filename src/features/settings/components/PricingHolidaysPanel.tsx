"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { EmptyState } from "@/shared/ui/EmptyState";
import { formatDate } from "@/shared/lib/format";
import type { PricingCountryCode } from "../api/pricingConfig.api.types";
import type { AdminHoliday } from "../api/holidays.api.types";
import {
  useCreateHoliday,
  useDeactivateHoliday,
  useHolidays,
  usePatchHoliday,
} from "../api/holidays.queries";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none ring-teal/30 focus:ring-2";

interface PricingHolidaysPanelProps {
  countryCode: PricingCountryCode;
}

export function PricingHolidaysPanel({ countryCode }: PricingHolidaysPanelProps) {
  const { data = [], isLoading, isError } = useHolidays(countryCode);
  const create = useCreateHoliday(countryCode);
  const patch = usePatchHoliday(countryCode);
  const deactivate = useDeactivateHoliday(countryCode);

  const [date, setDate] = useState("");
  const [label, setLabel] = useState("");
  const [coefficient, setCoefficient] = useState(1.25);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleCreate = () => {
    if (!date || !label.trim()) return;
    create.mutate(
      { countryCode, date, label: label.trim(), coefficient },
      {
        onSuccess: () => {
          setDate("");
          setLabel("");
          setCoefficient(1.25);
        },
      }
    );
  };

  const columns: Column<AdminHoliday>[] = [
    {
      id: "date",
      header: "Date",
      cell: (row) => <span className="tabular-nums text-foreground">{formatDate(row.date)}</span>,
      exportValue: (row) => row.date,
    },
    {
      id: "label",
      header: "Libellé",
      cell: (row) => (
        <input
          key={`${row.id}-${row.label}`}
          defaultValue={row.label}
          disabled={busyId === row.id}
          onBlur={(e) => {
            const next = e.target.value.trim();
            if (!next || next === row.label) return;
            setBusyId(row.id);
            patch.mutate(
              { id: row.id, payload: { label: next } },
              { onSettled: () => setBusyId(null) }
            );
          }}
          className={inputClass}
          aria-label={`Libellé ${row.label}`}
        />
      ),
      exportValue: (row) => row.label,
    },
    {
      id: "coefficient",
      header: "Coefficient",
      cell: (row) => (
        <input
          key={`${row.id}-${row.coefficient}`}
          type="number"
          step={0.05}
          min={1}
          defaultValue={row.coefficient}
          disabled={busyId === row.id}
          onBlur={(e) => {
            const next = Number(e.target.value);
            if (!Number.isFinite(next) || next === row.coefficient) return;
            setBusyId(row.id);
            patch.mutate(
              { id: row.id, payload: { coefficient: next } },
              { onSettled: () => setBusyId(null) }
            );
          }}
          className={`${inputClass} max-w-[5rem] tabular-nums`}
          aria-label={`Coefficient ${row.label}`}
        />
      ),
      exportValue: (row) => String(row.coefficient),
    },
    {
      id: "actions",
      header: "",
      cell: (row) => (
        <Button
          type="button"
          variant="ghost"
          className="px-2 py-1 text-xs text-red-600"
          disabled={busyId === row.id || deactivate.isPending}
          onClick={() => {
            if (!confirm(`Désactiver « ${row.label} » (${formatDate(row.date)}) ?`)) return;
            setBusyId(row.id);
            deactivate.mutate(row.id, { onSettled: () => setBusyId(null) });
          }}
        >
          Désactiver
        </Button>
      ),
    },
  ];

  if (isError) {
    return (
      <EmptyState
        title="Calendrier indisponible"
        description="Les jours fériés n'ont pas pu être chargés pour ce pays."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-border bg-canvas/30 p-5">
        <p className="text-sm font-semibold text-heading">Ajouter un jour férié</p>
        <p className="mt-1 text-xs text-muted">
          Les fêtes mobiles (Aïd, Pâques…) doivent être saisies chaque année à leur date.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="text-xs font-medium text-foreground">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`${inputClass} mt-1`}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-foreground">Libellé</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex. Aïd el-Kébir"
              className={`${inputClass} mt-1`}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-foreground">Coefficient</span>
            <input
              type="number"
              step={0.05}
              min={1}
              value={coefficient}
              onChange={(e) => setCoefficient(Number(e.target.value))}
              className={`${inputClass} mt-1 tabular-nums`}
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            variant="secondary"
            disabled={create.isPending || !date || !label.trim()}
            onClick={handleCreate}
          >
            {create.isPending ? "Ajout…" : "Ajouter"}
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        pagination={false}
        exportFileName={`feries-${countryCode}`}
        emptyTitle="Aucun jour férié actif"
        emptyDescription="Ajoutez les dates fixes et les fêtes mobiles pour ce pays."
      />
    </div>
  );
}
