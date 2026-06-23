/** Variantes sombres réellement distinctes */
export type KpiVariant = "midnight" | "deep-teal" | "slate" | "charcoal";

/** Anciens noms encore utilisés en appel → variante sombre équivalente */
export type KpiVariantInput = KpiVariant | "navy" | "teal";

/** Cycle par défaut — variantes sombres uniquement */
export const KPI_DARK_VARIANTS: KpiVariant[] = [
  "midnight",
  "deep-teal",
  "slate",
  "charcoal",
];

const VARIANT_ALIASES: Record<"navy" | "teal", KpiVariant> = {
  navy: "midnight",
  teal: "deep-teal",
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
};

function normalizeVariant(variant: KpiVariantInput): KpiVariant {
  return variant === "navy" || variant === "teal"
    ? VARIANT_ALIASES[variant]
    : variant;
}

function resolveVariant(
  label: string,
  variant?: KpiVariantInput,
  index?: number
): KpiVariant {
  if (variant) {
    return normalizeVariant(variant);
  }
  if (index !== undefined) {
    return KPI_DARK_VARIANTS[index % KPI_DARK_VARIANTS.length];
  }
  const hash = [...label].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return KPI_DARK_VARIANTS[hash % KPI_DARK_VARIANTS.length];
}

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
  className?: string;
  variant?: KpiVariantInput;
  index?: number;
  compact?: boolean;
  /** Affiche un skeleton animé à la place de la valeur */
  isLoading?: boolean;
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
  isLoading = false,
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
        {isLoading ? (
          <div
            className={`${compact ? "mt-1.5 h-5 w-20" : "mt-2 h-8 w-28"} animate-pulse rounded-md bg-white/20`}
          />
        ) : (
          <p
            className={`kpi-card__value font-semibold tabular-nums tracking-tight ${compact ? "mt-1.5" : "mt-2 text-3xl"} ${styles.value}`}
          >
            {value}
          </p>
        )}
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
