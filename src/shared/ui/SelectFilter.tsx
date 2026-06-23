import { FilterField } from "./FilterField";
import { FILTER_SELECT_CLASS } from "./filterControlStyles";

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
    ? "w-full min-w-0 sm:min-w-[12.5rem] md:min-w-[14rem]"
    : "w-full min-w-0 sm:min-w-[140px]";

  return (
    <FilterField label={label} className={`${selectWidth} ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        aria-label={label}
        className={FILTER_SELECT_CLASS}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FilterField>
  );
}
