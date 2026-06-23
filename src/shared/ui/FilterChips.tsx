import { FILTER_CHIP_CLASS } from "./filterControlStyles";

const SIZE_CLASSES = {
  md: FILTER_CHIP_CLASS,
  sm: "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150",
} as const;

interface FilterChipsProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: FilterChipsProps<T>) {
  const base = SIZE_CLASSES[size];
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`${base} ${
              active
                ? "border border-teal bg-teal text-white"
                : "border border-border bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
