"use client";

import { DataTable, type Column } from "@/shared/ui/DataTable";
import type { PricingPeakHourProfile } from "../api/pricingConfig.api.types";
import { PRICING_FIELD_HELP, WEEKDAY_LABELS } from "../api/pricingConfig.help";

const cellInput =
  "w-full min-w-[4.5rem] rounded-lg border border-border bg-surface px-2 py-1.5 text-xs outline-none ring-teal/30 focus:ring-2";

function PeakDaysPicker({
  days,
  onChange,
  label,
}: {
  days?: number[];
  onChange: (days: number[] | undefined) => void;
  label: string;
}) {
  const allDays = [0, 1, 2, 3, 4, 5, 6];
  const isAllDays = days == null || days.length === 0;
  const active = new Set(isAllDays ? allDays : days);

  const toggle = (day: number) => {
    const current = isAllDays ? [...allDays] : [...(days ?? [])];
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort((a, b) => a - b);
    onChange(next.length === 7 ? undefined : next.length === 0 ? undefined : next);
  };

  return (
    <div className="flex flex-wrap gap-1" title={PRICING_FIELD_HELP.peakDays.help}>
      {WEEKDAY_LABELS.map((name, day) => {
        const isOn = active.has(day);
        return (
          <button
            key={day}
            type="button"
            aria-label={`${label} — ${name}`}
            onClick={() => toggle(day)}
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
              isOn
                ? "bg-teal/15 text-teal-dark ring-1 ring-teal/30"
                : "bg-canvas text-muted ring-1 ring-border"
            }`}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}

interface PeakProfilesTableProps {
  profiles: PricingPeakHourProfile[];
  onChange: (profiles: PricingPeakHourProfile[]) => void;
}

export function PeakProfilesTable({ profiles, onChange }: PeakProfilesTableProps) {
  const updateAt = (index: number, next: PricingPeakHourProfile) => {
    const list = [...profiles];
    list[index] = next;
    onChange(list);
  };

  const columns: Column<PricingPeakHourProfile & { _index: number }>[] = [
    {
      id: "label",
      header: "Profil",
      cell: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.label}</p>
          <p className="text-[10px] text-muted">{row.id}</p>
        </div>
      ),
      exportValue: (row) => row.label,
    },
    {
      id: "zone",
      header: "Zone",
      cell: (row) => (
        <input
          value={row.zoneCode ?? ""}
          onChange={(e) =>
            updateAt(row._index, {
              ...row,
              zoneCode: e.target.value.trim() === "" ? undefined : e.target.value.toUpperCase(),
            })
          }
          placeholder="Toutes"
          className={cellInput}
          title={PRICING_FIELD_HELP.peakZoneCode.help}
          aria-label={`Zone ${row.label}`}
        />
      ),
      exportValue: (row) => row.zoneCode ?? "Toutes",
    },
    {
      id: "days",
      header: "Jours",
      cell: (row) => (
        <PeakDaysPicker
          days={row.days}
          label={row.label}
          onChange={(days) => updateAt(row._index, { ...row, days })}
        />
      ),
      exportValue: (row) =>
        row.days?.length
          ? row.days.map((d) => WEEKDAY_LABELS[d]).join(", ")
          : "Tous",
    },
    {
      id: "hours",
      header: "Heures",
      className: "tabular-nums",
      cell: (row) => <span className="text-muted">{row.hours.join(", ")}h</span>,
      exportValue: (row) => row.hours.join(", "),
    },
    {
      id: "traffic",
      header: "Trafic",
      cell: (row) => (
        <input
          value={row.trafficLevel ?? ""}
          onChange={(e) => updateAt(row._index, { ...row, trafficLevel: e.target.value })}
          className={cellInput}
          title={PRICING_FIELD_HELP.peakTrafficLevel.help}
          aria-label={`Trafic ${row.label}`}
        />
      ),
      exportValue: (row) => row.trafficLevel ?? "",
    },
    {
      id: "duration",
      header: "Durée ×",
      cell: (row) => (
        <input
          type="number"
          step={0.05}
          value={row.durationMultiplier ?? ""}
          onChange={(e) =>
            updateAt(row._index, {
              ...row,
              durationMultiplier: Number(e.target.value),
            })
          }
          className={cellInput}
          title={PRICING_FIELD_HELP.peakDurationMult.help}
          aria-label={`Durée ${row.label}`}
        />
      ),
      exportValue: (row) => row.durationMultiplier ?? "",
    },
    {
      id: "price",
      header: "Prix ×",
      cell: (row) => (
        <input
          type="number"
          step={0.05}
          value={row.priceMultiplier ?? ""}
          onChange={(e) =>
            updateAt(row._index, {
              ...row,
              priceMultiplier: e.target.value === "" ? null : Number(e.target.value),
            })
          }
          className={cellInput}
          placeholder="auto"
          title={PRICING_FIELD_HELP.peakPriceMult.help}
          aria-label={`Prix ${row.label}`}
        />
      ),
      exportValue: (row) => row.priceMultiplier ?? "",
    },
  ];

  const rows = profiles.map((profile, _index) => ({ ...profile, _index }));

  return (
    <DataTable
      columns={columns}
      data={rows}
      rowKey={(row) => row.id}
      pagination={false}
      exportFileName="profils-pointe"
      emptyTitle="Aucun profil horaire"
      emptyDescription="Les profils de pointe apparaîtront ici une fois chargés."
    />
  );
}
