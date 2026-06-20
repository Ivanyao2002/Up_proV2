/** Jour de début de semaine bonus — convention API : 0 = dimanche … 6 = samedi */

export const BONUS_WEEK_START_OPTIONS = [
  { value: 0, label: "Dimanche" },
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
] as const;

export type BonusWeekStartDow = (typeof BONUS_WEEK_START_OPTIONS)[number]["value"];

export function bonusWeekStartLabel(dow: number | null | undefined): string {
  if (dow == null || !Number.isInteger(dow) || dow < 0 || dow > 6) {
    return "Non configuré";
  }
  return BONUS_WEEK_START_OPTIONS.find((o) => o.value === dow)?.label ?? "—";
}

export function isValidBonusWeekStartDow(value: unknown): value is BonusWeekStartDow {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 6
  );
}

/** Fenêtre hebdo courante pour affichage comptable. */
export function formatCurrentBonusWeekRange(weekStartDow: BonusWeekStartDow): string {
  const now = new Date();
  const todayDow = now.getDay();
  let daysSinceStart = todayDow - weekStartDow;
  if (daysSinceStart < 0) daysSinceStart += 7;

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - daysSinceStart);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const fmt = new Intl.DateTimeFormat("fr-CI", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });

  return `${fmt.format(start)} → ${fmt.format(end)}`;
}
