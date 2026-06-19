"use client";

import { DataTable, type Column } from "@/shared/ui/DataTable";
import type { DispatchTrafficZoneProfile } from "../api/dispatchConfig.api.types";
import { DISPATCH_FIELD_HELP } from "../api/dispatchConfig.help";
import { WEEKDAY_LABELS } from "../api/pricingConfig.help";

const cellInput =
  "w-full min-w-[4.5rem] rounded-lg border border-border bg-surface px-2 py-1.5 text-xs outline-none ring-teal/30 focus:ring-2";

function DaysPicker({
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
    <div className="flex flex-wrap gap-1" title={DISPATCH_FIELD_HELP.zoneDays.help}>
      {WEEKDAY_LABELS.map((name, day) => (
        <button
          key={day}
          type="button"
          aria-label={`${label} — ${name}`}
          onClick={() => toggle(day)}
          className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
            active.has(day)
              ? "bg-teal/15 text-teal-dark ring-1 ring-teal/30"
              : "bg-canvas text-muted ring-1 ring-border"
          }`}
        >
          {name}
        </button>
      ))}
    </div>
  );
}

interface DispatchZoneProfilesTableProps {
  profiles: DispatchTrafficZoneProfile[];
  onChange: (profiles: DispatchTrafficZoneProfile[]) => void;
}

export function DispatchZoneProfilesTable({
  profiles,
  onChange,
}: DispatchZoneProfilesTableProps) {
  const updateAt = (index: number, next: DispatchTrafficZoneProfile) => {
    const list = [...profiles];
    list[index] = next;
    onChange(list);
  };

  const columns: Column<DispatchTrafficZoneProfile & { _index: number }>[] = [
    {
      id: "label",
      header: "Profil",
      cell: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.label}</p>
          {row.id ? <p className="text-[10px] text-muted">{row.id}</p> : null}
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
          title={DISPATCH_FIELD_HELP.zoneCode.help}
        />
      ),
      exportValue: (row) => row.zoneCode ?? "Toutes",
    },
    {
      id: "days",
      header: "Jours",
      cell: (row) => (
        <DaysPicker
          days={row.days}
          label={row.label}
          onChange={(days) => updateAt(row._index, { ...row, days })}
        />
      ),
      exportValue: (row) =>
        row.days?.length ? row.days.map((d) => WEEKDAY_LABELS[d]).join(", ") : "Tous",
    },
    {
      id: "hours",
      header: "Heures",
      className: "tabular-nums",
      cell: (row) => <span className="text-muted">{row.hours.join(", ")}h</span>,
      exportValue: (row) => row.hours.join(", "),
    },
    {
      id: "eta",
      header: "ETA ×",
      cell: (row) => (
        <input
          type="number"
          step={0.05}
          min={1}
          value={row.etaMultiplier ?? ""}
          onChange={(e) =>
            updateAt(row._index, { ...row, etaMultiplier: Number(e.target.value) })
          }
          className={cellInput}
        />
      ),
      exportValue: (row) => String(row.etaMultiplier ?? ""),
    },
    {
      id: "radius",
      header: "Rayon +",
      cell: (row) => (
        <input
          type="number"
          step={0.1}
          min={0}
          value={row.radiusBonusKm ?? ""}
          onChange={(e) =>
            updateAt(row._index, { ...row, radiusBonusKm: Number(e.target.value) })
          }
          className={cellInput}
        />
      ),
      exportValue: (row) => String(row.radiusBonusKm ?? ""),
    },
  ];

  const rows = profiles.map((profile, _index) => ({ ...profile, _index }));

  return (
    <DataTable
      columns={columns}
      data={rows}
      rowKey={(row) => row.id ?? `${row.zoneCode ?? "all"}-${row._index}`}
      pagination={false}
      exportFileName="profils-trafic-dispatch"
      emptyTitle="Aucun profil trafic"
      emptyDescription="Les profils zone/heure apparaîtront ici une fois chargés."
    />
  );
}
