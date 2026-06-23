import type { ReportingPeriod } from "../api/reporting.types";

// ── Timezone ───────────────────────────────────────────────────────────────────

export const DEFAULT_TIMEZONE = "Africa/Abidjan";

// ── Date helpers ───────────────────────────────────────────────────────────────

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function today(): string {
  return toISO(new Date());
}

export function subDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISO(d);
}

export function firstOfMonth(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function lastOfMonth(d = new Date()): string {
  return toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function prevMonth(): { start: string; end: string } {
  const d = new Date();
  const pm = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return { start: firstOfMonth(pm), end: lastOfMonth(pm) };
}

// ── Formatters ─────────────────────────────────────────────────────────────────

const FR_MONTHS = [
  "jan.", "fév.", "mar.", "avr.", "mai", "juin",
  "juil.", "août", "sep.", "oct.", "nov.", "déc.",
];

export function formatDateLabel(iso: string): string {
  const [y, m, dd] = iso.split("-");
  return `${parseInt(dd, 10)} ${FR_MONTHS[parseInt(m, 10) - 1]} ${y}`;
}

// ── Default period ─────────────────────────────────────────────────────────────

export function defaultPeriod(): ReportingPeriod {
  return {
    date_from: firstOfMonth(),
    date_to: today(),
    timezone: DEFAULT_TIMEZONE,
  };
}

// ── Presets ────────────────────────────────────────────────────────────────────

export type Preset = {
  key: string;
  label: string;
  getPeriod: () => Pick<ReportingPeriod, "date_from" | "date_to">;
};

export const PRESETS: Preset[] = [
  { key: "today",     label: "Aujourd'hui",      getPeriod: () => ({ date_from: today(), date_to: today() }) },
  { key: "7d",        label: "7 derniers jours",  getPeriod: () => ({ date_from: subDays(6), date_to: today() }) },
  { key: "30d",       label: "30 derniers jours", getPeriod: () => ({ date_from: subDays(29), date_to: today() }) },
  { key: "month",     label: "Ce mois",           getPeriod: () => ({ date_from: firstOfMonth(), date_to: today() }) },
  { key: "prevmonth", label: "Mois précédent",    getPeriod: () => { const p = prevMonth(); return { date_from: p.start, date_to: p.end }; } },
  { key: "custom",    label: "Personnalisé",      getPeriod: () => ({ date_from: subDays(29), date_to: today() }) },
];
