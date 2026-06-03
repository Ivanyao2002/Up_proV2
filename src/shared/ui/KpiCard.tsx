export type KpiVariant =
  | "navy"
  | "teal"
  | "ocean"
  | "aurora"
  | "pearl"
  | "midnight"
  | "deep-teal"
  | "slate"
  | "charcoal";

/** Cycle par défaut — variantes sombres uniquement */
export const KPI_DARK_VARIANTS: KpiVariant[] = [
  "midnight",
  "deep-teal",
  "slate",
  "charcoal",
];

/** Anciens noms → rendu sombre équivalent */
const VARIANT_ALIASES: Record<KpiVariant, KpiVariant> = {
  navy: "midnight",
  teal: "deep-teal",
  ocean: "slate",
  aurora: "charcoal",
  pearl: "charcoal",
  midnight: "midnight",
  "deep-teal": "deep-teal",
  slate: "slate",
  charcoal: "charcoal",
};

const VARIANT_STYLES: Record<
  KpiVariant,
  {
    card: string;
    pattern: string;
    label: string;
    value: string;
    hint: string;
    trend: string;
    orb: string;
  }
> = {
  midnight: {
    card: "kpi-card--midnight text-white",
    pattern: "kpi-card__pattern--rings",
    label: "text-white/65",
    value: "text-white",
    hint: "text-white/70",
    trend: "text-teal/80 font-medium",
    orb: "bg-teal/15",
  },
  "deep-teal": {
    card: "kpi-card--deep-teal text-white",
    pattern: "kpi-card__pattern--mesh",
    label: "text-white/65",
    value: "text-white",
    hint: "text-white/70",
    trend: "text-white/90 font-medium",
    orb: "bg-white/10",
  },
  slate: {
    card: "kpi-card--slate text-white",
    pattern: "kpi-card__pattern--waves",
    label: "text-white/65",
    value: "text-white",
    hint: "text-white/70",
    trend: "text-teal/80 font-medium",
    orb: "bg-teal/12",
  },
  charcoal: {
    card: "kpi-card--charcoal text-white",
    pattern: "kpi-card__pattern--mesh",
    label: "text-white/65",
    value: "text-white",
    hint: "text-white/70",
    trend: "text-white/85 font-medium",
    orb: "bg-white/8",
  },
  navy: {
    card: "kpi-card--midnight text-white",
    pattern: "kpi-card__pattern--rings",
    label: "text-white/65",
    value: "text-white",
    hint: "text-white/70",
    trend: "text-teal/80 font-medium",
    orb: "bg-teal/15",
  },
  teal: {
    card: "kpi-card--deep-teal text-white",
    pattern: "kpi-card__pattern--mesh",
    label: "text-white/65",
    value: "text-white",
    hint: "text-white/70",
    trend: "text-white/90 font-medium",
    orb: "bg-white/10",
  },
  ocean: {
    card: "kpi-card--slate text-white",
    pattern: "kpi-card__pattern--waves",
    label: "text-white/65",
    value: "text-white",
    hint: "text-white/70",
    trend: "text-teal/80 font-medium",
    orb: "bg-teal/12",
  },
  aurora: {
    card: "kpi-card--charcoal text-white",
    pattern: "kpi-card__pattern--mesh",
    label: "text-white/65",
    value: "text-white",
    hint: "text-white/70",
    trend: "text-white/85 font-medium",
    orb: "bg-white/8",
  },
  pearl: {
    card: "kpi-card--charcoal text-white",
    pattern: "kpi-card__pattern--mesh",
    label: "text-white/65",
    value: "text-white",
    hint: "text-white/70",
    trend: "text-white/85 font-medium",
    orb: "bg-white/8",
  },
};

function resolveVariant(
  label: string,
  variant?: KpiVariant,
  index?: number
): KpiVariant {
  let chosen: KpiVariant;
  if (variant) {
    chosen = VARIANT_ALIASES[variant];
  } else if (index !== undefined) {
    chosen = KPI_DARK_VARIANTS[index % KPI_DARK_VARIANTS.length];
  } else {
    const hash = [...label].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    chosen = KPI_DARK_VARIANTS[hash % KPI_DARK_VARIANTS.length];
  }
  return chosen;
}

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
  className?: string;
  variant?: KpiVariant;
  index?: number;
  compact?: boolean;
}

export function KpiCard({
  label,
  value,
  hint,
  trend,
  className = "",
  variant,
  index,
  compact = false,
}: KpiCardProps) {
  const v = resolveVariant(label, variant, index);
  const styles = VARIANT_STYLES[v];

  return (
    <div
      className={`kpi-card kpi-card__grain relative rounded-card ${compact ? "kpi-card--compact p-4 sm:p-5" : "p-6"} ${styles.card} ${className}`}
    >
      <div className={`kpi-card__pattern ${styles.pattern}`} aria-hidden />
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full blur-3xl ${styles.orb}`}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/5 blur-2xl"
        aria-hidden
      />

      <div className="relative z-[1]">
        <p
          className={`text-[11px] font-semibold uppercase tracking-wider ${styles.label}`}
        >
          {label}
        </p>
        <p
          className={`kpi-card__value font-semibold tabular-nums tracking-tight ${compact ? "mt-1.5" : "mt-2 text-3xl"} ${styles.value}`}
        >
          {value}
        </p>
        {(hint || trend) && (
          <p
            className={`text-xs leading-snug sm:text-sm ${compact ? "mt-1" : "mt-2"} ${styles.hint}`}
          >
            {trend && <span className={styles.trend}>{trend} </span>}
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
