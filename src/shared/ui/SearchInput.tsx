interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Rechercher…",
  className = "",
}: SearchInputProps) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full max-w-xs rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none ring-teal/30 focus:ring-2 md:max-w-sm ${className}`}
    />
  );
}
