"use client";

import { useState, useRef, useEffect } from "react";

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { code: "CI", name: "Côte d'Ivoire", dialCode: "+225", flag: "🇨🇮" },
  { code: "SN", name: "Sénégal", dialCode: "+221", flag: "🇸🇳" },
  { code: "BF", name: "Burkina Faso", dialCode: "+226", flag: "🇧🇫" },
  { code: "ML", name: "Mali", dialCode: "+223", flag: "🇲🇱" },
  { code: "GH", name: "Ghana", dialCode: "+233", flag: "🇬🇭" },
  { code: "GN", name: "Guinée", dialCode: "+224", flag: "🇬🇳" },
  { code: "TG", name: "Togo", dialCode: "+228", flag: "🇹🇬" },
  { code: "BJ", name: "Bénin", dialCode: "+229", flag: "🇧🇯" },
  { code: "NE", name: "Niger", dialCode: "+227", flag: "🇳🇪" },
  { code: "LR", name: "Liberia", dialCode: "+231", flag: "🇱🇷" },
  { code: "SL", name: "Sierra Leone", dialCode: "+232", flag: "🇸🇱" },
  { code: "MR", name: "Mauritanie", dialCode: "+222", flag: "🇲🇷" },
  { code: "CM", name: "Cameroun", dialCode: "+237", flag: "🇨🇲" },
  { code: "NG", name: "Nigeria", dialCode: "+234", flag: "🇳🇬" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
];

interface PhoneInputProps {
  value: string;
  onChange: (phone: string) => void;
  required?: boolean;
  disabled?: boolean;
}

function extractDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

function parsePhone(full: string): { countryCode: string; national: string } {
  const country = COUNTRIES.find(
    (c) => full.startsWith(c.dialCode) && full !== c.dialCode
  );
  if (country) {
    return {
      countryCode: country.code,
      national: full.slice(country.dialCode.length),
    };
  }
  const digits = extractDigits(full);
  if (digits.startsWith("225")) return { countryCode: "CI", national: digits.slice(3) };
  return { countryCode: "CI", national: digits };
}

export function PhoneInput({ value, onChange, required, disabled }: PhoneInputProps) {
  const { countryCode, national } = parsePhone(value);
  const [country, setCountry] = useState<Country>(
    COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0]
  );
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // À l'ouverture : positionne l'index actif sur le pays sélectionné et y place le focus.
  useEffect(() => {
    if (!open) return;
    const selected = COUNTRIES.findIndex((c) => c.code === country.code);
    const initial = selected >= 0 ? selected : 0;
    setActiveIndex(initial);
    const id = window.requestAnimationFrame(() => {
      optionRefs.current[initial]?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [open, country.code]);

  useEffect(() => {
    const { countryCode: detected } = parsePhone(value);
    const found = COUNTRIES.find((c) => c.code === detected);
    if (found && found.code !== country.code) {
      setCountry(found);
    }
  }, [value]);

  const handleCountrySelect = (c: Country) => {
    setCountry(c);
    onChange(c.dialCode + national);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const closeAndRefocus = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const next = (activeIndex + 1) % COUNTRIES.length;
        setActiveIndex(next);
        optionRefs.current[next]?.focus();
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const prev = (activeIndex - 1 + COUNTRIES.length) % COUNTRIES.length;
        setActiveIndex(prev);
        optionRefs.current[prev]?.focus();
        break;
      }
      case "Home": {
        e.preventDefault();
        setActiveIndex(0);
        optionRefs.current[0]?.focus();
        break;
      }
      case "End": {
        e.preventDefault();
        const last = COUNTRIES.length - 1;
        setActiveIndex(last);
        optionRefs.current[last]?.focus();
        break;
      }
      case "Enter":
      case " ": {
        e.preventDefault();
        handleCountrySelect(COUNTRIES[activeIndex]);
        break;
      }
      case "Escape": {
        e.preventDefault();
        closeAndRefocus();
        break;
      }
      case "Tab":
        setOpen(false);
        break;
    }
  };

  const handleNationalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = extractDigits(e.target.value);
    if (country.code === "CI" && digits.length > 10) digits = digits.slice(0, 10);
    onChange(country.dialCode + digits);
  };

  return (
    <div ref={ref} className="relative flex">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Indicatif pays : ${country.name} (${country.dialCode})`}
        className="inline-flex items-center gap-1.5 rounded-l-lg border border-r-0 border-border bg-surface px-3 py-2.5 text-sm hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-teal/30"
      >
        <span className="text-base leading-none">{country.flag}</span>
        <span className="text-sm font-medium text-foreground">{country.dialCode}</span>
        <svg
          className={`h-3.5 w-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <input
        type="tel"
        value={national}
        onChange={handleNationalChange}
        placeholder="07 00 00 00 00"
        required={required}
        disabled={disabled}
        className="w-full rounded-r-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
      />

      {open && (
        <div
          ref={listRef}
          role="listbox"
          aria-label="Liste des pays"
          aria-activedescendant={`phone-country-${COUNTRIES[activeIndex]?.code}`}
          onKeyDown={handleListKeyDown}
          className="absolute left-0 top-full z-50 mt-1 max-h-60 w-64 overflow-auto rounded-lg border border-border bg-white py-1 shadow-lg dark:bg-surface"
        >
          {COUNTRIES.map((c, i) => {
            const isSelected = c.code === country.code;
            return (
              <button
                key={c.code}
                id={`phone-country-${c.code}`}
                ref={(el) => {
                  optionRefs.current[i] = el;
                }}
                type="button"
                role="option"
                aria-selected={isSelected}
                tabIndex={i === activeIndex ? 0 : -1}
                onClick={() => handleCountrySelect(c)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 focus:bg-slate-50 focus:outline-none dark:hover:bg-slate-700 dark:focus:bg-slate-700 ${
                  isSelected ? "bg-teal/10 font-medium" : ""
                }`}
              >
                <span className="text-base">{c.flag}</span>
                <span className="flex-1 text-left text-foreground">{c.name}</span>
                <span className="text-muted">{c.dialCode}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
