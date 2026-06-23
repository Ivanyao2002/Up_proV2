import { FILTER_CONTROL_CLASS } from "./filterControlStyles";
import { Spinner } from "./Spinner";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Affiche un spinner (ex. recherche réseau en cours sur réseau lent). */
  loading?: boolean;
  "aria-label"?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Rechercher…",
  className = "",
  loading = false,
  "aria-label": ariaLabel,
}: SearchInputProps) {
  return (
    <div className={`relative w-full max-w-xs md:max-w-sm ${className}`}>
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        aria-hidden="true"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className={`${FILTER_CONTROL_CLASS} w-full pl-9 pr-9`}
      />
      {loading ? (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
          <Spinner className="h-4 w-4" />
        </span>
      ) : value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Effacer la recherche"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-foreground"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
