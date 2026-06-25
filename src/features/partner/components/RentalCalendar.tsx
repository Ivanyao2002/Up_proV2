"use client";

import { useMemo, useState } from "react";
import type {
  RentalBlock,
  RentalReservedPeriod,
} from "../api/rentalAvailability.service";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

type DayState = "free" | "blocked" | "reserved";

/** Compare une date (Y-M-D) à un intervalle [start, end] inclusif, en ignorant l'heure. */
function inRange(day: Date, start?: string, end?: string): boolean {
  if (!start || !end) return false;
  const d = day.getTime();
  const s = new Date(start).setHours(0, 0, 0, 0);
  const e = new Date(end).setHours(23, 59, 59, 999);
  return d >= s && d <= e;
}

export function RentalCalendar({
  blocks,
  reservations,
}: {
  blocks: RentalBlock[];
  reservations: RentalReservedPeriod[];
}) {
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    // getDay(): 0=dim..6=sam → on veut lundi=0.
    const lead = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const result: { date: Date | null; state: DayState }[] = [];
    for (let i = 0; i < lead; i++) result.push({ date: null, state: "free" });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(view.year, view.month, d);
      let state: DayState = "free";
      if (reservations.some((r) => inRange(date, r.start_date, r.end_date))) {
        state = "reserved";
      } else if (blocks.some((b) => inRange(date, b.start_date, b.end_date))) {
        state = "blocked";
      }
      result.push({ date, state });
    }
    return result;
  }, [view, blocks, reservations]);

  const prev = () =>
    setView((v) =>
      v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 }
    );
  const next = () =>
    setView((v) =>
      v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 }
    );

  const stateClass: Record<DayState, string> = {
    free: "bg-surface text-foreground",
    blocked: "bg-amber-100 text-amber-800",
    reserved: "bg-blue-100 text-blue-800",
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={prev}
          className="rounded-lg border border-border px-3 py-1 text-sm hover:bg-muted/10"
        >
          ←
        </button>
        <span className="text-sm font-semibold">
          {MONTHS[view.month]} {view.year}
        </span>
        <button
          type="button"
          onClick={next}
          className="rounded-lg border border-border px-3 py-1 text-sm hover:bg-muted/10"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 font-medium">
            {w}
          </div>
        ))}
        {cells.map((c, i) => (
          <div
            key={i}
            className={`flex h-10 items-center justify-center rounded-md text-sm ${
              c.date ? stateClass[c.state] : ""
            }`}
          >
            {c.date?.getDate() ?? ""}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
        <Legend className="bg-blue-100" label="Réservé" />
        <Legend className="bg-amber-100" label="Bloqué (maintenance/indispo)" />
        <Legend className="bg-surface border border-border" label="Disponible" />
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded ${className}`} />
      {label}
    </span>
  );
}
