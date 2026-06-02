interface FilterChipsProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: FilterChipsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
              active
                ? "bg-teal text-white"
                : "bg-surface text-muted border border-border hover:bg-canvas hover:text-navy"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
