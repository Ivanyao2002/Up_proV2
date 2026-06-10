interface SelectFilterOption<T extends string> {
  value: T;
  label: string;
}

interface SelectFilterProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: SelectFilterOption<T>[];
  /** Sélecteur plus large pour les libellés longs (ex. filtres chauffeurs). */
  wide?: boolean;
  className?: string;
}

export function SelectFilter<T extends string>({
  label,
  value,
  onChange,
  options,
  wide = false,
  className = "",
}: SelectFilterProps<T>) {
  const selectWidth = wide
    ? "min-w-[12.5rem] sm:min-w-[14rem]"
    : "min-w-[140px]";

  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={`${selectWidth} max-w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
